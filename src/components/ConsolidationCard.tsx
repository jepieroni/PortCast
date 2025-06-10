import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Package, TrendingUp, Ship } from 'lucide-react';
import { ConsolidationGroup } from '@/hooks/consolidation/types';
import { usePortRegions } from '@/hooks/usePortRegions';
import { ExtendedConsolidationGroup } from '@/hooks/useDragDropConsolidation';

interface ConsolidationCardProps {
  poe_name: string;
  poe_code: string;
  pod_name: string;
  pod_code: string;
  totalCube: number;
  availableShipments: number;
  hasUserShipments: boolean;
  type: 'inbound' | 'outbound' | 'intertheater';
  consolidationData: ExtendedConsolidationGroup;
  onClick?: () => void;
  isDragging?: boolean;
  isValidDropTarget?: boolean;
  onDragStart?: (card: ExtendedConsolidationGroup) => void;
  onDragEnd?: () => void;
  onDrop?: (card: ExtendedConsolidationGroup) => void;
  showCheckbox?: boolean;
  isSelected?: boolean;
  isCompatibleForSelection?: boolean;
  onSelectionChange?: (checked: boolean) => void;
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
  onClick,
  isDragging = false,
  isValidDropTarget = false,
  onDragStart,
  onDragEnd,
  onDrop,
  showCheckbox = false,
  isSelected = false,
  isCompatibleForSelection = true,
  onSelectionChange
}: ConsolidationCardProps) => {
  const { portRegions, portRegionMemberships } = usePortRegions();
  const fillPercentage = Math.min((totalCube / 2000) * 100, 100); // 2000 cubic feet = full container

  // Get port region names for POE and POD
  const getPoeRegionName = () => {
    if ('is_custom' in consolidationData && consolidationData.origin_region_name) {
      return consolidationData.origin_region_name;
    }
    const membership = portRegionMemberships.find(m => m.port_id === consolidationData.poe_id);
    if (membership) {
      const region = portRegions.find(r => r.id === membership.region_id);
      return region?.name || 'Unknown Region';
    }
    return 'No Region';
  };

  const getPodRegionName = () => {
    if ('is_custom' in consolidationData && consolidationData.destination_region_name) {
      return consolidationData.destination_region_name;
    }
    const membership = portRegionMemberships.find(m => m.port_id === consolidationData.pod_id);
    if (membership) {
      const region = portRegions.find(r => r.id === membership.region_id);
      return region?.name || 'Unknown Region';
    }
    return 'No Region';
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger onClick if clicking on checkbox
    if ((e.target as HTMLElement).closest('[data-checkbox]')) {
      return;
    }
    e.preventDefault();
    onClick?.();
  };

  const handleCheckboxChange = (checked: boolean) => {
    onSelectionChange?.(checked);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.(consolidationData);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (isValidDropTarget) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (isValidDropTarget) {
      onDrop?.(consolidationData);
    }
  };

  const getCardClasses = () => {
    let classes = "cursor-pointer transition-all duration-200 hover:shadow-lg ";
    
    if (isDragging) {
      classes += "opacity-50 transform rotate-2 ";
    } else if (isValidDropTarget) {
      classes += "ring-2 ring-green-500 bg-green-50 scale-105 ";
    } else if (isSelected) {
      classes += "ring-2 ring-purple-500 bg-purple-50 ";
    } else if (hasUserShipments) {
      classes += "ring-2 ring-blue-500 bg-blue-50 ";
    } else {
      classes += "hover:scale-105 ";
    }

    // Add grey-out effect if not compatible for selection
    if (showCheckbox && !isCompatibleForSelection) {
      classes += "opacity-50 ";
    }
    
    return classes;
  };

  const isCustomCard = 'is_custom' in consolidationData;
  
  return (
    <Card 
      className={getCardClasses()}
      onClick={handleCardClick}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-2">
          {showCheckbox && (
            <div data-checkbox className="flex-shrink-0">
              <Checkbox
                checked={isSelected}
                onCheckedChange={handleCheckboxChange}
                disabled={!isCompatibleForSelection}
              />
            </div>
          )}
          <Ship size={18} className="text-blue-600" />
          <CardTitle className="text-lg font-semibold">
            {isCustomCard ? 'Custom Consolidation' : 
             type === 'intertheater' ? 'Intertheater Route' : 
             `${type.charAt(0).toUpperCase() + type.slice(1)} Route`}
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

        {isCustomCard && (
          <Badge variant="outline" className="w-full justify-center">
            Combined ({(consolidationData as any).combined_from?.length || 0} cards)
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};

export default ConsolidationCard;
