
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Plus, Link } from 'lucide-react';

interface ValidationErrorsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
  onCreateTranslation: (record: any, type: 'port' | 'rate_area', field: string) => void;
  onCreateRateArea: (record: any, field: string) => void;
}

const ValidationErrorsDialog = ({ 
  isOpen, 
  onClose, 
  record, 
  onCreateTranslation,
  onCreateRateArea 
}: ValidationErrorsDialogProps) => {
  if (!record) return null;

  // Helper function to safely get validation errors as array
  const getValidationErrors = (): string[] => {
    if (!record.validation_errors) return [];
    if (Array.isArray(record.validation_errors)) return record.validation_errors;
    if (typeof record.validation_errors === 'string') {
      try {
        const parsed = JSON.parse(record.validation_errors);
        return Array.isArray(parsed) ? parsed : [record.validation_errors];
      } catch {
        return [record.validation_errors];
      }
    }
    return [];
  };

  const validationErrors = getValidationErrors();

  const getActionButtons = (error: string) => {
    if (error.includes('Rate area') && error.includes('not found')) {
      const isOrigin = error.includes(record.raw_origin_rate_area);
      const field = isOrigin ? 'raw_origin_rate_area' : 'raw_destination_rate_area';
      
      return (
        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCreateTranslation(record, 'rate_area', field)}
          >
            <Link size={14} className="mr-1" />
            Map to Existing
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCreateRateArea(record, field)}
          >
            <Plus size={14} className="mr-1" />
            Create New Rate Area
          </Button>
        </div>
      );
    }

    if (error.includes('Port code') && error.includes('not found')) {
      const isPOE = error.includes(record.raw_poe_code);
      const field = isPOE ? 'raw_poe_code' : 'raw_pod_code';
      
      return (
        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCreateTranslation(record, 'port', field)}
          >
            <Link size={14} className="mr-1" />
            Map to Existing Port
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle size={20} className="text-red-600" />
            Validation Errors - GBL {record.gbl_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Shipper:</span> {record.shipper_last_name}
            </div>
            <div>
              <span className="font-medium">Type:</span> {record.shipment_type}
            </div>
            <div>
              <span className="font-medium">Origin Rate Area:</span> {record.raw_origin_rate_area}
            </div>
            <div>
              <span className="font-medium">Destination Rate Area:</span> {record.raw_destination_rate_area}
            </div>
            <div>
              <span className="font-medium">POE Code:</span> {record.raw_poe_code}
            </div>
            <div>
              <span className="font-medium">POD Code:</span> {record.raw_pod_code}
            </div>
            <div>
              <span className="font-medium">SCAC Code:</span> {record.raw_scac_code}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-red-800">Errors Found:</h4>
            {validationErrors.map((error: string, index: number) => (
              <div key={index} className="p-3 bg-red-50 border border-red-200 rounded">
                <div className="flex items-start gap-2">
                  <Badge variant="destructive" className="text-xs">
                    Error {index + 1}
                  </Badge>
                  <div className="flex-1">
                    <p className="text-sm text-red-800">{error}</p>
                    {getActionButtons(error)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ValidationErrorsDialog;
