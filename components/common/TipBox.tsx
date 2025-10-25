/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import LazyIcon from '../LazyIcon';

interface TipBoxProps {
  children: React.ReactNode;
}

const TipBox: React.FC<TipBoxProps> = ({ children }) => {
  return (
    <div className="flex items-start gap-3 p-3 mt-4 rounded-lg bg-blue-900/20 border border-blue-700/30 text-blue-200">
      <LazyIcon name="InformationCircleIcon" className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-400" />
      <p className="text-xs">{children}</p>
    </div>
  );
};

export default TipBox;