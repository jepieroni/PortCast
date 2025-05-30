
import type { TSP } from '@/types/scac';

export const useScacLogic = (isGlobalAdmin: boolean, organizationId: string | null) => {
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
    isClaimable
  };
};
