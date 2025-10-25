/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import Spinner from './Spinner';
import { type UploadProgressStatus } from '../types';

interface LoadingOverlayProps {
  message: string;
  progressStatus: UploadProgressStatus | null;
}

const stageMessages: Record<UploadProgressStatus['stage'], string> = {
    reading: 'Lendo arquivo...',
    processing: 'Processando imagem...',
    compressing: 'Comprimindo...',
    done: 'Concluído!',
};

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message, progressStatus }) => {
  const isProgressVisible = progressStatus !== null;
  const progress = progressStatus?.progress ?? 0;
  const stageMessage = progressStatus ? stageMessages[progressStatus.stage] : '';

  return (
    <div
      className="fixed inset-0 z-[200] bg-gray-900/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loading-message"
    >
      <div className="w-full max-w-sm text-center">
        <Spinner />
        <p
          key={message}
          id="loading-message"
          className="mt-4 text-lg font-semibold text-gray-200 animate-fade-in-text animate-pulse"
        >
          {message}
        </p>

        {isProgressVisible && (
            <p className="mt-1 text-sm text-gray-400 h-5">{stageMessage}</p>
        )}

        {isProgressVisible && (
          <div className="mt-2" aria-live="polite">
            <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-blue-500 h-2.5 rounded-full transition-all duration-300 ease-linear"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="mt-2 text-sm font-mono text-gray-400">{Math.round(progress)}%</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingOverlay;