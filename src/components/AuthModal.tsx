import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, Eye, EyeOff, AlertCircle, CheckCircle, ArrowRight, Layers, KeyRound, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';

interface AuthModalProps {
  initialMode?: 'login' | 'register' | 'reset';
  onSuccess?: () => void;
  isStandalonePage?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  initialMode = 'login',
  onSuccess,
  isStandalonePage = false,
}) => {
  const { signIn, signUp, resetPassword, isConfigured } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'reset'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
        setSuccessMsg('Login efetuado com sucesso!');
        if (onSuccess) onSuccess();
      } else if (mode === 'register') {
        if (!password || password.length < 6) {
          throw new Error('A senha deve ter pelo menos 6 caracteres.');
        }
        await signUp(email.trim(), password, fullName.trim());
        setSuccessMsg('Conta criada com sucesso! Caso necessário, confirme seu e-mail.');
        if (onSuccess) onSuccess();
      } else if (mode === 'reset') {
        await resetPassword(email.trim());
        setSuccessMsg('Instruções de recuperação foram enviadas para seu e-mail!');
      }
    } catch (err: any) {
      console.error('Erro na autenticação:', err);
      let message = err.message || 'Ocorreu um erro ao processar sua solicitação.';
      if (message.includes('Invalid login credentials')) {
        message = 'E-mail ou senha incorretos. Por favor, verifique seus dados.';
      } else if (message.includes('User already registered')) {
        message = 'Este e-mail já está cadastrado. Tente fazer login ou recuperar sua senha.';
      } else if (message.includes('Password should be at least')) {
        message = 'A senha deve conter no mínimo 6 caracteres.';
      }
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const cardContent = (
    <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-8 sm:p-10 border border-slate-200/80 dark:border-slate-700/80 shadow-2xl transition-all">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-600 to-sky-800 text-white flex items-center justify-center shadow-lg shadow-sky-700/25 mb-4">
          <Layers size={30} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-heading">
          {mode === 'login' && 'Acessar Meu Painel'}
          {mode === 'register' && 'Criar Conta Profissional'}
          {mode === 'reset' && 'Recuperar Senha'}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
          {mode === 'login' && 'Gerencie seus cartões digitais, métricas e atendente IA.'}
          {mode === 'register' && 'Comece seu período de degustação gratuita de 30 dias.'}
          {mode === 'reset' && 'Digite seu e-mail cadastrado para redefinir sua senha.'}
        </p>
      </div>

      {/* Configuration Warning Notice (If Supabase not yet configured) */}
      {!isConfigured && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs leading-relaxed flex items-start gap-2.5">
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div>
            <strong className="font-bold">Aviso de Configuração:</strong> As credenciais do Supabase (SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY) ainda não foram inseridas no ambiente. O modo local de demonstração continuará disponível.
          </div>
        </div>
      )}

      {/* Tabs Switcher */}
      {mode !== 'reset' && (
        <div className="flex p-1 bg-slate-100 dark:bg-slate-900/70 rounded-xl mb-6 border border-slate-200/60 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Cadastrar
          </button>
        </div>
      )}

      {/* Error & Success Feedback */}
      {errorMsg && (
        <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2">
          <CheckCircle size={16} className="shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Nome Completo
            </label>
            <div className="relative">
              <UserIcon size={16} className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: João da Silva"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            E-mail Profissional
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@empresa.com"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all"
            />
          </div>
        </div>

        {mode !== 'reset' && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Senha
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('reset');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline"
                >
                  Esqueceu a senha?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 px-4 bg-sky-700 hover:bg-sky-800 active:bg-sky-900 text-white rounded-xl text-sm font-bold shadow-md shadow-sky-700/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              {mode === 'login' && 'Entrar na Minha Conta'}
              {mode === 'register' && 'Criar Minha Conta Grátis'}
              {mode === 'reset' && 'Enviar Link de Redefinição'}
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      {/* Bottom Switcher */}
      <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700/60 text-center">
        {mode === 'reset' ? (
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
          >
            <KeyRound size={14} /> Voltar para o Login
          </button>
        ) : (
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <Home size={14} /> Voltar para a Página Inicial
          </a>
        )}
      </div>
    </div>
  );

  if (isStandalonePage) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 sm:p-6 transition-colors">
        {cardContent}
      </div>
    );
  }

  return cardContent;
};
