
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  // Get SCACs already claimed by the user's organization
  const claimedScacs = tsps.filter(tsp => tsp.organization_id === organizationId);
  
  return (
    <Card className="flex flex-col h-[600px]">
      {/* Fixed header area */}
      <CardHeader className="flex-shrink-0 border-b bg-white sticky top-0 z-10">
        <CardTitle>Select the SCAC(s) belonging to your organization then click Submit Claim</CardTitle>
        
        {/* Summary of claimed SCACs */}
        {claimedScacs.length > 0 && (
          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            <strong>Your organization currently owns {claimedScacs.length} SCAC(s):</strong>
            <div className="mt-1 flex flex-wrap gap-1">
              {claimedScacs.map((tsp) => (
                <Badge key={tsp.id} variant="default" className="text-xs">
                  {tsp.scac_code}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
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
      
      {/* Scrollable content area */}
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full">
          <Table>
            <TableHeader className="sticky top-0 bg-gray-50 z-5">
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
                        <Badge variant="outline">Unclaimed</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
