
import { BulkUploadRecord } from './bulkUploadTypes';
import { parseDate } from './dateValidation';

export const generateDateWarnings = (record: BulkUploadRecord, approvedWarnings?: string[]): string[] => {
  const warnings: string[] = [];
  
  console.log(`🟡 WARNING CHECKER: === GENERATE DATE WARNINGS START ===`);
  console.log(`🟡 WARNING CHECKER: Record ID: ${record.id}`);
  console.log(`🟡 WARNING CHECKER: GBL: ${record.gbl_number}`);
  console.log(`🟡 WARNING CHECKER: Pickup date: "${record.pickup_date}"`);
  console.log(`🟡 WARNING CHECKER: Approved warnings received:`, approvedWarnings);
  console.log(`🟡 WARNING CHECKER: Approved warnings type:`, typeof approvedWarnings);
  console.log(`🟡 WARNING CHECKER: Approved warnings length:`, approvedWarnings?.length || 0);
  
  if (!record.pickup_date || record.pickup_date.trim() === '') {
    console.log(`🟡 WARNING CHECKER: No pickup date provided, returning empty warnings`);
    return warnings;
  }

  const pickupDate = parseDate(record.pickup_date.trim());
  if (!pickupDate) {
    console.log(`🟡 WARNING CHECKER: Could not parse pickup date, returning empty warnings`);
    return warnings;
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const oneHundredTwentyDaysFromNow = new Date();
  oneHundredTwentyDaysFromNow.setDate(oneHundredTwentyDaysFromNow.getDate() + 120);
  
  console.log(`🟡 WARNING CHECKER: Date comparison setup:`, {
    pickupDate: pickupDate.toLocaleDateString(),
    thirtyDaysAgo: thirtyDaysAgo.toLocaleDateString(),
    oneHundredTwentyDaysFromNow: oneHundredTwentyDaysFromNow.toLocaleDateString(),
    isPickupBefore30Days: pickupDate < thirtyDaysAgo,
    isPickupAfter120Days: pickupDate > oneHundredTwentyDaysFromNow
  });
  
  // Check if past 30 days warning should be added
  const isPast30Days = pickupDate < thirtyDaysAgo;
  const isPast30DaysApproved = approvedWarnings?.includes('pickup_date_past_30_days');
  console.log(`🟡 WARNING CHECKER: Past 30 days check - isPast30Days: ${isPast30Days}, isApproved: ${isPast30DaysApproved}`);
  
  if (isPast30Days && !isPast30DaysApproved) {
    const warningMessage = `WARNING: Pickup date is more than 30 days in the past (${pickupDate.toLocaleDateString()}) - please verify this is correct`;
    warnings.push(warningMessage);
    console.log(`🟡 WARNING CHECKER: Added past date warning: ${warningMessage}`);
  } else if (isPast30Days && isPast30DaysApproved) {
    console.log(`🟡 WARNING CHECKER: Past 30 days warning was approved, not adding`);
  }
  
  // Check if future 120 days warning should be added
  const isFuture120Days = pickupDate > oneHundredTwentyDaysFromNow;
  const isFuture120DaysApproved = approvedWarnings?.includes('pickup_date_future_120_days');
  console.log(`🟡 WARNING CHECKER: Future 120 days check - isFuture120Days: ${isFuture120Days}, isApproved: ${isFuture120DaysApproved}`);
  
  if (isFuture120Days && !isFuture120DaysApproved) {
    const warningMessage = `WARNING: Pickup date is more than 120 days in the future (${pickupDate.toLocaleDateString()}) - please verify this is correct`;
    warnings.push(warningMessage);
    console.log(`🟡 WARNING CHECKER: Added future date warning: ${warningMessage}`);
  } else if (isFuture120Days && isFuture120DaysApproved) {
    console.log(`🟡 WARNING CHECKER: Future 120 days warning was approved, not adding`);
  }

  console.log(`🟡 WARNING CHECKER: Final warnings array:`, warnings);
  console.log(`🟡 WARNING CHECKER: === GENERATE DATE WARNINGS END ===`);
  return warnings;
};
