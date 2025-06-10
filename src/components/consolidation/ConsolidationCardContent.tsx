
import { Progress } from '@/components/ui/progress';
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
  const isCustom = 'is_custom' in consolidationData && consolidationData.is_custom;
  
  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>{availableShipments} shipments</span>
        <span>{totalCube.toFixed(1)} ft³</span>
      </div>
      
      {isCustom && (
        <div className="text-sm text-purple-600 font-medium">
          Combined ({consolidationData.combined_cards_count || 0} cards)
        </div>
      )}
      
      <ContainerFillProgress fillPercentage={fillPercentage} />
    </div>
  );
};

export default ConsolidationCardContent;
