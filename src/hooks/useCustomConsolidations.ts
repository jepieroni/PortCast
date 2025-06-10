
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
  const { data: dbCustomConsolidations, isLoading } = useQuery({
    queryKey: ['custom-consolidations', type, user?.id],
    queryFn: () => fetchCustomConsolidations(type, user?.id),
    enabled: !!user?.id
  });

  // Create custom consolidation mutation
  const createCustomConsolidation = useMutation({
    mutationFn: async (customConsolidation: CustomConsolidationGroup) => {
      debugLogger.info('CUSTOM-CONSOLIDATIONS', 'Mutation function called', 'createCustomConsolidation');
      debugLogger.debug('CUSTOM-CONSOLIDATIONS', 'User state', 'createCustomConsolidation', { 
        userId: user?.id, 
        userEmail: user?.email,
        isAuthenticated: !!user 
      });
      
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
      debugLogger.debug('CUSTOM-CONSOLIDATIONS', 'Invalidating cache...', 'createCustomConsolidation');
      queryClient.invalidateQueries({ queryKey: ['custom-consolidations', type] });
    },
    onError: (error) => {
      debugLogger.error('CUSTOM-CONSOLIDATIONS', 'Mutation failed', 'createCustomConsolidation', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
    },
    onMutate: (variables) => {
      debugLogger.debug('CUSTOM-CONSOLIDATIONS', 'Mutation starting', 'createCustomConsolidation', { variables });
    },
    onSettled: (data, error) => {
      if (error) {
        debugLogger.warn('CUSTOM-CONSOLIDATIONS', 'Mutation settled with error', 'createCustomConsolidation', { error });
      } else {
        debugLogger.info('CUSTOM-CONSOLIDATIONS', 'Mutation settled successfully', 'createCustomConsolidation', { data });
      }
    }
  });

  // Delete custom consolidation mutation
  const deleteCustomConsolidation = useMutation({
    mutationFn: deleteCustomConsolidationFromDB,
    onSuccess: () => {
      debugLogger.info('CUSTOM-CONSOLIDATIONS', 'Delete mutation successful', 'deleteCustomConsolidation');
      queryClient.invalidateQueries({ queryKey: ['custom-consolidations', type] });
    },
    onError: (error) => {
      debugLogger.error('CUSTOM-CONSOLIDATIONS', 'Failed to delete custom consolidation', 'deleteCustomConsolidation', { error });
    }
  });

  // Convert database custom consolidations to UI format
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
