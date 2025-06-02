
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ArrowLeft, Save } from 'lucide-react';
import { useMemo } from 'react';
import { useShipmentData } from './shipment-registration/hooks/useShipmentData';
import { useShipmentForm } from './shipment-registration/hooks/useShipmentForm';
import { FormField } from './shipment-registration/components/FormField';
import { DateFields } from './shipment-registration/components/DateFields';
import { VolumeFields } from './shipment-registration/components/VolumeFields';
import { SidebarCards } from './shipment-registration/components/SidebarCards';

interface ShipmentRegistrationProps {
  onBack: () => void;
  onSuccess?: () => void;
}

const ShipmentRegistration = ({ onBack, onSuccess }: ShipmentRegistrationProps) => {
  const { rateAreas, ports, tsps } = useShipmentData();
  const { 
    formData, 
    canEnterActuals, 
    handleInputChange, 
    handleDateChange, 
    handleSubmit,
    fieldValidation,
    setFieldRef
  } = useShipmentForm(onBack, onSuccess);

  const shipmentTypeOptions = [
    { value: 'inbound', label: 'Inbound' },
    { value: 'outbound', label: 'Outbound' },
    { value: 'intertheater', label: 'Intertheater' }
  ];

  const tspOptions = tsps?.map(tsp => ({
    value: tsp.id,
    label: `${tsp.scac_code} - ${tsp.name}`
  })) || [];

  // Filter rate areas based on shipment type
  const { originRateAreaOptions, destinationRateAreaOptions } = useMemo(() => {
    if (!formData.shipmentType || !rateAreas) {
      return { originRateAreaOptions: [], destinationRateAreaOptions: [] };
    }

    let originRateAreas, destinationRateAreas;

    switch (formData.shipmentType) {
      case 'inbound':
        originRateAreas = rateAreas.filter(ra => !ra.is_conus && !ra.is_intertheater_only);
        destinationRateAreas = rateAreas.filter(ra => ra.is_conus && !ra.is_intertheater_only);
        break;
      case 'outbound':
        originRateAreas = rateAreas.filter(ra => ra.is_conus && !ra.is_intertheater_only);
        destinationRateAreas = rateAreas.filter(ra => !ra.is_conus && !ra.is_intertheater_only);
        break;
      case 'intertheater':
        originRateAreas = rateAreas.filter(ra => !ra.is_conus);
        destinationRateAreas = rateAreas.filter(ra => !ra.is_conus);
        break;
      default:
        originRateAreas = [];
        destinationRateAreas = [];
    }

    return {
      originRateAreaOptions: originRateAreas.map(area => ({
        value: area.rate_area,
        label: `${area.rate_area} - ${area.name || area.countries.name}`
      })),
      destinationRateAreaOptions: destinationRateAreas.map(area => ({
        value: area.rate_area,
        label: `${area.rate_area} - ${area.name || area.countries.name}`
      }))
    };
  }, [formData.shipmentType, rateAreas]);

  const portOptions = ports?.map(port => ({
    value: port.id,
    label: `${port.code} - ${port.name}`
  })) || [];

  const handleShipmentTypeChange = (value: string) => {
    handleInputChange('shipmentType', value);
    // Clear existing rate area values when shipment type changes
    handleInputChange('originRateArea', '');
    handleInputChange('destinationRateArea', '');
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Shipments
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
                    <FormField
                      ref={(ref) => setFieldRef('gblNumber', ref)}
                      label="GBL Number"
                      required
                      value={formData.gblNumber}
                      onChange={(value) => handleInputChange('gblNumber', value)}
                      placeholder="XXXX9999999"
                      error={fieldValidation.getError('gblNumber')}
                      onFocus={() => fieldValidation.clearFieldError('gblNumber')}
                    />

                    <FormField
                      ref={(ref) => setFieldRef('shipperLastName', ref)}
                      label="Shipper Last Name"
                      required
                      value={formData.shipperLastName}
                      onChange={(value) => handleInputChange('shipperLastName', value)}
                      error={fieldValidation.getError('shipperLastName')}
                      onFocus={() => fieldValidation.clearFieldError('shipperLastName')}
                    />

                    <FormField
                      ref={(ref) => setFieldRef('shipmentType', ref)}
                      type="select"
                      label="Shipment Type"
                      required
                      value={formData.shipmentType}
                      onChange={handleShipmentTypeChange}
                      placeholder="Select type"
                      options={shipmentTypeOptions}
                      error={fieldValidation.getError('shipmentType')}
                      onFocus={() => fieldValidation.clearFieldError('shipmentType')}
                    />

                    <FormField
                      ref={(ref) => setFieldRef('tspId', ref)}
                      type="select"
                      label="TSP"
                      required
                      value={formData.tspId}
                      onChange={(value) => handleInputChange('tspId', value)}
                      placeholder="Select TSP"
                      options={tspOptions}
                      error={fieldValidation.getError('tspId')}
                      onFocus={() => fieldValidation.clearFieldError('tspId')}
                    />
                  </div>

                  <DateFields
                    formData={formData}
                    onDateChange={handleDateChange}
                    pickupError={fieldValidation.getError('pickupDate')}
                    rddError={fieldValidation.getError('rdd')}
                    onFieldFocus={(field) => fieldValidation.clearFieldError(field)}
                    setFieldRef={setFieldRef}
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      ref={(ref) => setFieldRef('originRateArea', ref)}
                      type="select"
                      label="Origin Rate Area"
                      required
                      value={formData.originRateArea}
                      onChange={(value) => handleInputChange('originRateArea', value)}
                      placeholder={!formData.shipmentType ? "Select shipment type first" : "Select origin"}
                      options={originRateAreaOptions}
                      error={fieldValidation.getError('originRateArea')}
                      onFocus={() => fieldValidation.clearFieldError('originRateArea')}
                    />

                    <FormField
                      ref={(ref) => setFieldRef('destinationRateArea', ref)}
                      type="select"
                      label="Destination Rate Area"
                      required
                      value={formData.destinationRateArea}
                      onChange={(value) => handleInputChange('destinationRateArea', value)}
                      placeholder={!formData.shipmentType ? "Select shipment type first" : "Select destination"}
                      options={destinationRateAreaOptions}
                      error={fieldValidation.getError('destinationRateArea')}
                      onFocus={() => fieldValidation.clearFieldError('destinationRateArea')}
                    />

                    <FormField
                      ref={(ref) => setFieldRef('targetPoeId', ref)}
                      type="select"
                      label="Port of Embarkation (POE)"
                      required
                      value={formData.targetPoeId}
                      onChange={(value) => handleInputChange('targetPoeId', value)}
                      placeholder="Select POE"
                      options={portOptions}
                      error={fieldValidation.getError('targetPoeId')}
                      onFocus={() => fieldValidation.clearFieldError('targetPoeId')}
                    />

                    <FormField
                      ref={(ref) => setFieldRef('targetPodId', ref)}
                      type="select"
                      label="Port of Debarkation (POD)"
                      required
                      value={formData.targetPodId}
                      onChange={(value) => handleInputChange('targetPodId', value)}
                      placeholder="Select POD"
                      options={portOptions}
                      error={fieldValidation.getError('targetPodId')}
                      onFocus={() => fieldValidation.clearFieldError('targetPodId')}
                    />
                  </div>

                  <VolumeFields
                    formData={formData}
                    canEnterActuals={canEnterActuals}
                    onInputChange={handleInputChange}
                    fieldValidation={fieldValidation}
                    setFieldRef={setFieldRef}
                  />

                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                    <Save size={16} className="mr-2" />
                    Register Shipment
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <SidebarCards />
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ShipmentRegistration;
