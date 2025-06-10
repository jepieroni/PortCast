
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

const ConsolidationDashboard = ({ 
  type, 
  outlookDays, 
  onOutlookDaysChange, 
  onBack, 
  onTabChange, 
  onCardClick 
}: ConsolidationDashboardProps) => {
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [compatibleCards, setCompatibleCards] = useState<Set<string>>(new Set());
  
  // Stabilize outlookDays array to prevent infinite re-renders
  const stableOutlookDays = useMemo(() => outlookDays, [JSON.stringify(outlookDays)]);
  
  // Get combined consolidation data (custom + regular)
  const consolidationDataQuery = useConsolidationData(type, stableOutlookDays);
  const consolidations = consolidationDataQuery?.data || [];

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
  const validDropTargets = useMemo(() => 
    draggedCard ? getValidDropTargets(draggedCard) : [], 
    [draggedCard, getValidDropTargets]
  );

  const getCardKey = useCallback((card: ExtendedConsolidationGroup) => {
    return defaultGetCardKey(card);
  }, []);

  useEffect(() => {
    // Update compatible cards whenever consolidations change
    const newCompatibleCards = new Set(
      Array.from(selectedCards).filter(cardKey => {
        const card = consolidations.find(c => getCardKey(c) === cardKey);
        return card && canDrop(card, card); // Check if the card is still valid for selection
      })
    );
    setCompatibleCards(newCompatibleCards);
  }, [consolidations, selectedCards, canDrop, getCardKey]);

  const handleCardSelection = useCallback((card: ExtendedConsolidationGroup, checked: boolean) => {
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
    const selectedCardsList = Array.from(selectedCards)
      .map(cardKey => consolidations.find(c => getCardKey(c) === cardKey))
      .filter(Boolean) as ExtendedConsolidationGroup[];
    
    if (selectedCardsList.length >= 2) {
      await createMultipleConsolidation(selectedCardsList);
      setSelectedCards(new Set()); // Clear selection after consolidation
    }
  }, [selectedCards, consolidations, getCardKey, createMultipleConsolidation]);

  const canConsolidateSelected = useMemo(() => 
    selectedCards.size >= 2 && 
    Array.from(selectedCards).every(cardKey => compatibleCards.has(cardKey)),
    [selectedCards, compatibleCards]
  );

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
