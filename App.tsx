/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { Suspense, useMemo } from 'react';
// FIX: Import 'useEditor' from the correct path in 'context/EditorContext'.
import { EditorProvider, useEditor } from './context/EditorContext';
import HomePage from './config/components/HomePage';
import EditorLayout from './config/components/EditorLayout';
import { type ToolId } from './types';
import { tools } from './config/tools';
import { toolComponentMap } from './config/toolComponentMap';
import ToolModal from './config/components/ToolModal';
import Spinner from './config/components/Spinner';
import ComparisonModal from './config/components/ComparisonModal';
import ToastNotification from './config/components/ToastNotification';
import ProactiveSuggestion from './config/components/ProactiveSuggestion';
import SaveWorkflowModal from './config/components/SaveWorkflowModal';
import DownloadModal from './config/components/DownloadModal';
import LoadingOverlay from './config/components/LoadingOverlay';
import OnboardingTour from './config/components/OnboardingTour';
import PreviewScreen from './config/components/PreviewScreen';

const AppContent: React.FC = () => {
    const { 
      isEditingSessionActive,
      uploadedFile,
      activeTool,
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
      isDownloadModalOpen,
      showOnboarding,
      setShowOnboarding,
      backgroundColor,
    } = useEditor();

    const modalToolMap = useMemo(() => {
        const map: Partial<Record<ToolId, { Component: React.LazyExoticComponent<React.FC<{}>>; title: string }>> = {};
        tools.forEach(tool => {
            if (!tool.isEditingTool) {
                const component = toolComponentMap[tool.id];
                if (component) {
                    map[tool.id] = { Component: component, title: tool.name };
                }
            }
        });
        return map;
    }, []);

    const ActiveToolComponent = useMemo(() => {
        if (!activeTool || !modalToolMap[activeTool]) return null;
        return modalToolMap[activeTool]!.Component;
    }, [activeTool, modalToolMap]);
    
    const activeToolTitle = useMemo(() => {
        if (!activeTool || !modalToolMap[activeTool]) return '';
        return modalToolMap[activeTool]!.title;
    }, [activeTool, modalToolMap]);

    const renderMainContent = () => {
      if (uploadedFile) {
        return <PreviewScreen />;
      }
      if (isEditingSessionActive) {
        return <EditorLayout />;
      }
      return <HomePage />;
    };

    return (
        <div 
          className="w-full min-h-screen flex flex-col text-gray-200"
          style={{ 
            backgroundColor: backgroundColor,
            transition: 'background-color 0.3s ease-in-out',
          }}
        >
            {renderMainContent()}

            {ActiveToolComponent && (
                <ToolModal title={activeToolTitle}>
                    <Suspense fallback={<div className="flex justify-center items-center h-full"><Spinner /></div>}>
                        <ActiveToolComponent />
                    </Suspense>
                </ToolModal>
            )}
            
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
            {isDownloadModalOpen && <DownloadModal />}

            {showOnboarding && <OnboardingTour onComplete={() => setShowOnboarding(false)} />}
        </div>
    );
};


const App: React.FC = () => {
  return (
    <EditorProvider>
        <AppContent />
    </EditorProvider>
  );
};

export default App;