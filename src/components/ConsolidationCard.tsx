
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, TrendingUp, Ship } from 'lucide-react';
import { ConsolidationGroup } from '@/hooks/useConsolidationData';
import { usePortRegions } from '@/hooks/usePortRegions';

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
  onClick
}: ConsolidationCardProps) => {
  const { portRegions, portRegionMemberships } = usePortRegions();
  const fillPercentage = Math.min((totalCube / 2000) * 100, 100); // 2000 cubic feet = full container

  // Get port region names for POE and POD
  const getPoeRegionName = () => {
    const membership = portRegionMemberships.find(m => m.port_id === consolidationData.poe_id);
    if (membership) {
      const region = portRegions.find(r => r.id === membership.region_id);
      return region?.name || 'Unknown Region';
    }
    return 'No Region';
  };

  const getPodRegionName = () => {
    const membership = portRegionMemberships.find(m => m.port_id === consolidationData.pod_id);
    if (membership) {
      const region = portRegions.find(r => r.id === membership.region_id);
      return region?.name || 'Unknown Region';
    }
    return 'No Region';
  };

  const handleCardClick = (e: React.MouseEvent) => {
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
        <div className="flex items-center gap-2 mb-2">
          <Ship size={18} className="text-blue-600" />
          <CardTitle className="text-lg font-semibold">
            {type === 'intertheater' ? 'Intertheater Route' : `${type.charAt(0).toUpperCase() + type.slice(1)} Route`}
          </CardTitle>
        </div>
        <div className="space-y-1 text-sm">
          <div className="font-medium">
            From: {poe_code || poe_name} (Region: {getPoeRegionName()})
          </div>
          <div className="font-medium">
            To: {pod_code || pod_name} (Region: {getPodRegionName()})
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
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
