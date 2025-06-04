
import { supabase } from '@/integrations/supabase/client';
import type { ParsedRow } from './csvParser';

export const checkForDuplicateGBLs = async (parsedData: ParsedRow[]): Promise<ParsedRow[]> => {
  const gblNumbers = parsedData.map(row => row.gbl_number).filter(gbl => gbl && typeof gbl === 'string' && gbl.trim() !== '');
  
  if (gblNumbers.length === 0) return parsedData;

  // Check for duplicates within the same file first
  const gblCounts = new Map<string, number>();
  const duplicateGBLsInFile = new Set<string>();
  
  gblNumbers.forEach(gbl => {
    const count = gblCounts.get(gbl) || 0;
    gblCounts.set(gbl, count + 1);
    if (count > 0) {
      duplicateGBLsInFile.add(gbl);
    }
  });

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
  
  // Mark records with duplicate issues
  const dataWithDuplicateFlags = parsedData.map(row => {
    if (row.gbl_number) {
      // Check for duplicates within the same file
      if (duplicateGBLsInFile.has(row.gbl_number)) {
        row._validation_errors = row._validation_errors || [];
        row._validation_errors.push(`Duplicate GBL number in this file: ${row.gbl_number}`);
      }
      
      // Check for existing GBLs in database
      if (existingGBLs.has(row.gbl_number)) {
        console.log(`Found existing GBL in database: ${row.gbl_number}`);
        row._validation_errors = row._validation_errors || [];
        row._validation_errors.push(`GBL number already exists in database: ${row.gbl_number}`);
      }
    }
    return row;
  });

  return dataWithDuplicateFlags;
};
