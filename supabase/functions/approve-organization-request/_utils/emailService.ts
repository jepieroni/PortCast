
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

export const sendAccountSetupEmail = async (
  supabase: ReturnType<typeof createClient>,
  setupTokenId: string
) => {
  console.log('Sending account setup email...');
  
  try {
    const { data: emailData, error: emailError } = await supabase.functions.invoke('send-user-account-setup', {
      body: {
        setupTokenId: setupTokenId
      }
    });

    if (emailError) {
      console.error('Failed to send account setup email:', emailError);
      // Don't fail the whole operation, but log it
    } else {
      console.log('Account setup email sent successfully:', emailData);
    }
  } catch (emailError) {
    console.error('Exception sending account setup email:', emailError);
    // Don't fail the whole operation
  }
};
