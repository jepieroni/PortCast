
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ConsolidationGrid from './consolidation/ConsolidationGrid';
import ConsolidationDashboardHeader from './consolidation/ConsolidationDashboardHeader';
import ConsolidationOutlookSlider from './consolidation/ConsolidationOutlookSlider';
import ConsolidationStatusBanner from './consolidation/ConsolidationStatusBanner';
import { useConsolidationData } from '@/hooks/useConsolidationData';
import { useDragDropConsolidation } from '@/hooks/useDragDropConsolidation';
import { ExtendedConsolidationGroup } from '@/hooks/useDragDropConsolidation';
import { getCardKey as defaultGetCardKey } from '@/hooks/consolidation/cardKeyUtils';

interface ConsolidationDashboardProps {
  type: 'inbound' | 'outbound' | 'intertheater';
  outlookDays: number[];
  onOutlookDaysChange: (days: number[]) => void;
  onBack: () => void;
  onTabChange: (tab: string) => void;
  onCardClick?: (cardData: any) => void;
}

let dashboardRenderCount = 0;

const ConsolidationDashboard = ({ 
  type, 
  outlookDays, 
  onOutlookDaysChange, 
  onBack, 
  onTabChange, 
  onCardClick 
}: ConsolidationDashboardProps) => {
  dashboardRenderCount++;
  console.log(`🎯 ConsolidationDashboard render #${dashboardRenderCount}`, {
    type,
    outlookDays,
    outlookDaysString: JSON.stringify(outlookDays)
  });

  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  
  // Stabilize outlookDays array to prevent infinite re-renders
  const stableOutlookDays = useMemo(() => {
    console.log('🔄 stableOutlookDays memo recalculating', outlookDays);
    return outlookDays;
  }, [JSON.stringify(outlookDays)]);
  
  // Get combined consolidation data (custom + regular)
  const consolidationDataQuery = useConsolidationData(type, stableOutlookDays);
  const consolidations = consolidationDataQuery?.data || [];

  console.log('🎯 ConsolidationDashboard got consolidations:', consolidations.length);

  // Use drag/drop functionality with the combined data
  const {
    draggedCard,
    setDraggedCard,
    handleDrop,
    canDrop,
    resetToOriginal,
    getValidDropTargets,
    createMultipleConsolidation,
    isCreatingConsolidation
  } = useDragDropConsolidation(consolidations, type);

  // Memoize validDropTargets to prevent unnecessary re-calculations
  const validDropTargets = useMemo(() => {
    console.log('🔄 validDropTargets memo recalculating', draggedCard ? 'has draggedCard' : 'no draggedCard');
    return draggedCard ? getValidDropTargets(draggedCard) : [];
  }, [draggedCard, getValidDropTargets]);

  const getCardKey = useCallback((card: ExtendedConsolidationGroup) => {
    return defaultGetCardKey(card);
  }, []);

  // Calculate compatible cards when selection changes
  const compatibleCards = useMemo(() => {
    console.log('🔄 compatibleCards memo recalculating', {
      selectedCardsSize: selectedCards.size,
      consolidationsLength: consolidations.length
    });
    
    // If no cards are selected, all cards are compatible for selection
    if (selectedCards.size === 0) {
      const allCardKeys = new Set(consolidations.map(c => getCardKey(c)));
      console.log('🔄 No cards selected, all cards compatible:', allCardKeys.size);
      return allCardKeys;
    }
    
    // If cards are selected, find which other cards can be combined with them
    const selectedCardsList = Array.from(selectedCards)
      .map(cardKey => consolidations.find(c => getCardKey(c) === cardKey))
      .filter(Boolean) as ExtendedConsolidationGroup[];
    
    if (selectedCardsList.length === 0) {
      return new Set<string>();
    }
    
    const compatibleSet = new Set<string>();
    
    consolidations.forEach(card => {
      const cardKey = getCardKey(card);
      // A card is compatible if it can be dropped on any selected card
      const isCompatible = selectedCardsList.some(selectedCard => canDrop(card, selectedCard));
      if (isCompatible) {
        compatibleSet.add(cardKey);
      }
    });
    
    console.log('🔄 Compatible cards calculated:', compatibleSet.size);
    return compatibleSet;
  }, [selectedCards, consolidations, canDrop, getCardKey]);

  const handleCardSelection = useCallback((card: ExtendedConsolidationGroup, checked: boolean) => {
    console.log('🔄 handleCardSelection called', { checked, cardKey: getCardKey(card) });
    const cardKey = getCardKey(card);
    setSelectedCards(prev => {
      const newSelection = new Set(prev);
      if (checked) {
        newSelection.add(cardKey);
      } else {
        newSelection.delete(cardKey);
      }
      return newSelection;
    });
  }, [getCardKey]);

  const handleConsolidateSelected = useCallback(async () => {
    console.log('🔄 handleConsolidateSelected called');
    const selectedCardsList = Array.from(selectedCards)
      .map(cardKey => consolidations.find(c => getCardKey(c) === cardKey))
      .filter(Boolean) as ExtendedConsolidationGroup[];
    
    if (selectedCardsList.length >= 2) {
      await createMultipleConsolidation(selectedCardsList);
      setSelectedCards(new Set()); // Clear selection after consolidation
    }
  }, [selectedCards, consolidations, getCardKey, createMultipleConsolidation]);

  const canConsolidateSelected = useMemo(() => {
    console.log('🔄 canConsolidateSelected memo recalculating');
    return selectedCards.size >= 2 && 
      Array.from(selectedCards).every(cardKey => compatibleCards.has(cardKey));
  }, [selectedCards, compatibleCards]);

  console.log(`🎯 ConsolidationDashboard render #${dashboardRenderCount} complete`);

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
        consolidations={consolidations}
        isLoading={consolidationDataQuery?.isLoading || false}
        error={consolidationDataQuery?.error}
        type={type}
        draggedCard={draggedCard}
        validDropTargets={validDropTargets}
        selectedCards={selectedCards}
        compatibleCards={compatibleCards}
        isCreatingConsolidation={isCreatingConsolidation}
        onCardClick={onCardClick}
        onCardSelection={handleCardSelection}
        onDragStart={setDraggedCard}
        onDragEnd={() => setDraggedCard(null)}
        onDrop={handleDrop}
        getCardKey={getCardKey}
      />
    </div>
  );
};

export default ConsolidationDashboard;
