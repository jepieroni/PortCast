
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RateArea {
  rate_area: string;
  is_conus: boolean;
}

interface Port {
  code: string;
  rate_area_id: string;
}

interface PortWithRegion {
  code: string;
  rate_area_id: string;
  region_id?: string;
}

const AMERICAN_SURNAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'
];

export const useSampleDataGenerator = () => {
  const [loading, setLoading] = useState(false);

  const generateGBLNumber = (): string => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const gblLetters = Array.from({ length: 4 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
    const gblNumbers = Array.from({ length: 7 }, () => Math.floor(Math.random() * 10)).join('');
    return gblLetters + gblNumbers;
  };

  const getRandomSurname = (): string => {
    return AMERICAN_SURNAMES[Math.floor(Math.random() * AMERICAN_SURNAMES.length)];
  };

  const getRandomShipmentType = (): 'I' | 'O' | 'T' => {
    const types: ('I' | 'O' | 'T')[] = ['I', 'O', 'T'];
    return types[Math.floor(Math.random() * types.length)];
  };

  const getRandomDateInRange = (startDays: number, endDays: number): string => {
    const today = new Date();
    const startDate = new Date(today.getTime() + startDays * 24 * 60 * 60 * 1000);
    const endDate = new Date(today.getTime() + endDays * 24 * 60 * 60 * 1000);
    const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime());
    return new Date(randomTime).toISOString().split('T')[0];
  };

  const addDaysToDate = (dateStr: string, days: number): string => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  const getRandomCube = (): number => {
    const min = 100;
    const max = 4000;
    const increment = 50;
    const steps = Math.floor((max - min) / increment) + 1;
    const randomStep = Math.floor(Math.random() * steps);
    return min + (randomStep * increment);
  };

  const isDateBeforeToday = (dateStr: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr);
    return date < today;
  };

  const fetchRateAreas = async (): Promise<RateArea[]> => {
    const { data, error } = await supabase
      .from('rate_areas')
      .select('rate_area, is_conus');
    
    if (error) throw error;
    return data || [];
  };

  const fetchPortsWithRegions = async (): Promise<PortWithRegion[]> => {
    const { data, error } = await supabase
      .from('ports')
      .select(`
        code,
        rate_area_id,
        port_region_memberships (
          region_id
        )
      `);
    
    if (error) throw error;
    
    return (data || []).map(port => ({
      code: port.code,
      rate_area_id: port.rate_area_id || '',
      region_id: port.port_region_memberships?.[0]?.region_id
    }));
  };

  const fetchRateAreaRegionMemberships = async () => {
    const { data, error } = await supabase
      .from('rate_area_region_memberships')
      .select('rate_area_id, region_id');
    
    if (error) throw error;
    return data || [];
  };

  const getPortForRateArea = (
    rateArea: string, 
    isConus: boolean, 
    ports: PortWithRegion[], 
    rateAreaRegions: any[], 
    rateAreas: RateArea[]
  ): string => {
    // First, try to find a port in the same region as the rate area
    const rateAreaRegion = rateAreaRegions.find(r => r.rate_area_id === rateArea);
    
    if (rateAreaRegion) {
      const regionPorts = ports.filter(p => p.region_id === rateAreaRegion.region_id);
      if (regionPorts.length > 0) {
        return regionPorts[Math.floor(Math.random() * regionPorts.length)].code;
      }
    }

    // Fallback: find any port with appropriate CONUS status
    const appropriatePorts = ports.filter(port => {
      if (!port.rate_area_id) return false;
      const portRateArea = rateAreas.find(ra => ra.rate_area === port.rate_area_id);
      return portRateArea && portRateArea.is_conus === isConus;
    });

    if (appropriatePorts.length > 0) {
      return appropriatePorts[Math.floor(Math.random() * appropriatePorts.length)].code;
    }

    // Last resort: return any port
    return ports.length > 0 ? ports[Math.floor(Math.random() * ports.length)].code : 'UNKNOWN';
  };

  const generateSampleData = async (rowCount: number): Promise<string> => {
    setLoading(true);
    try {
      // Fetch all required data
      const [rateAreas, ports, rateAreaRegions] = await Promise.all([
        fetchRateAreas(),
        fetchPortsWithRegions(),
        fetchRateAreaRegionMemberships()
      ]);

      const conusRateAreas = rateAreas.filter(ra => ra.is_conus);
      const nonConusRateAreas = rateAreas.filter(ra => !ra.is_conus);

      if (conusRateAreas.length === 0 || nonConusRateAreas.length === 0) {
        throw new Error('Insufficient rate area data. Need both CONUS and non-CONUS rate areas.');
      }

      if (ports.length === 0) {
        throw new Error('No ports found in database.');
      }

      // Generate CSV header
      const headers = [
        'gbl_number',
        'shipper_last_name', 
        'shipment_type',
        'origin_rate_area',
        'destination_rate_area',
        'pickup_date',
        'rdd',
        'poe_code',
        'pod_code',
        'scac_code',
        'estimated_cube',
        'actual_cube'
      ];

      let csvContent = headers.join(',') + '\n';

      // Generate data rows
      for (let i = 0; i < rowCount; i++) {
        const gblNumber = generateGBLNumber();
        const shipperLastName = getRandomSurname();
        const shipmentType = getRandomShipmentType();
        
        // Determine rate areas based on shipment type
        let originRateArea: string;
        let destinationRateArea: string;
        
        if (shipmentType === 'I') {
          // Inbound: origin is non-CONUS, destination is CONUS
          originRateArea = nonConusRateAreas[Math.floor(Math.random() * nonConusRateAreas.length)].rate_area;
          destinationRateArea = conusRateAreas[Math.floor(Math.random() * conusRateAreas.length)].rate_area;
        } else if (shipmentType === 'O') {
          // Outbound: origin is CONUS, destination is non-CONUS
          originRateArea = conusRateAreas[Math.floor(Math.random() * conusRateAreas.length)].rate_area;
          destinationRateArea = nonConusRateAreas[Math.floor(Math.random() * nonConusRateAreas.length)].rate_area;
        } else {
          // Intertheater: both non-CONUS
          originRateArea = nonConusRateAreas[Math.floor(Math.random() * nonConusRateAreas.length)].rate_area;
          destinationRateArea = nonConusRateAreas[Math.floor(Math.random() * nonConusRateAreas.length)].rate_area;
        }

        const pickupDate = getRandomDateInRange(-14, 28); // 2 weeks before to 4 weeks after today
        const rdd = addDaysToDate(pickupDate, 45 + Math.floor(Math.random() * 46)); // 45-90 days after pickup

        // Determine port codes
        const originIsConus = shipmentType === 'O';
        const destinationIsConus = shipmentType === 'I';
        
        const poeCode = getPortForRateArea(originRateArea, originIsConus, ports, rateAreaRegions, rateAreas);
        const podCode = getPortForRateArea(destinationRateArea, destinationIsConus, ports, rateAreaRegions, rateAreas);

        const scacCode = 'CVNI';
        
        // Determine cube values based on pickup date
        const isBeforeToday = isDateBeforeToday(pickupDate);
        const estimatedCube = isBeforeToday ? '' : getRandomCube().toString();
        const actualCube = isBeforeToday ? getRandomCube().toString() : '';

        const row = [
          gblNumber,
          shipperLastName,
          shipmentType,
          originRateArea,
          destinationRateArea,
          pickupDate,
          rdd,
          poeCode,
          podCode,
          scacCode,
          estimatedCube,
          actualCube
        ];

        csvContent += row.join(',') + '\n';
      }

      return csvContent;
    } finally {
      setLoading(false);
    }
  };

  return {
    generateSampleData,
    loading
  };
};
