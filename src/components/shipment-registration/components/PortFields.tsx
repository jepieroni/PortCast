
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShipmentFormData, Port } from '../types';
import { usePortRegions } from '@/hooks/usePortRegions';
import { useFilteredPorts } from '@/hooks/useFilteredPorts';

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
  
  // Filter POEs based on origin rate area
  const filteredPOEs = useFilteredPorts(ports, formData.originRateArea);
  
  // Filter PODs based on destination rate area
  const filteredPODs = useFilteredPorts(ports, formData.destinationRateArea);

  // Get region for a port
  const getPortRegion = (portId: string) => {
    const membership = portRegionMemberships.find(m => m.port_id === portId);
    return membership ? portRegions.find(r => r.id === membership.region_id) : null;
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="targetPoeId">POE (Port of Embarkation)</Label>
        <Select 
          value={formData.targetPoeId} 
          onValueChange={(value) => onInputChange('targetPoeId', value)}
          disabled={!formData.originRateArea}
        >
          <SelectTrigger className={!formData.originRateArea ? "opacity-50 cursor-not-allowed" : ""}>
            <SelectValue placeholder={!formData.originRateArea ? "Select origin rate area first" : "Select POE"} />
          </SelectTrigger>
          <SelectContent>
            {filteredPOEs.map((port) => {
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
        <Select 
          value={formData.targetPodId} 
          onValueChange={(value) => onInputChange('targetPodId', value)}
          disabled={!formData.destinationRateArea}
        >
          <SelectTrigger className={!formData.destinationRateArea ? "opacity-50 cursor-not-allowed" : ""}>
            <SelectValue placeholder={!formData.destinationRateArea ? "Select destination rate area first" : "Select POD"} />
          </SelectTrigger>
          <SelectContent>
            {filteredPODs.map((port) => {
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
