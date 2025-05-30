import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ArrowLeft, Upload, Save, Info, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface ShipmentRegistrationProps {
  onBack: () => void;
}

interface Country {
  id: string;
  name: string;
  code: string;
}

interface Port {
  id: string;
  name: string;
  code: string;
}

interface TSP {
  id: string;
  name: string;
  scac_code: string;
}

const ShipmentRegistration = ({ onBack }: ShipmentRegistrationProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    gblNumber: '',
    shipperLastName: '',
    pickupDate: undefined as Date | undefined,
    rdd: undefined as Date | undefined,
    shipmentType: '',
    originLocation: '',
    originCountryId: '',
    destinationCountryId: '',
    targetPoeId: '',
    targetPodId: '',
    tspId: '',
    estimatedPieces: '',
    estimatedCube: ''
  });

  // Fetch countries
  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Country[];
    }
  });

  // Fetch ports
  const { data: ports = [] } = useQuery({
    queryKey: ['ports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ports')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Port[];
    }
  });

  // Fetch TSPs for user's organization only, sorted by SCAC code
  const { data: tsps = [] } = useQuery({
    queryKey: ['tsps-user-org'],
    queryFn: async () => {
      // First get the current user's organization
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();
      
      if (profileError) throw profileError;
      if (!profile?.organization_id) throw new Error('User organization not found');

      // Then fetch TSPs for that organization, ordered by SCAC code
      const { data, error } = await supabase
        .from('tsps')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('scac_code');
      
      if (error) throw error;
      return data as TSP[];
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.pickupDate) {
      toast({
        title: "Error",
        description: "Pickup Date is required.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.rdd) {
      toast({
        title: "Error", 
        description: "Required Delivery Date (RDD) is required.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.gblNumber || !formData.shipperLastName || !formData.shipmentType) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast({
          title: "Error",
          description: "You must be logged in to register a shipment.",
          variant: "destructive",
        });
        return;
      }

      // Insert shipment data
      const shipmentData = {
        user_id: user.id,
        gbl_number: formData.gblNumber,
        shipper_last_name: formData.shipperLastName,
        pickup_date: format(formData.pickupDate, 'yyyy-MM-dd'),
        rdd: format(formData.rdd, 'yyyy-MM-dd'),
        shipment_type: formData.shipmentType as 'inbound' | 'outbound' | 'intertheater',
        origin_location: formData.originLocation || null,
        origin_country_id: formData.originCountryId || null,
        destination_country_id: formData.destinationCountryId || null,
        target_poe_id: formData.targetPoeId || null,
        target_pod_id: formData.targetPodId || null,
        tsp_id: formData.tspId || null,
        estimated_pieces: formData.estimatedPieces ? parseFloat(formData.estimatedPieces) : null,
        estimated_cube: formData.estimatedCube ? parseFloat(formData.estimatedCube) : null
      };

      const { error } = await supabase
        .from('shipments')
        .insert([shipmentData]);

      if (error) {
        console.error('Shipment registration error:', error);
        toast({
          title: "Error",
          description: "Failed to register shipment. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Shipment Registered",
        description: "Your shipment has been successfully added to the system.",
      });
      onBack();
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (field: string, date: Date | undefined) => {
    setFormData(prev => ({ ...prev, [field]: date }));
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Dashboard
          </Button>
          <h2 className="text-2xl font-bold">Shipment Registration</h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Add New Shipment</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gblNumber">GBL Number *</Label>
                      <Input
                        id="gblNumber"
                        value={formData.gblNumber}
                        onChange={(e) => handleInputChange('gblNumber', e.target.value)}
                        placeholder="Government Bill of Lading Number"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="shipperLastName">Shipper Last Name *</Label>
                      <Input
                        id="shipperLastName"
                        value={formData.shipperLastName}
                        onChange={(e) => handleInputChange('shipperLastName', e.target.value)}
                        placeholder="Last name of shipper"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pickupDate">Pickup Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.pickupDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.pickupDate ? format(formData.pickupDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.pickupDate}
                            onSelect={(date) => handleDateChange('pickupDate', date)}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="rdd">Required Delivery Date (RDD) *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.rdd && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.rdd ? format(formData.rdd, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.rdd}
                            onSelect={(date) => handleDateChange('rdd', date)}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shipmentType">Shipment Type *</Label>
                    <Select value={formData.shipmentType} onValueChange={(value) => handleInputChange('shipmentType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select shipment type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inbound">Inbound (OCONUS to CONUS)</SelectItem>
                        <SelectItem value="outbound">Outbound (CONUS to OCONUS)</SelectItem>
                        <SelectItem value="intertheater">Intertheater (OCONUS to OCONUS)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="originLocation">Origin Location</Label>
                      <Input
                        id="originLocation"
                        value={formData.originLocation}
                        onChange={(e) => handleInputChange('originLocation', e.target.value)}
                        placeholder="City, State/Country"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="originCountryId">Origin Country</Label>
                      <Select value={formData.originCountryId} onValueChange={(value) => handleInputChange('originCountryId', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select origin country" />
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
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="destinationCountryId">Destination Country</Label>
                      <Select value={formData.destinationCountryId} onValueChange={(value) => handleInputChange('destinationCountryId', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select destination country" />
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

                    <div className="space-y-2">
                      <Label htmlFor="tspId">TSP/SCAC</Label>
                      <Select value={formData.tspId} onValueChange={(value) => handleInputChange('tspId', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select TSP" />
                        </SelectTrigger>
                        <SelectContent>
                          {tsps.map((tsp) => (
                            <SelectItem key={tsp.id} value={tsp.id}>
                              {tsp.scac_code} - {tsp.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="targetPoeId">POE (Port of Embarkation)</Label>
                      <Select value={formData.targetPoeId} onValueChange={(value) => handleInputChange('targetPoeId', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select POE" />
                        </SelectTrigger>
                        <SelectContent>
                          {ports.map((port) => (
                            <SelectItem key={port.id} value={port.id}>
                              {port.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="targetPodId">POD (Port of Debarkation)</Label>
                      <Select value={formData.targetPodId} onValueChange={(value) => handleInputChange('targetPodId', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select POD" />
                        </SelectTrigger>
                        <SelectContent>
                          {ports.map((port) => (
                            <SelectItem key={port.id} value={port.id}>
                              {port.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="estimatedPieces">Estimated Pieces</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info size={16} className="text-gray-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Enter the number of standard liftvan-equivalent units, e.g. 8 or 2.5</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id="estimatedPieces"
                        type="number"
                        step="0.1"
                        value={formData.estimatedPieces}
                        onChange={(e) => handleInputChange('estimatedPieces', e.target.value)}
                        placeholder="Number of pieces"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="estimatedCube">Estimated Volume</Label>
                      <Input
                        id="estimatedCube"
                        type="number"
                        value={formData.estimatedCube}
                        onChange={(e) => handleInputChange('estimatedCube', e.target.value)}
                        placeholder="Cubic feet"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                    <Save size={16} className="mr-2" />
                    Register Shipment
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Upload</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Upload multiple shipments at once using a CSV or Excel file.
                </p>
                <Button variant="outline" className="w-full">
                  <Upload size={16} className="mr-2" />
                  Upload File
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <p>• GBL numbers must be unique in the system</p>
                <p>• Accurate cube estimates help with consolidation</p>
                <p>• Multiple POE/POD choices increase consolidation opportunities</p>
                <p>• Update shipments as actual weights become available</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ShipmentRegistration;
