import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  RiDashboardLine, RiArchiveLine, RiShoppingBagLine,
  RiStoreLine, RiMoneyDollarCircleLine, RiBankLine,
  RiBarChartLine, RiTeamLine, RiLogoutBoxLine, RiCloseLine, RiLeafLine, RiCupLine, RiPriceTag3Line 
} from 'react-icons/ri';

const menuAdmin = [
  { to: '/dashboard',         icon: <RiDashboardLine />,          label: 'Dashboard' },
  { to: '/inventario',        icon: <RiArchiveLine />,            label: 'Inventario' },
  { to: '/toppings', icon: <RiCupLine />, label: 'Toppings' },
  { to: '/productos',         icon: <RiShoppingBagLine />,        label: 'Productos' },
  { to: '/categorias', icon: <RiPriceTag3Line />, label: 'Categorías' },
  { to: '/catalogo',          icon: <RiStoreLine />,              label: 'Catálogo' },
  { to: '/ventas',            icon: <RiMoneyDollarCircleLine />,  label: 'Ventas' },
  { to: '/tasas-cambio',      icon: <RiLeafLine />,               label: 'Tasas' },
  { to: '/cuentas-bancarias', icon: <RiBankLine />,               label: 'Cuentas' },
  { to: '/reportes',          icon: <RiBarChartLine />,           label: 'Reportes' },
  { to: '/usuarios',          icon: <RiTeamLine />,               label: 'Usuarios' },

];

const menuCliente = [
  { to: '/catalogo', icon: <RiStoreLine />, label: 'Catálogo' },
];

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const [expandido, setExpandido] = useState(false);
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const menu = usuario?.rol === 'admin' ? menuAdmin : menuCliente;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 998,
            backdropFilter: 'blur(2px)'
          }}
        />
      )}

      {/* Sidebar desktop */}
      <aside
        onMouseEnter={() => setExpandido(true)}
        onMouseLeave={() => setExpandido(false)}
        style={{
          position: 'fixed',
          top: 0, left: 0,
          height: '100vh',
          width: expandido ? 'var(--sidebar-width)' : 'var(--sidebar-rail)',
          background: 'var(--verde)',
          transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '4px 0 20px rgba(0,0,0,0.15)'
        }}
        className="d-none d-md-flex"
      >
        {/* Logo */}
        <div style={{
          padding: '20px 0',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          minHeight: 80,
          paddingLeft: expandido ? 20 : 0,
          justifyContent: expandido ? 'flex-start' : 'center',
          transition: 'all 0.3s ease'
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--naranja)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0
          }}>🥭</div>
          {expandido && (
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.2 }}>Maracu</div>
              <div style={{ color: 'var(--naranja-claro)', fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.2 }}>Mango</div>
            </div>
          )}
        </div>

        {/* Menú */}
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto', overflowX: 'hidden' }}>
          {menu.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 0',
                paddingLeft: expandido ? 20 : 0,
                justifyContent: expandido ? 'flex-start' : 'center',
                color: isActive ? 'var(--naranja-claro)' : 'rgba(255,255,255,0.75)',
                textDecoration: 'none',
                fontSize: '1.25rem',
                fontWeight: 500,
                transition: 'all 0.2s ease',
                borderRight: isActive ? '3px solid var(--naranja-claro)' : '3px solid transparent',
                background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                whiteSpace: 'nowrap',
                overflow: 'hidden'
              })}
            >
              <span style={{ flexShrink: 0, fontSize: '1.3rem' }}>{item.icon}</span>
              {expandido && (
                <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Usuario + Logout */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          padding: expandido ? '16px 20px' : '16px 0',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          justifyContent: expandido ? 'flex-start' : 'center'
        }}>
          {expandido && (
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {usuario?.nombre}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', textTransform: 'capitalize' }}>
                {usuario?.rol}
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: 10,
              padding: '8px 10px',
              color: '#fff',
              fontSize: '1.1rem',
              cursor: 'pointer',
              transition: 'background 0.2s',
              flexShrink: 0
            }}
          >
            <RiLogoutBoxLine />
          </button>
        </div>
      </aside>

      {/* Sidebar mobile (drawer) */}
      <aside
        style={{
          position: 'fixed',
          top: 0, left: mobileOpen ? 0 : '-100%',
          height: '100vh',
          width: 260,
          background: 'var(--verde)',
          transition: 'left 0.3s cubic-bezier(0.4,0,0.2,1)',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '4px 0 20px rgba(0,0,0,0.2)'
        }}
        className="d-flex d-md-none"
      >
        {/* Header mobile */}
        <div style={{
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>🥭</span>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>Maracu</div>
              <div style={{ color: 'var(--naranja-claro)', fontWeight: 700, fontSize: '1rem', marginTop: -4 }}>Mango</div>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.4rem', cursor: 'pointer' }}
          >
            <RiCloseLine />
          </button>
        </div>

        {/* Menú mobile */}
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {menu.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 24px',
                color: isActive ? 'var(--naranja-claro)' : 'rgba(255,255,255,0.8)',
                textDecoration: 'none',
                fontSize: '0.92rem',
                fontWeight: 500,
                background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                borderRight: isActive ? '3px solid var(--naranja-claro)' : '3px solid transparent',
              })}
            >
              <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer mobile */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem' }}>{usuario?.nombre}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'capitalize' }}>{usuario?.rol}</div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none', borderRadius: 10,
              padding: '8px 10px', color: '#fff',
              fontSize: '1.1rem', cursor: 'pointer'
            }}
          >
            <RiLogoutBoxLine />
          </button>
        </div>
      </aside>
    </>
  );
}