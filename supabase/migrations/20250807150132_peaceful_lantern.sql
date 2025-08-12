/*
  # Sistema de Avaliações

  1. Nova Tabela
    - `reviews`
      - `id` (uuid, primary key)
      - `salon_id` (uuid, foreign key)
      - `customer_name` (text)
      - `customer_identifier` (text, hash único por dispositivo/IP)
      - `rating` (integer, 1-5)
      - `comment` (text)
      - `approved` (boolean, para moderação)
      - `created_at` (timestamp)

  2. Segurança
    - RLS habilitado
    - Política para leitura pública de avaliações aprovadas
    - Política para inserção pública (com validação)
    - Índices para performance

  3. Validações
    - Rating entre 1 e 5
    - Limite de uma avaliação por identificador único
    - Moderação manual das avaliações
*/

-- Criar tabela de avaliações
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_identifier text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_reviews_salon_id ON reviews(salon_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(approved);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_unique_customer ON reviews(salon_id, customer_identifier);

-- Políticas RLS
CREATE POLICY "Public can read approved reviews"
  ON reviews
  FOR SELECT
  TO anon, authenticated
  USING (approved = true);

CREATE POLICY "Public can create reviews"
  ON reviews
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Salons can manage own reviews"
  ON reviews
  FOR ALL
  TO authenticated
  USING (salon_id IN (
    SELECT id FROM salons WHERE user_id = auth.uid()
  ))
  WITH CHECK (salon_id IN (
    SELECT id FROM salons WHERE user_id = auth.uid()
  ));

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_reviews_updated_at();