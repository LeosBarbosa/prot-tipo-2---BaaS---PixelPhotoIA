/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import LazyIcon from './LazyIcon';

interface CollapsibleToolPanelProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  isExpanded: boolean;
  onExpandToggle: () => void;
}

const CollapsibleToolPanel: React.FC<CollapsibleToolPanelProps> = ({
  title,
  icon,
  children,
  isExpanded,
  onExpandToggle,
}) => {
  return (
    <div className="bg-gray-800/80 border border-gray-700 rounded-lg overflow-hidden transition-all duration-300">
      <header
        className="flex items-center p-3 cursor-pointer select-none hover:bg-gray-700/60"
        onClick={onExpandToggle}
        aria-expanded={isExpanded}
      >
        <div className="text-blue-400"><LazyIcon name={icon} className="w-5 h-5" /></div>
        <h4 className="flex-grow font-semibold text-white ml-3">{title}</h4>
        <LazyIcon name="ChevronDownIcon" className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? '' : '-rotate-90'}`} />
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