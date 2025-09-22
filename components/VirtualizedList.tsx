/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback } from 'react';

interface VirtualizedListProps {
  numItems: number;
  itemHeight: number;
  renderItem: (props: { index: number; style: React.CSSProperties }) => React.ReactNode;
  windowHeight: number;
  overscan?: number;
}

/**
 * Um componente de virtualização de lista com consciência de hardware, inspirado no RecyclerView do Android.
 * Ele renderiza apenas os itens visíveis em uma lista longa, reduzindo drasticamente o número de
 * nós do DOM, o que economiza memória e tempo de processamento da CPU/GPU para layout e pintura.
 * Isso garante que a UI permaneça responsiva e suave, mesmo com milhares de itens.
 */
const VirtualizedList: React.FC<VirtualizedListProps> = ({
  numItems,
  itemHeight,
  renderItem,
  windowHeight,
  overscan = 5,
}) => {
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    numItems - 1,
    Math.floor((scrollTop + windowHeight) / itemHeight) + overscan
  );

  const items = [];
  for (let i = startIndex; i <= endIndex; i++) {
    items.push(
      renderItem({
        index: i,
        style: {
          position: 'absolute',
          top: `${i * itemHeight}px`,
          width: '100%',
          height: `${itemHeight}px`,
        },
      })
    );
  }

  return (
    <div
      onScroll={handleScroll}
      style={{
        height: `${windowHeight}px`,
        overflowY: 'auto',
        position: 'relative',
      }}
      className="w-full"
    >
      <div
        style={{
          height: `${numItems * itemHeight}px`,
          position: 'relative',
        }}
      >
        {items}
      </div>
    </div>
  );
};

export default VirtualizedList;