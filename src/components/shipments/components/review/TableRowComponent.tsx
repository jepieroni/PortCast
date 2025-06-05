
import { TableCell, TableRow } from '@/components/ui/table';
import { StatusBadgeComponent } from './StatusBadgeComponent';
import { ActionButtonComponent } from './ActionButtonComponent';
import { ValidationDisplayComponent } from './ValidationDisplayComponent';
import { getValidationErrors, getValidationWarnings } from './ValidationUtils';

interface TableRowComponentProps {
  record: any;
  validatingRecords: Set<string>;
  onViewEditClick: (record: any) => void;
}

export const TableRowComponent = ({
  record,
  validatingRecords,
  onViewEditClick
}: TableRowComponentProps) => {
  const validationErrors = getValidationErrors(record);
  const validationWarnings = getValidationWarnings(record);
  
  // COMPREHENSIVE DEBUG: Log the complete record state and rendering decision
  console.log(`=== TableRowComponent COMPREHENSIVE DEBUG for ${record.gbl_number || record.id} ===`);
  console.log('Full record object:', JSON.stringify(record, null, 2));
  console.log('record.status (for badge):', record.status);
  console.log('record.validation_status:', record.validation_status);
  console.log('validationErrors:', validationErrors);
  console.log('validationWarnings:', validationWarnings);
  console.log('validatingRecords.has(record.id):', validatingRecords.has(record.id));
  console.log('About to render StatusBadgeComponent...');
  console.log('=== END TableRowComponent DEBUG ===');
  
  return (
    <TableRow key={record.id} className="hover:bg-muted/50">
      <TableCell className="p-4">
        <div className="space-y-2">
          <StatusBadgeComponent 
            record={record} 
            validatingRecords={validatingRecords} 
          />
          
          <ValidationDisplayComponent 
            validationErrors={validationErrors}
            validationWarnings={validationWarnings}
          />
        </div>
      </TableCell>
      <TableCell className="p-4 font-medium">
        {record.gbl_number || 'N/A'}
      </TableCell>
      <TableCell className="p-4">
        {record.shipper_last_name || 'N/A'}
      </TableCell>
      <TableCell className="p-4">
        <ActionButtonComponent 
          record={record}
          validatingRecords={validatingRecords}
          onViewEditClick={onViewEditClick}
        />
      </TableCell>
    </TableRow>
  );
};
