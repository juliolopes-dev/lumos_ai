import { Message, Assistant, Attachment } from "../types";

// @ts-ignore - Vite env
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

const safeReadText = async (response: Response): Promise<string> => {
  try {
    return await response.text();
  } catch {
    return '';
  }
};

const requestJson = async <T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, init);
  if (!response.ok) {
    const body = await safeReadText(response);
    const msg = `HTTP ${response.status} ${response.statusText} - ${String(input)}${body ? `\n${body}` : ''}`;
    throw new Error(msg);
  }
  return response.json();
};

export const usageAPI = {
  async resumo(): Promise<any> {
    return requestJson<any>(`${API_BASE_URL}/usage/resumo`);
  }
};

// Log útil para debug (confirma qual URL o frontend está usando)
// eslint-disable-next-line no-console
console.log('[api] API_BASE_URL =', API_BASE_URL);

// API para Assistentes
const _assistantsApiImpl = {
  async listar(): Promise<Assistant[]> {
    return requestJson<Assistant[]>(`${API_BASE_URL}/assistentes`);
  },

  async buscar(id: string): Promise<Assistant> {
    return requestJson<Assistant>(`${API_BASE_URL}/assistentes/${id}`);
  },

  async criar(data: { titulo: string; contexto: string; temperature?: number }): Promise<Assistant> {
    return requestJson<Assistant>(`${API_BASE_URL}/assistentes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async atualizar(id: string, data: { titulo: string; contexto: string; temperature?: number }): Promise<Assistant> {
    return requestJson<Assistant>(`${API_BASE_URL}/assistentes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async excluir(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/assistentes/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      const body = await safeReadText(response);
      throw new Error(`HTTP ${response.status} ${response.statusText} - DELETE ${API_BASE_URL}/assistentes/${id}${body ? `\n${body}` : ''}`);
    }
  }
 };

 // Exporta com os dois nomes (há código usando grafias diferentes)
 export const assistantesAPI = _assistantsApiImpl;
 export const assistentesAPI = _assistantsApiImpl;

 // API para Chat
 export const chatAPI = {
  async enviar(
    assistenteId: string,
    mensagem: string,
    anexos: Attachment[] = [],
    temperature?: number
  ): Promise<{ resposta: string; anexos?: Attachment[] }> {
    return requestJson<{ resposta: string; anexos?: Attachment[] }>(`${API_BASE_URL}/chat/${assistenteId}/enviar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensagem, anexos, temperature })
    });
  },

  async historico(assistenteId: string): Promise<{ mensagens: Array<Message & { anexos?: Attachment[] }> }> {
    return requestJson<{ mensagens: Array<Message & { anexos?: Attachment[] }> }>(`${API_BASE_URL}/chat/${assistenteId}/historico`);
  },

  async limpar(assistenteId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/chat/${assistenteId}/limpar`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      const body = await safeReadText(response);
      throw new Error(`HTTP ${response.status} ${response.statusText} - DELETE ${API_BASE_URL}/chat/${assistenteId}/limpar${body ? `\n${body}` : ''}`);
    }
  }
};

// Função para enviar mensagem e receber resposta (compatível com interface atual)
export const sendChatMessage = async (
  assistantId: string,
  message: string,
  onChunk: (text: string) => void
): Promise<string> => {
  try {
    const result = await chatAPI.enviar(assistantId, message);
    // Simula streaming enviando a resposta completa de uma vez
    onChunk(result.resposta);
    return result.resposta;
  } catch (error) {
    console.error("Error calling API:", error);
    throw error;
  }
};

// Transcrição de áudio (placeholder - pode ser implementado no backend)
export const transcribeAudio = async (
  audioData: string,
  mimeType: string
): Promise<string> => {
  // Por enquanto, retorna mensagem informando que transcrição não está disponível
  // Pode ser implementado no backend futuramente
  console.warn("Transcrição de áudio não implementada no backend");
  return "";
};

// API para Usuário
export interface Usuario {
  id: number;
  nome: string;
  email: string;
  foto_url?: string;
  foto_base64?: string;
  configuracoes?: Record<string, any>;
  criado_em?: string;
  atualizado_em?: string;
}

export const usuarioAPI = {
  async buscar(): Promise<Usuario> {
    return requestJson<Usuario>(`${API_BASE_URL}/usuario`);
  },

  async atualizar(data: Partial<Usuario>): Promise<{ mensagem: string; usuario: Usuario }> {
    return requestJson<{ mensagem: string; usuario: Usuario }>(`${API_BASE_URL}/usuario`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async atualizarFoto(foto_base64: string): Promise<{ mensagem: string; foto_base64: string }> {
    return requestJson<{ mensagem: string; foto_base64: string }>(`${API_BASE_URL}/usuario/foto`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ foto_base64 })
    });
  },

  async atualizarConfiguracoes(configuracoes: Record<string, any>): Promise<{ mensagem: string; configuracoes: Record<string, any> }> {
    return requestJson<{ mensagem: string; configuracoes: Record<string, any> }>(`${API_BASE_URL}/usuario/configuracoes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ configuracoes })
    });
  }
};

// API para Monitoramento
export interface EstatisticasAPI {
  periodo: string;
  total_chamadas: number;
  sucesso: number;
  erros: number;
  taxa_sucesso: string;
  tokens: {
    input: number;
    output: number;
    total: number;
    cache_read: number;
    cache_creation: number;
  };
  tempo_medio_ms: number;
  primeira_chamada?: string;
  ultima_chamada?: string;
}

export const monitoramentoAPI = {
  async estatisticas(periodo: string = '24h'): Promise<EstatisticasAPI> {
    return requestJson<EstatisticasAPI>(`${API_BASE_URL}/monitoramento/estatisticas?periodo=${periodo}`);
  },

  async porHora(horas: number = 24): Promise<{ periodo_horas: number; dados: Array<{ hora: string; chamadas: number; tokens: number }> }> {
    return requestJson<any>(`${API_BASE_URL}/monitoramento/por-hora?horas=${horas}`);
  },

  async ultimas(limite: number = 50): Promise<{ total: number; chamadas: any[] }> {
    return requestJson<any>(`${API_BASE_URL}/monitoramento/ultimas?limite=${limite}`);
  }
};