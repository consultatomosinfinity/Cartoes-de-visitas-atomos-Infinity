import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Crown,
  Shield,
  Briefcase,
  UserCheck,
  Search,
  Filter,
  Edit2,
  Trash2,
  KeyRound,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  X,
  Check,
  AlertTriangle,
  Mail,
  Calendar,
  CreditCard,
  Layers,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { UserProfile, UserRole, UserPlan, UserAccountStatus } from '../types.ts';
import {
  getAllProfiles,
  updateUserProfile,
  deleteUserAccount,
  createNewUser,
  adminResetUserPassword,
  MASTER_EMAILS,
} from '../lib/supabase.ts';

interface AdminUsersManagerProps {
  onSelectUserCards?: (userId: string, userEmail: string) => void;
  onBackToCards?: () => void;
}

export const AdminUsersManager: React.FC<AdminUsersManagerProps> = ({
  onSelectUserCards,
  onBackToCards,
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modais
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Formulário de Adicionar Usuário
  const [addForm, setAddForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'cliente' as UserRole,
    plan: 'degustacao' as UserPlan,
  });

  // Formulário de Edição
  const [editForm, setEditForm] = useState({
    fullName: '',
    role: 'cliente' as UserRole,
    plan: 'degustacao' as UserPlan,
    status: 'ativo' as UserAccountStatus,
  });

  // Formulário de Reset de Senha
  const [resetForm, setResetForm] = useState({
    newPassword: '',
    sendEmail: false,
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllProfiles();
      setUsers(data);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao carregar usuários' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4500);
  };

  // Filtragem de Usuários
  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      u.email.toLowerCase().includes(term) ||
      (u.fullName && u.fullName.toLowerCase().includes(term));
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchPlan = planFilter === 'all' || u.plan === planFilter;
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchSearch && matchRole && matchPlan && matchStatus;
  });

  // Contadores para métricas
  const totalUsers = users.length;
  const totalMaster = users.filter((u) => u.role === 'master').length;
  const totalAdmin = users.filter((u) => u.role === 'admin').length;
  const totalColaborador = users.filter((u) => u.role === 'colaborador').length;
  const totalClientes = users.filter((u) => u.role === 'cliente').length;
  const totalPausados = users.filter((u) => u.status === 'pausado').length;

  // Handlers
  const handleOpenEdit = (u: UserProfile) => {
    setSelectedUser(u);
    setEditForm({
      fullName: u.fullName || '',
      role: u.role,
      plan: u.plan,
      status: u.status,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await updateUserProfile(selectedUser.id, editForm);
      showNotification('success', `Usuário ${selectedUser.email} atualizado com sucesso!`);
      setShowEditModal(false);
      await loadUsers();
    } catch (err: any) {
      showNotification('error', err.message || 'Falha ao atualizar usuário');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (u: UserProfile) => {
    const isPrimaryMaster = MASTER_EMAILS.includes(u.email.toLowerCase());
    if (isPrimaryMaster && u.status === 'ativo') {
      showNotification('error', 'Contas Master principais não podem ser pausadas.');
      return;
    }

    const nextStatus: UserAccountStatus = u.status === 'ativo' ? 'pausado' : 'ativo';
    try {
      await updateUserProfile(u.id, { status: nextStatus });
      showNotification(
        'success',
        `Conta de ${u.email} ${nextStatus === 'ativo' ? 'ativada' : 'pausada'} com sucesso.`
      );
      await loadUsers();
    } catch (err: any) {
      showNotification('error', err.message || 'Erro ao alterar status');
    }
  };

  const handleOpenReset = (u: UserProfile) => {
    setSelectedUser(u);
    setResetForm({ newPassword: '', sendEmail: false });
    setShowResetModal(true);
  };

  const handleExecuteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const res = await adminResetUserPassword(
        selectedUser.id,
        selectedUser.email,
        resetForm.sendEmail ? undefined : resetForm.newPassword
      );
      showNotification('success', res.message || 'Instruções de senha enviadas com sucesso!');
      setShowResetModal(false);
    } catch (err: any) {
      showNotification('error', err.message || 'Erro ao redefinir senha');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDelete = (u: UserProfile) => {
    setSelectedUser(u);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await deleteUserAccount(selectedUser.id);
      showNotification('success', `Usuário ${selectedUser.email} excluído.`);
      setShowDeleteModal(false);
      await loadUsers();
    } catch (err: any) {
      showNotification('error', err.message || 'Erro ao excluir usuário');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.email) return;
    setActionLoading(true);
    try {
      await createNewUser({
        email: addForm.email,
        password: addForm.password || undefined,
        fullName: addForm.fullName,
        role: addForm.role,
        plan: addForm.plan,
      });
      showNotification('success', `Novo usuário ${addForm.email} cadastrado com sucesso!`);
      setShowAddModal(false);
      setAddForm({
        fullName: '',
        email: '',
        password: '',
        role: 'cliente',
        plan: 'degustacao',
      });
      await loadUsers();
    } catch (err: any) {
      showNotification('error', err.message || 'Falha ao cadastrar usuário');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper de badges visuais
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'master':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Crown className="w-3.5 h-3.5" />
            Master
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
            <Shield className="w-3.5 h-3.5" />
            Admin
          </span>
        );
      case 'colaborador':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
            <Briefcase className="w-3.5 h-3.5" />
            Colaborador
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-500/15 text-gray-700 dark:text-gray-300 border border-gray-500/30">
            <UserCheck className="w-3.5 h-3.5" />
            Cliente
          </span>
        );
    }
  };

  const getPlanBadge = (plan: UserPlan) => {
    switch (plan) {
      case 'corporativo':
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Corporativo
          </span>
        );
      case 'negocios_ia':
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            Negócios & IA
          </span>
        );
      case 'profissional':
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            Profissional
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
            Degustação 30D
          </span>
        );
    }
  };

  const getStatusBadge = (status: UserAccountStatus) => {
    switch (status) {
      case 'ativo':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Ativo
          </span>
        );
      case 'pausado':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Pausado
          </span>
        );
      case 'bloqueado':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Bloqueado
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm font-medium animate-in fade-in slide-in-from-top-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <Check className="w-5 h-5 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-500" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header com Ações e Retorno */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1E293B] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Crown className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Painel Administrativo Master
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  Acesso Total
                </span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Gerencie usuários, funções, planos, permissões e redefinição de acessos.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onBackToCards && (
            <button
              onClick={onBackToCards}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              Voltar aos Cartões
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-sm transition"
          >
            <UserPlus className="w-4 h-4" />
            Novo Usuário
          </button>
        </div>
      </div>

      {/* Grid de Estatísticas Rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1E293B] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
            <span className="text-xs font-medium">Total de Usuários</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalUsers}</div>
          <div className="text-[11px] text-gray-400 mt-1">Registrados na plataforma</div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
            <span className="text-xs font-medium">Contas Master</span>
            <Crown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{totalMaster}</div>
          <div className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-1">
            Gestores supremos
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
            <span className="text-xs font-medium">Admins & Colaboradores</span>
            <Shield className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalAdmin + totalColaborador}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            {totalAdmin} admins / {totalColaborador} colabs
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
            <span className="text-xs font-medium">Clientes Ativos</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalClientes - totalPausados}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            {totalPausados > 0 ? `${totalPausados} pausado(s)` : 'Nenhuma conta pausada'}
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white dark:bg-[#1E293B] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Filtro por Role */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 outline-none"
            >
              <option value="all">Todas as Funções</option>
              <option value="master">👑 Master</option>
              <option value="admin">🛡️ Admin</option>
              <option value="colaborador">🤝 Colaborador</option>
              <option value="cliente">👤 Cliente</option>
            </select>

            {/* Filtro por Plano */}
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 outline-none"
            >
              <option value="all">Todos os Planos</option>
              <option value="degustacao">Degustação (30D)</option>
              <option value="profissional">Profissional</option>
              <option value="negocios_ia">Negócios & IA</option>
              <option value="corporativo">Corporativo</option>
            </select>

            {/* Filtro por Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 outline-none"
            >
              <option value="all">Todos os Status</option>
              <option value="ativo">Ativo</option>
              <option value="pausado">Pausado</option>
              <option value="bloqueado">Bloqueado</option>
            </select>

            <button
              onClick={loadUsers}
              disabled={loading}
              title="Atualizar lista"
              className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Lista / Tabela de Usuários */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500" />
            <p className="text-sm">Carregando usuários e permissões...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 space-y-2">
            <Users className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600" />
            <p className="text-sm">Nenhum usuário encontrado com os filtros selecionados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Usuário</th>
                  <th className="py-3.5 px-4">Função</th>
                  <th className="py-3.5 px-4">Plano</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Cartões</th>
                  <th className="py-3.5 px-4 text-right">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-sm">
                {filteredUsers.map((u) => {
                  const isPrimaryMaster = MASTER_EMAILS.includes(u.email.toLowerCase());
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition"
                    >
                      {/* Usuário (Nome + E-mail) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                              u.role === 'master'
                                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40'
                                : u.role === 'admin'
                                ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/40'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {(u.fullName || u.email).slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                              {u.fullName || 'Sem nome informado'}
                              {isPrimaryMaster && (
                                <span
                                  title="Conta Master Principal (Átomos)"
                                  className="text-amber-500"
                                >
                                  👑
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-gray-400" />
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Função */}
                      <td className="py-3.5 px-4">{getRoleBadge(u.role)}</td>

                      {/* Plano */}
                      <td className="py-3.5 px-4">{getPlanBadge(u.plan)}</td>

                      {/* Status */}
                      <td className="py-3.5 px-4">{getStatusBadge(u.status)}</td>

                      {/* Cartões do Usuário */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => onSelectUserCards?.(u.id, u.email)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 transition"
                          title="Filtrar cartões deste usuário"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>{u.cardsCount ?? 0} cartões</span>
                          <ChevronRight className="w-3 h-3 text-gray-400" />
                        </button>
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* Botão Pausar / Ativar */}
                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={isPrimaryMaster}
                            title={
                              isPrimaryMaster
                                ? 'Conta Master principal não pode ser pausada'
                                : u.status === 'ativo'
                                ? 'Pausar conta'
                                : 'Ativar conta'
                            }
                            className={`p-1.5 rounded-lg transition ${
                              isPrimaryMaster
                                ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
                                : u.status === 'ativo'
                                ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                                : 'text-amber-600 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                            }`}
                          >
                            {u.status === 'ativo' ? (
                              <PauseCircle className="w-4 h-4" />
                            ) : (
                              <PlayCircle className="w-4 h-4" />
                            )}
                          </button>

                          {/* Botão Redefinir Senha */}
                          <button
                            onClick={() => handleOpenReset(u)}
                            title="Redefinir senha"
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Botão Editar Usuário */}
                          <button
                            onClick={() => handleOpenEdit(u)}
                            title="Editar usuário e plano"
                            className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Botão Excluir Usuário */}
                          <button
                            onClick={() => handleOpenDelete(u)}
                            disabled={isPrimaryMaster}
                            title={
                              isPrimaryMaster
                                ? 'Conta Master principal protegida contra exclusão'
                                : 'Excluir usuário'
                            }
                            className={`p-1.5 rounded-lg transition ${
                              isPrimaryMaster
                                ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
                                : 'text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Novo Usuário */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#1E293B] w-full max-w-lg rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <UserPlus className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Cadastrar Novo Usuário
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Silva"
                  value={addForm.fullName}
                  onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  E-mail de Acesso *
                </label>
                <input
                  type="email"
                  required
                  placeholder="cliente@exemplo.com"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Senha Provisória
                </label>
                <input
                  type="text"
                  placeholder="Deixe em branco para 'Atomos123!'"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none font-mono text-xs"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  O usuário poderá alterar a senha a qualquer momento.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Função na Plataforma
                  </label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white outline-none"
                  >
                    <option value="cliente">👤 Cliente</option>
                    <option value="colaborador">🤝 Colaborador</option>
                    <option value="admin">🛡️ Administrador</option>
                    <option value="master">👑 Master</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Plano Atribuído
                  </label>
                  <select
                    value={addForm.plan}
                    onChange={(e) => setAddForm({ ...addForm, plan: e.target.value as UserPlan })}
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white outline-none"
                  >
                    <option value="degustacao">⏳ Degustação (30D)</option>
                    <option value="profissional">💼 Profissional</option>
                    <option value="negocios_ia">🚀 Negócios & IA</option>
                    <option value="corporativo">🏢 Corporativo</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {actionLoading ? 'Criando...' : 'Cadastrar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Editar Usuário */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#1E293B] w-full max-w-lg rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Edit2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Editar Usuário & Permissões
                  </h3>
                  <p className="text-xs text-gray-400">{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Função de Acesso
                  </label>
                  <select
                    disabled={MASTER_EMAILS.includes(selectedUser.email.toLowerCase())}
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white outline-none disabled:opacity-60"
                  >
                    <option value="cliente">👤 Cliente</option>
                    <option value="colaborador">🤝 Colaborador</option>
                    <option value="admin">🛡️ Administrador</option>
                    <option value="master">👑 Master</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Plano Ativo
                  </label>
                  <select
                    value={editForm.plan}
                    onChange={(e) => setEditForm({ ...editForm, plan: e.target.value as UserPlan })}
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white outline-none"
                  >
                    <option value="degustacao">⏳ Degustação (30D)</option>
                    <option value="profissional">💼 Profissional</option>
                    <option value="negocios_ia">🚀 Negócios & IA</option>
                    <option value="corporativo">🏢 Corporativo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Status da Conta
                </label>
                <select
                  disabled={MASTER_EMAILS.includes(selectedUser.email.toLowerCase())}
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm({ ...editForm, status: e.target.value as UserAccountStatus })
                  }
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white outline-none disabled:opacity-60"
                >
                  <option value="ativo">🟢 Ativo (Acesso normal)</option>
                  <option value="pausado">🟠 Pausado (Acesso suspenso)</option>
                  <option value="bloqueado">🔴 Bloqueado</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {actionLoading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Redefinir Senha */}
      {showResetModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#1E293B] w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <KeyRound className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Redefinir Senha</h3>
              </div>
              <button
                onClick={() => setShowResetModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteReset} className="p-6 space-y-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Redefina o acesso para <strong>{selectedUser.email}</strong>.
              </p>

              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 dark:text-gray-300">
                  <input
                    type="radio"
                    name="resetType"
                    checked={!resetForm.sendEmail}
                    onChange={() => setResetForm({ ...resetForm, sendEmail: false })}
                    className="text-amber-500 focus:ring-amber-500"
                  />
                  <span>Definir nova senha diretamente agora</span>
                </label>

                {!resetForm.sendEmail && (
                  <input
                    type="text"
                    required
                    placeholder="Digite a nova senha (mín. 6 dígitos)"
                    value={resetForm.newPassword}
                    onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white outline-none font-mono"
                  />
                )}

                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 dark:text-gray-300 pt-1">
                  <input
                    type="radio"
                    name="resetType"
                    checked={resetForm.sendEmail}
                    onChange={() => setResetForm({ ...resetForm, sendEmail: true })}
                    className="text-amber-500 focus:ring-amber-500"
                  />
                  <span>Enviar link seguro de recuperação para o e-mail do usuário</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {actionLoading ? 'Processando...' : 'Confirmar Redefinição'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Excluir Usuário */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#1E293B] w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Excluir Conta de Usuário?
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Tem certeza que deseja excluir <strong>{selectedUser.email}</strong>? Esta ação é
                irreversível e removerá o perfil e os cartões vinculados a este usuário.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition disabled:opacity-50"
              >
                {actionLoading ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
