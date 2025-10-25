/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
// FIX: Correcting import path for context
import { EditorProvider } from './context/EditorContext';
import StudioLayout from './components/StudioLayout';


const App: React.FC = () => {
  return (
    <EditorProvider>
        <StudioLayout />
    </EditorProvider>
  );
};

export default App;