
import { ShipmentFormData, RateArea, TSP, Port } from '../types';
import { useMemo } from 'react';
import { BasicInfoFields } from './BasicInfoFields';
import { DateFields } from './DateFields';
import { ShipmentTypeField } from './ShipmentTypeField';
import { RateAreaFields } from './RateAreaFields';
import { PortFields } from './PortFields';

interface ShipmentFormFieldsProps {
  formData: ShipmentFormData;
  rateAreas: RateArea[];
  ports: Port[];
  tsps: TSP[];
  canEnterActuals: boolean;
  onInputChange: (field: string, value: string) => void;
  onDateChange: (field: string, date: Date | undefined) => void;
}

export const ShipmentFormFields = ({
  formData,
  rateAreas,
  ports,
  tsps,
  canEnterActuals,
  onInputChange,
  onDateChange
}: ShipmentFormFieldsProps) => {
  // Filter rate areas based on shipment type
  const { originRateAreas, destinationRateAreas } = useMemo(() => {
    if (!formData.shipmentType) {
      return { originRateAreas: [], destinationRateAreas: [] };
    }

    switch (formData.shipmentType) {
      case 'inbound':
        return {
          originRateAreas: rateAreas.filter(ra => !ra.is_conus && !ra.is_intertheater_only),
          destinationRateAreas: rateAreas.filter(ra => ra.is_conus && !ra.is_intertheater_only)
        };
      case 'outbound':
        return {
          originRateAreas: rateAreas.filter(ra => ra.is_conus && !ra.is_intertheater_only),
          destinationRateAreas: rateAreas.filter(ra => !ra.is_conus && !ra.is_intertheater_only)
        };
      case 'intertheater':
        return {
          originRateAreas: rateAreas.filter(ra => !ra.is_conus),
          destinationRateAreas: rateAreas.filter(ra => !ra.is_conus)
        };
      default:
        return { originRateAreas: [], destinationRateAreas: [] };
    }
  }, [formData.shipmentType, rateAreas]);

  const handleShipmentTypeChange = (value: string) => {
    onInputChange('shipmentType', value);
    // Clear existing rate area values when shipment type changes
    onInputChange('originRateArea', '');
    onInputChange('destinationRateArea', '');
  };

  return (
    <>
      <BasicInfoFields
        formData={formData}
        tsps={tsps}
        onInputChange={onInputChange}
      />

      <DateFields
        formData={formData}
        onDateChange={onDateChange}
      />

      <ShipmentTypeField
        formData={formData}
        onShipmentTypeChange={handleShipmentTypeChange}
      />

      <RateAreaFields
        formData={formData}
        originRateAreas={originRateAreas}
        destinationRateAreas={destinationRateAreas}
        onInputChange={onInputChange}
      />

      <PortFields
        formData={formData}
        ports={ports}
        onInputChange={onInputChange}
      />
    </>
  );
};
