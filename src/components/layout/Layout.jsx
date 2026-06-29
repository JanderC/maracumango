import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--crema)' }}>
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <Navbar setMobileOpen={setMobileOpen} />

      {/* Contenido principal */}
      <main style={{
        marginLeft: 'var(--sidebar-rail)',
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