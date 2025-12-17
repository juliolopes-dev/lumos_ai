import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import CreateAssistantModal from './components/CreateAssistantModal';
import EditAssistantModal from './components/EditAssistantModal';
import SettingsModal from './components/SettingsModal';
import LoginScreen from './components/LoginScreen';
import { Assistant, CreateAssistantData, Message, UserSettings, Attachment } from './types';
import { assistantesAPI, chatAPI } from './services/api';

// Simple UUID generator
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const INITIAL_SETTINGS: UserSettings = {
  userName: 'Usuário',
  userAvatarUrl: '',
  aiAvatarUrl: ''
};

const loadUserSettings = (): UserSettings => {
  try {
    const saved = localStorage.getItem('lumos_user_settings');
    if (!saved) return INITIAL_SETTINGS;
    const parsed = JSON.parse(saved);
    return {
      userName: typeof parsed?.userName === 'string' ? parsed.userName : INITIAL_SETTINGS.userName,
      userAvatarUrl: typeof parsed?.userAvatarUrl === 'string' ? parsed.userAvatarUrl : INITIAL_SETTINGS.userAvatarUrl,
      aiAvatarUrl: typeof parsed?.aiAvatarUrl === 'string' ? parsed.aiAvatarUrl : INITIAL_SETTINGS.aiAvatarUrl,
    };
  } catch {
    return INITIAL_SETTINGS;
  }
};

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('lumos_authenticated') === 'true';
  });

  // State
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [activeAssistantId, setActiveAssistantId] = useState<string | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings>(() => loadUserSettings());
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAssistants, setIsLoadingAssistants] = useState(true);
  const [editingAssistantId, setEditingAssistantId] = useState<string | null>(null);

  // Carregar assistentes do backend apenas se autenticado
  useEffect(() => {
    if (isAuthenticated) {
      loadAssistants();
    }
  }, [isAuthenticated]);

  // Carregar histórico quando mudar de assistente
  useEffect(() => {
    if (activeAssistantId) {
      loadHistory(activeAssistantId);
    }
  }, [activeAssistantId]);

  const loadAssistants = async () => {
    try {
      setIsLoadingAssistants(true);
      const data = await assistantesAPI.listar();
      
      // Converter formato do backend para formato do frontend
      const converted: Assistant[] = data.map((a: any) => ({
        id: String(a.id),
        name: a.titulo || a.name,
        systemInstruction: a.contexto || a.systemInstruction || '',
        model: 'claude-sonnet-4-5-20250929',
        temperature: Number(a.temperature) || 0.7,
        messages: [],
        createdAt: a.criado_em ? new Date(a.criado_em).getTime() : Date.now()
      }));
      
      setAssistants(converted);
      
      // Selecionar primeiro assistente se existir
      if (converted.length > 0 && !activeAssistantId) {
        setActiveAssistantId(converted[0].id as string);
      }
    } catch (error) {
      console.error('Erro ao carregar assistentes:', error);
    } finally {
      setIsLoadingAssistants(false);
    }
  };

  const handleEditAssistant = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAssistantId(id);
  };

  const editingAssistant = assistants.find(a => String(a.id) === editingAssistantId) || null;

  const handleUpdateAssistant = async (data: { name: string; systemInstruction: string; temperature?: number }) => {
    if (!editingAssistantId) return;
    try {
      await assistantesAPI.atualizar(editingAssistantId, {
        titulo: data.name,
        contexto: data.systemInstruction,
        temperature: data.temperature
      });

      setAssistants(prev => prev.map(a => {
        if (String(a.id) === editingAssistantId) {
          return { ...a, name: data.name, systemInstruction: data.systemInstruction, temperature: data.temperature ?? a.temperature };
        }
        return a;
      }));
    } catch (error) {
      console.error('Erro ao atualizar assistente:', error);
      alert('Erro ao atualizar assistente');
    }
  };

  const loadHistory = async (assistantId: string) => {
    try {
      const data = await chatAPI.historico(assistantId);
      
      // Converter mensagens do backend para formato do frontend
      const messages: Message[] = (data.mensagens || []).map((m: any) => ({
        id: String(m.id),
        role: m.papel === 'usuario' ? 'user' : 'model',
        content: m.conteudo,
        attachments: Array.isArray(m.anexos) ? m.anexos : [],
        timestamp: m.criado_em ? new Date(m.criado_em).getTime() : Date.now()
      }));
      
      // Atualizar mensagens do assistente ativo
      setAssistants(prev => prev.map(a => {
        if (String(a.id) === assistantId) {
          return { ...a, messages };
        }
        return a;
      }));
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  // Computed
  const activeAssistant = assistants.find(a => String(a.id) === activeAssistantId);

  // Handlers
  const handleCreateAssistant = async (data: CreateAssistantData) => {
    try {
      // Criar no backend
      const created = await assistantesAPI.criar({
        titulo: data.name,
        contexto: data.systemInstruction,
        temperature: data.temperature ?? 0.7
      });
      
      const newAssistant: Assistant = {
        id: String(created.id),
        name: data.name,
        systemInstruction: data.systemInstruction,
        model: 'claude-sonnet-4-5-20250929',
        temperature: data.temperature ?? 0.7,
        messages: [],
        createdAt: Date.now()
      };
      
      setAssistants(prev => [...prev, newAssistant]);
      setActiveAssistantId(String(newAssistant.id));
      setIsSidebarOpen(false);
    } catch (error) {
      console.error('Erro ao criar assistente:', error);
      alert('Erro ao criar assistente');
    }
  };

  const handleDeleteAssistant = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (confirm('Tem certeza que deseja excluir este assistente? Todo o histórico será perdido.')) {
      try {
        await assistantesAPI.excluir(id);
        setAssistants(prev => prev.filter(a => String(a.id) !== id));
        if (activeAssistantId === id) {
          const remaining = assistants.filter(a => String(a.id) !== id);
          setActiveAssistantId(remaining.length > 0 ? String(remaining[0].id) : null);
        }
      } catch (error) {
        console.error('Erro ao excluir assistente:', error);
        alert('Erro ao excluir assistente');
      }
    }
  };

  const handleUpdateSettings = (newSettings: UserSettings) => {
    setUserSettings(newSettings);
    // Salvar no localStorage
    try {
      localStorage.setItem('lumos_user_settings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Erro ao salvar configurações do usuário:', error);
      alert('Não foi possível salvar suas configurações. Tente usar imagens menores para avatar.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('lumos_authenticated');
    localStorage.removeItem('lumos_user_email');
    setIsAuthenticated(false);
    // Limpar estados para evitar problemas ao fazer login novamente
    setAssistants([]);
    setActiveAssistantId(null);
  };

  const handleModelChange = (modelId: string) => {
    setAssistants(prev => prev.map(a => {
      if (a.id === activeAssistantId) {
        return { ...a, model: modelId };
      }
      return a;
    }));
  };

  const handleSendMessage = async (text: string, attachments: Attachment[], temperature: number) => {
    if (!activeAssistant || !activeAssistantId) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: text,
      attachments: attachments,
      temperature: temperature,
      timestamp: Date.now()
    };

    // 1. Add User Message to UI
    setAssistants(prev => prev.map(a => {
      if (String(a.id) === activeAssistantId) {
        return { ...a, messages: [...a.messages, userMessage] };
      }
      return a;
    }));

    setIsLoading(true);

    try {
      // 2. Send to backend API
      const result = await chatAPI.enviar(activeAssistantId, text, attachments, temperature);
      
      // 3. Add response message
      const responseMessage: Message = {
        id: generateId(),
        role: 'model',
        content: result.resposta,
        attachments: result.anexos || [],
        timestamp: Date.now()
      };

      setAssistants(prev => prev.map(a => {
        if (String(a.id) === activeAssistantId) {
          return { ...a, messages: [...a.messages, responseMessage] };
        }
        return a;
      }));

    } catch (error) {
      console.error("Failed to generate response", error);
      const errorMsg: Message = {
        id: generateId(),
        role: 'model',
        content: "Desculpe, ocorreu um erro ao processar sua solicitação. Verifique sua conexão.",
        timestamp: Date.now()
      };
      setAssistants(prev => prev.map(a => {
        if (String(a.id) === activeAssistantId) {
           return { ...a, messages: [...a.messages, errorMsg] };
        }
        return a;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Mostrar tela de login se não autenticado
  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex h-screen bg-gray-800 overflow-hidden">
      <Sidebar
        assistants={assistants}
        activeAssistantId={activeAssistantId}
        userSettings={userSettings}
        onSelectAssistant={(id) => {
          setActiveAssistantId(id);
          setIsSidebarOpen(false);
        }}
        onOpenCreateModal={() => setIsModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onDeleteAssistant={handleDeleteAssistant}
        onEditAssistant={handleEditAssistant}
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col h-full w-full relative">
        <ChatArea
          assistant={activeAssistant}
          userSettings={userSettings}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onModelChange={handleModelChange}
        />
      </div>

      <CreateAssistantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateAssistant}
      />

      <EditAssistantModal
        isOpen={!!editingAssistantId}
        assistant={editingAssistant}
        onClose={() => setEditingAssistantId(null)}
        onSave={handleUpdateAssistant}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={userSettings}
        onSave={handleUpdateSettings}
      />
    </div>
  );
};

export default App;