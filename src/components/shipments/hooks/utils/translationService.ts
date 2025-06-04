
import { supabase } from '@/integrations/supabase/client';

export const validateAndTranslateRateAreas = async (
  record: any, 
  organizationId: string
): Promise<{ errors: string[]; updates: any }> => {
  const errors: string[] = [];
  const updates: any = {};

  for (const field of ['raw_origin_rate_area', 'raw_destination_rate_area']) {
    const rateAreaCode = record[field];
    console.log(`Validating ${field}:`, rateAreaCode);
    
    if (!rateAreaCode) {
      errors.push(`${field.replace('raw_', '').replace('_', ' ')} is required`);
      continue;
    }

    const targetField = field.replace('raw_', '');
    
    // Check if rate area exists directly
    console.log(`Checking direct rate area match for: ${rateAreaCode}`);
    const { data: directRateArea, error: directError } = await supabase
      .from('rate_areas')
      .select('rate_area')
      .eq('rate_area', rateAreaCode)
      .maybeSingle();

    if (directError) {
      console.error('Error checking direct rate area:', directError);
    }

    if (directRateArea) {
      console.log(`Direct match found for ${rateAreaCode}`);
      updates[targetField] = directRateArea.rate_area;
      continue;
    }

    // Check for translation
    console.log(`Checking translation for: ${rateAreaCode} in org: ${organizationId}`);
    const { data: translation, error: translationError } = await supabase
      .from('rate_area_translations')
      .select('rate_area_id')
      .eq('organization_id', organizationId)
      .eq('external_rate_area_code', rateAreaCode)
      .maybeSingle();

    if (translationError) {
      console.error('Error checking rate area translation:', translationError);
    }

    if (translation) {
      console.log(`Translation found for ${rateAreaCode} -> ${translation.rate_area_id}`);
      updates[targetField] = translation.rate_area_id;
    } else {
      console.log(`No translation found for ${rateAreaCode}`);
      errors.push(`Rate area '${rateAreaCode}' not found and no translation configured`);
    }
  }

  return { errors, updates };
};

export const validateAndTranslatePorts = async (
  record: any, 
  organizationId: string
): Promise<{ errors: string[]; updates: any }> => {
  const errors: string[] = [];
  const updates: any = {};

  for (const field of ['raw_poe_code', 'raw_pod_code']) {
    const portCode = record[field];
    console.log(`Validating ${field}:`, portCode);
    
    if (!portCode) {
      errors.push(`${field.replace('raw_', '').replace('_', ' ')} is required`);
      continue;
    }

    // Map to correct target field names for staging table
    const targetField = field === 'raw_poe_code' ? 'target_poe_id' : 'target_pod_id';
    
    // Check if port exists directly
    console.log(`Checking direct port match for: ${portCode}`);
    const { data: directPort, error: directPortError } = await supabase
      .from('ports')
      .select('id')
      .eq('code', portCode)
      .maybeSingle();

    if (directPortError) {
      console.error('Error checking direct port:', directPortError);
    }

    if (directPort) {
      console.log(`Direct port match found for ${portCode}`);
      updates[targetField] = directPort.id;
      continue;
    }

    // Check for translation
    console.log(`Checking port translation for: ${portCode} in org: ${organizationId}`);
    const { data: translation, error: portTranslationError } = await supabase
      .from('port_code_translations')
      .select('port_id')
      .eq('organization_id', organizationId)
      .eq('external_port_code', portCode)
      .maybeSingle();

    if (portTranslationError) {
      console.error('Error checking port translation:', portTranslationError);
    }

    if (translation) {
      console.log(`Port translation found for ${portCode} -> ${translation.port_id}`);
      updates[targetField] = translation.port_id;
    } else {
      console.log(`No port translation found for ${portCode}`);
      errors.push(`Port code '${portCode}' not found and no translation configured. Would you like to create a translation?`);
    }
  }

  return { errors, updates };
};

export const validateAndFindTsp = async (
  record: any, 
  organizationId: string
): Promise<{ errors: string[]; updates: any }> => {
  const errors: string[] = [];
  const updates: any = {};

  if (!record.raw_scac_code) {
    errors.push('SCAC code is required');
  } else {
    console.log(`Validating SCAC code: ${record.raw_scac_code} in org: ${organizationId}`);
    const { data: tsp, error: tspError } = await supabase
      .from('tsps')
      .select('id')
      .eq('scac_code', record.raw_scac_code)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (tspError) {
      console.error('Error checking TSP:', tspError);
    }

    if (tsp) {
      console.log(`TSP found for ${record.raw_scac_code} -> ${tsp.id}`);
      updates.tsp_id = tsp.id;
    } else {
      console.log(`No TSP found for ${record.raw_scac_code} in organization ${organizationId}`);
      errors.push(`SCAC code '${record.raw_scac_code}' not found in your organization`);
    }
  }

  return { errors, updates };
};
