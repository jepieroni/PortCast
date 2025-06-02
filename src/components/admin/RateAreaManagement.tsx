
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { useShipmentData } from '@/components/shipment-registration/hooks/useShipmentData';
import { usePortRegions } from '@/hooks/usePortRegions';
import { useRateAreaRegions } from '@/hooks/useRateAreaRegions';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface RateAreaManagementProps {
  onBack: () => void;
}

const RateAreaManagement = ({ onBack }: RateAreaManagementProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { rateAreas } = useShipmentData();
  const { portRegions } = usePortRegions();
  const { rateAreaRegionMemberships } = useRateAreaRegions();
  const [editingRateArea, setEditingRateArea] = useState<any>(null);
  const [formData, setFormData] = useState({
    rate_area: '',
    name: '',
    country_id: '',
    region_id: ''
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

  const getRateAreaRegion = (rateAreaId: string) => {
    const membership = rateAreaRegionMemberships.find(m => m.rate_area_id === rateAreaId);
    return membership ? portRegions.find(r => r.id === membership.region_id) : null;
  };

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['shipment-data'] });
    queryClient.invalidateQueries({ queryKey: ['rate-area-region-memberships'] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Prepare rate area data (excluding region_id as it's not a column in rate_areas table)
      const rateAreaData = {
        rate_area: formData.rate_area,
        name: formData.name,
        country_id: formData.country_id,
        is_intertheater_only: false // Always set to false as requested
      };

      if (editingRateArea) {
        // Update existing rate area
        const { error } = await supabase
          .from('rate_areas')
          .update(rateAreaData)
          .eq('id', editingRateArea.id);
        
        if (error) throw error;

        // Handle region membership update
        if (formData.region_id) {
          // Delete existing membership for this rate area
          await supabase
            .from('rate_area_region_memberships')
            .delete()
            .eq('rate_area_id', editingRateArea.rate_area);
          
          // Add new membership
          await supabase
            .from('rate_area_region_memberships')
            .insert({ 
              rate_area_id: editingRateArea.rate_area, 
              region_id: formData.region_id 
            });
        } else {
          // If no region selected, remove any existing membership
          await supabase
            .from('rate_area_region_memberships')
            .delete()
            .eq('rate_area_id', editingRateArea.rate_area);
        }
        
        toast({ title: "Success", description: "Rate area updated successfully" });
      } else {
        // Create new rate area
        const { data: newRateArea, error } = await supabase
          .from('rate_areas')
          .insert(rateAreaData)
          .select()
          .single();
        
        if (error) throw error;

        // Add region membership if region was selected
        if (formData.region_id) {
          await supabase
            .from('rate_area_region_memberships')
            .insert({ 
              rate_area_id: newRateArea.rate_area, 
              region_id: formData.region_id 
            });
        }
        
        toast({ title: "Success", description: "Rate area created successfully" });
      }
      
      setEditingRateArea(null);
      setFormData({ rate_area: '', name: '', country_id: '', region_id: '' });
      refreshData();
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
    const region = getRateAreaRegion(rateArea.rate_area);
    setFormData({
      rate_area: rateArea.rate_area,
      name: rateArea.name || '',
      country_id: rateArea.country_id,
      region_id: region?.id || ''
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
      refreshData();
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

              <div className="space-y-2">
                <Label htmlFor="region_id">Port Region</Label>
                <Select value={formData.region_id} onValueChange={(value) => setFormData(prev => ({ ...prev, region_id: value }))}>
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
                    onClick={() => {
                      setEditingRateArea(null);
                      setFormData({ rate_area: '', name: '', country_id: '', region_id: '' });
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
              {rateAreas.map((rateArea) => {
                const region = getRateAreaRegion(rateArea.rate_area);
                return (
                  <div key={rateArea.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium">{rateArea.rate_area}</div>
                      <div className="text-sm text-gray-600">
                        {rateArea.name} | {rateArea.countries?.name} | 
                        {rateArea.is_conus ? ' CONUS' : ' Non-CONUS'}
                      </div>
                      {region && (
                        <div className="text-xs text-blue-600">
                          Region: {region.name}
                        </div>
                      )}
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
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RateAreaManagement;
