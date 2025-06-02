
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { usePortRegions } from '@/hooks/usePortRegions';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface PortRegionManagementProps {
  onBack: () => void;
}

const PortRegionManagement = ({ onBack }: PortRegionManagementProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { portRegions } = usePortRegions();
  const [editingRegion, setEditingRegion] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['port-regions'] });
    queryClient.invalidateQueries({ queryKey: ['port-region-memberships'] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingRegion) {
        const { error } = await supabase
          .from('port_regions')
          .update(formData)
          .eq('id', editingRegion.id);
        
        if (error) {
          if (error.code === '23505' && error.message.includes('port_regions_name_unique')) {
            throw new Error('A port region with this name already exists. Please choose a different name.');
          }
          throw error;
        }
        toast({ title: "Success", description: "Port region updated successfully" });
      } else {
        const { error } = await supabase
          .from('port_regions')
          .insert(formData);
        
        if (error) {
          if (error.code === '23505' && error.message.includes('port_regions_name_unique')) {
            throw new Error('A port region with this name already exists. Please choose a different name.');
          }
          throw error;
        }
        toast({ title: "Success", description: "Port region created successfully" });
      }
      
      setEditingRegion(null);
      setFormData({ name: '', description: '' });
      refreshData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (region: any) => {
    setEditingRegion(region);
    setFormData({
      name: region.name,
      description: region.description || ''
    });
  };

  const handleDelete = async (regionId: string) => {
    if (!confirm('Are you sure you want to delete this port region?')) return;
    
    try {
      const { error } = await supabase
        .from('port_regions')
        .delete()
        .eq('id', regionId);
      
      if (error) throw error;
      toast({ title: "Success", description: "Port region deleted successfully" });
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
        <h2 className="text-2xl font-bold">Port Region Management</h2>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {editingRegion ? 'Edit Port Region' : 'Add Port Region'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingRegion ? 'Update' : 'Create'} Port Region
                </Button>
                {editingRegion && (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setEditingRegion(null);
                      setFormData({ name: '', description: '' });
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
            <CardTitle>Existing Port Regions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {portRegions.map((region) => (
                <div key={region.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">{region.name}</div>
                    {region.description && (
                      <div className="text-sm text-gray-600">{region.description}</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(region)}>
                      <Edit size={14} />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => handleDelete(region.id)}
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

export default PortRegionManagement;
