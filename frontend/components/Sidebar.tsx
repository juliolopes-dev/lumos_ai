import React from 'react';
import { Plus, MessageSquare, Trash2, Settings, LogOut, Pencil } from 'lucide-react';
import { Assistant, UserSettings } from '../types';

interface SidebarProps {
  assistants: Assistant[];
  activeAssistantId: string | null;
  userSettings: UserSettings;
  onSelectAssistant: (id: string) => void;
  onOpenCreateModal: () => void;
  onOpenSettings: () => void;
  onDeleteAssistant: (id: string, e: React.MouseEvent) => void;
  onEditAssistant: (id: string, e: React.MouseEvent) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  assistants,
  activeAssistantId,
  userSettings,
  onSelectAssistant,
  onOpenCreateModal,
  onOpenSettings,
  onDeleteAssistant,
  onEditAssistant,
  isOpen,
  toggleSidebar,
  onLogout
}) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden animate-in fade-in"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Content */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-72 bg-gray-950 text-white transform transition-transform duration-300 ease-in-out will-change-transform motion-reduce:transition-none flex flex-col border-r border-gray-800
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}>
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <img src="/lumos-logo.svg" alt="Lumos IA" className="w-9 h-9" />
            <span>Lumos IA</span>
          </div>
        </div>

        <div className="p-3">
          <button
            onClick={onOpenCreateModal}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 transition-colors rounded-lg border border-white/10 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Novo Assistente
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="text-xs font-semibold text-gray-500 uppercase px-2 mb-2">
            Seus Assistentes
          </div>
          {assistants.map((assistant) => (
            <div
              key={assistant.id}
              className={`
                group flex items-center justify-between px-3 py-3 rounded-lg cursor-pointer transition-all
                ${activeAssistantId === assistant.id 
                  ? 'bg-gray-800 text-white' 
                  : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'}
              `}
              onClick={() => onSelectAssistant(String(assistant.id))}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare className={`w-4 h-4 shrink-0 ${activeAssistantId === assistant.id ? 'text-emerald-500' : 'text-gray-500'}`} />
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate text-sm font-medium">{assistant.name}</span>
                  <span className="truncate text-xs text-gray-600 group-hover:text-gray-500">
                    {assistant.messages.length} mensagens
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => onEditAssistant(String(assistant.id), e)}
                  className="md:opacity-0 md:group-hover:opacity-100 opacity-100 text-gray-500 hover:text-emerald-400 p-1 rounded transition-opacity"
                  title="Editar"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={(e) => onDeleteAssistant(String(assistant.id), e)}
                  className="md:opacity-0 md:group-hover:opacity-100 opacity-100 text-gray-500 hover:text-red-400 p-1 rounded transition-opacity"
                  title="Excluir"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-800 mt-auto space-y-2">
          <button 
            onClick={onOpenSettings}
            className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-800 transition-colors group"
          >
            <div className="w-8 h-8 rounded bg-emerald-600 flex items-center justify-center font-bold text-white text-xs overflow-hidden shrink-0">
              {userSettings.userAvatarUrl ? (
                <img 
                  src={userSettings.userAvatarUrl} 
                  alt={userSettings.userName} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                userSettings.userName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex flex-col items-start flex-1 overflow-hidden">
              <span className="text-sm font-medium truncate w-full text-left">{userSettings.userName}</span>
              <span className="text-xs text-gray-500 group-hover:text-emerald-500 transition-colors">Configurações</span>
            </div>
            <Settings className="w-4 h-4 text-gray-500 group-hover:text-white" />
          </button>
          
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-red-500/20 transition-colors group text-gray-400 hover:text-red-400"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Sair</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;