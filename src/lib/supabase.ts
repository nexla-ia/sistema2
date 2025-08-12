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

export const signUp = async (email: string, password: string) => {
  return await supabase.auth.signUp({ 
    email, 
    password,
    options: {
      emailRedirectTo: undefined // Disable email confirmation for development
    }
  })
}

export const signOut = async () => {
  return await supabase.auth.signOut()
}

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Salon functions
export const getSalonByUserId = async (userId: string) => {
  const result = await supabase
    .from('salons')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  
  console.log('getSalonByUserId - userId:', userId)
  console.log('getSalonByUserId - result:', result)
  
  return result
}

// Service functions
export const getServices = async () => {
  let query = supabase
    .from('services')
    .select('*')
    .eq('active', true)
    .order('category')
    .order('name')

  return await query
}

export const createService = async (service: Omit<Service, 'id' | 'salon_id' | 'created_at' | 'updated_at'>) => {
  // Get current user to find their salon
  const user = await getCurrentUser();
  if (!user) {
    return { data: null, error: { message: 'Usuário não autenticado' } };
  }

  // Get user's salon
  const { data: salon, error: salonError } = await getSalonByUserId(user.id);
  if (salonError || !salon) {
    return { data: null, error: { message: 'Salão não encontrado para este usuário' } };
  }

  return await supabase
    .from('services')
    .insert([{ ...service, salon_id: salon.id }])
    .select('*')
    .single()
}

export const updateService = async (id: string, updates: Partial<Service>) => {
  return await supabase
    .from('services')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()
}

export const deleteService = async (id: string) => {
  return await supabase
    .from('services')
    .delete()
    .eq('id', id)
}

// Customer functions
export const createCustomer = async (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => {
  return await supabase
    .from('customers')
    .insert([customer])
    .select('*')
    .single()
}

export const getCustomerByPhone = async (phone: string) => {
  return await supabase
    .from('customers')
    .select('*')
    .eq('phone', phone)
    .maybeSingle()
}

// Booking functions
export const createBooking = async (bookingData: {
  booking_date: string
  booking_time: string
  total_price: number
  total_duration_minutes: number
  notes?: string
  client: { name: string; phone: string; email?: string }
  services: { service_id: string; price: number }[]
}) => {
  try {
    console.log('=== CREATING BOOKING ===', bookingData);

    // Normalizar o horário para o formato correto
    const timeSlot = bookingData.booking_time.length === 5 
      ? `${bookingData.booking_time}:00` 
      : bookingData.booking_time;

    // Usar o SALON_ID do ambiente
    const SALON_ID = import.meta.env.VITE_SALON_ID;
    if (!SALON_ID) {
      console.error('SALON_ID not configured');
      return { data: null, error: { message: 'Configuração do salão não encontrada', code: 'SALON_NOT_CONFIGURED' } };
    }

    console.log('Verificando disponibilidade do slot:', { date: bookingData.booking_date, time: timeSlot });

    // Criar/recuperar cliente primeiro
    let customerId: string;
    const { data: existingCustomer, error: customerSearchError } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', bookingData.client.phone)
      .maybeSingle();

    if (customerSearchError) {
      console.error('Error searching customer:', customerSearchError);
      return { data: null, error: { message: 'Erro ao buscar cliente', code: 'CUSTOMER_SEARCH_ERROR' } };
    }

    if (existingCustomer) {
      customerId = existingCustomer.id;
      console.log('Cliente existente encontrado:', customerId);
    } else {
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert([{
          name: bookingData.client.name,
          phone: bookingData.client.phone,
          email: bookingData.client.email || null
        }])
        .select('id')
        .single();

      if (customerError || !newCustomer) {
        console.error('Error creating customer:', customerError);
        return { data: null, error: { message: 'Erro ao criar cliente', code: 'CUSTOMER_ERROR' } };
      }
      customerId = newCustomer.id;
      console.log('Novo cliente criado:', customerId);
    }

    // Criar o agendamento
    console.log('Criando agendamento com dados:', {
      salon_id: SALON_ID,
      customer_id: customerId,
      booking_date: bookingData.booking_date,
      booking_time: timeSlot,
      total_price: bookingData.total_price,
      total_duration_minutes: bookingData.total_duration_minutes,
      notes: bookingData.notes,
      status: 'confirmed'
    });

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([{
        salon_id: SALON_ID,
        customer_id: customerId,
        booking_date: bookingData.booking_date,
        booking_time: timeSlot,
        total_price: bookingData.total_price,
        total_duration_minutes: bookingData.total_duration_minutes,
        notes: bookingData.notes || null,
        status: 'confirmed'
      }])
      .select('id')
      .single();

    if (bookingError || !booking) {
      console.error('Error creating booking:', bookingError);
      return { data: null, error: { message: 'Erro ao criar agendamento', code: 'BOOKING_ERROR' } };
    }
    
    console.log('Agendamento criado com sucesso:', booking.id);

    // Adicionar serviços ao agendamento
    if (bookingData.services?.length) {
      const bookingServices = bookingData.services.map(s => ({
        booking_id: booking.id,
        service_id: s.service_id,
        price: s.price
      }));
      
      console.log('Adicionando serviços:', bookingServices);
      
      const { error: servicesError } = await supabase
        .from('booking_services')
        .insert(bookingServices);
        
      if (servicesError) {
        console.error('Error adding services:', servicesError);
        // Não falha o agendamento por causa dos serviços
      }
    }

    console.log('=== BOOKING CREATED SUCCESSFULLY ===');
    return { data: { id: booking.id, customer_id: customerId }, error: null };

  } catch (error) {
    console.error('Error creating booking:', error);
    return { data: null, error: { message: 'Erro interno', code: 'INTERNAL_ERROR' } };
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
  const salonId = import.meta.env.VITE_SALON_ID;
  if (!salonId) {
    console.error('SALON_ID not configured');
    return { data: [], error: { message: 'Configuração não encontrada' } };
  }
  
  return await supabase
    .from('working_hours')
    .select('*')
    .eq('salon_id', salonId)
    .order('day_of_week');
}

export const updateSalonHours = async (dayOfWeek: number, updates: Partial<SalonHours>) => {
  const salonId = import.meta.env.VITE_SALON_ID;
  if (!salonId) {
    console.error('SALON_ID not configured');
    return { data: null, error: { message: 'Configuração não encontrada' } };
  }
  
  return await supabase
    .from('working_hours')
    .update(updates)
    .eq('salon_id', salonId)
    .eq('day_of_week', dayOfWeek)
    .select('*')
    .single();
}


// Slots functions
export const getAvailableSlots = async (date: string, duration: number = 30): Promise<{ data: TimeSlot[] | null; error: any }> => {
  try {
    console.log('Fetching available slots for date:', date, 'duration:', duration);
    
    // Usar o SALON_ID do ambiente
    const salonId = import.meta.env.VITE_SALON_ID;
    if (!salonId) {
      console.error('SALON_ID not configured');
      return { data: [], error: { message: 'Configuração não encontrada' } };
    }
    
    const { data: slots, error } = await supabase
      .from('slots')
      .select('*')
      .eq('salon_id', salonId)
      .eq('date', date)
      .order('time_slot');
    
    if (error) {
      console.error('Error fetching slots:', error);
      return { data: [], error };
    }
    
    console.log('Raw slots from database:', slots);
    
    // Transform to TimeSlot format
    const timeSlots = (slots || []).map(slot => ({
      time: slot.time_slot,
      available: slot.status === 'available'
    }));
    
    console.log('Available slots found:', timeSlots.filter(s => s.available).length);
    console.log('All time slots:', timeSlots);
    
    return { data: timeSlots, error: null };
  } catch (error) {
    console.error('Error in getAvailableSlots:', error);
    return { data: [], error };
  }
}

export const getAllSlots = async (date: string) => {
  try {
    const salonId = import.meta.env.VITE_SALON_ID;
    if (!salonId) {
      console.error('SALON_ID not configured');
      return { data: [], error: { message: 'Configuração não encontrada' } };
    }
    
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
      .eq('salon_id', salonId)
      .eq('date', date)
      .order('time_slot');
    
    if (error) {
      console.error('Error fetching slots:', error);
      return { data: [], error };
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
  const salonId = import.meta.env.VITE_SALON_ID;
  if (!salonId) {
    console.error('SALON_ID not configured');
    return { data: null, error: { message: 'Configuração não encontrada' } };
  }
  
  return await supabase.rpc('block_slot', {
    p_salon_id: salonId,
    slot_date: date,
    slot_time: timeSlot,
    reason: reason || 'Bloqueado pelo administrador'
  });
}

export const unblockSlot = async (date: string, timeSlot: string) => {
  const salonId = import.meta.env.VITE_SALON_ID;
  if (!salonId) {
    console.error('SALON_ID not configured');
    return { data: null, error: { message: 'Configuração não encontrada' } };
  }
  
  return await supabase.rpc('unblock_slot', {
    p_salon_id: salonId,
    slot_date: date,
    slot_time: timeSlot
  });
}

export const generateSlotsForPeriod = async (startDate: string, endDate: string) => {
  const salonId = import.meta.env.VITE_SALON_ID;
  if (!salonId) {
    console.error('SALON_ID not configured');
    return { data: null, error: { message: 'Configuração não encontrada' } };
  }
  
  return await supabase.rpc('generate_slots_for_period', {
    p_salon_id: salonId,  // ou _salon
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