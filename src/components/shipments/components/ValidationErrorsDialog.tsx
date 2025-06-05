
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Plus, Link, Edit, AlertTriangle } from 'lucide-react';

interface ValidationErrorsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
  onCreateTranslation: (record: any, type: 'port' | 'rate_area', field: string) => void;
  onCreateRateArea: (record: any, field: string) => void;
  onEditField: (record: any, field: string) => void;
}

const ValidationErrorsDialog = ({ 
  isOpen, 
  onClose, 
  record, 
  onCreateTranslation,
  onCreateRateArea,
  onEditField
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

  // Helper function to safely get warnings as array
  const getValidationWarnings = (): string[] => {
    if (!record.warnings) return [];
    if (Array.isArray(record.warnings)) return record.warnings;
    return [];
  };

  const validationErrors = getValidationErrors();
  const validationWarnings = getValidationWarnings();

  const getActionButtons = (error: string) => {
    // Rate area errors
    if (error.includes('Rate area') && error.includes('not found')) {
      const isOrigin = error.includes(record.raw_origin_rate_area);
      const field = isOrigin ? 'raw_origin_rate_area' : 'raw_destination_rate_area';
      
      return (
        <div className="flex gap-2 mt-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEditField(record, field)}
          >
            <Edit size={14} className="mr-1" />
            Edit Value
          </Button>
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

    // Port code errors
    if (error.includes('Port code') && error.includes('not found')) {
      const isPOE = error.includes(record.raw_poe_code);
      const field = isPOE ? 'raw_poe_code' : 'raw_pod_code';
      
      return (
        <div className="flex gap-2 mt-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEditField(record, field)}
          >
            <Edit size={14} className="mr-1" />
            Edit Value
          </Button>
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

    // Required field errors
    if (error.includes('is required')) {
      let field = '';
      if (error.includes('GBL number')) field = 'gbl_number';
      else if (error.includes('Shipper last name')) field = 'shipper_last_name';
      else if (error.includes('Shipment type')) field = 'shipment_type';
      else if (error.includes('Pickup date')) field = 'pickup_date';
      else if (error.includes('RDD')) field = 'rdd';
      else if (error.includes('poe code') || error.includes('pod code')) {
        field = error.toLowerCase().includes('poe') ? 'raw_poe_code' : 'raw_pod_code';
      }
      else if (error.includes('origin rate area') || error.includes('raw_origin_rate_area')) field = 'raw_origin_rate_area';
      else if (error.includes('destination rate area') || error.includes('raw_destination_rate_area')) field = 'raw_destination_rate_area';
      else if (error.includes('SCAC code')) field = 'raw_scac_code';

      if (field) {
        return (
          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEditField(record, field)}
            >
              <Edit size={14} className="mr-1" />
              Add Missing Value
            </Button>
          </div>
        );
      }
    }

    // SCAC code errors
    if (error.includes('SCAC code') && error.includes('not found')) {
      return (
        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEditField(record, 'raw_scac_code')}
          >
            <Edit size={14} className="mr-1" />
            Edit SCAC Code
          </Button>
        </div>
      );
    }

    // Date validation errors
    if (error.includes('date') && (error.includes('format') || error.includes('Invalid'))) {
      const field = error.toLowerCase().includes('pickup') ? 'pickup_date' : 'rdd';
      return (
        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEditField(record, field)}
          >
            <Edit size={14} className="mr-1" />
            Fix Date
          </Button>
        </div>
      );
    }

    // Date logic errors
    if (error.includes('Pickup date cannot be after RDD')) {
      return (
        <div className="flex gap-2 mt-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEditField(record, 'pickup_date')}
          >
            <Edit size={14} className="mr-1" />
            Edit Pickup Date
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEditField(record, 'rdd')}
          >
            <Edit size={14} className="mr-1" />
            Edit RDD
          </Button>
        </div>
      );
    }

    // GBL format errors
    if (error.includes('GBL Number must be in format')) {
      return (
        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEditField(record, 'gbl_number')}
          >
            <Edit size={14} className="mr-1" />
            Fix GBL Format
          </Button>
        </div>
      );
    }

    // Default edit button for any other errors
    return (
      <div className="flex gap-2 mt-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEditField(record, 'gbl_number')}
        >
          <Edit size={14} className="mr-1" />
          Edit Record
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {validationErrors.length > 0 && <AlertCircle size={20} className="text-red-600" />}
            {validationErrors.length === 0 && validationWarnings.length > 0 && <AlertTriangle size={20} className="text-yellow-600" />}
            {validationErrors.length > 0 ? 'Validation Errors' : 'Validation Warnings'} - GBL {record.gbl_number}
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
            <div>
              <span className="font-medium">Pickup Date:</span> {record.pickup_date}
            </div>
            <div>
              <span className="font-medium">RDD:</span> {record.rdd}
            </div>
          </div>

          {validationErrors.length > 0 && (
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
          )}

          {validationWarnings.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-yellow-800">Warnings:</h4>
              {validationWarnings.map((warning: string, index: number) => (
                <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="flex items-start gap-2">
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">
                      Warning {index + 1}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm text-yellow-800">{warning}</p>
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEditField(record, 'pickup_date')}
                          className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                        >
                          <Edit size={14} className="mr-1" />
                          Edit Pickup Date
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ValidationErrorsDialog;
