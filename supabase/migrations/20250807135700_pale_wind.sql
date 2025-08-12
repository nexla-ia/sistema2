/*
  # Correção completa do backend - Fix de todas as tabelas e policies

  1. Tabelas
    - Verificar e corrigir estrutura de todas as tabelas
    - Adicionar campos faltantes
    - Corrigir tipos de dados
  
  2. Segurança
    - Revisar e corrigir todas as RLS policies
    - Garantir acesso adequado para usuários autenticados e anônimos
    
  3. Funções
    - Adicionar funções auxiliares necessárias
    - Corrigir triggers
*/

-- Primeiro, vamos garantir que a tabela users existe (Supabase auth.users)
-- Criar tabela de usuários customizada se necessário
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS na tabela users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy para users
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Corrigir tabela salons
DROP TABLE IF EXISTS salons CASCADE;
CREATE TABLE salons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  address text,
  phone text,
  email text,
  instagram text,
  facebook text,
  opening_hours jsonb DEFAULT '{
    "monday": {"open": "08:00", "close": "18:00"},
    "tuesday": {"open": "08:00", "close": "18:00"},
    "wednesday": {"open": "08:00", "close": "18:00"},
    "thursday": {"open": "08:00", "close": "18:00"},
    "friday": {"open": "08:00", "close": "18:00"},
    "saturday": {"open": "08:00", "close": "18:00"},
    "sunday": {"closed": true}
  }'::jsonb,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE salons ENABLE ROW LEVEL SECURITY;

-- Policies para salons
DROP POLICY IF EXISTS "Salons can read own data" ON salons;
DROP POLICY IF EXISTS "Salons can update own data" ON salons;
DROP POLICY IF EXISTS "Salons can insert own data" ON salons;
DROP POLICY IF EXISTS "Public can read active salons" ON salons;

CREATE POLICY "Salons can read own data"
  ON salons
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Salons can update own data"
  ON salons
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Salons can insert own data"
  ON salons
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Public can read active salons"
  ON salons
  FOR SELECT
  TO anon
  USING (active = true);

-- Corrigir tabela services
DROP TABLE IF EXISTS services CASCADE;
CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  price numeric(10,2) DEFAULT 0 NOT NULL,
  duration_minutes integer DEFAULT 30 NOT NULL,
  category text DEFAULT 'Geral' NOT NULL,
  active boolean DEFAULT true,
  popular boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Policies para services
DROP POLICY IF EXISTS "Public can read active services" ON services;
DROP POLICY IF EXISTS "Salons can manage own services" ON services;

CREATE POLICY "Public can read active services"
  ON services
  FOR SELECT
  TO anon, authenticated
  USING (active = true);

CREATE POLICY "Salons can manage own services"
  ON services
  FOR ALL
  TO authenticated
  USING (
    salon_id IN (
      SELECT id FROM salons WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    salon_id IN (
      SELECT id FROM salons WHERE user_id = auth.uid()
    )
  );

-- Corrigir tabela customers
DROP TABLE IF EXISTS customers CASCADE;
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Policies para customers
DROP POLICY IF EXISTS "Public can create customers" ON customers;
DROP POLICY IF EXISTS "Salons can manage customers" ON customers;

CREATE POLICY "Public can create customers"
  ON customers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Salons can manage customers"
  ON customers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Corrigir tabela bookings
DROP TABLE IF EXISTS bookings CASCADE;
CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  booking_date date NOT NULL,
  booking_time time NOT NULL,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  total_price numeric(10,2) DEFAULT 0 NOT NULL,
  total_duration_minutes integer DEFAULT 0 NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policies para bookings
DROP POLICY IF EXISTS "Public can create bookings" ON bookings;
DROP POLICY IF EXISTS "Salons can manage own bookings" ON bookings;

CREATE POLICY "Public can create bookings"
  ON bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Salons can manage own bookings"
  ON bookings
  FOR ALL
  TO authenticated
  USING (
    salon_id IN (
      SELECT id FROM salons WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    salon_id IN (
      SELECT id FROM salons WHERE user_id = auth.uid()
    )
  );

-- Corrigir tabela booking_services
DROP TABLE IF EXISTS booking_services CASCADE;
CREATE TABLE booking_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  price numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE booking_services ENABLE ROW LEVEL SECURITY;

-- Policies para booking_services
DROP POLICY IF EXISTS "Public can create booking services" ON booking_services;
DROP POLICY IF EXISTS "Salons can manage own booking services" ON booking_services;

CREATE POLICY "Public can create booking services"
  ON booking_services
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Salons can manage own booking services"
  ON booking_services
  FOR ALL
  TO authenticated
  USING (
    booking_id IN (
      SELECT b.id FROM bookings b
      JOIN salons s ON b.salon_id = s.id
      WHERE s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    booking_id IN (
      SELECT b.id FROM bookings b
      JOIN salons s ON b.salon_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

-- Corrigir tabela salon_settings
DROP TABLE IF EXISTS salon_settings CASCADE;
CREATE TABLE salon_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  setting_key text NOT NULL,
  setting_value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(salon_id, setting_key)
);

ALTER TABLE salon_settings ENABLE ROW LEVEL SECURITY;

-- Policies para salon_settings
DROP POLICY IF EXISTS "Salons can manage own settings" ON salon_settings;

CREATE POLICY "Salons can manage own settings"
  ON salon_settings
  FOR ALL
  TO authenticated
  USING (
    salon_id IN (
      SELECT id FROM salons WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    salon_id IN (
      SELECT id FROM salons WHERE user_id = auth.uid()
    )
  );

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_salons_updated_at ON salons;
CREATE TRIGGER update_salons_updated_at
  BEFORE UPDATE ON salons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_salon_settings_updated_at ON salon_settings;
CREATE TRIGGER update_salon_settings_updated_at
  BEFORE UPDATE ON salon_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_services_salon_id ON services(salon_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(active);
CREATE INDEX IF NOT EXISTS idx_bookings_salon_id ON bookings(salon_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_booking_services_booking_id ON booking_services(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_services_service_id ON booking_services(service_id);

-- Inserir dados de exemplo para teste
DO $$
DECLARE
  test_salon_id uuid;
  test_customer_id uuid;
  test_booking_id uuid;
  service1_id uuid;
  service2_id uuid;
BEGIN
  -- Inserir salão de exemplo (apenas se não existir)
  INSERT INTO salons (name, description, address, phone, email, instagram, facebook)
  VALUES (
    'Centro Terapêutico Bem-Estar',
    'Cuidando da sua saúde mental e física com carinho e profissionalismo.',
    'Avenida Curitiba, nº 3886, Jardim das Oliveiras, Vilhena – Rondônia',
    '(69) 99283-9458',
    'centroobemestar@gmail.com',
    'https://instagram.com/centroterapeuticoo',
    'https://www.facebook.com/share/1Dr82JT5NV/'
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO test_salon_id;

  -- Se não inseriu (já existia), pegar o ID existente
  IF test_salon_id IS NULL THEN
    SELECT id INTO test_salon_id FROM salons LIMIT 1;
  END IF;

  -- Inserir serviços de exemplo
  INSERT INTO services (salon_id, name, description, price, duration_minutes, category, popular)
  VALUES 
    (test_salon_id, 'Massagem Relaxante', 'Massagem terapêutica para alívio do estresse', 80.00, 60, 'Massoterapia', true),
    (test_salon_id, 'Acupuntura', 'Tratamento com agulhas para diversos problemas', 120.00, 45, 'Medicina Alternativa', true),
    (test_salon_id, 'Reflexologia', 'Massagem nos pés para estimular pontos reflexos', 60.00, 30, 'Massoterapia', false),
    (test_salon_id, 'Reiki', 'Terapia energética para equilíbrio e bem-estar', 70.00, 45, 'Terapias Energéticas', false),
    (test_salon_id, 'Aromaterapia', 'Tratamento com óleos essenciais', 90.00, 50, 'Terapias Holísticas', false)
  ON CONFLICT DO NOTHING;

END $$;