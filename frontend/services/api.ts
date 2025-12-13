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

  async criar(data: { titulo: string; contexto: string }): Promise<Assistant> {
    return requestJson<Assistant>(`${API_BASE_URL}/assistentes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async atualizar(id: string, data: { titulo: string; contexto: string }): Promise<Assistant> {
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
    anexos: Attachment[] = []
  ): Promise<{ resposta: string; anexos?: Attachment[] }> {
    return requestJson<{ resposta: string; anexos?: Attachment[] }>(`${API_BASE_URL}/chat/${assistenteId}/enviar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensagem, anexos })
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