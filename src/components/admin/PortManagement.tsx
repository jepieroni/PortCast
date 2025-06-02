import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { ArrowLeft, Edit, Trash2, Plus, Search } from 'lucide-react';
import { useShipmentData } from '@/components/shipment-registration/hooks/useShipmentData';
import { usePortRegions } from '@/hooks/usePortRegions';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface PortManagementProps {
  onBack: () => void;
}

const PortManagement = ({ onBack }: PortManagementProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { ports, rateAreas } = useShipmentData();
  const { portRegions, portRegionMemberships } = usePortRegions();
  const [editingPort, setEditingPort] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    rate_area_id: '',
    region_id: ''
  });
  const [searchFilter, setSearchFilter] = useState('');
  const [newRegionData, setNewRegionData] = useState({
    name: '',
    description: ''
  });
  const [isCreatingRegion, setIsCreatingRegion] = useState(false);

  const getPortRegion = (portId: string) => {
    const membership = portRegionMemberships.find(m => m.port_id === portId);
    return membership ? portRegions.find(r => r.id === membership.region_id) : null;
  };

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['shipment-data'] });
    queryClient.invalidateQueries({ queryKey: ['port-regions'] });
    queryClient.invalidateQueries({ queryKey: ['port-region-memberships'] });
  };

  const handleCreateNewRegion = async () => {
    if (!newRegionData.name.trim()) {
      toast({
        title: "Error",
        description: "Region name is required",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingRegion(true);
    try {
      const { data: newRegion, error } = await supabase
        .from('port_regions')
        .insert(newRegionData)
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505' && error.message.includes('port_regions_name_unique')) {
          throw new Error('A port region with this name already exists. Please choose a different name.');
        }
        throw error;
      }

      setFormData(prev => ({ ...prev, region_id: newRegion.id }));
      setNewRegionData({ name: '', description: '' });
      toast({ title: "Success", description: "Port region created successfully" });
      refreshData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsCreatingRegion(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
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
        if (formData.region_id) {
          await supabase
            .from('port_region_memberships')
            .delete()
            .eq('port_id', editingPort.id);
          
          await supabase
            .from('port_region_memberships')
            .insert({ port_id: editingPort.id, region_id: formData.region_id });
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
        if (formData.region_id) {
          await supabase
            .from('port_region_memberships')
            .insert({ port_id: newPort.id, region_id: formData.region_id });
        }
        
        toast({ title: "Success", description: "Port created successfully" });
      }
      
      setEditingPort(null);
      setFormData({ name: '', code: '', rate_area_id: '', region_id: '' });
      refreshData();
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
      refreshData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const filteredPorts = ports.filter(port => 
    port.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

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
                <div className="flex items-center gap-2">
                  <Label htmlFor="region_id">Port Region</Label>
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Button type="button" variant="outline" size="sm">
                        <Plus size={14} className="mr-1" />
                        Create New
                      </Button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80 z-50 bg-white border shadow-lg">
                      <div className="space-y-4">
                        <h4 className="font-semibold">Create New Port Region</h4>
                        <div className="space-y-2">
                          <Label htmlFor="newRegionName">Name</Label>
                          <Input
                            id="newRegionName"
                            value={newRegionData.name}
                            onChange={(e) => setNewRegionData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Region name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newRegionDescription">Description</Label>
                          <Textarea
                            id="newRegionDescription"
                            value={newRegionData.description}
                            onChange={(e) => setNewRegionData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Region description (optional)"
                          />
                        </div>
                        <Button 
                          type="button" 
                          onClick={handleCreateNewRegion}
                          disabled={isCreatingRegion}
                          className="w-full"
                        >
                          {isCreatingRegion ? 'Creating...' : 'Create Region'}
                        </Button>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
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
                    onClick={() => {
                      setEditingPort(null);
                      setFormData({ name: '', code: '', rate_area_id: '', region_id: '' });
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
            <div className="flex items-center justify-between">
              <CardTitle>Existing Ports</CardTitle>
              <div className="flex items-center gap-2">
                <Search size={16} className="text-gray-500" />
                <Input
                  placeholder="Search ports..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-48"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {filteredPorts.map((port) => {
                const region = getPortRegion(port.id);
                return (
                  <div key={port.id} className="flex items-center justify-between p-2 border rounded text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{port.name} ({port.code})</div>
                      <div className="text-xs text-gray-600 truncate">
                        Rate Area: {port.rate_area_id || 'None'} | 
                        Region: {region?.name || 'None'}
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(port)} className="h-7 w-7 p-0">
                        <Edit size={12} />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleDelete(port.id)}
                        className="h-7 w-7 p-0"
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {filteredPorts.length === 0 && (
                <div className="text-center text-gray-500 py-4 text-sm">
                  {searchFilter ? 'No ports found matching your search.' : 'No ports found.'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PortManagement;
