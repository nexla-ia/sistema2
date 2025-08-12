import React from 'react';
import { Sparkles, Clock, Star, Calendar } from 'lucide-react';
import type { Salon } from '../lib/supabase';

interface HeroProps {
  onScheduleClick: () => void;
  salon: Salon | null;
}

const Hero = ({ onScheduleClick, salon }: HeroProps) => {
  return (
    <section className="bg-gradient-to-br from-clinic-50 via-white to-clinic-100 py-8 md:py-16">
      <div className="py-8 md:py-16 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 md:-top-40 md:-right-40 w-40 h-40 md:w-80 md:h-80 bg-gradient-to-br from-clinic-200/30 to-clinic-300/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-20 -left-20 md:-bottom-40 md:-left-40 w-40 h-40 md:w-80 md:h-80 bg-gradient-to-tr from-clinic-300/30 to-clinic-400/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center relative z-10">
          <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-1 bg-white/80 backdrop-blur-sm px-3 py-2 md:px-4 md:py-2 rounded-full shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:scale-105">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 fill-current animate-pulse" style={{animationDelay: `${i * 100}ms`}} />
              ))}
              <span className="ml-2 text-gray-700 font-semibold text-xs md:text-sm">Excelência em atendimento</span>
            </div>
          </div>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight animate-fade-in-up px-2">
            {salon?.name ? `Bem-vindo ao ${salon.name}` : 'Cuide do seu bem-estar com nossos especialistas.'}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-clinic-500 via-clinic-600 to-clinic-700 animate-gradient-x">
              Agende online!
            </span>
          </h2>
          
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed animate-fade-in-up delay-200 px-4">
            {salon?.description || 'Escolha a terapia ideal, confira os horários disponíveis e garanta seu atendimento sem sair de casa.'}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center mb-8 md:mb-12 animate-fade-in-up delay-300 px-4">
            <button
              onClick={onScheduleClick}
              className="group relative bg-gradient-to-r from-clinic-500 via-clinic-600 to-clinic-700 text-white px-6 py-3 md:px-8 md:py-4 rounded-full font-semibold text-base md:text-lg transition-all duration-500 transform hover:scale-110 shadow-lg hover:shadow-2xl hover:shadow-clinic-500/25 overflow-hidden w-full sm:w-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-clinic-600 via-clinic-700 to-clinic-800 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex items-center">
                <Sparkles className="w-4 h-4 md:w-5 md:h-5 mr-2 group-hover:animate-spin transition-transform duration-500" />
                <span className="group-hover:animate-pulse">Agendar Agora</span>
              </div>
              <div className="absolute inset-0 rounded-full bg-white/20 scale-0 group-hover:scale-100 transition-transform duration-500 opacity-0 group-hover:opacity-100"></div>
            </button>
            <div className="flex items-center space-x-2 text-gray-600 bg-white/60 backdrop-blur-sm px-3 py-2 md:px-4 md:py-2 rounded-full hover:bg-white/80 transition-all duration-300 hover:scale-105">
              <Clock className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-sm md:text-base">Resposta imediata</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-4xl mx-auto animate-fade-in-up delay-500 px-4">
            <div className="text-center">
              <div className="group w-12 h-12 md:w-16 md:h-16 bg-white rounded-full shadow-lg flex items-center justify-center mx-auto mb-3 md:mb-4 hover:shadow-2xl transition-all duration-500 hover:scale-110 hover:rotate-6 cursor-pointer">
                <Calendar className="w-6 h-6 md:w-8 md:h-8 text-clinic-500 group-hover:text-clinic-600 transition-colors duration-300 group-hover:animate-bounce" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 hover:text-clinic-600 transition-colors duration-300 cursor-pointer text-sm md:text-base">Agenda Online</h3>
              <p className="text-gray-600 hover:text-gray-800 transition-colors duration-300 text-xs md:text-sm">Veja horários disponíveis em tempo real</p>
            </div>
            
            <div className="text-center">
              <div className="group w-12 h-12 md:w-16 md:h-16 bg-white rounded-full shadow-lg flex items-center justify-center mx-auto mb-3 md:mb-4 hover:shadow-2xl transition-all duration-500 hover:scale-110 hover:rotate-6 cursor-pointer">
                <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-clinic-500 group-hover:text-clinic-600 transition-colors duration-300 group-hover:animate-spin" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 hover:text-clinic-600 transition-colors duration-300 cursor-pointer text-sm md:text-base">Terapeutas Qualificados</h3>
              <p className="text-gray-600 hover:text-gray-800 transition-colors duration-300 text-xs md:text-sm">Profissionais experientes e especializados</p>
            </div>
            
            <div className="text-center">
              <div className="group w-12 h-12 md:w-16 md:h-16 bg-white rounded-full shadow-lg flex items-center justify-center mx-auto mb-3 md:mb-4 hover:shadow-2xl transition-all duration-500 hover:scale-110 hover:rotate-6 cursor-pointer">
                <Star className="w-6 h-6 md:w-8 md:h-8 text-clinic-500 group-hover:text-clinic-600 transition-colors duration-300 group-hover:animate-pulse" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 hover:text-clinic-600 transition-colors duration-300 cursor-pointer text-sm md:text-base">Bem-Estar Garantido</h3>
              <p className="text-gray-600 hover:text-gray-800 transition-colors duration-300 text-xs md:text-sm">Clientes satisfeitos recomendam nossas terapias</p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
};

export default Hero;