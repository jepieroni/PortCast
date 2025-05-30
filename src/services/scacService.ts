
import { supabase } from '@/integrations/supabase/client';
import type { TSP, ScacClaim } from '@/types/scac';

export const scacService = {
  async fetchTsps(): Promise<TSP[]> {
    const { data: tspsData, error: tspsError } = await supabase
      .from('tsps')
      .select(`
        id,
        scac_code,
        name,
        organization_id,
        organizations (name)
      `)
      .order('scac_code');

    if (tspsError) throw tspsError;

    return tspsData?.map(tsp => ({
      id: tsp.id,
      scac_code: tsp.scac_code,
      name: tsp.name,
      organization_id: tsp.organization_id,
      organization_name: tsp.organizations?.name || 'Unassigned'
    })) || [];
  },

  async fetchPendingClaims(): Promise<ScacClaim[]> {
    const { data: claimsData, error: claimsError } = await supabase
      .from('scac_claims')
      .select(`
        id,
        organization_id,
        requested_by,
        tsp_ids,
        status,
        requested_at,
        approval_token,
        organizations (name)
      `)
      .eq('status', 'pending')
      .order('requested_at', { ascending: false });

    if (claimsError) throw claimsError;

    // Get requester profiles separately
    const requesterIds = claimsData?.map(claim => claim.requested_by) || [];
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', requesterIds);

    if (profilesError) throw profilesError;

    // Fetch TSP details for each claim
    const formattedClaims = await Promise.all(
      (claimsData || []).map(async (claim) => {
        const { data: tspDetails, error: tspError } = await supabase
          .from('tsps')
          .select('id, scac_code, name, organization_id')
          .in('id', claim.tsp_ids);

        if (tspError) console.error('Error fetching TSP details:', tspError);

        const requesterProfile = profiles?.find(p => p.id === claim.requested_by);

        return {
          id: claim.id,
          organization_id: claim.organization_id,
          organization_name: claim.organizations?.name || 'Unknown',
          requested_by: claim.requested_by,
          requester_name: `${requesterProfile?.first_name || ''} ${requesterProfile?.last_name || ''}`.trim(),
          tsp_ids: claim.tsp_ids,
          tsp_details: tspDetails?.map(tsp => ({
            id: tsp.id,
            scac_code: tsp.scac_code,
            name: tsp.name,
            organization_id: tsp.organization_id
          })) || [],
          status: claim.status,
          requested_at: claim.requested_at,
          approval_token: claim.approval_token
        };
      })
    );

    return formattedClaims;
  },

  async getUserOrganizationId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;
    return profile?.organization_id || null;
  },

  async submitClaimAsGlobalAdmin(selectedTsps: string[], organizationId: string): Promise<void> {
    const { error: updateError } = await supabase
      .from('tsps')
      .update({ organization_id: organizationId })
      .in('id', selectedTsps);

    if (updateError) throw updateError;
  },

  async submitClaimAsOrgAdmin(selectedTsps: string[], organizationId: string): Promise<{ claimId: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: claimData, error: claimError } = await supabase
      .from('scac_claims')
      .insert({
        organization_id: organizationId,
        requested_by: user.id,
        tsp_ids: selectedTsps
      })
      .select()
      .single();

    if (claimError) throw claimError;
    return { claimId: claimData.id };
  },

  async sendNotificationEmail(claimId: string, type: string): Promise<void> {
    await supabase.functions.invoke('send-scac-claim-notification', {
      body: {
        claimId,
        type
      }
    });
  },

  async processClaimAction(approvalToken: string, approve: boolean): Promise<{ success: boolean; message: string }> {
    const { data, error } = await supabase.rpc('approve_scac_claim', {
      _approval_token: approvalToken,
      _approve: approve
    });

    if (error) throw error;
    return data as { success: boolean; message: string };
  }
};
