
import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import {
  DatabaseCustomConsolidation,
  CustomConsolidationGroup
} from './consolidation/customConsolidationTypes';
import {
  fetchCustomConsolidations,
  createCustomConsolidationInDB,
  deleteCustomConsolidationFromDB
} from './consolidation/customConsolidationService';
import { convertDbToUIFormat } from './consolidation/customConsolidationConverter';
import { debugLogger } from '@/services/debugLogger';

export type { DatabaseCustomConsolidation, CustomConsolidationGroup } from './consolidation/customConsolidationTypes';

export const useCustomConsolidations = (type: 'inbound' | 'outbound' | 'intertheater') => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch custom consolidations from database
  const { data: customConsolidations, isLoading } = useQuery({
    queryKey: ['custom-consolidations', type, user?.id],
    queryFn: async () => {
      const dbConsolidations = await fetchCustomConsolidations(type, user?.id);
      return convertDbToUIFormat(dbConsolidations);
    },
    enabled: !!user?.id
  });

  // Create custom consolidation mutation
  const createMutation = useMutation({
    mutationFn: async (customConsolidation: CustomConsolidationGroup) => {
      debugLogger.info('CUSTOM-CONSOLIDATIONS', 'Mutation function called', 'createCustomConsolidation');
      
      if (!user?.id) {
        debugLogger.error('CUSTOM-CONSOLIDATIONS', 'User not authenticated', 'createCustomConsolidation');
        throw new Error('User not authenticated');
      }
      
      debugLogger.debug('CUSTOM-CONSOLIDATIONS', 'Creating consolidation', 'createCustomConsolidation', {
        customId: customConsolidation.custom_id,
        type: type,
        customType: customConsolidation.custom_type,
        poe: customConsolidation.poe_name,
        pod: customConsolidation.pod_name
      });
      
      return createCustomConsolidationInDB(customConsolidation, type, user.id);
    },
    onSuccess: (data) => {
      debugLogger.info('CUSTOM-CONSOLIDATIONS', 'Mutation successful', 'createCustomConsolidation', { result: data });
      // Invalidate both custom consolidations and regular consolidation data
      queryClient.invalidateQueries({ queryKey: ['custom-consolidations', type] });
      queryClient.invalidateQueries({ queryKey: ['consolidation-data', type] });
    },
    onError: (error) => {
      debugLogger.error('CUSTOM-CONSOLIDATIONS', 'Mutation failed', 'createCustomConsolidation', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
    }
  });

  // Delete custom consolidation mutation
  const deleteCustomConsolidation = useMutation({
    mutationFn: deleteCustomConsolidationFromDB,
    onSuccess: () => {
      debugLogger.info('CUSTOM-CONSOLIDATIONS', 'Delete mutation successful', 'deleteCustomConsolidation');
      queryClient.invalidateQueries({ queryKey: ['custom-consolidations', type] });
      queryClient.invalidateQueries({ queryKey: ['consolidation-data', type] });
    },
    onError: (error) => {
      debugLogger.error('CUSTOM-CONSOLIDATIONS', 'Failed to delete custom consolidation', 'deleteCustomConsolidation', { error });
    }
  });

  // Return a promise-based create function
  const createCustomConsolidation = useCallback(async (customConsolidation: CustomConsolidationGroup) => {
    return createMutation.mutateAsync(customConsolidation);
  }, [createMutation]);

  return {
    customConsolidations: customConsolidations || [],
    isLoading,
    createCustomConsolidation,
    deleteCustomConsolidation: deleteCustomConsolidation.mutate,
    isCreating: createMutation.isPending,
    isDeleting: deleteCustomConsolidation.isPending
  };
};
