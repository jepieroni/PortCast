
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRecordValidation = () => {
  const validateRecord = async (record: any) => {
    const errors: string[] = [];
    const updates: any = {};

    try {
      console.log('Starting validation for record:', record.gbl_number);
      
      // Get user's organization for translations
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        throw new Error('User not authenticated');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) {
        console.error('User organization not found for user:', user.id);
        throw new Error('User organization not found');
      }

      console.log('User organization ID:', profile.organization_id);

      // Validate required fields first
      if (!record.gbl_number) errors.push('GBL number is required');
      if (!record.shipper_last_name) errors.push('Shipper last name is required');
      
      // Check for sentinel values and invalid shipment types
      if (!record.shipment_type || record.shipment_type === 'invalid') {
        errors.push('Shipment type is required');
      } else if (!['inbound', 'outbound', 'intertheater'].includes(record.shipment_type)) {
        errors.push('Invalid shipment type');
      }

      // Check for sentinel dates and validate date fields
      if (!record.pickup_date || record.pickup_date === '1900-01-01') {
        errors.push('Pickup date is required');
      } else {
        const pickupDate = new Date(record.pickup_date);
        if (isNaN(pickupDate.getTime())) {
          errors.push('Invalid pickup date format');
        } else {
          // Check if pickup date is too old
          const today = new Date();
          const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          
          if (pickupDate < thirtyDaysAgo) {
            errors.push(`Pickup date is more than 30 days in the past (${pickupDate.toLocaleDateString()})`);
          }
        }
      }

      if (!record.rdd || record.rdd === '1900-01-01') {
        errors.push('Required delivery date is required');
      } else {
        const rddDate = new Date(record.rdd);
        if (isNaN(rddDate.getTime())) {
          errors.push('Invalid RDD format');
        }
      }

      // Validate cube requirements based on pickup date
      if (record.pickup_date && record.pickup_date !== '1900-01-01') {
        const pickupDate = new Date(record.pickup_date);
        if (!isNaN(pickupDate.getTime())) {
          const today = new Date();
          const isPickupInPast = pickupDate <= today;
          const hasEstimated = record.estimated_cube && record.estimated_cube > 0;
          const hasActual = record.actual_cube && record.actual_cube > 0;

          if (hasEstimated && hasActual) {
            errors.push('Cannot have both estimated and actual cube - choose one based on pickup date');
          } else if (!hasEstimated && !hasActual) {
            if (isPickupInPast) {
              errors.push('Actual cube is required when pickup date is today or in the past');
            } else {
              errors.push('Estimated cube is required when pickup date is in the future');
            }
          } else if (hasActual && !isPickupInPast) {
            errors.push('Cannot have actual cube when pickup date is in the future - use estimated cube instead');
          } else if (hasEstimated && isPickupInPast) {
            errors.push('Should use actual cube when pickup date is today or in the past');
          }
        }
      } else {
        // If no valid pickup date, we still need some cube value
        const hasEstimated = record.estimated_cube && record.estimated_cube > 0;
        const hasActual = record.actual_cube && record.actual_cube > 0;
        if (!hasEstimated && !hasActual) {
          errors.push('Either estimated cube or actual cube is required');
        }
      }

      // Validate and translate rate areas
      for (const field of ['raw_origin_rate_area', 'raw_destination_rate_area']) {
        const rateAreaCode = record[field];
        console.log(`Validating ${field}:`, rateAreaCode);
        
        if (!rateAreaCode) {
          errors.push(`${field.replace('raw_', '').replace('_', ' ')} is required`);
          continue;
        }

        const targetField = field.replace('raw_', '');
        
        // Check if rate area exists directly
        console.log(`Checking direct rate area match for: ${rateAreaCode}`);
        const { data: directRateArea, error: directError } = await supabase
          .from('rate_areas')
          .select('rate_area')
          .eq('rate_area', rateAreaCode)
          .maybeSingle();

        if (directError) {
          console.error('Error checking direct rate area:', directError);
        }

        if (directRateArea) {
          console.log(`Direct match found for ${rateAreaCode}`);
          updates[targetField] = directRateArea.rate_area;
          continue;
        }

        // Check for translation
        console.log(`Checking translation for: ${rateAreaCode} in org: ${profile.organization_id}`);
        const { data: translation, error: translationError } = await supabase
          .from('rate_area_translations')
          .select('rate_area_id')
          .eq('organization_id', profile.organization_id)
          .eq('external_rate_area_code', rateAreaCode)
          .maybeSingle();

        if (translationError) {
          console.error('Error checking rate area translation:', translationError);
        }

        if (translation) {
          console.log(`Translation found for ${rateAreaCode} -> ${translation.rate_area_id}`);
          updates[targetField] = translation.rate_area_id;
        } else {
          console.log(`No translation found for ${rateAreaCode}`);
          errors.push(`Rate area '${rateAreaCode}' not found and no translation configured`);
        }
      }

      // Validate and translate ports with translation prompts
      for (const field of ['raw_poe_code', 'raw_pod_code']) {
        const portCode = record[field];
        console.log(`Validating ${field}:`, portCode);
        
        if (!portCode) {
          errors.push(`${field.replace('raw_', '').replace('_', ' ')} is required`);
          continue;
        }

        // Map to correct target field names for staging table
        const targetField = field === 'raw_poe_code' ? 'target_poe_id' : 'target_pod_id';
        
        // Check if port exists directly
        console.log(`Checking direct port match for: ${portCode}`);
        const { data: directPort, error: directPortError } = await supabase
          .from('ports')
          .select('id')
          .eq('code', portCode)
          .maybeSingle();

        if (directPortError) {
          console.error('Error checking direct port:', directPortError);
        }

        if (directPort) {
          console.log(`Direct port match found for ${portCode}`);
          updates[targetField] = directPort.id;
          continue;
        }

        // Check for translation
        console.log(`Checking port translation for: ${portCode} in org: ${profile.organization_id}`);
        const { data: translation, error: portTranslationError } = await supabase
          .from('port_code_translations')
          .select('port_id')
          .eq('organization_id', profile.organization_id)
          .eq('external_port_code', portCode)
          .maybeSingle();

        if (portTranslationError) {
          console.error('Error checking port translation:', portTranslationError);
        }

        if (translation) {
          console.log(`Port translation found for ${portCode} -> ${translation.port_id}`);
          updates[targetField] = translation.port_id;
        } else {
          console.log(`No port translation found for ${portCode}`);
          errors.push(`Port code '${portCode}' not found and no translation configured. Would you like to create a translation?`);
        }
      }

      // Validate and find TSP
      if (!record.raw_scac_code) {
        errors.push('SCAC code is required');
      } else {
        console.log(`Validating SCAC code: ${record.raw_scac_code} in org: ${profile.organization_id}`);
        const { data: tsp, error: tspError } = await supabase
          .from('tsps')
          .select('id')
          .eq('scac_code', record.raw_scac_code)
          .eq('organization_id', profile.organization_id)
          .maybeSingle();

        if (tspError) {
          console.error('Error checking TSP:', tspError);
        }

        if (tsp) {
          console.log(`TSP found for ${record.raw_scac_code} -> ${tsp.id}`);
          updates.tsp_id = tsp.id;
        } else {
          console.log(`No TSP found for ${record.raw_scac_code} in organization ${profile.organization_id}`);
          errors.push(`SCAC code '${record.raw_scac_code}' not found in your organization`);
        }
      }

      console.log(`Validation complete for ${record.gbl_number}. Errors: ${errors.length}, Updates:`, updates);

      // Update record
      const { error: updateError } = await supabase
        .from('shipment_uploads_staging')
        .update({
          ...updates,
          validation_status: errors.length === 0 ? 'valid' : 'invalid',
          validation_errors: errors,
          updated_at: new Date().toISOString()
        })
        .eq('id', record.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      console.log(`Record ${record.gbl_number} updated successfully`);

    } catch (error: any) {
      console.error('Validation error for record', record.gbl_number, ':', error);
      errors.push(`Validation failed: ${error.message || 'System error'}`);
      
      await supabase
        .from('shipment_uploads_staging')
        .update({
          validation_status: 'invalid',
          validation_errors: errors,
          updated_at: new Date().toISOString()
        })
        .eq('id', record.id);
    }
  };

  return { validateRecord };
};
