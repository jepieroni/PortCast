
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { useShipmentData } from '@/components/shipment-registration/hooks/useShipmentData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

interface RateAreaManagementProps {
  onBack: () => void;
}

const RateAreaManagement = ({ onBack }: RateAreaManagementProps) => {
  const { toast } = useToast();
  const { rateAreas } = useShipmentData();
  const [editingRateArea, setEditingRateArea] = useState<any>(null);
  const [formData, setFormData] = useState({
    rate_area: '',
    name: '',
    country_id: '',
    is_conus: false
  });

  // Fetch countries for dropdown
  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const rateAreaData = {
        ...formData,
        is_intertheater_only: false // Always set to false as requested
      };

      if (editingRateArea) {
        const { error } = await supabase
          .from('rate_areas')
          .update(rateAreaData)
          .eq('id', editingRateArea.id);
        
        if (error) throw error;
        toast({ title: "Success", description: "Rate area updated successfully" });
      } else {
        const { error } = await supabase
          .from('rate_areas')
          .insert(rateAreaData);
        
        if (error) throw error;
        toast({ title: "Success", description: "Rate area created successfully" });
      }
      
      setEditingRateArea(null);
      setFormData({ rate_area: '', name: '', country_id: '', is_conus: false });
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (rateArea: any) => {
    setEditingRateArea(rateArea);
    setFormData({
      rate_area: rateArea.rate_area,
      name: rateArea.name || '',
      country_id: rateArea.country_id,
      is_conus: rateArea.is_conus
    });
  };

  const handleDelete = async (rateAreaId: string) => {
    if (!confirm('Are you sure you want to delete this rate area?')) return;
    
    try {
      const { error } = await supabase
        .from('rate_areas')
        .delete()
        .eq('id', rateAreaId);
      
      if (error) throw error;
      toast({ title: "Success", description: "Rate area deleted successfully" });
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft size={16} className="mr-2" />
          Back to Admin Dashboard
        </Button>
        <h2 className="text-2xl font-bold">Rate Area Management</h2>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {editingRateArea ? 'Edit Rate Area' : 'Add Rate Area'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rate_area">Rate Area Code</Label>
                <Input
                  id="rate_area"
                  value={formData.rate_area}
                  onChange={(e) => setFormData(prev => ({ ...prev, rate_area: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country_id">Country</Label>
                <Select value={formData.country_id} onValueChange={(value) => setFormData(prev => ({ ...prev, country_id: value }))}>
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

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_conus"
                  checked={formData.is_conus}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_conus: !!checked }))}
                />
                <Label htmlFor="is_conus">Is CONUS</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingRateArea ? 'Update' : 'Create'} Rate Area
                </Button>
                {editingRateArea && (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setEditingRateArea(null);
                      setFormData({ rate_area: '', name: '', country_id: '', is_conus: false });
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Existing Rate Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {rateAreas.map((rateArea) => (
                <div key={rateArea.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">{rateArea.rate_area}</div>
                    <div className="text-sm text-gray-600">
                      {rateArea.name} | {rateArea.countries?.name} | 
                      {rateArea.is_conus ? ' CONUS' : ' Non-CONUS'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(rateArea)}>
                      <Edit size={14} />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => handleDelete(rateArea.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RateAreaManagement;
