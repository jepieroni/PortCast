
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileSpreadsheet, AlertCircle, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBulkUploadNew } from './hooks/useBulkUploadNew';
import { NewBulkUploadReview } from './components/NewBulkUploadReview';

interface BulkShipmentUploadProps {
  onBack: () => void;
}

const BulkShipmentUpload = ({ onBack }: BulkShipmentUploadProps) => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const {
    uploadFile,
    updateRecord,
    processValidRecords,
    loadStagingRecords,
    checkForStagingRecords,
    isUploading,
    uploadError,
    bulkState,
    hasStagingRecords,
    isCheckingStagingRecords,
    clearState
  } = useBulkUploadNew();

  // Check for staging records on component mount
  useEffect(() => {
    checkForStagingRecords();
  }, []);

  const validateFileType = (file: File) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    const allowedExtensions = ['.csv', '.xls', '.xlsx'];
    
    return allowedTypes.includes(file.type) || 
           allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  };

  const handleFileChange = (selectedFile: File) => {
    if (!validateFileType(selectedFile)) {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV or Excel file (.csv, .xls, .xlsx)",
        variant: "destructive"
      });
      return;
    }
    setFile(selectedFile);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      handleFileChange(selectedFile);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      handleFileChange(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    await uploadFile(file);
  };

  const handleLoadStagingRecords = async () => {
    await loadStagingRecords();
  };

  const handleBackToUpload = () => {
    clearState();
    setFile(null);
    // Re-check for staging records when returning to upload
    checkForStagingRecords();
  };

  const handleComplete = () => {
    clearState();
    setFile(null);
    onBack();
  };

  // Show review screen if we have bulk state
  if (bulkState) {
    return (
      <NewBulkUploadReview
        records={bulkState.records}
        summary={bulkState.summary}
        onUpdateRecord={updateRecord}
        onProcess={async () => {
          await processValidRecords();
          handleComplete();
        }}
        onBack={handleBackToUpload}
        isProcessing={isUploading}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          ← Back to Shipments
        </Button>
        <h2 className="text-2xl font-bold">Bulk Shipment Upload</h2>
      </div>

      {/* Warning message when staging records exist */}
      {hasStagingRecords && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-orange-600 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-orange-800">Previous Unprocessed Uploads Found</h3>
                <p className="text-orange-700 text-sm mt-1">
                  You have unprocessed shipments from previous uploads that must be reviewed and processed before uploading new files.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload size={20} />
              Upload File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File upload area - disabled when staging records exist */}
            <div 
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                hasStagingRecords 
                  ? 'border-gray-200 bg-gray-50 opacity-50' 
                  : isDragOver 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={!hasStagingRecords ? handleDragOver : undefined}
              onDragLeave={!hasStagingRecords ? handleDragLeave : undefined}
              onDrop={!hasStagingRecords ? handleDrop : undefined}
            >
              <input
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={handleInputChange}
                className="hidden"
                id="file-upload"
                disabled={hasStagingRecords}
              />
              <label htmlFor="file-upload" className={hasStagingRecords ? "cursor-not-allowed" : "cursor-pointer"}>
                <FileSpreadsheet size={48} className={`mx-auto mb-4 ${hasStagingRecords ? 'text-gray-300' : 'text-gray-400'}`} />
                <p className={`text-lg font-medium ${hasStagingRecords ? 'text-gray-400' : ''}`}>
                  {hasStagingRecords ? 'File upload disabled' : 'Choose file or drag and drop'}
                </p>
                <p className={`text-sm ${hasStagingRecords ? 'text-gray-400' : 'text-gray-500'}`}>
                  {hasStagingRecords ? 'Process previous uploads first' : 'CSV or Excel files (.csv, .xls, .xlsx)'}
                </p>
              </label>
            </div>
            
            {file && !hasStagingRecords && (
              <div className="bg-blue-50 p-3 rounded">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-600">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            )}

            {uploadError && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle size={16} />
                  <span className="font-medium">Upload Error</span>
                </div>
                <p className="text-red-600 text-sm mt-1">{uploadError}</p>
              </div>
            )}

            {/* Upload button - disabled when staging records exist */}
            <Button 
              onClick={handleUpload}
              disabled={!file || isUploading || hasStagingRecords}
              className="w-full"
            >
              {isUploading ? 'Processing...' : 'Upload and Review'}
            </Button>

            {/* Review previous uploads button */}
            <Button 
              onClick={handleLoadStagingRecords}
              disabled={!hasStagingRecords || isUploading || isCheckingStagingRecords}
              variant="outline"
              className="w-full border-orange-600 text-orange-600 hover:bg-orange-50"
            >
              <Database size={16} className="mr-2" />
              {isCheckingStagingRecords ? 'Checking...' : 
               isUploading ? 'Loading...' : 
               'Review Previous Unprocessed Uploads'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>File Format Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm space-y-2">
              <p className="font-medium">Required columns:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>gbl_number</li>
                <li>shipper_last_name</li>
                <li>shipment_type (I=Inbound, O=Outbound, T=Intertheater)</li>
                <li>origin_rate_area</li>
                <li>destination_rate_area</li>
                <li>pickup_date (YYYY-MM-DD)</li>
                <li>rdd (YYYY-MM-DD)</li>
                <li>poe_code (Port of Embarkation)</li>
                <li>pod_code (Port of Debarkation)</li>
                <li>scac_code</li>
              </ul>
              
              <p className="font-medium mt-4">Optional columns:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>estimated_cube</li>
                <li>actual_cube</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Note:</p>
                  <p className="text-yellow-700">
                    This system automatically detects and manages unprocessed uploads from previous sessions.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BulkShipmentUpload;
