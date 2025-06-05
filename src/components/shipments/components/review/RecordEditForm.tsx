
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BulkUploadRecord } from '../../hooks/utils/bulkUploadTypes';

interface RecordEditFormProps {
  record: BulkUploadRecord;
  onFieldChange: (field: string, value: string) => void;
}

export const RecordEditForm = ({ record, onFieldChange }: RecordEditFormProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">GBL Number</label>
        <Input
          value={record.gbl_number}
          onChange={(e) => onFieldChange('gbl_number', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Shipper Last Name</label>
        <Input
          value={record.shipper_last_name}
          onChange={(e) => onFieldChange('shipper_last_name', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Shipment Type</label>
        <Select
          value={record.shipment_type}
          onValueChange={(value) => onFieldChange('shipment_type', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
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
          onChange={(e) => onFieldChange('origin_rate_area', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Destination Rate Area</label>
        <Input
          value={record.destination_rate_area}
          onChange={(e) => onFieldChange('destination_rate_area', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Pickup Date</label>
        <Input
          value={record.pickup_date}
          onChange={(e) => onFieldChange('pickup_date', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Required Delivery Date</label>
        <Input
          value={record.rdd}
          onChange={(e) => onFieldChange('rdd', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">POE Code</label>
        <Input
          value={record.poe_code}
          onChange={(e) => onFieldChange('poe_code', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">POD Code</label>
        <Input
          value={record.pod_code}
          onChange={(e) => onFieldChange('pod_code', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">SCAC Code</label>
        <Input
          value={record.scac_code}
          onChange={(e) => onFieldChange('scac_code', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Estimated Cube</label>
        <Input
          value={record.estimated_cube || ''}
          onChange={(e) => onFieldChange('estimated_cube', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Actual Cube</label>
        <Input
          value={record.actual_cube || ''}
          onChange={(e) => onFieldChange('actual_cube', e.target.value)}
        />
      </div>
    </div>
  );
};
