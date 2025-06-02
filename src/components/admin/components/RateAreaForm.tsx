
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Country {
  id: string;
  name: string;
}

interface PortRegion {
  id: string;
  name: string;
}

interface RateAreaFormData {
  rate_area: string;
  name: string;
  country_id: string;
  region_id: string;
}

interface RateAreaFormProps {
  formData: RateAreaFormData;
  setFormData: (data: RateAreaFormData) => void;
  editingRateArea: any;
  countries: Country[];
  portRegions: PortRegion[];
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const RateAreaForm = ({
  formData,
  setFormData,
  editingRateArea,
  countries,
  portRegions,
  onSubmit,
  onCancel
}: RateAreaFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {editingRateArea ? 'Edit Rate Area' : 'Add Rate Area'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rate_area">Rate Area Code</Label>
            <Input
              id="rate_area"
              value={formData.rate_area}
              onChange={(e) => setFormData({ ...formData, rate_area: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country_id">Country</Label>
            <Select 
              value={formData.country_id} 
              onValueChange={(value) => setFormData({ ...formData, country_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.id} value={country.id}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="region_id">Port Region</Label>
            <Select 
              value={formData.region_id} 
              onValueChange={(value) => setFormData({ ...formData, region_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Port Region" />
              </SelectTrigger>
              <SelectContent>
                {portRegions.map((region) => (
                  <SelectItem key={region.id} value={region.id}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button type="submit">
              {editingRateArea ? 'Update' : 'Create'} Rate Area
            </Button>
            {editingRateArea && (
              <Button 
                type="button" 
                variant="outline"
                onClick={onCancel}
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

export default RateAreaForm;
