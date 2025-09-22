/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect } from 'react';
import { InformationCircleIcon, CloseIcon } from './icons';

interface ToastNotificationProps {
  message: string;
  onClose: () => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-dismiss after 5 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] w-full max-w-md p-4 rounded-xl bg-red-800/90 backdrop-blur-sm border border-red-600 shadow-2xl animate-zoom-rise"
      role="alert"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 text-red-300">
          <InformationCircleIcon className="w-6 h-6" />
        </div>
        <div className="flex-grow text-red-100">
          <p className="font-bold">Erro</p>
          <p className="text-sm">{message}</p>
        </div>
        <div className="flex-shrink-0">
          <button onClick={onClose} className="text-red-200 hover:text-white transition-colors" aria-label="Fechar notificação">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToastNotification;
