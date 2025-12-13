import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Menu, Bot, User, Loader2, Paperclip, Mic, X, ChevronDown, StopCircle, Download } from 'lucide-react';
import { Assistant, Message, UserSettings, Attachment } from '../types';

interface ChatAreaProps {
  assistant: Assistant | undefined;
  userSettings: UserSettings;
  isLoading: boolean;
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  onToggleSidebar: () => void;
  onModelChange: (modelId: string) => void;
}

const AVAILABLE_MODELS = [
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini (Padrão)' },
  { id: 'gpt-4', name: 'GPT-4 (Avançado)' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo (Rápido)' },
];

const ChatArea: React.FC<ChatAreaProps> = ({ 
  assistant, 
  userSettings,
  isLoading, 
  onSendMessage,
  onToggleSidebar,
  onModelChange
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Audio Visualization Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const requestAnimationRef = useRef<number | null>(null);
  const visualizerContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [assistant?.messages, isLoading, attachments, isRecording, isTranscribing]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isLoading || isTranscribing) return;
    
    onSendMessage(input, attachments);
    setInput('');
    setAttachments([]);
    
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  // --- File Handling ---
  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const addFileAsAttachment = (file: File) => {
    if (file.type.startsWith('image/') && file.size > 4 * 1024 * 1024) {
      alert('A imagem é muito grande. Envie uma imagem de até 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      const base64Data = base64String.split(',')[1];

      const newAttachment: Attachment = {
        type: file.type.startsWith('image/') ? 'image' : 'file',
        mimeType: file.type,
        data: base64Data,
        fileName: file.name
      };

      setAttachments(prev => [...prev, newAttachment]);
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    addFileAsAttachment(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardFiles = Array.from(e.clipboardData?.files || []);
    const fileList = clipboardFiles.length > 0
      ? clipboardFiles
      : Array.from(e.clipboardData?.items || [])
          .filter((item) => item.kind === 'file')
          .map((item) => item.getAsFile())
          .filter(Boolean) as File[];

    const images = fileList.filter((f) => f.type.startsWith('image/'));
    if (images.length === 0) return;

    e.preventDefault();
    for (const img of images) {
      addFileAsAttachment(img);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer?.files || []);
    const images = droppedFiles.filter((f) => f.type.startsWith('image/'));
    if (images.length === 0) return;

    for (const img of images) {
      addFileAsAttachment(img);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // --- Audio Recording & Visualization ---
  const handleMicClick = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startVisualization = (stream: MediaStream) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64; // Small size for fewer bars, faster performance
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVisualizer = () => {
        if (!isRecording && audioCtx.state === 'closed') return;

        analyser.getByteFrequencyData(dataArray);

        if (visualizerContainerRef.current) {
          const bars = visualizerContainerRef.current.children;
          const indices = [1, 3, 5, 7, 9]; 
          
          for (let i = 0; i < Math.min(bars.length, indices.length); i++) {
            const value = dataArray[indices[i]];
            const heightPercentage = Math.max(15, (value / 255) * 100); // Min height 15%
            
            const bar = bars[i] as HTMLElement;
            bar.style.height = `${heightPercentage}%`;
          }
        }
        
        requestAnimationRef.current = requestAnimationFrame(updateVisualizer);
      };

      updateVisualizer();
    } catch (error) {
      console.error("Error starting visualization:", error);
    }
  };

  const stopVisualization = () => {
    if (requestAnimationRef.current) {
      cancelAnimationFrame(requestAnimationRef.current);
    }
    
    if (sourceRef.current) {
      sourceRef.current.disconnect();
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Start Recording
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64String = reader.result as string;
          const base64Data = base64String.split(',')[1];
          
          setIsTranscribing(true);
          try {
            // Transcrição não disponível no backend atual
            // Adiciona o áudio como anexo em vez de transcrever
            console.warn("Transcrição de áudio não implementada");
            alert("Transcrição de áudio não disponível. O áudio será enviado como anexo.");
            
            const audioAttachment: Attachment = {
              type: 'audio',
              mimeType: 'audio/webm',
              data: base64Data,
              fileName: 'audio_recording.webm'
            };
            setAttachments(prev => [...prev, audioAttachment]);
          } catch (error) {
            console.error("Audio processing failed", error);
            alert("Não foi possível processar o áudio.");
          } finally {
            setIsTranscribing(false);
          }
        };
        reader.readAsDataURL(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Stop Visualization
        stopVisualization();
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Start Visualization
      startVisualization(stream);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Não foi possível acessar o microfone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const DEFAULT_AI_AVATAR = '/lumos-logo.svg';

  const renderAvatar = (role: 'user' | 'model') => {
    if (role === 'model') {
      if (userSettings.aiAvatarUrl) {
        return (
          <img 
            src={userSettings.aiAvatarUrl} 
            alt="AI" 
            className="w-full h-full object-cover rounded-sm"
          />
        );
      }
      return (
        <img
          src={DEFAULT_AI_AVATAR}
          alt="AI"
          className="w-full h-full object-contain rounded-sm scale-125"
        />
      );
    } else {
      if (userSettings.userAvatarUrl) {
        return (
          <img 
            src={userSettings.userAvatarUrl} 
            alt="User" 
            className="w-full h-full object-cover rounded-sm"
          />
        );
      }
      return <User className="w-5 h-5 text-white" />;
    }
  };

  if (!assistant) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-800 text-gray-400">
        <p>Selecione ou crie um assistente para começar.</p>
      </div>
    );
  }

  const currentModelName = AVAILABLE_MODELS.find(m => m.id === assistant.model)?.name || assistant.model;

  // Filter out empty messages that might be present during streaming initialization
  // but let them show if they have content (streaming started).
  // The 'isLoading' state handles the "thinking" visual.
  const visibleMessages = assistant.messages.filter(msg => {
    // If it's a model message, empty, and we are loading, hide it (show the loading block instead)
    if (isLoading && msg.role === 'model' && !msg.content) return false;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-800 relative">
      {/* Header - Always visible now */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700 z-10 sticky top-0">
        <div className="flex items-center gap-2">
          <button 
            onClick={onToggleSidebar}
            className="p-2 -ml-2 text-gray-300 hover:text-white md:hidden"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          {/* Model Selector Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className="flex items-center gap-2 text-gray-200 font-semibold hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              <span>{currentModelName}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            
            {isModelDropdownOpen && (
               <>
                 <div 
                   className="fixed inset-0 z-10" 
                   onClick={() => setIsModelDropdownOpen(false)}
                 />
                 <div className="absolute top-full left-0 mt-1 w-64 bg-gray-700 border border-gray-600 rounded-lg shadow-xl z-20 overflow-hidden">
                   {AVAILABLE_MODELS.map((model) => (
                     <button
                       key={model.id}
                       onClick={() => {
                         onModelChange(model.id);
                         setIsModelDropdownOpen(false);
                       }}
                       className={`w-full text-left px-4 py-3 hover:bg-gray-600 transition-colors flex items-center gap-2
                         ${assistant.model === model.id ? 'text-emerald-400 bg-gray-600/50' : 'text-gray-200'}
                       `}
                     >
                        <Bot className="w-4 h-4" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{model.name}</span>
                        </div>
                     </button>
                   ))}
                 </div>
               </>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {visibleMessages.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-6 overflow-hidden">
               {userSettings.aiAvatarUrl ? (
                 <img src={userSettings.aiAvatarUrl} alt="AI" className="w-full h-full object-cover" />
               ) : (
                 <img src={DEFAULT_AI_AVATAR} alt="AI" className="w-full h-full object-contain scale-125" />
               )}
            </div>
            <h2 className="text-2xl font-bold text-gray-100 mb-2">{assistant.name}</h2>
            <p className="text-gray-400 max-w-md">
              <span className="italic text-gray-500 mt-2 block text-sm border border-gray-700 p-2 rounded">
                "{assistant.systemInstruction}"
              </span>
            </p>
          </div>
        ) : (
          <div className="flex flex-col pb-4">
            {visibleMessages.map((msg) => (
              <div 
                key={msg.id}
                className={`
                  w-full
                  ${msg.role === 'model' ? 'bg-gray-750' : 'bg-transparent'}
                `}
              >
                <div className="max-w-3xl mx-auto px-4 py-8 flex gap-4 md:gap-6">
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden
                    ${msg.role === 'model' ? (userSettings.aiAvatarUrl ? 'bg-transparent' : 'bg-emerald-500/20') : (userSettings.userAvatarUrl ? 'bg-transparent' : 'bg-gray-500')}
                  `}>
                    {renderAvatar(msg.role)}
                  </div>
                  <div className="relative flex-1 overflow-hidden">
                    <div className="text-gray-300 font-medium mb-1">
                      {msg.role === 'model' ? assistant.name : userSettings.userName}
                    </div>
                    
                    {/* Attachments Display */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {msg.attachments.map((att, idx) => (
                          <div 
                            key={idx} 
                            className={
                              att.type === 'audio' 
                                ? '' 
                                : 'rounded-lg overflow-hidden border border-gray-600 bg-gray-800'
                            }
                          >
                             {att.type === 'image' ? (
                               <div className="relative">
                                 <img src={`data:${att.mimeType};base64,${att.data}`} alt="attachment" className="max-w-xs max-h-60 object-contain" />
                                 <a
                                   href={`data:${att.mimeType};base64,${att.data}`}
                                   download={(att.fileName || `imagem-${String(msg.id)}-${idx}.png`).replace(/\s+/g, '_')}
                                   className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/60 text-white text-xs border border-white/10 hover:bg-black/80 transition-colors flex items-center gap-1"
                                   title="Baixar imagem"
                                 >
                                   <Download className="w-3.5 h-3.5" />
                                   <span>Baixar</span>
                                 </a>
                               </div>
                             ) : att.type === 'audio' ? (
                               <audio controls src={`data:${att.mimeType};base64,${att.data}`} className="w-64" />
                             ) : (
                               <div className="p-3 flex items-center gap-2 text-sm text-gray-300">
                                 <Paperclip className="w-4 h-4" />
                                 <span>{att.fileName || 'Arquivo'}</span>
                               </div>
                             )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="markdown-body text-gray-100 text-[15px] leading-7">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="w-full bg-gray-750 border-t border-white/5 animate-in fade-in duration-300">
                <div className="max-w-3xl mx-auto px-4 py-8 flex gap-4 md:gap-6">
                   <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden relative
                      ${userSettings.aiAvatarUrl ? 'bg-transparent' : 'bg-emerald-500/20'}
                   `}>
                      {/* Pulsing ring effect behind avatar */}
                      <div className="absolute inset-0 bg-emerald-400/50 rounded-sm animate-ping opacity-75"></div>
                      <div className="relative z-10 w-full h-full">
                        {renderAvatar('model')}
                      </div>
                   </div>
                   <div className="flex flex-col justify-center h-8">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full typing-dot" />
                        <div className="w-2 h-2 bg-emerald-400 rounded-full typing-dot" />
                        <div className="w-2 h-2 bg-emerald-400 rounded-full typing-dot" />
                        <span className="text-xs font-medium text-emerald-500/80 ml-2 animate-pulse">Pensando...</span>
                      </div>
                   </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="w-full bg-gray-800 border-t border-gray-700 p-4">
        <div className="max-w-3xl mx-auto">
          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
              {attachments.map((att, idx) => (
                <div key={idx} className="relative group shrink-0">
                  <div className="rounded-lg border border-gray-600 bg-gray-700 overflow-hidden w-20 h-20 flex items-center justify-center">
                    {att.type === 'image' ? (
                      <img src={`data:${att.mimeType};base64,${att.data}`} className="w-full h-full object-cover" />
                    ) : att.type === 'audio' ? (
                      <Mic className="w-8 h-8 text-emerald-400" />
                    ) : (
                      <Paperclip className="w-8 h-8 text-gray-400" />
                    )}
                  </div>

                  {att.type === 'image' && (
                    <a
                      href={`data:${att.mimeType};base64,${att.data}`}
                      download={(att.fileName || `imagem-anexo-${idx}.png`).replace(/\s+/g, '_')}
                      className="absolute bottom-1 left-1 bg-black/60 rounded-md px-1.5 py-1 text-gray-100 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Baixar imagem"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <button 
                    onClick={() => removeAttachment(idx)}
                    className="absolute -top-1 -right-1 bg-gray-900 rounded-full p-0.5 text-gray-400 hover:text-white border border-gray-600 shadow-sm"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="relative flex items-end w-full p-3 bg-gray-700/50 border border-gray-600 rounded-xl shadow-sm focus-within:ring-1 focus-within:ring-gray-400 focus-within:border-gray-500">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange}
              accept="image/*" // For now focusing on images as per Gemini best support, but can be any
            />
            
            <button
              onClick={handleFileClick}
              className="p-2 text-gray-400 hover:text-white transition-colors mr-1"
              title="Anexar arquivo"
              disabled={isLoading || isRecording || isTranscribing}
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {isRecording ? (
              <div className="flex-1 flex items-center justify-center h-[24px] gap-1 mx-2" ref={visualizerContainerRef}>
                {/* Visualizer Bars */}
                <div className="w-1 bg-emerald-500 rounded-full transition-all duration-75 min-h-[4px]" style={{ height: '15%' }}></div>
                <div className="w-1 bg-emerald-500 rounded-full transition-all duration-75 min-h-[4px]" style={{ height: '15%' }}></div>
                <div className="w-1 bg-emerald-500 rounded-full transition-all duration-75 min-h-[4px]" style={{ height: '15%' }}></div>
                <div className="w-1 bg-emerald-500 rounded-full transition-all duration-75 min-h-[4px]" style={{ height: '15%' }}></div>
                <div className="w-1 bg-emerald-500 rounded-full transition-all duration-75 min-h-[4px]" style={{ height: '15%' }}></div>
              </div>
            ) : isTranscribing ? (
               <div className="flex-1 flex items-center gap-2 mx-2 h-[24px] text-gray-400 italic text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Transcrevendo áudio...</span>
               </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                }}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                placeholder={`Enviar mensagem para ${assistant.name}...`}
                rows={1}
                className="w-full max-h-[200px] bg-transparent text-gray-100 placeholder-gray-400 focus:outline-none resize-none py-1 mx-2"
                style={{ minHeight: '24px' }}
                disabled={isRecording}
              />
            )}

            {input.trim() || attachments.length > 0 ? (
               <button
                onClick={() => handleSubmit()}
                disabled={isLoading || isRecording || isTranscribing}
                className={`
                  p-2 rounded-lg transition-all duration-200
                  ${!isLoading && !isRecording && !isTranscribing
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md' 
                    : 'bg-transparent text-gray-500 cursor-not-allowed'}
                `}
              >
                <Send className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleMicClick}
                disabled={isLoading || isTranscribing}
                className={`
                   p-2 rounded-lg transition-all duration-200
                   ${isRecording 
                     ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' 
                     : 'text-gray-400 hover:text-white hover:bg-gray-600/50'}
                `}
                title={isRecording ? "Parar gravação" : "Gravar áudio"}
              >
                {isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}
            
          </div>
          <div className="text-center mt-2">
            <span className="text-xs text-gray-500">
              O assistente pode apresentar informações imprecisas. Verifique informações importantes.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;