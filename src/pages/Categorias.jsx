import { useState, useEffect } from 'react';
import API from '../api/axios';
import { toast } from 'react-toastify';
import { RiAddLine, RiEditLine, RiDeleteBinLine, RiCloseLine, RiPriceTag3Line } from 'react-icons/ri';

const Modal = ({ show, onClose, children, titulo }) => {
  if (!show) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1050,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #F0F0F0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
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

export default function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalForm, setModalForm] = useState(false);
  const [categoriaSel, setCategoriaSel] = useState(null);
  const [form, setForm] = useState({ nombre: '', descripcion: '' });
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      const { data } = await API.get('/categorias');
      setCategorias(data.categorias);
    } catch { toast.error('Error cargando categorías'); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  const abrirCrear = () => {
    setCategoriaSel(null);
    setForm({ nombre: '', descripcion: '' });
    setModalForm(true);
  };

  const abrirEditar = (c) => {
    setCategoriaSel(c);
    setForm({ nombre: c.nombre, descripcion: c.descripcion || '' });
    setModalForm(true);
  };

  const guardar = async () => {
    if (!form.nombre) { toast.error('El nombre es requerido'); return; }
    setGuardando(true);
    try {
      if (categoriaSel) {
        await API.put(`/categorias/${categoriaSel.id}`, form);
        toast.success('Categoría actualizada');
      } else {
        await API.post('/categorias', form);
        toast.success('Categoría creada');
      }
      setModalForm(false);
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error guardando');
    } finally { setGuardando(false); }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta categoría?')) return;
    try {
      await API.delete(`/categorias/${id}`);
      toast.success('Categoría eliminada');
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'No se puede eliminar, tiene productos asociados');
    }
  };

  const colores = [
    '#E8F5E9', '#FFF3E0', '#E3F2FD', '#F3E5F5',
    '#FCE4EC', '#E0F7FA', '#F9FBE7', '#FBE9E7'
  ];
  const textColores = [
    '#1B5E20', '#E65100', '#1565C0', '#6A1B9A',
    '#880E4F', '#006064', '#558B2F', '#BF360C'
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 2 }}>Categorías 🏷️</h1>
          <p style={{ color: 'var(--texto-suave)', fontSize: '0.85rem' }}>
            {categorias.length} categorías registradas
          </p>
        </div>
        <button className="btn-verde" onClick={abrirCrear} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RiAddLine /> Nueva categoría
        </button>
      </div>

      {/* Grid */}
      {cargando ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div className="spinner-border" style={{ color: 'var(--verde)' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {categorias.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: 'var(--texto-suave)' }}>
              <RiPriceTag3Line style={{ fontSize: 40, display: 'block', margin: '0 auto 12px' }} />
              Sin categorías registradas
            </div>
          ) : categorias.map((cat, i) => {
            const bg = colores[i % colores.length];
            const color = textColores[i % textColores.length];
            return (
              <div key={cat.id} className="card-mm" style={{ borderTop: `4px solid ${color}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: bg, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color, fontSize: '1.3rem', flexShrink: 0
                  }}>
                    <RiPriceTag3Line />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>
                      {cat.nombre}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--texto-suave)', lineHeight: 1.5 }}>
                      {cat.descripcion || 'Sin descripción'}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--texto-suave)', marginBottom: 14 }}>
                  Creada: {new Date(cat.creado_en).toLocaleDateString('es-VE')}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => abrirEditar(cat)} style={{
                    flex: 1, background: '#E3F2FD', border: 'none',
                    borderRadius: 10, padding: '8px',
                    color: '#1565C0', cursor: 'pointer', fontSize: '1rem'
                  }}>
                    <RiEditLine />
                  </button>
                  <button onClick={() => eliminar(cat.id)} style={{
                    flex: 1, background: '#FFEBEE', border: 'none',
                    borderRadius: 10, padding: '8px',
                    color: '#C62828', cursor: 'pointer', fontSize: '1rem'
                  }}>
                    <RiDeleteBinLine />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal show={modalForm} onClose={() => setModalForm(false)} titulo={categoriaSel ? 'Editar categoría' : 'Nueva categoría'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>
              Nombre *
            </label>
            <input
              className="input-mm"
              placeholder="Ej: Bebidas, Postres, Snacks..."
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>
              Descripción
            </label>
            <textarea
              className="input-mm"
              rows={3}
              placeholder="Descripción opcional de la categoría..."
              value={form.descripcion}
              onChange={e => setForm({ ...form, descripcion: e.target.value })}
              style={{ resize: 'none' }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
          <button
            onClick={() => setModalForm(false)}
            style={{ padding: '10px 20px', borderRadius: 12, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontFamily: 'Poppins', fontWeight: 600 }}
          >
            Cancelar
          </button>
          <button className="btn-verde" onClick={guardar} disabled={guardando}>
            {guardando ? <span className="spinner-border spinner-border-sm me-2" /> : null}
            {guardando ? 'Guardando...' : categoriaSel ? 'Actualizar' : 'Crear categoría'}
          </button>
        </div>
      </Modal>
    </div>
  );
}