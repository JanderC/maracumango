import { RiMenuLine } from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ setMobileOpen }) {
  const { usuario } = useAuth();

  return (
    <header style={{
      position: 'fixed',
      top: 0, right: 0,
      left: 0,
      height: 64,
      background: 'var(--blanco)',
      borderBottom: '1px solid rgba(0,0,0,0.06)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      zIndex: 997,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    }}>
      {/* Botón menú mobile */}
      <button
        className="d-flex d-md-none"
        onClick={() => setMobileOpen(true)}
        style={{
          background: 'none', border: 'none',
          fontSize: '1.4rem', color: 'var(--verde)',
          cursor: 'pointer', padding: 4
        }}
      >
        <RiMenuLine />
      </button>

      {/* Spacer desktop */}
      <div className="d-none d-md-block" />

      {/* Derecha */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          background: 'var(--crema)',
          borderRadius: 12,
          padding: '6px 14px',
          fontSize: '0.82rem',
          fontWeight: 600,
          color: 'var(--verde)',
          border: '1px solid rgba(27,94,32,0.15)'
        }}>
          {usuario?.rol === 'admin' ? '👑 Admin' : '🛍️ Cliente'}
        </div>
        <div style={{
          width: 36, height: 36,
          borderRadius: '50%',
          background: 'var(--verde)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700,
          fontSize: '0.9rem'
        }}>
          {usuario?.nombre?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}