import { useState, useEffect } from 'react';
import API from '../api/axios';
import { toast } from 'react-toastify';
import {
  RiAddLine, RiEditLine, RiDeleteBinLine,
  RiCloseLine, RiToggleLine, RiRefreshLine
} from 'react-icons/ri';

const Modal = ({ show, onClose, children, titulo }) => {
  if (!show) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1050,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 440,
        maxHeight: '92vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
      }}>
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #F0F0F0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, background: '#fff', zIndex: 1
        }}>
          <h5 style={{ fontWeight: 700, margin: 0 }}>{titulo}</h5>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer' }}>
            <RiCloseLine />
          </button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
};

const formVacio = { nombre: '', precio_cop: '' };

export default function Toppings() {
  const [toppings, setToppings] = useState([]);
  const [tasas, setTasas] = useState({ BS: null, COP: null });
  const [cargando, setCargando] = useState(true);
  const [modalForm, setModalForm] = useState(false);
  const [toppingSel, setToppingSel] = useState(null);
  const [form, setForm] = useState(formVacio);
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      const [r1, r2] = await Promise.all([
        API.get('/toppings'),
        API.get('/tasas-cambio')
      ]);
      setToppings(r1.data.toppings);
      const todasTasas = r2.data.tasas;
      const ultimaBS = todasTasas.find(t => t.moneda === 'BS');
      const ultimaCOP = todasTasas.find(t => t.moneda === 'COP');
      setTasas({
        BS: ultimaBS ? parseFloat(ultimaBS.tasa_por_usd) : null,
        COP: ultimaCOP ? parseFloat(ultimaCOP.tasa_por_usd) : null
      });
    } catch { toast.error('Error cargando toppings'); }
    finally { setCargando(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargar(); }, []);

  const abrirCrear = () => {
    setToppingSel(null);
    setForm(formVacio);
    setModalForm(true);
  };

  const abrirEditar = (t) => {
    setToppingSel(t);
    setForm({ nombre: t.nombre, precio_cop: t.precio_cop || '' });
    setModalForm(true);
  };

  const guardar = async () => {
    if (!form.nombre) { toast.error('El nombre es requerido'); return; }
    if (form.precio_cop === '' || form.precio_cop === undefined) {
      toast.error('El precio en COP es requerido (puede ser 0 si es gratis)');
      return;
    }
    setGuardando(true);
    try {
      if (toppingSel) {
        await API.put(`/toppings/${toppingSel.id}`, form);
        toast.success('Topping actualizado');
      } else {
        await API.post('/toppings', form);
        toast.success('Topping creado');
      }
      setModalForm(false);
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error guardando');
    } finally { setGuardando(false); }
  };

  const toggleActivo = async (t) => {
    try {
      await API.patch(`/toppings/${t.id}/toggle`);
      toast.success(`Topping ${t.activo ? 'desactivado' : 'activado'}`);
      cargar();
    } catch { toast.error('Error cambiando estado'); }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este topping?')) return;
    try {
      await API.delete(`/toppings/${id}`);
      toast.success('Topping eliminado');
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error eliminando');
    }
  };

  // Conversiones en tiempo real desde COP (para el modal)
  const copAUSD = (cop) => {
    if (!cop || !tasas.COP || parseFloat(cop) === 0) return null;
    return (parseFloat(cop) / tasas.COP).toFixed(4);
  };

  const copABS = (cop) => {
    if (!cop || !tasas.COP || !tasas.BS || parseFloat(cop) === 0) return null;
    const usd = parseFloat(cop) / tasas.COP;
    return (usd * tasas.BS).toFixed(2);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 2 }}>Toppings / Extras 🍯</h1>
          <p style={{ color: 'var(--texto-suave)', fontSize: '0.85rem' }}>
            {toppings.length} adicionales · {toppings.filter(t => t.activo).length} activos
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={cargar} style={{
            background: '#fff', border: '1px solid #E0E0E0', borderRadius: 12,
            padding: '9px 14px', color: 'var(--verde)', cursor: 'pointer', fontSize: '1rem'
          }}>
            <RiRefreshLine />
          </button>
          <button className="btn-verde" onClick={abrirCrear} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RiAddLine /> Nuevo topping
          </button>
        </div>
      </div>

      {/* Tasas activas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🇨🇴</div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--texto-suave)', fontWeight: 600 }}>Tasa COP activa</div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#E65100' }}>
              {tasas.COP ? `${tasas.COP.toLocaleString()} COP/$` : <span style={{ color: '#BDBDBD', fontSize: '0.82rem' }}>Sin tasa</span>}
            </div>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#E3F2FD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🇻🇪</div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--texto-suave)', fontWeight: 600 }}>Tasa BS activa</div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1565C0' }}>
              {tasas.BS ? `${tasas.BS.toLocaleString()} Bs/$` : <span style={{ color: '#BDBDBD', fontSize: '0.82rem' }}>Sin tasa</span>}
            </div>
          </div>
        </div>
        <div style={{ background: '#E8F5E9', borderRadius: 14, padding: '14px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.72rem', color: '#1B5E20', fontWeight: 700, marginBottom: 4 }}>💡 Cómo funciona</div>
          <div style={{ fontSize: '0.72rem', color: '#2E7D32', lineHeight: 1.5 }}>
            Ingresa el precio en <strong>Pesos (COP)</strong>. El sistema convierte a Bs y USD automáticamente con las tasas activas.
          </div>
        </div>
      </div>

      {/* Grid toppings */}
      {cargando ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div className="spinner-border" style={{ color: 'var(--verde)' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {toppings.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: 'var(--texto-suave)', fontSize: '0.85rem' }}>
              🍯 Sin toppings registrados
            </div>
          ) : toppings.map(t => (
            <div key={t.id} className="card-mm" style={{ opacity: t.activo ? 1 : 0.55 }}>

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>{t.nombre}</div>
                  <span style={{
                    background: t.activo ? '#E8F5E9' : '#FFEBEE',
                    color: t.activo ? '#1B5E20' : '#C62828',
                    borderRadius: 20, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700
                  }}>
                    {t.activo ? '✓ Activo' : '✗ Inactivo'}
                  </span>
                </div>
                <div style={{ fontSize: '2rem' }}>🍯</div>
              </div>

              {/* Precios */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>

                {/* COP — precio base */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFF3E0', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>🇨🇴</span>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#E65100', fontWeight: 700 }}>Pesos COP</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--texto-suave)' }}>Precio base</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#E65100' }}>
                    {!t.precio_cop || parseFloat(t.precio_cop) === 0
                      ? 'Gratis'
                      : `COP$ ${parseFloat(t.precio_cop).toLocaleString('es-CO', { minimumFractionDigits: 0 })}`
                    }
                  </div>
                </div>

                {/* USD — calculado */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#E8F5E9', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>💵</span>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#1B5E20', fontWeight: 700 }}>Dólar USD</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--texto-suave)' }}>
                        {tasas.COP ? `COP ÷ ${tasas.COP.toLocaleString()}` : 'Sin tasa COP'}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1B5E20' }}>
                    {!t.precio_cop || parseFloat(t.precio_cop) === 0
                      ? 'Gratis'
                      : t.precio_usd
                        ? `$${parseFloat(t.precio_usd).toFixed(4)}`
                        : <span style={{ color: '#BDBDBD', fontSize: '0.78rem' }}>Sin tasa</span>
                    }
                  </div>
                </div>

                {/* BS — calculado */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#E3F2FD', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>🇻🇪</span>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#1565C0', fontWeight: 700 }}>Bolívares BS</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--texto-suave)' }}>
                        {tasas.BS ? `USD × ${tasas.BS.toLocaleString()}` : 'Sin tasa BS'}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1565C0' }}>
                    {!t.precio_cop || parseFloat(t.precio_cop) === 0
                      ? 'Gratis'
                      : t.precio_bs
                        ? `Bs. ${parseFloat(t.precio_bs).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`
                        : <span style={{ color: '#BDBDBD', fontSize: '0.78rem' }}>Sin tasa</span>
                    }
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => toggleActivo(t)} title={t.activo ? 'Desactivar' : 'Activar'}
                  style={{ flex: 1, background: t.activo ? '#FFF3E0' : '#E8F5E9', border: 'none', borderRadius: 10, padding: '9px', color: t.activo ? '#E65100' : '#1B5E20', cursor: 'pointer', fontSize: '1rem' }}>
                  <RiToggleLine />
                </button>
                <button onClick={() => abrirEditar(t)} title="Editar"
                  style={{ flex: 1, background: '#E3F2FD', border: 'none', borderRadius: 10, padding: '9px', color: '#1565C0', cursor: 'pointer', fontSize: '1rem' }}>
                  <RiEditLine />
                </button>
                <button onClick={() => eliminar(t.id)} title="Eliminar"
                  style={{ flex: 1, background: '#FFEBEE', border: 'none', borderRadius: 10, padding: '9px', color: '#C62828', cursor: 'pointer', fontSize: '1rem' }}>
                  <RiDeleteBinLine />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      <Modal show={modalForm} onClose={() => setModalForm(false)} titulo={toppingSel ? 'Editar topping' : 'Nuevo topping'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Nombre */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>
              Nombre *
            </label>
            <input
              className="input-mm"
              placeholder="Ej: Leche condensada, Oreo, Chispas..."
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
            />
          </div>

          {/* Precio COP */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>
              Precio en Pesos (COP) *
              <span style={{ marginLeft: 8, fontWeight: 400, color: 'var(--texto-suave)', fontSize: '0.75rem' }}>
                (coloca 0 si es gratis)
              </span>
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                fontWeight: 700, color: '#E65100', fontSize: '0.82rem'
              }}>COP$</span>
              <input
                className="input-mm"
                type="number"
                step="1"
                min="0"
                placeholder="0"
                value={form.precio_cop}
                onChange={e => setForm({ ...form, precio_cop: e.target.value })}
                style={{ paddingLeft: 56 }}
              />
            </div>
          </div>

          {/* Preview conversiones */}
          {form.precio_cop !== '' && (
            <div style={{ background: 'var(--crema)', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--texto-suave)', marginBottom: 12 }}>
                SE GUARDARÁ AUTOMÁTICAMENTE COMO
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

                {/* USD */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#E8F5E9', borderRadius: 10, padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.2rem' }}>💵</span>
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1B5E20' }}>Dólar USD</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--texto-suave)' }}>
                        {tasas.COP
                          ? `COP$ ${parseFloat(form.precio_cop || 0).toLocaleString()} ÷ ${tasas.COP.toLocaleString()}`
                          : 'Sin tasa COP registrada'
                        }
                      </div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, color: '#1B5E20', fontSize: '1.1rem' }}>
                    {parseFloat(form.precio_cop) === 0
                      ? 'Gratis'
                      : copAUSD(form.precio_cop)
                        ? `$${copAUSD(form.precio_cop)}`
                        : <span style={{ color: '#BDBDBD', fontSize: '0.82rem' }}>Sin tasa</span>
                    }
                  </div>
                </div>

                {/* BS */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#E3F2FD', borderRadius: 10, padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.2rem' }}>🇻🇪</span>
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1565C0' }}>Bolívares BS</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--texto-suave)' }}>
                        {tasas.BS && tasas.COP
                          ? `USD × ${tasas.BS.toLocaleString()}`
                          : 'Sin tasa BS registrada'
                        }
                      </div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, color: '#1565C0', fontSize: '1.1rem' }}>
                    {parseFloat(form.precio_cop) === 0
                      ? 'Gratis'
                      : copABS(form.precio_cop)
                        ? `Bs. ${parseFloat(copABS(form.precio_cop)).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`
                        : <span style={{ color: '#BDBDBD', fontSize: '0.82rem' }}>Sin tasa</span>
                    }
                  </div>
                </div>
              </div>

              {(!tasas.COP || !tasas.BS) && (
                <div style={{ marginTop: 10, fontSize: '0.74rem', color: '#E65100', background: '#FFF3E0', borderRadius: 8, padding: '8px 12px' }}>
                  ⚠️ Registra las tasas en <strong>Tasas de Cambio</strong> para ver las conversiones
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
          <button onClick={() => setModalForm(false)}
            style={{ padding: '10px 20px', borderRadius: 12, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontFamily: 'Poppins', fontWeight: 600 }}>
            Cancelar
          </button>
          <button className="btn-verde" onClick={guardar} disabled={guardando}>
            {guardando ? <span className="spinner-border spinner-border-sm me-2" /> : null}
            {guardando ? 'Guardando...' : toppingSel ? 'Actualizar' : 'Crear topping'}
          </button>
        </div>
      </Modal>
    </div>
  );
}