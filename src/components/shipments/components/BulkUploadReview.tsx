
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useBulkUploadReview } from '../hooks/useBulkUploadReview';
import TranslationMappingDialog from './TranslationMappingDialog';
import NewRateAreaDialog from './NewRateAreaDialog';
import AddPortFromReviewDialog from './AddPortFromReviewDialog';
import ValidationSummaryCards from './ValidationSummaryCards';
import SimplifiedReviewTable from './SimplifiedReviewTable';
import BulkUploadHeader from './BulkUploadHeader';
import BulkUploadActions from './BulkUploadActions';
import ShipmentEditModal from './ShipmentEditModal';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  const [validatingRecords, setValidatingRecords] = useState<Set<string>>(new Set());
  const [editingRecord, setEditingRecord] = useState<any>(null);

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

  const handleViewEditClick = (record: any) => {
    console.log('Opening edit dialog for record:', record.gbl_number);
    setEditingRecord(record);
  };

  const handleEditComplete = async (updatedData: any) => {
    if (!editingRecord) return;

    console.log('Updating staging record with new data:', updatedData);
    
    try {
      // Update the staging record with new values
      const { error: updateError } = await supabase
        .from('shipment_uploads_staging')
        .update({
          gbl_number: updatedData.gblNumber,
          shipper_last_name: updatedData.shipperLastName,
          shipment_type: updatedData.shipmentType,
          pickup_date: updatedData.pickupDate,
          rdd: updatedData.rdd,
          estimated_cube: updatedData.estimatedCube,
          actual_cube: updatedData.actualCube,
          raw_origin_rate_area: updatedData.originRateArea,
          raw_destination_rate_area: updatedData.destinationRateArea,
          raw_poe_code: updatedData.targetPoeId,
          raw_pod_code: updatedData.targetPodId,
          raw_scac_code: updatedData.tspId,
          validation_status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', editingRecord.id);

      if (updateError) throw updateError;

      // Mark this record as validating
      setValidatingRecords(prev => new Set(prev).add(editingRecord.id));

      // Close the edit dialog
      setEditingRecord(null);

      // Refresh data to trigger re-validation
      await refreshData();

      // Remove from validating set after a delay (validation should complete by then)
      setTimeout(() => {
        setValidatingRecords(prev => {
          const newSet = new Set(prev);
          newSet.delete(editingRecord.id);
          return newSet;
        });
      }, 3000);

      toast({
        title: "Record updated",
        description: "Validation will run automatically"
      });

    } catch (error: any) {
      console.error('Error updating staging record:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update record",
        variant: "destructive"
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
      <BulkUploadHeader
        validationSummary={validationSummary}
        isProcessing={isProcessing}
        onBack={onBack}
        onProcessShipments={handleProcessShipments}
      />

      <ValidationSummaryCards validationSummary={validationSummary} />

      <SimplifiedReviewTable
        stagingData={stagingData}
        validatingRecords={validatingRecords}
        onViewEditClick={handleViewEditClick}
      />

      <BulkUploadActions
        validationSummary={validationSummary}
        isProcessing={isProcessing}
        onProcessShipments={handleProcessShipments}
      />

      <ShipmentEditModal
        editingRecord={editingRecord}
        onEditComplete={handleEditComplete}
        onCancel={() => setEditingRecord(null)}
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
