
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { useShipmentData } from '@/components/shipment-registration/hooks/useShipmentData';
import { usePortRegions } from '@/hooks/usePortRegions';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PortManagementProps {
  onBack: () => void;
}

const PortManagement = ({ onBack }: PortManagementProps) => {
  const { toast } = useToast();
  const { ports, rateAreas } = useShipmentData();
  const { portRegions, portRegionMemberships } = usePortRegions();
  const [editingPort, setEditingPort] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    rate_area_id: '',
    region_id: ''
  });
  const [newRegionName, setNewRegionName] = useState('');

  const getPortRegion = (portId: string) => {
    const membership = portRegionMemberships.find(m => m.port_id === portId);
    return membership ? portRegions.find(r => r.id === membership.region_id) : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let regionId = formData.region_id;
      
      // Create new region if needed
      if (newRegionName && !regionId) {
        const { data: newRegion, error: regionError } = await supabase
          .from('port_regions')
          .insert({ name: newRegionName })
          .select()
          .single();
        
        if (regionError) throw regionError;
        regionId = newRegion.id;
      }

      const portData = {
        name: formData.name,
        code: formData.code,
        rate_area_id: formData.rate_area_id || null
      };

      if (editingPort) {
        const { error } = await supabase
          .from('ports')
          .update(portData)
          .eq('id', editingPort.id);
        
        if (error) throw error;
        
        // Update region membership
        if (regionId) {
          await supabase
            .from('port_region_memberships')
            .delete()
            .eq('port_id', editingPort.id);
          
          await supabase
            .from('port_region_memberships')
            .insert({ port_id: editingPort.id, region_id: regionId });
        }
        
        toast({ title: "Success", description: "Port updated successfully" });
      } else {
        const { data: newPort, error } = await supabase
          .from('ports')
          .insert(portData)
          .select()
          .single();
        
        if (error) throw error;
        
        // Add region membership
        if (regionId) {
          await supabase
            .from('port_region_memberships')
            .insert({ port_id: newPort.id, region_id: regionId });
        }
        
        toast({ title: "Success", description: "Port created successfully" });
      }
      
      setEditingPort(null);
      setFormData({ name: '', code: '', rate_area_id: '', region_id: '' });
      setNewRegionName('');
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (port: any) => {
    setEditingPort(port);
    const region = getPortRegion(port.id);
    setFormData({
      name: port.name,
      code: port.code,
      rate_area_id: port.rate_area_id || '',
      region_id: region?.id || ''
    });
  };

  const handleDelete = async (portId: string) => {
    if (!confirm('Are you sure you want to delete this port?')) return;
    
    try {
      const { error } = await supabase
        .from('ports')
        .delete()
        .eq('id', portId);
      
      if (error) throw error;
      toast({ title: "Success", description: "Port deleted successfully" });
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
        <h2 className="text-2xl font-bold">Port Management</h2>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
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
                <Label htmlFor="region_id">Port Region</Label>
                <Select value={formData.region_id} onValueChange={(value) => setFormData(prev => ({ ...prev, region_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Port Region (Optional)" />
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

              <div className="space-y-2">
                <Label htmlFor="newRegion">Or Create New Region</Label>
                <Input
                  id="newRegion"
                  placeholder="New region name"
                  value={newRegionName}
                  onChange={(e) => setNewRegionName(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingPort ? 'Update' : 'Create'} Port
                </Button>
                {editingPort && (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setEditingPort(null);
                      setFormData({ name: '', code: '', rate_area_id: '', region_id: '' });
                      setNewRegionName('');
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
            <CardTitle>Existing Ports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {ports.map((port) => {
                const region = getPortRegion(port.id);
                return (
                  <div key={port.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium">{port.name} ({port.code})</div>
                      <div className="text-sm text-gray-600">
                        Rate Area: {port.rate_area_id || 'None'} | 
                        Region: {region?.name || 'None'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(port)}>
                        <Edit size={14} />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleDelete(port.id)}
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

export default PortManagement;
