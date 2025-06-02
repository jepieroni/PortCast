
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PortFormData } from '../hooks/usePortManagement';

interface RegionCreationProps {
  formData: PortFormData;
  setFormData: React.Dispatch<React.SetStateAction<PortFormData>>;
  refreshData: () => void;
}

const RegionCreation = ({ formData, setFormData, refreshData }: RegionCreationProps) => {
  const { toast } = useToast();
  const [newRegionData, setNewRegionData] = useState({
    name: '',
    description: ''
  });
  const [isCreatingRegion, setIsCreatingRegion] = useState(false);

  const handleCreateNewRegion = async () => {
    if (!newRegionData.name.trim()) {
      toast({
        title: "Error",
        description: "Region name is required",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingRegion(true);
    try {
      const { data: newRegion, error } = await supabase
        .from('port_regions')
        .insert(newRegionData)
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505' && error.message.includes('port_regions_name_unique')) {
          throw new Error('A port region with this name already exists. Please choose a different name.');
        }
        throw error;
      }

      setFormData(prev => ({ ...prev, region_id: newRegion.id }));
      setNewRegionData({ name: '', description: '' });
      toast({ title: "Success", description: "Port region created successfully" });
      refreshData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsCreatingRegion(false);
    }
  };

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Plus size={14} className="mr-1" />
          Create New
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 z-50 bg-white border shadow-lg">
        <div className="space-y-4">
          <h4 className="font-semibold">Create New Port Region</h4>
          <div className="space-y-2">
            <Label htmlFor="newRegionName">Name</Label>
            <Input
              id="newRegionName"
              value={newRegionData.name}
              onChange={(e) => setNewRegionData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Region name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newRegionDescription">Description</Label>
            <Textarea
              id="newRegionDescription"
              value={newRegionData.description}
              onChange={(e) => setNewRegionData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Region description (optional)"
            />
          </div>
          <Button 
            type="button" 
            onClick={handleCreateNewRegion}
            disabled={isCreatingRegion}
            className="w-full"
          >
            {isCreatingRegion ? 'Creating...' : 'Create Region'}
          </Button>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default RegionCreation;
