/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { CloseIcon, CompareArrowsIcon, PhotoIcon, SplitScreenIcon, LinkIcon } from './icons';

// Componente para o menu lateral (overlay) - mantido conforme fornecido, embora atualmente inativo
const MenuOverlay: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
  return (
    <div className={`fixed inset-0 bg-black/50 z-[99] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}>
      <div 
        onClick={e => e.stopPropagation()}
        className={`fixed top-0 right-0 h-full w-full sm:w-80 bg-gray-900 border-l border-gray-700 shadow-xl p-6 transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
          <CloseIcon className="w-6 h-6" />
        </button>
        <h3 className="text-xl font-bold text-white mb-6">Modos de Visualização</h3>
        <div className="flex flex-col gap-4">
          <button className="flex items-center gap-3 p-4 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors">
            <SplitScreenIcon className="w-6 h-6 text-blue-400" />
            <span className="font-semibold text-gray-200">Vista Dividida</span>
          </button>
          <button className="flex items-center gap-3 p-4 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors">
            <CompareArrowsIcon className="w-6 h-6 text-blue-400" />
            <span className="font-semibold text-gray-200">Vista com Slider</span>
          </button>
          <button className="flex items-center gap-3 p-4 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors">
            <PhotoIcon className="w-6 h-6 text-blue-400" />
            <span className="font-semibold text-gray-200">Vista Rápida</span>
          </button>
        </div>
        <button className="w-full mt-8 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-500 transition-colors">
          Copiar Link
        </button>
      </div>
    </div>
  );
};

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  beforeImage: string;
  afterImage: string;
}

const ComparisonModal: React.FC<ComparisonModalProps> = ({ isOpen, onClose, beforeImage, afterImage }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [currentView, setCurrentView] = useState<'before' | 'after'>('after');
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="w-full h-full max-w-7xl max-h-[90vh] bg-gray-800/80 rounded-2xl shadow-2xl relative flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-center p-4">
            <div className="flex items-center gap-2 bg-black/20 p-1 rounded-full backdrop-blur-sm">
                <button onClick={() => setCurrentView('before')} className={`px-4 py-2 font-semibold text-sm rounded-full transition-colors ${currentView === 'before' ? 'bg-white text-gray-900' : 'text-gray-400 hover:bg-white/10'}`}>Antes</button>
                <button onClick={() => setCurrentView('after')} className={`px-4 py-2 font-semibold text-sm rounded-full transition-colors ${currentView === 'after' ? 'bg-white text-gray-900' : 'text-gray-400 hover:bg-white/10'}`}>Depois</button>
            </div>
        </div>
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 z-20 text-gray-400 hover:text-white transition-colors bg-black/20 rounded-full p-1">
          <CloseIcon className="w-6 h-6" />
        </button>

        {/* Main View Area */}
        <div className="flex-grow relative overflow-hidden flex items-center justify-center">
            {/* Usando a chave para reativar a animação na mudança */}
            <img 
                key={currentView}
                src={currentView === 'before' ? beforeImage : afterImage} 
                alt={currentView === 'before' ? 'Antes da edição' : 'Depois da edição'}
                className="max-w-full max-h-full object-contain animate-fade-in"
            />
        </div>
      </div>
      {/* O MenuOverlay permanece conforme fornecido pelo utilizador, embora atualmente inativo */}
      <MenuOverlay isOpen={showMenu} onClose={() => setShowMenu(false)} />
    </div>
  );
};

export default ComparisonModal;