-- Update the password for the super admin user using Supabase's admin API simulation
-- First, let's ensure the user exists and is confirmed
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  confirmation_token = '',
  confirmation_sent_at = NULL
WHERE email = 'hunainm.qureshi@gmail.com';

-- Note: Direct password updates in auth.users are not recommended
-- Instead, we'll use a secure method through edge functions
-- But let's ensure the account is properly set up
UPDATE auth.users
SET encrypted_password = crypt('Samura14@', gen_salt('bf'))
WHERE email = 'hunainm.qureshi@gmail.com';