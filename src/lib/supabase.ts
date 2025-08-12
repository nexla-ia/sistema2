import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface Service {
  id: string
  salon_id: string
  name: string
  description?: string
  price: number
  duration_minutes: number
  category: string
  active: boolean
  popular: boolean
  created_at: string
  updated_at: string
}

export interface Salon {
  id: string
  user_id?: string
  name: string
  description?: string
  address?: string
  phone?: string
  email?: string
  instagram?: string
  facebook?: string
  opening_hours?: any
  active: boolean
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  client_id: string
  booking_date: string
  booking_time: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  total_price: number
  total_duration_minutes: number
  notes?: string
  created_at: string
  updated_at: string
  client?: Customer
  customer?: Customer
  booking_services?: BookingService[]
}

export interface BookingService {
  id: string
  booking_id: string
  service_id: string
  price: number
  created_at: string
  service?: Service
}

export interface BlockedSlot {
  id: string
  date: string
  time_slot: string
  status: 'available' | 'blocked' | 'booked'
  booking_id?: string
  reason?: string
  created_at: string
  updated_at: string
}

export interface SalonHours {
  id: string
  day_of_week: number // 0=domingo, 1=segunda, etc
  is_open: boolean
  open_time?: string
  close_time?: string
  break_start?: string
  break_end?: string
  slot_duration: number
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  salon_id: string
  customer_name: string
  customer_identifier: string
  rating: number
  comment: string
  approved: boolean
  created_at: string
  updated_at: string
}

export interface TimeSlot {
  time: string
  available: boolean
}

// Auth functions
export const signIn = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({ email, password })
}
// Função para gerar slots para a visão administrativa
const generateAdminSlotsFromWorkingHours = async (date: string) => {
  try {
    const SALON_ID = '4f59cc12-91c1-44fc-b158-697b9056e0cb';
    
    // Obter o dia da semana (0 = domingo, 1 = segunda, etc.)
    const dateObj = new Date(date + 'T12:00:00');
    const dayOfWeek = dateObj.getDay();
    
    // Buscar horários de funcionamento para este dia
    const { data: workingHours, error } = await supabase
      .from('working_hours')
      .select('*')
      .eq('salon_id', SALON_ID)
      .eq('day_of_week', dayOfWeek)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching working hours for admin:', error);
      return [];
    }
    
    if (!workingHours || !workingHours.is_open) {
      console.log('Salon is closed on this day (admin view)');
      return [];
    }
    
    const slots = [];
    const slotDuration = workingHours.slot_duration || 30;
    
    // Converter horários para minutos
    const timeToMinutes = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const minutesToTime = (minutes: number): string => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };
    
    const openTime = timeToMinutes(workingHours.open_time);
    const closeTime = timeToMinutes(workingHours.close_time);
    const breakStart = workingHours.break_start ? timeToMinutes(workingHours.break_start) : null;
    const breakEnd = workingHours.break_end ? timeToMinutes(workingHours.break_end) : null;
    
    // Gerar slots para visão administrativa
    for (let currentTime = openTime; currentTime < closeTime; currentTime += slotDuration) {
      // Pular horário de intervalo se definido
      if (breakStart && breakEnd && currentTime >= breakStart && currentTime < breakEnd) {
        continue;
      }
      
      const timeStr = minutesToTime(currentTime);
      
      slots.push({
        time_slot: timeStr,
        status: 'available',
        reason: null,
        booking_id: null,
        bookings: undefined
      });
    }
    
    return slots;
    
  } catch (error) {
    console.error('Error generating admin slots from working hours:', error);
    return [];
  }
};
export const getBookings = async (date?: string) => {
  let query = supabase
    .from('bookings')
    .select(`
      *,
      customer:customers(*),
      booking_services(
        *,
        service:services(*)
      )
    `)
    .order('booking_date', { ascending: true })
    .order('booking_time', { ascending: true })

  if (date) {
    query = query.eq('booking_date', date)
  }

  return await query
}

export const updateBookingStatus = async (id: string, status: Booking['status']) => {
  return await supabase
    .from('bookings')
    .update({ status })
    .eq('id', id)
    .select('*')
    .single()
}

// Salon Hours functions
export const getSalonHours = async () => {
  const SALON_ID = '4f59cc12-91c1-44fc-b158-697b9056e0cb';
  
  return await supabase
    .from('working_hours')
    .select('*')
    .eq('salon_id', SALON_ID)
    .order('day_of_week');
}

export const updateSalonHours = async (dayOfWeek: number, updates: Partial<SalonHours>) => {
  const SALON_ID = '4f59cc12-91c1-44fc-b158-697b9056e0cb';
  
  return await supabase
    .from('working_hours')
    .update(updates)
    .eq('salon_id', SALON_ID)
    .eq('day_of_week', dayOfWeek)
    .select('*')
    .single();
}


// Slots functions
export const getAvailableSlots = async (date: string, duration: number = 30): Promise<{ data: TimeSlot[] | null; error: any }> => {
  try {
    console.log('=== DEBUG getAvailableSlots ===');
    console.log('Date:', date);
    console.log('Duration:', duration);
    
    console.log('Fetching available slots for date:', date, 'duration:', duration);
    
    const SALON_ID = '4f59cc12-91c1-44fc-b158-697b9056e0cb';
    
    console.log('Fetching slots from database...');
    const { data: slots, error } = await supabase
      .from('slots')
      .select('*')
      .eq('salon_id', SALON_ID)
      .eq('date', date)
      .order('time_slot');
    
    if (error) {
      console.error('Error fetching slots:', error);
      return { data: [], error };
    }
    
    console.log('Slots from database:', slots);
    console.log('Number of slots found:', slots?.length || 0);
    
    // Se não há slots, retornar array vazio
    if (!slots || slots.length === 0) {
      console.log('No slots found for date');
      return { data: [], error: null };
    }
    
    // Transform to TimeSlot format
    const timeSlots = (slots || []).map(slot => ({
      time: slot.time_slot,
      available: slot.status === 'available'
    }));
    
    console.log('Transformed time slots:', timeSlots);
    console.log('Available slots found:', timeSlots.filter(s => s.available).length);
    
    return { data: timeSlots, error: null };
  } catch (error) {
    console.error('Error in getAvailableSlots:', error);
    return { data: [], error };
  }
}

// Função para gerar slots baseado nos horários de funcionamento
const generateSlotsFromWorkingHours = async (date: string): Promise<TimeSlot[]> => {
  try {
    console.log('=== DEBUG generateSlotsFromWorkingHours ===');
    console.log('Input date:', date);
    
    const SALON_ID = '4f59cc12-91c1-44fc-b158-697b9056e0cb';
    
    // Obter o dia da semana (0 = domingo, 1 = segunda, etc.)
    const dateObj = new Date(date + 'T12:00:00');
    const dayOfWeek = dateObj.getDay();
    
    console.log('Day of week:', dayOfWeek, '(0=Sunday, 1=Monday, etc.)');
    
    // Buscar horários de funcionamento para este dia
    console.log('Fetching working hours for salon:', SALON_ID, 'day:', dayOfWeek);
    const { data: workingHours, error } = await supabase
      .from('working_hours')
      .select('*')
      .eq('salon_id', SALON_ID)
      .eq('day_of_week', dayOfWeek)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching working hours:', error);
      // Se há erro, usar horários padrão
      console.log('Using default working hours due to error');
      return generateDefaultWorkingHours(dayOfWeek);
    }
    
    console.log('Working hours result:', workingHours);
    
    if (!workingHours || !workingHours.is_open) {
      console.log('Salon is closed on this day. Working hours:', workingHours);
      // Se não há working_hours ou está fechado, usar horários padrão
      console.log('Using default working hours - salon appears closed or no data');
      return generateDefaultWorkingHours(dayOfWeek);
    }
    
    console.log('Salon is open! Working hours:', {
      open_time: workingHours.open_time,
      close_time: workingHours.close_time,
      break_start: workingHours.break_start,
      break_end: workingHours.break_end,
      slot_duration: workingHours.slot_duration
    });
    
    const slots: TimeSlot[] = [];
    const slotDuration = workingHours.slot_duration || 30;
    console.log('Using slot duration:', slotDuration, 'minutes');
    
    // Converter horários para minutos para facilitar cálculos
    const timeToMinutes = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const minutesToTime = (minutes: number): string => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };
    
    const openTime = timeToMinutes(workingHours.open_time);
    const closeTime = timeToMinutes(workingHours.close_time);
    const breakStart = workingHours.break_start ? timeToMinutes(workingHours.break_start) : null;
    const breakEnd = workingHours.break_end ? timeToMinutes(workingHours.break_end) : null;
    
    console.log('Time calculations:', {
      openTime: openTime + ' minutes (' + workingHours.open_time + ')',
      closeTime: closeTime + ' minutes (' + workingHours.close_time + ')',
      breakStart: breakStart ? breakStart + ' minutes (' + workingHours.break_start + ')' : 'none',
      breakEnd: breakEnd ? breakEnd + ' minutes (' + workingHours.break_end + ')' : 'none'
    });
    
    // Gerar slots do horário de abertura até o fechamento
    console.log('Generating slots from', openTime, 'to', closeTime, 'with', slotDuration, 'minute intervals');
    for (let currentTime = openTime; currentTime < closeTime; currentTime += slotDuration) {
      // Pular horário de intervalo se definido
      if (breakStart && breakEnd && currentTime >= breakStart && currentTime < breakEnd) {
        console.log('Skipping break time:', minutesToTime(currentTime));
        continue;
      }
      
      const timeStr = minutesToTime(currentTime);
      console.log('Adding slot:', timeStr);
      
      // Simular alguns slots como indisponíveis (30% de chance)
      const available = Math.random() > 0.3;
      
      slots.push({
        time: timeStr,
        available: true // Todos disponíveis por padrão
      });
    }
    
    console.log('Final generated slots:', slots.length, 'slots');
    console.log('Slots list:', slots.map(s => s.time + ' (' + (s.available ? 'available' : 'unavailable') + ')'));
    return slots;
    
  } catch (error) {
    console.error('Error generating slots from working hours:', error);
    // Em caso de erro, usar horários padrão
    const dateObj = new Date(date + 'T12:00:00');
    const dayOfWeek = dateObj.getDay();
    return generateDefaultWorkingHours(dayOfWeek);
  }
};
export const getAllSlots = async (date: string) => {
// Função para gerar horários padrão quando não há working_hours
const generateDefaultWorkingHours = (dayOfWeek: number): TimeSlot[] => {
  console.log('=== GENERATING DEFAULT WORKING HOURS ===');
  console.log('Day of week:', dayOfWeek);
  
  // Domingo fechado
  if (dayOfWeek === 0) {
    console.log('Sunday - closed');
    return [];
  }
  
  const slots: TimeSlot[] = [];
  const slotDuration = 30; // 30 minutos por padrão
  
  // Horários padrão: 8:00 às 18:00
  const openTime = 8 * 60; // 8:00 em minutos
  const closeTime = 18 * 60; // 18:00 em minutos
  const breakStart = 12 * 60; // 12:00 em minutos
  const breakEnd = 13 * 60; // 13:00 em minutos
  
  console.log('Default hours: 8:00-18:00, break: 12:00-13:00, slot duration: 30min');
  
  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };
  
  for (let currentTime = openTime; currentTime < closeTime; currentTime += slotDuration) {
    // Pular horário de almoço
    if (currentTime >= breakStart && currentTime < breakEnd) {
      continue;
    }
    
    const timeStr = minutesToTime(currentTime);
    slots.push({
      time: timeStr,
      available: true
    });
  }
  
  console.log('Generated default slots:', slots.length, 'slots');
  console.log('Default slots:', slots.map(s => s.time));
  return slots;
};
  try {
    const SALON_ID = '4f59cc12-91c1-44fc-b158-697b9056e0cb';
    
    const { data: slots, error } = await supabase
      .from('slots')
      .select(`
        *,
        booking:bookings!slots_booking_id_fkey(
          id,
          customer:customers(
            name,
            phone
          )
        )
      `)
      .eq('salon_id', SALON_ID)
      .eq('date', date)
      .order('time_slot');
    
    if (error) {
      console.error('Error fetching slots:', error);
      return { data: [], error };
    }
    
    // Se não há slots, retornar array vazio
    if (!slots || slots.length === 0) {
      console.log('No slots found for admin view');
      return { data: [], error: null };
    }
    
    const transformedSlots = (slots || []).map(slot => ({
      time_slot: slot.time_slot,
      status: slot.status,
      reason: slot.blocked_reason,
      booking_id: slot.booking_id,
      bookings: slot.booking ? {
        id: slot.booking.id,
        client: slot.booking.customer
      } : undefined
    }));
    
    return { data: transformedSlots, error: null };
  } catch (error) {
    console.error('Error in getAllSlots:', error);
    return { data: [], error };
  }
}

export const blockSlot = async (date: string, timeSlot: string, reason?: string) => {
  const SALON_ID = '4f59cc12-91c1-44fc-b158-697b9056e0cb';
  
  return await supabase.rpc('block_slot', {
    p_salon_id: SALON_ID,
    slot_date: date,
    slot_time: timeSlot,
    reason: reason || 'Bloqueado pelo administrador'
  });
}

export const unblockSlot = async (date: string, timeSlot: string) => {
  const SALON_ID = '4f59cc12-91c1-44fc-b158-697b9056e0cb';
  
  return await supabase.rpc('unblock_slot', {
    p_salon_id: SALON_ID,
    slot_date: date,
    slot_time: timeSlot
  });
}

export const generateSlotsForPeriod = async (startDate: string, endDate: string) => {
  const SALON_ID = '4f59cc12-91c1-44fc-b158-697b9056e0cb';
  
  return await supabase.rpc('generate_slots_for_period', {
    p_salon_id: SALON_ID,
    start_date: startDate,
    end_date: endDate
  });
}

// Reviews functions
export const getReviews = async () => {
  return await supabase
    .from('reviews')
    .select('*')
    .eq('approved', true)
    .order('created_at', { ascending: false });
}

export const createReview = async (review: {
  customer_name: string
  rating: number
  comment: string
}) => {
  // Generate unique identifier based on browser fingerprint
  const generateFingerprint = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx!.textBaseline = 'top';
    ctx!.font = '14px Arial';
    ctx!.fillText('Browser fingerprint', 2, 2);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  };
  const SALON_ID = '4f59cc12-91c1-44fc-b158-697b9056e0cb';
  const reviewData = {
    ...review,
    customer_identifier: generateFingerprint(),
    approved: true, // Auto-approve reviews
    salon_id: SALON_ID
  };

  return await supabase
    .from('reviews')
    .insert([reviewData])
    .select()
    .single();
}

export const getAllReviews = async () => {
  return await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false });
}

export const approveReview = async (reviewId: string) => {
  const SALON_ID = '4f59cc12-91c1-44fc-b158-697b9056e0cb';
  return await supabase
    .from('reviews')
    .update({ approved: true })
    .eq('id', reviewId)
    .eq('salon_id', SALON_ID)
    .select()
    .single();
}

export const deleteReview = async (reviewId: string) => {
  return await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId);
}