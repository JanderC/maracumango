import { useState, useEffect } from 'react';
import API from '../api/axios';
import { toast } from 'react-toastify';
import {
  RiAddLine, RiEditLine, RiCloseLine,
  RiToggleLine, RiShieldLine, RiUserLine
} from 'react-icons/ri';

const Modal = ({ show, onClose, children, titulo }) => {
  if (!show) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1050,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h5 style={{ fontWeight: 700, margin: 0 }}>{titulo}</h5>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer' }}><RiCloseLine /></button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
};

const formVacio = { nombre: '', correo: '', contrasena: '', rol: 'cliente' };

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalForm, setModalForm] = useState(false);
  const [usuarioSel, setUsuarioSel] = useState(null);
  const [form, setForm] = useState(formVacio);
  const [guardando, setGuardando] = useState(false);
  const [verPass, setVerPass] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      const { data } = await API.get('/usuarios');
      setUsuarios(data.usuarios);
    } catch { toast.error('Error cargando usuarios'); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  const abrirCrear = () => { setUsuarioSel(null); setForm(formVacio); setVerPass(false); setModalForm(true); };
  const abrirEditar = (u) => {
    setUsuarioSel(u);
    setForm({ nombre: u.nombre, correo: u.correo, contrasena: '', rol: u.rol });
    setVerPass(false);
    setModalForm(true);
  };

  const guardar = async () => {
    if (!form.nombre || !form.correo) { toast.error('Nombre y correo son requeridos'); return; }
    if (!usuarioSel && !form.contrasena) { toast.error('La contraseña es requerida'); return; }
    setGuardando(true);
    try {
      const payload = { ...form };
      if (!payload.contrasena) delete payload.contrasena;
      if (usuarioSel) {
        await API.put(`/usuarios/${usuarioSel.id}`, payload);
        toast.success('Usuario actualizado');
      } else {
        await API.post('/usuarios', payload);
        toast.success('Usuario creado');
      }
      setModalForm(false);
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error guardando');
    } finally { setGuardando(false); }
  };

  const toggleActivo = async (u) => {
    try {
      await API.patch(`/usuarios/${u.id}/toggle`);
      toast.success(`Usuario ${u.activo ? 'desactivado' : 'activado'}`);
      cargar();
    } catch { toast.error('Error cambiando estado'); }
  };

  const admins = usuarios.filter(u => u.rol === 'admin');
  const clientes = usuarios.filter(u => u.rol === 'cliente');

  const GrupoUsuarios = ({ titulo, lista, icono, color, bg }) => (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontSize: '1.1rem' }}>
          {icono}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{titulo}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--texto-suave)' }}>{lista.length} usuarios</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {lista.length === 0 ? (
          <div style={{ padding: '24px', background: '#FAFAFA', borderRadius: 14, color: 'var(--texto-suave)', fontSize: '0.85rem', textAlign: 'center' }}>
            Sin usuarios en este rol
          </div>
        ) : lista.map(u => (
          <div key={u.id} className="card-mm" style={{ opacity: u.activo ? 1 : 0.55 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: u.rol === 'admin' ? 'var(--verde)' : 'var(--naranja)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0
              }}>
                {u.nombre.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.nombre}</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--texto-suave)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.correo}</div>
              </div>
              <span style={{
                background: u.activo ? '#E8F5E9' : '#FFEBEE',
                color: u.activo ? '#1B5E20' : '#C62828',
                borderRadius: 20, padding: '3px 8px', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0
              }}>
                {u.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--texto-suave)', marginBottom: 14 }}>
              Registrado: {new Date(u.creado_en).toLocaleDateString('es-VE')}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => toggleActivo(u)} style={{ flex: 1, background: u.activo ? '#FFF3E0' : '#E8F5E9', border: 'none', borderRadius: 10, padding: '8px', color: u.activo ? '#E65100' : '#1B5E20', cursor: 'pointer', fontSize: '1rem' }}>
                <RiToggleLine />
              </button>
              <button onClick={() => abrirEditar(u)} style={{ flex: 1, background: '#E3F2FD', border: 'none', borderRadius: 10, padding: '8px', color: '#1565C0', cursor: 'pointer', fontSize: '1rem' }}>
                <RiEditLine />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 2 }}>Usuarios 👥</h1>
          <p style={{ color: 'var(--texto-suave)', fontSize: '0.85rem' }}>
            {usuarios.length} usuarios · {usuarios.filter(u => u.activo).length} activos
          </p>
        </div>
        <button className="btn-verde" onClick={abrirCrear} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RiAddLine /> Nuevo usuario
        </button>
      </div>

      {cargando ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div className="spinner-border" style={{ color: 'var(--verde)' }} />
        </div>
      ) : (
        <>
          <GrupoUsuarios
            titulo="Administradores"
            lista={admins}
            icono={<RiShieldLine />}
            color="#1B5E20"
            bg="#E8F5E9"
          />
          <GrupoUsuarios
            titulo="Clientes"
            lista={clientes}
            icono={<RiUserLine />}
            color="#F57F17"
            bg="#FFF3E0"
          />
        </>
      )}

      <Modal show={modalForm} onClose={() => setModalForm(false)} titulo={usuarioSel ? 'Editar usuario' : 'Nuevo usuario'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Rol *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { v: 'admin', label: '👑 Administrador', color: 'var(--verde)' },
                { v: 'cliente', label: '🛍️ Cliente', color: 'var(--naranja)' }
              ].map(r => (
                <button key={r.v} onClick={() => setForm({ ...form, rol: r.v })} style={{
                  padding: '11px', borderRadius: 12, border: '2px solid',
                  borderColor: form.rol === r.v ? r.color : '#E0E0E0',
                  background: form.rol === r.v ? (r.v === 'admin' ? '#E8F5E9' : '#FFF3E0') : '#fff',
                  color: form.rol === r.v ? r.color : 'var(--texto-suave)',
                  fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
                }}>{r.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Nombre completo *</label>
            <input className="input-mm" placeholder="Nombre del usuario" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Correo electrónico *</label>
            <input className="input-mm" type="email" placeholder="correo@ejemplo.com" value={form.correo} onChange={e => setForm({ ...form, correo: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>
              {usuarioSel ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                className="input-mm"
                type={verPass ? 'text' : 'password'}
                placeholder={usuarioSel ? 'Nueva contraseña...' : 'Contraseña...'}
                value={form.contrasena}
                onChange={e => setForm({ ...form, contrasena: e.target.value })}
                style={{ paddingRight: 44 }}
              />
              <button type="button" onClick={() => setVerPass(!verPass)} style={{
                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'var(--texto-suave)',
                fontSize: '1rem', cursor: 'pointer'
              }}>
                {verPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
          <button onClick={() => setModalForm(false)} style={{ padding: '10px 20px', borderRadius: 12, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontFamily: 'Poppins', fontWeight: 600 }}>
            Cancelar
          </button>
          <button className="btn-verde" onClick={guardar} disabled={guardando}>
            {guardando ? <span className="spinner-border spinner-border-sm me-2" /> : null}
            {guardando ? 'Guardando...' : usuarioSel ? 'Actualizar' : 'Crear usuario'}
          </button>
        </div>
      </Modal>
    </div>
  );
}