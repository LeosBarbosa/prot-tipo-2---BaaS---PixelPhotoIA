/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect } from 'react';
import LazyIcon from './LazyIcon';
import { type ToastType } from '../../types';

interface ToastNotificationProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, type === 'error' ? 8000 : 4000); // Mais tempo para erros

    return () => {
      clearTimeout(timer);
    };
  }, [onClose, type]);

  const config = {
    error: {
      bg: 'bg-red-800/90',
      border: 'border-red-600',
      iconColor: 'text-red-300',
      textColor: 'text-red-100',
      title: 'Erro',
      iconName: 'InformationCircleIcon',
    },
    success: {
      bg: 'bg-green-800/90',
      border: 'border-green-600',
      iconColor: 'text-green-300',
      textColor: 'text-green-100',
      title: 'Sucesso',
      iconName: 'CheckCircleIcon',
    },
    info: {
      bg: 'bg-blue-800/90',
      border: 'border-blue-600',
      iconColor: 'text-blue-300',
      textColor: 'text-blue-100',
      title: 'Informação',
      iconName: 'InformationCircleIcon',
    },
  }[type];


  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] w-full max-w-md p-4 rounded-xl backdrop-blur-sm shadow-2xl animate-zoom-rise ${config.bg} ${config.border}`}
      role="alert"
    >
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 ${config.iconColor}`}>
          <LazyIcon name={config.iconName} className="w-6 h-6" />
        </div>
        <div className={`flex-grow ${config.textColor}`}>
          <p className="font-bold">{config.title}</p>
          <p className="text-sm">{message}</p>
        </div>
        <div className="flex-shrink-0">
          <button onClick={onClose} className="text-current opacity-70 hover:opacity-100 transition-opacity" aria-label="Fechar notificação">
            <LazyIcon name="CloseIcon" className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToastNotification;