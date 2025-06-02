
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBulkUpload } from './hooks/useBulkUpload';
import BulkUploadReview from './components/BulkUploadReview';

interface BulkShipmentUploadProps {
  onBack: () => void;
}

const BulkShipmentUpload = ({ onBack }: BulkShipmentUploadProps) => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploadSessionId, setUploadSessionId] = useState<string | null>(null);
  
  const {
    uploadFile,
    isUploading,
    uploadError
  } = useBulkUpload();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV file",
          variant: "destructive"
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      const sessionId = await uploadFile(file);
      setUploadSessionId(sessionId);
      toast({
        title: "File uploaded successfully",
        description: "Please review and validate the shipment data"
      });
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  if (uploadSessionId) {
    return (
      <BulkUploadReview 
        uploadSessionId={uploadSessionId}
        onBack={() => setUploadSessionId(null)}
        onComplete={onBack}
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

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload size={20} />
              Upload CSV File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <FileSpreadsheet size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">Choose CSV file</p>
                <p className="text-sm text-gray-500">Click to select a CSV file with shipment data</p>
              </label>
            </div>
            
            {file && (
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

            <Button 
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="w-full"
            >
              {isUploading ? 'Uploading...' : 'Upload and Review'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>CSV Format Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm space-y-2">
              <p className="font-medium">Required columns:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>gbl_number</li>
                <li>shipper_last_name</li>
                <li>shipment_type (inbound/outbound/intertheater)</li>
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
                <li>remaining_cube</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Note:</p>
                  <p className="text-yellow-700">
                    Rate areas and port codes will be validated and may require mapping 
                    to your organization's format during the review process.
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
