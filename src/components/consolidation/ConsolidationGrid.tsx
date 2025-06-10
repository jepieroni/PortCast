
import { Skeleton } from '@/components/ui/skeleton';
import ConsolidationCard from '@/components/ConsolidationCard';
import { ExtendedConsolidationGroup } from '@/hooks/useDragDropConsolidation';

interface ConsolidationGridProps {
  consolidations: ExtendedConsolidationGroup[];
  isLoading: boolean;
  error: any;
  type: 'inbound' | 'outbound' | 'intertheater';
  draggedCard: ExtendedConsolidationGroup | null;
  validDropTargets: ExtendedConsolidationGroup[];
  selectedCards: Set<string>;
  compatibleCards: Set<string>;
  onCardClick?: (cardData: any) => void;
  onCardSelection: (card: ExtendedConsolidationGroup, checked: boolean) => void;
  onDragStart: (card: ExtendedConsolidationGroup) => void;
  onDragEnd: () => void;
  onDrop: (card: ExtendedConsolidationGroup) => void;
  getCardKey: (card: ExtendedConsolidationGroup) => string;
}

const ConsolidationGrid = ({
  consolidations,
  isLoading,
  error,
  type,
  draggedCard,
  validDropTargets,
  selectedCards,
  compatibleCards,
  onCardClick,
  onCardSelection,
  onDragStart,
  onDragEnd,
  onDrop,
  getCardKey
}: ConsolidationGridProps) => {
  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="space-y-4 p-6 border rounded-lg">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Error loading consolidation data</p>
        <p className="text-gray-500">{error.message}</p>
      </div>
    );
  }

  if (!consolidations || consolidations.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg mb-4">No consolidations available for the selected time period</p>
        <p className="text-gray-400">Try adjusting the outlook range or add more shipments</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {consolidations.map((consolidation, index) => {
        const cardKey = getCardKey(consolidation);
        const isValidTarget = validDropTargets.includes(consolidation);
        const isDragging = draggedCard === consolidation;
        const isSelected = selectedCards.has(cardKey);
        const isCompatible = compatibleCards.has(cardKey);
        
        return (
          <ConsolidationCard
            key={`${consolidation.poe_id}-${consolidation.pod_id}-${index}`}
            poe_name={consolidation.poe_name}
            poe_code={consolidation.poe_code}
            pod_name={consolidation.pod_name}
            pod_code={consolidation.pod_code}
            totalCube={consolidation.total_cube}
            availableShipments={consolidation.shipment_count}
            hasUserShipments={consolidation.has_user_shipments}
            type={type}
            consolidationData={consolidation}
            onClick={() => onCardClick?.(consolidation)}
            isDragging={isDragging}
            isValidDropTarget={isValidTarget}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDrop={onDrop}
            isSelected={isSelected}
            isCompatibleForSelection={isCompatible}
            onSelectionChange={(checked) => onCardSelection(consolidation, checked)}
            showCheckbox={true}
          />
        );
      })}
    </div>
  );
};

export default ConsolidationGrid;
