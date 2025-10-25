/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import Header from './Header';
import EditorModalLayout from './EditorModalLayout';

const EditorLayout: React.FC = () => {
    return (
        <>
            <Header />
            <main className="flex-grow flex items-stretch">
                <EditorModalLayout />
            </main>
        </>
    );
};

export default EditorLayout;