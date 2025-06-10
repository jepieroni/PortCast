
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { ConsolidationGroup } from './consolidation/types';
import { usePortRegions } from './usePortRegions';

export interface DatabaseCustomConsolidation {
  id: string;
  organization_id: string;
  consolidation_type: 'inbound' | 'outbound' | 'intertheater';
  origin_port_id?: string;
  origin_region_id?: string;
  destination_port_id?: string;
  destination_region_id?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CustomConsolidationGroup extends ConsolidationGroup {
  is_custom: true;
  custom_type: 'port_to_region' | 'region_to_port' | 'region_to_region' | 'port_to_port';
  origin_region_id?: string;
  origin_region_name?: string;
  destination_region_id?: string;
  destination_region_name?: string;
  combined_from: ConsolidationGroup[];
  shipment_details: any[];
  custom_id: string;
  db_id?: string; // Database ID for persistence
}

export const useCustomConsolidations = (type: 'inbound' | 'outbound' | 'intertheater') => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { portRegions, portRegionMemberships } = usePortRegions();

  // Fetch custom consolidations from database
  const { data: dbCustomConsolidations, isLoading } = useQuery({
    queryKey: ['custom-consolidations', type, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('custom_consolidations')
        .select(`
          *,
          origin_port:ports!custom_consolidations_origin_port_id_fkey(*),
          destination_port:ports!custom_consolidations_destination_port_id_fkey(*),
          origin_region:port_regions!custom_consolidations_origin_region_id_fkey(*),
          destination_region:port_regions!custom_consolidations_destination_region_id_fkey(*)
        `)
        .eq('consolidation_type', type);

      if (error) {
        console.error('Error fetching custom consolidations:', error);
        throw error;
      }

      console.log(`📊 Fetched ${data?.length || 0} custom consolidations for ${type}`);
      return data || [];
    },
    enabled: !!user?.id
  });

  // Create custom consolidation mutation
  const createCustomConsolidation = useMutation({
    mutationFn: async (customConsolidation: CustomConsolidationGroup) => {
      if (!user?.id) throw new Error('User not authenticated');

      console.log('🔄 Creating custom consolidation:', customConsolidation);

      // Get user's organization
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.organization_id) {
        throw new Error('User organization not found');
      }

      const dbData = {
        organization_id: profile.organization_id,
        consolidation_type: type,
        origin_port_id: customConsolidation.origin_region_id ? null : customConsolidation.poe_id,
        origin_region_id: customConsolidation.origin_region_id || null,
        destination_port_id: customConsolidation.destination_region_id ? null : customConsolidation.pod_id,
        destination_region_id: customConsolidation.destination_region_id || null,
        created_by: user.id
      };

      console.log('💾 Saving custom consolidation data:', dbData);

      const { data, error } = await supabase
        .from('custom_consolidations')
        .insert([dbData])
        .select()
        .single();

      if (error) {
        console.error('Error creating custom consolidation:', error);
        throw error;
      }

      console.log('✅ Created custom consolidation in database:', data.id);

      // TODO: In a future iteration, we should also save the membership relationships
      // between the custom consolidation and the original consolidations that were combined
      // This would involve creating records in custom_consolidation_memberships table

      return data;
    },
    onSuccess: () => {
      console.log('🔄 Invalidating custom consolidations cache');
      queryClient.invalidateQueries({ queryKey: ['custom-consolidations', type] });
    },
    onError: (error) => {
      console.error('❌ Failed to create custom consolidation:', error);
    }
  });

  // Delete custom consolidation mutation
  const deleteCustomConsolidation = useMutation({
    mutationFn: async (consolidationId: string) => {
      console.log('🗑️ Deleting custom consolidation:', consolidationId);

      const { error } = await supabase
        .from('custom_consolidations')
        .delete()
        .eq('id', consolidationId);

      if (error) {
        console.error('Error deleting custom consolidation:', error);
        throw error;
      }

      console.log('✅ Deleted custom consolidation:', consolidationId);
    },
    onSuccess: () => {
      console.log('🔄 Invalidating custom consolidations cache after deletion');
      queryClient.invalidateQueries({ queryKey: ['custom-consolidations', type] });
    },
    onError: (error) => {
      console.error('❌ Failed to delete custom consolidation:', error);
    }
  });

  // Convert database custom consolidations to UI format
  const convertDbToUIFormat = useCallback((dbConsolidations: any[]): CustomConsolidationGroup[] => {
    return dbConsolidations.map(dbConsolidation => {
      const originPort = dbConsolidation.origin_port;
      const destinationPort = dbConsolidation.destination_port;
      const originRegion = dbConsolidation.origin_region;
      const destinationRegion = dbConsolidation.destination_region;

      // Determine custom type
      let customType: CustomConsolidationGroup['custom_type'];
      let poe_name: string, poe_code: string, pod_name: string, pod_code: string;

      if (originRegion && destinationRegion) {
        customType = 'region_to_region';
        poe_name = `Region: ${originRegion.name}`;
        poe_code = '';
        pod_name = `Region: ${destinationRegion.name}`;
        pod_code = '';
      } else if (originRegion && destinationPort) {
        customType = 'region_to_port';
        poe_name = `Region: ${originRegion.name}`;
        poe_code = '';
        pod_name = destinationPort.name;
        pod_code = destinationPort.code;
      } else if (originPort && destinationRegion) {
        customType = 'port_to_region';
        poe_name = originPort.name;
        poe_code = originPort.code;
        pod_name = `Region: ${destinationRegion.name}`;
        pod_code = '';
      } else {
        customType = 'port_to_port';
        poe_name = originPort?.name || '';
        poe_code = originPort?.code || '';
        pod_name = destinationPort?.name || '';
        pod_code = destinationPort?.code || '';
      }

      return {
        poe_id: originPort?.id || dbConsolidation.origin_port_id || '',
        poe_name,
        poe_code,
        pod_id: destinationPort?.id || dbConsolidation.destination_port_id || '',
        pod_name,
        pod_code,
        shipment_count: 0, // Will be calculated from actual shipments
        total_cube: 0, // Will be calculated from actual shipments
        has_user_shipments: false, // Will be determined from actual shipments
        is_custom: true,
        custom_type: customType,
        origin_region_id: dbConsolidation.origin_region_id,
        origin_region_name: originRegion?.name,
        destination_region_id: dbConsolidation.destination_region_id,
        destination_region_name: destinationRegion?.name,
        combined_from: [], // This will need to be reconstructed or stored separately
        shipment_details: [],
        custom_id: dbConsolidation.id,
        db_id: dbConsolidation.id
      } as CustomConsolidationGroup;
    });
  }, []);

  const customConsolidations = dbCustomConsolidations ? convertDbToUIFormat(dbCustomConsolidations) : [];

  return {
    customConsolidations,
    isLoading,
    createCustomConsolidation: createCustomConsolidation.mutate,
    deleteCustomConsolidation: deleteCustomConsolidation.mutate,
    isCreating: createCustomConsolidation.isPending,
    isDeleting: deleteCustomConsolidation.isPending
  };
};
