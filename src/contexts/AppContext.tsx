import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Service, Booking, getServices, createBooking } from '../lib/supabase';

interface AppContextType {
  services: Service[];
  bookings: Booking[];
  addBooking: (booking: any) => void;
  loadServices: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const loadServices = async () => {
    try {
      const { data } = await getServices();
      if (data) {
        setServices(data);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const addBooking = (bookingData: any) => {
    const newBooking: Booking = {
      id: Date.now().toString(),
      salon_id: 'your-default-salon-id',
      customer_id: 'temp-customer-id',
      booking_date: bookingData.date,
      booking_time: bookingData.time,
      status: 'pending',
      total_price: bookingData.totalPrice,
      total_duration_minutes: bookingData.duration,
      notes: bookingData.observations,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setBookings(prev => [...prev, newBooking]);
  };

  const value: AppContextType = {
    services,
    bookings,
    addBooking,
    loadServices
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};