
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import ConsolidationCard from '@/components/ConsolidationCard';
import { useConsolidationData } from '@/hooks/useConsolidationData';
import { useDragDropConsolidation, ExtendedConsolidationGroup } from '@/hooks/useDragDropConsolidation';
import { usePortRegions } from '@/hooks/usePortRegions';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useMemo, useState, useCallback } from 'react';

interface ConsolidationDashboardProps {
  type: 'inbound' | 'outbound' | 'intertheater';
  outlookDays: number[];
  onOutlookDaysChange: (days: number[]) => void;
  onBack: () => void;
  onTabChange: (tab: string) => void;
  onCardClick?: (cardData: any) => void;
}

const ConsolidationDashboard = ({ 
  type, 
  outlookDays, 
  onOutlookDaysChange, 
  onBack, 
  onTabChange,
  onCardClick
}: ConsolidationDashboardProps) => {
  const { data: originalConsolidations, isLoading, error } = useConsolidationData(
    type, 
    outlookDays
  );

  const {
    consolidations,
    draggedCard,
    setDraggedCard,
    handleDrop,
    canDrop,
    resetToOriginal,
    getValidDropTargets,
    isLoading: isLoadingCustom,
    createMultipleConsolidation
  } = useDragDropConsolidation(originalConsolidations || [], type);

  const { portRegions, portRegionMemberships } = usePortRegions();
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());

  // Generate unique key for each card
  const getCardKey = useCallback((card: ExtendedConsolidationGroup): string => {
    if ('is_custom' in card) {
      return card.custom_id;
    }
    return `${card.poe_id}-${card.pod_id}`;
  }, []);

  // Get port region for compatibility checking
  const getPortRegion = useCallback((portId: string) => {
    const membership = portRegionMemberships.find(m => m.port_id === portId);
    if (membership) {
      const region = portRegions.find(r => r.id === membership.region_id);
      return { id: membership.region_id, name: region?.name || 'Unknown Region' };
    }
    return null;
  }, [portRegions, portRegionMemberships]);

  // Check if cards can be combined
  const canCombineCards = useCallback((cards: ExtendedConsolidationGroup[]): boolean => {
    if (cards.length < 2) return false;
    
    const firstCard = cards[0];
    const firstOriginRegion = getPortRegion(firstCard.poe_id);
    const firstDestRegion = getPortRegion(firstCard.pod_id);
    
    return cards.every(card => {
      const originRegion = getPortRegion(card.poe_id);
      const destRegion = getPortRegion(card.pod_id);
      return originRegion?.id === firstOriginRegion?.id && 
             destRegion?.id === firstDestRegion?.id;
    });
  }, [getPortRegion]);

  // Get cards that can be combined with currently selected cards
  const getCompatibleCards = useCallback((): Set<string> => {
    if (selectedCards.size === 0) {
      return new Set(consolidations.map(c => getCardKey(c)));
    }
    
    const selectedCardObjects = consolidations.filter(c => selectedCards.has(getCardKey(c)));
    if (selectedCardObjects.length === 0) return new Set();
    
    const compatibleCards = new Set<string>();
    
    consolidations.forEach(card => {
      const testCards = [...selectedCardObjects, card];
      if (canCombineCards(testCards)) {
        compatibleCards.add(getCardKey(card));
      }
    });
    
    return compatibleCards;
  }, [selectedCards, consolidations, canCombineCards, getCardKey]);

  const compatibleCards = getCompatibleCards();

  // Reset custom consolidations when data changes
  useEffect(() => {
    if (originalConsolidations) {
      resetToOriginal();
    }
  }, [originalConsolidations, resetToOriginal]);

  // Reset selected cards when consolidations change
  useEffect(() => {
    setSelectedCards(new Set());
  }, [consolidations]);

  // Handle checkbox change
  const handleCardSelection = (card: ExtendedConsolidationGroup, checked: boolean) => {
    const cardKey = getCardKey(card);
    const newSelected = new Set(selectedCards);
    
    if (checked) {
      newSelected.add(cardKey);
    } else {
      newSelected.delete(cardKey);
    }
    
    setSelectedCards(newSelected);
  };

  // Handle consolidate selected
  const handleConsolidateSelected = () => {
    const selectedCardObjects = consolidations.filter(c => selectedCards.has(getCardKey(c)));
    
    if (selectedCardObjects.length < 2) return;
    
    if (canCombineCards(selectedCardObjects)) {
      createMultipleConsolidation(selectedCardObjects);
      setSelectedCards(new Set());
    }
  };

  // Sort consolidations by appropriate region
  const sortedConsolidations = useMemo(() => {
    if (!consolidations || consolidations.length === 0) return [];

    const getPortRegionName = (portId: string) => {
      const membership = portRegionMemberships.find(m => m.port_id === portId);
      if (membership) {
        const region = portRegions.find(r => r.id === membership.region_id);
        return region?.name || 'Unknown Region';
      }
      return 'No Region';
    };

    const getSortKey = (consolidation: ExtendedConsolidationGroup) => {
      // For custom cards, use the region names directly if available
      if ('is_custom' in consolidation) {
        if (type === 'inbound' || type === 'intertheater') {
          return consolidation.origin_region_name || getPortRegionName(consolidation.poe_id);
        } else { // outbound
          return consolidation.destination_region_name || getPortRegionName(consolidation.pod_id);
        }
      }

      // For regular cards, get region from port membership
      if (type === 'inbound' || type === 'intertheater') {
        return getPortRegionName(consolidation.poe_id);
      } else { // outbound
        return getPortRegionName(consolidation.pod_id);
      }
    };

    return [...consolidations].sort((a, b) => {
      const aKey = getSortKey(a);
      const bKey = getSortKey(b);
      return aKey.localeCompare(bKey);
    });
  }, [consolidations, portRegions, portRegionMemberships, type]);

  const validDropTargets = draggedCard ? getValidDropTargets(draggedCard) : [];
  const isLoadingAny = isLoading || isLoadingCustom;
  const canConsolidateSelected = selectedCards.size >= 2;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Dashboard
          </Button>
          <h2 className="text-2xl font-bold capitalize">{type} Consolidations</h2>
        </div>
        
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" onClick={resetToOriginal} className="flex items-center gap-2">
            <RotateCcw size={16} />
            Reset Custom Consolidations
          </Button>
          {canConsolidateSelected && (
            <Button 
              onClick={handleConsolidateSelected}
              className="flex items-center gap-2"
            >
              Consolidate Selected ({selectedCards.size})
            </Button>
          )}
          {['inbound', 'outbound', 'intertheater'].map((tab) => (
            <Button
              key={tab}
              variant={type === tab ? 'default' : 'outline'}
              onClick={() => onTabChange(tab)}
              className="capitalize"
            >
              {tab}
            </Button>
          ))}
        </div>
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

      {draggedCard && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700">
            <strong>Drag and Drop:</strong> Drop onto cards with matching port regions to create custom consolidations.
            Valid targets are highlighted in green.
          </p>
        </div>
      )}

      {selectedCards.size > 0 && (
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <p className="text-sm text-purple-700">
            <strong>Selection Mode:</strong> {selectedCards.size} card(s) selected. 
            {canConsolidateSelected ? ' Compatible cards can be consolidated together.' : ' Select compatible cards from the same regions.'}
          </p>
        </div>
      )}

      {isLoadingAny ? (
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
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Error loading consolidation data</p>
          <p className="text-gray-500">{error.message}</p>
        </div>
      ) : !sortedConsolidations || sortedConsolidations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">No consolidations available for the selected time period</p>
          <p className="text-gray-400">Try adjusting the outlook range or add more shipments</p>
        </div>
      ) : (
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
                onDragStart={setDraggedCard}
                onDragEnd={() => setDraggedCard(null)}
                onDrop={handleDrop}
                isSelected={isSelected}
                isCompatibleForSelection={isCompatible}
                onSelectionChange={(checked) => handleCardSelection(consolidation, checked)}
                showCheckbox={true}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ConsolidationDashboard;
