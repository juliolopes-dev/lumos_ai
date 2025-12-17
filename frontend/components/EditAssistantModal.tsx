import React, { useEffect, useState } from 'react';
import { X, Save, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import { Assistant } from '../types';

interface EditAssistantModalProps {
  isOpen: boolean;
  assistant: Assistant | null;
  onClose: () => void;
  onSave: (data: { name: string; systemInstruction: string; temperature?: number }) => void;
}

// Helper functions para temperature
const getTemperatureIcon = (temp: number): string => {
  if (temp <= 0.3) return "🎯";
  if (temp <= 0.6) return "⚖️";
  if (temp <= 0.8) return "💡";
  return "🎨";
};

const getTemperatureLabel = (temp: number): string => {
  if (temp <= 0.3) return "Preciso";
  if (temp <= 0.6) return "Balanceado";
  if (temp <= 0.8) return "Criativo";
  return "Inovador";
};

const getTemperatureDescription = (temp: number): string => {
  if (temp <= 0.3) {
    return "Respostas técnicas, consistentes e focadas em fatos.";
  } else if (temp <= 0.6) {
    return "Equilíbrio entre precisão e criatividade.";
  } else if (temp <= 0.8) {
    return "Respostas mais variadas e ideias criativas.";
  } else {
    return "Máxima criatividade e respostas inovadoras.";
  }
};

const EditAssistantModal: React.FC<EditAssistantModalProps> = ({ isOpen, assistant, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [systemInstruction, setSystemInstruction] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [showExamples, setShowExamples] = useState(false);

  useEffect(() => {
    if (isOpen && assistant) {
      setName(assistant.name || '');
      setSystemInstruction(assistant.systemInstruction || '');
      setTemperature(assistant.temperature ?? 0.7);
    }
  }, [isOpen, assistant]);

  if (!isOpen || !assistant) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !systemInstruction.trim()) return;
    onSave({ name, systemInstruction, temperature });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
            <Pencil className="w-5 h-5 text-emerald-400" />
            Editar Assistente
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nome do Assistente
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Professor de Inglês, Dev Senior..."
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Instrução de Sistema (Persona)
            </label>
            <div className="text-xs text-gray-500 mb-2">
              Defina como a IA deve se comportar.
            </div>
            <textarea
              value={systemInstruction}
              onChange={(e) => setSystemInstruction(e.target.value)}
              placeholder="Ex: Você é um professor de inglês paciente que corrige erros gramaticais e explica regras de forma simples."
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all h-32 resize-none"
            />
          </div>

          {/* Temperature Control */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-300">
                Nível de Criatividade
              </label>
              <div className="flex items-center gap-2">
                <span className="text-lg">{getTemperatureIcon(temperature)}</span>
                <span className="text-sm font-bold text-white">{temperature.toFixed(1)}</span>
                <span className="text-xs text-gray-400">{getTemperatureLabel(temperature)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-2 bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-pink-500/50 rounded-full cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <p className="text-xs text-gray-400">{getTemperatureDescription(temperature)}</p>
            </div>

            {/* Presets */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTemperature(0.3)}
                className={`flex-1 px-3 py-2 text-xs rounded-lg border transition-colors ${temperature === 0.3 ? 'bg-blue-500/20 border-blue-500 text-blue-300' : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'}`}
              >
                🎯 Preciso
              </button>
              <button
                type="button"
                onClick={() => setTemperature(0.7)}
                className={`flex-1 px-3 py-2 text-xs rounded-lg border transition-colors ${temperature === 0.7 ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'}`}
              >
                ⚖️ Balanceado
              </button>
              <button
                type="button"
                onClick={() => setTemperature(0.9)}
                className={`flex-1 px-3 py-2 text-xs rounded-lg border transition-colors ${temperature === 0.9 ? 'bg-pink-500/20 border-pink-500 text-pink-300' : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'}`}
              >
                🎨 Criativo
              </button>
            </div>

            {/* Ver exemplos */}
            <button
              type="button"
              onClick={() => setShowExamples(!showExamples)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-300 transition-colors"
            >
              {showExamples ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showExamples ? 'Ocultar exemplos' : 'Ver exemplos de uso'}
            </button>

            {showExamples && (
              <div className="bg-gray-900/50 rounded-lg p-3 text-xs text-gray-400 space-y-2 border border-gray-700">
                <div><strong className="text-blue-400">🎯 0.0-0.3:</strong> Código, cálculos, dados técnicos</div>
                <div><strong className="text-purple-400">⚖️ 0.4-0.7:</strong> Conversas gerais, explicações</div>
                <div><strong className="text-pink-400">🎨 0.8-1.0:</strong> Brainstorming, histórias, arte</div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !systemInstruction.trim()}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAssistantModal;
