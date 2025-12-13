export interface Attachment {
  type: 'image' | 'audio' | 'file';
  mimeType: string;
  data: string; // Base64 string
  fileName?: string;
}

export interface Message {
  id: string | number;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  // Campos do backend
  papel?: 'usuario' | 'assistente';
  conteudo?: string;
}

export interface Assistant {
  id: string | number;
  name: string;
  systemInstruction: string;
  model: string;
  messages: Message[];
  createdAt: number;
  // Campos do backend
  titulo?: string;
  contexto?: string;
}

export type CreateAssistantData = {
  name: string;
  systemInstruction: string;
};

export interface UserSettings {
  userName: string;
  userAvatarUrl: string;
  aiAvatarUrl: string;
}

// Tipos do backend
export interface BackendAssistant {
  id: number;
  titulo: string;
  contexto: string;
  criado_em?: string;
}

export interface BackendMessage {
  id: number;
  papel: 'usuario' | 'assistente';
  conteudo: string;
  criado_em?: string;
}