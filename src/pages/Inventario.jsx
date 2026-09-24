import { useState, useEffect, useMemo } from 'react';
import API from '../api/axios';
import { toast } from 'react-toastify';
import {
  RiAddLine, RiEditLine, RiDeleteBinLine,
  RiSearchLine, RiCloseLine, RiArchiveLine,
  RiAddCircleLine, RiArrowUpLine, RiArrowDownLine,
  RiArrowLeftSLine, RiArrowRightSLine
} from 'react-icons/ri';

const Modal = ({ show, onClose, children, titulo }) => {
  if (!show) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1050,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16
    }}>
      <div style={{
        background: '#fff', borderRadius: 20,
        width: '100%', maxWidth: 560,
        maxHeight: '92vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
      }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #F0F0F0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, background: '#fff', zIndex: 1
        }}>
          <h5 style={{ fontWeight: 700, margin: 0 }}>{titulo}</h5>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: 'var(--texto-suave)' }}>
            <RiCloseLine />
          </button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
};

const camposVacios = {
  nombre: '', descripcion: '', categoria_id: '',
  cantidad: '', unidad_medida: '', costo_total: '',
  moneda_compra: 'USD', tasa_cambio: '',
  proveedor: '', fecha_compra: '', codigo: ''
};

const opcionesOrden = [
  { v: 'fecha_creacion', label: 'Fecha de creación' },
  { v: 'nombre', label: 'Nombre' },
  { v: 'cantidad', label: 'Cantidad' },
  { v: 'costo_total', label: 'Costo total' },
  { v: 'costo_total_usd', label: 'Equivalente USD' }
];

const opcionesPorPagina = [10, 25, 50, 100];

// Fecha de creación en ms. Ajusta los nombres si tu API usa otro campo.
const fechaCreacionMs = (item) => {
  const f = item.created_at || item.fecha_creacion || item.creado_en || item.createdAt;
  const t = f ? new Date(f).getTime() : NaN;
  return Number.isNaN(t) ? null : t;
};

const formatoFechaCreacion = (item) => {
  const t = fechaCreacionMs(item);
  return t === null
    ? '—'
    : new Date(t).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Devuelve p. ej. [1, '...', 4, 5, 6, '...', 12]
const numerosPagina = (actual, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const paginas = new Set([1, total, actual - 1, actual, actual + 1]);
  const ordenadas = [...paginas].filter(p => p >= 1 && p <= total).sort((a, b) => a - b);
  const resultado = [];
  ordenadas.forEach((p, i) => {
    if (i > 0 && p - ordenadas[i - 1] > 1) resultado.push('...');
    resultado.push(p);
  });
  return resultado;
};

export default function Inventario() {
  const [items, setItems] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [modalForm, setModalForm] = useState(false);
  const [modalAjuste, setModalAjuste] = useState(false);
  const [itemSeleccionado, setItemSeleccionado] = useState(null);
  const [form, setForm] = useState(camposVacios);
  const [ajuste, setAjuste] = useState({ cantidad: '', operacion: 'sumar' });
  const [guardando, setGuardando] = useState(false);

  // Filtros, orden y paginación
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroMoneda, setFiltroMoneda] = useState('');
  const [ordenarPor, setOrdenarPor] = useState('fecha_creacion');
  const [direccion, setDireccion] = useState('desc'); // 'asc' | 'desc'
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(10);

  const cargar = async () => {
    setCargando(true);
    try {
      const [r1, r2] = await Promise.all([
        API.get('/inventario'),
        API.get('/categorias')
      ]);
      setItems(r1.data.inventario);
      setCategorias(r2.data.categorias);
    } catch { toast.error('Error cargando inventario'); }
    finally { setCargando(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargar(); }, []);

  // Al cambiar filtros u orden, volver a la primera página
  useEffect(() => {
    setPagina(1);
  }, [busqueda, filtroCategoria, filtroMoneda, ordenarPor, direccion, porPagina]);

  const abrirCrear = () => {
    setItemSeleccionado(null);
    setForm(camposVacios);
    setModalForm(true);
  };

  const abrirEditar = (item) => {
    setItemSeleccionado(item);
    setForm({
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      categoria_id: item.categoria_id || '',
      cantidad: item.cantidad,
      unidad_medida: item.unidad_medida || '',
      costo_total: item.costo_total,
      moneda_compra: item.moneda_compra || 'USD',
      tasa_cambio: item.tasa_cambio || '',
      proveedor: item.proveedor || '',
      fecha_compra: item.fecha_compra?.split('T')[0] || '',
      codigo: item.codigo || ''
    });
    setModalForm(true);
  };

  const abrirAjuste = (item) => {
    setItemSeleccionado(item);
    setAjuste({ cantidad: '', operacion: 'sumar' });
    setModalAjuste(true);
  };

  const guardar = async () => {
    if (!form.nombre || !form.cantidad || !form.costo_total || !form.moneda_compra) {
      toast.error('Nombre, cantidad, costo total y moneda son requeridos');
      return;
    }
    if (form.moneda_compra !== 'USD' && !form.tasa_cambio) {
      const continuar = window.confirm('No ingresaste tasa de cambio. El equivalente en USD no se calculará. ¿Continuar?');
      if (!continuar) return;
    }
    setGuardando(true);
    try {
      if (itemSeleccionado) {
        await API.put(`/inventario/${itemSeleccionado.id}`, form);
        toast.success('Inventario actualizado');
      } else {
        await API.post('/inventario', form);
        toast.success('Item creado exitosamente');
      }
      setModalForm(false);
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error guardando');
    } finally { setGuardando(false); }
  };

  const guardarAjuste = async () => {
    if (!ajuste.cantidad) { toast.error('Ingresa la cantidad'); return; }
    setGuardando(true);
    try {
      await API.patch(`/inventario/${itemSeleccionado.id}/cantidad`, ajuste);
      toast.success('Cantidad ajustada');
      setModalAjuste(false);
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error ajustando');
    } finally { setGuardando(false); }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este item?')) return;
    try {
      await API.delete(`/inventario/${id}`);
      toast.success('Item eliminado');
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'No se puede eliminar');
    }
  };

  const hayFiltros = busqueda !== '' || filtroCategoria !== '' || filtroMoneda !== '';

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroCategoria('');
    setFiltroMoneda('');
  };

  // 1) Filtrar
  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    return items.filter(i => {
      const coincideTexto =
        i.nombre.toLowerCase().includes(q) ||
        (i.proveedor || '').toLowerCase().includes(q);

      const coincideCategoria =
        filtroCategoria === '' ? true
          : filtroCategoria === 'sin' ? !i.categoria_id
            : String(i.categoria_id) === filtroCategoria;

      const coincideMoneda =
        filtroMoneda === '' ? true : (i.moneda_compra || 'USD') === filtroMoneda;

      return coincideTexto && coincideCategoria && coincideMoneda;
    });
  }, [items, busqueda, filtroCategoria, filtroMoneda]);

  // 2) Ordenar (ascendente / descendente)
  const ordenados = useMemo(() => {
    const dir = direccion === 'asc' ? 1 : -1;
    const num = (v) => parseFloat(v) || 0;

    return [...filtrados].sort((a, b) => {
      let res = 0;
      switch (ordenarPor) {
        case 'nombre':
          res = a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
          break;
        case 'cantidad':
          res = num(a.cantidad) - num(b.cantidad);
          break;
        case 'costo_total':
          res = num(a.costo_total) - num(b.costo_total);
          break;
        case 'costo_total_usd':
          res = num(a.costo_total_usd) - num(b.costo_total_usd);
          break;
        case 'fecha_creacion':
        default: {
          const fa = fechaCreacionMs(a);
          const fb = fechaCreacionMs(b);
          // Si el API no trae fecha, se usa el id como respaldo (a mayor id, más reciente)
          res = (fa !== null && fb !== null)
            ? fa - fb
            : (Number(a.id) || 0) - (Number(b.id) || 0);
        }
      }
      return res * dir;
    });
  }, [filtrados, ordenarPor, direccion]);

  // 3) Paginar
  const totalPaginas = Math.max(1, Math.ceil(ordenados.length / porPagina));
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * porPagina;
  const visibles = ordenados.slice(inicio, inicio + porPagina);

  const etiquetaDireccion = ordenarPor === 'fecha_creacion'
    ? (direccion === 'asc' ? 'Más antiguos primero' : 'Más recientes primero')
    : (direccion === 'asc' ? 'Ascendente' : 'Descendente');

  const costoTotalUSD = filtrados.reduce((acc, i) => acc + parseFloat(i.costo_total_usd || 0), 0);
  const inversionTotal = filtrados.reduce((acc, i) => acc + parseFloat(i.costo_total || 0), 0);

  const simboloMoneda = (moneda) => moneda === 'USD' ? '$' : moneda === 'BS' ? 'Bs.' : 'COP$';

  // Formato del costo unitario: siempre 2 decimales, en cualquier moneda.
  const formatoCostoUnitario = (valor, moneda) => {
    const num = parseFloat(valor) || 0;
    if (moneda === 'COP') {
      return num.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return num.toFixed(2);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 2 }}>Inventario 📦</h1>
          <p style={{ color: 'var(--texto-suave)', fontSize: '0.85rem' }}>
            {items.length} items
            {costoTotalUSD > 0 && (
              <span> · Inversión: <strong style={{ color: 'var(--verde)' }}>${costoTotalUSD.toFixed(2)} USD</strong></span>
            )}
          </p>
        </div>
        <button className="btn-verde" onClick={abrirCrear} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RiAddLine /> Nuevo item
        </button>
      </div>

      {/* Búsqueda, filtros y orden */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 400 }}>
          <RiSearchLine style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--texto-suave)' }} />
          <input
            className="input-mm"
            placeholder="Buscar por nombre o proveedor..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ paddingLeft: 40 }}
          />
        </div>

        <select className="input-mm" style={{ width: 'auto', minWidth: 160 }}
          value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}
          title="Filtrar por categoría">
          <option value="">Todas las categorías</option>
          <option value="sin">Sin categoría</option>
          {categorias.map(c => <option key={c.id} value={String(c.id)}>{c.nombre}</option>)}
        </select>

        <select className="input-mm" style={{ width: 'auto', minWidth: 140 }}
          value={filtroMoneda} onChange={e => setFiltroMoneda(e.target.value)}
          title="Filtrar por moneda">
          <option value="">Todas las monedas</option>
          <option value="USD">💵 USD</option>
          <option value="BS">🇻🇪 BS</option>
          <option value="COP">🇨🇴 COP</option>
        </select>

        <select className="input-mm" style={{ width: 'auto', minWidth: 170 }}
          value={ordenarPor} onChange={e => setOrdenarPor(e.target.value)}
          title="Ordenar por">
          {opcionesOrden.map(o => <option key={o.v} value={o.v}>Ordenar: {o.label}</option>)}
        </select>

        <button type="button"
          onClick={() => setDireccion(d => d === 'asc' ? 'desc' : 'asc')}
          title="Cambiar dirección del orden"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 14px', borderRadius: 12, border: '2px solid var(--verde)',
            background: '#E8F5E9', color: 'var(--verde)',
            fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap'
          }}>
          {direccion === 'asc' ? <RiArrowUpLine /> : <RiArrowDownLine />}
          {etiquetaDireccion}
        </button>

        {hayFiltros && (
          <button type="button" onClick={limpiarFiltros}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 14px', borderRadius: 12, border: '1px solid #E0E0E0',
              background: '#fff', color: 'var(--texto-suave)',
              fontFamily: 'Poppins', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer'
            }}>
            <RiCloseLine /> Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla */}
      {cargando ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div className="spinner-border" style={{ color: 'var(--verde)' }} />
        </div>
      ) : (
        <div className="card-mm" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--crema)', borderBottom: '2px solid #F0F0F0' }}>
                  {['Código', 'Producto', 'Categoría', 'Cantidad', 'Unidad', 'Costo Total', 'Moneda', 'Costo Unit.', 'Equiv. USD', 'Proveedor', 'Creado', 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, fontSize: '0.78rem', color: 'var(--texto-suave)', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibles.length === 0 ? (
                  <tr>
                    <td colSpan={12} style={{ textAlign: 'center', padding: 48, color: 'var(--texto-suave)' }}>
                      <RiArchiveLine style={{ fontSize: 36, display: 'block', margin: '0 auto 8px' }} />
                      {items.length === 0 ? 'Sin items en inventario' : 'Ningún item coincide con los filtros'}
                    </td>
                  </tr>
                ) : visibles.map(item => (
                  <tr key={item.id}
                    style={{ borderBottom: '1px solid #F9F9F9', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Código */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700, color: 'var(--texto-suave)', background: '#F0F0F0', borderRadius: 6, padding: '2px 8px' }}>
                        {item.codigo || '—'}
                      </span>
                    </td>

                    {/* Producto */}
                    <td style={{ padding: '14px 16px', fontWeight: 600, minWidth: 140 }}>
                      {item.nombre}
                      {item.descripcion && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--texto-suave)', fontWeight: 400 }}>
                          {item.descripcion}
                        </div>
                      )}
                    </td>

                    {/* Categoría */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ background: '#E8F5E9', color: '#1B5E20', borderRadius: 20, padding: '3px 10px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {item.categoria || 'Sin categoría'}
                      </span>
                    </td>

                    {/* Cantidad */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        fontWeight: 700,
                        color: item.cantidad <= 5 ? '#C62828' : item.cantidad <= 15 ? '#E65100' : '#1B5E20'
                      }}>
                        {item.cantidad}
                      </span>
                      {item.cantidad <= 5 && (
                        <span style={{ marginLeft: 6, background: '#FFEBEE', color: '#C62828', borderRadius: 20, padding: '1px 7px', fontSize: '0.68rem', fontWeight: 700 }}>
                          ⚠️ Bajo
                        </span>
                      )}
                    </td>

                    {/* Unidad */}
                    <td style={{ padding: '14px 16px', color: 'var(--texto-suave)' }}>
                      {item.unidad_medida || '—'}
                    </td>

                    {/* Costo total en moneda original */}
                    <td style={{ padding: '14px 16px', fontWeight: 600 }}>
                      {simboloMoneda(item.moneda_compra || 'USD')} {parseFloat(item.costo_total).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Badge moneda */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        borderRadius: 20, padding: '3px 10px', fontSize: '0.75rem', fontWeight: 700,
                        background: item.moneda_compra === 'USD' ? '#E8F5E9' : item.moneda_compra === 'BS' ? '#E3F2FD' : '#FFF3E0',
                        color: item.moneda_compra === 'USD' ? '#1B5E20' : item.moneda_compra === 'BS' ? '#1565C0' : '#E65100'
                      }}>
                        {item.moneda_compra === 'USD' ? '💵 USD' : item.moneda_compra === 'BS' ? '🇻🇪 BS' : '🇨🇴 COP'}
                      </span>
                    </td>

                    {/* Costo unitario en moneda original */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ color: 'var(--naranja)', fontWeight: 600, fontSize: '0.82rem' }}>
                        {simboloMoneda(item.moneda_compra || 'USD')} {formatoCostoUnitario(item.costo_unitario, item.moneda_compra)}
                      </div>
                      {item.tasa_cambio && item.moneda_compra !== 'USD' && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--texto-suave)', marginTop: 2 }}>
                          Tasa: {parseFloat(item.tasa_cambio).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      )}
                    </td>

                    {/* Equivalente USD */}
                    <td style={{ padding: '14px 16px' }}>
                      {item.costo_total_usd ? (
                        <div>
                          <div style={{ color: 'var(--verde)', fontWeight: 700, fontSize: '0.82rem' }}>
                            ${parseFloat(item.costo_total_usd).toFixed(2)}
                          </div>
                          <div style={{ color: 'var(--texto-suave)', fontSize: '0.72rem' }}>
                            unit: ${parseFloat(item.costo_unitario_usd || 0).toFixed(2)}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#BDBDBD', fontSize: '0.78rem' }}>Sin tasa</span>
                      )}
                    </td>

                    {/* Proveedor */}
                    <td style={{ padding: '14px 16px', color: 'var(--texto-suave)' }}>
                      {item.proveedor || '—'}
                    </td>

                    {/* Fecha de creación */}
                    <td style={{ padding: '14px 16px', color: 'var(--texto-suave)', whiteSpace: 'nowrap' }}>
                      {formatoFechaCreacion(item)}
                    </td>

                    {/* Acciones */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => abrirAjuste(item)} title="Ajustar cantidad"
                          style={{ background: '#E8F5E9', border: 'none', borderRadius: 8, padding: '6px 9px', color: '#1B5E20', cursor: 'pointer', fontSize: '0.95rem' }}>
                          <RiAddCircleLine />
                        </button>
                        <button onClick={() => abrirEditar(item)} title="Editar"
                          style={{ background: '#E3F2FD', border: 'none', borderRadius: 8, padding: '6px 9px', color: '#1565C0', cursor: 'pointer', fontSize: '0.95rem' }}>
                          <RiEditLine />
                        </button>
                        <button onClick={() => eliminar(item.id)} title="Eliminar"
                          style={{ background: '#FFEBEE', border: 'none', borderRadius: 8, padding: '6px 9px', color: '#C62828', cursor: 'pointer', fontSize: '0.95rem' }}>
                          <RiDeleteBinLine />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {ordenados.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: 12, padding: '14px 16px', borderTop: '1px solid #F0F0F0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.8rem', color: 'var(--texto-suave)', flexWrap: 'wrap' }}>
                <span>
                  Mostrando <strong>{inicio + 1}–{Math.min(inicio + porPagina, ordenados.length)}</strong> de <strong>{ordenados.length}</strong>
                </span>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                  Por página
                  <select className="input-mm" style={{ width: 'auto', padding: '4px 8px' }}
                    value={porPagina} onChange={e => setPorPagina(Number(e.target.value))}>
                    {opcionesPorPagina.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button type="button" disabled={paginaActual === 1}
                  onClick={() => setPagina(paginaActual - 1)} title="Anterior"
                  style={{
                    display: 'flex', alignItems: 'center', padding: '6px 8px', borderRadius: 8,
                    border: '1px solid #E0E0E0', background: '#fff',
                    cursor: paginaActual === 1 ? 'not-allowed' : 'pointer',
                    opacity: paginaActual === 1 ? 0.4 : 1
                  }}>
                  <RiArrowLeftSLine />
                </button>

                {numerosPagina(paginaActual, totalPaginas).map((p, idx) => (
                  p === '...' ? (
                    <span key={`e${idx}`} style={{ padding: '0 4px', color: 'var(--texto-suave)' }}>…</span>
                  ) : (
                    <button key={p} type="button" onClick={() => setPagina(p)}
                      style={{
                        minWidth: 34, padding: '6px 8px', borderRadius: 8, border: '1px solid',
                        borderColor: p === paginaActual ? 'var(--verde)' : '#E0E0E0',
                        background: p === paginaActual ? 'var(--verde)' : '#fff',
                        color: p === paginaActual ? '#fff' : 'inherit',
                        fontFamily: 'Poppins', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer'
                      }}>
                      {p}
                    </button>
                  )
                ))}

                <button type="button" disabled={paginaActual === totalPaginas}
                  onClick={() => setPagina(paginaActual + 1)} title="Siguiente"
                  style={{
                    display: 'flex', alignItems: 'center', padding: '6px 8px', borderRadius: 8,
                    border: '1px solid #E0E0E0', background: '#fff',
                    cursor: paginaActual === totalPaginas ? 'not-allowed' : 'pointer',
                    opacity: paginaActual === totalPaginas ? 0.4 : 1
                  }}>
                  <RiArrowRightSLine />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Form */}
      <Modal show={modalForm} onClose={() => setModalForm(false)} titulo={itemSeleccionado ? 'Editar item' : 'Nuevo item de inventario'}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Nombre *</label>
            <input className="input-mm" placeholder="Ej: Mangos Tommy" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
          </div>

          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>
              Código (SKU)
              <span style={{ marginLeft: 8, fontWeight: 400, color: 'var(--texto-suave)', fontSize: '0.75rem' }}>
                (déjalo vacío para autogenerar)
              </span>
            </label>
            <input className="input-mm" placeholder="Ej: INV-0001 (automático si lo dejas en blanco)"
              value={form.codigo}
              onChange={e => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
              style={{ fontFamily: 'monospace', letterSpacing: 0.5 }} />
          </div>

          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Descripción</label>
            <textarea className="input-mm" rows={2} placeholder="Descripción opcional..." value={form.descripcion}
              onChange={e => setForm({ ...form, descripcion: e.target.value })} style={{ resize: 'none' }} />
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Categoría</label>
            <select className="input-mm" value={form.categoria_id} onChange={e => setForm({ ...form, categoria_id: e.target.value })}>
              <option value="">Sin categoría</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Unidad de medida</label>
            <select className="input-mm" value={form.unidad_medida} onChange={e => setForm({ ...form, unidad_medida: e.target.value })}>
              <option value="">Seleccionar</option>
              {['Unidades', 'Kg', 'Gramos', 'Litros', 'Ml', 'Cajas', 'Paquetes'].map(u => <option key={u}>{u}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Cantidad *</label>
            <input className="input-mm" type="number" min="0" placeholder="24"
              value={form.cantidad} onChange={e => setForm({ ...form, cantidad: e.target.value })} />
          </div>

          {/* Moneda de compra */}
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 8, display: 'block' }}>Moneda de compra *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { v: 'USD', label: '💵 Dólar USD' },
                { v: 'BS', label: '🇻🇪 Bolívar Bs' },
                { v: 'COP', label: '🇨🇴 Peso COP' }
              ].map(m => (
                <button key={m.v} type="button"
                  onClick={() => setForm({ ...form, moneda_compra: m.v, tasa_cambio: '' })}
                  style={{
                    padding: '10px 6px', borderRadius: 12, border: '2px solid',
                    borderColor: form.moneda_compra === m.v ? 'var(--verde)' : '#E0E0E0',
                    background: form.moneda_compra === m.v ? '#E8F5E9' : '#fff',
                    color: form.moneda_compra === m.v ? 'var(--verde)' : 'var(--texto-suave)',
                    fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer'
                  }}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Costo total */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>
              Costo total ({form.moneda_compra}) *
            </label>
            <input className="input-mm" type="number" step="0.01" min="0"
              placeholder={form.moneda_compra === 'BS' ? 'Ej: 880.00' : form.moneda_compra === 'COP' ? 'Ej: 48000' : 'Ej: 12.00'}
              value={form.costo_total}
              onChange={e => setForm({ ...form, costo_total: e.target.value })} />
          </div>

          {/* Tasa de cambio solo si no es USD */}
          {form.moneda_compra !== 'USD' ? (
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>
                Tasa usada (1 USD = ? {form.moneda_compra})
                <span style={{ color: 'var(--texto-suave)', fontWeight: 400, marginLeft: 4 }}>(opcional)</span>
              </label>
              <input className="input-mm" type="number" step="0.01" min="0"
                placeholder={form.moneda_compra === 'BS' ? 'Ej: 36.50' : 'Ej: 4050'}
                value={form.tasa_cambio}
                onChange={e => setForm({ ...form, tasa_cambio: e.target.value })} />
            </div>
          ) : (
            <div />
          )}

          {/* Preview cálculo */}
          {form.cantidad && form.costo_total && (
            <div style={{ gridColumn: '1/-1', background: '#E8F5E9', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ fontSize: '0.8rem', color: '#1B5E20', fontWeight: 700, marginBottom: 10 }}>
                💡 Resumen de costos
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
                <div style={{ background: '#fff', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--texto-suave)', marginBottom: 4 }}>Costo unitario ({form.moneda_compra})</div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--naranja)' }}>
                    {form.moneda_compra === 'USD' ? '$' : form.moneda_compra === 'BS' ? 'Bs.' : 'COP$'} {formatoCostoUnitario(parseFloat(form.costo_total) / parseInt(form.cantidad || 1), form.moneda_compra)}
                  </div>
                </div>

                {form.moneda_compra !== 'USD' && form.tasa_cambio && parseFloat(form.tasa_cambio) > 0 && (
                  <>
                    <div style={{ background: '#fff', borderRadius: 10, padding: '10px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--texto-suave)', marginBottom: 4 }}>Total en USD</div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--verde)' }}>
                        ${(parseFloat(form.costo_total) / parseFloat(form.tasa_cambio)).toFixed(2)}
                      </div>
                    </div>
                    <div style={{ background: '#fff', borderRadius: 10, padding: '10px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--texto-suave)', marginBottom: 4 }}>Costo unit. USD</div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--verde)' }}>
                        ${(parseFloat(form.costo_total) / parseFloat(form.tasa_cambio) / parseInt(form.cantidad || 1)).toFixed(2)}
                      </div>
                    </div>
                  </>
                )}

                {form.moneda_compra !== 'USD' && !form.tasa_cambio && (
                  <div style={{ background: '#FFF3E0', borderRadius: 10, padding: '10px 14px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#E65100', fontWeight: 600 }}>
                      ⚠️ Sin tasa: no se calculará equivalente USD
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Proveedor</label>
            <input className="input-mm" placeholder="Nombre del proveedor"
              value={form.proveedor} onChange={e => setForm({ ...form, proveedor: e.target.value })} />
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Fecha de compra</label>
            <input className="input-mm" type="date" value={form.fecha_compra}
              onChange={e => setForm({ ...form, fecha_compra: e.target.value })} />
          </div>

        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
          <button onClick={() => setModalForm(false)}
            style={{ padding: '10px 20px', borderRadius: 12, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontFamily: 'Poppins', fontWeight: 600 }}>
            Cancelar
          </button>
          <button className="btn-verde" onClick={guardar} disabled={guardando}>
            {guardando ? <span className="spinner-border spinner-border-sm me-2" /> : null}
            {guardando ? 'Guardando...' : itemSeleccionado ? 'Actualizar' : 'Crear item'}
          </button>
        </div>
      </Modal>

      {/* Modal Ajuste Cantidad */}
      <Modal show={modalAjuste} onClose={() => setModalAjuste(false)} titulo={`Ajustar cantidad — ${itemSeleccionado?.nombre}`}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--verde)' }}>
            {itemSeleccionado?.cantidad}
          </div>
          <div style={{ color: 'var(--texto-suave)', fontSize: '0.85rem' }}>
            {itemSeleccionado?.unidad_medida || 'unidades'} actuales
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {[{ v: 'sumar', label: '➕ Sumar' }, { v: 'restar', label: '➖ Restar' }].map(op => (
            <button key={op.v} onClick={() => setAjuste({ ...ajuste, operacion: op.v })} style={{
              flex: 1, padding: '12px', borderRadius: 12, border: '2px solid',
              borderColor: ajuste.operacion === op.v ? 'var(--verde)' : '#E0E0E0',
              background: ajuste.operacion === op.v ? '#E8F5E9' : '#fff',
              color: ajuste.operacion === op.v ? 'var(--verde)' : 'var(--texto-suave)',
              fontFamily: 'Poppins', fontWeight: 600, cursor: 'pointer'
            }}>
              {op.label}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>
            Cantidad a {ajuste.operacion}
          </label>
          <input className="input-mm" type="number" min="1" placeholder="Ej: 10"
            value={ajuste.cantidad} onChange={e => setAjuste({ ...ajuste, cantidad: e.target.value })} />
        </div>

        {ajuste.cantidad && (
          <div style={{ background: '#E8F5E9', borderRadius: 12, padding: '12px 16px', marginBottom: 20, textAlign: 'center' }}>
            <span style={{ color: '#1B5E20', fontWeight: 600, fontSize: '0.88rem' }}>
              Resultado: {itemSeleccionado?.cantidad} {ajuste.operacion === 'sumar' ? '+' : '-'} {ajuste.cantidad} = <strong>
                {ajuste.operacion === 'sumar'
                  ? parseInt(itemSeleccionado?.cantidad) + parseInt(ajuste.cantidad)
                  : parseInt(itemSeleccionado?.cantidad) - parseInt(ajuste.cantidad)
                }
              </strong> {itemSeleccionado?.unidad_medida || 'unidades'}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={() => setModalAjuste(false)}
            style={{ padding: '10px 20px', borderRadius: 12, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontFamily: 'Poppins', fontWeight: 600 }}>
            Cancelar
          </button>
          <button className="btn-verde" onClick={guardarAjuste} disabled={guardando}>
            {guardando ? 'Ajustando...' : 'Confirmar ajuste'}
          </button>
        </div>
      </Modal>
    </div>
  );
}