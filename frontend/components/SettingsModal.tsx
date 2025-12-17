import React, { useState, useEffect, useRef } from 'react';
import { X, User, Bot, Image as ImageIcon, Save, Upload, Loader2, Activity } from 'lucide-react';
import { UserSettings } from '../types';
import { usageAPI, usuarioAPI, monitoramentoAPI } from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (newSettings: UserSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [formData, setFormData] = useState<UserSettings>(settings);
  const userFileInputRef = useRef<HTMLInputElement>(null);
  const aiFileInputRef = useRef<HTMLInputElement>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [usageSummary, setUsageSummary] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [apiStats, setApiStats] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(false);

  // Carregar dados do usuário e estatísticas quando modal abre
  useEffect(() => {
    if (!isOpen) return;
    
    // Carregar dados do usuário do banco
    setLoadingUser(true);
    usuarioAPI.buscar()
      .then((usuario) => {
        setFormData(prev => ({
          ...prev,
          userName: usuario.nome || prev.userName,
          userAvatarUrl: usuario.foto_base64 || prev.userAvatarUrl
        }));
      })
      .catch((err) => console.error('Erro ao carregar usuário:', err))
      .finally(() => setLoadingUser(false));
    
    // Carregar uso da API
    setUsageLoading(true);
    setUsageError(null);
    usageAPI.resumo()
      .then((data) => setUsageSummary(data))
      .catch((err) => setUsageError(err?.message || 'Erro ao buscar uso'))
      .finally(() => setUsageLoading(false));
    
    // Carregar estatísticas de monitoramento
    monitoramentoAPI.estatisticas('24h')
      .then((stats) => setApiStats(stats))
      .catch((err) => console.error('Erro ao carregar estatísticas:', err));
  }, [isOpen]);

  // Reset form when settings change
  useEffect(() => {
    if (isOpen) {
      setFormData(settings);
    }
  }, [settings]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Salvar no banco de dados
      await usuarioAPI.atualizar({
        nome: formData.userName,
        foto_base64: formData.userAvatarUrl
      });
      
      // Salvar localmente também
      onSave(formData);
      onClose();
    } catch (err) {
      console.error('Erro ao salvar usuário:', err);
      alert('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // Converter arquivo para base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUserImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('A imagem é muito grande. Use uma imagem de até 3MB para o avatar.');
        if (userFileInputRef.current) userFileInputRef.current.value = '';
        return;
      }
      const base64 = await fileToBase64(file);
      setFormData({ ...formData, userAvatarUrl: base64 });
    }
  };

  const handleAiImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('A imagem é muito grande. Use uma imagem de até 3MB para o avatar.');
        if (aiFileInputRef.current) aiFileInputRef.current.value = '';
        return;
      }
      const base64 = await fileToBase64(file);
      setFormData({ ...formData, aiAvatarUrl: base64 });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-400" />
            Configurações de Perfil
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* User Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Seu Nome
            </label>
            <input
              type="text"
              value={formData.userName}
              onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
              placeholder="Como você quer ser chamado?"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            />
          </div>

          <hr className="border-gray-700" />

          {/* User Avatar */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Sua Foto
            </label>
            <div className="flex gap-3 items-center">
              <div className="w-14 h-14 rounded-full bg-gray-700 overflow-hidden shrink-0 border-2 border-gray-600">
                 {formData.userAvatarUrl ? (
                   <img src={formData.userAvatarUrl} alt="User" className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-gray-400">
                     <User className="w-6 h-6" />
                   </div>
                 )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  ref={userFileInputRef}
                  onChange={handleUserImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => userFileInputRef.current?.click()}
                  className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-white text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Carregar do PC
                </button>
                {formData.userAvatarUrl && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, userAvatarUrl: '' })}
                    className="w-full px-3 py-1.5 text-red-400 hover:text-red-300 text-xs transition-colors"
                  >
                    Remover foto
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* AI Avatar */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <Bot className="w-4 h-4" /> Foto da IA
            </label>
            <div className="flex gap-3 items-center">
              <div className="w-14 h-14 rounded-full bg-gray-700 overflow-hidden shrink-0 border-2 border-gray-600">
                 {formData.aiAvatarUrl ? (
                   <img src={formData.aiAvatarUrl} alt="AI" className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-gray-400">
                     <Bot className="w-6 h-6" />
                   </div>
                 )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  ref={aiFileInputRef}
                  onChange={handleAiImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => aiFileInputRef.current?.click()}
                  className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-white text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Carregar do PC
                </button>
                {formData.aiAvatarUrl && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, aiAvatarUrl: '' })}
                    className="w-full px-3 py-1.5 text-red-400 hover:text-red-300 text-xs transition-colors"
                  >
                    Remover foto
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Aparecerá nas mensagens dos assistentes.</p>
          </div>

          <hr className="border-gray-700" />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Uso da API (mês atual)
            </label>
            <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-3">
              {usageLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Carregando...</span>
                </div>
              ) : usageError ? (
                <div className="text-sm text-red-400">{usageError}</div>
              ) : usageSummary ? (
                <div className="space-y-1">
                  <div className="text-sm text-gray-200">
                    Total estimado: <span className="font-semibold">{!usageSummary?.missing_pricing && typeof usageSummary?.custo?.brl_total === 'number' ? usageSummary.custo.brl_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Configure preços no backend (.env)'}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Tokens: {Number(usageSummary?.tokens?.total || 0).toLocaleString('pt-BR')} | Imagens: {Number(usageSummary?.imagens?.total || 0).toLocaleString('pt-BR')}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-400">Sem dados</div>
              )}
            </div>
          </div>

          {/* Monitoramento de API */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Monitoramento (últimas 24h)
            </label>
            <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-3">
              {apiStats ? (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-400">Chamadas:</span>
                    <span className="ml-2 text-gray-200 font-semibold">{apiStats.total_chamadas}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Sucesso:</span>
                    <span className="ml-2 text-emerald-400 font-semibold">{apiStats.taxa_sucesso}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Tokens:</span>
                    <span className="ml-2 text-gray-200 font-semibold">{(apiStats.tokens?.total || 0).toLocaleString('pt-BR')}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Tempo médio:</span>
                    <span className="ml-2 text-gray-200 font-semibold">{apiStats.tempo_medio_ms}ms</span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-400">Carregando...</div>
              )}
            </div>
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
              disabled={saving || loadingUser}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 disabled:cursor-not-allowed rounded-lg transition-colors shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Salvar Alterações
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;