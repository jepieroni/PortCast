
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Building2, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ScacManagementProps {
  onBack: () => void;
  isGlobalAdmin: boolean;
}

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

const ScacManagement = ({ onBack, isGlobalAdmin }: ScacManagementProps) => {
  const { toast } = useToast();
  const [tsps, setTsps] = useState<TSP[]>([]);
  const [selectedTsps, setSelectedTsps] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [claims, setClaims] = useState<ScacClaim[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

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
    // For global admins, they can claim any TSP
    if (isGlobalAdmin) {
      return true;
    }
    
    // For org admins, they can only claim unassigned TSPs or TSPs already assigned to their organization
    return !tsp.organization_id || tsp.organization_id === organizationId;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading SCAC data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft size={16} className="mr-2" />
          Back to Dashboard
        </Button>
        <h2 className="text-2xl font-bold">SCAC Management</h2>
        <Badge variant="default">
          <Building2 size={16} className="mr-1" />
          {isGlobalAdmin ? 'GLOBAL ADMIN' : 'ORG ADMIN'}
        </Badge>
      </div>

      {isGlobalAdmin && claims.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending SCAC Claims ({claims.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {claims.map((claim) => (
                <div key={claim.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium">{claim.organization_name}</h4>
                      <p className="text-sm text-gray-600">
                        Requested by: {claim.requester_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(claim.requested_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleClaimAction(claim.id, true)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check size={16} className="mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleClaimAction(claim.id, false)}
                      >
                        <X size={16} className="mr-1" />
                        Deny
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {claim.tsp_details.map((tsp) => (
                      <div key={tsp.id} className="text-sm border rounded p-2">
                        <div className="font-medium">{tsp.scac_code}</div>
                        <div className="text-gray-600 text-xs truncate">{tsp.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Available TSPs ({tsps.length})</CardTitle>
          {selectedTsps.length > 0 && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {selectedTsps.length} TSP(s) selected
              </span>
              <Button 
                onClick={submitClaim} 
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? 'Submitting...' : (isGlobalAdmin ? 'Claim TSPs' : 'Submit Claim')}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Select</TableHead>
                <TableHead>SCAC</TableHead>
                <TableHead>TSP Name</TableHead>
                <TableHead>Current Owner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tsps.map((tsp) => {
                const canClaim = isClaimable(tsp);
                console.log('TSP claimable check:', { tsp: tsp.scac_code, canClaim, organizationId, tspOrgId: tsp.organization_id });
                
                return (
                  <TableRow 
                    key={tsp.id}
                    className={!canClaim ? 'opacity-50 bg-gray-50' : ''}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedTsps.includes(tsp.id)}
                        onCheckedChange={(checked) => handleTspSelection(tsp.id, checked as boolean)}
                        disabled={!canClaim}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{tsp.scac_code}</TableCell>
                    <TableCell>{tsp.name}</TableCell>
                    <TableCell>
                      {tsp.organization_id ? (
                        <Badge variant={tsp.organization_id === organizationId ? 'default' : 'secondary'}>
                          {tsp.organization_name}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Unassigned</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScacManagement;
