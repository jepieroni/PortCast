
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBulkUploadReview } from '../hooks/useBulkUploadReview';
import ValidationErrorsDialog from './ValidationErrorsDialog';
import TranslationMappingDialog from './TranslationMappingDialog';
import NewRateAreaDialog from './NewRateAreaDialog';
import FieldEditDialog from './FieldEditDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface BulkUploadReviewProps {
  uploadSessionId: string;
  onBack: () => void;
  onComplete: () => void;
}

const BulkUploadReview = ({ uploadSessionId, onBack, onComplete }: BulkUploadReviewProps) => {
  const { toast } = useToast();
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [showTranslationDialog, setShowTranslationDialog] = useState(false);
  const [showNewRateAreaDialog, setShowNewRateAreaDialog] = useState(false);
  const [translationType, setTranslationType] = useState<'port' | 'rate_area'>('port');
  const [translationField, setTranslationField] = useState<string>('');
  const [hasRunInitialValidation, setHasRunInitialValidation] = useState(false);

  const {
    stagingData,
    validationSummary,
    isValidating,
    isProcessing,
    validateAllRecords,
    processValidShipments,
    refreshData
  } = useBulkUploadReview(uploadSessionId);

  // Run initial validation only once when component mounts and has data
  useEffect(() => {
    if (stagingData.length > 0 && !hasRunInitialValidation && !isValidating) {
      console.log('Running initial validation for', stagingData.length, 'records');
      setHasRunInitialValidation(true);
      validateAllRecords();
    }
  }, [stagingData.length, hasRunInitialValidation, isValidating, validateAllRecords]);

  // Helper function to safely get validation errors as array
  const getValidationErrors = (record: any): string[] => {
    if (!record.validation_errors) return [];
    if (Array.isArray(record.validation_errors)) return record.validation_errors;
    if (typeof record.validation_errors === 'string') {
      try {
        const parsed = JSON.parse(record.validation_errors);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [record.validation_errors];
      }
    }
    return [];
  };

  const getStatusBadge = (status: string, validationErrors: any) => {
    const errors = getValidationErrors({ validation_errors: validationErrors });
    if (status === 'valid') {
      return <Badge className="bg-green-100 text-green-800">Valid</Badge>;
    } else if (status === 'invalid') {
      return <Badge variant="destructive">Invalid</Badge>;
    } else {
      return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const handleShowErrors = (record: any) => {
    setSelectedRecord(record);
    setShowValidationDialog(true);
  };

  const handleCreateTranslation = (record: any, type: 'port' | 'rate_area', field: string) => {
    setSelectedRecord(record);
    setTranslationType(type);
    setTranslationField(field);
    setShowTranslationDialog(true);
  };

  const handleCreateRateArea = (record: any, field: string) => {
    setSelectedRecord(record);
    setTranslationField(field);
    setShowNewRateAreaDialog(true);
  };

  const handleProcessShipments = async () => {
    try {
      await processValidShipments();
      toast({
        title: "Success",
        description: `${validationSummary.valid} shipments processed successfully`
      });
      onComplete();
    } catch (error) {
      console.error('Process error:', error);
    }
  };

  const hasValidShipments = validationSummary.valid > 0;

  const handleBackClick = () => {
    // If there are valid shipments, the AlertDialog will handle this
    // Otherwise, go back directly
    if (!hasValidShipments) {
      onBack();
    }
  };

  if (isValidating && !hasRunInitialValidation) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Validating shipment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {hasValidShipments ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Upload
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Leave Upload Review?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You have {validationSummary.valid} validated shipment{validationSummary.valid !== 1 ? 's' : ''} ready to be processed. 
                    If you go back now, you'll lose this progress and need to upload again.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Stay on Page</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleProcessShipments}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isProcessing ? 'Processing...' : `Process ${validationSummary.valid} Shipments`}
                  </AlertDialogAction>
                  <AlertDialogAction
                    onClick={onBack}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Leave Without Processing
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button variant="outline" onClick={handleBackClick}>
              <ArrowLeft size={16} className="mr-2" />
              Back to Upload
            </Button>
          )}
          <h2 className="text-2xl font-bold">Review Upload</h2>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle size={20} className="text-green-600" />
              <span className="text-2xl font-bold text-green-600">{validationSummary.valid}</span>
            </div>
            <p className="text-sm text-gray-600">Valid Records</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <XCircle size={20} className="text-red-600" />
              <span className="text-2xl font-bold text-red-600">{validationSummary.invalid}</span>
            </div>
            <p className="text-sm text-gray-600">Invalid Records</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertTriangle size={20} className="text-yellow-600" />
              <span className="text-2xl font-bold text-yellow-600">{validationSummary.pending}</span>
            </div>
            <p className="text-sm text-gray-600">Pending Validation</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Shipment Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">GBL</th>
                  <th className="text-left p-2">Shipper</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Origin</th>
                  <th className="text-left p-2">Destination</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stagingData.map((record) => {
                  const validationErrors = getValidationErrors(record);
                  return (
                    <tr key={record.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        {getStatusBadge(record.validation_status, record.validation_errors)}
                      </td>
                      <td className="p-2 font-mono">{record.gbl_number}</td>
                      <td className="p-2">{record.shipper_last_name}</td>
                      <td className="p-2">{record.shipment_type}</td>
                      <td className="p-2">{record.raw_origin_rate_area}</td>
                      <td className="p-2">{record.raw_destination_rate_area}</td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          {validationErrors.length > 0 && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleShowErrors(record)}
                            >
                              View Errors
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons - Now below the table */}
      <div className="flex justify-center gap-4 pt-4">
        <Button 
          variant="outline" 
          onClick={() => validateAllRecords()}
          disabled={isValidating}
        >
          Re-validate
        </Button>
        <Button 
          onClick={handleProcessShipments}
          disabled={validationSummary.valid === 0 || isProcessing}
          className="bg-green-600 hover:bg-green-700"
        >
          {isProcessing ? 'Processing...' : `Process ${validationSummary.valid} Valid Shipments`}
        </Button>
      </div>

      {/* Dialogs */}
      <ValidationErrorsDialog
        isOpen={showValidationDialog}
        onClose={() => setShowValidationDialog(false)}
        record={selectedRecord}
        onCreateTranslation={handleCreateTranslation}
        onCreateRateArea={handleCreateRateArea}
      />

      <TranslationMappingDialog
        isOpen={showTranslationDialog}
        onClose={() => setShowTranslationDialog(false)}
        record={selectedRecord}
        type={translationType}
        field={translationField}
        onSuccess={refreshData}
      />

      <NewRateAreaDialog
        isOpen={showNewRateAreaDialog}
        onClose={() => setShowNewRateAreaDialog(false)}
        record={selectedRecord}
        field={translationField}
        onSuccess={refreshData}
      />
    </div>
  );
};

export default BulkUploadReview;
