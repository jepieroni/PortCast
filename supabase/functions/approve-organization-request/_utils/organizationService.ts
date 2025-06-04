
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

export interface OrganizationData {
  organizationName: string;
  city?: string;
  state?: string;
  firstName: string;
  lastName: string;
  email: string;
}

export const createOrganizationWithAdmin = async (
  supabase: ReturnType<typeof createClient>,
  data: OrganizationData
) => {
  console.log('Creating organization:', data.organizationName);

  // Create the organization
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: data.organizationName,
      city: data.city,
      state: data.state,
      trusted_agent_email: data.email
    })
    .select()
    .single();

  if (orgError) {
    console.error('Error creating organization:', orgError);
    throw new Error(`Failed to create organization: ${orgError.message}`);
  }

  console.log('Organization created:', organization.id);

  // Create account setup token for organization admin
  const { data: setupToken, error: setupTokenError } = await supabase
    .from('account_setup_tokens')
    .insert({
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
      organization_id: organization.id,
      organization_name: data.organizationName,
      token_type: 'organization_admin'
    })
    .select()
    .single();

  if (setupTokenError) {
    console.error('Error creating setup token:', setupTokenError);
    throw new Error(`Failed to create setup token: ${setupTokenError.message}`);
  }

  console.log('Setup token created:', setupToken.id);

  // Create a user request for the organization admin (marked as approved)
  const { data: userRequest, error: userRequestError } = await supabase
    .from('user_requests')
    .insert({
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
      organization_id: organization.id,
      status: 'approved'
    })
    .select()
    .single();

  if (userRequestError) {
    console.error('Failed to create user request:', userRequestError);
    // Continue anyway, we can create the user request manually later
  } else {
    console.log('User request created:', userRequest.id);
  }

  return {
    organization,
    setupToken
  };
};
