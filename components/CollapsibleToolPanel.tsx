/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { ChevronDownIcon } from './icons';

// Um componente simples de interruptor (toggle)
const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean; }> = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    disabled={disabled}
    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed ${
      checked ? 'bg-blue-600' : 'bg-gray-600'
    }`}
  >
    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${
      checked ? 'translate-x-6' : 'translate-x-1'
    }`} />
  </button>
);

interface CollapsibleToolPanelProps {
  title: string;
  children: React.ReactNode;
  isActive: boolean;
  onToggle: () => void;
  isExpanded: boolean;
  onExpandToggle: () => void;
  isLoading?: boolean;
}

const CollapsibleToolPanel: React.FC<CollapsibleToolPanelProps> = ({
  title,
  children,
  isActive,
  onToggle,
  isExpanded,
  onExpandToggle,
  isLoading,
}) => {
  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg overflow-hidden transition-all duration-300">
      <header
        className="flex items-center p-3 cursor-pointer select-none hover:bg-white/5"
        onClick={onExpandToggle}
      >
        <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${!isExpanded ? '-rotate-90' : ''}`} />
        <h4 className="flex-grow font-semibold text-white ml-3">{title}</h4>
        <div onClick={e => e.stopPropagation()}>
            <ToggleSwitch checked={isActive} onChange={onToggle} disabled={isLoading} />
        </div>
      </header>
      <div
        className={`transition-all duration-300 ease-in-out grid ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
        style={{ transitionProperty: 'grid-template-rows, opacity' }}
      >
        <div className="overflow-hidden">
          <div className="p-4 border-t border-gray-700/50">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollapsibleToolPanel;