
import { useState, useCallback, useEffect } from 'react';
import { ExtendedConsolidationGroup } from '@/hooks/useDragDropConsolidation';

export const useConsolidationSelection = (
  consolidations: ExtendedConsolidationGroup[],
  getPortRegion: (portId: string) => { id: string; name: string } | null,
  getCardKey: (card: ExtendedConsolidationGroup) => string
) => {
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());

  // Reset selected cards when consolidations change
  useEffect(() => {
    setSelectedCards(new Set());
  }, [consolidations]);

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

  const compatibleCards = getCompatibleCards();
  const canConsolidateSelected = selectedCards.size >= 2;

  return {
    selectedCards,
    compatibleCards,
    canConsolidateSelected,
    canCombineCards,
    handleCardSelection,
    setSelectedCards
  };
};
