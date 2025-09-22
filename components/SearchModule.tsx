/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { SearchIcon } from './icons';

interface SearchModuleProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const SearchModule: React.FC<SearchModuleProps> = ({ searchTerm, onSearchChange }) => {
  return (
    <div className="relative w-full max-w-2xl mx-auto mb-8 animate-fade-in">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Pesquisar ferramentas por nome ou descrição..."
        className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        aria-label="Pesquisar ferramentas"
      />
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <SearchIcon className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  );
};

export default SearchModule;