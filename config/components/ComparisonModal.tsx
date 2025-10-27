/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import LazyIcon from './LazyIcon';
import ComparisonSlider from './ComparisonSlider';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  beforeImage: string;
  afterImage: string;
}

const ComparisonModal: React.FC<ComparisonModalProps> = ({ isOpen, onClose, beforeImage, afterImage }) => {
  const [mode, setMode] = useState<'slider' | 'opacity'>('slider');
  const [opacity, setOpacity] = useState(50);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="w-full h-full max-w-7xl max-h-[90vh] bg-gray-800/80 rounded-2xl shadow-2xl relative flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-700/50">
          <h2 className="text-lg font-bold text-white">Comparar Antes e Depois</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Fechar comparação">
            <LazyIcon name="CloseIcon" className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-grow relative overflow-hidden flex items-center justify-center p-4">
          <ComparisonSlider 
            originalSrc={beforeImage} 
            modifiedSrc={afterImage}
            mode={mode}
            opacity={opacity}
          />
        </div>

        <div className="flex-shrink-0 flex items-center justify-center gap-4 p-4 border-t border-gray-700/50">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-300">Modo:</span>
            <div className="flex bg-gray-900/50 border border-gray-600 rounded-lg p-1">
              <button onClick={() => setMode('slider')} className={`px-3 py-1 text-sm rounded-md transition-colors ${mode === 'slider' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700/50'}`}>Divisor</button>
              <button onClick={() => setMode('opacity')} className={`px-3 py-1 text-sm rounded-md transition-colors ${mode === 'opacity' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700/50'}`}>Opacidade</button>
            </div>
          </div>

          {mode === 'opacity' && (
            <div className="flex items-center gap-2 text-white w-64 animate-fade-in">
                <LazyIcon name="SunIcon" className="w-5 h-5 text-gray-400"/>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={opacity}
                    onChange={(e) => setOpacity(Number(e.target.value))}
                    className="w-full"
                    aria-label="Opacidade da imagem modificada"
                />
                <span className="font-mono text-xs w-10 text-center">{opacity}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComparisonModal;