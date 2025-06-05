import { BulkUploadRecord } from './bulkUploadTypes';
import { supabase } from '@/integrations/supabase/client';

export const validateRecord = async (record: BulkUploadRecord): Promise<string[]> => {
  const errors: string[] = [];
  
  // CRITICAL: Create a deep copy to prevent cross-contamination between records
  const workingRecord = JSON.parse(JSON.stringify(record));

  // Required field validation - simple null/empty checks
  if (!workingRecord.gbl_number || workingRecord.gbl_number.trim() === '') {
    errors.push('GBL number is required');
  }
  
  if (!workingRecord.shipper_last_name || workingRecord.shipper_last_name.trim() === '') {
    errors.push('Shipper last name is required');
  }
  
  if (!workingRecord.shipment_type || workingRecord.shipment_type.trim() === '') {
    errors.push('Shipment type is required');
  } else {
    // Validate shipment type values
    const type = workingRecord.shipment_type.trim().toLowerCase();
    if (!['i', 'o', 't', 'inbound', 'outbound', 'intertheater'].includes(type)) {
      errors.push('Shipment type must be I, O, T, Inbound, Outbound, or Intertheater');
    }
  }
  
  if (!workingRecord.origin_rate_area || workingRecord.origin_rate_area.trim() === '') {
    errors.push('Origin rate area is required');
  } else {
    // Validate origin rate area exists
    const { data: originRateArea } = await supabase
      .from('rate_areas')
      .select('rate_area')
      .eq('rate_area', workingRecord.origin_rate_area.trim())
      .maybeSingle();
    
    if (!originRateArea) {
      errors.push(`Origin rate area '${workingRecord.origin_rate_area}' not found`);
    }
  }
  
  if (!workingRecord.destination_rate_area || workingRecord.destination_rate_area.trim() === '') {
    errors.push('Destination rate area is required');
  } else {
    // Validate destination rate area exists
    const { data: destRateArea } = await supabase
      .from('rate_areas')
      .select('rate_area')
      .eq('rate_area', workingRecord.destination_rate_area.trim())
      .maybeSingle();
    
    if (!destRateArea) {
      errors.push(`Destination rate area '${workingRecord.destination_rate_area}' not found`);
    }
  }
  
  // Parse pickup date for cube validation and date range warnings
  let pickupDate: Date | null = null;
  if (!workingRecord.pickup_date || workingRecord.pickup_date.trim() === '') {
    errors.push('Pickup date is required');
  } else {
    // Simple date validation - accept MM/DD/YY, MM/DD/YYYY, or YYYY-MM-DD
    const dateStr = workingRecord.pickup_date.trim();
    console.log(`Validating pickup date for ${workingRecord.gbl_number}: "${dateStr}"`);
    
    if (!isValidDateFormat(dateStr)) {
      errors.push('Pickup date must be in MM/DD/YY, MM/DD/YYYY, or YYYY-MM-DD format');
    } else {
      pickupDate = parseDate(dateStr);
      console.log(`Parsed pickup date for ${workingRecord.gbl_number}:`, pickupDate);
      
      if (pickupDate) {
        // Initialize warnings array if it doesn't exist
        if (!workingRecord.warnings) workingRecord.warnings = [];
        
        // Date range warnings (not hard validation failures)
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const oneHundredTwentyDaysFromNow = new Date();
        oneHundredTwentyDaysFromNow.setDate(oneHundredTwentyDaysFromNow.getDate() + 120);
        
        console.log(`Date range check for ${workingRecord.gbl_number}:`, {
          pickupDate: pickupDate.toLocaleDateString(),
          thirtyDaysAgo: thirtyDaysAgo.toLocaleDateString(),
          oneHundredTwentyDaysFromNow: oneHundredTwentyDaysFromNow.toLocaleDateString(),
          isOlderThan30Days: pickupDate < thirtyDaysAgo,
          isMoreThan120DaysInFuture: pickupDate > oneHundredTwentyDaysFromNow
        });
        
        if (pickupDate < thirtyDaysAgo) {
          const warningMessage = `WARNING: Pickup date is more than 30 days in the past (${pickupDate.toLocaleDateString()}) - please verify this is correct`;
          workingRecord.warnings.push(warningMessage);
          console.log(`Added past date warning for ${workingRecord.gbl_number}: ${warningMessage}`);
        }
        
        if (pickupDate > oneHundredTwentyDaysFromNow) {
          const warningMessage = `WARNING: Pickup date is more than 120 days in the future (${pickupDate.toLocaleDateString()}) - please verify this is correct`;
          workingRecord.warnings.push(warningMessage);
          console.log(`Added future date warning for ${workingRecord.gbl_number}: ${warningMessage}`);
        }
      }
    }
  }
  
  if (!workingRecord.rdd || workingRecord.rdd.trim() === '') {
    errors.push('Required delivery date is required');
  } else {
    // Simple date validation
    const dateStr = workingRecord.rdd.trim();
    if (!isValidDateFormat(dateStr)) {
      errors.push('Required delivery date must be in MM/DD/YY, MM/DD/YYYY, or YYYY-MM-DD format');
    }
  }
  
  if (!workingRecord.poe_code || workingRecord.poe_code.trim() === '') {
    errors.push('POE code is required');
  } else {
    // Validate POE code exists or has translation
    const poeResult = await validatePortCode(workingRecord.poe_code.trim(), 'POE');
    if (poeResult.error) {
      errors.push(poeResult.error);
    } else if (poeResult.portId) {
      workingRecord.target_poe_id = poeResult.portId;
    }
  }
  
  if (!workingRecord.pod_code || workingRecord.pod_code.trim() === '') {
    errors.push('POD code is required');
  } else {
    // Validate POD code exists or has translation
    const podResult = await validatePortCode(workingRecord.pod_code.trim(), 'POD');
    if (podResult.error) {
      errors.push(podResult.error);
    } else if (podResult.portId) {
      workingRecord.target_pod_id = podResult.portId;
    }
  }
  
  if (!workingRecord.scac_code || workingRecord.scac_code.trim() === '') {
    errors.push('SCAC code is required');
  } else {
    // Get user's organization to validate SCAC code
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .maybeSingle();
      
      if (profile?.organization_id) {
        const { data: tsp } = await supabase
          .from('tsps')
          .select('id')
          .eq('scac_code', workingRecord.scac_code.trim())
          .eq('organization_id', profile.organization_id)
          .maybeSingle();
        
        if (!tsp) {
          errors.push(`SCAC code '${workingRecord.scac_code}' not found in your organization`);
        } else {
          // Store the resolved ID for later use
          workingRecord.tsp_id = tsp.id;
        }
      }
    }
  }

  // Enhanced cube validation with pickup date logic
  const hasEstimated = workingRecord.estimated_cube && workingRecord.estimated_cube.trim() !== '' && !isNaN(Number(workingRecord.estimated_cube));
  const hasActual = workingRecord.actual_cube && workingRecord.actual_cube.trim() !== '' && !isNaN(Number(workingRecord.actual_cube));
  
  // Check if pickup date is in the future
  const today = new Date();
  today.setHours(23, 59, 59, 999); // Set to end of today for comparison
  const isPickupInFuture = pickupDate && pickupDate > today;
  
  if (!hasEstimated && !hasActual) {
    errors.push('Either estimated cube or actual cube is required');
  }
  
  if (hasEstimated && hasActual) {
    errors.push('Cannot have both estimated cube and actual cube - choose one');
  }
  
  // New rule: If pickup date is in the future, only estimated cube is allowed
  if (isPickupInFuture && hasActual && !hasEstimated) {
    errors.push('Cannot use actual cube when pickup date is in the future - use estimated cube instead');
  }
  
  // Validate cube numbers if provided
  if (hasEstimated && Number(workingRecord.estimated_cube) <= 0) {
    errors.push('Estimated cube must be greater than 0');
  }
  
  if (hasActual && Number(workingRecord.actual_cube) <= 0) {
    errors.push('Actual cube must be greater than 0');
  }

  // CRITICAL: Copy warnings back to the original record to prevent data loss
  if (workingRecord.warnings && workingRecord.warnings.length > 0) {
    record.warnings = [...workingRecord.warnings];
  }
  
  // Copy resolved IDs back to original record
  if (workingRecord.target_poe_id) record.target_poe_id = workingRecord.target_poe_id;
  if (workingRecord.target_pod_id) record.target_pod_id = workingRecord.target_pod_id;
  if (workingRecord.tsp_id) record.tsp_id = workingRecord.tsp_id;

  console.log(`Validation complete for ${workingRecord.gbl_number}:`, {
    errors: errors.length,
    warnings: workingRecord.warnings?.length || 0,
    warningMessages: workingRecord.warnings || []
  });

  return errors;
};

const validatePortCode = async (portCode: string, portType: string): Promise<{ portId?: string; error?: string }> => {
  // Check if port exists directly
  const { data: directPort } = await supabase
    .from('ports')
    .select('id')
    .eq('code', portCode)
    .maybeSingle();

  if (directPort) {
    return { portId: directPort.id };
  }

  // Check for translation
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .maybeSingle();
    
    if (profile?.organization_id) {
      const { data: translation } = await supabase
        .from('port_code_translations')
        .select('port_id')
        .eq('organization_id', profile.organization_id)
        .eq('external_port_code', portCode)
        .maybeSingle();
      
      if (translation) {
        return { portId: translation.port_id };
      }
    }
  }

  return { error: `${portType} code '${portCode}' not found. Please select from available ports or create a translation.` };
};

// Create a synchronous version for immediate validation without database lookups
export const validateRecordSync = (record: BulkUploadRecord): string[] => {
  const errors: string[] = [];

  // Required field validation - simple null/empty checks
  if (!record.gbl_number || record.gbl_number.trim() === '') {
    errors.push('GBL number is required');
  }
  
  if (!record.shipper_last_name || record.shipper_last_name.trim() === '') {
    errors.push('Shipper last name is required');
  }
  
  if (!record.shipment_type || record.shipment_type.trim() === '') {
    errors.push('Shipment type is required');
  } else {
    // Validate shipment type values
    const type = record.shipment_type.trim().toLowerCase();
    if (!['i', 'o', 't', 'inbound', 'outbound', 'intertheater'].includes(type)) {
      errors.push('Shipment type must be I, O, T, Inbound, Outbound, or Intertheater');
    }
  }
  
  if (!record.origin_rate_area || record.origin_rate_area.trim() === '') {
    errors.push('Origin rate area is required');
  }
  
  if (!record.destination_rate_area || record.destination_rate_area.trim() === '') {
    errors.push('Destination rate area is required');
  }
  
  // Parse pickup date for cube validation
  let pickupDate: Date | null = null;
  if (!record.pickup_date || record.pickup_date.trim() === '') {
    errors.push('Pickup date is required');
  } else {
    // Simple date validation - accept MM/DD/YY, MM/DD/YYYY, or YYYY-MM-DD
    const dateStr = record.pickup_date.trim();
    if (!isValidDateFormat(dateStr)) {
      errors.push('Pickup date must be in MM/DD/YY, MM/DD/YYYY, or YYYY-MM-DD format');
    } else {
      pickupDate = parseDate(dateStr);
    }
  }
  
  if (!record.rdd || record.rdd.trim() === '') {
    errors.push('Required delivery date is required');
  } else {
    // Simple date validation
    const dateStr = record.rdd.trim();
    if (!isValidDateFormat(dateStr)) {
      errors.push('Required delivery date must be in MM/DD/YY, MM/DD/YYYY, or YYYY-MM-DD format');
    }
  }
  
  if (!record.poe_code || record.poe_code.trim() === '') {
    errors.push('POE code is required');
  }
  
  if (!record.pod_code || record.pod_code.trim() === '') {
    errors.push('POD code is required');
  }
  
  if (!record.scac_code || record.scac_code.trim() === '') {
    errors.push('SCAC code is required');
  }

  // Enhanced cube validation with pickup date logic
  const hasEstimated = record.estimated_cube && record.estimated_cube.trim() !== '' && !isNaN(Number(record.estimated_cube));
  const hasActual = record.actual_cube && record.actual_cube.trim() !== '' && !isNaN(Number(record.actual_cube));
  
  // Check if pickup date is in the future
  const today = new Date();
  today.setHours(23, 59, 59, 999); // Set to end of today for comparison
  const isPickupInFuture = pickupDate && pickupDate > today;
  
  if (!hasEstimated && !hasActual) {
    errors.push('Either estimated cube or actual cube is required');
  }
  
  if (hasEstimated && hasActual) {
    errors.push('Cannot have both estimated cube and actual cube - choose one');
  }
  
  // New rule: If pickup date is in the future, only estimated cube is allowed
  if (isPickupInFuture && hasActual && !hasEstimated) {
    errors.push('Cannot use actual cube when pickup date is in the future - use estimated cube instead');
  }
  
  // Validate cube numbers if provided
  if (hasEstimated && Number(record.estimated_cube) <= 0) {
    errors.push('Estimated cube must be greater than 0');
  }
  
  if (hasActual && Number(record.actual_cube) <= 0) {
    errors.push('Actual cube must be greater than 0');
  }

  return errors;
};

const isValidDateFormat = (dateStr: string): boolean => {
  // Check for YYYY-MM-DD format
  const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
  if (isoPattern.test(dateStr)) {
    const date = new Date(dateStr + 'T00:00:00');
    return !isNaN(date.getTime());
  }

  // Check for MM/DD/YY or MM/DD/YYYY format
  const usPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/;
  const match = dateStr.match(usPattern);
  if (match) {
    const [, month, day, year] = match;
    const monthNum = parseInt(month);
    const dayNum = parseInt(day);
    let yearNum = parseInt(year);
    
    // Convert 2-digit year to 4-digit
    if (yearNum < 100) {
      yearNum = yearNum < 50 ? 2000 + yearNum : 1900 + yearNum;
    }
    
    // Basic range checks
    if (monthNum < 1 || monthNum > 12) return false;
    if (dayNum < 1 || dayNum > 31) return false;
    if (yearNum < 1900 || yearNum > 2100) return false;
    
    // Create date and validate it's real
    const date = new Date(yearNum, monthNum - 1, dayNum);
    return date.getFullYear() === yearNum && 
           date.getMonth() === monthNum - 1 && 
           date.getDate() === dayNum;
  }

  return false;
};

const parseDate = (dateStr: string): Date | null => {
  // Check for YYYY-MM-DD format
  const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
  if (isoPattern.test(dateStr)) {
    return new Date(dateStr + 'T00:00:00');
  }

  // Check for MM/DD/YY or MM/DD/YYYY format
  const usPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/;
  const match = dateStr.match(usPattern);
  if (match) {
    const [, month, day, year] = match;
    const monthNum = parseInt(month);
    const dayNum = parseInt(day);
    let yearNum = parseInt(year);
    
    // Convert 2-digit year to 4-digit
    if (yearNum < 100) {
      yearNum = yearNum < 50 ? 2000 + yearNum : 1900 + yearNum;
    }
    
    return new Date(yearNum, monthNum - 1, dayNum);
  }

  return null;
};
