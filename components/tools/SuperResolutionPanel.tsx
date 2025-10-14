/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { SparkleIcon } from '../icons';
import ToggleSwitch from '../common/ToggleSwitch';
import TipBox from '../common/TipBox';

const SuperResolutionPanel: React.FC = () => {
  const { 
    isLoading, 
    handleApplySuperResolution, 
    baseImageFile 
  } = useEditor();
  
  const [factor, setFactor] = useState<number>(2);
  const [intensity, setIntensity] = useState<number>(50);
  const [preserveFace, setPreserveFace] = useState<boolean>(true);
  const [originalDimensions, setOriginalDimensions] = useState<{width: number, height: number} | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    if (baseImageFile) {
        const image = new Image();
        image.onload = () => {
            setOriginalDimensions({ width: image.naturalWidth, height: image.naturalHeight });
            if(objectUrl) URL.revokeObjectURL(objectUrl);
        };
        objectUrl = URL.createObjectURL(baseImageFile);
        image.src = objectUrl;
    }
    return () => {
        if(objectUrl) URL.revokeObjectURL(objectUrl);
    }
  }, [baseImageFile]);

  const finalDimensions = originalDimensions ? {
    width: originalDimensions.width * factor,
    height: originalDimensions.height * factor,
  } : null;

  const handleApply = () => {
    handleApplySuperResolution(factor, intensity, preserveFace);
  };
  
  return (
    <div className="w-full flex flex-col gap-4">
        <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-300">Super Resolução com IA</h3>
            <p className="text-sm text-gray-400 -mt-1">
                Aumente a resolução e a nitidez simultaneamente.
            </p>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 text-center">Fator de Aumento</label>
            <div className="flex w-full bg-gray-800/50 border border-gray-600 rounded-lg p-1">
                {[2, 4].map(f => (
                    <button key={f} type="button" onClick={() => setFactor(f)} disabled={isLoading} className={`w-full text-center font-semibold py-2 rounded-md transition-all text-sm ${factor === f ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700/50'}`}>
                    {f}x
                    </button>
                ))}
            </div>
        </div>
        
        {originalDimensions && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 text-center">Dimensões Finais</label>
              <div className="flex items-center justify-center bg-gray-800/50 border border-gray-600 rounded-lg p-3 text-base font-mono text-white tracking-wider">
                  {finalDimensions?.width ?? '...'}
                  <span className="text-gray-500 mx-3">×</span>
                  {finalDimensions?.height ?? '...'}
                  <span className="text-gray-400 ml-2">px</span>
              </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300 flex justify-between">
                <span>Intensidade da Nitidez</span>
                <span className="text-white font-mono">{intensity}%</span>
            </label>
            <input
                type="range"
                min="0"
                max="100"
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                disabled={isLoading}
                className="w-full"
            />
        </div>
    
      <div className="flex items-center justify-between p-3 bg-gray-900/30 rounded-lg border border-gray-700/50">
          <label htmlFor="preserve-face-sr" className="font-semibold text-gray-200 text-sm cursor-pointer">Preservar Rosto</label>
          <ToggleSwitch id="preserve-face-sr" checked={preserveFace} onChange={setPreserveFace} disabled={isLoading} />
      </div>

      <TipBox>
          Esta ferramenta combina o aumento de resolução com a nitidez generativa para um aprimoramento completo. Ideal para preparar imagens para impressão ou exibição em telas grandes.
      </TipBox>

      <button
          onClick={handleApply}
          disabled={isLoading}
          className="w-full mt-2 bg-gradient-to-br from-yellow-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:from-gray-600 disabled:shadow-none disabled:cursor-not-allowed"
      >
          <SparkleIcon className={`w-5 h-5 ${isLoading ? 'animate-pulse' : ''}`} />
          {isLoading ? 'Aplicando...' : 'Aplicar Super Resolução'}
      </button>
    </div>
  );
};

export default SuperResolutionPanel;