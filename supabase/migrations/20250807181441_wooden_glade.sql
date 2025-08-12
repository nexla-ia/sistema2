/*
  # Fix customers table RLS policy

  1. Security Changes
    - Drop existing restrictive policy on customers table
    - Add new policy allowing anonymous users to insert customers
    - Ensure authenticated users can still manage all customers
  
  2. Changes Made
    - Remove old "Public can create customers" policy
    - Add new "Anyone can create customers" policy for INSERT
    - Keep existing "Salons can manage customers" policy for full access
*/

-- Drop the existing policy that might be too restrictive
DROP POLICY IF EXISTS "Public can create customers" ON customers;

-- Create a new policy that explicitly allows anonymous users to insert
CREATE POLICY "Anyone can create customers"
  ON customers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Ensure authenticated users can still read/update/delete customers
-- (This policy should already exist, but let's make sure)
DROP POLICY IF EXISTS "Salons can manage customers" ON customers;

CREATE POLICY "Salons can manage customers"
  ON customers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);