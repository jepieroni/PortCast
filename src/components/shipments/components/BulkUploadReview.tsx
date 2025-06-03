import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, XCircle, AlertTriangle, ArrowLeft, CalendarIcon, AlertCircle, RefreshCw, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useBulkUploadReview } from '../hooks/useBulkUploadReview';
import { useFilteredPorts } from '@/hooks/useFilteredPorts';
import TranslationMappingDialog from './TranslationMappingDialog';
import NewRateAreaDialog from './NewRateAreaDialog';
import AddPortFromReviewDialog from './AddPortFromReviewDialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SearchableSelect } from '@/components/shipment-registration/components/SearchableSelect';
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

  const renderEditableField = (record: any, field: string, label: string) => {
    const error = getFieldValidationError(record, field);
    const isInvalid = record.validation_status === 'invalid';
    const hasIssue = hasFieldIssue(record, field);
    const value = getEditingValue(record, field);

    // For valid records or invalid records where this specific field has no issue, show read-only
    if (!isInvalid || !hasIssue) {
      // Special handling for port fields to show code - name format
      if (field === 'raw_poe_code' || field === 'raw_pod_code') {
        const port = ports.find(p => p.code === value);
        const displayValue = port ? `${port.code} - ${port.name}` : value || '-';
        return <span className="text-sm">{displayValue}</span>;
      }
      
      return (
        <span className="text-sm">
          {field === 'pickup_date' || field === 'rdd' 
            ? (value ? format(new Date(value), 'yyyy-MM-dd') : '') 
            : value || '-'}
        </span>
      );
    }

    // For invalid records where this field has an issue, show editable input
    const inputClassName = `h-8 text-xs border-red-500 bg-red-50`;

    // Date fields
    if (field === 'pickup_date' || field === 'rdd') {
      const dateValue = value ? new Date(value) : undefined;
      return (
        <div className="flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className={`h-8 text-xs justify-start ${inputClassName}`}
              >
                <CalendarIcon className="mr-1 h-3 w-3" />
                {dateValue ? format(dateValue, 'yyyy-MM-dd') : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateValue}
                onSelect={(date) => updateEditingValue(record.id, field, date ? format(date, 'yyyy-MM-dd') : '')}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {error && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertCircle size={14} className="text-red-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{error}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    }

    // Shipment type
    if (field === 'shipment_type') {
      return (
        <div className="flex items-center gap-1">
          <Select value={value} onValueChange={(val) => updateEditingValue(record.id, field, val)}>
            <SelectTrigger className={inputClassName}>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="I">Inbound</SelectItem>
              <SelectItem value="O">Outbound</SelectItem>
              <SelectItem value="T">Intertheater</SelectItem>
            </SelectContent>
          </Select>
          {error && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertCircle size={14} className="text-red-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{error}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    }

    // Port fields with SearchableSelect and Add Port option - with filtering
    if (field === 'raw_poe_code' || field === 'raw_pod_code') {
      // Get the corresponding rate area for filtering
      const rateAreaField = field === 'raw_poe_code' ? 'raw_origin_rate_area' : 'raw_destination_rate_area';
      const selectedRateArea = getEditingValue(record, rateAreaField);
      
      // Filter ports based on rate area selection
      const filteredPorts = useFilteredPorts(ports, selectedRateArea);
      
      const portOptions = filteredPorts.map(port => ({
        value: port.code,
        label: `${port.code} - ${port.name}`,
        searchableText: `${port.code} ${port.name} ${port.description || ''}`
      }));

      return (
        <div className="flex items-center gap-1">
          <div className="min-w-[180px]">
            <SearchableSelect
              label=""
              value={value}
              onChange={(val) => updateEditingValue(record.id, field, val)}
              placeholder={!selectedRateArea ? "Select rate area first" : "Search ports..."}
              options={portOptions}
              error=""
              onFocus={() => {}}
              className="w-full [&>div]:border-red-500 [&>div]:bg-red-50"
              disabled={!selectedRateArea}
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddPortDialog(true)}
            className="h-8 px-2"
            title="Add new port"
          >
            <Plus size={14} />
          </Button>
          {error && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertCircle size={14} className="text-red-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{error}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    }

    // Rate area fields
    if (field === 'raw_origin_rate_area' || field === 'raw_destination_rate_area') {
      return (
        <div className="flex items-center gap-1">
          <Select value={value} onValueChange={(val) => updateEditingValue(record.id, field, val)}>
            <SelectTrigger className={inputClassName}>
              <SelectValue placeholder="Area" />
            </SelectTrigger>
            <SelectContent>
              {rateAreas.map((area) => (
                <SelectItem key={area.rate_area} value={area.rate_area}>
                  {area.rate_area} - {area.name || area.countries?.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertCircle size={14} className="text-red-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{error}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    }

    // SCAC code
    if (field === 'raw_scac_code') {
      return (
        <div className="flex items-center gap-1">
          <Select value={value} onValueChange={(val) => updateEditingValue(record.id, field, val)}>
            <SelectTrigger className={inputClassName}>
              <SelectValue placeholder="SCAC" />
            </SelectTrigger>
            <SelectContent>
              {tsps.map((tsp) => (
                <SelectItem key={tsp.id} value={tsp.scac_code}>
                  {tsp.scac_code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertCircle size={14} className="text-red-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{error}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    }

    // Default text input
    return (
      <div className="flex items-center gap-1">
        <Input
          value={value}
          onChange={(e) => updateEditingValue(record.id, field, e.target.value)}
          className={inputClassName}
          placeholder={label}
        />
        {error && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <AlertCircle size={14} className="text-red-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{error}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
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
                  <th className="text-left p-2">POE</th>
                  <th className="text-left p-2">POD</th>
                  <th className="text-left p-2">SCAC</th>
                  <th className="text-left p-2">Pickup</th>
                  <th className="text-left p-2">RDD</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stagingData.map((record) => {
                  const isValidating = validatingRecords.has(record.id);
                  return (
                    <tr key={record.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        {getStatusBadge(record.validation_status, record.validation_errors)}
                      </td>
                      <td className="p-2">
                        {renderEditableField(record, 'gbl_number', 'GBL Number')}
                      </td>
                      <td className="p-2">
                        {renderEditableField(record, 'shipper_last_name', 'Shipper Name')}
                      </td>
                      <td className="p-2">
                        {renderEditableField(record, 'shipment_type', 'Type')}
                      </td>
                      <td className="p-2">
                        {renderEditableField(record, 'raw_origin_rate_area', 'Origin')}
                      </td>
                      <td className="p-2">
                        {renderEditableField(record, 'raw_destination_rate_area', 'Destination')}
                      </td>
                      <td className="p-2">
                        {renderEditableField(record, 'raw_poe_code', 'POE')}
                      </td>
                      <td className="p-2">
                        {renderEditableField(record, 'raw_pod_code', 'POD')}
                      </td>
                      <td className="p-2">
                        {renderEditableField(record, 'raw_scac_code', 'SCAC')}
                      </td>
                      <td className="p-2">
                        {renderEditableField(record, 'pickup_date', 'Pickup Date')}
                      </td>
                      <td className="p-2">
                        {renderEditableField(record, 'rdd', 'RDD')}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          {record.validation_status === 'invalid' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => validateSingleRecord(record)}
                              disabled={isValidating}
                              className="h-8"
                            >
                              {isValidating ? (
                                <RefreshCw size={14} className="animate-spin" />
                              ) : (
                                'Re-validate'
                              )}
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

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 pt-4">
        <Button 
          variant="outline" 
          onClick={() => validateAllRecords()}
          disabled={isValidating}
        >
          Re-validate All
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
