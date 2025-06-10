
import { Slider } from '@/components/ui/slider';

interface ConsolidationOutlookSliderProps {
  outlookDays: number[];
  onOutlookDaysChange: (days: number[]) => void;
}

const ConsolidationOutlookSlider = ({
  outlookDays,
  onOutlookDaysChange
}: ConsolidationOutlookSliderProps) => {
  return (
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
  );
};

export default ConsolidationOutlookSlider;
