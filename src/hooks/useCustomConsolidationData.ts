
import { useAuth } from './useAuth';
import { useCustomConsolidations } from './useCustomConsolidations';

export const useCustomConsolidationData = (
  type: 'inbound' | 'outbound' | 'intertheater'
) => {
  const { user } = useAuth();
  const { customConsolidations, isLoading } = useCustomConsolidations(type);

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
