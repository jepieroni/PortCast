
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { scacService } from '@/services/scacService';
import { useScacLogic } from '@/hooks/useScacLogic';
import type { TSP, ScacClaim } from '@/types/scac';

export const useScacManagement = (isGlobalAdmin: boolean) => {
  const { toast } = useToast();
  const [tsps, setTsps] = useState<TSP[]>([]);
  const [selectedTsps, setSelectedTsps] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [claims, setClaims] = useState<ScacClaim[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const { isClaimable } = useScacLogic(isGlobalAdmin, organizationId);

  const fetchData = async () => {
    try {
      // Get user's organization
      const orgId = await scacService.getUserOrganizationId();
      setOrganizationId(orgId);

      // Fetch all TSPs
      const tspsData = await scacService.fetchTsps();
      console.log('Fetched TSPs:', tspsData);
      setTsps(tspsData);

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
      const claimsData = await scacService.fetchPendingClaims();
      setClaims(claimsData);
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
      if (isGlobalAdmin) {
        // Global admin claims are auto-approved
        await scacService.submitClaimAsGlobalAdmin(selectedTsps, organizationId);
        toast({
          title: "Success",
          description: "TSPs claimed successfully",
        });
      } else {
        // Create claim for org admin approval
        const { claimId } = await scacService.submitClaimAsOrgAdmin(selectedTsps, organizationId);

        // Send notification emails
        try {
          await scacService.sendNotificationEmail(claimId, 'claim_submitted');
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
      const result = await scacService.processClaimAction(claim.approval_token, approve);
      if (!result.success) {
        throw new Error(result.message);
      }

      // Send notification email
      try {
        await scacService.sendNotificationEmail(claimId, approve ? 'claim_approved' : 'claim_denied');
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
