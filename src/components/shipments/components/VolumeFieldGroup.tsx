
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface VolumeFieldGroupProps {
  formData: {
    estimated_cube: string;
    actual_cube: string;
  };
  onInputChange: (field: string, value: string) => void;
  hasFieldError?: (field: string) => boolean;
}

export const VolumeFieldGroup = ({ formData, onInputChange, hasFieldError }: VolumeFieldGroupProps) => {
  return (
    <>
      <div>
        <Label htmlFor="estimated_cube">Estimated Cube</Label>
        <Input
          id="estimated_cube"
          type="number"
          value={formData.estimated_cube}
          onChange={(e) => onInputChange('estimated_cube', e.target.value)}
          placeholder="Enter estimated cube"
          className={cn(hasFieldError?.('estimated_cube') && "border-red-500 focus:border-red-500")}
        />
      </div>

      <div>
        <Label htmlFor="actual_cube">Actual Cube</Label>
        <Input
          id="actual_cube"
          type="number"
          value={formData.actual_cube}
          onChange={(e) => onInputChange('actual_cube', e.target.value)}
          placeholder="Enter actual cube"
          className={cn(hasFieldError?.('actual_cube') && "border-red-500 focus:border-red-500")}
        />
      </div>
    </>
  );
};
