
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NewRateAreaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
  field: string;
  onSuccess: () => void;
}

const NewRateAreaDialog = ({ 
  isOpen, 
  onClose, 
  record, 
  field, 
  onSuccess 
}: NewRateAreaDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    rate_area: record?.[field] || '',
    name: '',
    country_id: '',
    region_id: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  const externalCode = record?.[field];

  // Fetch countries
  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: isOpen
  });

  // Fetch port regions
  const { data: portRegions = [] } = useQuery({
    queryKey: ['port_regions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('port_regions')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: isOpen
  });

  const handleCreateRateArea = async () => {
    if (!formData.rate_area || !formData.country_id) {
      toast({
        title: "Validation Error",
        description: "Rate area code and country are required",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user!.id)
        .single();

      // Create the rate area
      const { data: newRateArea, error: rateAreaError } = await supabase
        .from('rate_areas')
        .insert({
          rate_area: formData.rate_area,
          name: formData.name,
          country_id: formData.country_id,
          is_intertheater_only: false
        })
        .select()
        .single();

      if (rateAreaError) throw rateAreaError;

      // Add region membership if region was selected
      if (formData.region_id) {
        const { error: membershipError } = await supabase
          .from('rate_area_region_memberships')
          .insert({
            rate_area_id: newRateArea.rate_area,
            region_id: formData.region_id
          });
        if (membershipError) throw membershipError;
      }

      // Create translation mapping if external code is different
      if (externalCode !== formData.rate_area) {
        const { error: translationError } = await supabase
          .from('rate_area_translations')
          .insert({
            organization_id: profile!.organization_id,
            external_rate_area_code: externalCode,
            rate_area_id: newRateArea.rate_area
          });
        if (translationError) throw translationError;
      }

      toast({
        title: "Rate area created",
        description: `Rate area ${formData.rate_area} has been created and mapped`
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create rate area",
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
          <DialogTitle>Create New Rate Area: {externalCode}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="rate_area">Rate Area Code</Label>
            <Input
              id="rate_area"
              value={formData.rate_area}
              onChange={(e) => setFormData({ ...formData, rate_area: e.target.value })}
              placeholder="Enter rate area code"
            />
          </div>

          <div>
            <Label htmlFor="name">Name (Optional)</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter descriptive name"
            />
          </div>

          <div>
            <Label>Country</Label>
            <Select value={formData.country_id} onValueChange={(value) => setFormData({ ...formData, country_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select Country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.id} value={country.id}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Port Region (Optional)</Label>
            <Select value={formData.region_id} onValueChange={(value) => setFormData({ ...formData, region_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select Port Region" />
              </SelectTrigger>
              <SelectContent>
                {portRegions.map((region) => (
                  <SelectItem key={region.id} value={region.id}>
                    {region.name}
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
              onClick={handleCreateRateArea}
              disabled={!formData.rate_area || !formData.country_id || isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Rate Area'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewRateAreaDialog;
