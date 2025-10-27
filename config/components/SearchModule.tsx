/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { type ToolConfig, type ToolId } from '../../types';
import LazyIcon from './LazyIcon';

interface SearchModuleProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSmartSearch: (term: string) => void;
  isSearching: boolean;
  suggestions: ToolConfig[];
  onSuggestionClick: (toolId: ToolId) => void;
}

const SearchModule: React.FC<SearchModuleProps> = ({ 
  searchTerm, 
  onSearchChange, 
  onSmartSearch, 
  isSearching,
  suggestions,
  onSuggestionClick,
}) => {
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSmartSearch(searchTerm);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto mb-8 animate-fade-in">
      <form
        onSubmit={handleSubmit}
        autoComplete="off" 
      >
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
          {isSearching ? (
            <LazyIcon name="SparkleIcon" className="w-5 h-5 text-blue-400 animate-pulse" />
          ) : (
            <LazyIcon name="SearchIcon" className="w-5 h-5 text-gray-400" />
          )}
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Pesquisar ferramentas ou descrever uma edição (Ex: 'remover o fundo')..."
          className="relative w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          aria-label="Pesquisar ferramentas ou descrever uma edição"
          disabled={isSearching}
        />
        <button type="submit" className="hidden" aria-label="Executar busca inteligente">
          Search
        </button>
      </form>

      {suggestions.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl z-50 overflow-hidden animate-fade-in">
          <ul className="max-h-80 overflow-y-auto">
            {suggestions.map((tool) => (
              <li key={tool.id}>
                <button
                  type="button"
                  onClick={() => onSuggestionClick(tool.id)}
                  className="w-full flex items-center gap-4 p-3 text-left hover:bg-blue-500/20 transition-colors"
                >
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                    <LazyIcon name={tool.icon} className="w-5 h-5 text-gray-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{tool.name}</p>
                    <p className="text-xs text-gray-400 truncate">{tool.description}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchModule;