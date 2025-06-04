
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useStagingData = (uploadSessionId: string) => {
  // Fetch staging data
  const { data: stagingData = [], refetch } = useQuery({
    queryKey: ['bulk-upload-staging', uploadSessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipment_uploads_staging')
        .select('*')
        .eq('upload_session_id', uploadSessionId)
        .order('created_at');
      
      if (error) throw error;
      return data;
    }
  });

  // Calculate validation summary
  const validationSummary = {
    total: stagingData.length,
    valid: stagingData.filter(r => r.validation_status === 'valid').length,
    invalid: stagingData.filter(r => r.validation_status === 'invalid').length,
    pending: stagingData.filter(r => r.validation_status === 'pending').length
  };

  return {
    stagingData,
    validationSummary,
    refreshData: refetch
  };
};
