
import { SearchableSelect } from '@/components/shipment-registration/components/SearchableSelect';
import { useFilteredPorts } from '@/hooks/useFilteredPorts';

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
    origin_rate_area: string;
    destination_rate_area: string;
  };
  ports: Port[];
  onInputChange: (field: string, value: string) => void;
}

export const PortFieldGroup = ({ formData, ports, onInputChange }: PortFieldGroupProps) => {
  // Filter POEs based on origin rate area
  const filteredPOEs = useFilteredPorts(ports, formData.origin_rate_area);
  
  // Filter PODs based on destination rate area
  const filteredPODs = useFilteredPorts(ports, formData.destination_rate_area);

  // Create searchable port options with enhanced search text for POEs
  const poeOptions = filteredPOEs?.map(port => ({
    value: port.id,
    label: `${port.code} - ${port.name}`,
    searchableText: `${port.code} ${port.name} ${port.description || ''}`.toLowerCase()
  })) || [];

  // Create searchable port options with enhanced search text for PODs
  const podOptions = filteredPODs?.map(port => ({
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
        placeholder={!formData.origin_rate_area ? "Select origin rate area first" : "Search and select POE"}
        options={poeOptions}
        error=""
        onFocus={() => {}}
        className="w-full"
        disabled={!formData.origin_rate_area}
      />

      <SearchableSelect
        label="Port of Debarkation (POD)"
        required
        value={formData.target_pod_id}
        onChange={(value) => onInputChange('target_pod_id', value)}
        placeholder={!formData.destination_rate_area ? "Select destination rate area first" : "Search and select POD"}
        options={podOptions}
        error=""
        onFocus={() => {}}
        className="w-full"
        disabled={!formData.destination_rate_area}
      />
    </>
  );
};
