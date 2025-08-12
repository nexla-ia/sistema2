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
  salon_id: string
  customer_id: string
  booking_date: string
  booking_time: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  total_price: number
  total_duration_minutes: number
  notes?: string
  created_at: string
  updated_at: string
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

export interface SlotData {
  time_slot: string
  status: 'available' | 'blocked' | 'booked'
  reason?: string
  booking_id?: string
  bookings?: {
    id: string
    customer: {
      name: string
      phone: string
    }
  }
}

// Constants
const SALON_ID = '4f59cc12-91c1-44fc-b158-697b9056e0cb';

// Auth functions
export const signIn = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({ email, password })
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
  return await supabase
    .from('salons')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)
    .single()
}

export const updateSalonOpeningHours = async (salonId: string, openingHours: any) => {
  return await supabase
    .from('salons')
    .update({ opening_hours: openingHours })
    .eq('id', salonId)
    .select('*')
    .single()
}

// Services functions
export const getServices = async () => {
  return await supabase
    .from('services')
    .select('*')
    .eq('salon_id', SALON_ID)
    .eq('active', true)
    .order('name')
}

export const createService = async (serviceData: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => {
  return await supabase
    .from('services')
    .insert({
      ...serviceData,
      salon_id: SALON_ID
    })
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
export const createCustomer = async (customerData: {
  name: string
  phone: string
  email?: string
  notes?: string
}) => {
  return await supabase
    .from('customers')
    .insert(customerData)
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
  client: {
    name: string
    phone: string
    email?: string
  }
  services: {
    service_id: string
    price: number
  }[]
}) => {
  try {
    console.log('=== CRIANDO AGENDAMENTO ===');
    console.log('Dados recebidos:', bookingData);

    // 1. Verificar se o slot está disponível
    const { data: existingSlot, error: slotError } = await supabase
      .from('slots')
      .select('*')
      .eq('salon_id', SALON_ID)
      .eq('date', bookingData.booking_date)
      .eq('time_slot', bookingData.booking_time)
      .maybeSingle();

    if (slotError) {
      console.error('Erro ao verificar slot:', slotError);
      return { data: null, error: { code: 'SLOT_ERROR', message: 'Erro ao verificar disponibilidade do horário' } };
    }

    if (!existingSlot) {
      return { data: null, error: { code: 'SLOT_NOT_FOUND', message: 'Horário não encontrado' } };
    }

    if (existingSlot.status !== 'available') {
      return { data: null, error: { code: 'SLOT_UNAVAILABLE', message: 'Este horário não está mais disponível' } };
    }

    // 2. Criar ou buscar cliente
    let customer;
    const { data: existingCustomer } = await getCustomerByPhone(bookingData.client.phone);
    
    if (existingCustomer) {
      customer = existingCustomer;
      console.log('Cliente existente encontrado:', customer.id);
    } else {
      const { data: newCustomer, error: customerError } = await createCustomer({
        name: bookingData.client.name,
        phone: bookingData.client.phone,
        email: bookingData.client.email,
        notes: bookingData.notes
      });

      if (customerError) {
        console.error('Erro ao criar cliente:', customerError);
        return { data: null, error: { code: 'CUSTOMER_ERROR', message: 'Erro ao criar dados do cliente' } };
      }

      customer = newCustomer;
      console.log('Novo cliente criado:', customer.id);
    }

    // 3. Criar agendamento
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        salon_id: SALON_ID,
        customer_id: customer.id,
        booking_date: bookingData.booking_date,
        booking_time: bookingData.booking_time,
        status: 'pending',
        total_price: bookingData.total_price,
        total_duration_minutes: bookingData.total_duration_minutes,
        notes: bookingData.notes
      })
      .select('*')
      .single();

    if (bookingError) {
      console.error('Erro ao criar agendamento:', bookingError);
      return { data: null, error: { code: 'BOOKING_ERROR', message: 'Erro ao criar agendamento' } };
    }

    console.log('Agendamento criado:', booking.id);

    // 4. Criar serviços do agendamento
    const bookingServices = bookingData.services.map(service => ({
      booking_id: booking.id,
      service_id: service.service_id,
      price: service.price
    }));

    const { error: servicesError } = await supabase
      .from('booking_services')
      .insert(bookingServices);

    if (servicesError) {
      console.error('Erro ao criar serviços do agendamento:', servicesError);
      // Tentar reverter o agendamento
      await supabase.from('bookings').delete().eq('id', booking.id);
      return { data: null, error: { code: 'SERVICES_ERROR', message: 'Erro ao vincular serviços ao agendamento' } };
    }

    console.log('Serviços vinculados ao agendamento');

    // 5. Marcar slot como agendado
    const { error: updateSlotError } = await supabase
      .from('slots')
      .update({
        status: 'booked',
        booking_id: booking.id
      })
      .eq('salon_id', SALON_ID)
      .eq('date', bookingData.booking_date)
      .eq('time_slot', bookingData.booking_time);

    if (updateSlotError) {
      console.error('Erro ao atualizar slot:', updateSlotError);
      // Não reverter aqui pois o agendamento foi criado com sucesso
    }

    console.log('Slot marcado como agendado');
    console.log('=== AGENDAMENTO CRIADO COM SUCESSO ===');

    return { data: booking, error: null };

  } catch (error) {
    console.error('Erro geral ao criar agendamento:', error);
    return { data: null, error: { code: 'GENERAL_ERROR', message: 'Erro interno do servidor' } };
  }
}

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
    .eq('salon_id', SALON_ID)
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

// Slots functions
export const getAvailableSlots = async (date: string, duration: number = 30): Promise<{ data: TimeSlot[] | null; error: any }> => {
  try {
    console.log('=== DEBUG getAvailableSlots ===');
    console.log('Date:', date);
    console.log('Duration:', duration);
    
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
    
    if (!slots || slots.length === 0) {
      return { data: [], error: null };
    }
    
    // Transform to TimeSlot format
    const timeSlots = slots.map(slot => ({
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

export const getAllSlots = async (date: string) => {
  return await supabase
    .from('slots')
    .select(`
      *,
      bookings:booking_id(
        *,
        customer:customers(*)
      )
    `)
    .eq('salon_id', SALON_ID)
    .eq('date', date)
    .order('time_slot');
}

export const saveBlockedSlots = async (date: string, blockedSlots: string[]) => {
  try {
    // Primeiro, desbloquear todos os slots do dia
    await supabase
      .from('slots')
      .update({ 
        status: 'available',
        blocked_reason: null 
      })
      .eq('salon_id', SALON_ID)
      .eq('date', date)
      .eq('status', 'blocked');

    // Depois, bloquear os slots selecionados
    if (blockedSlots.length > 0) {
      const updates = blockedSlots.map(timeSlot => ({
        salon_id: SALON_ID,
        date,
        time_slot: timeSlot,
        status: 'blocked',
        blocked_reason: 'Bloqueado manualmente'
      }));

      // Usar upsert para atualizar ou inserir
      const { error } = await supabase
        .from('slots')
        .upsert(updates, { 
          onConflict: 'salon_id,date,time_slot',
          ignoreDuplicates: false 
        });

      if (error) throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('Error saving blocked slots:', error);
    return { error };
  }
}

// Reviews functions
export const getReviews = async () => {
  return await supabase
    .from('reviews')
    .select('*')
    .eq('salon_id', SALON_ID)
    .eq('approved', true)
    .order('created_at', { ascending: false })
}

export const getAllReviews = async () => {
  return await supabase
    .from('reviews')
    .select('*')
    .eq('salon_id', SALON_ID)
    .order('created_at', { ascending: false })
}

export const createReview = async (reviewData: {
  customer_name: string
  rating: number
  comment: string
}) => {
  // Usar o telefone como identificador único (simulado)
  const customer_identifier = `${reviewData.customer_name.toLowerCase().replace(/\s+/g, '')}_${Date.now()}`;
  
  return await supabase
    .from('reviews')
    .insert({
      salon_id: SALON_ID,
      customer_name: reviewData.customer_name,
      customer_identifier,
      rating: reviewData.rating,
      comment: reviewData.comment,
      approved: true // Auto-aprovar por enquanto
    })
    .select('*')
    .single()
}

export const approveReview = async (reviewId: string) => {
  return await supabase
    .from('reviews')
    .update({ approved: true })
    .eq('id', reviewId)
}

export const deleteReview = async (reviewId: string) => {
  return await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId)
}