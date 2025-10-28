-- First, check if the user exists and get their ID
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Find the user by email
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'hunainm.qureshi@gmail.com';

  -- If user exists, update their role
  IF admin_user_id IS NOT NULL THEN
    -- Remove any existing roles for this user
    DELETE FROM public.user_roles
    WHERE user_id = admin_user_id;

    -- Add super_admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'super_admin');

    RAISE NOTICE 'Super admin role assigned to user %', admin_user_id;
  ELSE
    RAISE NOTICE 'User not found';
  END IF;
END $$;