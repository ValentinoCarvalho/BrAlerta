import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, MapPin } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { user, signIn, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/map';

  if (user) return <Navigate to={from} replace />;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    clearError();
    try { await signIn(email.trim(), password); navigate(from, { replace: true }); } catch { /* exibido pelo contexto */ }
  }

  return <div className="auth-page"><section className="auth-visual"><div className="auth-brand"><span className="brand-pin">●</span><span>BR <b>ALERTA</b></span></div><div><span className="auth-kicker"><MapPin /> INTELIGÊNCIA URBANA COLABORATIVA</span><h1>Uma cidade melhor começa com quem <em>participa.</em></h1><p>Registre problemas urbanos, acompanhe o andamento e ajude a construir uma visão mais clara da cidade.</p></div><small>Projeto acadêmico FIAP · Ambiente demonstrativo</small></section><section className="auth-form-wrap"><form className="auth-form" onSubmit={submit}><span className="eyebrow">BEM-VINDO DE VOLTA</span><h2>Entre na sua conta</h2><p>Acesse o mapa colaborativo do BR Alerta.</p><label>E-mail<div className="auth-input"><Mail/><input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@email.com"/></div></label><label>Senha<div className="auth-input"><LockKeyhole/><input type={showPassword?'text':'password'} autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Sua senha"/><button type="button" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?'Ocultar senha':'Mostrar senha'}>{showPassword?<EyeOff/>:<Eye/>}</button></div></label>{error&&<div className="auth-error" role="alert">{error}</div>}<button className="primary auth-submit" disabled={loading}>{loading?'Entrando...':'Entrar'}<ArrowRight/></button><p className="auth-switch">Ainda não possui conta? <Link to="/register">Criar conta</Link></p></form></section></div>;
}
