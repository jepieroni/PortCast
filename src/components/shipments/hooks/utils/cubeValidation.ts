
export const validateCubeFields = (record: { estimated_cube: string; actual_cube: string }, pickupDate: Date | null): string[] => {
  const errors: string[] = [];
  
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
