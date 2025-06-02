
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useShipmentData } from '@/components/shipment-registration/hooks/useShipmentData';
import { usePortRegions } from '@/hooks/usePortRegions';
import { useRateAreaRegions } from '@/hooks/useRateAreaRegions';

interface RateAreaFormData {
  rate_area: string;
  name: string;
  country_id: string;
  region_id: string;
}

export const useRateAreaManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { rateAreas } = useShipmentData();
  const { portRegions } = usePortRegions();
  const { rateAreaRegionMemberships } = useRateAreaRegions();
  const [editingRateArea, setEditingRateArea] = useState<any>(null);
  const [formData, setFormData] = useState<RateAreaFormData>({
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
    return membership ? portRegions.find(r => r.id === membership.region_id) || null : null;
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

  const handleCancel = () => {
    setEditingRateArea(null);
    setFormData({ rate_area: '', name: '', country_id: '', region_id: '' });
  };

  return {
    rateAreas,
    portRegions,
    countries,
    editingRateArea,
    formData,
    setFormData,
    getRateAreaRegion,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleCancel
  };
};
