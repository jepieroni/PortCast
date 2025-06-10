
import { Card } from '@/components/ui/card';
import { usePortRegions } from '@/hooks/usePortRegions';
import { ExtendedConsolidationGroup } from '@/hooks/useDragDropConsolidation';
import ConsolidationCardHeader from './consolidation/ConsolidationCardHeader';
import ConsolidationCardContent from './consolidation/ConsolidationCardContent';

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
  const isCustomCard = 'is_custom' in consolidationData && consolidationData.is_custom;

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
    
    // Base styling for custom vs regular cards
    if (isCustomCard) {
      classes += "border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50 to-purple-100 ";
    } else {
      classes += "border border-solid border-gray-200 bg-white ";
    }
    
    if (isDragging) {
      classes += "opacity-50 transform rotate-2 ";
    } else if (isValidDropTarget) {
      classes += "ring-2 ring-green-500 bg-green-50 scale-105 ";
    } else if (isSelected) {
      classes += "ring-2 ring-purple-500 bg-purple-50 ";
    } else if (hasUserShipments && !isCustomCard) {
      classes += "ring-2 ring-blue-500 bg-blue-50 ";
    } else if (!isDragging && !isValidDropTarget && !isSelected) {
      classes += "hover:scale-105 ";
    }

    // Add grey-out effect if not compatible for selection
    if (showCheckbox && !isCompatibleForSelection) {
      classes += "opacity-50 ";
    }
    
    return classes;
  };
  
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
      <ConsolidationCardHeader
        type={type}
        consolidationData={consolidationData}
        poe_name={poe_name}
        poe_code={poe_code}
        pod_name={pod_name}
        pod_code={pod_code}
        poeRegionName={getPoeRegionName()}
        podRegionName={getPodRegionName()}
        showCheckbox={showCheckbox}
        isSelected={isSelected}
        isCompatibleForSelection={isCompatibleForSelection}
        onSelectionChange={onSelectionChange}
      />
      
      <ConsolidationCardContent
        totalCube={totalCube}
        availableShipments={availableShipments}
        consolidationData={consolidationData}
        fillPercentage={fillPercentage}
      />
    </Card>
  );
};

export default ConsolidationCard;
