/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { EditorProvider } from './context/EditorContext';
import StudioLayout from './config/components/StudioLayout';


const App: React.FC = () => {
  return (
    <EditorProvider>
        <StudioLayout />
    </EditorProvider>
  );
};

export default App;