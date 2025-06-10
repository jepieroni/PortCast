
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
      console.log('🔄 [CUSTOM-CONSOLIDATIONS] Mutation function called');
      console.log('👤 [CUSTOM-CONSOLIDATIONS] User state:', { 
        userId: user?.id, 
        userEmail: user?.email,
        isAuthenticated: !!user 
      });
      
      if (!user?.id) {
        console.error('❌ [CUSTOM-CONSOLIDATIONS] User not authenticated');
        throw new Error('User not authenticated');
      }
      
      console.log('📦 [CUSTOM-CONSOLIDATIONS] Creating consolidation:', {
        customId: customConsolidation.custom_id,
        type: type,
        customType: customConsolidation.custom_type,
        poe: customConsolidation.poe_name,
        pod: customConsolidation.pod_name
      });
      
      return createCustomConsolidationInDB(customConsolidation, type, user.id);
    },
    onSuccess: (data) => {
      console.log('✅ [CUSTOM-CONSOLIDATIONS] Mutation successful, result:', data);
      console.log('🔄 [CUSTOM-CONSOLIDATIONS] Invalidating cache...');
      queryClient.invalidateQueries({ queryKey: ['custom-consolidations', type] });
    },
    onError: (error) => {
      console.error('❌ [CUSTOM-CONSOLIDATIONS] Mutation failed:', error);
      console.error('❌ [CUSTOM-CONSOLIDATIONS] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
    },
    onMutate: (variables) => {
      console.log('🏁 [CUSTOM-CONSOLIDATIONS] Mutation starting with variables:', variables);
    },
    onSettled: (data, error) => {
      console.log('🏁 [CUSTOM-CONSOLIDATIONS] Mutation settled');
      if (error) {
        console.log('❌ [CUSTOM-CONSOLIDATIONS] Settled with error:', error);
      } else {
        console.log('✅ [CUSTOM-CONSOLIDATIONS] Settled successfully with data:', data);
      }
    }
  });

  // Delete custom consolidation mutation
  const deleteCustomConsolidation = useMutation({
    mutationFn: deleteCustomConsolidationFromDB,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-consolidations', type] });
    },
    onError: (error) => {
      console.error('❌ [CUSTOM-CONSOLIDATIONS] Failed to delete custom consolidation:', error);
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
