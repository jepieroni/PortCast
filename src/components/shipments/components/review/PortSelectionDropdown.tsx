
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PortSelectionDropdownProps {
  currentCode: string;
  portType: 'POE' | 'POD';
  onPortSelect: (portCode: string) => void;
  onCreateTranslation: (originalCode: string, selectedPortId: string) => void;
}

export const PortSelectionDropdown = ({
  currentCode,
  portType,
  onPortSelect,
  onCreateTranslation
}: PortSelectionDropdownProps) => {
  const [selectedPortId, setSelectedPortId] = useState<string>('');

  const { data: ports = [] } = useQuery({
    queryKey: ['ports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ports')
        .select('id, code, name')
        .order('code');
      
      if (error) throw error;
      return data;
    }
  });

  const handlePortSelect = (portId: string) => {
    setSelectedPortId(portId);
    // Don't automatically update the field - wait for user action
  };

  const handleUseThisPort = () => {
    if (selectedPortId) {
      const selectedPort = ports.find(p => p.id === selectedPortId);
      if (selectedPort) {
        onPortSelect(selectedPort.code);
      }
    }
  };

  const handleCreateTranslation = () => {
    if (selectedPortId) {
      onCreateTranslation(currentCode, selectedPortId);
    }
  };

  return (
    <div className="space-y-3 p-4 border border-red-200 bg-red-50 rounded-lg">
      <div className="text-sm text-red-800">
        <strong>{portType} code '{currentCode}' not found.</strong>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Select correct {portType} port:</label>
        <Select value={selectedPortId} onValueChange={handlePortSelect}>
          <SelectTrigger>
            <SelectValue placeholder={`Select ${portType} port`} />
          </SelectTrigger>
          <SelectContent className="max-h-60 overflow-y-auto">
            {ports.map((port) => (
              <SelectItem key={port.id} value={port.id}>
                {port.code} - {port.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedPortId && (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleUseThisPort}
          >
            Use This Port
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCreateTranslation}
          >
            Create Translation for '{currentCode}'
          </Button>
        </div>
      )}
    </div>
  );
};
