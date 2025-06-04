
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

interface SidebarCardsProps {
  onBulkUploadClick?: () => void;
}

export const SidebarCards = ({ onBulkUploadClick }: SidebarCardsProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Upload</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Upload multiple shipments at once using a CSV or Excel file.
          </p>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={onBulkUploadClick}
          >
            <Upload size={16} className="mr-2" />
            Upload File
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>• GBL numbers must follow format XXXX9999999</p>
          <p>• Enter pieces/volume in either estimated OR actual fields</p>
          <p>• Actual fields enabled only when pickup date is today or past</p>
          <p>• Rate areas help with consolidation planning</p>
        </CardContent>
      </Card>
    </div>
  );
};
