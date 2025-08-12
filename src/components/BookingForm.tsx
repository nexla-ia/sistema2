import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import Modal from './Modal';
import { useModal } from '../hooks/useModal';
import { Service, Salon, createBooking, getAvailableSlots } from '../lib/supabase';
import { Calendar, Clock, User, Phone, Mail, MessageSquare, ArrowLeft, Check } from 'lucide-react';

interface BookingFormProps {
  selectedServices: Service[];
  onBack: () => void;
  salon: Salon | null;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface DaySchedule {
  date: string;
  slots: TimeSlot[];
}
const BookingForm = ({ selectedServices, onBack, salon }: BookingFormProps) => {
  const { addBooking } = useApp();
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
    observations: ''
  });
  const [confirmed, setConfirmed] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const { modal, hideModal, showSuccess, showError } = useModal();

  // Generate available dates (next 30 days, excluding Sundays)
  const generateAvailableDates = () => {
    const dates = [];
    // Use local date to avoid timezone issues
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to avoid timezone issues
    const currentHour = today.getHours();
    
    // Start from today (i = 0) if it's before 18:00, otherwise start from tomorrow (i = 1)
    const startDay = currentHour < 18 ? 0 : 1;
    
    for (let i = startDay; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      date.setHours(0, 0, 0, 0); // Ensure consistent time
      
      // Skip Sundays (0)
      if (date.getDay() !== 0) {
        dates.push({
          date: date.toISOString().split('T')[0],
          day: date.getDate(),
          month: date.toLocaleDateString('pt-BR', { month: 'short' }),
          weekday: date.toLocaleDateString('pt-BR', { weekday: 'short' })
        });
      }
    }
    
    return dates.slice(0, 14); // Show next 14 available days
  };

  // Format date for display
  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Get current date for comparison
  const getCurrentDate = () => new Date().toISOString().split('T')[0];

  // Generate all possible time slots (8:00 to 19:00, excluding lunch break)
  const generateAllTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    for (let hour = 8; hour < 19; hour++) {
      // Skip lunch break (12:00-13:00)
      if (hour === 12) continue;
      
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        available: Math.random() > 0.3 // Simulate some slots being unavailable
      });
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:30`,
        available: Math.random() > 0.3 // Simulate some slots being unavailable
      });
    }
    return slots;
  };

  // Simulate API call to fetch available slots for selected date
  const fetchAvailableSlots = async (date: string, serviceIds: string[]) => {
    console.log('=== BUSCANDO HORÁRIOS DISPONÍVEIS ===');
    console.log('Data:', date);
    
    setLoading(true);
    try {
      const totalDuration = selectedServices.reduce((sum, service) => sum + service.duration_minutes, 0);
      console.log('Duração total dos serviços:', totalDuration, 'minutos');
      
      const { data: slots } = await getAvailableSlots(date, totalDuration);
      console.log('Slots retornados da API:', slots);
      console.log('Quantidade de slots disponíveis:', slots?.filter(s => s.available).length || 0);
      
      setAvailableSlots(slots || []);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle date selection and fetch available slots
  const handleDateSelect = (date: string) => {
    console.log('=== SELECIONANDO DATA ===');
    console.log('Data selecionada:', date);
    console.log('Serviços selecionados:', selectedServices.map(s => s.name));
    
    setSelectedDate(date);
    setSelectedTime(''); // Reset selected time when date changes
    fetchAvailableSlots(date, selectedServices.map(s => s.id));
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const bookingData = {
        booking_date: selectedDate,
        booking_time: selectedTime,
        total_price: getTotalPrice(),
        total_duration_minutes: selectedServices.reduce((sum, service) => sum + service.duration_minutes, 0),
        notes: customerData.observations,
        client: {
          name: customerData.name,
          phone: customerData.phone,
          email: customerData.email
        },
        services: selectedServices.map(s => ({
          service_id: s.id,
          price: s.price
        }))
      };

      const { data, error } = await createBooking(bookingData);

      if (error) {
        console.error('Error creating booking:', error);
        
        // Tratar diferentes tipos de erro
        if (error.code === 'SLOT_UNAVAILABLE') {
          showError('Horário Indisponível', error.message);
        } else if (error.code === 'DUPLICATE_BOOKING') {
          showError('Horário Ocupado', error.message);
        } else if (error.code === 'CUSTOMER_ERROR') {
          showError('Erro nos Dados', error.message);
        } else {
          showError('Erro', 'Erro ao criar agendamento. Verifique os dados e tente novamente.');
        }
        return;
      }

      addBooking({
        customerName: customerData.name,
        customerPhone: customerData.phone,
        customerEmail: customerData.email,
        services: selectedServices.map(s => s.name),
        date: selectedDate,
        time: selectedTime,
        status: 'pending',
        totalPrice: getTotalPrice(),
        duration: getTotalDuration(),
        observations: customerData.observations
      });

      setConfirmed(true);
    } catch (error) {
      console.error('Error creating booking:', error);
      showError('Erro', 'Erro ao criar agendamento. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerDataChange = (field: string, value: string) => {
    setCustomerData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getTotalPrice = () => {
    return selectedServices.reduce((total, service) => total + service.price, 0);
  };

  const getTotalDuration = () => {
    const totalMinutes = selectedServices.reduce((total, service) => {
      return total + service.duration_minutes;
    }, 0);
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h${minutes}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}min`;
    }
  };
  if (confirmed) {
    return (
      <>
        <section className="py-16 bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Agendamento Realizado!
              </h2>
              
              <p className="text-lg text-gray-600 mb-8">
                Seu horário está confirmado! Aguardamos você no nosso centro terapêutico.
              </p>
              
              {salon && (
                <div className="bg-blue-50 rounded-xl p-4 mb-8">
                  <h4 className="font-semibold text-blue-900 mb-2">Informações do Salão:</h4>
                  <p className="text-blue-800"><strong>{salon.name}</strong></p>
                  {salon.address && <p className="text-blue-700">{salon.address}</p>}
                  {salon.phone && <p className="text-blue-700">📱 {salon.phone}</p>}
                </div>
              )}
              
              <div className="bg-gray-50 rounded-xl p-6 mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">Resumo do seu agendamento:</h3>
                <div className="space-y-2 text-left">
                  <div>
                    <strong>Serviços:</strong>
                    <ul className="ml-4 mt-1">
                      {selectedServices.map(service => (
                        <li key={service.id} className="flex justify-between">
                          <span>• {service.name}</span>
                          <span>R$ {service.price}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p><strong>Data:</strong> {new Date(selectedDate).toLocaleDateString('pt-BR')}</p>
                  <p><strong>Data:</strong> {formatDateForDisplay(selectedDate)}</p>
                  <p><strong>Horário:</strong> {selectedTime}</p>
                  <p><strong>Duração Total:</strong> {getTotalDuration()}</p>
                  <p><strong>Valor Total:</strong> R$ {getTotalPrice()}</p>
                  <p><strong>Cliente:</strong> {customerData.name}</p>
                  <p><strong>Telefone:</strong> {customerData.phone}</p>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6">
                Em breve entraremos em contato para confirmar todos os detalhes.
              </p>
              
              <button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-rose-500 to-pink-600 text-white px-8 py-3 rounded-full font-semibold hover:from-rose-600 hover:to-pink-700 transition-all duration-300"
              >
                Fazer Novo Agendamento
              </button>
            </div>
          </div>
        </section>
        <Modal
          isOpen={modal.isOpen}
          onClose={hideModal}
          title={modal.title}
          message={modal.message}
          type={modal.type}
          onConfirm={modal.onConfirm}
          showCancel={modal.showCancel}
          confirmText={modal.confirmText}
          cancelText={modal.cancelText}
        />
      </>
    );
  }

  return (
    <>
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-clinic-500 to-clinic-600 px-8 py-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={onBack}
                  className="text-white hover:text-clinic-100 transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-white">Agendar Horário</h2>
                <div className="w-6"></div>
              </div>
              
              <div className="mt-4 bg-white/20 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-2">
                  {selectedServices.length === 1 ? selectedServices[0].name : `${selectedServices.length} Serviços Selecionados`}
                </h3>
                {selectedServices.length > 1 && (
                  <div className="space-y-1 mb-2">
                    {selectedServices.map(service => (
                      <div key={service.id} className="text-white/80 text-sm">
                        • {service.name}
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between text-white/90 text-sm">
                  <span>R$ {getTotalPrice()}</span>
                  <span>{getTotalDuration()}</span>
                </div>
              </div>
            </div>

            {/* Step Indicator */}
            <div className="px-8 py-6 border-b">
              <div className="flex items-center justify-center space-x-4">
                {[1, 2, 3].map(stepNumber => (
                  <div key={stepNumber} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= stepNumber 
                        ? 'bg-clinic-500 text-white' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {stepNumber}
                    </div>
                    {stepNumber < 3 && (
                      <div className={`w-16 h-1 mx-2 ${
                        step > stepNumber ? 'bg-clinic-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>Data</span>
                <span>Horário</span>
                <span>Dados</span>
              </div>
            </div>

            <div className="p-8">
              {/* Step 1: Date Selection */}
              {step === 1 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-rose-500" />
                    Escolha a data
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    {generateAvailableDates().map(dateInfo => (
                      <button
                        key={dateInfo.date}
                        onClick={() => handleDateSelect(dateInfo.date)}
                        className={`p-4 rounded-xl border-2 transition-all text-center ${
                          selectedDate === dateInfo.date
                            ? 'border-rose-500 bg-rose-50'
                            : 'border-gray-200 hover:border-rose-300'
                        }`}
                      >
                        <div className="text-sm text-gray-500">{dateInfo.weekday}</div>
                        <div className="text-xl font-bold text-gray-900">{dateInfo.day}</div>
                        <div className="text-sm text-gray-500">{dateInfo.month}</div>
                      </button>
                    ))}
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setStep(2)}
                      disabled={!selectedDate}
                      className="bg-clinic-500 text-white px-6 py-3 rounded-xl font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-clinic-600 transition-colors"
                    >
                      Próximo
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Time Selection */}
              {step === 2 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-rose-500" />
                    Escolha o horário
                  </h3>
                  
                  <div className="mb-4 p-4 bg-blue-50 rounded-xl">
                    <p className="text-sm text-blue-800">
                      <strong>Data selecionada:</strong> {formatDateForDisplay(selectedDate)}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {selectedServices.length === 1 
                        ? `Serviço: ${selectedServices[0].name} (${selectedServices[0].duration_minutes}min)`
                        : `${selectedServices.length} serviços selecionados (${getTotalDuration()})`
                      }
                    </p>
                  </div>
                  
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      {availableSlots.filter(slot => slot.available).length} horários disponíveis
                    </p>
                    <div className="flex items-center space-x-4 text-xs">
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-green-200 border border-green-400 rounded"></div>
                        <span className="text-gray-600">Disponível</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-gray-200 border border-gray-400 rounded"></div>
                        <span className="text-gray-600">Ocupado</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {availableSlots.map(slot => (
                      <button
                        key={slot.time}
                        onClick={() => slot.available && setSelectedTime(slot.time)}
                        disabled={!slot.available}
                        className={`p-3 rounded-xl border-2 transition-all duration-300 relative transform hover:scale-105 ${
                          selectedTime === slot.time
                        ? 'border-rose-500 bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 shadow-lg scale-105'
                           : slot.available
                             ? 'border-gray-200 hover:border-rose-300 bg-green-50 hover:bg-green-100 hover:shadow-md'
                             : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                    }`}
                      >
                        {slot.time}
                        {!slot.available && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-full h-0.5 bg-red-400 transform rotate-45 animate-pulse"></div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  
                  {availableSlots.filter(slot => slot.available).length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">Não há horários disponíveis para esta data.</p>
                      <button
                        onClick={() => setStep(1)}
                        className="text-rose-500 hover:text-rose-600 font-medium"
                      >
                        Escolher outra data
                      </button>
                    </div>
                  )}
                  
                  <div className="mt-6 flex justify-between">
                    <button
                      onClick={() => setStep(1)}
                      className="text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      disabled={!selectedTime}
                      className="bg-clinic-500 text-white px-6 py-3 rounded-xl font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-clinic-600 transition-colors"
                    >
                      Próximo
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Customer Data */}
              {step === 3 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <User className="w-5 h-5 mr-2 text-rose-500" />
                    Seus dados
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome completo *
                      </label>
                      <input
                        type="text"
                        value={customerData.name}
                        onChange={(e) => handleCustomerDataChange('name', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                        placeholder="Digite seu nome completo"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        WhatsApp/Telefone *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          value={customerData.phone}
                          onChange={(e) => handleCustomerDataChange('phone', e.target.value)}
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        E-mail (opcional)
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={customerData.email}
                          onChange={(e) => handleCustomerDataChange('email', e.target.value)}
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                          placeholder="seu@email.com"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Observações
                      </label>
                      <div className="relative">
                        <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <textarea
                          value={customerData.observations}
                          onChange={(e) => handleCustomerDataChange('observations', e.target.value)}
                          rows={3}
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                          placeholder="Ex: quero francesinha, sou nova cliente, etc."
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Booking Summary */}
                  <div className="mt-8 p-6 bg-gray-50 rounded-xl">
                    <h4 className="font-semibold text-gray-900 mb-4">Resumo do agendamento:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Serviços:</span>
                        <span className="font-medium">{selectedServices.length}</span>
                      </div>
                      {selectedServices.length > 1 && (
                        <div className="ml-4 space-y-1">
                          {selectedServices.map(service => (
                            <div key={service.id} className="flex justify-between text-xs text-gray-600">
                              <span>• {service.name}</span>
                              <span>R$ {service.price}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Data:</span>
                        <span className="font-medium">{formatDateForDisplay(selectedDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Horário:</span>
                        <span className="font-medium">{selectedTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Duração:</span>
                        <span className="font-medium">{getTotalDuration()}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold text-green-600 pt-2 border-t">
                        <span>Valor:</span>
                        <span>R$ {getTotalPrice()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-between">
                    <button
                      onClick={() => setStep(2)}
                      className="text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={!customerData.name || !customerData.phone}
                      className="bg-gradient-to-r from-clinic-500 to-clinic-600 text-white px-8 py-3 rounded-xl font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed hover:from-clinic-600 hover:to-clinic-700 transition-all flex items-center justify-center"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Confirmando...
                        </>
                      ) : (
                        'Confirmar Agendamento'
                      )}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </section>
      <Modal
        isOpen={modal.isOpen}
        onClose={hideModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={modal.onConfirm}
        showCancel={modal.showCancel}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
      />
    </>
  );
};

export default BookingForm;