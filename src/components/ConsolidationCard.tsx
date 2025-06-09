import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Package, TrendingUp, Ship } from 'lucide-react';
import { ConsolidationGroup } from '@/hooks/useConsolidationData';
import { useState } from 'react';

interface ConsolidationCardProps {
  poe_name: string;
  poe_code: string;
  pod_name: string;
  pod_code: string;
  totalCube: number;
  availableShipments: number;
  hasUserShipments: boolean;
  type: 'inbound' | 'outbound' | 'intertheater';
  consolidationData: ConsolidationGroup;
  onFlexibilityChange: (originDestinationKey: string, poeFlexible: boolean, podFlexible: boolean) => void;
  onClick?: () => void;
}

const ConsolidationCard = ({ 
  poe_name,
  poe_code,
  pod_name,
  pod_code,
  totalCube, 
  availableShipments, 
  hasUserShipments,
  type,
  consolidationData,
  onFlexibilityChange,
  onClick
}: ConsolidationCardProps) => {
  const [poeFlexible, setPoeFlexible] = useState(consolidationData.is_poe_flexible || false);
  const [podFlexible, setPodFlexible] = useState(consolidationData.is_pod_flexible || false);

  const fillPercentage = Math.min((totalCube / 2000) * 100, 100); // 2000 cubic feet = full container
  
  // FIXED: Generate the origin-destination key
  const originDestinationKey = `${consolidationData.poe_id}-${consolidationData.pod_id}`;
  
  const getTitle = () => {
    if (type === 'intertheater') {
      const poeDisplay = poeFlexible ? consolidationData.poe_region_name : (poe_code || poe_name);
      const podDisplay = podFlexible ? consolidationData.pod_region_name : (pod_code || pod_name);
      return `${poeDisplay} → ${podDisplay}`;
    }
    const podDisplay = podFlexible ? consolidationData.pod_region_name : (pod_code || pod_name);
    return podDisplay;
  };

  const getSubtitle = () => {
    if (type === 'intertheater') {
      const poeDisplay = poeFlexible ? consolidationData.poe_region_name : poe_name;
      const podDisplay = podFlexible ? consolidationData.pod_region_name : pod_name;
      return `${poeDisplay} to ${podDisplay}`;
    }
    const poeDisplay = poeFlexible ? consolidationData.poe_region_name : (poe_code || poe_name);
    return `From ${poeDisplay}`;
  };

  const handlePoeFlexibilityChange = (checked: boolean) => {
    console.log('🎛️ POE Flexibility Change:', {
      originDestinationKey,
      poe_id: consolidationData.poe_id,
      poe_name: consolidationData.poe_name,
      newPoeFlexible: checked,
      currentPodFlexible: podFlexible
    });
    
    setPoeFlexible(checked);
    onFlexibilityChange(originDestinationKey, checked, podFlexible);
  };

  const handlePodFlexibilityChange = (checked: boolean) => {
    console.log('🎛️ POD Flexibility Change:', {
      originDestinationKey,
      pod_id: consolidationData.pod_id,
      pod_name: consolidationData.pod_name,
      currentPoeFlexible: poeFlexible,
      newPodFlexible: checked
    });
    
    setPodFlexible(checked);
    onFlexibilityChange(originDestinationKey, poeFlexible, checked);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on switches
    if ((e.target as HTMLElement).closest('.flexibility-controls')) {
      return;
    }
    onClick?.();
  };
  
  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
        hasUserShipments ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:scale-105'
      }`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Ship size={18} className="text-blue-600" />
            {getTitle()}
          </CardTitle>
          {hasUserShipments && (
            <Badge variant="default" className="bg-blue-600">
              Your Shipments
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-600">{getSubtitle()}</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Flexibility Controls */}
        <div className="flexibility-controls space-y-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-gray-700">Origin Port Flexibility</span>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Strict</span>
                <Switch
                  checked={poeFlexible}
                  onCheckedChange={handlePoeFlexibilityChange}
                  className="scale-75"
                />
                <span>Flexible</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-gray-700">Destination Port Flexibility</span>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Strict</span>
                <Switch
                  checked={podFlexible}
                  onCheckedChange={handlePodFlexibilityChange}
                  className="scale-75"
                />
                <span>Flexible</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-gray-500" />
            <span className="text-sm text-gray-600">Available Cube</span>
          </div>
          <span className="font-semibold">{totalCube.toLocaleString()} ft³</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Container Fill</span>
            <span>{fillPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                fillPercentage >= 90 ? 'bg-green-500' : 
                fillPercentage >= 70 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${fillPercentage}%` }}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Shipments</span>
          <div className="flex items-center gap-1">
            <TrendingUp size={14} className="text-green-500" />
            <span className="font-medium">{availableShipments}</span>
          </div>
        </div>
        
        {fillPercentage >= 90 && (
          <Badge variant="default" className="w-full justify-center bg-green-600">
            Ready for Consolidation
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};

export default ConsolidationCard;
