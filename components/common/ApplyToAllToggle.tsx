/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import ToggleSwitch from './ToggleSwitch';

interface ApplyToAllToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
}

const ApplyToAllToggle: React.FC<ApplyToAllToggleProps> = ({ checked, onChange }) => {
    return (
        <div className="flex items-center justify-between p-3 bg-gray-900/50 border border-gray-700 rounded-lg mt-2">
            <label htmlFor="apply-to-all" className="font-semibold text-gray-200 text-sm cursor-pointer">
                Aplicar a todos os frames
            </label>
            <ToggleSwitch id="apply-to-all" checked={checked} onChange={onChange} />
        </div>
    );
};

export default ApplyToAllToggle;