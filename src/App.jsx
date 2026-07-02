import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventario from './pages/Inventario';
import Productos from './pages/Productos';
import Catalogo from './pages/Catalogo';
import Ventas from './pages/Ventas';
import TasasCambio from './pages/TasasCambio';
import CuentasBancarias from './pages/CuentasBancarias';
import Reportes from './pages/Reportes';
import Usuarios from './pages/Usuarios';
import Toppings from './pages/Toppings';
import Categorias from './pages/Categorias';
import Menu from './pages/Menu';


const RutaProtegida = ({ children, soloAdmin }) => {
  const { usuario, cargando } = useAuth();
  if (cargando) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <div className="spinner-border" style={{ color: 'var(--verde)' }} />
    </div>
  );
  if (!usuario) return <Navigate to="/login" />;
  if (soloAdmin && usuario.rol !== 'admin') return <Navigate to="/catalogo" />;
  return children;
};

const AppRoutes = () => {
  const { usuario } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={!usuario ? <Login /> : <Navigate to={usuario.rol === 'admin' ? '/dashboard' : '/catalogo'} />} />

      {/* Pantalla pública para clientes: sin sidebar, sin login */}
      <Route path="/menu" element={<Menu />} />

      <Route path="/" element={<RutaProtegida><Layout /></RutaProtegida>}>
        <Route index element={<Navigate to={usuario?.rol === 'admin' ? '/dashboard' : '/catalogo'} />} />
        <Route path="dashboard" element={<RutaProtegida soloAdmin><Dashboard /></RutaProtegida>} />
        <Route path="inventario" element={<RutaProtegida soloAdmin><Inventario /></RutaProtegida>} />
        <Route path="productos" element={<RutaProtegida soloAdmin><Productos /></RutaProtegida>} />
        <Route path="ventas" element={<RutaProtegida soloAdmin><Ventas /></RutaProtegida>} />
        <Route path="tasas-cambio" element={<RutaProtegida soloAdmin><TasasCambio /></RutaProtegida>} />
        <Route path="cuentas-bancarias" element={<RutaProtegida soloAdmin><CuentasBancarias /></RutaProtegida>} />
        <Route path="reportes" element={<RutaProtegida soloAdmin><Reportes /></RutaProtegida>} />
        <Route path="usuarios" element={<RutaProtegida soloAdmin><Usuarios /></RutaProtegida>} />
        <Route path="catalogo" element={<RutaProtegida><Catalogo /></RutaProtegida>} />
        <Route path="toppings" element={<RutaProtegida soloAdmin><Toppings /></RutaProtegida>} />
        <Route path="categorias" element={<RutaProtegida soloAdmin><Categorias /></RutaProtegida>} />
      </Route>
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} theme="colored" />
      </BrowserRouter>
    </AuthProvider>
  );
}