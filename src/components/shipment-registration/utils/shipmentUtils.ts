
export const validateGblNumber = (gblNumber: string): boolean => {
  const gblPattern = /^[A-Z]{4}\d{7}$/;
  return gblPattern.test(gblNumber);
};

export const shouldAllowActualEntry = (pickupDate: Date | undefined): boolean => {
  if (!pickupDate) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const pickup = new Date(pickupDate);
  pickup.setHours(0, 0, 0, 0);
  
  return pickup <= today;
};

export const formatFieldValue = (field: string, value: string): string => {
  if (field === 'gblNumber') {
    return value.toUpperCase();
  }
  return value;
};
