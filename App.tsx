/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
// FIX: Corrected import path
import { EditorProvider, useEditor } from './context/EditorContext';
import Header from './components/Header';
import ComparisonModal from './components/ComparisonModal';
import ToastNotification from './components/ToastNotification';
import ProactiveSuggestion from './components/ProactiveSuggestion';
import LoadingOverlay from './components/LoadingOverlay';
import SaveWorkflowModal from './components/SaveWorkflowModal';
import StudioLayout from './components/StudioLayout';


function AppContent() {
  const { 
    isLoading,
    loadingMessage,
    uploadProgress,
    isComparisonModalOpen,
    setIsComparisonModalOpen,
    originalImageUrl,
    currentImageUrl,
    toast,
    setToast,
    proactiveSuggestion,
    isSaveWorkflowModalOpen,
  } = useEditor();
  
  return (
    <div className="w-full min-h-screen flex flex-col bg-gray-900 text-gray-200 transition-colors duration-300 lg:overflow-hidden">
      <Header />
      <main className="flex-grow flex flex-col relative">
        <StudioLayout />
        
        {isLoading && loadingMessage && (
            <LoadingOverlay message={loadingMessage} progressStatus={uploadProgress} />
        )}
        
        {isComparisonModalOpen && originalImageUrl && currentImageUrl && (
            <ComparisonModal
                isOpen={isComparisonModalOpen}
                onClose={() => setIsComparisonModalOpen(false)}
                beforeImage={originalImageUrl}
                afterImage={currentImageUrl}
            />
        )}

        {toast && (
          <ToastNotification
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
        
        {proactiveSuggestion && (
            <ProactiveSuggestion
                message={proactiveSuggestion.message}
                acceptLabel={proactiveSuggestion.acceptLabel}
                onAccept={proactiveSuggestion.onAccept}
            />
        )}

        {isSaveWorkflowModalOpen && <SaveWorkflowModal />}

      </main>
    </div>
  );
}


const App: React.FC = () => {
  return (
    <EditorProvider>
        <AppContent />
    </EditorProvider>
  );
};

export default App;
