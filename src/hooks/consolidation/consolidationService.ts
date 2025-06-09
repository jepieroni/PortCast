
import { supabase } from '@/integrations/supabase/client';
import { ShipmentData } from './types';

export async function fetchConsolidationShipments(
  type: 'inbound' | 'outbound' | 'intertheater',
  outlookDays: number
): Promise<ShipmentData[]> {
  console.log('🔍 CONSOLIDATION DATA QUERY STARTED');
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Calculate date range - include past 30 days and future outlook days
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 30);
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + outlookDays);

  console.log('📅 Date Range:', {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    type
  });

  // Fetch shipments with POE/POD and region information
  // Fixed: Use explicit column hints to resolve ambiguous relationships
  const query = supabase
    .from('shipments')
    .select(`
      target_poe_id,
      target_pod_id,
      actual_cube,
      estimated_cube,
      user_id,
      pickup_date,
      poe:ports!target_poe_id(
        id, 
        name, 
        code,
        port_region_memberships(
          region:port_regions(id, name)
        )
      ),
      pod:ports!target_pod_id(
        id, 
        name, 
        code,
        port_region_memberships(
          region:port_regions(id, name)
        )
      )
    `)
    .eq('shipment_type', type)
    .gte('pickup_date', startDate.toISOString().split('T')[0])
    .lte('pickup_date', endDate.toISOString().split('T')[0]);

  const { data: shipments, error } = await query;

  if (error) {
    console.error('❌ Supabase Query Error:', error);
    throw error;
  }

  console.log('📦 Raw Shipments Data:', {
    count: shipments?.length || 0,
    sampleShipment: shipments?.[0] || 'NO SHIPMENTS',
    allShipments: shipments
  });

  return shipments as ShipmentData[];
}
