
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import RegionCreation from './RegionCreation';
import { PortFormData } from '../hooks/usePortManagement';
import { RateArea, PortRegion } from '@/components/shipment-registration/types';

interface PortFormProps {
  editingPort: any;
  formData: PortFormData;
  setFormData: React.Dispatch<React.SetStateAction<PortFormData>>;
  rateAreas: RateArea[];
  portRegions: PortRegion[];
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  cancelEdit: () => void;
  refreshData: () => void;
}

const PortForm = ({
  editingPort,
  formData,
  setFormData,
  rateAreas,
  portRegions,
  handleSubmit,
  cancelEdit,
  refreshData
}: PortFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {editingPort ? 'Edit Port' : 'Add Port'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Port Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="code">Port Code</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter port description..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rate_area_id">Rate Area</Label>
            <Select value={formData.rate_area_id} onValueChange={(value) => setFormData(prev => ({ ...prev, rate_area_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select Rate Area (Optional)" />
              </SelectTrigger>
              <SelectContent>
                {rateAreas.map((ra) => (
                  <SelectItem key={ra.rate_area} value={ra.rate_area}>
                    {ra.rate_area} - {ra.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="region_id">Port Region</Label>
              <RegionCreation 
                formData={formData}
                setFormData={setFormData}
                refreshData={refreshData}
              />
            </div>
            <Select value={formData.region_id} onValueChange={(value) => setFormData(prev => ({ ...prev, region_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select Port Region (Optional)" />
              </SelectTrigger>
              <SelectContent>
                {portRegions.map((region) => (
                  <SelectItem key={region.id} value={region.id}>
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{region.name}</span>
                      {region.description && (
                        <span className="text-sm text-gray-500 ml-2">{region.description}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button type="submit">
              {editingPort ? 'Update' : 'Create'} Port
            </Button>
            {editingPort && (
              <Button 
                type="button" 
                variant="outline"
                onClick={cancelEdit}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PortForm;
