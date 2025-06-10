
interface ConsolidationStatusBannerProps {
  draggedCard: any;
  selectedCardsCount: number;
  canConsolidateSelected: boolean;
}

const ConsolidationStatusBanner = ({
  draggedCard,
  selectedCardsCount,
  canConsolidateSelected
}: ConsolidationStatusBannerProps) => {
  if (draggedCard) {
    return (
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-700">
          <strong>Drag and Drop:</strong> Drop onto cards with matching port regions to create custom consolidations.
          Valid targets are highlighted in green.
        </p>
      </div>
    );
  }

  if (selectedCardsCount > 0) {
    return (
      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
        <p className="text-sm text-purple-700">
          <strong>Selection Mode:</strong> {selectedCardsCount} card(s) selected. 
          {canConsolidateSelected ? ' Compatible cards can be consolidated together.' : ' Select compatible cards from the same regions.'}
        </p>
      </div>
    );
  }

  return null;
};

export default ConsolidationStatusBanner;
