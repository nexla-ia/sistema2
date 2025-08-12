import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Save, RefreshCw, Lock, Unlock, Plus, Users, Settings } from 'lucide-react';
import Modal from './Modal';
import { useModal } from '../hooks/useModal';
import { 
  getAllSlots, 
  supabase,
  getDefaultSchedule,
  saveDefaultSchedule,
  generateSlotsWithSavedConfig,
  type Salon 
} from '../lib/supabase';

interface ScheduleManagerProps {
  salon: Salon | null;
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

interface DefaultSchedule {
  open_time: string;
  close_time: string;
  slot_duration: number;
  break_start?: string;
  break_end?: string;
}

const ScheduleManager = ({ salon }: ScheduleManagerProps) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [loadingSlot, setLoadingSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [defaultSchedule, setDefaultSchedule] = useState<DefaultSchedule>({
    open_time: '08:00',
    close_time: '18:00',
    slot_duration: 30,
    break_start: '12:00',
    break_end: '13:00'
  });
  const [generatePeriod, setGeneratePeriod] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: (() => {
      const date = new Date();
      date.setMonth(date.getMonth() + 1);
      return date.toISOString().split('T')[0];
    })()
  });

  const { modal, hideModal, showSuccess, showError } = useModal();

  // Carregar configuração padrão salva
  const loadDefaultSchedule = async () => {
    try {
      console.log('=== CARREGANDO CONFIGURAÇÃO PADRÃO ===');
      const { data: schedule, error } = await getDefaultSchedule();
      
      if (error) {
        console.error('Erro ao carregar configuração:', error);
        return;
      }
      
      console.log('Configuração carregada:', schedule);
      setDefaultSchedule(schedule);
    } catch (error) {
      console.error('Error loading default schedule:', error);
    }
  };

  // Salvar configuração padrão
  const handleSaveDefaultSchedule = async () => {
    try {
      console.log('=== SALVANDO CONFIGURAÇÃO ===');
      const { error } = await saveDefaultSchedule(defaultSchedule);
      
      if (error) {
        console.error('Erro ao salvar:', error);
        showError('Erro', 'Erro ao salvar configuração padrão');
        return;
      }
      
      showSuccess(
        'Configuração Salva!', 
        'Horário padrão salvo com sucesso. Esta configuração será usada para gerar novos slots.'
      );
    } catch (error) {
      console.error('Error saving default schedule:', error);
      showError('Erro', 'Erro ao salvar configuração');
    }
  };

  useEffect(() => {
    loadSlots();
    loadDefaultSchedule();
    setLoading(false);
  }, [selectedDate]);

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

  const generateSlots = async () => {
    setGenerating(true);
    try {
      console.log('=== GERANDO SLOTS ===');
      console.log('Período:', generatePeriod);
      console.log('Configuração atual:', defaultSchedule);
      
      // Primeiro salvar a configuração atual
      const { error: saveError } = await saveDefaultSchedule(defaultSchedule);
      if (saveError) {
        console.error('Erro ao salvar configuração:', saveError);
        showError('Erro', 'Erro ao salvar configuração antes de gerar slots');
        return;
      }
      
      // Gerar slots usando configuração salva
      const { error } = await generateSlotsWithSavedConfig(
        generatePeriod.start_date,
        generatePeriod.end_date
      );

      if (error) throw error;

      await loadSlots();
      showSuccess(
        'Horários Gerados!', 
        `Slots criados de ${generatePeriod.start_date} até ${generatePeriod.end_date} com sucesso! Configuração padrão também foi salva.`
      );
    } catch (error: any) {
      console.error('Error generating slots:', error);
      showError('Erro', error.message || 'Erro ao gerar horários');
    } finally {
      setGenerating(false);
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
      {/* Configuração de Horário Padrão */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-clinic-500" />
            Configuração de Horário Padrão
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Horário de Abertura
            </label>
            <input
              type="time"
              value={defaultSchedule.open_time}
              onChange={(e) => setDefaultSchedule(prev => ({ ...prev, open_time: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clinic-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Horário de Fechamento
            </label>
            <input
              type="time"
              value={defaultSchedule.close_time}
              onChange={(e) => setDefaultSchedule(prev => ({ ...prev, close_time: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clinic-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duração do Slot (minutos)
            </label>
            <select
              value={defaultSchedule.slot_duration}
              onChange={(e) => setDefaultSchedule(prev => ({ ...prev, slot_duration: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clinic-500 focus:border-transparent"
            >
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={60}>60 minutos</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Início do Intervalo (opcional)
            </label>
            <input
              type="time"
              value={defaultSchedule.break_start || ''}
              onChange={(e) => setDefaultSchedule(prev => ({ ...prev, break_start: e.target.value || undefined }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clinic-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fim do Intervalo (opcional)
            </label>
            <input
              type="time"
              value={defaultSchedule.break_end || ''}
              onChange={(e) => setDefaultSchedule(prev => ({ ...prev, break_end: e.target.value || undefined }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clinic-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Período de Geração */}
        <div className="border-t pt-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Gerar Horários para Período</h4>
          
          <div className="mb-4">
            <button
              onClick={handleSaveDefaultSchedule}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Configuração Padrão</span>
            </button>
            <p className="text-xs text-gray-500 mt-1">
              Salve a configuração antes de gerar os horários
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Inicial
              </label>
              <input
                type="date"
                value={generatePeriod.start_date}
                onChange={(e) => setGeneratePeriod(prev => ({ ...prev, start_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clinic-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Final
              </label>
              <input
                type="date"
                value={generatePeriod.end_date}
                onChange={(e) => setGeneratePeriod(prev => ({ ...prev, end_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clinic-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <button
                onClick={generateSlots}
                disabled={generating}
                className="w-full bg-gradient-to-r from-clinic-500 to-clinic-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-clinic-600 hover:to-clinic-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center"
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Gerando...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 mr-2" />
                    Gerar Horários
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Configuração Atual:</strong> De {defaultSchedule.open_time} às {defaultSchedule.close_time}, 
              slots de {defaultSchedule.slot_duration}min
              {defaultSchedule.break_start && defaultSchedule.break_end && 
                `, com intervalo de ${defaultSchedule.break_start} às ${defaultSchedule.break_end}`
              }
            </p>
            <p className="text-xs text-blue-600 mt-2">
              💡 Esta configuração será salva automaticamente ao gerar os horários
            </p>
          </div>
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
            <p className="text-gray-500 mb-2">Nenhum horário encontrado para esta data</p>
            <p className="text-sm text-gray-400">Use o botão "Gerar Horários" acima para criar slots</p>
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