import { useState, useEffect } from 'react';
import API from '../api/axios';
import { toast } from 'react-toastify';
import {
  RiAddLine, RiEditLine, RiDeleteBinLine,
  RiSearchLine, RiCloseLine, RiImageLine,
  RiToggleLine, RiMoneyDollarCircleLine
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
        width: '100%', maxWidth: 600,
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

const formVacio = {
  nombre: '', descripcion: '', categoria_id: '', inventario_id: '',
  costo_unitario_cop: '', porcentaje_ganancia: '', precio_manual_cop: '',
  usar_precio_manual: false, tiene_toppings: false, toppings_ids: [], codigo: '',
  producto_padre_id: ''
};

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [toppings, setToppings] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [modalForm, setModalForm] = useState(false);
  const [productoSel, setProductoSel] = useState(null);
  const [form, setForm] = useState(formVacio);
  const [imagen, setImagen] = useState(null);
  const [previstaImagen, setPrevistaImagen] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [tasaCop, setTasaCop] = useState(null);
  // ── Receta de insumos ──
  const [receta, setReceta] = useState([]); // [{ inventario_id, cantidad_requerida, unidad, insumo_nombre }]
  const [nuevoInsumo, setNuevoInsumo] = useState({ inventario_id: '', cantidad_requerida: '', unidad: '' });

  // Precio final en COP (manual o calculado por porcentaje de ganancia)
  const precioCalculadoCop = () => {
    if (form.usar_precio_manual && form.precio_manual_cop) return parseFloat(form.precio_manual_cop).toFixed(2);
    if (!form.costo_unitario_cop) return '0.00';
    const c = parseFloat(form.costo_unitario_cop);
    const p = parseFloat(form.porcentaje_ganancia) || 0;
    return (c + (c * p / 100)).toFixed(2);
  };

  // Estimado en USD usando la tasa COP vigente (solo referencia visual;
  // el valor que realmente se congela lo calcula el backend al guardar)
  const precioEstimadoUsd = () => {
    if (!tasaCop?.tasa_por_usd) return null;
    const cop = parseFloat(precioCalculadoCop());
    if (!cop) return null;
    return (cop / parseFloat(tasaCop.tasa_por_usd)).toFixed(2);
  };

  const cargar = async () => {
    setCargando(true);
    try {
      const [r1, r2, r3, r4, r5] = await Promise.all([
        API.get('/productos'),
        API.get('/categorias'),
        API.get('/inventario'),
        API.get('/toppings'),
        API.get('/tasas-cambio/activa/COP').catch(() => null)
      ]);
      setProductos(r1.data.productos);
      setCategorias(r2.data.categorias);
      setInventario(r3.data.inventario);
      setToppings(r4.data.toppings);
      setTasaCop(r5?.data?.tasa || null);
    } catch { toast.error('Error cargando productos'); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  const abrirCrear = () => {
    setProductoSel(null);
    setForm(formVacio);
    setImagen(null);
    setPrevistaImagen(null);
    setReceta([]);
    setNuevoInsumo({ inventario_id: '', cantidad_requerida: '', unidad: '' });
    setModalForm(true);
  };

  const abrirEditar = async (prod) => {
    setProductoSel(prod);
    setReceta([]);
    setNuevoInsumo({ inventario_id: '', cantidad_requerida: '', unidad: '' });
    try {
      const [{ data }, { data: recetaData }] = await Promise.all([
        API.get(`/productos/${prod.id}`),
        API.get(`/productos/${prod.id}/receta`)
      ]);
      const p = data.producto;
      setForm({
        nombre: p.nombre,
        descripcion: p.descripcion || '',
        categoria_id: p.categoria_id || '',
        inventario_id: p.inventario_id || '',
        costo_unitario_cop: p.costo_unitario_cop,
        porcentaje_ganancia: p.porcentaje_ganancia || '',
        precio_manual_cop: p.precio_manual_cop || '',
        usar_precio_manual: p.usar_precio_manual,
        tiene_toppings: p.tiene_toppings,
        toppings_ids: p.toppings?.map(t => t.id) || [],
        codigo: p.codigo || '',
        producto_padre_id: p.producto_padre_id || ''
      });
      setPrevistaImagen(p.imagen_url);
      setReceta(recetaData.insumos || []);
    } catch { toast.error('Error cargando producto'); }
    setImagen(null);
    setModalForm(true);
  };

  const handleImagen = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('La imagen no puede superar 5MB'); return; }
    setImagen(file);
    setPrevistaImagen(URL.createObjectURL(file));
  };

  const toggleTopping = (id) => {
    setForm(f => ({
      ...f,
      toppings_ids: f.toppings_ids.includes(id)
        ? f.toppings_ids.filter(t => t !== id)
        : [...f.toppings_ids, id]
    }));
  };

  const guardar = async () => {
    if (!form.nombre || !form.costo_unitario_cop) {
      toast.error('Nombre y costo unitario (COP) son requeridos');
      return;
    }
    if (!tasaCop) {
      toast.error('Debes cargar una tasa COP antes de crear productos');
      return;
    }
    if (form.producto_padre_id === 'pendiente') {
      toast.error('Selecciona a cuál producto principal pertenece esta variante');
      return;
    }
    setGuardando(true);
    try {
      const fd = new FormData();
      Object.keys(form).forEach(k => {
        if (k === 'toppings_ids') {
          fd.append(k, JSON.stringify(form[k]));
        } else {
          fd.append(k, form[k]);
        }
      });
      if (imagen) fd.append('imagen', imagen);

      let productoId;
      if (productoSel) {
        const { data } = await API.put(`/productos/${productoSel.id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        productoId = productoSel.id;
        toast.success('Producto actualizado');
      } else {
        const { data } = await API.post('/productos', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        productoId = data.producto.id;
        toast.success('Producto creado');
      }

      // Guardar receta de insumos (si hay alguno configurado)
      if (receta.length > 0 && productoId) {
        try {
          await API.post(`/productos/${productoId}/receta`, {
            insumos: receta.map(r => ({
              inventario_id: r.inventario_id,
              cantidad_requerida: r.cantidad_requerida,
              unidad: r.unidad || ''
            }))
          });
        } catch (eR) {
          toast.warn('Producto guardado, pero hubo un error al guardar la receta de insumos');
        }
      } else if (productoId && receta.length === 0 && productoSel) {
        // Si borraron todos los insumos al editar, limpiar receta
        await API.post(`/productos/${productoId}/receta`, { insumos: [] }).catch(() => {});
      }

      setModalForm(false);
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error guardando producto');
    } finally { setGuardando(false); }
  };

  const toggleActivo = async (prod) => {
    try {
      await API.patch(`/productos/${prod.id}/toggle`);
      toast.success(`Producto ${prod.activo ? 'desactivado' : 'activado'}`);
      cargar();
    } catch { toast.error('Error cambiando estado'); }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este producto?')) return;
    try {
      await API.delete(`/productos/${id}`);
      toast.success('Producto eliminado');
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'No se puede eliminar');
    }
  };

  const filtrados = productos.filter(p =>
    p.nombre.toLowerCase().includes((busqueda || '').toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 2 }}>Productos 🛍️</h1>
          <p style={{ color: 'var(--texto-suave)', fontSize: '0.85rem' }}>
            {productos.length} productos · {productos.filter(p => p.activo).length} activos
          </p>
        </div>
        <button className="btn-verde" onClick={abrirCrear} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RiAddLine /> Nuevo producto
        </button>
      </div>

      {/* Búsqueda */}
      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 400 }}>
        <RiSearchLine style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--texto-suave)' }} />
        <input
          className="input-mm"
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{ paddingLeft: 40 }}
        />
      </div>

      {/* Grid de productos */}
      {cargando ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div className="spinner-border" style={{ color: 'var(--verde)' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {filtrados.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: 'var(--texto-suave)' }}>
              Sin productos registrados
            </div>
          ) : filtrados.map(prod => (
            <div key={prod.id} className="card-mm" style={{ padding: 0, overflow: 'hidden', opacity: prod.activo ? 1 : 0.6 }}>
              {/* Imagen */}
              <div style={{
                height: 160, background: 'var(--crema)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', overflow: 'hidden'
              }}>
                {prod.imagen_url ? (
                  <img src={prod.imagen_url} alt={prod.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <RiImageLine style={{ fontSize: 40, color: '#BDBDBD' }} />
                )}
                {/* Badge estado */}
                <span style={{
                  position: 'absolute', top: 10, right: 10,
                  background: prod.activo ? '#E8F5E9' : '#FFEBEE',
                  color: prod.activo ? '#1B5E20' : '#C62828',
                  borderRadius: 20, padding: '3px 10px',
                  fontSize: '0.72rem', fontWeight: 700
                }}>
                  {prod.activo ? 'Activo' : 'Inactivo'}
                </span>
                {prod.tiene_toppings && (
                  <span style={{
                    position: 'absolute', top: 10, left: 10,
                    background: 'var(--naranja)', color: '#fff',
                    borderRadius: 20, padding: '3px 10px',
                    fontSize: '0.72rem', fontWeight: 700
                  }}>
                    + Toppings
                  </span>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: '14px 16px' }}>
                {prod.producto_padre_id && (
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1565C0', background: '#E3F2FD', borderRadius: 8, padding: '3px 8px', display: 'inline-block', marginBottom: 6 }}>
                    🔗 Variante de {prod.producto_padre_nombre || '—'}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{prod.nombre}</div>
                  {prod.codigo && (
                    <span style={{ fontFamily: 'monospace', fontSize: '0.68rem', fontWeight: 700, color: 'var(--texto-suave)', background: '#F0F0F0', borderRadius: 6, padding: '2px 6px', whiteSpace: 'nowrap' }}>
                      {prod.codigo}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--texto-suave)', marginBottom: 10 }}>
                  {prod.categoria || 'Sin categoría'}
                </div>

                {/* Precios */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--texto-suave)' }}>Costo</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                    ${Number(prod.costo_unitario_cop).toLocaleString('es-CO')} COP
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--texto-suave)' }}>Precio venta</span>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--verde)' }}>
                    ${Number(prod.precio_final_cop).toLocaleString('es-CO')} COP
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--texto-suave)' }}>
                    ≈ ${parseFloat(prod.precio_final_usd).toFixed(2)} USD
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--texto-suave)' }}>Ganancia</span>
                  <span style={{
                    fontSize: '0.78rem', fontWeight: 700,
                    color: '#2E7D32', background: '#E8F5E9',
                    borderRadius: 20, padding: '2px 8px'
                  }}>
                    {prod.porcentaje_ganancia_real || parseFloat(prod.porcentaje_ganancia || 0).toFixed(1)}%
                  </span>
                </div>

                {/* Acciones */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => toggleActivo(prod)} title={prod.activo ? 'Desactivar' : 'Activar'}
                    style={{ flex: 1, background: prod.activo ? '#FFF3E0' : '#E8F5E9', border: 'none', borderRadius: 10, padding: '8px', color: prod.activo ? '#E65100' : '#1B5E20', cursor: 'pointer', fontSize: '1rem' }}>
                    <RiToggleLine />
                  </button>
                  <button onClick={() => abrirEditar(prod)} title="Editar"
                    style={{ flex: 1, background: '#E3F2FD', border: 'none', borderRadius: 10, padding: '8px', color: '#1565C0', cursor: 'pointer', fontSize: '1rem' }}>
                    <RiEditLine />
                  </button>
                  <button onClick={() => eliminar(prod.id)} title="Eliminar"
                    style={{ flex: 1, background: '#FFEBEE', border: 'none', borderRadius: 10, padding: '8px', color: '#C62828', cursor: 'pointer', fontSize: '1rem' }}>
                    <RiDeleteBinLine />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      <Modal show={modalForm} onClose={() => setModalForm(false)} titulo={productoSel ? 'Editar producto' : 'Nuevo producto'}>

        {/* Tipo de producto: principal o secundario (variante) */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 8, display: 'block' }}>Tipo de producto *</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: form.producto_padre_id ? 12 : 0 }}>
            <button type="button" onClick={() => setForm({ ...form, producto_padre_id: '' })} style={{
              padding: '11px', borderRadius: 12, border: '2px solid',
              borderColor: !form.producto_padre_id ? 'var(--verde)' : '#E0E0E0',
              background: !form.producto_padre_id ? '#E8F5E9' : '#fff',
              color: !form.producto_padre_id ? 'var(--verde)' : 'var(--texto-suave)',
              fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer'
            }}>⭐ Producto principal</button>
            <button type="button" onClick={() => setForm({ ...form, producto_padre_id: form.producto_padre_id || 'pendiente' })} style={{
              padding: '11px', borderRadius: 12, border: '2px solid',
              borderColor: form.producto_padre_id ? 'var(--naranja)' : '#E0E0E0',
              background: form.producto_padre_id ? '#FFF3E0' : '#fff',
              color: form.producto_padre_id ? 'var(--naranja)' : 'var(--texto-suave)',
              fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer'
            }}>🔗 Producto secundario (variante)</button>
          </div>

          {form.producto_padre_id && (
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: 6, display: 'block', color: 'var(--texto-suave)' }}>
                ¿De cuál producto principal es variante? *
              </label>
              <select className="input-mm" value={form.producto_padre_id === 'pendiente' ? '' : form.producto_padre_id}
                onChange={e => setForm({ ...form, producto_padre_id: e.target.value })}>
                <option value="">Selecciona el producto principal...</option>
                {productos
                  .filter(p => !p.producto_padre_id && p.id !== productoSel?.id)
                  .map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
              <div style={{ fontSize: '0.72rem', color: 'var(--texto-suave)', marginTop: 6 }}>
                En el punto de venta y el catálogo, este producto no se mostrará suelto — aparecerá dentro de la ventana de variantes del producto principal elegido.
              </div>
            </div>
          )}
        </div>

        {/* Imagen */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 8, display: 'block' }}>Imagen del producto</label>
          <div style={{
            border: '2px dashed #E0E0E0', borderRadius: 14,
            height: 160, display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer',
            overflow: 'hidden', position: 'relative',
            background: previstaImagen ? 'transparent' : 'var(--crema)'
          }}
            onClick={() => document.getElementById('inputImagen').click()}
          >
            {previstaImagen ? (
              <img src={previstaImagen} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--texto-suave)' }}>
                <RiImageLine style={{ fontSize: 32, marginBottom: 8 }} />
                <div style={{ fontSize: '0.82rem' }}>Click para subir imagen</div>
                <div style={{ fontSize: '0.72rem' }}>JPG, PNG, WEBP — máx 5MB</div>
              </div>
            )}
            <input id="inputImagen" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImagen} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Nombre *</label>
            <input className="input-mm" placeholder="Ej: Maracuyá con mango" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>
              Código (SKU)
              <span style={{ marginLeft: 8, fontWeight: 400, color: 'var(--texto-suave)', fontSize: '0.75rem' }}>
                (déjalo vacío para autogenerar)
              </span>
            </label>
            <input className="input-mm" placeholder="Ej: PRD-0001 (automático si lo dejas en blanco)"
              value={form.codigo}
              onChange={e => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
              style={{ fontFamily: 'monospace', letterSpacing: 0.5 }} />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Descripción</label>
            <textarea className="input-mm" rows={2} placeholder="Descripción del producto..." value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} style={{ resize: 'none' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Categoría</label>
            <select className="input-mm" value={form.categoria_id} onChange={e => setForm({ ...form, categoria_id: e.target.value })}>
              <option value="">Sin categoría</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Inventario asociado</label>
            <select className="input-mm" value={form.inventario_id} onChange={e => setForm({ ...form, inventario_id: e.target.value })}>
              <option value="">Sin vincular</option>
              {inventario.map(i => <option key={i.id} value={i.id}>{i.nombre} ({i.cantidad} {i.unidad_medida})</option>)}
            </select>
          </div>

          {/* Costo y precio */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Costo unitario (COP) *</label>
            <input className="input-mm" type="number" step="1" min="0" placeholder="0" value={form.costo_unitario_cop} onChange={e => setForm({ ...form, costo_unitario_cop: e.target.value })} />
          </div>

          {/* Toggle precio manual */}
          <div style={{ gridColumn: '1/-1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--crema)', borderRadius: 12 }}>
              <RiMoneyDollarCircleLine style={{ color: 'var(--naranja)', fontSize: '1.2rem' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Precio manual</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--texto-suave)' }}>
                  {form.usar_precio_manual ? 'Usando precio manual fijo' : 'Calculando por porcentaje de ganancia'}
                </div>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24 }}>
                <input type="checkbox" checked={form.usar_precio_manual} onChange={e => setForm({ ...form, usar_precio_manual: e.target.checked })} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{
                  position: 'absolute', cursor: 'pointer', inset: 0,
                  background: form.usar_precio_manual ? 'var(--verde)' : '#ccc',
                  borderRadius: 24, transition: '0.3s'
                }}>
                  <span style={{
                    position: 'absolute', height: 18, width: 18,
                    left: form.usar_precio_manual ? 22 : 3, bottom: 3,
                    background: '#fff', borderRadius: '50%', transition: '0.3s'
                  }} />
                </span>
              </label>
            </div>
          </div>

          {!tasaCop && (
            <div style={{ gridColumn: '1/-1', background: '#FFF3E0', borderRadius: 12, padding: '12px 16px', fontSize: '0.8rem', color: '#E65100', fontWeight: 600 }}>
              ⚠️ No hay tasa COP cargada. Debes registrar una en Tasas de cambio antes de guardar el producto.
            </div>
          )}

          {form.usar_precio_manual ? (
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Precio de venta manual (COP)</label>
              <input className="input-mm" type="number" step="1" min="0" placeholder="0" value={form.precio_manual_cop} onChange={e => setForm({ ...form, precio_manual_cop: e.target.value })} />
            </div>
          ) : (
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Porcentaje de ganancia (%)</label>
              <input className="input-mm" type="number" step="0.1" min="0" placeholder="0" value={form.porcentaje_ganancia} onChange={e => setForm({ ...form, porcentaje_ganancia: e.target.value })} />
            </div>
          )}

          {/* Preview precio */}
          {form.costo_unitario_cop && (
            <div style={{ gridColumn: '1/-1', background: '#E8F5E9', borderRadius: 12, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
              <span style={{ fontSize: '0.85rem', color: '#1B5E20', fontWeight: 600 }}>💡 Precio final de venta</span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--verde)' }}>
                  ${Number(precioCalculadoCop()).toLocaleString('es-CO')} COP
                </div>
                {precioEstimadoUsd() && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--texto-suave)' }}>≈ ${precioEstimadoUsd()} USD</div>
                )}
              </div>
            </div>
          )}

          {/* Toppings toggle */}
          <div style={{ gridColumn: '1/-1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--crema)', borderRadius: 12 }}>
              <span style={{ fontSize: '1.1rem' }}>🍯</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>¿Tiene toppings/adicionales?</div>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24 }}>
                <input type="checkbox" checked={form.tiene_toppings} onChange={e => setForm({ ...form, tiene_toppings: e.target.checked, toppings_ids: [] })} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{
                  position: 'absolute', cursor: 'pointer', inset: 0,
                  background: form.tiene_toppings ? 'var(--naranja)' : '#ccc',
                  borderRadius: 24, transition: '0.3s'
                }}>
                  <span style={{
                    position: 'absolute', height: 18, width: 18,
                    left: form.tiene_toppings ? 22 : 3, bottom: 3,
                    background: '#fff', borderRadius: '50%', transition: '0.3s'
                  }} />
                </span>
              </label>
            </div>
          </div>

          {/* Aviso: aún no hay toppings creados en el sistema */}
          {form.tiene_toppings && toppings.filter(t => t.activo !== false).length === 0 && (
            <div style={{ gridColumn: '1/-1', background: '#FFF3E0', borderRadius: 12, padding: '14px 16px', fontSize: '0.82rem', color: '#E65100' }}>
              ⚠️ Todavía no has creado ningún topping. Ve a <strong>Toppings / Extras</strong> en el menú, créalos primero, y luego vuelve aquí para asignarlos a este producto.
            </div>
          )}

          {/* Selección de toppings */}
          {form.tiene_toppings && toppings.filter(t => t.activo !== false).length > 0 && (
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 10, display: 'block' }}>Toppings disponibles para este producto</label>
              <div style={{ border: '2px solid #E0E0E0', borderRadius: 12, overflow: 'hidden' }}>
                {toppings.filter(t => t.activo !== false).map((t, idx) => (
                  <div
                    key={t.id}
                    role="button"
                    onClick={() => toggleTopping(t.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px',
                      borderTop: idx === 0 ? 'none' : '1px solid #F0F0F0',
                      background: form.toppings_ids.includes(t.id) ? '#FFF3E0' : '#fff',
                      cursor: 'pointer', transition: 'background 0.15s'
                    }}
                  >
                    <span style={{
                      width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                      border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderColor: form.toppings_ids.includes(t.id) ? 'var(--naranja)' : '#CCC',
                      background: form.toppings_ids.includes(t.id) ? 'var(--naranja)' : '#fff',
                      color: '#fff', fontSize: '0.75rem'
                    }}>
                      {form.toppings_ids.includes(t.id) && '✓'}
                    </span>
                    <span style={{
                      flex: 1, fontFamily: 'Poppins', fontWeight: 600, fontSize: '0.85rem',
                      color: form.toppings_ids.includes(t.id) ? 'var(--naranja)' : 'var(--texto-suave)'
                    }}>
                      {t.nombre}
                    </span>
                    <span style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.82rem', color: form.toppings_ids.includes(t.id) ? 'var(--naranja)' : '#9E9E9E' }}>
                      {parseFloat(t.precio_usd) > 0 ? `+$${parseFloat(t.precio_usd).toFixed(2)}` : 'Gratis'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Sección de Insumos (receta) ── */}
        <div style={{ marginTop: 24, borderTop: '2px dashed #E0E0E0', paddingTop: 20 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>📦 Insumos que consume este producto</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--texto-suave)', marginBottom: 16 }}>
            Al vender 1 unidad se descontará la cantidad indicada de cada insumo.
          </div>

          {/* Lista de insumos agregados */}
          {receta.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {receta.map((ins, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F9F9F9', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600 }}>
                    {ins.insumo_nombre || inventario.find(i => i.id === parseInt(ins.inventario_id))?.nombre || `Insumo #${ins.inventario_id}`}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--naranja)', fontWeight: 700, minWidth: 80 }}>
                    {ins.cantidad_requerida} {ins.unidad || ''}
                  </div>
                  <button onClick={() => setReceta(r => r.filter((_, i) => i !== idx))}
                    style={{ background: '#FFEBEE', border: 'none', borderRadius: 8, padding: '5px 8px', color: '#C62828', cursor: 'pointer', fontSize: '0.85rem' }}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Agregar nuevo insumo */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: 4, display: 'block', color: 'var(--texto-suave)' }}>Insumo</label>
              <select className="input-mm" value={nuevoInsumo.inventario_id}
                onChange={e => setNuevoInsumo(n => ({ ...n, inventario_id: e.target.value }))}>
                <option value="">Seleccionar insumo...</option>
                {inventario.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.nombre} (stock: {i.cantidad} {i.unidad_medida || ''})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: 4, display: 'block', color: 'var(--texto-suave)' }}>Cantidad</label>
              <input className="input-mm" type="number" step="0.01" min="0.01" placeholder="Ej: 150"
                value={nuevoInsumo.cantidad_requerida}
                onChange={e => setNuevoInsumo(n => ({ ...n, cantidad_requerida: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: 4, display: 'block', color: 'var(--texto-suave)' }}>Unidad</label>
              <input className="input-mm" placeholder="g, ml, kg..." value={nuevoInsumo.unidad}
                onChange={e => setNuevoInsumo(n => ({ ...n, unidad: e.target.value }))} />
            </div>
            <button
              onClick={() => {
                if (!nuevoInsumo.inventario_id || !nuevoInsumo.cantidad_requerida || parseFloat(nuevoInsumo.cantidad_requerida) <= 0) {
                  toast.error('Selecciona un insumo y una cantidad válida');
                  return;
                }
                const yaExiste = receta.some(r => String(r.inventario_id) === String(nuevoInsumo.inventario_id));
                if (yaExiste) {
                  toast.error('Este insumo ya está en la receta');
                  return;
                }
                const insumoInfo = inventario.find(i => i.id === parseInt(nuevoInsumo.inventario_id));
                setReceta(r => [...r, {
                  inventario_id: parseInt(nuevoInsumo.inventario_id),
                  cantidad_requerida: parseFloat(nuevoInsumo.cantidad_requerida),
                  unidad: nuevoInsumo.unidad,
                  insumo_nombre: insumoInfo?.nombre || ''
                }]);
                setNuevoInsumo({ inventario_id: '', cantidad_requerida: '', unidad: '' });
              }}
              style={{ background: 'var(--verde)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 14px', cursor: 'pointer', fontFamily: 'Poppins', fontWeight: 700, fontSize: '1.1rem', whiteSpace: 'nowrap' }}>
              +
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
          <button onClick={() => setModalForm(false)} style={{ padding: '10px 20px', borderRadius: 12, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontFamily: 'Poppins', fontWeight: 600 }}>
            Cancelar
          </button>
          <button className="btn-verde" onClick={guardar} disabled={guardando || !tasaCop}>
            {guardando ? <span className="spinner-border spinner-border-sm me-2" /> : null}
            {guardando ? 'Guardando...' : productoSel ? 'Actualizar' : 'Crear producto'}
          </button>
        </div>
      </Modal>
    </div>
  );
}