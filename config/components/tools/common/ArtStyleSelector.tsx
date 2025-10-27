/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { type ArtStyle, artStyleCategories, artStyleCategoryOrder, categoryLabels, type ArtStyleCategory } from '../../../artStyles';

interface ArtStyleSelectorProps {
  selectedStyleId: string | null;
  onSelectStyle: (id: string) => void;
  disabled?: boolean;
}

const ArtStyleSelector: React.FC<ArtStyleSelectorProps> = ({ selectedStyleId, onSelectStyle, disabled }) => {
  const [activeCategory, setActiveCategory] = useState<ArtStyleCategory>('digital');

  return (
    <div className="flex flex-col gap-3">
      {/* Category Tabs */}
      <div className="flex w-full bg-gray-900/50 border border-gray-600 rounded-lg p-1">
        {artStyleCategoryOrder.map(category => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            disabled={disabled}
            className={`w-full text-center font-semibold py-2 rounded-md text-xs transition-all ${
              activeCategory === category
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            {categoryLabels[category]}
          </button>
        ))}
      </div>

      {/* Style Thumbnails */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 animate-fade-in">
        {artStyleCategories[activeCategory].map(style => (
          <button
            key={style.id}
            type="button"
            onClick={() => onSelectStyle(style.id)}
            disabled={disabled}
            className={`relative group aspect-square rounded-lg overflow-hidden border-2 transition-all ${
              selectedStyleId === style.id ? 'border-blue-500 scale-105' : 'border-transparent hover:border-gray-500'
            }`}
            title={style.name}
          >
            <img src={style.thumbnail} alt={style.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
            <p className="absolute bottom-1 left-0 right-0 text-white text-xs font-bold text-center drop-shadow-md p-1 bg-black/20">{style.name}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ArtStyleSelector;