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


// A dónde debe ir cada rol cuando entra a la raíz "/" o cuando le niegan una pantalla
const destinoPorRol = (rol) => {
  if (rol === 'admin') return '/dashboard';
  if (rol === 'vendedor') return '/ventas';
  return '/catalogo';
};

const RutaProtegida = ({ children, roles }) => {
  const { usuario, cargando } = useAuth();
  if (cargando) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <div className="spinner-border" style={{ color: 'var(--verde)' }} />
    </div>
  );
  if (!usuario) return <Navigate to="/login" />;
  // Si la ruta exige ciertos roles y el usuario no tiene ninguno de ellos, lo mandamos a su pantalla por defecto
  if (roles && !roles.includes(usuario.rol)) return <Navigate to={destinoPorRol(usuario.rol)} />;
  return children;
};

const AppRoutes = () => {
  const { usuario } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={!usuario ? <Login /> : <Navigate to={destinoPorRol(usuario.rol)} />} />

      {/* Pantalla pública para clientes: sin sidebar, sin login */}
      <Route path="/menu" element={<Menu />} />

      <Route path="/" element={<RutaProtegida><Layout /></RutaProtegida>}>
        <Route index element={<Navigate to={usuario ? destinoPorRol(usuario.rol) : '/login'} />} />
        <Route path="dashboard" element={<RutaProtegida roles={['admin']}><Dashboard /></RutaProtegida>} />
        <Route path="inventario" element={<RutaProtegida roles={['admin']}><Inventario /></RutaProtegida>} />
        <Route path="productos" element={<RutaProtegida roles={['admin']}><Productos /></RutaProtegida>} />
        <Route path="ventas" element={<RutaProtegida roles={['admin', 'vendedor']}><Ventas /></RutaProtegida>} />
        <Route path="tasas-cambio" element={<RutaProtegida roles={['admin']}><TasasCambio /></RutaProtegida>} />
        <Route path="cuentas-bancarias" element={<RutaProtegida roles={['admin']}><CuentasBancarias /></RutaProtegida>} />
        <Route path="reportes" element={<RutaProtegida roles={['admin']}><Reportes /></RutaProtegida>} />
        <Route path="usuarios" element={<RutaProtegida roles={['admin']}><Usuarios /></RutaProtegida>} />
        <Route path="catalogo" element={<RutaProtegida roles={['admin', 'cliente']}><Catalogo /></RutaProtegida>} />
        <Route path="toppings" element={<RutaProtegida roles={['admin']}><Toppings /></RutaProtegida>} />
        <Route path="categorias" element={<RutaProtegida roles={['admin']}><Categorias /></RutaProtegida>} />
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