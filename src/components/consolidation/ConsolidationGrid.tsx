
import { Skeleton } from '@/components/ui/skeleton';
import ConsolidationCard from '@/components/ConsolidationCard';
import { ExtendedConsolidationGroup } from '@/hooks/useDragDropConsolidation';
import { useConsolidationSort } from '@/hooks/consolidation/useConsolidationSort';
import { usePortRegions } from '@/hooks/usePortRegions';
import { Loader2 } from 'lucide-react';

interface ConsolidationGridProps {
  consolidations: ExtendedConsolidationGroup[];
  isLoading: boolean;
  error: any;
  type: 'inbound' | 'outbound' | 'intertheater';
  draggedCard: ExtendedConsolidationGroup | null;
  validDropTargets: ExtendedConsolidationGroup[];
  selectedCards: Set<string>;
  compatibleCards: Set<string>;
  isCreatingConsolidation?: boolean;
  onCardClick?: (cardData: any) => void;
  onCardSelection: (card: ExtendedConsolidationGroup, checked: boolean) => void;
  onDragStart: (card: ExtendedConsolidationGroup) => void;
  onDragEnd: () => void;
  onDrop: (card: ExtendedConsolidationGroup) => void;
  onBreakApart?: (consolidationId: string) => void;
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
  isCreatingConsolidation = false,
  onCardClick,
  onCardSelection,
  onDragStart,
  onDragEnd,
  onDrop,
  onBreakApart,
  getCardKey
}: ConsolidationGridProps) => {
  const { portRegions, portRegionMemberships } = usePortRegions();
  
  // Use the sorting hook to properly sort consolidations
  const sortedConsolidations = useConsolidationSort(
    consolidations,
    portRegions,
    portRegionMemberships,
    type
  );

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

  if (!sortedConsolidations || sortedConsolidations.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg mb-4">No consolidations available for the selected time period</p>
        <p className="text-gray-400">Try adjusting the outlook range or add more shipments</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Show loading indicator when creating consolidation */}
      {isCreatingConsolidation && (
        <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg border">
          <Loader2 className="animate-spin w-5 h-5 mr-2 text-blue-600" />
          <span className="text-blue-600 font-medium">Creating consolidation...</span>
        </div>
      )}
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedConsolidations.map((consolidation, index) => {
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
              onBreakApart={onBreakApart}
              showCheckbox={true}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ConsolidationGrid;
