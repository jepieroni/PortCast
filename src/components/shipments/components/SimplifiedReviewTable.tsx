
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableRowComponent } from './review/TableRowComponent';

interface SimplifiedReviewTableProps {
  stagingData: any[];
  validatingRecords: Set<string>;
  onViewEditClick: (record: any) => void;
}

const SimplifiedReviewTable = ({
  stagingData,
  validatingRecords,
  onViewEditClick
}: SimplifiedReviewTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipment Records</CardTitle>
        <p className="text-sm text-muted-foreground">
          Review imported shipment data. Use the action buttons to view details or fix validation errors.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full overflow-x-auto max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
              <TableRow>
                <TableHead className="w-24 min-w-24">Status</TableHead>
                <TableHead className="w-48 min-w-48">GBL Number</TableHead>
                <TableHead className="w-48 min-w-48">Shipper Name</TableHead>
                <TableHead className="w-40 min-w-40">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stagingData.map((record) => (
                <TableRowComponent
                  key={record.id}
                  record={record}
                  validatingRecords={validatingRecords}
                  onViewEditClick={onViewEditClick}
                />
              ))}
            </TableBody>
          </Table>
        </div>
        {stagingData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No shipment records to display
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SimplifiedReviewTable;
