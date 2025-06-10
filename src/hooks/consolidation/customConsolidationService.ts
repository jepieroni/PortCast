
import { supabase } from '@/integrations/supabase/client';
import { DatabaseCustomConsolidation, CustomConsolidationGroup } from './customConsolidationTypes';

export const fetchCustomConsolidations = async (
  type: 'inbound' | 'outbound' | 'intertheater',
  userId?: string
): Promise<any[]> => {
  if (!userId) return [];

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
};

export const createCustomConsolidationInDB = async (
  customConsolidation: CustomConsolidationGroup,
  type: 'inbound' | 'outbound' | 'intertheater',
  userId: string
) => {
  console.log('🔄 Creating custom consolidation:', customConsolidation);

  // Get user's organization
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', userId)
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
    created_by: userId
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
  return data;
};

export const deleteCustomConsolidationFromDB = async (consolidationId: string) => {
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
};
