/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import ImageDropzoneCommon from './common/ImageDropzone';

// This component is a duplicate and its logic has been consolidated into 
// components/tools/common/ImageDropzone.tsx.
// This file is kept to avoid breaking imports but should not be used directly.
const ImageDropzone: React.FC<any> = (props) => {
    console.warn("components/tools/ImageDropzone.tsx is deprecated. Use components/tools/common/ImageDropzone.tsx instead.");
    // Forward props to the common component to maintain functionality
    // This assumes the props are compatible, which the refactor ensures.
    return <ImageDropzoneCommon {...props} />;
};

export default ImageDropzone;