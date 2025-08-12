import React from 'react';
import { MapPin, Clock, Phone, Instagram, Facebook, Star } from 'lucide-react';
import type { Salon } from '../lib/supabase';

interface FooterProps {
  salon: Salon | null;
}

const Footer = ({ salon }: FooterProps) => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {/* Salon Info */}
          <div>
            <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">{salon?.name || 'Seu Salão'}</h3>
            <p className="text-gray-300 mb-3 md:mb-4 text-sm md:text-base">
              {salon?.description || 'Seu bem-estar, nosso cuidado! Cuidando da sua saúde mental e física com carinho e profissionalismo.'}
            </p>
            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 fill-current" />
              ))}
              <span className="ml-2 text-xs md:text-sm text-gray-300">Excelência em atendimento</span>
            </div>
          </div>
          
          {/* Contact Info */}
          <div>
            <h4 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Contato</h4>
            <div className="space-y-2 md:space-y-3">
              {salon?.address && (
                <div className="flex items-start space-x-3">
                  <MapPin className="w-4 h-4 md:w-5 md:h-5 text-rose-400 mt-0.5" />
                  <div>
                    <p className="text-gray-300 text-sm md:text-base">{salon.address}</p>
                  </div>
                </div>
              )}
              
              {salon?.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 md:w-5 md:h-5 text-rose-400" />
                  <p className="text-gray-300 text-sm md:text-base">{salon.phone}</p>
                </div>
              )}
              
              {salon?.email && (
                <div className="flex items-center space-x-3">
                  <span className="w-4 h-4 md:w-5 md:h-5 text-rose-400">✉️</span>
                  <p className="text-gray-300 text-sm md:text-base">centroobemestar@gmail.com</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Hours */}
          <div>
            <h4 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Horário de Funcionamento</h4>
            <div className="space-y-1 md:space-y-2">
              <div className="flex items-center space-x-3">
                <Clock className="w-4 h-4 md:w-5 md:h-5 text-rose-400" />
                <div>
                  <p className="text-gray-300 text-sm md:text-base">Todos os dias</p>
                  <p className="text-gray-300 font-medium text-sm md:text-base">Com hora marcada</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Social Media & CTA */}
          <div>
            <h4 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Redes Sociais</h4>
            <div className="flex space-x-3 md:space-x-4 mb-4 md:mb-6">
              {salon?.instagram && (
                <a href={salon.instagram} target="_blank" rel="noopener noreferrer" className="w-8 h-8 md:w-10 md:h-10 bg-clinic-500 rounded-full flex items-center justify-center hover:bg-clinic-600 transition-colors">
                  <Instagram className="w-4 h-4 md:w-5 md:h-5" />
                </a>
              )}
              {salon?.facebook && (
                <a href={salon.facebook} target="_blank" rel="noopener noreferrer" className="w-8 h-8 md:w-10 md:h-10 bg-clinic-500 rounded-full flex items-center justify-center hover:bg-clinic-600 transition-colors">
                  <Facebook className="w-4 h-4 md:w-5 md:h-5" />
                </a>
              )}
            </div>
            
            <div className="bg-clinic-500/10 border border-clinic-500/20 rounded-lg md:rounded-xl p-3 md:p-4">
              <p className="text-xs md:text-sm text-gray-300 mb-2 md:mb-3">
                Agendar sua terapia nunca foi tão fácil! Qualquer dúvida, estamos no WhatsApp.
              </p>
              {salon?.phone && (
                <a
                  href={`https://wa.me/55${salon.phone.replace(/\D/g, '')}`}
                  className="inline-flex items-center space-x-2 text-clinic-400 hover:text-clinic-300 transition-colors"
                >
                  <Phone className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm font-medium">Chamar no WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 md:mt-12 pt-6 md:pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-xs md:text-sm text-center md:text-left">
              © 2024 {salon?.name || 'Seu Salão'}. Todos os direitos reservados.
            </p>
            <div className="text-gray-500 text-xs mt-2 md:mt-0 text-center md:text-right">
              <p>Sistema desenvolvido pela{' '}
                <a 
                  href="https://www.instagram.com/nexla_ia/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-clinic-400 hover:text-clinic-300 font-medium transition-colors"
                >
                  NEXLA
                </a>
              </p>
              <p className="mt-1">NEXLA - automação e IA</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;