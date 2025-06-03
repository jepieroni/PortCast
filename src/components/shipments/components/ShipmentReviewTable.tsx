
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';
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

  const getStatusBadge = (status: string, validationErrors: any) => {
    if (status === 'valid') {
      return <Badge className="bg-green-100 text-green-800">Valid</Badge>;
    } else if (status === 'invalid') {
      return <Badge variant="destructive">Invalid</Badge>;
    } else {
      return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipment Records</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">GBL</th>
                <th className="text-left p-2">Shipper</th>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Origin</th>
                <th className="text-left p-2">Destination</th>
                <th className="text-left p-2">POE</th>
                <th className="text-left p-2">POD</th>
                <th className="text-left p-2">SCAC</th>
                <th className="text-left p-2">Pickup</th>
                <th className="text-left p-2">RDD</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stagingData.map((record) => {
                const isValidating = validatingRecords.has(record.id);
                return (
                  <tr key={record.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      {getStatusBadge(record.validation_status, record.validation_errors)}
                    </td>
                    <td className="p-2">
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
                    </td>
                    <td className="p-2">
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
                    </td>
                    <td className="p-2">
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
                    </td>
                    <td className="p-2">
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
                    </td>
                    <td className="p-2">
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
                    </td>
                    <td className="p-2">
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
                    </td>
                    <td className="p-2">
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
                    </td>
                    <td className="p-2">
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
                    </td>
                    <td className="p-2">
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
                    </td>
                    <td className="p-2">
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
                    </td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        {record.validation_status === 'invalid' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => validateSingleRecord(record)}
                            disabled={isValidating}
                            className="h-8"
                          >
                            {isValidating ? (
                              <RefreshCw size={14} className="animate-spin" />
                            ) : (
                              'Re-validate'
                            )}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShipmentReviewTable;
