/*
  # Fix RLS policies for booking system

  1. Security Changes
    - Fix customers table RLS to allow anonymous users to create customers
    - Fix bookings table RLS to allow anonymous users to create bookings
    - Fix booking_services table RLS to allow anonymous users to create booking services
    - Maintain security for salon owners to manage their data

  2. Tables Updated
    - customers: Allow anonymous creation and reading
    - bookings: Allow anonymous creation, salon owners manage their bookings
    - booking_services: Allow anonymous creation, salon owners manage their booking services
*/

-- Fix customers table policies
DROP POLICY IF EXISTS "Allow anonymous customer creation" ON customers;
DROP POLICY IF EXISTS "Allow anonymous customer read" ON customers;
DROP POLICY IF EXISTS "Allow salon owners to manage customers" ON customers;

-- Create new customers policies
CREATE POLICY "Anonymous can create customers"
  ON customers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anonymous can read customers"
  ON customers
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can update customers"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete customers"
  ON customers
  FOR DELETE
  TO authenticated
  USING (true);

-- Fix bookings table policies
DROP POLICY IF EXISTS "Public can create bookings" ON bookings;
DROP POLICY IF EXISTS "Salons can manage own bookings" ON bookings;

-- Create new bookings policies
CREATE POLICY "Anonymous can create bookings"
  ON bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anonymous can read bookings"
  ON bookings
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Salon owners can manage their bookings"
  ON bookings
  FOR ALL
  TO authenticated
  USING (salon_id IN (
    SELECT id FROM salons WHERE user_id = auth.uid()
  ))
  WITH CHECK (salon_id IN (
    SELECT id FROM salons WHERE user_id = auth.uid()
  ));

-- Fix booking_services table policies
DROP POLICY IF EXISTS "Public can create booking services" ON booking_services;
DROP POLICY IF EXISTS "Salons can manage own booking services" ON booking_services;

-- Create new booking_services policies
CREATE POLICY "Anonymous can create booking services"
  ON booking_services
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anonymous can read booking services"
  ON booking_services
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Salon owners can manage their booking services"
  ON booking_services
  FOR ALL
  TO authenticated
  USING (booking_id IN (
    SELECT b.id FROM bookings b
    JOIN salons s ON b.salon_id = s.id
    WHERE s.user_id = auth.uid()
  ))
  WITH CHECK (booking_id IN (
    SELECT b.id FROM bookings b
    JOIN salons s ON b.salon_id = s.id
    WHERE s.user_id = auth.uid()
  ));