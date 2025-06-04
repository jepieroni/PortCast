
import { supabase } from '@/integrations/supabase/client';
import type { ParsedRow } from './csvParser';

export const checkForDuplicateGBLs = async (parsedData: ParsedRow[]): Promise<ParsedRow[]> => {
  const gblNumbers = parsedData.map(row => row.gbl_number).filter(gbl => gbl && typeof gbl === 'string' && gbl.trim() !== '');
  
  if (gblNumbers.length === 0) return parsedData;

  // Check for existing GBLs in the shipments table
  const { data: existingShipments, error } = await supabase
    .from('shipments')
    .select('gbl_number')
    .in('gbl_number', gblNumbers);

  if (error) {
    console.error('Error checking for duplicate GBLs:', error);
    throw error;
  }

  const existingGBLs = new Set(existingShipments?.map(s => s.gbl_number) || []);
  
  // Mark records with existing GBLs in database but don't filter them out
  const dataWithDuplicateFlags = parsedData.map(row => {
    if (row.gbl_number && existingGBLs.has(row.gbl_number)) {
      console.log(`Found existing GBL in database: ${row.gbl_number}`);
      row._validation_errors = row._validation_errors || [];
      row._validation_errors.push(`GBL number already exists in database: ${row.gbl_number}`);
    }
    return row;
  });

  return dataWithDuplicateFlags;
};
