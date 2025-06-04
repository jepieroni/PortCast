
export const validateRequiredFields = (record: any): string[] => {
  const errors: string[] = [];

  if (!record.gbl_number) errors.push('GBL number is required');
  if (!record.shipper_last_name) errors.push('Shipper last name is required');
  
  // Check for null or invalid shipment types
  if (!record.shipment_type) {
    errors.push('Shipment type is required');
  } else if (!['inbound', 'outbound', 'intertheater'].includes(record.shipment_type)) {
    errors.push('Invalid shipment type');
  }

  return errors;
};

export const validateDates = (record: any): string[] => {
  const errors: string[] = [];

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

  return errors;
};

export const validateCubeRequirements = (record: any): string[] => {
  const errors: string[] = [];

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

  return errors;
};
