
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSampleDataGenerator } from './hooks/useSampleDataGenerator';

const SampleDataGenerator = () => {
  const { toast } = useToast();
  const [rowCount, setRowCount] = useState(10);
  const [fileName, setFileName] = useState('sample_shipments.csv');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { generateSampleData } = useSampleDataGenerator();

  const handleGenerate = async () => {
    if (rowCount < 1 || rowCount > 20) {
      toast({
        title: "Invalid row count",
        description: "Please enter a number between 1 and 20",
        variant: "destructive"
      });
      return;
    }

    if (!fileName.trim()) {
      toast({
        title: "Invalid filename",
        description: "Please enter a filename",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const csvData = await generateSampleData(rowCount);
      
      // Create and download the file
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName.endsWith('.csv') ? fileName : `${fileName}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "File generated successfully",
        description: `Generated ${rowCount} sample shipment records`
      });
    } catch (error: any) {
      console.error('Error generating sample data:', error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate sample data",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet size={20} />
          Generate Sample Bulk Upload File
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="rowCount">Number of Rows</Label>
            <Input
              id="rowCount"
              type="number"
              min="1"
              max="20"
              value={rowCount}
              onChange={(e) => setRowCount(parseInt(e.target.value) || 0)}
              placeholder="Enter number of rows"
            />
            <p className="text-sm text-gray-500 mt-1">Maximum: 20 rows</p>
          </div>
          <div>
            <Label htmlFor="fileName">File Name</Label>
            <Input
              id="fileName"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="sample_shipments.csv"
            />
            <p className="text-sm text-gray-500 mt-1">.csv extension will be added automatically</p>
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Generated Data Includes:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Realistic GBL numbers (4 letters + 7 digits)</li>
            <li>• Random American surnames</li>
            <li>• Appropriate rate areas based on shipment type</li>
            <li>• Port assignments based on rate area regions</li>
            <li>• Pickup dates within 2 weeks before to 4 weeks after today</li>
            <li>• Required delivery dates (45-90 days after pickup)</li>
            <li>• Volume data based on pickup date timing</li>
          </ul>
        </div>

        <Button 
          onClick={handleGenerate}
          disabled={isGenerating || rowCount < 1}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generating...
            </>
          ) : (
            <>
              <Download size={16} className="mr-2" />
              Generate & Download CSV
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SampleDataGenerator;
