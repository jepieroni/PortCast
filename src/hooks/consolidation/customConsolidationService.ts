
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

  return data || [];
};

export const createCustomConsolidationInDB = async (
  customConsolidation: CustomConsolidationGroup,
  type: 'inbound' | 'outbound' | 'intertheater',
  userId: string
) => {
  console.log('💾 [DB-SERVICE] createCustomConsolidationInDB called');
  console.log('📊 [DB-SERVICE] Input parameters:', {
    userId,
    type,
    customConsolidation: {
      customId: customConsolidation.custom_id,
      customType: customConsolidation.custom_type,
      poeId: customConsolidation.poe_id,
      podId: customConsolidation.pod_id,
      originRegionId: customConsolidation.origin_region_id,
      destinationRegionId: customConsolidation.destination_region_id
    }
  });

  try {
    // Get user's organization
    console.log('🔍 [DB-SERVICE] Fetching user profile for organization...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('❌ [DB-SERVICE] Profile fetch error:', profileError);
      throw new Error(`Profile fetch failed: ${profileError.message}`);
    }

    if (!profile?.organization_id) {
      console.error('❌ [DB-SERVICE] No organization found for user');
      throw new Error('User organization not found');
    }

    console.log('✅ [DB-SERVICE] User organization found:', profile.organization_id);

    const dbData = {
      organization_id: profile.organization_id,
      consolidation_type: type,
      origin_port_id: customConsolidation.origin_region_id ? null : customConsolidation.poe_id,
      origin_region_id: customConsolidation.origin_region_id || null,
      destination_port_id: customConsolidation.destination_region_id ? null : customConsolidation.pod_id,
      destination_region_id: customConsolidation.destination_region_id || null,
      created_by: userId
    };

    console.log('💾 [DB-SERVICE] Prepared database data:', dbData);

    console.log('🚀 [DB-SERVICE] Executing database insert...');
    const { data, error } = await supabase
      .from('custom_consolidations')
      .insert([dbData])
      .select()
      .single();

    if (error) {
      console.error('❌ [DB-SERVICE] Database insert error:', error);
      console.error('❌ [DB-SERVICE] Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    console.log('✅ [DB-SERVICE] Database insert successful');
    console.log('📄 [DB-SERVICE] Created record:', data);
    return data;
  } catch (error) {
    console.error('❌ [DB-SERVICE] Unexpected error in createCustomConsolidationInDB:', error);
    console.error('❌ [DB-SERVICE] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }
};

export const deleteCustomConsolidationFromDB = async (consolidationId: string) => {
  const { error } = await supabase
    .from('custom_consolidations')
    .delete()
    .eq('id', consolidationId);

  if (error) {
    console.error('Error deleting custom consolidation:', error);
    throw error;
  }
};
