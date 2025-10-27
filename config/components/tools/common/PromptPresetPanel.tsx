/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { type ToolId } from '../../../../types';
import { promptPresets } from '../../../promptPresets';
import LazyIcon from '../../LazyIcon';

interface PromptPresetPanelProps {
  toolId: ToolId;
  onSelectPreset: (prompt: string) => void;
  isLoading?: boolean;
}

const PromptPresetPanel: React.FC<PromptPresetPanelProps> = ({ toolId, onSelectPreset, isLoading }) => {
  const presets = promptPresets[toolId];

  if (!presets || presets.length === 0) {
    return null; // Don't render if no presets for this tool
  }

  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
        <LazyIcon name="SparkleIcon" className="w-5 h-5 text-yellow-400" />
        Predefinições de Prompt
      </h4>
      <div className="flex flex-col gap-2">
        {presets.map((preset) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => onSelectPreset(preset.prompt)}
            disabled={isLoading}
            className="w-full text-left p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors disabled:opacity-50"
            title={preset.prompt}
          >
            <p className="font-semibold text-white text-sm">{preset.name}</p>
            <p className="text-xs text-gray-400 mt-1">{preset.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PromptPresetPanel;