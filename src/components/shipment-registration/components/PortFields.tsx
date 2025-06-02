
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShipmentFormData, Port } from '../types';
import { usePortRegions } from '@/hooks/usePortRegions';

interface PortFieldsProps {
  formData: ShipmentFormData;
  ports: Port[];
  onInputChange: (field: string, value: string) => void;
}

export const PortFields = ({
  formData,
  ports,
  onInputChange
}: PortFieldsProps) => {
  const { portRegions, portRegionMemberships } = usePortRegions();

  // Get ports grouped by region
  const getPortsByRegion = (regionId: string) => {
    const regionPortIds = portRegionMemberships
      .filter(m => m.region_id === regionId)
      .map(m => m.port_id);
    
    return ports.filter(port => regionPortIds.includes(port.id));
  };

  // Get region for a port
  const getPortRegion = (portId: string) => {
    const membership = portRegionMemberships.find(m => m.port_id === portId);
    return membership ? portRegions.find(r => r.id === membership.region_id) : null;
  };

  // Get all ports, optionally filtering by selected port's region for regional flexibility
  const getAvailablePorts = (selectedPortId?: string) => {
    if (!selectedPortId) return ports;
    
    const selectedRegion = getPortRegion(selectedPortId);
    if (!selectedRegion) return ports;
    
    // Return all ports in the same region as the selected port
    return getPortsByRegion(selectedRegion.id);
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="targetPoeId">POE (Port of Embarkation)</Label>
        <Select value={formData.targetPoeId} onValueChange={(value) => onInputChange('targetPoeId', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select POE" />
          </SelectTrigger>
          <SelectContent>
            {ports.map((port) => {
              const region = getPortRegion(port.id);
              return (
                <SelectItem key={port.id} value={port.id}>
                  {port.name} {region ? `(${region.name})` : ''}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetPodId">POD (Port of Debarkation)</Label>
        <Select value={formData.targetPodId} onValueChange={(value) => onInputChange('targetPodId', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select POD" />
          </SelectTrigger>
          <SelectContent>
            {ports.map((port) => {
              const region = getPortRegion(port.id);
              return (
                <SelectItem key={port.id} value={port.id}>
                  {port.name} {region ? `(${region.name})` : ''}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
