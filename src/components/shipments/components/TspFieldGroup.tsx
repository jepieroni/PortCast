
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TSP {
  id: string;
  name: string;
  scac_code: string;
}

interface TspFieldGroupProps {
  formData: {
    tsp_id: string;
  };
  tsps: TSP[];
  onInputChange: (field: string, value: string) => void;
}

export const TspFieldGroup = ({ formData, tsps, onInputChange }: TspFieldGroupProps) => {
  console.log('TspFieldGroup formData.tsp_id:', formData.tsp_id);
  console.log('Available TSPs:', tsps);

  return (
    <div>
      <Label htmlFor="tsp_id">TSP *</Label>
      <Select value={formData.tsp_id} onValueChange={(value) => onInputChange('tsp_id', value)}>
        <SelectTrigger>
          <SelectValue placeholder="Select TSP" />
        </SelectTrigger>
        <SelectContent>
          {tsps?.map((tsp) => (
            <SelectItem key={tsp.id} value={tsp.id}>
              {tsp.scac_code} - {tsp.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
