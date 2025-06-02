
import { SearchableSelect } from '@/components/shipment-registration/components/SearchableSelect';

interface Port {
  id: string;
  code: string;
  name: string;
  description?: string;
}

interface PortFieldGroupProps {
  formData: {
    target_poe_id: string;
    target_pod_id: string;
  };
  ports: Port[];
  onInputChange: (field: string, value: string) => void;
}

export const PortFieldGroup = ({ formData, ports, onInputChange }: PortFieldGroupProps) => {
  // Create searchable port options with enhanced search text
  const portOptions = ports?.map(port => ({
    value: port.id,
    label: `${port.code} - ${port.name}`,
    searchableText: `${port.code} ${port.name} ${port.description || ''}`.toLowerCase()
  })) || [];

  return (
    <>
      <SearchableSelect
        label="Port of Embarkation (POE)"
        required
        value={formData.target_poe_id}
        onChange={(value) => onInputChange('target_poe_id', value)}
        placeholder="Search and select POE"
        options={portOptions}
        error=""
        onFocus={() => {}}
        className="w-full"
      />

      <SearchableSelect
        label="Port of Debarkation (POD)"
        required
        value={formData.target_pod_id}
        onChange={(value) => onInputChange('target_pod_id', value)}
        placeholder="Search and select POD"
        options={portOptions}
        error=""
        onFocus={() => {}}
        className="w-full"
      />
    </>
  );
};
