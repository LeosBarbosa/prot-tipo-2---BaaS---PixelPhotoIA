/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { lazy, Suspense, useMemo } from 'react';
import { EditorProvider, useEditor } from './context/EditorContext';
import Header from './components/Header';
import { type ToolId, type TabId } from './types';
import ComparisonModal from './components/ComparisonModal';
import ToastNotification from './components/ToastNotification';
import ProactiveSuggestion from './components/ProactiveSuggestion';
import LoadingOverlay from './components/LoadingOverlay';
import SaveWorkflowModal from './components/SaveWorkflowModal';
import Spinner from './components/Spinner';
import StudioLayout from './components/StudioLayout';
import ToolModal from './components/ToolModal';
import { tools } from './config/tools';
import { toolComponentMap } from './config/toolComponentMap';


function AppContent() {
  const { 
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
  } = useEditor();

  // Gera dinamicamente o mapa de ferramentas modais a partir da configuração central.
  const modalToolMap = useMemo(() => {
    const map: Partial<Record<ToolId, { Component: React.LazyExoticComponent<React.FC<{}>>; title: string }>> = {};
    tools.forEach(tool => {
        // Apenas ferramentas que não são de edição (abrem em modal) são incluídas.
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
  
  return (
    <div className="w-full min-h-screen flex flex-col bg-gray-900 text-gray-200 transition-colors duration-300 lg:overflow-hidden">
      <Header />
      <main className="flex-grow flex flex-col relative">
        <StudioLayout />

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