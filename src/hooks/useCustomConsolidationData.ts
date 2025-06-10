
import { useQuery } from '@tanstack/react-query';
import { useCustomConsolidations } from './useCustomConsolidations';
import { useAuth } from './useAuth';
import { useMemo } from 'react';

export const useCustomConsolidationData = (
  type: 'inbound' | 'outbound' | 'intertheater'
) => {
  const { user } = useAuth();
  const { customConsolidations, isLoading } = useCustomConsolidations(type);

  // Memoize the query key to prevent unnecessary re-renders
  const queryKey = useMemo(() => 
    ['custom-consolidation-data', type, user?.id], 
    [type, user?.id]
  );

  console.log('🎯 useCustomConsolidationData called with:', { 
    type, 
    userId: user?.id,
    customConsolidationsCount: customConsolidations?.length || 0
  });

  return {
    data: customConsolidations || [],
    isLoading,
    error: null
  };
};
