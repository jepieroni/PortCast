
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw } from 'lucide-react';

interface ConsolidationDashboardHeaderProps {
  type: 'inbound' | 'outbound' | 'intertheater';
  selectedCardsCount: number;
  canConsolidateSelected: boolean;
  onBack: () => void;
  onResetToOriginal: () => void;
  onConsolidateSelected: () => void;
  onTabChange: (tab: string) => void;
}

const ConsolidationDashboardHeader = ({
  type,
  selectedCardsCount,
  canConsolidateSelected,
  onBack,
  onResetToOriginal,
  onConsolidateSelected,
  onTabChange
}: ConsolidationDashboardHeaderProps) => {
  return (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft size={16} className="mr-2" />
          Back to Dashboard
        </Button>
        <h2 className="text-2xl font-bold capitalize">{type} Consolidations</h2>
      </div>
      
      <div className="flex gap-2 ml-auto">
        <Button variant="outline" onClick={onResetToOriginal} className="flex items-center gap-2">
          <RotateCcw size={16} />
          Reset Custom Consolidations
        </Button>
        {canConsolidateSelected && (
          <Button 
            onClick={onConsolidateSelected}
            className="flex items-center gap-2"
          >
            Consolidate Selected ({selectedCardsCount})
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
  );
};

export default ConsolidationDashboardHeader;
