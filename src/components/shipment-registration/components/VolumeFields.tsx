
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { ShipmentFormData } from '../types';

interface VolumeFieldsProps {
  formData: ShipmentFormData;
  canEnterActuals: boolean;
  onInputChange: (field: string, value: string) => void;
}

export const VolumeFields = ({ formData, canEnterActuals, onInputChange }: VolumeFieldsProps) => {
  return (
    <>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="estimatedPieces">Estimated Pieces</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info size={16} className="text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Enter the number of standard liftvan-equivalent units, e.g. 8 or 2.5</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="estimatedPieces"
            type="number"
            step="0.1"
            style={{ appearance: 'textfield' }}
            className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            value={formData.estimatedPieces}
            onChange={(e) => onInputChange('estimatedPieces', e.target.value)}
            placeholder="Number of pieces"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="estimatedCube">Estimated Volume</Label>
          <Input
            id="estimatedCube"
            type="number"
            style={{ appearance: 'textfield' }}
            className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            value={formData.estimatedCube}
            onChange={(e) => onInputChange('estimatedCube', e.target.value)}
            placeholder="Cubic feet"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="actualPieces">Actual Pieces</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info size={16} className="text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Enter the number of standard liftvan-equivalent units, e.g. 8 or 2.5</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="actualPieces"
            type="number"
            step="0.1"
            style={{ appearance: 'textfield' }}
            className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            value={formData.actualPieces}
            onChange={(e) => onInputChange('actualPieces', e.target.value)}
            placeholder="Number of pieces"
            disabled={!canEnterActuals}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="actualCube">Actual Volume</Label>
          <Input
            id="actualCube"
            type="number"
            style={{ appearance: 'textfield' }}
            className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            value={formData.actualCube}
            onChange={(e) => onInputChange('actualCube', e.target.value)}
            placeholder="Cubic feet"
            disabled={!canEnterActuals}
          />
        </div>
      </div>
    </>
  );
};
