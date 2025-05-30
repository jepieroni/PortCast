
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type USStateCode = Database['public']['Enums']['us_state_code'];

export const checkExistingOrganization = async (name: string) => {
  const { data: orgData, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', name)
    .maybeSingle();

  if (orgError && orgError.code !== 'PGRST116') {
    throw orgError;
  }

  if (orgData) {
    throw new Error('An organization with this name already exists.');
  }

  // Check if there's a pending organization request
  const { data: requestData, error: requestError } = await supabase
    .from('organization_requests')
    .select('id, status')
    .eq('organization_name', name)
    .eq('status', 'pending')
    .maybeSingle();

  if (requestError && requestError.code !== 'PGRST116') {
    throw requestError;
  }

  if (requestData) {
    throw new Error('A registration request for this organization name is already pending approval.');
  }
};

export const checkExistingUser = async (email: string) => {
  // Check if user already exists in profiles
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (profileError && profileError.code !== 'PGRST116') {
    throw profileError;
  }

  if (profileData) {
    throw new Error('An account with this email address already exists.');
  }

  // Check if there's a pending user request
  const { data: userRequestData, error: userRequestError } = await supabase
    .from('user_requests')
    .select('id, status')
    .eq('email', email)
    .eq('status', 'pending')
    .maybeSingle();

  if (userRequestError && userRequestError.code !== 'PGRST116') {
    throw userRequestError;
  }

  if (userRequestData) {
    throw new Error('A signup request for this email address is already pending approval.');
  }

  // Check if there's a pending organization request with the same email
  const { data: orgRequestData, error: orgRequestError } = await supabase
    .from('organization_requests')
    .select('id, status')
    .eq('email', email)
    .eq('status', 'pending')
    .maybeSingle();

  if (orgRequestError && orgRequestError.code !== 'PGRST116') {
    throw orgRequestError;
  }

  if (orgRequestData) {
    throw new Error('An organization registration request for this email address is already pending approval.');
  }
};

export interface OrganizationFormData {
  organizationName: string;
  city: string;
  state: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string; // Keep for compatibility but won't be used
}

export const submitOrganizationRequest = async (formData: OrganizationFormData) => {
  console.log('=== STARTING ORGANIZATION REQUEST SUBMISSION ===');
  console.log('Form data:', {
    organizationName: formData.organizationName,
    city: formData.city,
    state: formData.state,
    firstName: formData.firstName,
    lastName: formData.lastName,
    email: formData.email
  });
  
  // Debug: Check current session state
  const { data: session, error: sessionError } = await supabase.auth.getSession();
  console.log('Current session:', session);
  console.log('Session error:', sessionError);
  console.log('Current user:', session?.session?.user || 'No user');
  
  // Validate required fields
  if (!formData.organizationName || !formData.firstName || !formData.lastName || !formData.email) {
    throw new Error('Missing required fields for organization request');
  }

  // Ensure state is valid or set to null if empty
  const stateValue = formData.state && formData.state.trim() !== '' ? formData.state as USStateCode : null;
  
  console.log('Prepared data for insert:', {
    organization_name: formData.organizationName,
    city: formData.city || null,
    state: stateValue,
    first_name: formData.firstName,
    last_name: formData.lastName,
    email: formData.email
  });

  console.log('Attempting to insert organization request...');
  
  // Try with explicit auth bypass by using the service role key temporarily
  // This is a workaround for RLS issues with anonymous requests
  const insertData = {
    organization_name: formData.organizationName,
    city: formData.city || null,
    state: stateValue,
    first_name: formData.firstName,
    last_name: formData.lastName,
    email: formData.email
  };
  
  console.log('Insert data being sent:', insertData);
  
  // Submit the organization request with explicit field mapping
  const { data: orgRequest, error: orgError } = await supabase
    .from('organization_requests')
    .insert(insertData)
    .select()
    .single();

  if (orgError) {
    console.error('=== ORGANIZATION REQUEST INSERT ERROR ===');
    console.error('Error details:', orgError);
    console.error('Error code:', orgError.code);
    console.error('Error message:', orgError.message);
    console.error('Error hint:', orgError.hint);
    console.error('Error details:', orgError.details);
    
    // Try to get more info about RLS policies
    console.error('Supabase client auth state:', supabase.auth);
    
    throw new Error(`Failed to submit organization request: ${orgError.message}`);
  }

  console.log('Organization request created successfully:', orgRequest);

  // Send notification email to global admins (without direct approval links)
  console.log('Sending organization approval request email...');
  try {
    const { data: emailData, error: emailError } = await supabase.functions.invoke('send-organization-approval-request', {
      body: {
        organizationName: formData.organizationName,
        city: formData.city,
        state: formData.state,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email
      }
    });

    if (emailError) {
      console.error('Failed to send approval email:', emailError);
      // Don't throw here, as the main request was successful
    } else {
      console.log('Organization approval notification sent successfully:', emailData);
    }
  } catch (emailError) {
    console.error('Exception sending approval email:', emailError);
    // Don't throw here, as the main request was successful
  }

  // Send acknowledgment email to the applicant
  console.log('Sending applicant acknowledgment email...');
  try {
    const { data: ackEmailData, error: ackEmailError } = await supabase.functions.invoke('send-organization-request-acknowledgment', {
      body: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        organizationName: formData.organizationName
      }
    });

    if (ackEmailError) {
      console.error('Failed to send acknowledgment email:', ackEmailError);
      // Don't throw here, as the main request was successful
    } else {
      console.log('Organization request acknowledgment sent successfully:', ackEmailData);
    }
  } catch (emailError) {
    console.error('Exception sending acknowledgment email:', emailError);
    // Don't throw here, as the main request was successful
  }

  console.log('=== ORGANIZATION REQUEST SUBMISSION COMPLETED ===');
};
