/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface PromptSuggestionsDropdownProps {
  suggestions: string[];
  onSelect: (prompt: string) => void;
  searchTerm: string;
}

const PromptSuggestionsDropdown: React.FC<PromptSuggestionsDropdownProps> = ({ suggestions, onSelect, searchTerm }) => {
  if (suggestions.length === 0) {
    return null;
  }
  
  const highlightMatch = (text: string, highlight: string) => {
    if (!highlight) {
      return <span>{text}</span>;
    }
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <strong key={i} className="text-blue-400">{part}</strong>
          ) : (
            part
          )
        )}
      </span>
    );
  };


  return (
    <div className="absolute top-full mt-1 w-full bg-gray-800/90 backdrop-blur-md border border-gray-600 rounded-lg shadow-2xl z-50 overflow-hidden animate-fade-in">
      <ul className="max-h-60 overflow-y-auto scrollbar-thin">
        {suggestions.map((prompt, index) => (
          <li key={index}>
            <button
              type="button"
              onClick={() => onSelect(prompt)}
              className="w-full text-left p-3 text-sm text-gray-200 hover:bg-blue-500/20 transition-colors truncate"
            >
              {highlightMatch(prompt, searchTerm)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PromptSuggestionsDropdown;