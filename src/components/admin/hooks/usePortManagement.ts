
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useShipmentData } from '@/components/shipment-registration/hooks/useShipmentData';
import { usePortRegions } from '@/hooks/usePortRegions';

export interface PortFormData {
  name: string;
  code: string;
  description: string;
  rate_area_id: string;
  region_id: string;
}

export const usePortManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { ports, rateAreas } = useShipmentData();
  const { portRegions, portRegionMemberships } = usePortRegions();
  const [editingPort, setEditingPort] = useState<any>(null);
  const [formData, setFormData] = useState<PortFormData>({
    name: '',
    code: '',
    description: '',
    rate_area_id: '',
    region_id: ''
  });

  const getPortRegion = (portId: string) => {
    const membership = portRegionMemberships.find(m => m.port_id === portId);
    return membership ? portRegions.find(r => r.id === membership.region_id) : null;
  };

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['shipment-data'] });
    queryClient.invalidateQueries({ queryKey: ['port-regions'] });
    queryClient.invalidateQueries({ queryKey: ['port-region-memberships'] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const portData = {
        name: formData.name,
        code: formData.code,
        description: formData.description || null,
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
      setFormData({ name: '', code: '', description: '', rate_area_id: '', region_id: '' });
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
      description: port.description || '',
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

  const cancelEdit = () => {
    setEditingPort(null);
    setFormData({ name: '', code: '', description: '', rate_area_id: '', region_id: '' });
  };

  return {
    ports,
    rateAreas,
    portRegions,
    editingPort,
    formData,
    setFormData,
    getPortRegion,
    refreshData,
    handleSubmit,
    handleEdit,
    handleDelete,
    cancelEdit
  };
};
