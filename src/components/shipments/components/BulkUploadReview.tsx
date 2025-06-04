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
      // Helper function to safely parse integer values
      const parseIntegerValue = (value: any): number | null => {
        if (!value || value === '') return null;
        const parsed = parseInt(String(value));
        return isNaN(parsed) ? null : parsed;
      };

      // Helper function to get port code from port ID
      const getPortCodeFromId = (portId: string): string | null => {
        if (!portId) return null;
        const port = ports.find(p => p.id === portId);
        return port ? port.code : portId; // fallback to original value if not found
      };

      // Helper function to get SCAC code from TSP ID
      const getScacCodeFromTspId = (tspId: string): string | null => {
        if (!tspId) return null;
        const tsp = tsps.find(t => t.id === tspId);
        return tsp ? tsp.scac_code : tspId; // fallback to original value if not found
      };

      // Comprehensive field mapping - checking all possible form field names
      const mappedData = {
        // Basic info fields - check both camelCase and snake_case variants
        gbl_number: updatedData.gbl_number || updatedData.gblNumber || editingRecord.gbl_number,
        shipper_last_name: updatedData.shipper_last_name || updatedData.shipperLastName || editingRecord.shipper_last_name,
        shipment_type: updatedData.shipment_type || updatedData.shipmentType || editingRecord.shipment_type,
        
        // Date fields - these should already be in correct format from form
        pickup_date: updatedData.pickup_date || updatedData.pickupDate || editingRecord.pickup_date,
        rdd: updatedData.rdd || editingRecord.rdd,
        
        // Volume fields - parse all integer variants
        estimated_cube: parseIntegerValue(updatedData.estimated_cube || updatedData.estimatedCube),
        actual_cube: parseIntegerValue(updatedData.actual_cube || updatedData.actualCube),
        remaining_cube: parseIntegerValue(updatedData.remaining_cube || updatedData.remainingCube),
        
        // Rate areas - check both variants and fall back to existing values
        raw_origin_rate_area: updatedData.origin_rate_area || updatedData.originRateArea || editingRecord.raw_origin_rate_area,
        raw_destination_rate_area: updatedData.destination_rate_area || updatedData.destinationRateArea || editingRecord.raw_destination_rate_area,
        
        // Port codes - convert IDs back to codes for validation, with comprehensive fallbacks
        raw_poe_code: getPortCodeFromId(updatedData.target_poe_id || updatedData.targetPoeId) || editingRecord.raw_poe_code,
        raw_pod_code: getPortCodeFromId(updatedData.target_pod_id || updatedData.targetPodId) || editingRecord.raw_pod_code,
        
        // SCAC code - convert TSP ID back to SCAC code for validation
        raw_scac_code: getScacCodeFromTspId(updatedData.tsp_id || updatedData.tspId) || editingRecord.raw_scac_code,
        
        // Reset validation to trigger re-validation
        validation_status: 'pending',
        validation_errors: [],
        updated_at: new Date().toISOString()
      };

      console.log('Comprehensive mapped data for staging update:', mappedData);

      // Update the staging record with new values
      const { error: updateError } = await supabase
        .from('shipment_uploads_staging')
        .update(mappedData)
        .eq('id', editingRecord.id);

      if (updateError) throw updateError;

      // Mark this record as validating
      setValidatingRecords(prev => new Set(prev).add(editingRecord.id));

      // Close the edit dialog
      setEditingRecord(null);

      // Refresh data to get updated record
      await refreshData();

      // Trigger validation for the specific record after a short delay
      setTimeout(async () => {
        try {
          console.log('Triggering validation for updated record:', editingRecord.gbl_number);
          await validateAllRecords();
        } catch (error) {
          console.error('Error during validation:', error);
        } finally {
          // Remove from validating set
          setValidatingRecords(prev => {
            const newSet = new Set(prev);
            newSet.delete(editingRecord.id);
            return newSet;
          });
        }
      }, 500);

      toast({
        title: "Record updated",
        description: "Validation will run automatically"
      });

    } catch (error: any) {
      console.error('Error updating staging record:', error);
      
      // Remove from validating set on error
      setValidatingRecords(prev => {
        const newSet = new Set(prev);
        newSet.delete(editingRecord.id);
        return newSet;
      });
      
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
