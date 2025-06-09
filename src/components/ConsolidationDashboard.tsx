import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft } from 'lucide-react';
import ConsolidationCard from '@/components/ConsolidationCard';
import { useConsolidationData } from '@/hooks/useConsolidationData';
import { Skeleton } from '@/components/ui/skeleton';

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
  const { data: consolidations, isLoading, error } = useConsolidationData(type, outlookDays);

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

      {isLoading ? (
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
      ) : !consolidations || consolidations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">No consolidations available for the selected time period</p>
          <p className="text-gray-400">Try adjusting the outlook range or add more shipments</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {consolidations.map((consolidation, index) => (
            <ConsolidationCard
              key={`${consolidation.poe_id}-${consolidation.pod_id}`}
              poe_name={consolidation.poe_name}
              poe_code={consolidation.poe_code}
              pod_name={consolidation.pod_name}
              pod_code={consolidation.pod_code}
              totalCube={consolidation.total_cube}
              availableShipments={consolidation.shipment_count}
              hasUserShipments={consolidation.has_user_shipments}
              type={type}
              onClick={() => onCardClick?.(consolidation)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ConsolidationDashboard;
