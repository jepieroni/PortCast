
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TSP {
  id: string;
  scac_code: string;
  name: string;
  organization_id: string | null;
  organization_name?: string;
}

interface ScacClaim {
  id: string;
  organization_id: string;
  organization_name: string;
  requested_by: string;
  requester_name: string;
  tsp_ids: string[];
  tsp_details: {
    id: string;
    scac_code: string;
    name: string;
    organization_id: string | null;
  }[];
  status: string;
  requested_at: string;
  approval_token: string;
}

export const useScacManagement = (isGlobalAdmin: boolean) => {
  const { toast } = useToast();
  const [tsps, setTsps] = useState<TSP[]>([]);
  const [selectedTsps, setSelectedTsps] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [claims, setClaims] = useState<ScacClaim[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's organization
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setOrganizationId(profile?.organization_id || null);

      // Fetch all TSPs with organization info
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

      const formattedTsps = tspsData?.map(tsp => ({
        id: tsp.id,
        scac_code: tsp.scac_code,
        name: tsp.name,
        organization_id: tsp.organization_id,
        organization_name: tsp.organizations?.name || 'Unassigned'
      })) || [];

      console.log('Fetched TSPs:', formattedTsps);
      setTsps(formattedTsps);

      // If global admin, fetch all pending claims
      if (isGlobalAdmin) {
        await fetchPendingClaims();
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch TSP data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingClaims = async () => {
    try {
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

      setClaims(formattedClaims);
    } catch (error: any) {
      console.error('Error fetching claims:', error);
    }
  };

  const handleTspSelection = (tspId: string, checked: boolean) => {
    console.log('TSP selection:', { tspId, checked, selectedTsps });
    if (checked) {
      setSelectedTsps([...selectedTsps, tspId]);
    } else {
      setSelectedTsps(selectedTsps.filter(id => id !== tspId));
    }
  };

  const submitClaim = async () => {
    if (selectedTsps.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one TSP to claim",
        variant: "destructive",
      });
      return;
    }

    if (!organizationId) {
      toast({
        title: "Error",
        description: "Organization not found",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (isGlobalAdmin) {
        // Global admin claims are auto-approved
        const { error: updateError } = await supabase
          .from('tsps')
          .update({ organization_id: organizationId })
          .in('id', selectedTsps);

        if (updateError) throw updateError;

        toast({
          title: "Success",
          description: "TSPs claimed successfully",
        });
      } else {
        // Create claim for org admin approval
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

        // Send notification emails
        try {
          await supabase.functions.invoke('send-scac-claim-notification', {
            body: {
              claimId: claimData.id,
              type: 'claim_submitted'
            }
          });
        } catch (emailError) {
          console.error('Failed to send notification emails:', emailError);
          // Don't fail the main operation
        }

        toast({
          title: "Success",
          description: "SCAC claim submitted for approval",
        });
      }

      setSelectedTsps([]);
      await fetchData();
    } catch (error: any) {
      console.error('Error submitting claim:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit claim",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClaimAction = async (claimId: string, approve: boolean) => {
    const claim = claims.find(c => c.id === claimId);
    if (!claim) return;

    try {
      const { data, error } = await supabase.rpc('approve_scac_claim', {
        _approval_token: claim.approval_token,
        _approve: approve
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string };
      if (!result.success) {
        throw new Error(result.message);
      }

      // Send notification email
      try {
        await supabase.functions.invoke('send-scac-claim-notification', {
          body: {
            claimId: claimId,
            type: approve ? 'claim_approved' : 'claim_denied'
          }
        });
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError);
        // Don't fail the main operation
      }

      toast({
        title: "Success",
        description: result.message,
      });

      await fetchData();
    } catch (error: any) {
      console.error('Error processing claim:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process claim",
        variant: "destructive",
      });
    }
  };

  const isClaimable = (tsp: TSP) => {
    console.log('Checking claimability for TSP:', {
      scac: tsp.scac_code,
      tspOrgId: tsp.organization_id,
      userOrgId: organizationId,
      isGlobalAdmin,
      orgName: tsp.organization_name
    });
    
    // For global admins, they can claim any TSP
    if (isGlobalAdmin) {
      console.log('Global admin can claim any TSP');
      return true;
    }
    
    // For org admins, they can claim TSPs that are "Unclaimed" (organization_name === "Unclaimed")
    // OR TSPs already assigned to their organization
    const canClaim = tsp.organization_name === "Unclaimed" || tsp.organization_id === organizationId;
    console.log('Org admin claimability result:', canClaim);
    return canClaim;
  };

  return {
    tsps,
    selectedTsps,
    loading,
    submitting,
    claims,
    organizationId,
    fetchData,
    handleTspSelection,
    submitClaim,
    handleClaimAction,
    isClaimable
  };
};
