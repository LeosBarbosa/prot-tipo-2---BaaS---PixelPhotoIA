/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import ToggleSwitch from '../common/ToggleSwitch';
import TipBox from '../common/TipBox';
import LazyIcon from '../components/LazyIcon';

const UpscalePanel: React.FC = () => {
  const { 
    isLoading, 
    handleApplyUpscale, 
    baseImageFile 
  } = useEditor();
  
  const [factor, setFactor] = useState<number>(4);
  const [preserveFace, setPreserveFace] = useState<boolean>(true);
  const [originalDimensions, setOriginalDimensions] = useState<{width: number, height: number} | null>(null);

  React.useEffect(() => {
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
    handleApplyUpscale(factor, preserveFace);
  };
  
  return (
    <div className="w-full flex flex-col gap-4">
      <div>
          <label className="block text-sm font-medium text-gray-300 mb-2 text-center">Fator de Aumento</label>
          <div className="flex w-full bg-gray-800/50 border border-gray-600 rounded-lg p-1">
              {[2, 4, 8].map(f => (
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
    
      <div className="flex items-center justify-between p-3 bg-gray-900/30 rounded-lg border border-gray-700/50">
          <label htmlFor="preserve-face" className="font-semibold text-gray-200 text-sm cursor-pointer">Preservar Rosto</label>
          <ToggleSwitch id="preserve-face" checked={preserveFace} onChange={setPreserveFace} disabled={isLoading} />
      </div>

      <TipBox>
          Ative a opção "Preservar Rosto" ao ampliar retratos para garantir que os detalhes faciais sejam aprimorados com realismo.
      </TipBox>

      <button
          onClick={handleApply}
          disabled={isLoading}
          className="w-full mt-2 bg-gradient-to-br from-emerald-600 to-green-500 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:from-gray-600 disabled:shadow-none disabled:cursor-not-allowed"
      >
          <LazyIcon name="ArrowUpOnSquareIcon" className={`w-5 h-5 ${isLoading ? 'animate-pulse' : ''}`} />
          {isLoading ? 'Aplicando...' : 'Aplicar Upscale'}
      </button>
    </div>
  );
};

export default UpscalePanel;