import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandido, setExpandido] = useState(false); // sidebar de escritorio abierto (hover)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--crema)' }}>
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} expandido={expandido} setExpandido={setExpandido} />
      <Navbar setMobileOpen={setMobileOpen} />

      {/* Contenido principal */}
      <main style={{
        // El contenido se corre cuando el sidebar se abre, en vez de quedar tapado
        marginLeft: expandido ? 'var(--sidebar-width)' : 'var(--sidebar-rail)',
        paddingTop: 64,
        minHeight: '100vh',
        transition: 'margin-left 0.3s ease'
      }} className="main-content">
        <div style={{ padding: '28px 24px' }}>
          <Outlet />
        </div>
      </main>

      {/* En mobile no hay margen del sidebar */}
      <style>{`
        @media (max-width: 767px) {
          .main-content {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}