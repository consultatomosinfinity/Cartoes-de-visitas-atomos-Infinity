import React, { useState, useEffect } from 'react';
import {
  Folder,
  FolderPlus,
  Plus,
  Trash2,
  Check,
  X,
  Search,
  Image as ImageIcon,
  Sparkles,
  Upload,
  Link as LinkIcon,
  Layers,
  Settings,
  AlertCircle
} from 'lucide-react';
import { WallpaperFolder, WallpaperItem } from '../types';

interface WallpapersLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWallpaper: (url: string) => void;
  currentWallpaperUrl?: string;
  isMaster?: boolean;
  targetFieldMode?: 'wallpaper' | 'foto' | 'logo' | 'mobileIcon';
  targetFieldName?: string;
  initialFolderId?: string;
}

export const WallpapersLibraryModal: React.FC<WallpapersLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectWallpaper,
  currentWallpaperUrl = '',
  isMaster = false,
  targetFieldMode = 'wallpaper',
  targetFieldName,
  initialFolderId,
}) => {
  const [folders, setFolders] = useState<WallpaperFolder[]>([]);
  const [items, setItems] = useState<WallpaperItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>(initialFolderId || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewItem, setPreviewItem] = useState<WallpaperItem | null>(null);

  // Estados para o modo de administração Master
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [addMode, setAddMode] = useState<'upload' | 'url'>('upload');
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newFolderTarget, setNewFolderTarget] = useState('');
  
  // Fila de fotos pendentes para envio individual ou múltiplo
  interface PendingPhoto {
    id: string;
    title: string;
    file?: File;
    fileName: string;
    base64Data: string;
    sizeFormatted: string;
  }
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal de confirmação para deletar pasta ou item (sem travar em iframes)
  const [folderToDelete, setFolderToDelete] = useState<{ id: string; name: string } | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadWallpapers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/wallpapers');
      if (res.ok) {
        const data = await res.json();
        setFolders(data.folders || []);
        setItems(data.items || []);
      }
    } catch (err) {
      console.warn('Erro ao carregar wallpapers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (initialFolderId) {
        setSelectedFolderId(initialFolderId);
      }
      loadWallpapers();
    }
  }, [isOpen, initialFolderId]);

  // Título e descrição dinâmica conforme o campo de destino
  const getModalTitle = () => {
    if (targetFieldName) return targetFieldName;
    switch (targetFieldMode) {
      case 'foto':
        return 'Galeria: Foto do Colaborador';
      case 'logo':
        return 'Galeria: Logo da Empresa & Marca';
      case 'mobileIcon':
        return 'Galeria: Ícones PWA & Favicon da Aba';
      case 'wallpaper':
      default:
        return 'Biblioteca de Imagens & Fundos do Sistema';
    }
  };

  const getModalSubtitle = () => {
    switch (targetFieldMode) {
      case 'foto':
        return 'Escolha uma foto ou avatar padrão para o perfil profissional do cartão.';
      case 'logo':
        return 'Escolha um logotipo oficial ou padrão para aplicar no topo do cartão e centro do QR Code.';
      case 'mobileIcon':
        return 'Escolha um ícone otimizado para o aplicativo no celular e favicon da aba do navegador.';
      case 'wallpaper':
      default:
        return 'Selecione uma imagem ou papel de parede para aplicar no fundo do seu cartão digital.';
    }
  };

  const getSelectButtonLabel = () => {
    switch (targetFieldMode) {
      case 'foto':
        return 'Usar como Foto de Perfil';
      case 'logo':
        return 'Usar como Logo da Empresa';
      case 'mobileIcon':
        return 'Usar como Ícone & Favicon';
      case 'wallpaper':
      default:
        return 'Aplicar no Fundo do Cartão';
    }
  };

  if (!isOpen) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const optimizeImageFile = async (file: File): Promise<{ base64Data: string; sizeFormatted: string }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawBase64 = event.target?.result as string;
        // Se o arquivo for SVG ou pequeno (< 800KB), mantém original
        if (file.type === 'image/svg+xml' || file.size < 800 * 1024) {
          resolve({
            base64Data: rawBase64,
            sizeFormatted: formatFileSize(file.size),
          });
          return;
        }

        const img = new Image();
        img.onload = () => {
          const maxDimension = 2048;
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({
              base64Data: rawBase64,
              sizeFormatted: formatFileSize(file.size),
            });
            return;
          }

          // Se for PNG transparente mantém PNG, se não usa JPEG de alta fidelidade
          const isPng = file.type === 'image/png';
          ctx.drawImage(img, 0, 0, width, height);
          const mimeType = isPng ? 'image/png' : 'image/jpeg';
          const quality = isPng ? 0.9 : 0.88;
          const compressedDataUrl = canvas.toDataURL(mimeType, quality);
          
          // Calcular tamanho aproximado do base64
          const approxBytes = Math.round((compressedDataUrl.length * 3) / 4);
          resolve({
            base64Data: compressedDataUrl,
            sizeFormatted: formatFileSize(approxBytes),
          });
        };
        img.onerror = () => {
          resolve({
            base64Data: rawBase64,
            sizeFormatted: formatFileSize(file.size),
          });
        };
        img.src = rawBase64;
      };
      reader.onerror = () => {
        resolve({
          base64Data: '',
          sizeFormatted: '0 B',
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFilesSelected = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    const validFiles = fileArray.filter((f) => {
      if (f.size > 25 * 1024 * 1024) {
        showToast('error', `A imagem "${f.name}" tem mais de 25MB e foi ignorada.`);
        return false;
      }
      return true;
    });

    for (let index = 0; index < validFiles.length; index++) {
      const file = validFiles[index];
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const title = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      
      const { base64Data, sizeFormatted } = await optimizeImageFile(file);
      if (base64Data) {
        const newPhoto: PendingPhoto = {
          id: `pending-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
          title,
          file,
          fileName: file.name,
          base64Data,
          sizeFormatted,
        };
        setPendingPhotos((prev) => [...prev, newPhoto]);
      }
    }
  };

  const handleRemovePendingPhoto = (id: string) => {
    setPendingPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdatePendingTitle = (id: string, newTitle: string) => {
    setPendingPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, title: newTitle } : p)));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelected(e.target.files);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();

    const targetFolder = newFolderTarget || folders[0]?.id || 'corporativo';

    if (addMode === 'upload') {
      if (pendingPhotos.length === 0) {
        showToast('error', 'Selecione pelo menos uma foto para enviar.');
        return;
      }

      setSubmitting(true);
      try {
        const batchPayload = {
          folderId: targetFolder,
          items: pendingPhotos.map((p) => ({
            title: p.title.trim() || p.fileName,
            base64Data: p.base64Data,
            fileName: p.fileName,
            folderId: targetFolder,
          })),
        };

        const res = await fetch('/api/wallpapers/items/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(batchPayload),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || 'Erro ao enviar fotos.');
        }

        const data = await res.json();
        setItems(data.items || []);
        showToast('success', `${pendingPhotos.length} foto(s) adicionada(s) à biblioteca com sucesso!`);
        setShowAddModal(false);
        setPendingPhotos([]);
        if (selectedFolderId !== 'all' && selectedFolderId !== targetFolder) {
          setSelectedFolderId(targetFolder);
        }
      } catch (err: any) {
        showToast('error', err.message || 'Erro ao salvar fotos.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Modo URL (Link único ou múltiplos links por linha)
    if (addMode === 'url') {
      const urlLines = newUrl
        .split(/[\n,]+/)
        .map((u) => u.trim())
        .filter((u) => u.length > 5 && (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('/')));

      if (urlLines.length === 0) {
        showToast('error', 'Informe um link válido de imagem (ou vários, um por linha).');
        return;
      }

      setSubmitting(true);
      try {
        const batchPayload = {
          folderId: targetFolder,
          items: urlLines.map((url, idx) => ({
            title: urlLines.length === 1 && newTitle.trim() ? newTitle.trim() : `Fundo Web ${Date.now()}-${idx + 1}`,
            url,
            folderId: targetFolder,
          })),
        };

        const res = await fetch('/api/wallpapers/items/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(batchPayload),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || 'Erro ao adicionar fotos.');
        }

        const data = await res.json();
        setItems(data.items || []);
        showToast('success', `${urlLines.length} foto(s) adicionada(s) à biblioteca com sucesso!`);
        setShowAddModal(false);
        setNewUrl('');
        setNewTitle('');
        if (selectedFolderId !== 'all' && selectedFolderId !== targetFolder) {
          setSelectedFolderId(targetFolder);
        }
      } catch (err: any) {
        showToast('error', err.message || 'Erro ao salvar links.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) {
      showToast('error', 'Digite o nome da pasta.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/wallpapers/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName.trim(),
          description: newFolderDesc.trim(),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Erro ao criar pasta.');
      }

      const data = await res.json();
      setFolders(data.folders || []);
      showToast('success', `Pasta "${newFolderName}" criada com sucesso!`);
      setShowFolderModal(false);
      setNewFolderName('');
      setNewFolderDesc('');
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao criar pasta.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (e?: React.MouseEvent, itemId?: string, itemTitle?: string) => {
    if (e) e.stopPropagation();
    const targetId = itemId || itemToDelete?.id;
    const targetTitle = itemTitle || itemToDelete?.title || 'Fundo';
    if (!targetId) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/wallpapers/items/${targetId}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        showToast('success', `Fundo "${targetTitle}" removido da biblioteca.`);
        setItemToDelete(null);
      } else {
        const errJson = await res.json().catch(() => ({}));
        showToast('error', errJson.error || 'Falha ao excluir fundo.');
      }
    } catch (err) {
      showToast('error', 'Falha ao excluir fundo.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteFolder = async (e?: React.MouseEvent, folderId?: string, folderName?: string) => {
    if (e) e.stopPropagation();
    const targetId = folderId || folderToDelete?.id;
    const targetName = folderName || folderToDelete?.name || 'Pasta';
    if (!targetId) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/wallpapers/folders/${targetId}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        setFolders(data.folders || []);
        await loadWallpapers();
        if (selectedFolderId === targetId) {
          setSelectedFolderId('all');
        }
        showToast('success', `Pasta "${targetName}" excluída com sucesso!`);
        setFolderToDelete(null);
      } else {
        const errJson = await res.json().catch(() => ({}));
        showToast('error', errJson.error || 'Falha ao excluir pasta.');
      }
    } catch (err) {
      showToast('error', 'Falha ao excluir pasta.');
    } finally {
      setDeleting(false);
    }
  };

  // Filtragem dos papéis de parede
  const filteredItems = items.filter((item) => {
    const matchesFolder = selectedFolderId === 'all' || item.folderId === selectedFolderId;
    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.folderId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[88vh] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Cabeçalho da Galeria */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/70 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
              <Layers size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-heading">
                  {getModalTitle()}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  {items.length} itens
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {getModalSubtitle()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isMaster && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(true)}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Criar nova pasta de organização"
                >
                  <FolderPlus size={14} className="text-amber-500" />
                  <span className="hidden sm:inline">Nova Pasta</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewFolderTarget(selectedFolderId !== 'all' ? selectedFolderId : (folders[0]?.id || ''));
                    setShowAddModal(true);
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Fazer upload de novas fotos para a biblioteca (única ou múltiplas)"
                >
                  <Plus size={14} />
                  <span className="hidden sm:inline">Adicionar Fotos</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Fechar biblioteca"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Notificação Toast */}
        {toastMessage && (
          <div
            className={`px-4 py-2.5 text-xs font-bold flex items-center justify-between border-b ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900'
                : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles size={14} />
              <span>{toastMessage.text}</span>
            </div>
            <button onClick={() => setToastMessage(null)}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Corpo: Painel Dividido (Pastas na Esquerda + Grade de Imagens na Direita) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Barra Lateral: Pastas da Pasta-Mãe */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-3 sm:p-4 flex flex-col gap-1 shrink-0 overflow-y-auto max-h-48 md:max-h-full">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-2 px-2 flex items-center justify-between">
              <span>Pastas & Categorias</span>
              {isMaster && <Settings size={12} className="text-slate-400" />}
            </div>

            <button
              type="button"
              onClick={() => setSelectedFolderId('all')}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                selectedFolderId === 'all'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Folder size={15} />
                <span className="truncate">Todas as Imagens</span>
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                  selectedFolderId === 'all'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {items.length}
              </span>
            </button>

            {folders.map((folder) => {
              const count = items.filter((i) => i.folderId === folder.id).length;
              const isSelected = selectedFolderId === folder.id;
              return (
                <div
                  key={folder.id}
                  className={`group relative flex items-center justify-between rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedFolderId(folder.id)}
                    className="flex-1 text-left px-3 py-2 flex items-center gap-2 truncate cursor-pointer"
                    title={folder.description || folder.name}
                  >
                    <Folder size={15} className={isSelected ? 'text-white' : 'text-amber-500'} />
                    <span className="truncate">{folder.name}</span>
                  </button>

                  <div className="flex items-center gap-1 pr-2">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                    {isMaster && folder.id !== 'corporativo' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFolderToDelete({ id: folder.id, name: folder.name });
                        }}
                        className={`p-1.5 rounded-lg transition-all hover:bg-rose-500 hover:text-white cursor-pointer ${
                          isSelected ? 'text-white/80 hover:text-white' : 'text-slate-400 hover:text-rose-600'
                        }`}
                        title={`Excluir pasta "${folder.name}"`}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Área Principal: Busca + Grade de Cartões de Imagem */}
          <div className="flex-1 flex flex-col overflow-hidden p-4 sm:p-6 bg-slate-100/40 dark:bg-slate-950/40">
            {/* Campo de Busca Rápida */}
            <div className="mb-4 flex items-center gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar imagens por título ou categoria..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Grade de Imagens */}
            <div className="flex-1 overflow-y-auto pr-1">
              {loading ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs">Carregando galeria de fundos...</span>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-white dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                  <ImageIcon size={36} className="text-slate-300 dark:text-slate-600 mb-2" />
                  <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                    Nenhum fundo encontrado
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    {searchQuery
                      ? 'Nenhum resultado corresponde aos termos da busca.'
                      : 'Esta pasta ainda não possui papéis de parede cadastrados.'}
                  </p>
                  {isMaster && (
                    <button
                      type="button"
                      onClick={() => setShowAddModal(true)}
                      className="mt-4 px-4 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-xs flex items-center gap-1.5"
                    >
                      <Plus size={14} />
                      <span>Adicionar Imagem Agora</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
                  {filteredItems.map((item) => {
                    const isSelected = currentWallpaperUrl === item.url;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          onSelectWallpaper(item.url);
                          showToast('success', `Fundo "${item.title}" aplicado no cartão!`);
                        }}
                        className={`group relative bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border transition-all cursor-pointer shadow-xs hover:shadow-lg hover:-translate-y-0.5 flex flex-col ${
                          isSelected
                            ? 'border-sky-600 ring-2 ring-sky-500 ring-offset-2 dark:ring-offset-slate-900'
                            : 'border-slate-200 dark:border-slate-800 hover:border-sky-400'
                        }`}
                      >
                        {/* Imagem do Fundo */}
                        <div className="relative aspect-[4/5] bg-slate-900 dark:bg-slate-950 overflow-hidden flex items-center justify-center">
                          <img
                            src={item.thumbnailUrl || item.url}
                            alt={item.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (!target.dataset.fallback) {
                                target.dataset.fallback = 'true';
                                target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
                              }
                            }}
                          />

                          {/* Overlay escuro em hover com botão de aplicar */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5">
                            <div className="flex justify-end gap-1">
                              {isMaster && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setItemToDelete({ id: item.id, title: item.title });
                                  }}
                                  className="p-1.5 rounded-lg bg-red-600/90 text-white hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
                                  title="Excluir este papel de parede da biblioteca"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>

                            <div className="flex items-center justify-center pb-2">
                              <span className="px-3 py-1.5 rounded-xl bg-sky-600 text-white text-xs font-bold shadow-md flex items-center gap-1.5">
                                <Check size={13} />
                                <span>{getSelectButtonLabel()}</span>
                              </span>
                            </div>
                          </div>

                          {/* Badge de Selecionado */}
                          {isSelected && (
                            <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-sky-600 text-white text-[10px] font-bold shadow-md flex items-center gap-1">
                              <Check size={12} />
                              <span>Em Uso</span>
                            </div>
                          )}
                        </div>

                        {/* Legenda e pasta */}
                        <div className="p-2.5 flex flex-col justify-between flex-1">
                          <p className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate" title={item.title}>
                            {item.title}
                          </p>
                          <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                            <span className="capitalize">{item.folderId}</span>
                            <span className="text-sky-600 font-bold group-hover:underline">Selecionar</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rodapé Informativo */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-amber-500" />
            <span>
              {targetFieldMode === 'wallpaper'
                ? 'Ao selecionar, a opacidade do cabeçalho e conteúdo pode ser ajustada no item 5 para revelar a imagem.'
                : 'Clique sobre qualquer imagem ou padrão para aplicar imediatamente no seu cartão.'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-300 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* MODAL: Adicionar Imagem / Múltiplas Fotos (Master) */}
      {showAddModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl max-h-[90vh] rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <ImageIcon size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    Adicionar Fotos à Galeria
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Envie uma foto ou selecione várias fotos de uma só vez para a biblioteca.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setPendingPhotos([]);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  📁 Pasta de Destino
                </label>
                <select
                  value={newFolderTarget}
                  onChange={(e) => setNewFolderTarget(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                >
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      📁 {f.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Alternador de Método: Upload do PC (Múltiplas Fotos) ou Links URLs */}
              <div>
                <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl mb-3 border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setAddMode('upload')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      addMode === 'upload'
                        ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-300 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                  >
                    <Upload size={14} />
                    <span>Upload de Fotos (Arquivos do PC)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddMode('url')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      addMode === 'url'
                        ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-300 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                  >
                    <LinkIcon size={14} />
                    <span>Link da Web / ImgBB / URLs</span>
                  </button>
                </div>

                {addMode === 'upload' ? (
                  <div className="space-y-3">
                    {/* Área de Seleção / Dropzone */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingOver(true);
                      }}
                      onDragLeave={() => setIsDraggingOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingOver(false);
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                          handleFilesSelected(e.dataTransfer.files);
                        }
                      }}
                      className={`relative w-full rounded-2xl border-2 border-dashed p-4 text-center transition-all ${
                        isDraggingOver
                          ? 'border-sky-500 bg-sky-100/50 dark:bg-sky-950/50 scale-[0.99]'
                          : 'border-sky-300 dark:border-sky-700 bg-sky-50/40 dark:bg-sky-950/20 hover:bg-sky-50 dark:hover:bg-sky-950/30'
                      }`}
                    >
                      <label className="flex flex-col items-center justify-center gap-2 cursor-pointer py-3">
                        <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
                          <Upload size={22} />
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm font-bold text-sky-700 dark:text-sky-300">
                            Clique para selecionar uma ou várias fotos
                          </span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            ou arraste e solte múltiplos arquivos aqui
                          </p>
                        </div>
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                          PNG, JPG, JPEG ou WEBP (até 8MB por foto)
                        </span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Lista / Grid de Fotos Pendentes Selecionadas */}
                    {pendingPhotos.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              Fotos Selecionadas para Envio
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              {pendingPhotos.length} {pendingPhotos.length === 1 ? 'foto' : 'fotos'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-[11px] font-bold text-sky-600 hover:text-sky-700 cursor-pointer flex items-center gap-1">
                              <Plus size={13} />
                              <span>Mais Fotos</span>
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                              />
                            </label>
                            <span className="text-slate-300 dark:text-slate-700">|</span>
                            <button
                              type="button"
                              onClick={() => setPendingPhotos([])}
                              className="text-[11px] font-bold text-rose-500 hover:text-rose-600 cursor-pointer flex items-center gap-1"
                            >
                              <Trash2 size={13} />
                              <span>Limpar Tudo</span>
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
                          {pendingPhotos.map((photo) => (
                            <div
                              key={photo.id}
                              className="flex items-center gap-2.5 p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs group"
                            >
                              <img
                                src={photo.base64Data}
                                alt={photo.title}
                                className="w-12 h-12 rounded-lg object-cover bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <input
                                  type="text"
                                  value={photo.title}
                                  onChange={(e) => handleUpdatePendingTitle(photo.id, e.target.value)}
                                  placeholder="Título da foto"
                                  className="w-full px-2 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:bg-white focus:ring-1 focus:ring-sky-500"
                                  title="Clique para editar o título deste fundo"
                                />
                                <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                                  <span className="truncate max-w-[120px]">{photo.fileName}</span>
                                  <span>{photo.sizeFormatted}</span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemovePendingPhoto(photo.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg cursor-pointer transition-colors"
                                title="Remover esta foto da fila"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Links Diretos das Imagens (um por linha ou separados por vírgula)
                      </label>
                      <textarea
                        rows={4}
                        placeholder={`https://i.ibb.co/exemplo1/fundo-luxo.jpg\nhttps://i.ibb.co/exemplo2/fundo-madeira.jpg\nhttps://images.unsplash.com/photo-exemplo`}
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-mono"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Você pode colar múltiplos links de uma só vez (ImgBB, Unsplash, CDN ou servidores externos).
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Título Base (Opcional se enviar múltiplos)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Textura Moderna"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500">
                  {addMode === 'upload' && pendingPhotos.length > 0 && (
                    <span className="font-bold text-sky-600 dark:text-sky-400">
                      {pendingPhotos.length} {pendingPhotos.length === 1 ? 'foto pronta' : 'fotos prontas'} para envio
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setPendingPhotos([]);
                    }}
                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={
                      submitting ||
                      (addMode === 'upload' && pendingPhotos.length === 0) ||
                      (addMode === 'url' && !newUrl.trim())
                    }
                    className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {submitting ? (
                      'Salvando Fotos...'
                    ) : (
                      <>
                        <Upload size={14} />
                        <span>
                          {addMode === 'upload' && pendingPhotos.length > 1
                            ? `Salvar ${pendingPhotos.length} Fotos na Galeria`
                            : 'Adicionar à Galeria'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Criar Nova Pasta (Master) */}
      {showFolderModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <FolderPlus className="text-amber-500" size={18} />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Criar Nova Pasta de Fundos
                </h4>
              </div>
              <button
                onClick={() => setShowFolderModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome da Pasta / Categoria
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Imobiliária & Alto Padrão"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Descrição (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Texturas arquitetônicas e fachadas modernas"
                  value={newFolderDesc}
                  onChange={(e) => setNewFolderDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  {submitting ? 'Criando...' : 'Criar Pasta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO: Excluir Pasta */}
      {folderToDelete && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-rose-200 dark:border-rose-900 shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Excluir Pasta & Fundos
                </h4>
                <p className="text-xs text-slate-500">Ação irreversível</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Tem certeza que deseja excluir permanentemente a pasta{' '}
              <strong className="text-slate-900 dark:text-white font-bold">"{folderToDelete.name}"</strong>?
              Todas as imagens associadas a esta pasta também serão removidas da biblioteca.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFolderToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeleteFolder()}
                disabled={deleting}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {deleting ? 'Excluindo...' : 'Sim, Excluir Pasta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO: Excluir Fundo */}
      {itemToDelete && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-rose-200 dark:border-rose-900 shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Excluir Papel de Parede
                </h4>
                <p className="text-xs text-slate-500">Remover da biblioteca pública</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Deseja remover o fundo{' '}
              <strong className="text-slate-900 dark:text-white font-bold">"{itemToDelete.title}"</strong> da galeria?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeleteItem()}
                disabled={deleting}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {deleting ? 'Excluindo...' : 'Sim, Excluir Fundo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
