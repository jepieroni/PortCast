
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { ExtendedConsolidationGroup } from '@/hooks/useDragDropConsolidation';

interface ConsolidationCardHeaderProps {
  type: 'inbound' | 'outbound' | 'intertheater';
  consolidationData: ExtendedConsolidationGroup;
  poe_name: string;
  poe_code: string;
  pod_name: string;
  pod_code: string;
  poeRegionName: string;
  podRegionName: string;
  showCheckbox?: boolean;
  isSelected?: boolean;
  isCompatibleForSelection?: boolean;
  onSelectionChange?: (checked: boolean) => void;
  onBreakApart?: () => void;
}

const ConsolidationCardHeader = ({
  type,
  consolidationData,
  poe_name,
  poe_code,
  pod_name,
  pod_code,
  poeRegionName,
  podRegionName,
  showCheckbox = false,
  isSelected = false,
  isCompatibleForSelection = true,
  onSelectionChange,
  onBreakApart
}: ConsolidationCardHeaderProps) => {
  const isCustomCard = 'is_custom' in consolidationData && consolidationData.is_custom === true;

  const handleCheckboxChange = (checked: boolean) => {
    onSelectionChange?.(checked);
  };

  const handleBreakApartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onBreakApart?.();
  };

  return (
    <div className="p-4 border-b border-gray-100">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          {showCheckbox && (
            <div data-checkbox>
              <Checkbox
                checked={isSelected}
                onCheckedChange={handleCheckboxChange}
                disabled={!isCompatibleForSelection}
                className="mt-1"
              />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-lg text-gray-900">
                {type === 'inbound' || type === 'intertheater' ? 'From' : 'To'} {' '}
                {isCustomCard ? 'Multiple Regions' : (type === 'inbound' || type === 'intertheater' ? poeRegionName : podRegionName)}
              </h3>
              {isCustomCard && onBreakApart && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBreakApartClick}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Break Apart
                </Button>
              )}
            </div>
            {isCustomCard && (
              <div className="text-sm text-amber-600 font-medium">
                Custom Consolidation
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-1 text-sm text-gray-600">
        <div className="flex justify-between">
          <span className="font-medium">Origin:</span>
          <span>{isCustomCard && consolidationData.origin_region_name ? consolidationData.origin_region_name : `${poe_name} (${poe_code})`}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Destination:</span>
          <span>{isCustomCard && consolidationData.destination_region_name ? consolidationData.destination_region_name : `${pod_name} (${pod_code})`}</span>
        </div>
      </div>
    </div>
  );
};

export default ConsolidationCardHeader;
