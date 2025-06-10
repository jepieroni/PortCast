
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
      if (!user?.id) throw new Error('User not authenticated');
      return createCustomConsolidationInDB(customConsolidation, type, user.id);
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
    mutationFn: deleteCustomConsolidationFromDB,
    onSuccess: () => {
      console.log('🔄 Invalidating custom consolidations cache after deletion');
      queryClient.invalidateQueries({ queryKey: ['custom-consolidations', type] });
    },
    onError: (error) => {
      console.error('❌ Failed to delete custom consolidation:', error);
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
