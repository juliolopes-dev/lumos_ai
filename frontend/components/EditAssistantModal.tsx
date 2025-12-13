import React, { useEffect, useState } from 'react';
import { X, Save, Pencil } from 'lucide-react';
import { Assistant } from '../types';

interface EditAssistantModalProps {
  isOpen: boolean;
  assistant: Assistant | null;
  onClose: () => void;
  onSave: (data: { name: string; systemInstruction: string }) => void;
}

const EditAssistantModal: React.FC<EditAssistantModalProps> = ({ isOpen, assistant, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [systemInstruction, setSystemInstruction] = useState('');

  useEffect(() => {
    if (isOpen && assistant) {
      setName(assistant.name || '');
      setSystemInstruction(assistant.systemInstruction || '');
    }
  }, [isOpen, assistant]);

  if (!isOpen || !assistant) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !systemInstruction.trim()) return;
    onSave({ name, systemInstruction });
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
