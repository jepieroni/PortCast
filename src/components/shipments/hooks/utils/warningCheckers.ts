
import { BulkUploadRecord } from './bulkUploadTypes';
import { parseDate } from './dateValidation';

export const generateDateWarnings = (record: BulkUploadRecord, approvedWarnings?: string[]): string[] => {
  const warnings: string[] = [];
  
  if (!record.pickup_date || record.pickup_date.trim() === '') {
    return warnings;
  }

  const pickupDate = parseDate(record.pickup_date.trim());
  if (!pickupDate) {
    return warnings;
  }

  console.log(`Date range check for ${record.gbl_number}:`, {
    pickupDate: pickupDate.toLocaleDateString(),
    approvedWarnings: approvedWarnings || []
  });

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const oneHundredTwentyDaysFromNow = new Date();
  oneHundredTwentyDaysFromNow.setDate(oneHundredTwentyDaysFromNow.getDate() + 120);
  
  // Only add warning if not already approved
  if (pickupDate < thirtyDaysAgo && !approvedWarnings?.includes('pickup_date_past_30_days')) {
    const warningMessage = `WARNING: Pickup date is more than 30 days in the past (${pickupDate.toLocaleDateString()}) - please verify this is correct`;
    warnings.push(warningMessage);
    console.log(`Added past date warning for ${record.gbl_number}: ${warningMessage}`);
  }
  
  // Only add warning if not already approved
  if (pickupDate > oneHundredTwentyDaysFromNow && !approvedWarnings?.includes('pickup_date_future_120_days')) {
    const warningMessage = `WARNING: Pickup date is more than 120 days in the future (${pickupDate.toLocaleDateString()}) - please verify this is correct`;
    warnings.push(warningMessage);
    console.log(`Added future date warning for ${record.gbl_number}: ${warningMessage}`);
  }

  return warnings;
};
