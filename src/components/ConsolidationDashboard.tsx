
import { useConsolidationData } from '@/hooks/useConsolidationData';
import { useDragDropConsolidation, ExtendedConsolidationGroup } from '@/hooks/useDragDropConsolidation';
import { usePortRegions } from '@/hooks/usePortRegions';
import { useEffect, useCallback } from 'react';
import { useConsolidationSort } from '@/hooks/consolidation/useConsolidationSort';
import { useConsolidationSelection } from '@/hooks/consolidation/useConsolidationSelection';
import ConsolidationDashboardHeader from './consolidation/ConsolidationDashboardHeader';
import ConsolidationOutlookSlider from './consolidation/ConsolidationOutlookSlider';
import ConsolidationStatusBanner from './consolidation/ConsolidationStatusBanner';
import ConsolidationGrid from './consolidation/ConsolidationGrid';
import DebugViewer from './DebugViewer';
import { debugLogger } from '@/services/debugLogger';

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
    resetToOriginal,
    getValidDropTargets,
    isLoading: isLoadingCustom,
    createMultipleConsolidation
  } = useDragDropConsolidation(originalConsolidations || [], type);

  const { portRegions, portRegionMemberships } = usePortRegions();

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

  const {
    selectedCards,
    compatibleCards,
    canConsolidateSelected,
    canCombineCards,
    handleCardSelection,
    setSelectedCards
  } = useConsolidationSelection(consolidations, getPortRegion, getCardKey);

  // Sort consolidations by appropriate region
  const sortedConsolidations = useConsolidationSort(
    consolidations,
    portRegions,
    portRegionMemberships,
    type
  );

  // Reset custom consolidations when data changes
  useEffect(() => {
    if (originalConsolidations) {
      resetToOriginal();
    }
  }, [originalConsolidations, resetToOriginal]);

  // Handle consolidate selected with debugging
  const handleConsolidateSelected = () => {
    debugLogger.info('CONSOLIDATION-WORKFLOW', 'Starting multi-card consolidation', 'handleConsolidateSelected');
    debugLogger.debug('CONSOLIDATION-WORKFLOW', 'Selected cards analysis', 'handleConsolidateSelected', {
      selectedCardsCount: selectedCards.size,
      selectedCardKeys: Array.from(selectedCards)
    });
    
    const selectedCardObjects = consolidations.filter(c => selectedCards.has(getCardKey(c)));
    debugLogger.debug('CONSOLIDATION-WORKFLOW', 'Selected card objects retrieved', 'handleConsolidateSelected', {
      selectedCardObjects: selectedCardObjects.map(c => ({
        key: getCardKey(c),
        poe: c.poe_name,
        pod: c.pod_name,
        shipments: c.shipment_count
      }))
    });
    
    if (selectedCardObjects.length < 2) {
      debugLogger.warn('CONSOLIDATION-WORKFLOW', 'Insufficient cards selected', 'handleConsolidateSelected', {
        selectedCount: selectedCardObjects.length
      });
      return;
    }
    
    debugLogger.debug('CONSOLIDATION-WORKFLOW', 'Checking if cards can be combined...', 'handleConsolidateSelected');
    const canCombine = canCombineCards(selectedCardObjects);
    debugLogger.info('CONSOLIDATION-WORKFLOW', 'Card compatibility check result', 'handleConsolidateSelected', { canCombine });
    
    if (canCombine) {
      debugLogger.info('CONSOLIDATION-WORKFLOW', 'Cards are compatible, proceeding with consolidation...', 'handleConsolidateSelected');
      
      try {
        createMultipleConsolidation(selectedCardObjects);
        debugLogger.info('CONSOLIDATION-WORKFLOW', 'createMultipleConsolidation call completed', 'handleConsolidateSelected');
        setSelectedCards(new Set());
        debugLogger.info('CONSOLIDATION-WORKFLOW', 'Selected cards cleared', 'handleConsolidateSelected');
      } catch (error) {
        debugLogger.error('CONSOLIDATION-WORKFLOW', 'Error in createMultipleConsolidation', 'handleConsolidateSelected', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } else {
      debugLogger.warn('CONSOLIDATION-WORKFLOW', 'Cards are not compatible for consolidation', 'handleConsolidateSelected');
    }
  };

  const validDropTargets = draggedCard ? getValidDropTargets(draggedCard) : [];
  const isLoadingAny = isLoading || isLoadingCustom;

  return (
    <div className="space-y-6">
      <ConsolidationDashboardHeader
        type={type}
        selectedCardsCount={selectedCards.size}
        canConsolidateSelected={canConsolidateSelected}
        onBack={onBack}
        onResetToOriginal={resetToOriginal}
        onConsolidateSelected={handleConsolidateSelected}
        onTabChange={onTabChange}
      />

      <ConsolidationOutlookSlider
        outlookDays={outlookDays}
        onOutlookDaysChange={onOutlookDaysChange}
      />

      <ConsolidationStatusBanner
        draggedCard={draggedCard}
        selectedCardsCount={selectedCards.size}
        canConsolidateSelected={canConsolidateSelected}
      />

      <ConsolidationGrid
        consolidations={sortedConsolidations}
        isLoading={isLoadingAny}
        error={error}
        type={type}
        draggedCard={draggedCard}
        validDropTargets={validDropTargets}
        selectedCards={selectedCards}
        compatibleCards={compatibleCards}
        onCardClick={onCardClick}
        onCardSelection={handleCardSelection}
        onDragStart={setDraggedCard}
        onDragEnd={() => setDraggedCard(null)}
        onDrop={handleDrop}
        getCardKey={getCardKey}
      />

      <DebugViewer />
    </div>
  );
};

export default ConsolidationDashboard;
