
import { supabase } from '@/integrations/supabase/client';
import { DatabaseCustomConsolidation, CustomConsolidationGroup } from './customConsolidationTypes';
import { debugLogger } from '@/services/debugLogger';

export const fetchCustomConsolidations = async (
  type: 'inbound' | 'outbound' | 'intertheater',
  userId?: string
): Promise<any[]> => {
  debugLogger.debug('CUSTOM-CONSOLIDATION-SERVICE', `Starting fetch for type: ${type}`, 'fetchCustomConsolidations', { type, userId });
  
  if (!userId) {
    debugLogger.warn('CUSTOM-CONSOLIDATION-SERVICE', 'No user ID provided, returning empty array', 'fetchCustomConsolidations');
    return [];
  }

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
    debugLogger.error('CUSTOM-CONSOLIDATION-SERVICE', 'Error fetching custom consolidations', 'fetchCustomConsolidations', { error, type });
    throw error;
  }

  debugLogger.info('CUSTOM-CONSOLIDATION-SERVICE', `Successfully fetched ${data?.length || 0} custom consolidations`, 'fetchCustomConsolidations', { count: data?.length });
  return data || [];
};

export const createCustomConsolidationInDB = async (
  customConsolidation: CustomConsolidationGroup,
  type: 'inbound' | 'outbound' | 'intertheater',
  userId: string
) => {
  debugLogger.info('DB-SERVICE', 'createCustomConsolidationInDB called', 'createCustomConsolidationInDB');
  debugLogger.debug('DB-SERVICE', 'Input parameters', 'createCustomConsolidationInDB', {
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
    debugLogger.debug('DB-SERVICE', 'Fetching user profile for organization...', 'createCustomConsolidationInDB');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .single();

    if (profileError) {
      debugLogger.error('DB-SERVICE', 'Profile fetch error', 'createCustomConsolidationInDB', { error: profileError });
      throw new Error(`Profile fetch failed: ${profileError.message}`);
    }

    if (!profile?.organization_id) {
      debugLogger.error('DB-SERVICE', 'No organization found for user', 'createCustomConsolidationInDB');
      throw new Error('User organization not found');
    }

    debugLogger.info('DB-SERVICE', 'User organization found', 'createCustomConsolidationInDB', { organizationId: profile.organization_id });

    const dbData = {
      organization_id: profile.organization_id,
      consolidation_type: type,
      origin_port_id: customConsolidation.origin_region_id ? null : customConsolidation.poe_id,
      origin_region_id: customConsolidation.origin_region_id || null,
      destination_port_id: customConsolidation.destination_region_id ? null : customConsolidation.pod_id,
      destination_region_id: customConsolidation.destination_region_id || null,
      created_by: userId
    };

    debugLogger.debug('DB-SERVICE', 'Prepared database data', 'createCustomConsolidationInDB', { dbData });

    debugLogger.info('DB-SERVICE', 'Executing database insert...', 'createCustomConsolidationInDB');
    const { data, error } = await supabase
      .from('custom_consolidations')
      .insert([dbData])
      .select()
      .single();

    if (error) {
      debugLogger.error('DB-SERVICE', 'Database insert error', 'createCustomConsolidationInDB', {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        }
      });
      throw error;
    }

    debugLogger.info('DB-SERVICE', 'Database insert successful', 'createCustomConsolidationInDB', { createdRecord: data });
    return data;
  } catch (error) {
    debugLogger.error('DB-SERVICE', 'Unexpected error in createCustomConsolidationInDB', 'createCustomConsolidationInDB', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    throw error;
  }
};

export const deleteCustomConsolidationFromDB = async (consolidationId: string) => {
  debugLogger.info('DB-SERVICE', 'Deleting custom consolidation', 'deleteCustomConsolidationFromDB', { consolidationId });
  
  const { error } = await supabase
    .from('custom_consolidations')
    .delete()
    .eq('id', consolidationId);

  if (error) {
    debugLogger.error('DB-SERVICE', 'Error deleting custom consolidation', 'deleteCustomConsolidationFromDB', { error, consolidationId });
    throw error;
  }
  
  debugLogger.info('DB-SERVICE', 'Successfully deleted custom consolidation', 'deleteCustomConsolidationFromDB', { consolidationId });
};
