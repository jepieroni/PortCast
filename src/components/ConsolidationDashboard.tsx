
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft } from 'lucide-react';
import ConsolidationCard from '@/components/ConsolidationCard';
import { mockConsolidationData } from '@/data/mockData';

interface ConsolidationDashboardProps {
  type: 'inbound' | 'outbound' | 'intertheater';
  outlookDays: number[];
  onOutlookDaysChange: (days: number[]) => void;
  onBack: () => void;
  onTabChange: (tab: string) => void;
}

const ConsolidationDashboard = ({ 
  type, 
  outlookDays, 
  onOutlookDaysChange, 
  onBack, 
  onTabChange 
}: ConsolidationDashboardProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Dashboard
          </Button>
          <h2 className="text-2xl font-bold capitalize">{type} Consolidations</h2>
        </div>
        
        <div className="flex gap-2">
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

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
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

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {type === 'intertheater' 
          ? mockConsolidationData.intertheater.map((item, index) => (
              <ConsolidationCard
                key={index}
                title={`${item.origin} → ${item.destination}`}
                totalCube={item.totalCube}
                availableShipments={item.availableShipments}
                hasUserShipments={item.hasUserShipments}
                type="intertheater"
              />
            ))
          : mockConsolidationData[type].map((item, index) => (
              <ConsolidationCard
                key={index}
                title={item.country}
                subtitle={item.poe}
                totalCube={item.totalCube}
                availableShipments={item.availableShipments}
                hasUserShipments={item.hasUserShipments}
                type={type}
              />
            ))
        }
      </div>
    </div>
  );
};

export default ConsolidationDashboard;
