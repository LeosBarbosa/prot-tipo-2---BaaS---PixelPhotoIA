/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { lazy, Suspense } from 'react';

// Um cache simples para os componentes lazy para evitar recriá-los a cada renderização.
const iconCache = new Map<string, React.LazyExoticComponent<React.FC<any>>>();

const LazyIcon: React.FC<{ name: string; className?: string }> = ({ name, className }) => {
  if (!name) {
    return <div className={`w-5 h-5 ${className}`} />; // Fallback para nome de ícone ausente
  }

  if (!iconCache.has(name)) {
    iconCache.set(name, lazy(() => 
      import('./icons').then(module => {
        if ((module as any)[name]) {
          return { default: (module as any)[name] };
        }
        // Fallback se o nome do ícone for inválido
        console.warn(`Ícone "${name}" não encontrado.`);
        return { default: () => <div className={`w-5 h-5 border border-dashed border-red-500 ${className}`} /> };
      })
    ));
  }

  const IconComponent = iconCache.get(name)!;

  return (
    <Suspense fallback={<div className={`w-5 h-5 bg-gray-700 rounded ${className}`} />}>
      <IconComponent className={className} />
    </Suspense>
  );
};

export default LazyIcon;
