import { useState, useEffect } from 'react';
import API from '../api/axios';
import { toast } from 'react-toastify';
import {
  RiAddLine, RiEditLine, RiDeleteBinLine,
  RiSearchLine, RiCloseLine, RiArchiveLine,
  RiAddCircleLine
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

  const filtrados = items.filter(i =>
    i.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (i.proveedor || '').toLowerCase().includes(busqueda.toLowerCase())
  );

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

      {/* Búsqueda */}
      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 400 }}>
        <RiSearchLine style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--texto-suave)' }} />
        <input
          className="input-mm"
          placeholder="Buscar por nombre o proveedor..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{ paddingLeft: 40 }}
        />
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
                  {['Código', 'Producto', 'Categoría', 'Cantidad', 'Unidad', 'Costo Total', 'Moneda', 'Costo Unit.', 'Equiv. USD', 'Proveedor', 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, fontSize: '0.78rem', color: 'var(--texto-suave)', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', padding: 48, color: 'var(--texto-suave)' }}>
                      <RiArchiveLine style={{ fontSize: 36, display: 'block', margin: '0 auto 8px' }} />
                      Sin items en inventario
                    </td>
                  </tr>
                ) : filtrados.map(item => (
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