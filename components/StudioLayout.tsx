/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { useEditor } from '../context/EditorContext';
import HomePage from './HomePage';
import EditorModalLayout from './EditorModalLayout';

const StudioLayout: React.FC = () => {
    const { isEditingSessionActive } = useEditor();

    if (isEditingSessionActive) {
        return <EditorModalLayout />;
    }

    return <HomePage />;
};

export default StudioLayout;
