/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import LazyIcon from './LazyIcon';

interface OnboardingTourProps {
  onComplete: () => void;
}

const steps = [
  {
    title: 'Bem-vindo ao PixelPhoto IA!',
    content: 'Este é um tour rápido para mostrar como tudo funciona. Vamos começar?',
    target: null,
  },
  {
    title: 'Painel de Ferramentas',
    content: 'Aqui você encontrará todas as poderosas ferramentas de edição de IA. Clique em uma categoria para expandir e ver as opções.',
    target: 'left-panel',
  },
  {
    title: 'Área de Visualização',
    content: 'Sua imagem será exibida aqui. Você pode usar o scroll do mouse (ou o gesto de pinça) para dar zoom e arrastar para navegar.',
    target: 'main-viewer',
  },
  {
    title: 'Painel de Opções',
    content: 'Quando você seleciona uma ferramenta, suas opções e controles aparecerão aqui. É onde a mágica acontece!',
    target: 'right-panel',
  },
  {
    title: 'Tudo Pronto!',
    content: 'Agora você está pronto para explorar e criar. Divirta-se editando!',
    target: null,
  },
];

const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const step = steps[currentStep];

  // A simple modal implementation for the tour
  return (
    <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-6 text-center animate-zoom-rise">
        <div className="flex justify-center mb-4">
          <LazyIcon name="SparkleIcon" className="w-12 h-12 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{step.title}</h2>
        <p className="text-gray-300 mb-6">{step.content}</p>

        <div className="flex justify-center items-center gap-2 mb-6">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentStep ? 'bg-blue-500' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSkip}
            className="w-full sm:w-auto flex-1 bg-gray-700/50 hover:bg-gray-600/50 text-white font-semibold py-2 px-4 rounded-md transition-colors"
          >
            {currentStep === steps.length - 1 ? 'Fechar' : 'Pular Tour'}
          </button>
          <button
            onClick={handleNext}
            className="w-full sm:w-auto flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-md transition-colors"
          >
            {currentStep === steps.length - 1 ? 'Começar a Editar!' : 'Próximo'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;