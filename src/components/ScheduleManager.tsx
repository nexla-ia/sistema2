import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Save, RefreshCw, Lock, Unlock, Plus, Users } from 'lucide-react';
import Modal from './Modal';
import { useModal } from '../hooks/useModal';
import { 
  getSalonHours, 
  updateSalonHours, 
  getAllSlots, 
  blockSlot, 
  unblockSlot,
  generateSlotsForPeriod,
  supabase,
  type SalonHours,
  type Salon 
} from '../lib/supabase';

interface ScheduleManagerProps {
  salon: Salon | null;
  onOpeningHoursChange?: (hours: any, showSuccess: (title: string, message: string) => void, showError: (title: string, message: string) => void) => void;
  bookings?: Record<string, string[]>;
}

interface SlotData {
  time_slot: string;
  status: 'available' | 'blocked' | 'booked';
  reason?: string;
  booking_id?: string;
  bookings?: {
    id: string;
    client: {
      name: string;
      phone: string;
    };
  };
}

const ScheduleManager = ({ salon }: ScheduleManagerProps) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [salonHours, setSalonHours] = useState<SalonHours[]>([]);
  const [loadingSlot, setLoadingSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { modal, hideModal, showSuccess, showError } = useModal();

  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  useEffect(() => {
    loadSalonHours();
  }, []);

  useEffect(() => {
    loadSlots();
  }, [selectedDate]);

  const loadSalonHours = async () => {
    try {
      const { data, error } = await getSalonHours();
      if (error) throw error;
      
      // If no working hours exist, create default structure
      if (!data || data.length === 0) {
        // Create default working hours (all days closed)
        const defaultHours = [];
        for (let day = 0; day <= 6; day++) {
          const { data: newHour, error: createError } = await supabase
            .from('working_hours')
            .insert({
              salon_id: salon?.id,
              day_of_week: day,
              is_open: false,
              open_time: null,
              close_time: null,
              break_start: null,
              break_end: null,
              slot_duration: 30
            })
            .select()
            .single();
          
          if (!createError && newHour) {
            defaultHours.push(newHour);
          }
        }
        setSalonHours(defaultHours);
      } else {
        setSalonHours(data);
      }
    } catch (error) {
      console.error('Error loading salon hours:', error);
      showError('Erro', 'Erro ao carregar horários de funcionamento');
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async () => {
    try {
      const { data, error } = await getAllSlots(selectedDate);
      if (error) throw error;
      setSlots(data || []);
    } catch (error) {
      console.error('Error loading slots:', error);
      setSlots([]);
    }
  };

  const handleReloadDay = async () => {
  const salonId = salon?.id || import.meta.env.VITE_SALON_ID;
  const toISO = (d: Date) => d.toISOString().slice(0, 10);
  const iso =
    typeof selectedDate === 'string'
      ? selectedDate
      : toISO(new Date(selectedDate));

  try {
    // sincroniza só o dia mostrado
    await supabase.rpc('sync_slots_for_period', {
      p_salon_id: salonId,
      p_start: iso,
      p_end: iso,
    });

    await loadSlots(); // recarrega a lista para o dia atual
    showSuccess('Pronto!', 'Horários sincronizados para o dia selecionado.');
  } catch (err) {
    console.error('reload error', err);
    showError('Erro', 'Não foi possível recarregar os horários.');
  }
};


  const handleUpdateSalonHours = async (dayOfWeek: number, field: string, value: any) => {
    try {
      const currentHours = salonHours.find(h => h.day_of_week === dayOfWeek);
      if (!currentHours) return;

      const updates = { [field]: value };
      
      // Se está fechando o dia, limpar horários
      if (field === 'is_open' && !value) {
        updates.open_time = null;
        updates.close_time = null;
        updates.break_start = null;
        updates.break_end = null;
      }

      const { data, error } = await updateSalonHours(dayOfWeek, updates);
      if (error) throw error;

      // Atualizar estado local
      setSalonHours(prev => prev.map(h => 
        h.day_of_week === dayOfWeek ? { ...h, ...updates } : h
      ));

      showSuccess('Sucesso!', 'Horário atualizado com sucesso!');
      
      // ====== NOVO: sincroniza TODO o período com base no working_hours ======
      const start = new Date();            // hoje
      const end   = new Date();
      end.setDate(end.getDate() + 60);     // janela de 60 dias (ajuste se quiser)

      const toISO = (d: Date) => d.toISOString().slice(0, 10);
      const salonId = salon?.id || import.meta.env.VITE_SALON_ID;  // <-- fallback

      await supabase.rpc('sync_slots_for_period', {
        p_salon_id: salonId,               // <-- sempre manda um UUID válido
        p_start: toISO(start),
        p_end: toISO(end),
      });
    // ================================================================

    await loadSlots(); // recarrega a data selecionada
  } catch (error) {
    console.error('Error updating salon hours:', error);
    showError('Erro', 'Erro ao atualizar horário');
  }
};

  const handleBlockSlot = async (slotTime: string) => {
  try {
    setLoadingSlot(slotTime);
    const iso = typeof selectedDate === 'string'
      ? selectedDate
      : new Date(selectedDate).toISOString().slice(0,10);

    const { error } = await supabase.rpc('block_slot_by_user', {
      p_date: iso,
      p_time: slotTime,
      p_reason: 'Bloqueado manualmente'
    });
    if (error) throw error;

    await loadSlots();
    showSuccess('Bloqueado', `Horário ${slotTime} bloqueado.`);
  } catch (e: any) {
    console.error('block error', e);
    showError('Erro', e?.message || 'Não foi possível bloquear o horário');
  } finally {
    setLoadingSlot(null);
  }
};

  const handleUnblockSlot = async (slotTime: string) => {
  try {
    setLoadingSlot(slotTime);
    const iso = typeof selectedDate === 'string'
      ? selectedDate
      : new Date(selectedDate).toISOString().slice(0,10);

    const { error } = await supabase.rpc('unblock_slot_by_user', {
      p_date: iso,
      p_time: slotTime
    });
    if (error) throw error;

    await loadSlots();
    showSuccess('Desbloqueado', `Horário ${slotTime} liberado.`);
  } catch (e: any) {
    console.error('unblock error', e);
    showError('Erro', e?.message || 'Não foi possível desbloquear o horário');
  } finally {
    setLoadingSlot(null);
  }
};

  const getSlotColor = (status: string, isLoading: boolean = false) => {
    if (isLoading) return 'bg-gray-100 text-gray-600 border-gray-300 opacity-50';
    
    switch (status) {
      case 'booked': return 'bg-red-100 text-red-800 border-red-200';
      case 'blocked': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'booked': return 'Agendado';
      case 'blocked': return 'Bloqueado';
      default: return 'Disponível';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-clinic-500 mr-3"></div>
        <span>Carregando...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Configuração de Horários de Funcionamento */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Horários de Funcionamento</h3>
          <div className="text-sm text-gray-500">
            Configure os dias e horários que o estabelecimento funciona
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {salonHours.map((hours) => (
            <div key={hours.day_of_week} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">
                  {dayNames[hours.day_of_week]}
                </h4>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={hours.is_open}
                    onChange={(e) => handleUpdateSalonHours(hours.day_of_week, 'is_open', e.target.checked)}
                    className="rounded border-gray-300 text-clinic-600 focus:ring-clinic-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Aberto</span>
                </label>
              </div>
              
              {hours.is_open && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Abertura</label>
                      <input
                        type="time"
                        value={hours.open_time || ''}
                        onChange={(e) => handleUpdateSalonHours(hours.day_of_week, 'open_time', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-clinic-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Fechamento</label>
                      <input
                        type="time"
                        value={hours.close_time || ''}
                        onChange={(e) => handleUpdateSalonHours(hours.day_of_week, 'close_time', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-clinic-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Início Intervalo</label>
                      <input
                        type="time"
                        value={hours.break_start || ''}
                        onChange={(e) => handleUpdateSalonHours(hours.day_of_week, 'break_start', e.target.value || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-clinic-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Fim Intervalo</label>
                      <input
                        type="time"
                        value={hours.break_end || ''}
                        onChange={(e) => handleUpdateSalonHours(hours.day_of_week, 'break_end', e.target.value || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-clinic-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Duração do Slot (minutos)</label>
                    <select
                      value={hours.slot_duration}
                      onChange={(e) => handleUpdateSalonHours(hours.day_of_week, 'slot_duration', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-clinic-500 focus:border-transparent"
                    >
                      <option value={15}>15 minutos</option>
                      <option value={30}>30 minutos</option>
                      <option value={60}>60 minutos</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Gerenciamento de Slots Específicos */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Gerenciar Horários Específicos</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clinic-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleReloadDay}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Recarregar</span>
            </button>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Data selecionada: {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          <div className="flex items-center space-x-6 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
              <span className="text-gray-600">Disponível</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
              <span className="text-gray-600">Agendado</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
              <span className="text-gray-600">Bloqueado</span>
            </div>
          </div>
        </div>

        {slots.length > 0 ? (
          <>
            {/* Resumo dos Horários */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Resumo dos Horários</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {slots.filter(slot => slot.status === 'available').length}
                  </div>
                  <div className="text-green-700">Disponíveis</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {slots.filter(slot => slot.status === 'booked').length}
                  </div>
                  <div className="text-red-700">Agendados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {slots.filter(slot => slot.status === 'blocked').length}
                  </div>
                  <div className="text-yellow-700">Bloqueados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{slots.length}</div>
                  <div className="text-gray-700">Total</div>
                </div>
              </div>
            </div>

            {/* Grid de Slots */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {slots.map(slot => {
                const isPending = loadingSlot === slot.time_slot;
                
                return (
                  <div
                    key={slot.time_slot}
                    className={`p-3 rounded-lg border text-sm transition-colors ${getSlotColor(slot.status, isPending)}`}
                  >
                    <div className="flex items-center justify-center space-x-1 mb-2">
                      {isPending ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      <span className="font-medium">{slot.time_slot}</span>
                    </div>
                    
                    <div className="text-xs text-center mb-2">
                      {getStatusText(slot.status)}
                    </div>
                    
                    {/* Informações do cliente se agendado */}
                    {slot.status === 'booked' && slot.bookings?.client && (
                      <div className="text-xs text-center mb-2 p-1 bg-white/50 rounded">
                        <div className="flex items-center justify-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span className="font-medium">{slot.bookings.client.name}</span>
                        </div>
                        <div className="text-gray-600">{slot.bookings.client.phone}</div>
                      </div>
                    )}
                    
                    {/* Botões de ação */}
                    {slot.status === 'available' && !isPending && (
                      <button
                        onClick={() => handleBlockSlot(slot.time_slot)}
                        className="w-full bg-yellow-500 text-white text-xs py-1 px-2 rounded hover:bg-yellow-600 transition-colors flex items-center justify-center space-x-1"
                      >
                        <Lock className="w-3 h-3" />
                        <span>Bloquear</span>
                      </button>
                    )}
                    
                    {slot.status === 'blocked' && !isPending && (
                      <button
                        onClick={() => handleUnblockSlot(slot.time_slot)}
                        className="w-full bg-green-500 text-white text-xs py-1 px-2 rounded hover:bg-green-600 transition-colors flex items-center justify-center space-x-1"
                      >
                        <Unlock className="w-3 h-3" />
                        <span>Liberar</span>
                      </button>
                    )}
                    
                    {/* Motivo do bloqueio */}
                    {slot.reason && (
                      <div className="text-xs text-gray-500 mt-1 truncate" title={slot.reason}>
                        {slot.reason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Estabelecimento fechado neste dia</p>
          </div>
        )}
      </div>
      
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
    </div>
  );
};

export default ScheduleManager;