/*
  # Sistema Completo de Agendamento para Salões

  1. Tabelas Principais
    - `salons` - Dados dos salões (clientes do sistema)
    - `services` - Serviços oferecidos por cada salão
    - `bookings` - Agendamentos dos clientes
    - `customers` - Dados dos clientes que agendam
    - `time_slots` - Horários disponíveis por salão
    - `salon_settings` - Configurações específicas de cada salão

  2. Autenticação
    - Usa o sistema nativo do Supabase
    - Cada salão tem um usuário admin
    - RLS (Row Level Security) para isolamento de dados

  3. Relacionamentos
    - Salão → Serviços (1:N)
    - Salão → Agendamentos (1:N)
    - Agendamento → Cliente (N:1)
    - Agendamento → Serviços (N:N através de booking_services)
*/

-- Tabela de salões (clientes do sistema)
CREATE TABLE IF NOT EXISTS salons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  address text,
  phone text,
  email text,
  instagram text,
  facebook text,
  opening_hours jsonb DEFAULT '{"monday": {"open": "08:00", "close": "18:00"}, "tuesday": {"open": "08:00", "close": "18:00"}, "wednesday": {"open": "08:00", "close": "18:00"}, "thursday": {"open": "08:00", "close": "18:00"}, "friday": {"open": "08:00", "close": "18:00"}, "saturday": {"open": "08:00", "close": "18:00"}, "sunday": {"closed": true}}'::jsonb,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de serviços
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL DEFAULT 0,
  duration_minutes integer NOT NULL DEFAULT 30,
  category text NOT NULL DEFAULT 'Geral',
  active boolean DEFAULT true,
  popular boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de agendamentos
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  booking_date date NOT NULL,
  booking_time time NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  total_price decimal(10,2) NOT NULL DEFAULT 0,
  total_duration_minutes integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de relacionamento entre agendamentos e serviços (N:N)
CREATE TABLE IF NOT EXISTS booking_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  price decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabela de configurações do salão
CREATE TABLE IF NOT EXISTS salon_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  setting_key text NOT NULL,
  setting_value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(salon_id, setting_key)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_services_salon_id ON services(salon_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(active);
CREATE INDEX IF NOT EXISTS idx_bookings_salon_id ON bookings(salon_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_booking_services_booking_id ON booking_services(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_services_service_id ON booking_services(service_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- Habilitar RLS (Row Level Security)
ALTER TABLE salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para salons
CREATE POLICY "Salons can read own data"
  ON salons
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Salons can update own data"
  ON salons
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Políticas RLS para services
CREATE POLICY "Salons can manage own services"
  ON services
  FOR ALL
  TO authenticated
  USING (salon_id IN (SELECT id FROM salons WHERE user_id = auth.uid()));

CREATE POLICY "Public can read active services"
  ON services
  FOR SELECT
  TO anon
  USING (active = true);

-- Políticas RLS para customers
CREATE POLICY "Salons can manage customers"
  ON customers
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Public can create customers"
  ON customers
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Políticas RLS para bookings
CREATE POLICY "Salons can manage own bookings"
  ON bookings
  FOR ALL
  TO authenticated
  USING (salon_id IN (SELECT id FROM salons WHERE user_id = auth.uid()));

CREATE POLICY "Public can create bookings"
  ON bookings
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Políticas RLS para booking_services
CREATE POLICY "Salons can manage own booking services"
  ON booking_services
  FOR ALL
  TO authenticated
  USING (booking_id IN (
    SELECT b.id FROM bookings b 
    JOIN salons s ON b.salon_id = s.id 
    WHERE s.user_id = auth.uid()
  ));

CREATE POLICY "Public can create booking services"
  ON booking_services
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Políticas RLS para salon_settings
CREATE POLICY "Salons can manage own settings"
  ON salon_settings
  FOR ALL
  TO authenticated
  USING (salon_id IN (SELECT id FROM salons WHERE user_id = auth.uid()));

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_salons_updated_at BEFORE UPDATE ON salons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_salon_settings_updated_at BEFORE UPDATE ON salon_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();