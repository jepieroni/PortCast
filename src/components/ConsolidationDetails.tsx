
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, Package, Ship } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useConsolidationShipments } from '@/hooks/useConsolidationShipments';

interface ConsolidationDetailsProps {
  type: 'inbound' | 'outbound' | 'intertheater';
  poeId: string;
  poeName: string;
  poeCode: string;
  podId: string;
  podName: string;
  podCode: string;
  outlookDays: number[];
  onOutlookDaysChange: (days: number[]) => void;
  onBack: () => void;
  customConsolidationData?: any; // For custom consolidations
}

const ConsolidationDetails = ({
  type,
  poeId,
  poeName,
  poeCode,
  podId,
  podName,
  podCode,
  outlookDays,
  onOutlookDaysChange,
  onBack,
  customConsolidationData
}: ConsolidationDetailsProps) => {
  const { data: shipments, isLoading, error } = useConsolidationShipments(
    type,
    poeId,
    podId,
    outlookDays,
    customConsolidationData
  );

  const isCustomConsolidation = customConsolidationData?.is_custom;

  const getTitle = () => {
    if (isCustomConsolidation) {
      return `Custom Consolidation`;
    }
    if (type === 'intertheater') {
      return `${poeCode || poeName} → ${podCode || podName}`;
    }
    return `${podCode || podName} Consolidation`;
  };

  const getSubtitle = () => {
    if (isCustomConsolidation) {
      return `Combined from ${customConsolidationData.combined_from?.length || 0} original consolidations`;
    }
    if (type === 'intertheater') {
      return `${poeName} to ${podName}`;
    }
    return `From ${poeCode || poeName}`;
  };

  const totalCube = shipments?.reduce((sum, shipment) => 
    sum + (shipment.actual_cube || shipment.estimated_cube || 0), 0
  ) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft size={16} className="mr-2" />
          Back to {type} Consolidations
        </Button>
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Ship size={24} className="text-blue-600" />
            {getTitle()}
            {isCustomConsolidation && (
              <Badge variant="secondary" className="ml-2">
                Custom
              </Badge>
            )}
          </h2>
          <p className="text-gray-600">{getSubtitle()}</p>
          {isCustomConsolidation && (
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Route: {poeName} → {podName}
              </p>
              <p className="text-sm text-gray-500">
                Type: {customConsolidationData.custom_type?.replace(/_/g, ' ')}
              </p>
            </div>
          )}
        </div>
      </div>

      {isCustomConsolidation && customConsolidationData.combined_from && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Original Consolidations Combined</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {customConsolidationData.combined_from.map((original: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium">
                      {original.poe_code || original.poe_name} → {original.pod_code || original.pod_name}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {original.shipment_count} shipments, {original.total_cube.toLocaleString()} ft³
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-blue-600" />
              <span className="text-sm text-gray-600">Total Shipments</span>
            </div>
            <p className="text-2xl font-bold">{shipments?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-green-600" />
              <span className="text-sm text-gray-600">Total Cube</span>
            </div>
            <p className="text-2xl font-bold">{totalCube.toLocaleString()} ft³</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Ship size={16} className="text-orange-600" />
              <span className="text-sm text-gray-600">Container Fill</span>
            </div>
            <p className="text-2xl font-bold">{Math.min((totalCube / 2000) * 100, 100).toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Outlook Range:</span>
          <span className="text-sm text-gray-600">{outlookDays[0]} days</span>
        </div>
        <Slider
          value={outlookDays}
          onValueChange={onOutlookDaysChange}
          max={28}
          min={0}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Current</span>
          <span>4 weeks</span>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-2">Error loading shipment details</p>
            <p className="text-gray-500">{error.message}</p>
          </CardContent>
        </Card>
      ) : !shipments || shipments.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500 text-lg mb-2">No shipments found for this consolidation</p>
            <p className="text-gray-400">Try adjusting the outlook range</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Shipment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>TSP SCAC</TableHead>
                  <TableHead>TSP Name</TableHead>
                  <TableHead>GBL Number</TableHead>
                  <TableHead>Shipper Name</TableHead>
                  <TableHead>Cube (ft³)</TableHead>
                  <TableHead>Pickup Date</TableHead>
                  <TableHead>Route</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipments.map((shipment) => (
                  <TableRow key={shipment.id}>
                    <TableCell className="font-medium">
                      {shipment.tsp?.scac_code || 'N/A'}
                    </TableCell>
                    <TableCell>{shipment.tsp?.name || 'N/A'}</TableCell>
                    <TableCell>{shipment.gbl_number}</TableCell>
                    <TableCell>{shipment.shipper_last_name}</TableCell>
                    <TableCell>
                      {(shipment.actual_cube || shipment.estimated_cube || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {new Date(shipment.pickup_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {shipment.target_poe?.code} → {shipment.target_pod?.code}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ConsolidationDetails;
