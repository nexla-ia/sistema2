/*
  # Create default salon for new users

  1. Function to create default salon
    - Creates a salon automatically when a user signs up
    - Sets default values for the salon
  
  2. Trigger
    - Runs after user creation in auth.users
    - Calls the function to create default salon
*/

-- Function to create default salon for new users
CREATE OR REPLACE FUNCTION create_default_salon_for_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a default salon for the new user
  INSERT INTO public.salons (
    user_id,
    name,
    description,
    address,
    phone,
    email,
    opening_hours,
    active
  ) VALUES (
    NEW.id,
    'Meu Salão',
    'Descrição do meu salão - edite nas configurações',
    'Endereço do salão - edite nas configurações',
    '(00) 00000-0000',
    NEW.email,
    jsonb_build_object(
      'monday', jsonb_build_object('open', '08:00', 'close', '18:00'),
      'tuesday', jsonb_build_object('open', '08:00', 'close', '18:00'),
      'wednesday', jsonb_build_object('open', '08:00', 'close', '18:00'),
      'thursday', jsonb_build_object('open', '08:00', 'close', '18:00'),
      'friday', jsonb_build_object('open', '08:00', 'close', '18:00'),
      'saturday', jsonb_build_object('open', '08:00', 'close', '18:00'),
      'sunday', jsonb_build_object('closed', true)
    ),
    true
  );

  -- Create some default services for the salon
  INSERT INTO public.services (
    salon_id,
    name,
    description,
    price,
    duration_minutes,
    category,
    active,
    popular
  ) 
  SELECT 
    s.id,
    service_name,
    service_description,
    service_price,
    service_duration,
    service_category,
    true,
    service_popular
  FROM public.salons s
  CROSS JOIN (
    VALUES 
      ('Corte Feminino', 'Corte moderno e personalizado', 50.00, 60, 'Cabelo', true),
      ('Corte Masculino', 'Corte tradicional ou moderno', 30.00, 30, 'Cabelo', true),
      ('Escova', 'Escova modeladora', 35.00, 45, 'Cabelo', false),
      ('Manicure', 'Cuidados completos para as unhas', 25.00, 45, 'Unhas', true),
      ('Pedicure', 'Cuidados completos para os pés', 30.00, 60, 'Unhas', false)
  ) AS default_services(service_name, service_description, service_price, service_duration, service_category, service_popular)
  WHERE s.user_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create salon for new users
DROP TRIGGER IF EXISTS create_salon_for_new_user ON auth.users;
CREATE TRIGGER create_salon_for_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_salon_for_user();