
import { BulkUploadRecord } from './bulkUploadTypes';
import { supabase } from '@/integrations/supabase/client';

export const validateRecord = async (record: BulkUploadRecord): Promise<string[]> => {
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
  } else {
    // Validate origin rate area exists
    const { data: originRateArea } = await supabase
      .from('rate_areas')
      .select('rate_area')
      .eq('rate_area', record.origin_rate_area.trim())
      .maybeSingle();
    
    if (!originRateArea) {
      errors.push(`Origin rate area '${record.origin_rate_area}' not found`);
    }
  }
  
  if (!record.destination_rate_area || record.destination_rate_area.trim() === '') {
    errors.push('Destination rate area is required');
  } else {
    // Validate destination rate area exists
    const { data: destRateArea } = await supabase
      .from('rate_areas')
      .select('rate_area')
      .eq('rate_area', record.destination_rate_area.trim())
      .maybeSingle();
    
    if (!destRateArea) {
      errors.push(`Destination rate area '${record.destination_rate_area}' not found`);
    }
  }
  
  if (!record.pickup_date || record.pickup_date.trim() === '') {
    errors.push('Pickup date is required');
  } else {
    // Simple date validation - accept MM/DD/YY, MM/DD/YYYY, or YYYY-MM-DD
    const dateStr = record.pickup_date.trim();
    if (!isValidDateFormat(dateStr)) {
      errors.push('Pickup date must be in MM/DD/YY, MM/DD/YYYY, or YYYY-MM-DD format');
    } else {
      // Check if pickup date is not older than 30 days
      const pickupDate = parseDate(dateStr);
      if (pickupDate) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        if (pickupDate < thirtyDaysAgo) {
          errors.push('Pickup date cannot be older than 30 days');
        }
      }
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
  } else {
    // Validate POE code exists
    const { data: poePort } = await supabase
      .from('ports')
      .select('id')
      .eq('code', record.poe_code.trim())
      .maybeSingle();
    
    if (!poePort) {
      errors.push(`POE code '${record.poe_code}' not found`);
    } else {
      // Store the resolved ID for later use
      record.target_poe_id = poePort.id;
    }
  }
  
  if (!record.pod_code || record.pod_code.trim() === '') {
    errors.push('POD code is required');
  } else {
    // Validate POD code exists
    const { data: podPort } = await supabase
      .from('ports')
      .select('id')
      .eq('code', record.pod_code.trim())
      .maybeSingle();
    
    if (!podPort) {
      errors.push(`POD code '${record.pod_code}' not found`);
    } else {
      // Store the resolved ID for later use
      record.target_pod_id = podPort.id;
    }
  }
  
  if (!record.scac_code || record.scac_code.trim() === '') {
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
          .eq('scac_code', record.scac_code.trim())
          .eq('organization_id', profile.organization_id)
          .maybeSingle();
        
        if (!tsp) {
          errors.push(`SCAC code '${record.scac_code}' not found in your organization`);
        } else {
          // Store the resolved ID for later use
          record.tsp_id = tsp.id;
        }
      }
    }
  }

  // Cube validation - either estimated OR actual, not both, not neither
  const hasEstimated = record.estimated_cube && record.estimated_cube.trim() !== '' && !isNaN(Number(record.estimated_cube));
  const hasActual = record.actual_cube && record.actual_cube.trim() !== '' && !isNaN(Number(record.actual_cube));
  
  if (!hasEstimated && !hasActual) {
    errors.push('Either estimated cube or actual cube is required');
  }
  
  if (hasEstimated && hasActual) {
    errors.push('Cannot have both estimated cube and actual cube - choose one');
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
  
  if (!record.pickup_date || record.pickup_date.trim() === '') {
    errors.push('Pickup date is required');
  } else {
    // Simple date validation - accept MM/DD/YY, MM/DD/YYYY, or YYYY-MM-DD
    const dateStr = record.pickup_date.trim();
    if (!isValidDateFormat(dateStr)) {
      errors.push('Pickup date must be in MM/DD/YY, MM/DD/YYYY, or YYYY-MM-DD format');
    } else {
      // Check if pickup date is not older than 30 days
      const pickupDate = parseDate(dateStr);
      if (pickupDate) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        if (pickupDate < thirtyDaysAgo) {
          errors.push('Pickup date cannot be older than 30 days');
        }
      }
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

  // Cube validation - either estimated OR actual, not both, not neither
  const hasEstimated = record.estimated_cube && record.estimated_cube.trim() !== '' && !isNaN(Number(record.estimated_cube));
  const hasActual = record.actual_cube && record.actual_cube.trim() !== '' && !isNaN(Number(record.actual_cube));
  
  if (!hasEstimated && !hasActual) {
    errors.push('Either estimated cube or actual cube is required');
  }
  
  if (hasEstimated && hasActual) {
    errors.push('Cannot have both estimated cube and actual cube - choose one');
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
