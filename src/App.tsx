import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Services from './components/Services';
import BookingForm from './components/BookingForm';
import AdminDashboard from './components/AdminDashboard';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Footer from './components/Footer';
import ReviewsSection from './components/ReviewsSection';
import { Calendar, ShoppingCart, X, User } from 'lucide-react';
import { getServices, getCurrentUser, getSalonByUserId, supabase } from './lib/supabase';
import type { Service, Salon } from './lib/supabase';

function App() {
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);

  // Dados da clínica (fallback quando não há dados do banco)
  const clinicData = {
    name: 'Centro Terapêutico Bem-Estar',
    phone: '(69) 99283-9458',
    email: 'centroobemestar@gmail.com',
    address: 'Avenida Curitiba, nº 3886, Jardim das Oliveiras, Vilhena – Rondônia',
    instagram: 'https://instagram.com/centroterapeuticoo',
    facebook: 'https://www.facebook.com/share/1Dr82JT5NV/',
    description: 'Cuidando da sua saúde mental e física com carinho e profissionalismo. Oferecemos terapias holísticas e tratamentos personalizados para seu bem-estar integral.'
  };

  useEffect(() => {
    loadInitialData();
    
    // Set up Google Maps initialization
    window.initializeGoogleMap = initializeGoogleMap;
    
    // If Google Maps is already loaded, initialize immediately
    if (window.google && window.google.maps) {
      setTimeout(initializeGoogleMap, 1000);
    }
  }, []);

  const loadInitialData = async () => {
    try {
      console.log('=== CARREGANDO DADOS INICIAIS ===');
      
      const { data: servicesData } = await getServices();
      console.log('Serviços carregados:', servicesData);
      
      if (servicesData) {
        setServices(servicesData);
        console.log('Serviços definidos no estado:', servicesData.length);
      } else {
        console.warn('Nenhum serviço encontrado');
        setServices([]);
      }

      const user = await getCurrentUser();
      if (user) {
        setIsAuthenticated(true);
        console.log('User logged in:', user.id);
        // Get the first active salon for admin interface
        const { data: salonData } = await supabase
          .from('salons')
          .select('*')
          .eq('active', true)
          .limit(1)
          .maybeSingle();
        console.log('Salon data found:', salonData);
        if (salonData) {
          setSalon(salonData);
        } else {
          console.warn('No active salon found');
          setSalon(null);
        }
      } else {
        // Se não há usuário logado, usar dados padrão da clínica para visualização
        setSalon({
          id: crypto.randomUUID(),
          user_id: undefined,
          name: clinicData.name,
          description: clinicData.description,
          address: clinicData.address,
          phone: clinicData.phone,
          email: clinicData.email,
          instagram: clinicData.instagram,
          facebook: clinicData.facebook,
          opening_hours: {
            monday: { open: '08:00', close: '20:00' },
            tuesday: { open: '08:00', close: '20:00' },
            wednesday: { open: '08:00', close: '20:00' },
            thursday: { open: '08:00', close: '20:00' },
            friday: { open: '08:00', close: '20:00' },
            saturday: { open: '08:00', close: '20:00' },
            sunday: { open: '08:00', close: '20:00' }
          },
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as Salon);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      // Em caso de erro, usar dados padrão para não quebrar a aplicação
      setServices([]);
      setSalon({
        id: crypto.randomUUID(),
        user_id: undefined,
        name: clinicData.name,
        description: clinicData.description,
        address: clinicData.address,
        phone: clinicData.phone,
        email: clinicData.email,
        instagram: clinicData.instagram,
        facebook: clinicData.facebook,
        opening_hours: {
          monday: { open: '08:00', close: '20:00' },
          tuesday: { open: '08:00', close: '20:00' },
          wednesday: { open: '08:00', close: '20:00' },
          thursday: { open: '08:00', close: '20:00' },
          friday: { open: '08:00', close: '20:00' },
          saturday: { open: '08:00', close: '20:00' },
          sunday: { open: '08:00', close: '20:00' }
        },
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Salon);
    } finally {
      setLoading(false);
    }
  };

  const initializeGoogleMap = () => {
    const mapElement = document.getElementById('google-map');
    if (!mapElement || !window.google || !window.google.maps) {
      console.log('Google Maps não carregado ainda ou elemento não encontrado');
      return;
    }

    console.log('Inicializando Google Maps...');

    // Coordenadas mais precisas de Vilhena, RO
    const clinicLocation = { lat: -12.729139, lng: -60.136111 };

    try {
      const map = new window.google.maps.Map(mapElement, {
        zoom: 15,
        center: clinicLocation,
        mapTypeId: 'roadmap',
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'transit',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      console.log('Mapa criado com sucesso');

      // Marcador personalizado
      const marker = new window.google.maps.Marker({
        position: clinicLocation,
        map: map,
        title: 'Centro Terapêutico Bem-Estar',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="#3B82F6" stroke="white" stroke-width="4"/>
              <path d="M20 10C16.6863 10 14 12.6863 14 16C14 20.5 20 30 20 30S26 20.5 26 16C26 12.6863 23.3137 10 20 10ZM20 18.5C18.6193 18.5 17.5 17.3807 17.5 16C17.5 14.6193 18.6193 13.5 20 13.5C21.3807 13.5 22.5 14.6193 22.5 16C22.5 17.3807 21.3807 18.5 20 18.5Z" fill="white"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 40)
        }
      });

      console.log('Marcador criado com sucesso');

      // Info window com informações da clínica
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; max-width: 250px;">
            <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px; font-weight: bold;">
              Centro Terapêutico Bem-Estar
            </h3>
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
              Avenida Curitiba, nº 3886<br>
              Jardim das Oliveiras, Vilhena - RO
            </p>
            <p style="margin: 0 0 8px 0; color: #3b82f6; font-size: 14px;">
              📱 (69) 99283-9458
            </p>
            <p style="margin: 0; color: #059669; font-size: 12px; font-weight: 500;">
              ✅ Atendimento com hora marcada
            </p>
          </div>
        `
      });

      // Abrir info window ao clicar no marcador
      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      // Abrir automaticamente após 2 segundos
      setTimeout(() => {
        infoWindow.open(map, marker);
      }, 2000);

      console.log('Google Maps inicializado completamente');
    } catch (error) {
      console.error('Erro ao inicializar Google Maps:', error);
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedServices(prev => {
      const isAlreadySelected = prev.find(s => s.id === service.id);
      if (isAlreadySelected) {
        return prev.filter(s => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
  };

  const handleScheduleClick = () => {
    const servicesSection = document.getElementById('services');
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleStartBooking = () => {
    setShowBookingForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToServices = () => {
    setShowBookingForm(false);
    setSelectedServices([]);
    setTimeout(() => {
      const servicesSection = document.getElementById('services');
      if (servicesSection) {
        servicesSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleLoginSuccess = () => {
    setShowLogin(false);
    setIsAuthenticated(true);
    setShowAdminDashboard(true);
    loadInitialData(); // Reload data after login
  };

  const handleProfileClick = () => {
    setShowLogin(true);
  };

  const handleBackToSite = () => {
    setShowLogin(false);
  };

  const removeService = (serviceId: string) => {
    setSelectedServices(prev => prev.filter(s => s.id !== serviceId));
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (showLogin) {
    return (
      <LoginForm 
        onLoginSuccess={handleLoginSuccess}
        onBack={handleBackToSite}
      />
    );
  }


  if (showAdminDashboard && isAuthenticated) {
    return (
      <div>
        <div className="bg-white border-b px-4 py-2">
          <button
            onClick={() => setShowAdminDashboard(false)}
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            ← Voltar ao Site
          </button>
        </div>
        <AdminDashboard 
          salon={salon} 
          onLogout={() => {
            setIsAuthenticated(false);
            setShowAdminDashboard(false);
            setShowLogin(false);
            loadInitialData(); // Reload to reset to public view
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header salon={salon} onLoginClick={handleProfileClick} />
      
      {!showBookingForm ? (
        <>
          <Hero onScheduleClick={handleScheduleClick} salon={salon} />
          
          <div id="services">
            <Services 
              services={services}
              onServiceSelect={handleServiceSelect}
              selectedServices={selectedServices}
            />
          </div>

          {/* About Us Section */}
          <section className="py-12 md:py-20 bg-gradient-to-br from-clinic-50 via-white to-clinic-100 relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-20 -right-20 md:-top-40 md:-right-40 w-40 h-40 md:w-80 md:h-80 bg-gradient-to-br from-clinic-200/30 to-clinic-300/30 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute -bottom-20 -left-20 md:-bottom-40 md:-left-40 w-40 h-40 md:w-80 md:h-80 bg-gradient-to-tr from-clinic-300/30 to-clinic-400/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8 md:mb-16 relative z-10">
                <div className="inline-flex items-center bg-white/80 backdrop-blur-sm px-4 py-2 md:px-6 md:py-3 rounded-full shadow-lg border border-white/20 mb-4 md:mb-6">
                  <span className="text-clinic-500 font-semibold">✨ Conheça Nossa História</span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight px-4">
                  Sobre Nós
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
                  {salon?.description || 'Cuidando da sua beleza com carinho, profissionalismo e tecnologia de ponta'}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-center mb-12 md:mb-20 relative z-10">
                <div className="space-y-6 md:space-y-8">
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-500 hover:scale-105">
                    <div className="flex items-center mb-6">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-clinic-400 to-clinic-500 rounded-xl md:rounded-2xl flex items-center justify-center mr-3 md:mr-4">
                        <span className="text-white text-lg md:text-2xl">🏪</span>
                      </div>
                      <h3 className="text-lg md:text-2xl font-bold text-gray-900">Nossa História</h3>
                    </div>
                    <p className="text-gray-600 mb-3 md:mb-4 leading-relaxed text-sm md:text-base lg:text-lg">
                      {salon?.name ? `O ${salon.name} nasceu` : 'Nossa clínica nasceu'} do sonho de criar um espaço 
                      onde cada pessoa se sinta acolhida e cuidada. Nos tornamos referência em terapias holísticas e bem-estar.
                    </p>
                    <p className="text-gray-600 leading-relaxed text-sm md:text-base lg:text-lg">
                      Com uma equipe de terapeutas altamente qualificados e apaixonados pelo que fazem, 
                      oferecemos terapias personalizadas que promovem o equilíbrio e bem-estar integral.
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-clinic-500 to-clinic-600 rounded-2xl md:rounded-3xl p-6 md:p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-lg md:rounded-xl flex items-center justify-center mr-2 md:mr-3">
                        <span className="text-lg md:text-2xl">🎯</span>
                      </div>
                      <h4 className="font-bold text-lg md:text-xl">Nossa Missão</h4>
                    </div>
                    <p className="text-clinic-100 text-sm md:text-base lg:text-lg leading-relaxed">
                      Proporcionar experiências únicas de cura e bem-estar, utilizando técnicas terapêuticas holísticas 
                      e abordagens integradas, sempre com atendimento humanizado e personalizado.
                    </p>
                  </div>
                </div>

                <div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-xl border border-white/20">
                    <div className="flex items-center mb-8">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-clinic-400 to-clinic-500 rounded-xl md:rounded-2xl flex items-center justify-center mr-3 md:mr-4">
                        <span className="text-white text-lg md:text-2xl">📸</span>
                      </div>
                      <h3 className="text-lg md:text-2xl font-bold text-gray-900">Nosso Ambiente</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
                      <div className="relative group overflow-hidden rounded-xl md:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500">
                        <img 
                          src="/foto1.jpg" 
                          alt="Centro Terapêutico Bem-Estar - Ambiente interno" 
                          className="w-full h-24 md:h-32 lg:h-40 object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute bottom-2 left-2 md:bottom-3 md:left-3 text-white font-medium text-xs md:text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          Ambiente Principal
                        </div>
                      </div>
                      
                      <div className="relative group overflow-hidden rounded-xl md:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500">
                        <img 
                          src="/foto2.jpg" 
                          alt="Centro Terapêutico Bem-Estar - Área de atendimento" 
                          className="w-full h-24 md:h-32 lg:h-40 object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute bottom-2 left-2 md:bottom-3 md:left-3 text-white font-medium text-xs md:text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          Espaço Terapêutico
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <div className="relative group overflow-hidden rounded-xl md:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500">
                        <img 
                          src="/foto3.jpg" 
                          alt="Centro Terapêutico Bem-Estar - Área de relaxamento" 
                          className="w-full h-20 md:h-24 lg:h-32 object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute bottom-1 left-1 md:bottom-2 md:left-2 text-white font-medium text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          Sala de Terapia
                        </div>
                      </div>
                      
                      <div className="relative group overflow-hidden rounded-xl md:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500">
                        <img 
                          src="/foto4.jpg" 
                          alt="Centro Terapêutico Bem-Estar - Recepção" 
                          className="w-full h-20 md:h-24 lg:h-32 object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute bottom-1 left-1 md:bottom-2 md:left-2 text-white font-medium text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          Área de Acolhimento
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Localização */}
              {salon?.address && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl md:rounded-3xl p-6 md:p-10 shadow-2xl border border-white/20 relative z-10">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
                    <div>
                      <div className="flex items-center mb-6 md:mb-8">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-clinic-400 to-clinic-500 rounded-xl md:rounded-2xl flex items-center justify-center mr-3 md:mr-4">
                          <span className="text-white text-lg md:text-2xl">📍</span>
                        </div>
                        <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Nossa Localização</h3>
                      </div>
                      
                      <div className="space-y-4 md:space-y-6">
                        <a 
                          href="https://www.bing.com/maps?&cp=-12.729423~-60.136305&lvl=19.010952&pi=0&tstt0=Avenida%20Curitiba%2C%20Jardim%20das%20Oliveiras%2C%20Vilhena%20-%20RO%2C%2076983-462&tsts0=%2526ty%253D18%2526q%253DAvenida%252520Curitiba%25252C%252520Jardim%252520das%252520Oliveiras%25252C%252520Vilhena%252520-%252520RO%25252C%25252076983-462%2526mb%253D-12.726048~-60.14093~-12.732379~-60.130287%2526cardbg%253D%252523F98745%2526dt%253D1754528400000&ftst=0&ftics=False&v=2&sV=2&form=S00027"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start space-x-3 md:space-x-4 p-3 md:p-4 bg-gradient-to-r from-clinic-50 to-clinic-100 rounded-xl md:rounded-2xl hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group"
                        >
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-clinic-500 rounded-lg md:rounded-xl flex items-center justify-center mt-1 shadow-lg">
                            <span className="text-white">📍</span>
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm md:text-base lg:text-lg">Endereço</p>
                            <p className="text-clinic-600 group-hover:text-clinic-700 font-medium text-sm md:text-base transition-colors duration-300">
                              {salon?.address || clinicData.address}
                            </p>
                            <p className="text-xs text-clinic-500 group-hover:text-clinic-600 mt-1 transition-colors duration-300">Clique para abrir no mapa</p>
                          </div>
                        </a>
                        
                        {(salon?.phone || clinicData.phone) && (
                          <a
                            href="https://wa.me/5569992839458"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start space-x-3 md:space-x-4 p-3 md:p-4 bg-gradient-to-r from-clinic-50 to-clinic-100 rounded-xl md:rounded-2xl hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group"
                          >
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-clinic-500 rounded-lg md:rounded-xl flex items-center justify-center mt-1 shadow-lg">
                              <span className="text-white">📱</span>
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-sm md:text-base lg:text-lg">Telefone</p>
                              <p className="text-clinic-600 group-hover:text-clinic-700 text-sm md:text-base transition-colors duration-300 flex items-center">
                                <span className="mr-2">📱</span>
                                {salon?.phone || clinicData.phone}
                                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">WhatsApp</span>
                              </p>
                              <p className="text-xs text-clinic-500 group-hover:text-clinic-600 mt-1 transition-colors duration-300">Clique para abrir no WhatsApp</p>
                            </div>
                          </a>
                        )}
                      </div>
                    </div>
                    
                    {/* Google Maps */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                      <div 
                        id="google-map" 
                        className="w-full h-64 md:h-80 bg-gray-100 flex items-center justify-center"
                      >
                        <div className="text-center text-gray-500">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-clinic-500 mx-auto mb-2"></div>
                          <p className="text-sm">Carregando mapa...</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <ReviewsSection salon={salon} />

          {/* Floating Action Button */}
          {selectedServices.length > 0 && (
            <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50">
              <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl border border-gray-100 p-3 md:p-4 mb-3 md:mb-4 max-w-xs md:max-w-sm animate-fade-in-up">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 flex items-center text-sm md:text-base">
                    <ShoppingCart className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 text-clinic-500" />
                    Serviços Selecionados
                  </h4>
                  <span className="bg-clinic-100 text-clinic-600 text-xs px-1.5 py-0.5 md:px-2 md:py-1 rounded-full font-medium">
                    {selectedServices.length}
                  </span>
                </div>
                
                <div className="space-y-1 md:space-y-2 mb-3 md:mb-4 max-h-24 md:max-h-32 overflow-y-auto">
                  {selectedServices.map(service => (
                    <div key={service.id} className="flex items-center justify-between bg-gray-50 rounded-md md:rounded-lg p-1.5 md:p-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs md:text-sm font-medium text-gray-900 truncate">{service.name}</p>
                        <p className="text-xs text-gray-500">R$ {service.price}</p>
                      </div>
                      <button
                        onClick={() => removeService(service.id)}
                        className="ml-1 md:ml-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-2 md:pt-3 mb-3 md:mb-4">
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-bold text-green-600">R$ {getTotalPrice()}</span>
                  </div>
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-gray-600">Duração:</span>
                    <span className="font-medium text-gray-900">{getTotalDuration()}</span>
                  </div>
                </div>
                
                <button
                  onClick={handleStartBooking}
                  className="w-full bg-gradient-to-r from-clinic-500 to-clinic-600 text-white py-2 md:py-3 rounded-lg md:rounded-xl font-semibold text-sm md:text-base hover:from-clinic-600 hover:to-clinic-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
                >
                  <Calendar className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  Agendar Serviços
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        selectedServices.length > 0 && (
          <BookingForm 
            selectedServices={selectedServices}
            onBack={handleBackToServices}
            salon={salon}
          />
        )
      )}
      
      <Footer salon={salon} />
    </div>
  );
}

export default App;