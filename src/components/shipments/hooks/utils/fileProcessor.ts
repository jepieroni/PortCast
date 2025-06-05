
import { parseCSV } from './simpleCsvParser';

export const processUploadedFile = async (file: File) => {
  console.log('Starting file processing...');
  
  // Parse the CSV file
  const text = await file.text();
  console.log('Raw CSV text preview:', text.substring(0, 500));
  
  const records = parseCSV(text);
  console.log('Parsed records:', records.length);
  console.log('First record sample:', records[0]);

  return records;
};
