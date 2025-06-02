
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TranslationMappingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
  type: 'port' | 'rate_area';
  field: string;
  onSuccess: () => void;
}

const TranslationMappingDialog = ({ 
  isOpen, 
  onClose, 
  record, 
  type, 
  field, 
  onSuccess 
}: TranslationMappingDialogProps) => {
  const { toast } = useToast();
  const [selectedMapping, setSelectedMapping] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const externalCode = record?.[field];

  // Fetch available options based on type
  const { data: options = [] } = useQuery({
    queryKey: [type === 'port' ? 'ports' : 'rate_areas'],
    queryFn: async () => {
      if (type === 'port') {
        const { data, error } = await supabase
          .from('ports')
          .select('id, code, name')
          .order('code');
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('rate_areas')
          .select('rate_area, name, countries(name)')
          .order('rate_area');
        if (error) throw error;
        return data;
      }
    },
    enabled: isOpen
  });

  const handleCreateMapping = async () => {
    if (!selectedMapping || !record) return;

    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user!.id)
        .single();

      if (type === 'port') {
        const { error } = await supabase
          .from('port_code_translations')
          .insert({
            organization_id: profile!.organization_id,
            external_port_code: externalCode,
            port_id: selectedMapping
          });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('rate_area_translations')
          .insert({
            organization_id: profile!.organization_id,
            external_rate_area_code: externalCode,
            rate_area_id: selectedMapping
          });
        if (error) throw error;
      }

      toast({
        title: "Translation created",
        description: `${externalCode} will now map to the selected ${type.replace('_', ' ')}`
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create translation",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (!record) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Map {type === 'port' ? 'Port Code' : 'Rate Area'}: {externalCode}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>
              Select existing {type === 'port' ? 'port' : 'rate area'} to map to:
            </Label>
            <Select value={selectedMapping} onValueChange={setSelectedMapping}>
              <SelectTrigger>
                <SelectValue placeholder={`Choose ${type === 'port' ? 'port' : 'rate area'}...`} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option: any) => (
                  <SelectItem 
                    key={type === 'port' ? option.id : option.rate_area} 
                    value={type === 'port' ? option.id : option.rate_area}
                  >
                    {type === 'port' 
                      ? `${option.code} - ${option.name}`
                      : `${option.rate_area} - ${option.name || 'No name'} (${option.countries?.name || 'Unknown'})`
                    }
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateMapping}
              disabled={!selectedMapping || isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Mapping'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TranslationMappingDialog;
