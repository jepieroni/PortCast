
import { ShipmentFormData } from '../types';
import { FormField } from './FormField';
import type { useFieldValidation } from '../hooks/useFieldValidation';

interface VolumeFieldsProps {
  formData: ShipmentFormData;
  canEnterActuals: boolean;
  onInputChange: (field: string, value: string) => void;
  fieldValidation: ReturnType<typeof useFieldValidation>;
  setFieldRef: (field: string, ref: HTMLDivElement | null) => void;
}

export const VolumeFields = ({
  formData,
  canEnterActuals,
  onInputChange,
  fieldValidation,
  setFieldRef
}: VolumeFieldsProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Volume Information</h3>
      <p className="text-sm text-gray-600">
        Enter cube volume in either estimated OR actual field, not both.
      </p>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-medium text-gray-700">Estimated</h4>
          <FormField
            ref={(ref) => setFieldRef('estimatedCube', ref)}
            type="number"
            label="Estimated Cube (ft³)"
            value={formData.estimatedCube}
            onChange={(value) => onInputChange('estimatedCube', value)}
            error={fieldValidation.getError('estimatedCube')}
            onFocus={() => fieldValidation.clearFieldError('estimatedCube')}
          />
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-700">
            Actual
            {!canEnterActuals && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                (Available after pickup date)
              </span>
            )}
          </h4>
          <FormField
            ref={(ref) => setFieldRef('actualCube', ref)}
            type="number"
            label="Actual Cube (ft³)"
            value={formData.actualCube}
            onChange={(value) => canEnterActuals ? onInputChange('actualCube', value) : undefined}
            error={fieldValidation.getError('actualCube')}
            onFocus={() => fieldValidation.clearFieldError('actualCube')}
            className={!canEnterActuals ? 'opacity-50 pointer-events-none' : ''}
          />
        </div>
      </div>
    </div>
  );
};
