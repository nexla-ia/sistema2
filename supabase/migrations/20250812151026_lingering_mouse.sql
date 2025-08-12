/*
  # Função RPC para gerar slots de forma idempotente

  1. Nova função RPC
    - `generate_slots_for_period` - Gera slots para um período com horário padrão
    - Idempotente (não duplica slots existentes)
    - Usa UPSERT para evitar conflitos

  2. Funções auxiliares
    - `block_slot_by_user` - Bloqueia um slot específico
    - `unblock_slot_by_user` - Desbloqueia um slot específico
*/

-- Função para gerar slots para um período
CREATE OR REPLACE FUNCTION generate_slots_for_period(
  p_salon_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_open_time TIME,
  p_close_time TIME,
  p_slot_duration INTEGER,
  p_break_start TIME DEFAULT NULL,
  p_break_end TIME DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  current_date DATE;
  current_time TIME;
  slot_minutes INTEGER;
  open_minutes INTEGER;
  close_minutes INTEGER;
  break_start_minutes INTEGER;
  break_end_minutes INTEGER;
BEGIN
  -- Converter tempos para minutos para facilitar cálculos
  open_minutes := EXTRACT(HOUR FROM p_open_time) * 60 + EXTRACT(MINUTE FROM p_open_time);
  close_minutes := EXTRACT(HOUR FROM p_close_time) * 60 + EXTRACT(MINUTE FROM p_close_time);
  
  IF p_break_start IS NOT NULL THEN
    break_start_minutes := EXTRACT(HOUR FROM p_break_start) * 60 + EXTRACT(MINUTE FROM p_break_start);
  END IF;
  
  IF p_break_end IS NOT NULL THEN
    break_end_minutes := EXTRACT(HOUR FROM p_break_end) * 60 + EXTRACT(MINUTE FROM p_break_end);
  END IF;

  -- Loop através de cada data no período
  current_date := p_start_date;
  WHILE current_date <= p_end_date LOOP
    
    -- Loop através de cada slot no dia
    slot_minutes := open_minutes;
    WHILE slot_minutes < close_minutes LOOP
      
      -- Pular horário de intervalo se definido
      IF p_break_start IS NOT NULL AND p_break_end IS NOT NULL AND 
         slot_minutes >= break_start_minutes AND slot_minutes < break_end_minutes THEN
        slot_minutes := slot_minutes + p_slot_duration;
        CONTINUE;
      END IF;
      
      -- Converter minutos de volta para TIME
      current_time := (slot_minutes / 60)::INTEGER * INTERVAL '1 hour' + 
                     (slot_minutes % 60)::INTEGER * INTERVAL '1 minute';
      
      -- Inserir slot (UPSERT para evitar duplicatas)
      INSERT INTO slots (salon_id, date, time_slot, status)
      VALUES (p_salon_id, current_date, current_time::TIME, 'available')
      ON CONFLICT (salon_id, date, time_slot) DO NOTHING;
      
      slot_minutes := slot_minutes + p_slot_duration;
    END LOOP;
    
    current_date := current_date + INTERVAL '1 day';
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para bloquear um slot específico
CREATE OR REPLACE FUNCTION block_slot_by_user(
  p_date DATE,
  p_time TIME,
  p_reason TEXT DEFAULT 'Bloqueado pelo usuário'
) RETURNS VOID AS $$
DECLARE
  salon_id_fixed UUID := '4f59cc12-91c1-44fc-b158-697b9056e0cb';
BEGIN
  UPDATE slots 
  SET 
    status = 'blocked',
    blocked_reason = p_reason,
    booking_id = NULL
  WHERE 
    salon_id = salon_id_fixed 
    AND date = p_date 
    AND time_slot = p_time
    AND status = 'available';
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Slot não encontrado ou não disponível para bloqueio';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Função para desbloquear um slot específico
CREATE OR REPLACE FUNCTION unblock_slot_by_user(
  p_date DATE,
  p_time TIME
) RETURNS VOID AS $$
DECLARE
  salon_id_fixed UUID := '4f59cc12-91c1-44fc-b158-697b9056e0cb';
BEGIN
  UPDATE slots 
  SET 
    status = 'available',
    blocked_reason = NULL,
    booking_id = NULL
  WHERE 
    salon_id = salon_id_fixed 
    AND date = p_date 
    AND time_slot = p_time
    AND status = 'blocked';
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Slot não encontrado ou não está bloqueado';
  END IF;
END;
$$ LANGUAGE plpgsql;