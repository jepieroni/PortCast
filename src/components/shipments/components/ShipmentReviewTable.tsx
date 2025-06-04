
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Loader2 } from 'lucide-react';
import EditableField from './EditableField';

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

  const getStatusBadge = (status: string, validationErrors: any, recordId: string) => {
    // Show loading badge if record is currently being validated
    if (validatingRecords.has(recordId)) {
      return (
        <Badge variant="secondary" className="animate-pulse">
          <Loader2 size={12} className="animate-spin mr-1" />
          Validating...
        </Badge>
      );
    }

    // Show loading badge for any record that hasn't been fully validated yet
    // This includes 'pending' status and 'invalid' records that might still be processing
    if (status === 'pending') {
      return (
        <Badge variant="secondary" className="animate-pulse">
          <Loader2 size={12} className="animate-spin mr-1" />
          Pending
        </Badge>
      );
    }

    // Only show static badges for records that have completed validation
    if (status === 'valid') {
      return <Badge className="bg-green-100 text-green-800">Valid</Badge>;
    } else if (status === 'invalid') {
      return <Badge variant="destructive">Invalid</Badge>;
    } else {
      // For any unknown status, show loading
      return (
        <Badge variant="secondary" className="animate-pulse">
          <Loader2 size={12} className="animate-spin mr-1" />
          Processing...
        </Badge>
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipment Records</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Status</TableHead>
                <TableHead className="min-w-32">GBL</TableHead>
                <TableHead className="min-w-32">Shipper</TableHead>
                <TableHead className="w-16">Type</TableHead>
                <TableHead className="min-w-40">Origin</TableHead>
                <TableHead className="min-w-40">Destination</TableHead>
                <TableHead className="min-w-48">POE</TableHead>
                <TableHead className="min-w-48">POD</TableHead>
                <TableHead className="w-20">SCAC</TableHead>
                <TableHead className="min-w-32">Pickup</TableHead>
                <TableHead className="min-w-32">RDD</TableHead>
                <TableHead className="w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stagingData.map((record) => {
                const isValidating = validatingRecords.has(record.id);
                return (
                  <TableRow key={record.id}>
                    <TableCell>
                      {getStatusBadge(record.validation_status, record.validation_errors, record.id)}
                    </TableCell>
                    <TableCell>
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
                    <TableCell>
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
                    <TableCell>
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
                    <TableCell>
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
                    <TableCell>
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
                    <TableCell>
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
                    <TableCell>
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
                    <TableCell>
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
                    <TableCell>
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
                    <TableCell>
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
                    <TableCell>
                      <div className="flex gap-1">
                        {record.validation_status === 'invalid' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => validateSingleRecord(record)}
                            disabled={isValidating}
                            className="h-8 text-xs"
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
      </CardContent>
    </Card>
  );
};

export default ShipmentReviewTable;
