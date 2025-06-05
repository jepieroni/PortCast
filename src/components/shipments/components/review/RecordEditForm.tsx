
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BulkUploadRecord } from '../../hooks/utils/bulkUploadTypes';
import { PortSelectionDropdown } from './PortSelectionDropdown';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RecordEditFormProps {
  record: BulkUploadRecord;
  onFieldChange: (field: string, value: string) => void;
}

export const RecordEditForm = ({ record, onFieldChange }: RecordEditFormProps) => {
  const { toast } = useToast();

  const getPortErrors = (field: string) => {
    return record.errors.filter(error => 
      error.includes(field === 'poe_code' ? 'POE' : 'POD') && 
      error.includes('not found')
    );
  };

  const handleCreatePortTranslation = async (originalCode: string, selectedPortId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.organization_id) throw new Error('Organization not found');

      const { error } = await supabase
        .from('port_code_translations')
        .insert({
          organization_id: profile.organization_id,
          external_port_code: originalCode,
          port_id: selectedPortId
        });

      if (error) throw error;

      toast({
        title: "Translation Created",
        description: `Port code translation for '${originalCode}' has been created.`
      });

      // Re-validate the record by triggering a field change
      onFieldChange('_revalidate', Date.now().toString());

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create port translation",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
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
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">POE Code</label>
          <Input
            value={record.poe_code}
            onChange={(e) => onFieldChange('poe_code', e.target.value)}
          />
          {getPortErrors('poe_code').length > 0 && (
            <PortSelectionDropdown
              currentCode={record.poe_code}
              portType="POE"
              onPortSelect={(code) => onFieldChange('poe_code', code)}
              onCreateTranslation={handleCreatePortTranslation}
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">POD Code</label>
          <Input
            value={record.pod_code}
            onChange={(e) => onFieldChange('pod_code', e.target.value)}
          />
          {getPortErrors('pod_code').length > 0 && (
            <PortSelectionDropdown
              currentCode={record.pod_code}
              portType="POD"
              onPortSelect={(code) => onFieldChange('pod_code', code)}
              onCreateTranslation={handleCreatePortTranslation}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
    </div>
  );
};
