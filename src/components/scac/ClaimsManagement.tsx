
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

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

interface ClaimsManagementProps {
  claims: ScacClaim[];
  onClaimAction: (claimId: string, approve: boolean) => void;
}

export const ClaimsManagement = ({ claims, onClaimAction }: ClaimsManagementProps) => {
  if (claims.length === 0) {
    return null;
  }

  return (
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
                    onClick={() => onClaimAction(claim.id, true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check size={16} className="mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onClaimAction(claim.id, false)}
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
  );
};
