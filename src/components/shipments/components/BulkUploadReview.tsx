
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBulkUploadReview } from '../hooks/useBulkUploadReview';
import TranslationMappingDialog from './TranslationMappingDialog';
import NewRateAreaDialog from './NewRateAreaDialog';
import AddPortFromReviewDialog from './AddPortFromReviewDialog';
import ValidationSummaryCards from './ValidationSummaryCards';
import ShipmentReviewTable from './ShipmentReviewTable';
import ReviewActionButtons from './ReviewActionButtons';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
  const [showTranslationDialog, setShowTranslationDialog] = useState(false);
  const [showNewRateAreaDialog, setShowNewRateAreaDialog] = useState(false);
  const [showAddPortDialog, setShowAddPortDialog] = useState(false);
  const [translationType, setTranslationType] = useState<'port' | 'rate_area'>('port');
  const [translationField, setTranslationField] = useState<string>('');
  const [hasRunInitialValidation, setHasRunInitialValidation] = useState(false);
  const [editingRecords, setEditingRecords] = useState<Record<string, any>>({});
  const [validatingRecords, setValidatingRecords] = useState<Set<string>>(new Set());

  const {
    stagingData,
    validationSummary,
    isValidating,
    isProcessing,
    validateAllRecords,
    processValidShipments,
    refreshData
  } = useBulkUploadReview(uploadSessionId);

  // Fetch reference data for dropdowns
  const { data: ports = [], refetch: refetchPorts } = useQuery({
    queryKey: ['ports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ports')
        .select('id, code, name, description')
        .order('code');
      if (error) throw error;
      return data;
    }
  });

  const { data: rateAreas = [] } = useQuery({
    queryKey: ['rate_areas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rate_areas')
        .select('rate_area, name, countries(name)')
        .order('rate_area');
      if (error) throw error;
      return data;
    }
  });

  const { data: tsps = [] } = useQuery({
    queryKey: ['tsps'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user!.id)
        .single();
      
      const { data, error } = await supabase
        .from('tsps')
        .select('id, name, scac_code')
        .eq('organization_id', profile!.organization_id)
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Run initial validation only once when component mounts and has data
  useEffect(() => {
    if (stagingData.length > 0 && !hasRunInitialValidation && !isValidating) {
      console.log('Running initial validation for', stagingData.length, 'records');
      setHasRunInitialValidation(true);
      validateAllRecords();
    }
  }, [stagingData.length, hasRunInitialValidation, isValidating, validateAllRecords]);

  // Helper function to check if pickup date needs attention
  const checkPickupDateWarning = (pickupDate: string): string | null => {
    if (!pickupDate) return null;
    
    const pickup = new Date(pickupDate);
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysFromNow = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
    
    if (pickup < thirtyDaysAgo) {
      return `Pickup date is more than 30 days in the past (${pickup.toLocaleDateString()})`;
    }
    if (pickup > sixtyDaysFromNow) {
      return `Pickup date is more than 60 days in the future (${pickup.toLocaleDateString()})`;
    }
    return null;
  };

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

  const getFieldValidationError = (record: any, field: string): string | null => {
    const errors = getValidationErrors(record);
    
    // Check for pickup date warnings
    if (field === 'pickup_date') {
      const dateWarning = checkPickupDateWarning(record.pickup_date);
      if (dateWarning) return dateWarning;
    }
    
    return errors.find(error => {
      const lowerError = error.toLowerCase();
      const lowerField = field.toLowerCase();
      
      if (field === 'gbl_number') return lowerError.includes('gbl');
      if (field === 'shipper_last_name') return lowerError.includes('shipper');
      if (field === 'shipment_type') return lowerError.includes('shipment type');
      if (field === 'raw_origin_rate_area') return lowerError.includes('origin') && lowerError.includes('rate area');
      if (field === 'raw_destination_rate_area') return lowerError.includes('destination') && lowerError.includes('rate area');
      if (field === 'raw_poe_code') return lowerError.includes('poe') || (lowerError.includes('port') && lowerError.includes('embarkation'));
      if (field === 'raw_pod_code') return lowerError.includes('pod') || (lowerError.includes('port') && lowerError.includes('debarkation'));
      if (field === 'raw_scac_code') return lowerError.includes('scac');
      if (field === 'pickup_date') return lowerError.includes('pickup');
      if (field === 'rdd') return lowerError.includes('rdd') || lowerError.includes('delivery');
      
      return false;
    }) || null;
  };

  // Enhanced function to check if field has any validation issues
  const hasFieldIssue = (record: any, field: string): boolean => {
    // Check for pickup date warnings
    if (field === 'pickup_date') {
      const dateWarning = checkPickupDateWarning(record.pickup_date);
      if (dateWarning) return true;
    }
    
    // Always allow editing if record is invalid
    if (record.validation_status === 'invalid') {
      const error = getFieldValidationError(record, field);
      // Show as editable if there's an error OR if the field is empty/null for required fields
      if (error) return true;
      
      // For rate area fields, also check if the value doesn't exist in our rate areas
      if ((field === 'raw_origin_rate_area' || field === 'raw_destination_rate_area') && record[field]) {
        const rateAreaExists = rateAreas.some(ra => ra.rate_area === record[field]);
        if (!rateAreaExists) return true;
      }
      
      // For port fields, check if the value doesn't exist in our ports
      if ((field === 'raw_poe_code' || field === 'raw_pod_code') && record[field]) {
        const portExists = ports.some(p => p.code === record[field]);
        if (!portExists) return true;
      }
    }
    
    return false;
  };

  const getEditingValue = (record: any, field: string) => {
    // If the field has been explicitly edited, use the edited value (even if empty)
    if (editingRecords[record.id] && field in editingRecords[record.id]) {
      return editingRecords[record.id][field];
    }
    // Otherwise, use the original record value
    return record[field] ?? '';
  };

  const updateEditingValue = (recordId: string, field: string, value: any) => {
    setEditingRecords(prev => ({
      ...prev,
      [recordId]: {
        ...prev[recordId],
        [field]: value
      }
    }));
  };

  const validateSingleRecord = async (record: any) => {
    const recordId = record.id;
    setValidatingRecords(prev => new Set(prev).add(recordId));

    try {
      // Get the edited values for this record
      const editedValues = editingRecords[recordId] || {};
      const updatedRecord = { ...record, ...editedValues };

      // Update the staging record with new values
      const { error: updateError } = await supabase
        .from('shipment_uploads_staging')
        .update({
          ...editedValues,
          validation_status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', recordId);

      if (updateError) throw updateError;

      // Refresh data to trigger re-validation
      await refreshData();

      toast({
        title: "Record updated",
        description: "Validation will run automatically"
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update record",
        variant: "destructive"
      });
    } finally {
      setValidatingRecords(prev => {
        const newSet = new Set(prev);
        newSet.delete(recordId);
        return newSet;
      });
    }
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
      <ValidationSummaryCards validationSummary={validationSummary} />

      {/* Data Table */}
      <ShipmentReviewTable
        stagingData={stagingData}
        ports={ports}
        rateAreas={rateAreas}
        tsps={tsps}
        validatingRecords={validatingRecords}
        getEditingValue={getEditingValue}
        updateEditingValue={updateEditingValue}
        getFieldValidationError={getFieldValidationError}
        hasFieldIssue={hasFieldIssue}
        validateSingleRecord={validateSingleRecord}
        onAddPortClick={() => setShowAddPortDialog(true)}
      />

      {/* Action Buttons */}
      <ReviewActionButtons
        validationSummary={validationSummary}
        isValidating={isValidating}
        isProcessing={isProcessing}
        onValidateAll={validateAllRecords}
        onProcessShipments={handleProcessShipments}
      />

      {/* Dialogs */}
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

      <AddPortFromReviewDialog
        isOpen={showAddPortDialog}
        onClose={() => setShowAddPortDialog(false)}
        onPortAdded={() => {
          refetchPorts();
          refreshData();
        }}
      />
    </div>
  );
};

export default BulkUploadReview;
