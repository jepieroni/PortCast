
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface TSP {
  id: string;
  scac_code: string;
  name: string;
  organization_id: string | null;
  organization_name?: string;
}

interface TspTableProps {
  tsps: TSP[];
  selectedTsps: string[];
  organizationId: string | null;
  isGlobalAdmin: boolean;
  submitting: boolean;
  onTspSelection: (tspId: string, checked: boolean) => void;
  onSubmitClaim: () => void;
  isClaimable: (tsp: TSP) => boolean;
}

export const TspTable = ({
  tsps,
  selectedTsps,
  organizationId,
  isGlobalAdmin,
  submitting,
  onTspSelection,
  onSubmitClaim,
  isClaimable
}: TspTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Available TSPs ({tsps.length})</CardTitle>
        {selectedTsps.length > 0 && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {selectedTsps.length} TSP(s) selected
            </span>
            <Button 
              onClick={onSubmitClaim} 
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
                      onCheckedChange={(checked) => onTspSelection(tsp.id, checked as boolean)}
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
  );
};
