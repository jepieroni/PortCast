
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Ship } from 'lucide-react';
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
  onSelectionChange
}: ConsolidationCardHeaderProps) => {
  const isCustomCard = 'is_custom' in consolidationData;

  const handleCheckboxChange = (checked: boolean) => {
    onSelectionChange?.(checked);
  };

  return (
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
          From: {poe_code || poe_name} (Region: {poeRegionName})
        </div>
        <div className="font-medium">
          To: {pod_code || pod_name} (Region: {podRegionName})
        </div>
      </div>
    </CardHeader>
  );
};

export default ConsolidationCardHeader;
