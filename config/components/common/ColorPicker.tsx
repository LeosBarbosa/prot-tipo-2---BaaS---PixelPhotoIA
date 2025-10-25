/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

const PREDEFINED_COLORS = [
  '#090A0F',
  '#111827',
  '#374151',
  '#1e293b',
  '#f9fafb',
  '#e5e7eb',
  '#164e63',
  '#4c1d95',
  '#831843',
];

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange }) => {
  const [hexValue, setHexValue] = React.useState(color);

  React.useEffect(() => {
    setHexValue(color);
  }, [color]);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHex = e.target.value;
    setHexValue(newHex);
    // Basic hex color validation
    if (/^#([0-9A-F]{3}){1,2}$/i.test(newHex)) {
      onChange(newHex);
    }
  };
  
  const handleColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newColor = e.target.value;
      setHexValue(newColor);
      onChange(newColor);
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-4 w-64 space-y-4 animate-fade-in">
      <div>
        <h4 className="text-sm font-semibold text-gray-300 mb-2">Cores Predefinidas</h4>
        <div className="grid grid-cols-5 gap-2">
          {PREDEFINED_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onChange(c)}
              className={`w-10 h-10 rounded-full border-2 transition-transform transform hover:scale-110 ${color.toLowerCase() === c.toLowerCase() ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-600'}`}
              style={{ backgroundColor: c }}
              aria-label={`Selecionar cor ${c}`}
            />
          ))}
        </div>
      </div>
      <div className="border-t border-gray-700 my-2"></div>
      <div>
        <h4 className="text-sm font-semibold text-gray-300 mb-2">Cor Personalizada</h4>
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-gray-600">
            <input
              type="color"
              value={color}
              onChange={handleColorInputChange}
              className="absolute top-0 left-0 w-12 h-12 -ml-1 -mt-1 cursor-pointer"
              aria-label="Seletor de cor"
            />
          </div>
          <div className="flex-grow">
            <input
              type="text"
              value={hexValue}
              onChange={handleHexChange}
              className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-sm text-center font-mono text-white"
              aria-label="Valor hexadecimal da cor"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;