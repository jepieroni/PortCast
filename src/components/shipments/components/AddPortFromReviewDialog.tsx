
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus } from 'lucide-react';

interface AddPortFromReviewDialogProps {
  onPortAdded: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const AddPortFromReviewDialog = ({ onPortAdded, isOpen, onClose }: AddPortFromReviewDialogProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    rate_area_id: ''
  });

  const { data: rateAreas = [] } = useQuery({
    queryKey: ['rate_areas_for_port'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rate_areas')
        .select('rate_area, name, countries(name)')
        .order('rate_area');
      if (error) throw error;
      return data;
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.name || !formData.rate_area_id) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('ports')
        .insert({
          code: formData.code.toUpperCase(),
          name: formData.name,
          description: formData.description || null,
          rate_area_id: formData.rate_area_id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Port added successfully"
      });

      // Reset form
      setFormData({
        code: '',
        name: '',
        description: '',
        rate_area_id: ''
      });

      onPortAdded();
      onClose();
    } catch (error: any) {
      console.error('Error adding port:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add port",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Port</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="code">Port Code *</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              placeholder="e.g., LAX"
              className="uppercase"
            />
          </div>
          
          <div>
            <Label htmlFor="name">Port Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Los Angeles"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description"
            />
          </div>
          
          <div>
            <Label htmlFor="rate_area">Rate Area *</Label>
            <Select 
              value={formData.rate_area_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, rate_area_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select rate area" />
              </SelectTrigger>
              <SelectContent>
                {rateAreas.map((area) => (
                  <SelectItem key={area.rate_area} value={area.rate_area}>
                    {area.rate_area} - {area.name || area.countries?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Port'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPortFromReviewDialog;
