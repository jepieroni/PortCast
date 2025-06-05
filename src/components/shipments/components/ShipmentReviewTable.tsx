import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Loader2 } from 'lucide-react';
import EditableField from './EditableField';
import { StatusBadgeComponent } from './review/StatusBadgeComponent';

interface ShipmentReviewTableProps {
  stagingData: any[];
  ports: any[];
  rateAreas: any[];
  tsps: any[];
  validatingRecords: Set<string>;
  getEditingValue: (record: any, field: string) => any;
  updateEditingValue: (recordId: string, field: string, value: any) => void;
  getFieldValidationError: (record: any, field: string) => string | null;
  hasFieldIssue: (record: any, field: string) => boolean;
  validateSingleRecord: (record: any) => void;
  onAddPortClick: () => void;
}

const ShipmentReviewTable = ({
  stagingData,
  ports,
  rateAreas,
  tsps,
  validatingRecords,
  getEditingValue,
  updateEditingValue,
  getFieldValidationError,
  hasFieldIssue,
  validateSingleRecord,
  onAddPortClick
}: ShipmentReviewTableProps) => {
  const getValidationErrors = (record: any): string[] => {
    if (!record.validation_errors) return [];
    if (Array.isArray(record.validation_errors)) return record.validation_errors;
    if (typeof record.validation_errors === 'string') {
      try {
        const parsed = JSON.parse(record.validation_errors);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [record.validation_errors];
      }
    }
    return [];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipment Records</CardTitle>
        <p className="text-sm text-muted-foreground">
          Review and edit shipment data. Fields with issues are highlighted in red and can be edited.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full overflow-x-auto max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
              <TableRow>
                <TableHead className="w-24 min-w-24">Status</TableHead>
                <TableHead className="w-32 min-w-32">GBL</TableHead>
                <TableHead className="w-40 min-w-40">Shipper</TableHead>
                <TableHead className="w-20 min-w-20">Type</TableHead>
                <TableHead className="w-48 min-w-48">Origin</TableHead>
                <TableHead className="w-48 min-w-48">Destination</TableHead>
                <TableHead className="w-52 min-w-52">POE</TableHead>
                <TableHead className="w-52 min-w-52">POD</TableHead>
                <TableHead className="w-24 min-w-24">SCAC</TableHead>
                <TableHead className="w-36 min-w-36">Pickup</TableHead>
                <TableHead className="w-36 min-w-36">RDD</TableHead>
                <TableHead className="w-32 min-w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stagingData.map((record) => {
                const isValidating = validatingRecords.has(record.id);
                return (
                  <TableRow key={record.id} className="hover:bg-muted/50">
                    <TableCell className="p-2">
                      <StatusBadgeComponent 
                        record={record} 
                        validatingRecords={validatingRecords} 
                      />
                    </TableCell>
                    <TableCell className="p-2">
                      <EditableField
                        record={record}
                        field="gbl_number"
                        label="GBL Number"
                        ports={ports}
                        rateAreas={rateAreas}
                        tsps={tsps}
                        getEditingValue={getEditingValue}
                        updateEditingValue={updateEditingValue}
                        getFieldValidationError={getFieldValidationError}
                        hasFieldIssue={hasFieldIssue}
                        onAddPortClick={onAddPortClick}
                      />
                    </TableCell>
                    <TableCell className="p-2">
                      <EditableField
                        record={record}
                        field="shipper_last_name"
                        label="Shipper Name"
                        ports={ports}
                        rateAreas={rateAreas}
                        tsps={tsps}
                        getEditingValue={getEditingValue}
                        updateEditingValue={updateEditingValue}
                        getFieldValidationError={getFieldValidationError}
                        hasFieldIssue={hasFieldIssue}
                        onAddPortClick={onAddPortClick}
                      />
                    </TableCell>
                    <TableCell className="p-2">
                      <EditableField
                        record={record}
                        field="shipment_type"
                        label="Type"
                        ports={ports}
                        rateAreas={rateAreas}
                        tsps={tsps}
                        getEditingValue={getEditingValue}
                        updateEditingValue={updateEditingValue}
                        getFieldValidationError={getFieldValidationError}
                        hasFieldIssue={hasFieldIssue}
                        onAddPortClick={onAddPortClick}
                      />
                    </TableCell>
                    <TableCell className="p-2">
                      <EditableField
                        record={record}
                        field="raw_origin_rate_area"
                        label="Origin"
                        ports={ports}
                        rateAreas={rateAreas}
                        tsps={tsps}
                        getEditingValue={getEditingValue}
                        updateEditingValue={updateEditingValue}
                        getFieldValidationError={getFieldValidationError}
                        hasFieldIssue={hasFieldIssue}
                        onAddPortClick={onAddPortClick}
                      />
                    </TableCell>
                    <TableCell className="p-2">
                      <EditableField
                        record={record}
                        field="raw_destination_rate_area"
                        label="Destination"
                        ports={ports}
                        rateAreas={rateAreas}
                        tsps={tsps}
                        getEditingValue={getEditingValue}
                        updateEditingValue={updateEditingValue}
                        getFieldValidationError={getFieldValidationError}
                        hasFieldIssue={hasFieldIssue}
                        onAddPortClick={onAddPortClick}
                      />
                    </TableCell>
                    <TableCell className="p-2">
                      <EditableField
                        record={record}
                        field="raw_poe_code"
                        label="POE"
                        ports={ports}
                        rateAreas={rateAreas}
                        tsps={tsps}
                        getEditingValue={getEditingValue}
                        updateEditingValue={updateEditingValue}
                        getFieldValidationError={getFieldValidationError}
                        hasFieldIssue={hasFieldIssue}
                        onAddPortClick={onAddPortClick}
                      />
                    </TableCell>
                    <TableCell className="p-2">
                      <EditableField
                        record={record}
                        field="raw_pod_code"
                        label="POD"
                        ports={ports}
                        rateAreas={rateAreas}
                        tsps={tsps}
                        getEditingValue={getEditingValue}
                        updateEditingValue={updateEditingValue}
                        getFieldValidationError={getFieldValidationError}
                        hasFieldIssue={hasFieldIssue}
                        onAddPortClick={onAddPortClick}
                      />
                    </TableCell>
                    <TableCell className="p-2">
                      <EditableField
                        record={record}
                        field="raw_scac_code"
                        label="SCAC"
                        ports={ports}
                        rateAreas={rateAreas}
                        tsps={tsps}
                        getEditingValue={getEditingValue}
                        updateEditingValue={updateEditingValue}
                        getFieldValidationError={getFieldValidationError}
                        hasFieldIssue={hasFieldIssue}
                        onAddPortClick={onAddPortClick}
                      />
                    </TableCell>
                    <TableCell className="p-2">
                      <EditableField
                        record={record}
                        field="pickup_date"
                        label="Pickup Date"
                        ports={ports}
                        rateAreas={rateAreas}
                        tsps={tsps}
                        getEditingValue={getEditingValue}
                        updateEditingValue={updateEditingValue}
                        getFieldValidationError={getFieldValidationError}
                        hasFieldIssue={hasFieldIssue}
                        onAddPortClick={onAddPortClick}
                      />
                    </TableCell>
                    <TableCell className="p-2">
                      <EditableField
                        record={record}
                        field="rdd"
                        label="RDD"
                        ports={ports}
                        rateAreas={rateAreas}
                        tsps={tsps}
                        getEditingValue={getEditingValue}
                        updateEditingValue={updateEditingValue}
                        getFieldValidationError={getFieldValidationError}
                        hasFieldIssue={hasFieldIssue}
                        onAddPortClick={onAddPortClick}
                      />
                    </TableCell>
                    <TableCell className="p-2">
                      <div className="flex gap-1">
                        {record.validation_status === 'invalid' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => validateSingleRecord(record)}
                            disabled={isValidating}
                            className="h-8 text-xs px-2"
                          >
                            {isValidating ? (
                              <RefreshCw size={12} className="animate-spin" />
                            ) : (
                              'Re-validate'
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
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

export default ShipmentReviewTable;
