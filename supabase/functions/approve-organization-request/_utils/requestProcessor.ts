
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

export const getOrganizationRequest = async (
  supabase: ReturnType<typeof createClient>,
  requestId: string
) => {
  const { data: orgRequest, error: requestError } = await supabase
    .from('organization_requests')
    .select('*')
    .eq('id', requestId)
    .eq('status', 'pending')
    .single();

  if (requestError || !orgRequest) {
    throw new Error('Organization request not found or already processed');
  }

  return orgRequest;
};

export const updateRequestStatus = async (
  supabase: ReturnType<typeof createClient>,
  requestId: string,
  status: 'approved' | 'denied'
) => {
  const { error: updateError } = await supabase
    .from('organization_requests')
    .update({
      status: status,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', requestId);

  if (updateError) {
    console.error('Error updating request status:', updateError);
    throw new Error(`Failed to update request status: ${updateError.message}`);
  }
};
