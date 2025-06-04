
export const mapShipmentType = (type: string): { mappedType: string | null; isValid: boolean } => {
  if (!type || typeof type !== 'string' || type.trim() === '') {
    return { mappedType: null, isValid: false };
  }
  
  const cleanType = type.trim();
  const typeMap: { [key: string]: string } = {
    'I': 'inbound',
    'O': 'outbound', 
    'T': 'intertheater',
    'i': 'inbound',
    'o': 'outbound',
    't': 'intertheater',
    'inbound': 'inbound',
    'outbound': 'outbound',
    'intertheater': 'intertheater'
  };
  
  const mappedType = typeMap[cleanType];
  return {
    mappedType: mappedType || null,
    isValid: !!mappedType
  };
};

export const parseAndValidateDate = (dateStr: string, fieldName: string): { parsedDate: string | null; error: string | null } => {
  if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '') {
    return { parsedDate: null, error: `${fieldName} is required` };
  }

  try {
    // Try to parse the date
    const parsed = parseDateString(dateStr.trim());
    if (!parsed) {
      return { parsedDate: null, error: `Invalid ${fieldName} format. Use MM/DD/YY or MM/DD/YYYY` };
    }

    // Check if pickup date is too old (more than 30 days ago)
    if (fieldName.toLowerCase().includes('pickup')) {
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      if (parsed < thirtyDaysAgo) {
        return { 
          parsedDate: null, 
          error: `Pickup date is more than 30 days in the past (${parsed.toLocaleDateString()})` 
        };
      }
    }

    return { parsedDate: parsed.toISOString().split('T')[0], error: null };
  } catch (error) {
    return { parsedDate: null, error: `Invalid ${fieldName} format: ${dateStr}` };
  }
};

export const parseAndValidateCube = (cubeStr: string, fieldName: string): { parsedCube: number | null; error: string | null } => {
  if (!cubeStr || typeof cubeStr !== 'string' || cubeStr.trim() === '') {
    return { parsedCube: null, error: null };
  }

  try {
    const numValue = parseInt(cubeStr.trim());
    if (isNaN(numValue) || numValue < 0) {
      return { parsedCube: null, error: `Invalid ${fieldName} - must be a positive number` };
    }

    return { parsedCube: numValue, error: null };
  } catch (error) {
    return { parsedCube: null, error: `Invalid ${fieldName} format: ${cubeStr}` };
  }
};

export const validateCubeLogic = (estimatedCube: number | null, actualCube: number | null, pickupDate: Date | null): string[] => {
  const errors: string[] = [];
  const hasEstimated = estimatedCube !== null && estimatedCube > 0;
  const hasActual = actualCube !== null && actualCube > 0;
  const isPickupInPast = pickupDate && pickupDate <= new Date();

  // Both estimated and actual provided
  if (hasEstimated && hasActual) {
    errors.push('Cannot have both estimated and actual cube - choose one based on pickup date');
    return errors;
  }

  // Neither estimated nor actual provided
  if (!hasEstimated && !hasActual) {
    if (isPickupInPast) {
      errors.push('Actual cube is required when pickup date is today or in the past');
    } else {
      errors.push('Estimated cube is required when pickup date is in the future');
    }
    return errors;
  }

  // Actual cube with future pickup date
  if (hasActual && !isPickupInPast) {
    errors.push('Cannot have actual cube when pickup date is in the future - use estimated cube instead');
  }

  // Estimated cube with past pickup date
  if (hasEstimated && isPickupInPast) {
    errors.push('Should use actual cube when pickup date is today or in the past');
  }

  return errors;
};
