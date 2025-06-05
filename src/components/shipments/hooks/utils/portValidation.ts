
import { supabase } from '@/integrations/supabase/client';

export const validatePortCode = async (portCode: string, portType: string): Promise<{ portId?: string; error?: string }> => {
  // Check if port exists directly
  const { data: directPort } = await supabase
    .from('ports')
    .select('id')
    .eq('code', portCode)
    .maybeSingle();

  if (directPort) {
    return { portId: directPort.id };
  }

  // Check for translation
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .maybeSingle();
    
    if (profile?.organization_id) {
      const { data: translation } = await supabase
        .from('port_code_translations')
        .select('port_id')
        .eq('organization_id', profile.organization_id)
        .eq('external_port_code', portCode)
        .maybeSingle();
      
      if (translation) {
        return { portId: translation.port_id };
      }
    }
  }

  return { error: `${portType} code '${portCode}' not found. Please select from available ports or create a translation.` };
};

export const validateRateAreas = async (record: { origin_rate_area: string; destination_rate_area: string }): Promise<string[]> => {
  const errors: string[] = [];

  if (record.origin_rate_area && record.origin_rate_area.trim() !== '') {
    const { data: originRateArea } = await supabase
      .from('rate_areas')
      .select('rate_area')
      .eq('rate_area', record.origin_rate_area.trim())
      .maybeSingle();
    
    if (!originRateArea) {
      errors.push(`Origin rate area '${record.origin_rate_area}' not found`);
    }
  }
  
  if (record.destination_rate_area && record.destination_rate_area.trim() !== '') {
    const { data: destRateArea } = await supabase
      .from('rate_areas')
      .select('rate_area')
      .eq('rate_area', record.destination_rate_area.trim())
      .maybeSingle();
    
    if (!destRateArea) {
      errors.push(`Destination rate area '${record.destination_rate_area}' not found`);
    }
  }

  return errors;
};

export const validateScacCode = async (scacCode: string): Promise<{ tspId?: string; error?: string }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .maybeSingle();
    
    if (profile?.organization_id) {
      const { data: tsp } = await supabase
        .from('tsps')
        .select('id')
        .eq('scac_code', scacCode.trim())
        .eq('organization_id', profile.organization_id)
        .maybeSingle();
      
      if (!tsp) {
        return { error: `SCAC code '${scacCode}' not found in your organization` };
      } else {
        return { tspId: tsp.id };
      }
    }
  }
  
  return { error: 'Unable to validate SCAC code - user authentication failed' };
};
