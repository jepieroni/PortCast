
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Upload, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShipmentRegistrationProps {
  onBack: () => void;
}

const ShipmentRegistration = ({ onBack }: ShipmentRegistrationProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    gblNumber: '',
    shipperLastName: '',
    pickupDate: '',
    shipmentType: '',
    originLocation: '',
    destinationCountry: '',
    poeChoice: '',
    estimatedPieces: '',
    estimatedCube: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Shipment Registered",
      description: "Your shipment has been successfully added to the system.",
    });
    onBack();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
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
                    <Input
                      id="pickupDate"
                      type="date"
                      value={formData.pickupDate}
                      onChange={(e) => handleInputChange('pickupDate', e.target.value)}
                      required
                    />
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
                    <Label htmlFor="destinationCountry">Destination Country</Label>
                    <Select value={formData.destinationCountry} onValueChange={(value) => handleInputChange('destinationCountry', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="japan">Japan</SelectItem>
                        <SelectItem value="germany">Germany</SelectItem>
                        <SelectItem value="south-korea">South Korea</SelectItem>
                        <SelectItem value="italy">Italy</SelectItem>
                        <SelectItem value="united-kingdom">United Kingdom</SelectItem>
                        <SelectItem value="spain">Spain</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="poeChoice">POE/POD Choice</Label>
                  <Select value={formData.poeChoice} onValueChange={(value) => handleInputChange('poeChoice', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select preferred port" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="norfolk">Norfolk</SelectItem>
                      <SelectItem value="baltimore">Baltimore</SelectItem>
                      <SelectItem value="savannah">Savannah</SelectItem>
                      <SelectItem value="tacoma">Tacoma</SelectItem>
                      <SelectItem value="jacksonville">Jacksonville</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="estimatedPieces">Estimated Pieces</Label>
                    <Input
                      id="estimatedPieces"
                      type="number"
                      value={formData.estimatedPieces}
                      onChange={(e) => handleInputChange('estimatedPieces', e.target.value)}
                      placeholder="Number of pieces"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="estimatedCube">Estimated Cube (ft³)</Label>
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
  );
};

export default ShipmentRegistration;
