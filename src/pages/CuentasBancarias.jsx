import { useState, useEffect } from 'react';
import API from '../api/axios';
import { toast } from 'react-toastify';
import { RiAddLine, RiEditLine, RiDeleteBinLine, RiCloseLine, RiBankLine, RiToggleLine } from 'react-icons/ri';

const Modal = ({ show, onClose, children, titulo }) => {
  if (!show) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1050,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h5 style={{ fontWeight: 700, margin: 0 }}>{titulo}</h5>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer' }}><RiCloseLine /></button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
};

const formVacio = { nombre_banco: '', numero_cuenta: '', titular_cuenta: '', moneda: 'USD', telefono: '' };

const coloresPorMoneda = {
  USD: { bg: '#E8F5E9', color: '#1B5E20', badge: '#E8F5E9' },
  BS: { bg: '#E3F2FD', color: '#1565C0', badge: '#E3F2FD' },
  COP: { bg: '#FFF3E0', color: '#E65100', badge: '#FFF3E0' }
};

export default function CuentasBancarias() {
  const [cuentas, setCuentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalForm, setModalForm] = useState(false);
  const [cuentaSel, setCuentaSel] = useState(null);
  const [form, setForm] = useState(formVacio);
  const [guardando, setGuardando] = useState(false);
  const [filtroMoneda, setFiltroMoneda] = useState('');

  const cargar = async () => {
    setCargando(true);
    try {
      const { data } = await API.get('/cuentas-bancarias');
      setCuentas(data.cuentas);
    } catch { toast.error('Error cargando cuentas'); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  const abrirCrear = () => { setCuentaSel(null); setForm(formVacio); setModalForm(true); };
  const abrirEditar = (c) => {
    setCuentaSel(c);
    setForm({ nombre_banco: c.nombre_banco, numero_cuenta: c.numero_cuenta || '', titular_cuenta: c.titular_cuenta || '', moneda: c.moneda, telefono: c.telefono || '' });
    setModalForm(true);
  };

  const guardar = async () => {
    if (!form.nombre_banco) { toast.error('El nombre del banco es requerido'); return; }
    setGuardando(true);
    try {
      if (cuentaSel) {
        await API.put(`/cuentas-bancarias/${cuentaSel.id}`, form);
        toast.success('Cuenta actualizada');
      } else {
        await API.post('/cuentas-bancarias', form);
        toast.success('Cuenta creada');
      }
      setModalForm(false);
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error guardando');
    } finally { setGuardando(false); }
  };

  const toggleActivo = async (c) => {
    try {
      await API.patch(`/cuentas-bancarias/${c.id}/toggle`);
      toast.success(`Cuenta ${c.activo ? 'desactivada' : 'activada'}`);
      cargar();
    } catch { toast.error('Error cambiando estado'); }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta cuenta?')) return;
    try {
      await API.delete(`/cuentas-bancarias/${id}`);
      toast.success('Cuenta eliminada');
      cargar();
    } catch (err) { toast.error(err.response?.data?.mensaje || 'Error eliminando'); }
  };

  const filtradas = filtroMoneda ? cuentas.filter(c => c.moneda === filtroMoneda) : cuentas;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 2 }}>Cuentas Bancarias 🏦</h1>
          <p style={{ color: 'var(--texto-suave)', fontSize: '0.85rem' }}>{cuentas.length} cuentas · {cuentas.filter(c => c.activo).length} activas</p>
        </div>
        <button className="btn-verde" onClick={abrirCrear} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RiAddLine /> Nueva cuenta
        </button>
      </div>

      {/* Filtro moneda */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['', 'USD', 'BS', 'COP'].map(m => (
          <button key={m} onClick={() => setFiltroMoneda(m)} style={{
            padding: '7px 16px', borderRadius: 20, border: '2px solid',
            borderColor: filtroMoneda === m ? 'var(--verde)' : '#E0E0E0',
            background: filtroMoneda === m ? '#E8F5E9' : '#fff',
            color: filtroMoneda === m ? 'var(--verde)' : 'var(--texto-suave)',
            fontFamily: 'Poppins', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer'
          }}>
            {m === '' ? 'Todas' : m === 'USD' ? '💵 USD' : m === 'BS' ? '🇻🇪 BS' : '🇨🇴 COP'}
          </button>
        ))}
      </div>

      {/* Cards cuentas */}
      {cargando ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div className="spinner-border" style={{ color: 'var(--verde)' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtradas.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: 'var(--texto-suave)' }}>
              <RiBankLine style={{ fontSize: 40, display: 'block', margin: '0 auto 12px' }} />
              Sin cuentas registradas
            </div>
          ) : filtradas.map(c => {
            const col = coloresPorMoneda[c.moneda] || coloresPorMoneda.USD;
            return (
              <div key={c.id} className="card-mm" style={{ opacity: c.activo ? 1 : 0.55, transition: 'opacity 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: col.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: col.color, fontSize: '1.3rem'
                    }}>
                      <RiBankLine />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{c.nombre_banco}</div>
                      <span style={{ background: col.badge, color: col.color, borderRadius: 20, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700 }}>
                        {c.moneda === 'USD' ? '💵 USD' : c.moneda === 'BS' ? '🇻🇪 BS' : '🇨🇴 COP'}
                      </span>
                    </div>
                  </div>
                  <span style={{
                    background: c.activo ? '#E8F5E9' : '#FFEBEE',
                    color: c.activo ? '#1B5E20' : '#C62828',
                    borderRadius: 20, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700
                  }}>
                    {c.activo ? 'Activa' : 'Inactiva'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {[
                    { label: 'Titular', valor: c.titular_cuenta },
                    { label: 'Número', valor: c.numero_cuenta },
                    { label: 'Teléfono', valor: c.telefono }
                  ].map(d => d.valor && (
                    <div key={d.label} style={{ display: 'flex', gap: 8 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--texto-suave)', fontWeight: 600, minWidth: 60 }}>{d.label}:</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{d.valor}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => toggleActivo(c)} title={c.activo ? 'Desactivar' : 'Activar'}
                    style={{ flex: 1, background: c.activo ? '#FFF3E0' : '#E8F5E9', border: 'none', borderRadius: 10, padding: '8px', color: c.activo ? '#E65100' : '#1B5E20', cursor: 'pointer', fontSize: '1rem' }}>
                    <RiToggleLine />
                  </button>
                  <button onClick={() => abrirEditar(c)} title="Editar"
                    style={{ flex: 1, background: '#E3F2FD', border: 'none', borderRadius: 10, padding: '8px', color: '#1565C0', cursor: 'pointer', fontSize: '1rem' }}>
                    <RiEditLine />
                  </button>
                  <button onClick={() => eliminar(c.id)} title="Eliminar"
                    style={{ flex: 1, background: '#FFEBEE', border: 'none', borderRadius: 10, padding: '8px', color: '#C62828', cursor: 'pointer', fontSize: '1rem' }}>
                    <RiDeleteBinLine />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal show={modalForm} onClose={() => setModalForm(false)} titulo={cuentaSel ? 'Editar cuenta' : 'Nueva cuenta bancaria'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Moneda *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {['USD', 'BS', 'COP'].map(m => (
                <button key={m} onClick={() => setForm({ ...form, moneda: m })} style={{
                  padding: '10px', borderRadius: 12, border: '2px solid',
                  borderColor: form.moneda === m ? 'var(--verde)' : '#E0E0E0',
                  background: form.moneda === m ? '#E8F5E9' : '#fff',
                  color: form.moneda === m ? 'var(--verde)' : 'var(--texto-suave)',
                  fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer'
                }}>
                  {m === 'USD' ? '💵 USD' : m === 'BS' ? '🇻🇪 BS' : '🇨🇴 COP'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Nombre del banco *</label>
            <input className="input-mm" placeholder="Ej: Banesco, Mercantil, Nequi..." value={form.nombre_banco} onChange={e => setForm({ ...form, nombre_banco: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Titular de la cuenta</label>
            <input className="input-mm" placeholder="Nombre del titular" value={form.titular_cuenta} onChange={e => setForm({ ...form, titular_cuenta: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Número de cuenta</label>
            <input className="input-mm" placeholder="Número de cuenta" value={form.numero_cuenta} onChange={e => setForm({ ...form, numero_cuenta: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>
              Teléfono {form.moneda === 'BS' ? '(para pago móvil)' : ''}
            </label>
            <input className="input-mm" placeholder="04XX-XXXXXXX" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
          <button onClick={() => setModalForm(false)} style={{ padding: '10px 20px', borderRadius: 12, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontFamily: 'Poppins', fontWeight: 600 }}>
            Cancelar
          </button>
          <button className="btn-verde" onClick={guardar} disabled={guardando}>
            {guardando ? <span className="spinner-border spinner-border-sm me-2" /> : null}
            {guardando ? 'Guardando...' : cuentaSel ? 'Actualizar' : 'Crear cuenta'}
          </button>
        </div>
      </Modal>
    </div>
  );
}