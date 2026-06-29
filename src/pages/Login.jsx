import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { RiEyeLine, RiEyeOffLine, RiLeafLine } from 'react-icons/ri';

export default function Login() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [verPass, setVerPass] = useState(false);
  const [cargando, setCargando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!correo || !contrasena) { toast.error('Completa todos los campos'); return; }
    setCargando(true);
    try {
      const { data } = await API.post('/auth/login', { correo, contrasena });
      login(data.token, data.usuario);
      toast.success(`¡Bienvenido, ${data.usuario.nombre}!`);
      navigate(data.usuario.rol === 'admin' ? '/dashboard' : '/catalogo');
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Credenciales incorrectas');
    } finally { setCargando(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'Poppins, sans-serif' }}>

      {/* ── Panel izquierdo ── */}
      <div className="d-none d-lg-flex" style={{
        width: '52%',
        background: 'linear-gradient(160deg, #1B5E20 0%, #2E7D32 60%, #388E3C 100%)',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Forma diagonal derecha */}
        <div style={{
          position: 'absolute', right: -1, top: 0, bottom: 0, width: 80,
          background: 'var(--crema)',
          clipPath: 'polygon(60% 0%, 100% 0%, 100% 100%, 0% 100%)',
          zIndex: 2
        }} />

        {/* Círculos decorativos */}
        <div style={{ position: 'absolute', top: -100, left: -100, width: 350, height: 350, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(245,127,23,0.08)' }} />
        <div style={{ position: 'absolute', top: '30%', right: 100, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        {/* Contenido */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 80px 0 60px' }}>

          {/* Logo */}
          <div style={{
            width: 180, height: 180,
            margin: '0 auto 32px',
            filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.3))',
            animation: 'flotar 3s ease-in-out infinite'
          }}>
            <img
              src="/logo.png"
              alt="Maracu Mango"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>

          {/* Nombre */}
          <div style={{ marginBottom: 8 }}>
            <span style={{
              color: '#fff',
              fontSize: '2.6rem',
              fontWeight: 800,
              letterSpacing: '-0.5px',
              lineHeight: 1.1,
              display: 'block'
            }}>
              Maracú
            </span>
            <span style={{
              fontSize: '2.6rem',
              fontWeight: 800,
              letterSpacing: '-0.5px',
              lineHeight: 1.1,
              display: 'block'
            }}>
              <span style={{ color: '#fff' }}>Maracu</span>
              <span style={{ color: 'var(--naranja-claro)' }}> Mango</span>
            </span>
          </div>

          <p style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: '0.9rem',
            fontWeight: 400,
            lineHeight: 1.7,
            maxWidth: 260,
            margin: '16px auto 36px'
          }}>
            Sistema de gestión integral de ventas e inventario
          </p>

          {/* Pills multimoneda */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { flag: '💵', label: 'Dólar USD' },
              { flag: '🇻🇪', label: 'Bolívar Bs' },
              { flag: '🇨🇴', label: 'Peso COP' }
            ].map(m => (
              <span key={m.label} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.85)',
                borderRadius: 20, padding: '6px 14px',
                fontSize: '0.78rem', fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.15)',
                backdropFilter: 'blur(4px)'
              }}>
                {m.flag} {m.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Panel derecho: formulario ── */}
      <div style={{
        flex: 1,
        background: 'var(--crema)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px'
      }}>

        {/* Logo mobile */}
        <div className="d-flex d-lg-none" style={{
          flexDirection: 'column', alignItems: 'center', marginBottom: 32
        }}>
          <img src="/logo.png" alt="Maracu Mango" style={{ width: 100, height: 100, objectFit: 'contain', marginBottom: 8 }} />
          <div style={{ textAlign: 'center', lineHeight: 1.1 }}>
            <div style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--verde)' }}>Maracú</div>
            <div style={{ fontWeight: 800, fontSize: '1.5rem' }}>
              <span style={{ color: 'var(--verde)' }}>Maracú</span>
              <span style={{ color: 'var(--naranja)' }}> Mango</span>
            </div>
          </div>
        </div>

        {/* Card formulario */}
        <div style={{
          width: '100%', maxWidth: 400,
          background: '#fff', borderRadius: 24,
          padding: '40px 36px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.08)'
        }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.4rem', color: 'var(--texto)', marginBottom: 4 }}>
            Bienvenido 👋
          </h2>
          <p style={{ color: 'var(--texto-suave)', fontSize: '0.85rem', marginBottom: 32 }}>
            Ingresa tus credenciales para continuar
          </p>

          <form onSubmit={handleSubmit}>
            {/* Correo */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--texto)', marginBottom: 8, display: 'block' }}>
                Correo electrónico
              </label>
              <input
                type="email"
                className="input-mm"
                placeholder="correo@maracumango.com"
                value={correo}
                onChange={e => setCorreo(e.target.value)}
                autoComplete="email"
              />
            </div>

            {/* Contraseña */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--texto)', marginBottom: 8, display: 'block' }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={verPass ? 'text' : 'password'}
                  className="input-mm"
                  placeholder="••••••••"
                  value={contrasena}
                  onChange={e => setContrasena(e.target.value)}
                  autoComplete="current-password"
                  style={{ paddingRight: 48 }}
                />
                <button type="button" onClick={() => setVerPass(!verPass)} style={{
                  position: 'absolute', right: 14, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  color: 'var(--texto-suave)', fontSize: '1.1rem',
                  cursor: 'pointer', padding: 0
                }}>
                  {verPass ? <RiEyeOffLine /> : <RiEyeLine />}
                </button>
              </div>
            </div>

            {/* Botón */}
            <button
              type="submit"
              disabled={cargando}
              style={{
                width: '100%', padding: '13px',
                background: cargando ? '#9E9E9E' : 'var(--verde)',
                color: '#fff', border: 'none', borderRadius: 14,
                fontFamily: 'Poppins, sans-serif', fontWeight: 700,
                fontSize: '0.95rem',
                cursor: cargando ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: cargando ? 'none' : '0 4px 16px rgba(27,94,32,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
            >
              {cargando && <span className="spinner-border spinner-border-sm" />}
              {cargando ? 'Ingresando...' : 'Ingresar al sistema'}
            </button>
          </form>

          {/* Footer card */}
          <div style={{
            marginTop: 28, padding: '12px 16px',
            background: 'var(--crema)', borderRadius: 12,
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <RiLeafLine style={{ color: 'var(--verde)', flexShrink: 0, fontSize: '1rem' }} />
            <span style={{ fontSize: '0.74rem', color: 'var(--texto-suave)', lineHeight: 1.5 }}>
              Acceso exclusivo para personal de Maracu Mango
            </span>
          </div>
        </div>

        {/* Versión */}
        <div style={{ marginTop: 24, fontSize: '0.72rem', color: '#BDBDBD' }}>
          v1.0.0 · Maracu Mango System
        </div>
      </div>

      <style>{`
        @keyframes flotar {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}