/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { useEditor } from '../../context/EditorContext';
import { tools } from '../tools';
import LazyIcon from './LazyIcon';

const RecentTools: React.FC = () => {
  const { recentTools, setActiveTool } = useEditor();

  if (!recentTools || recentTools.length === 0) {
    return null;
  }
  
  const recentToolConfigs = recentTools
    .map(id => tools.find(tool => tool.id === id))
    .filter((tool): tool is NonNullable<typeof tool> => !!tool);

  return (
    <div className="mb-12 animate-fade-in">
      <h2 className="text-xl font-bold text-white text-center mb-4">Acessado Recentemente</h2>
      <div className="flex flex-wrap justify-center gap-4">
        {recentToolConfigs.map(tool => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            title={tool.description}
            className="flex items-center gap-3 bg-gray-800/60 border border-gray-700 rounded-lg p-3 hover:bg-gray-700/80 hover:border-blue-500/50 transition-all transform hover:scale-105"
          >
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                <LazyIcon name={tool.icon} className="w-5 h-5 text-gray-300" />
            </div>
            <span className="font-semibold text-gray-200">{tool.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RecentTools;