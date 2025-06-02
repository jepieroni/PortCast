
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface VolumeFieldGroupProps {
  formData: {
    estimated_pieces: string;
    estimated_cube: string;
    actual_pieces: string;
    actual_cube: string;
    remaining_pieces: string;
    remaining_cube: string;
  };
  onInputChange: (field: string, value: string) => void;
}

export const VolumeFieldGroup = ({ formData, onInputChange }: VolumeFieldGroupProps) => {
  return (
    <>
      <div>
        <Label htmlFor="estimated_pieces">Estimated Pieces</Label>
        <Input
          id="estimated_pieces"
          type="number"
          style={{ appearance: 'textfield' }}
          className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          value={formData.estimated_pieces}
          onChange={(e) => onInputChange('estimated_pieces', e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="estimated_cube">Estimated Cube (ft³)</Label>
        <Input
          id="estimated_cube"
          type="number"
          style={{ appearance: 'textfield' }}
          className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          value={formData.estimated_cube}
          onChange={(e) => onInputChange('estimated_cube', e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="actual_pieces">Actual Pieces</Label>
        <Input
          id="actual_pieces"
          type="number"
          style={{ appearance: 'textfield' }}
          className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          value={formData.actual_pieces}
          onChange={(e) => onInputChange('actual_pieces', e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="actual_cube">Actual Cube (ft³)</Label>
        <Input
          id="actual_cube"
          type="number"
          style={{ appearance: 'textfield' }}
          className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          value={formData.actual_cube}
          onChange={(e) => onInputChange('actual_cube', e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="remaining_pieces">Remaining Pieces</Label>
        <Input
          id="remaining_pieces"
          type="number"
          style={{ appearance: 'textfield' }}
          className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          value={formData.remaining_pieces}
          onChange={(e) => onInputChange('remaining_pieces', e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="remaining_cube">Remaining Cube (ft³)</Label>
        <Input
          id="remaining_cube"
          type="number"
          style={{ appearance: 'textfield' }}
          className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          value={formData.remaining_cube}
          onChange={(e) => onInputChange('remaining_cube', e.target.value)}
        />
      </div>
    </>
  );
};
