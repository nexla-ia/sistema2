/*
  # Fix customers table RLS policy

  1. Security Changes
    - Drop existing problematic RLS policy for customers
    - Create new policy allowing anonymous users to create customers
    - Ensure authenticated users can manage all customer data
    - Fix booking creation for public users

  This fixes the error: "new row violates row-level security policy for table customers"
*/

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Anyone can create customers" ON customers;
DROP POLICY IF EXISTS "Public can create customers" ON customers;
DROP POLICY IF EXISTS "Salons can manage customers" ON customers;

-- Create new policy allowing anonymous users to create customers
CREATE POLICY "Allow anonymous customer creation"
  ON customers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow authenticated users (salon owners) to read and update all customers
CREATE POLICY "Allow salon owners to manage customers"
  ON customers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anonymous users to read customers (needed for booking process)
CREATE POLICY "Allow anonymous customer read"
  ON customers
  FOR SELECT
  TO anon, authenticated
  USING (true);