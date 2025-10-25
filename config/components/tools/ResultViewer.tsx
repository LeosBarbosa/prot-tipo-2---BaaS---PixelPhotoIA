/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import ResultViewerCommon from './common/ResultViewer';

// This component is a duplicate of `components/tools/common/ResultViewer.tsx`.
// This file is kept to avoid breaking existing imports but should be considered deprecated.
// All logic is now forwarded to the common component.
const ResultViewer: React.FC<any> = (props) => {
    console.warn("components/tools/ResultViewer.tsx is deprecated. Use components/tools/common/ResultViewer.tsx instead.");
    return <ResultViewerCommon {...props} />;
};

export default ResultViewer;