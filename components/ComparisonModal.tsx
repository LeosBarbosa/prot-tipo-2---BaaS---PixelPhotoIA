/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { CloseIcon } from './icons';
import ComparisonSlider from './ComparisonSlider';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  beforeImage: string;
  afterImage: string;
}

const ComparisonModal: React.FC<ComparisonModalProps> = ({ isOpen, onClose, beforeImage, afterImage }) => {
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
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-grow relative overflow-hidden flex items-center justify-center p-4">
          <ComparisonSlider originalSrc={beforeImage} modifiedSrc={afterImage} />
        </div>
      </div>
    </div>
  );
};

export default ComparisonModal;