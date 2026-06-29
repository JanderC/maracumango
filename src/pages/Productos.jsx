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
  costo_unitario: '', porcentaje_ganancia: '', precio_manual: '',
  usar_precio_manual: false, tiene_toppings: false, toppings_ids: []
};

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [toppings, setToppings] = useState([]);
  const [busqueda, setBusqueda] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalForm, setModalForm] = useState(false);
  const [productoSel, setProductoSel] = useState(null);
  const [form, setForm] = useState(formVacio);
  const [imagen, setImagen] = useState(null);
  const [previstaImagen, setPrevistaImagen] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const precioCalculado = () => {
    if (form.usar_precio_manual && form.precio_manual) return parseFloat(form.precio_manual).toFixed(2);
    if (!form.costo_unitario) return '0.00';
    const c = parseFloat(form.costo_unitario);
    const p = parseFloat(form.porcentaje_ganancia) || 0;
    return (c + (c * p / 100)).toFixed(2);
  };

  const cargar = async () => {
    setCargando(true);
    try {
      const [r1, r2, r3, r4] = await Promise.all([
        API.get('/productos'),
        API.get('/categorias'),
        API.get('/inventario'),
        API.get('/toppings')
      ]);
      setProductos(r1.data.productos);
      setCategorias(r2.data.categorias);
      setInventario(r3.data.inventario);
      setToppings(r4.data.toppings);
    } catch { toast.error('Error cargando productos'); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  const abrirCrear = () => {
    setProductoSel(null);
    setForm(formVacio);
    setImagen(null);
    setPrevistaImagen(null);
    setModalForm(true);
  };

  const abrirEditar = async (prod) => {
    setProductoSel(prod);
    try {
      const { data } = await API.get(`/productos/${prod.id}`);
      const p = data.producto;
      setForm({
        nombre: p.nombre,
        descripcion: p.descripcion || '',
        categoria_id: p.categoria_id || '',
        inventario_id: p.inventario_id || '',
        costo_unitario: p.costo_unitario,
        porcentaje_ganancia: p.porcentaje_ganancia || '',
        precio_manual: p.precio_manual || '',
        usar_precio_manual: p.usar_precio_manual,
        tiene_toppings: p.tiene_toppings,
        toppings_ids: p.toppings?.map(t => t.id) || []
      });
      setPrevistaImagen(p.imagen_url);
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
    if (!form.nombre || !form.costo_unitario) {
      toast.error('Nombre y costo unitario son requeridos');
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

      if (productoSel) {
        await API.put(`/productos/${productoSel.id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Producto actualizado');
      } else {
        await API.post('/productos', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Producto creado');
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
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>{prod.nombre}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--texto-suave)', marginBottom: 10 }}>
                  {prod.categoria || 'Sin categoría'}
                </div>

                {/* Precios */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--texto-suave)' }}>Costo</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>${parseFloat(prod.costo_unitario).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--texto-suave)' }}>Precio venta</span>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--verde)' }}>${parseFloat(prod.precio_final_usd).toFixed(2)}</span>
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
            <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Costo unitario ($) *</label>
            <input className="input-mm" type="number" step="0.01" min="0" placeholder="0.00" value={form.costo_unitario} onChange={e => setForm({ ...form, costo_unitario: e.target.value })} />
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

          {form.usar_precio_manual ? (
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Precio de venta manual ($)</label>
              <input className="input-mm" type="number" step="0.01" min="0" placeholder="0.00" value={form.precio_manual} onChange={e => setForm({ ...form, precio_manual: e.target.value })} />
            </div>
          ) : (
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Porcentaje de ganancia (%)</label>
              <input className="input-mm" type="number" step="0.1" min="0" placeholder="0" value={form.porcentaje_ganancia} onChange={e => setForm({ ...form, porcentaje_ganancia: e.target.value })} />
            </div>
          )}

          {/* Preview precio */}
          {form.costo_unitario && (
            <div style={{ gridColumn: '1/-1', background: '#E8F5E9', borderRadius: 12, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#1B5E20', fontWeight: 600 }}>💡 Precio final de venta</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--verde)' }}>${precioCalculado()}</span>
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

          {/* Selección de toppings */}
          {form.tiene_toppings && toppings.filter(t => t.activo).length > 0 && (
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 10, display: 'block' }}>Toppings disponibles para este producto</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {toppings.filter(t => t.activo).map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTopping(t.id)}
                    style={{
                      padding: '6px 14px', borderRadius: 20, border: '2px solid',
                      borderColor: form.toppings_ids.includes(t.id) ? 'var(--naranja)' : '#E0E0E0',
                      background: form.toppings_ids.includes(t.id) ? '#FFF3E0' : '#fff',
                      color: form.toppings_ids.includes(t.id) ? 'var(--naranja)' : 'var(--texto-suave)',
                      fontFamily: 'Poppins', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {t.nombre} {parseFloat(t.precio_usd) > 0 ? `+$${parseFloat(t.precio_usd).toFixed(2)}` : ''}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
          <button onClick={() => setModalForm(false)} style={{ padding: '10px 20px', borderRadius: 12, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontFamily: 'Poppins', fontWeight: 600 }}>
            Cancelar
          </button>
          <button className="btn-verde" onClick={guardar} disabled={guardando}>
            {guardando ? <span className="spinner-border spinner-border-sm me-2" /> : null}
            {guardando ? 'Guardando...' : productoSel ? 'Actualizar' : 'Crear producto'}
          </button>
        </div>
      </Modal>
    </div>
  );
}