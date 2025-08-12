import React from 'react';
import { Calendar, Phone, MapPin, LogIn } from 'lucide-react';
import type { Salon } from '../lib/supabase';

interface HeaderProps {
  salon: Salon | null;
  onLoginClick?: () => void;
}

const Header = ({ salon, onLoginClick }: HeaderProps) => {
  return (
    <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-rose-100 sticky top-0 z-40 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3 md:py-4 hover:py-4 md:hover:py-5 transition-all duration-300">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden hover:scale-110 transition-transform duration-300 shadow-lg hover:shadow-xl cursor-pointer bg-gray-800">
              <img 
                src="/logo2.png" 
                alt="Centro Terapêutico Bem-Estar Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 hover:text-clinic-600 transition-colors duration-300 cursor-pointer">
                {salon?.name || 'Centro Terapêutico Bem-Estar'}
              </h1>
              <p className="text-xs md:text-sm text-clinic-600 font-medium hover:text-clinic-700 transition-colors duration-300">Clínica Terapêutica</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 md:space-x-6">
            {/* WhatsApp Button - Left side */}
            {(salon?.phone || '(69) 99283-9458') && (
              <a
                href="https://wa.me/5569992839458"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors duration-300 cursor-pointer group bg-green-50 hover:bg-green-100 px-3 py-2 rounded-full"
                title="WhatsApp"
              >
                <Phone className="w-4 h-4 group-hover:animate-bounce" />
                <span className="hidden md:inline text-sm lg:text-base">{salon?.phone || '(69) 99283-9458'}</span>
                <span className="hidden md:inline text-xs bg-green-500 text-white px-2 py-1 rounded-full">WhatsApp</span>
              </a>
            )}
            
            {/* Login Button - Right side */}
            {onLoginClick && (
              <button
                onClick={onLoginClick}
                className="flex items-center space-x-2 text-gray-600 hover:text-clinic-600 transition-colors duration-300 cursor-pointer group bg-clinic-50 hover:bg-clinic-100 px-3 py-2 rounded-full"
                title="Acesso Administrativo"
              >
                <LogIn className="w-4 h-4 group-hover:animate-bounce" />
                <span className="hidden md:inline text-sm lg:text-base">Admin</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;