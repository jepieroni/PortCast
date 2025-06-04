
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BulkUploadRecord } from '../hooks/utils/bulkUploadTypes';

interface NewBulkUploadReviewProps {
  records: BulkUploadRecord[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    pending: number;
  };
  onUpdateRecord: (recordId: string, updates: Partial<BulkUploadRecord>) => void;
  onProcess: () => void;
  onBack: () => void;
  isProcessing: boolean;
}

export const NewBulkUploadReview = ({
  records,
  summary,
  onUpdateRecord,
  onProcess,
  onBack,
  isProcessing
}: NewBulkUploadReviewProps) => {
  const [editingRecord, setEditingRecord] = useState<string | null>(null);

  const handleFieldChange = (recordId: string, field: string, value: string) => {
    onUpdateRecord(recordId, { [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            ← Back
          </Button>
          <h2 className="text-2xl font-bold">Review Upload</h2>
        </div>
        <Button
          onClick={onProcess}
          disabled={summary.valid === 0 || isProcessing}
          className="bg-green-600 hover:bg-green-700"
        >
          {isProcessing ? 'Processing...' : `Process ${summary.valid} Valid Records`}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{summary.total}</div>
            <p className="text-sm text-gray-600">Total Records</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{summary.valid}</div>
            <p className="text-sm text-gray-600">Valid</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{summary.invalid}</div>
            <p className="text-sm text-gray-600">Invalid</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{summary.pending}</div>
            <p className="text-sm text-gray-600">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {records.map((record) => (
              <div key={record.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={record.status === 'valid' ? 'default' : 'destructive'}>
                      {record.status}
                    </Badge>
                    <span className="font-medium">{record.gbl_number}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingRecord(editingRecord === record.id ? null : record.id)}
                  >
                    {editingRecord === record.id ? 'Cancel' : 'Edit'}
                  </Button>
                </div>

                {record.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded p-2 mb-2">
                    <div className="text-sm text-red-800">
                      <strong>Errors:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {record.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {editingRecord === record.id ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">GBL Number</label>
                      <Input
                        value={record.gbl_number}
                        onChange={(e) => handleFieldChange(record.id, 'gbl_number', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Shipper Last Name</label>
                      <Input
                        value={record.shipper_last_name}
                        onChange={(e) => handleFieldChange(record.id, 'shipper_last_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Shipment Type</label>
                      <Select
                        value={record.shipment_type}
                        onValueChange={(value) => handleFieldChange(record.id, 'shipment_type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inbound">Inbound</SelectItem>
                          <SelectItem value="outbound">Outbound</SelectItem>
                          <SelectItem value="intertheater">Intertheater</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Origin Rate Area</label>
                      <Input
                        value={record.origin_rate_area}
                        onChange={(e) => handleFieldChange(record.id, 'origin_rate_area', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Destination Rate Area</label>
                      <Input
                        value={record.destination_rate_area}
                        onChange={(e) => handleFieldChange(record.id, 'destination_rate_area', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Pickup Date</label>
                      <Input
                        value={record.pickup_date}
                        onChange={(e) => handleFieldChange(record.id, 'pickup_date', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Required Delivery Date</label>
                      <Input
                        value={record.rdd}
                        onChange={(e) => handleFieldChange(record.id, 'rdd', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">POE Code</label>
                      <Input
                        value={record.poe_code}
                        onChange={(e) => handleFieldChange(record.id, 'poe_code', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">POD Code</label>
                      <Input
                        value={record.pod_code}
                        onChange={(e) => handleFieldChange(record.id, 'pod_code', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">SCAC Code</label>
                      <Input
                        value={record.scac_code}
                        onChange={(e) => handleFieldChange(record.id, 'scac_code', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Estimated Cube</label>
                      <Input
                        value={record.estimated_cube || ''}
                        onChange={(e) => handleFieldChange(record.id, 'estimated_cube', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Actual Cube</label>
                      <Input
                        value={record.actual_cube || ''}
                        onChange={(e) => handleFieldChange(record.id, 'actual_cube', e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">
                    {record.shipper_last_name} • {record.shipment_type} • {record.pickup_date}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
