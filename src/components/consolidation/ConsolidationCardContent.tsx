
import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, TrendingUp } from 'lucide-react';
import { ExtendedConsolidationGroup } from '@/hooks/useDragDropConsolidation';
import ContainerFillProgress from './ContainerFillProgress';

interface ConsolidationCardContentProps {
  totalCube: number;
  availableShipments: number;
  consolidationData: ExtendedConsolidationGroup;
  fillPercentage: number;
}

const ConsolidationCardContent = ({
  totalCube,
  availableShipments,
  consolidationData,
  fillPercentage
}: ConsolidationCardContentProps) => {
  const isCustomCard = 'is_custom' in consolidationData;

  return (
    <CardContent className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package size={16} className="text-gray-500" />
          <span className="text-sm text-gray-600">Available Cube</span>
        </div>
        <span className="font-semibold">{totalCube.toLocaleString()} ft³</span>
      </div>
      
      <ContainerFillProgress fillPercentage={fillPercentage} />
      
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Shipments</span>
        <div className="flex items-center gap-1">
          <TrendingUp size={14} className="text-green-500" />
          <span className="font-medium">{availableShipments}</span>
        </div>
      </div>
      
      {fillPercentage >= 90 && (
        <Badge variant="default" className="w-full justify-center bg-green-600">
          Ready for Consolidation
        </Badge>
      )}

      {isCustomCard && (
        <Badge variant="outline" className="w-full justify-center">
          Combined ({(consolidationData as any).combined_from?.length || 0} cards)
        </Badge>
      )}
    </CardContent>
  );
};

export default ConsolidationCardContent;
