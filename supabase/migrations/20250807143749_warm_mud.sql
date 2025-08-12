/*
  # Create blocked slots table

  1. New Tables
    - `blocked_slots`
      - `id` (uuid, primary key)
      - `salon_id` (uuid, foreign key to salons)
      - `date` (date)
      - `time_slot` (time)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `blocked_slots` table
    - Add policy for salon owners to manage their blocked slots
*/

CREATE TABLE IF NOT EXISTS blocked_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  date date NOT NULL,
  time_slot time NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(salon_id, date, time_slot)
);

ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salons can manage own blocked slots"
  ON blocked_slots
  FOR ALL
  TO authenticated
  USING (salon_id IN (
    SELECT id FROM salons WHERE user_id = auth.uid()
  ))
  WITH CHECK (salon_id IN (
    SELECT id FROM salons WHERE user_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS idx_blocked_slots_salon_date ON blocked_slots(salon_id, date);

CREATE TRIGGER update_blocked_slots_updated_at
  BEFORE UPDATE ON blocked_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();