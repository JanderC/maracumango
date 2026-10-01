import { useState, useEffect, useCallback } from 'react';
import API from '../api/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { soportaImpresionDirecta, conectarImpresora, enviarAImpresora } from '../utils/impresora';
import { construirTicketCierre } from '../utils/ticketCierre';
import {
  RiSafe2Line, RiLockLine, RiLockUnlockLine, RiArrowUpCircleLine, RiArrowDownCircleLine,
  RiCloseLine, RiRefreshLine, RiCalendarCheckLine, RiDeleteBin6Line, RiHistoryLine,
  RiFileList3Line, RiEyeLine, RiCheckboxCircleLine, RiErrorWarningLine,
  RiArrowLeftSLine, RiArrowRightSLine, RiShieldKeyholeLine, RiBankCardLine, RiCalendarLine, RiPrinterLine
} from 'react-icons/ri';

/* ════════════════════════════════════════════════════════════════
   Helpers
   ════════════════════════════════════════════════════════════════ */
const MONEDAS = ['COP', 'USD', 'BS'];
const INFO = {
  COP: { nombre: 'Pesos', simbolo: 'COP$', sigla: '$', color: '#E65100', fondo: '#FFF3E0', borde: '#FFCC80' },
  USD: { nombre: 'Dólares', simbolo: '$', sigla: 'US$', color: '#1B5E20', fondo: '#E8F5E9', borde: '#A5D6A7' },
  BS:  { nombre: 'Bolívares', simbolo: 'Bs.', sigla: 'Bs', color: '#1565C0', fondo: '#E3F2FD', borde: '#90CAF9' }
};

const fmt = (moneda, v) => {
  const n = Number(v || 0);
  const decimales = moneda === 'COP' && Number.isInteger(n) ? 0 : 2;
  return `${INFO[moneda].simbolo} ${n.toLocaleString('es-CO', { minimumFractionDigits: decimales, maximumFractionDigits: 2 })}`;
};
const fmtHora = (iso) => iso ? new Date(iso).toLocaleTimeString('es-VE', { hour: 'numeric', minute: '2-digit' }) : '—';
const fmtFechaHora = (iso) => iso ? new Date(iso).toLocaleString('es-VE', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—';
const fmtFecha = (ymd, opts = { weekday: 'short', day: '2-digit', month: 'short' }) =>
  new Date(`${ymd}T12:00:00`).toLocaleDateString('es-VE', opts);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const ventasTxt = (n) => `${n} venta${n === 1 ? '' : 's'}`;

const ymd = (d) => d.toLocaleDateString('en-CA'); // AAAA-MM-DD en hora local
const hoy = () => ymd(new Date());
const sumarDias = (fecha, n) => { const d = new Date(`${fecha}T12:00:00`); d.setDate(d.getDate() + n); return ymd(d); };
const lunesDe = (fecha) => { const d = new Date(`${fecha}T12:00:00`); const dia = (d.getDay() + 6) % 7; return sumarDias(fecha, -dia); };

const errorApi = (err, texto) => toast.error(err.response?.data?.mensaje || texto);

// Recibo de cierre (resumen por moneda + todas las ventas) en la impresora térmica
// Nunca lanza error: un problema de impresión no debe afectar el cierre de caja.
const imprimirCierre = async (sesion) => {
  try {
    const bytes = soportaImpresionDirecta() ? construirTicketCierre(sesion) : new Uint8Array();
    await enviarAImpresora(bytes, '🖨️ Recibo de cierre enviado a la impresora');
  } catch (err) {
    console.error('Error armando el recibo de cierre:', err);
    toast.error('No se pudo imprimir el recibo de cierre');
  }
};

/* ════════════════════════════════════════════════════════════════
   Componentes base
   ════════════════════════════════════════════════════════════════ */
// Insignia de moneda (los emojis de bandera no se ven en Windows)
const Chip = ({ moneda, grande }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: grande ? 34 : 22, height: grande ? 26 : 18,
    padding: '0 5px', borderRadius: grande ? 8 : 6, background: INFO[moneda].color, color: '#fff',
    fontSize: grande ? '0.78rem' : '0.6rem', fontWeight: 800, lineHeight: 1, verticalAlign: 'middle'
  }}>{INFO[moneda].sigla}</span>
);

const Modal = ({ show, onClose, titulo, icono, children, maxWidth = 520, color = 'var(--verde)' }) => {
  if (!show) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1060, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 0' }}>
          <h5 style={{ fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10, color }}>
            {icono}{titulo}
          </h5>
          <button onClick={onClose} style={{ background: '#F5F5F5', border: 'none', borderRadius: 10, width: 34, height: 34, cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RiCloseLine />
          </button>
        </div>
        <div style={{ padding: '18px 24px 24px' }}>{children}</div>
      </div>
    </div>
  );
};

const Etiqueta = ({ children }) => (
  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--texto-suave)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>{children}</div>
);

const Spinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 260 }}>
    <div className="spinner-border" style={{ color: 'var(--verde)' }} />
  </div>
);

const Vacio = ({ icono, texto }) => (
  <div style={{ textAlign: 'center', padding: '28px 12px', color: 'var(--texto-suave)', fontSize: '0.85rem' }}>
    <div style={{ fontSize: '2rem', opacity: 0.5, marginBottom: 6 }}>{icono}</div>{texto}
  </div>
);

const MiniStat = ({ icono, label, valor, color = 'var(--verde)', sub }) => (
  <div className="card-mm" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>{icono}</div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: '0.74rem', color: 'var(--texto-suave)', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--texto)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{valor}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: 'var(--texto-suave)' }}>{sub}</div>}
    </div>
  </div>
);

// Sobrante / faltante / cuadrado
const Diferencia = ({ moneda, valor, grande }) => {
  if (valor === null || valor === undefined) return <span style={{ color: '#BDBDBD', fontSize: '0.8rem' }}>—</span>;
  const cuadra = Math.abs(valor) < 0.005;
  const estilo = cuadra
    ? { bg: '#E8F5E9', color: '#2E7D32', texto: 'Cuadrada' }
    : valor > 0 ? { bg: '#E3F2FD', color: '#1565C0', texto: `Sobra ${fmt(moneda, valor)}` }
    : { bg: '#FFEBEE', color: '#C62828', texto: `Falta ${fmt(moneda, Math.abs(valor))}` };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, background: estilo.bg, color: estilo.color,
      borderRadius: 20, padding: grande ? '5px 12px' : '2px 9px', fontWeight: 700, fontSize: grande ? '0.82rem' : '0.72rem', whiteSpace: 'nowrap'
    }}>
      {cuadra ? <RiCheckboxCircleLine /> : <RiErrorWarningLine />} {estilo.texto}
    </span>
  );
};

const Pestanas = ({ opciones, valor, onChange }) => (
  <div style={{ display: 'flex', background: '#fff', borderRadius: 14, padding: 4, gap: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', flexWrap: 'wrap' }}>
    {opciones.map(o => (
      <button key={o.v} onClick={() => onChange(o.v)} style={{
        display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 11, border: 'none',
        background: valor === o.v ? 'var(--verde)' : 'transparent', color: valor === o.v ? '#fff' : 'var(--texto-suave)',
        fontFamily: 'Poppins', fontWeight: 600, fontSize: '0.83rem', cursor: 'pointer', transition: 'all 0.2s'
      }}>{o.icono} {o.label}</button>
    ))}
  </div>
);

const InputMonto = ({ moneda, value, onChange, autoFocus }) => (
  <div style={{ position: 'relative' }}>
    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: INFO[moneda].color, fontSize: '0.85rem' }}>
      {INFO[moneda].simbolo}
    </span>
    <input className="input-mm" type="number" min="0" step="0.01" inputMode="decimal" placeholder="0"
      value={value} onChange={e => onChange(e.target.value)} autoFocus={autoFocus}
      style={{ paddingLeft: moneda === 'COP' ? 58 : moneda === 'BS' ? 44 : 30, fontWeight: 700 }} />
  </div>
);

/* ─── Tarjeta de una moneda en la caja ─── */
const FilaMonto = ({ moneda, label, valor, signo, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '4px 0' }}>
    <span style={{ color: 'var(--texto-suave)' }}>{label}</span>
    <span style={{ fontWeight: 600, color: color || 'var(--texto)' }}>{signo}{fmt(moneda, valor)}</span>
  </div>
);

const TarjetaMoneda = ({ moneda, datos }) => {
  const i = INFO[moneda];
  const hayContado = datos.contado !== null && datos.contado !== undefined;
  return (
    <div className="card-mm" style={{ padding: 0, overflow: 'hidden', border: `1px solid ${i.borde}` }}>
      <div style={{ background: i.fondo, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: i.color, display: 'flex', alignItems: 'center', gap: 7 }}>
            <Chip moneda={moneda} /> {i.nombre} · {moneda}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--texto-suave)', marginTop: 8 }}>Efectivo esperado en caja</div>
          <div style={{ fontSize: '1.55rem', fontWeight: 800, color: i.color, lineHeight: 1.2 }}>{fmt(moneda, datos.esperado)}</div>
        </div>
        {hayContado && <Diferencia moneda={moneda} valor={datos.diferencia} />}
      </div>
      <div style={{ padding: '12px 20px 16px' }}>
        <FilaMonto moneda={moneda} label="Fondo de apertura" valor={datos.apertura} />
        <FilaMonto moneda={moneda} label={`Ventas en efectivo (${datos.cantidad_efectivo})`} valor={datos.ventas_efectivo} signo="+ " color="#2E7D32" />
        <FilaMonto moneda={moneda} label="Ingresos" valor={datos.ingresos} signo="+ " color="#2E7D32" />
        <FilaMonto moneda={moneda} label="Egresos" valor={datos.egresos} signo="− " color="#C62828" />
        {hayContado && (
          <div style={{ borderTop: '1px dashed #E0E0E0', marginTop: 6, paddingTop: 6 }}>
            <FilaMonto moneda={moneda} label="Contado al cierre" valor={datos.contado} color={i.color} />
          </div>
        )}
        <div style={{
          marginTop: 10, background: '#FAFAFA', borderRadius: 10, padding: '8px 12px', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem'
        }}>
          <span style={{ color: 'var(--texto-suave)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <RiBankCardLine /> Transferencias ({datos.cantidad_transferencias})
          </span>
          <span style={{ fontWeight: 700 }}>{fmt(moneda, datos.transferencias)}</span>
        </div>
      </div>
    </div>
  );
};

/* ─── Lista de movimientos ─── */
const ListaMovimientos = ({ movimientos, onEliminar }) => {
  if (!movimientos?.length) return <Vacio icono="💸" texto="Sin ingresos ni egresos registrados" />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {movimientos.map(m => {
        const ingreso = m.tipo === 'ingreso';
        return (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, background: ingreso ? '#F1F8E9' : '#FFF5F5' }}>
            <div style={{ fontSize: '1.5rem', color: ingreso ? '#2E7D32' : '#C62828', display: 'flex' }}>
              {ingreso ? <RiArrowDownCircleLine /> : <RiArrowUpCircleLine />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.descripcion}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--texto-suave)' }}>{ingreso ? 'Ingreso' : 'Egreso'} · {m.usuario || '—'} · {fmtFechaHora(m.creado_en)}</div>
            </div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: ingreso ? '#2E7D32' : '#C62828', whiteSpace: 'nowrap' }}>
              {ingreso ? '+' : '−'} {fmt(m.moneda, m.monto)}
            </div>
            {onEliminar && (
              <button onClick={() => onEliminar(m)} title="Eliminar movimiento" style={{ background: 'none', border: 'none', color: '#BDBDBD', cursor: 'pointer', fontSize: '1.05rem' }}>
                <RiDeleteBin6Line />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ─── Detalle de una sesión (modal y resultado de cierre) ─── */
const DetalleSesion = ({ sesion }) => (
  <div>
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: '0.8rem', marginBottom: 14, alignItems: 'center' }}>
      {sesion.estado === 'cerrada' && sesion.lista_ventas && (
        <button onClick={() => imprimirCierre(sesion)} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, border: '2px solid var(--naranja)',
          background: '#fff', color: 'var(--naranja)', fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', order: 99, marginLeft: 'auto'
        }}><RiPrinterLine /> Imprimir recibo</button>
      )}
      <span style={{ background: 'var(--crema)', borderRadius: 10, padding: '6px 12px' }}>
        <RiLockUnlockLine style={{ color: 'var(--verde)' }} /> {fmtFechaHora(sesion.abierta_en)} · {sesion.abierta_por}
      </span>
      {sesion.cerrada_en && (
        <span style={{ background: 'var(--crema)', borderRadius: 10, padding: '6px 12px' }}>
          <RiLockLine style={{ color: 'var(--naranja)' }} /> {fmtFechaHora(sesion.cerrada_en)} · {sesion.cerrada_por}
        </span>
      )}
      <span style={{ background: 'var(--crema)', borderRadius: 10, padding: '6px 12px' }}>
        🧾 {ventasTxt(sesion.ventas?.cantidad || 0)}{sesion.ventas?.anuladas ? ` · ${sesion.ventas.anuladas} anuladas` : ''}
      </span>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12, marginBottom: 16 }}>
      {MONEDAS.map(m => <TarjetaMoneda key={m} moneda={m} datos={sesion.monedas[m]} />)}
    </div>
    {(sesion.notas_apertura || sesion.notas_cierre) && (
      <div style={{ background: '#FFF8E1', borderRadius: 12, padding: '10px 14px', fontSize: '0.82rem', marginBottom: 14 }}>
        {sesion.notas_apertura && <div><strong>Apertura:</strong> {sesion.notas_apertura}</div>}
        {sesion.notas_cierre && <div><strong>Cierre:</strong> {sesion.notas_cierre}</div>}
      </div>
    )}
    <Etiqueta>Movimientos</Etiqueta>
    <ListaMovimientos movimientos={sesion.movimientos} />
  </div>
);

/* ─── Confirmación con contraseña ─── */
const ModalConfirmar = ({ show, onClose, titulo, children, pedirTexto, textoBoton, onConfirmar }) => {
  const [contrasena, setContrasena] = useState('');
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  useEffect(() => { if (show) { setContrasena(''); setTexto(''); } }, [show]);
  const listo = contrasena && (!pedirTexto || texto === pedirTexto);
  const confirmar = async () => {
    setEnviando(true);
    try { await onConfirmar({ contrasena, confirmacion: texto }); } finally { setEnviando(false); }
  };
  return (
    <Modal show={show} onClose={onClose} titulo={titulo} icono={<RiShieldKeyholeLine />} color="#C62828" maxWidth={460}>
      <div style={{ background: '#FFEBEE', borderRadius: 12, padding: '12px 14px', fontSize: '0.84rem', color: '#B71C1C', marginBottom: 16 }}>
        {children}
      </div>
      {pedirTexto && (
        <div style={{ marginBottom: 12 }}>
          <Etiqueta>Escribe <span style={{ color: '#C62828' }}>{pedirTexto}</span> para confirmar</Etiqueta>
          <input className="input-mm" value={texto} onChange={e => setTexto(e.target.value)} placeholder={pedirTexto} />
        </div>
      )}
      <div style={{ marginBottom: 18 }}>
        <Etiqueta>Tu contraseña</Etiqueta>
        <input className="input-mm" type="password" value={contrasena} onChange={e => setContrasena(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && listo && !enviando && confirmar()} />
      </div>
      <button onClick={confirmar} disabled={!listo || enviando} style={{
        width: '100%', padding: 13, borderRadius: 12, border: 'none', fontFamily: 'Poppins', fontWeight: 700,
        background: listo ? '#C62828' : '#E0E0E0', color: '#fff', cursor: listo ? 'pointer' : 'not-allowed'
      }}>{enviando ? 'Procesando...' : textoBoton}</button>
    </Modal>
  );
};

/* ════════════════════════════════════════════════════════════════
   TAB 1 — CAJA ACTUAL
   ════════════════════════════════════════════════════════════════ */
const SUGERENCIAS = {
  egreso: ['Pago a proveedor', 'Compra de insumos', 'Retiro del dueño', 'Pago de servicios', 'Cambio / sencillo'],
  ingreso: ['Fondo adicional', 'Cambio / sencillo', 'Devolución de proveedor']
};

const botonBanner = (bg, color) => ({
  display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 12, border: 'none',
  background: bg, color, fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
});

const TabCaja = ({ esAdmin }) => {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [apertura, setApertura] = useState({ COP: '', USD: '', BS: '', notas: '' });
  const [enviando, setEnviando] = useState(false);
  const [modalMov, setModalMov] = useState(null); // 'ingreso' | 'egreso' | null
  const [mov, setMov] = useState({ moneda: 'COP', monto: '', descripcion: '' });
  const [modalCierre, setModalCierre] = useState(false);
  const [contado, setContado] = useState({ COP: '', USD: '', BS: '', notas: '' });
  const [resultadoCierre, setResultadoCierre] = useState(null);

  const cargar = useCallback(async () => {
    try {
      const { data } = await API.get('/caja/actual');
      setDatos(data);
      if (!data.sesion && data.ultimo_cierre) {
        const c = data.ultimo_cierre.contado;
        setApertura(a => ({ ...a, COP: String(c.COP ?? ''), USD: String(c.USD ?? ''), BS: String(c.BS ?? '') }));
      }
    } catch (err) { errorApi(err, 'Error cargando la caja'); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);
  // Refresco automático cada 30 s mientras la caja está abierta (entran ventas)
  useEffect(() => {
    if (!datos?.sesion) return;
    const t = setInterval(cargar, 30000);
    return () => clearInterval(t);
  }, [datos?.sesion, cargar]);

  const abrir = async () => {
    setEnviando(true);
    try {
      await API.post('/caja/abrir', { apertura_cop: apertura.COP, apertura_usd: apertura.USD, apertura_bs: apertura.BS, notas: apertura.notas });
      toast.success('🔓 Caja abierta');
      setApertura({ COP: '', USD: '', BS: '', notas: '' });
      await cargar();
    } catch (err) { errorApi(err, 'No se pudo abrir la caja'); }
    finally { setEnviando(false); }
  };

  const abrirModalMov = (tipo) => { setMov({ moneda: 'COP', monto: '', descripcion: '' }); setModalMov(tipo); };

  const guardarMovimiento = async () => {
    if (!mov.monto || Number(mov.monto) <= 0) return toast.error('Ingresa un monto mayor a 0');
    if (!mov.descripcion.trim()) return toast.error('Describe el motivo del movimiento');
    setEnviando(true);
    try {
      const { data } = await API.post('/caja/movimientos', { tipo: modalMov, ...mov });
      toast.success(data.mensaje);
      setModalMov(null);
      await cargar();
    } catch (err) { errorApi(err, 'No se pudo registrar el movimiento'); }
    finally { setEnviando(false); }
  };

  const eliminarMovimiento = async (m) => {
    if (!window.confirm(`¿Eliminar el ${m.tipo} "${m.descripcion}" por ${fmt(m.moneda, m.monto)}?`)) return;
    try {
      await API.delete(`/caja/movimientos/${m.id}`);
      toast.success('Movimiento eliminado');
      await cargar();
    } catch (err) { errorApi(err, 'No se pudo eliminar'); }
  };

  const abrirModalCierre = () => { setContado({ COP: '', USD: '', BS: '', notas: '' }); setModalCierre(true); };

  const cerrar = async () => {
    if (MONEDAS.some(m => contado[m] === '')) return toast.error('Ingresa lo contado en las 3 monedas (0 si no hay)');
    setEnviando(true);
    try {
      const { data } = await API.post('/caja/cerrar', { contado_cop: contado.COP, contado_usd: contado.USD, contado_bs: contado.BS, notas: contado.notas });
      toast.success('🔒 Caja cerrada');
      setModalCierre(false);
      setResultadoCierre(data.sesion);
      imprimirCierre(data.sesion); // recibo de cierre con todas las ventas
      await cargar();
    } catch (err) { errorApi(err, 'No se pudo cerrar la caja'); }
    finally { setEnviando(false); }
  };

  if (cargando) return <Spinner />;
  const sesion = datos?.sesion;
  const ultimo = datos?.ultimo_cierre;

  /* ── Caja cerrada: formulario de apertura ── */
  if (!sesion) {
    return (
      <>
        <div className="card-mm" style={{ maxWidth: 760, margin: '0 auto', padding: 0, overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--verde) 0%, var(--verde-medio) 100%)', color: '#fff', padding: '28px 28px 24px', display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ width: 60, height: 60, borderRadius: 18, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.9rem', flexShrink: 0 }}>
              <RiLockLine />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>La caja está cerrada</div>
              <div style={{ fontSize: '0.82rem', opacity: 0.85 }}>
                {ultimo ? `Último cierre: ${fmtFechaHora(ultimo.cerrada_en)} por ${ultimo.cerrada_por}` : 'Aún no se ha abierto ninguna caja'}
              </div>
            </div>
          </div>
          <div style={{ padding: 28 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Fondo de apertura</div>
            <p style={{ fontSize: '0.8rem', color: 'var(--texto-suave)', marginBottom: 18 }}>
              Cuenta el efectivo que hay en el cajón en cada moneda.
              {ultimo && ' Te mostramos lo que debería haber según el último cierre.'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 16 }}>
              {MONEDAS.map(m => {
                const esperado = ultimo?.contado?.[m];
                const difiere = ultimo && apertura[m] !== '' && Math.abs(Number(apertura[m]) - Number(esperado || 0)) >= 0.005;
                return (
                  <div key={m} style={{ background: INFO[m].fondo, border: `1px solid ${INFO[m].borde}`, borderRadius: 14, padding: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: INFO[m].color, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 7 }}>
                      <Chip moneda={m} /> {INFO[m].nombre}
                    </div>
                    <InputMonto moneda={m} value={apertura[m]} onChange={v => setApertura(a => ({ ...a, [m]: v }))} />
                    {ultimo && (
                      <div style={{ fontSize: '0.72rem', marginTop: 8, color: difiere ? '#C62828' : 'var(--texto-suave)', fontWeight: difiere ? 700 : 500 }}>
                        {difiere ? '⚠️ ' : '✓ '}Esperado: {fmt(m, esperado)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <Etiqueta>Notas (opcional)</Etiqueta>
            <input className="input-mm" placeholder="Ej: faltaba sencillo, se agregó cambio..." value={apertura.notas}
              onChange={e => setApertura(a => ({ ...a, notas: e.target.value }))} style={{ marginBottom: 20 }} />
            <button className="btn-verde" onClick={abrir} disabled={enviando}
              style={{ width: '100%', padding: 14, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <RiLockUnlockLine /> {enviando ? 'Abriendo...' : 'Abrir caja'}
            </button>
          </div>
        </div>
        <Modal show={!!resultadoCierre} onClose={() => setResultadoCierre(null)} titulo={`Resumen del cierre #${resultadoCierre?.id}`} icono={<RiFileList3Line />} maxWidth={860}>
          {resultadoCierre && <DetalleSesion sesion={resultadoCierre} />}
        </Modal>
      </>
    );
  }

  /* ── Caja abierta ── */
  const m = sesion.monedas;
  return (
    <div>
      {/* Banner de estado */}
      <div style={{
        background: 'linear-gradient(135deg, var(--verde) 0%, var(--verde-medio) 100%)', color: '#fff', borderRadius: 18,
        padding: '20px 24px', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14,
        boxShadow: '0 8px 24px rgba(27,94,32,0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>
            <RiLockUnlockLine />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: '1.1rem' }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--naranja-claro)', boxShadow: '0 0 0 4px rgba(255,179,0,0.3)' }} />
              Caja abierta #{sesion.id}
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>
              Desde {fmtFechaHora(sesion.abierta_en)} · {sesion.abierta_por} · {ventasTxt(sesion.ventas.cantidad)}
              {sesion.ventas.anuladas ? ` · ${sesion.ventas.anuladas} anuladas` : ''}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => abrirModalMov('ingreso')} style={botonBanner('#fff', 'var(--verde)')}><RiArrowDownCircleLine /> Ingreso</button>
          <button onClick={() => abrirModalMov('egreso')} style={botonBanner('#fff', '#C62828')}><RiArrowUpCircleLine /> Egreso</button>
          <button onClick={abrirModalCierre} style={botonBanner('var(--naranja)', '#fff')}><RiLockLine /> Cerrar caja</button>
          <button onClick={cargar} title="Actualizar" style={botonBanner('rgba(255,255,255,0.15)', '#fff')}><RiRefreshLine /></button>
        </div>
      </div>

      {/* Monedas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 18 }}>
        {MONEDAS.map(mo => <TarjetaMoneda key={mo} moneda={mo} datos={m[mo]} />)}
      </div>

      {/* Movimientos */}
      <div className="card-mm">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 10 }}>
          <div style={{ fontWeight: 700 }}>Ingresos y egresos de la caja</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--texto-suave)', whiteSpace: 'nowrap' }}>{sesion.movimientos.length} movimientos</span>
        </div>
        <ListaMovimientos movimientos={sesion.movimientos} onEliminar={esAdmin ? eliminarMovimiento : null} />
      </div>

      {/* Modal ingreso / egreso */}
      <Modal show={!!modalMov} onClose={() => setModalMov(null)}
        titulo={modalMov === 'ingreso' ? 'Registrar ingreso' : 'Registrar egreso'}
        icono={modalMov === 'ingreso' ? <RiArrowDownCircleLine /> : <RiArrowUpCircleLine />}
        color={modalMov === 'ingreso' ? 'var(--verde)' : '#C62828'} maxWidth={460}>
        <p style={{ fontSize: '0.8rem', color: 'var(--texto-suave)', marginTop: -6 }}>
          {modalMov === 'ingreso' ? 'Efectivo que entra a la caja y no es una venta.' : 'Efectivo que sale de la caja (retiros, pagos, compras).'}
        </p>
        <Etiqueta>Moneda</Etiqueta>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {MONEDAS.map(mo => (
            <button key={mo} onClick={() => setMov(v => ({ ...v, moneda: mo }))} style={{
              flex: 1, padding: '10px 6px', borderRadius: 12, cursor: 'pointer', fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.82rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              border: `2px solid ${mov.moneda === mo ? INFO[mo].color : '#E0E0E0'}`,
              background: mov.moneda === mo ? INFO[mo].fondo : '#fff', color: mov.moneda === mo ? INFO[mo].color : 'var(--texto-suave)'
            }}><Chip moneda={mo} /> {mo}</button>
          ))}
        </div>
        <Etiqueta>Monto</Etiqueta>
        <div style={{ marginBottom: 6 }}>
          <InputMonto moneda={mov.moneda} value={mov.monto} onChange={v => setMov(x => ({ ...x, monto: v }))} autoFocus />
        </div>
        {modalMov === 'egreso' && Number(mov.monto) > m[mov.moneda].esperado && (
          <div style={{ fontSize: '0.74rem', color: '#C62828', fontWeight: 600, marginBottom: 6 }}>
            ⚠️ Es más de lo que debería haber en caja ({fmt(mov.moneda, m[mov.moneda].esperado)})
          </div>
        )}
        <div style={{ marginTop: 10 }}><Etiqueta>Descripción</Etiqueta></div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {SUGERENCIAS[modalMov || 'egreso'].map(s => (
            <button key={s} onClick={() => setMov(x => ({ ...x, descripcion: s }))} style={{
              padding: '4px 10px', borderRadius: 20, border: '1px solid #E0E0E0', background: mov.descripcion === s ? 'var(--crema-oscuro)' : '#fff',
              fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'Poppins', color: 'var(--texto)'
            }}>{s}</button>
          ))}
        </div>
        <textarea className="input-mm" rows={2} placeholder="¿Por qué entra o sale este dinero?" value={mov.descripcion}
          onChange={e => setMov(x => ({ ...x, descripcion: e.target.value }))} style={{ resize: 'vertical', marginBottom: 18 }} />
        <button onClick={guardarMovimiento} disabled={enviando} className={modalMov === 'ingreso' ? 'btn-verde' : ''} style={{
          width: '100%', padding: 13, ...(modalMov === 'egreso' ? { background: '#C62828', color: '#fff', border: 'none', borderRadius: 12, fontFamily: 'Poppins', fontWeight: 700, cursor: 'pointer' } : {})
        }}>{enviando ? 'Guardando...' : `Registrar ${modalMov}`}</button>
      </Modal>

      {/* Modal cierre */}
      <Modal show={modalCierre} onClose={() => setModalCierre(false)} titulo={`Cerrar caja #${sesion.id}`} icono={<RiLockLine />} color="var(--naranja)" maxWidth={620}>
        <p style={{ fontSize: '0.82rem', color: 'var(--texto-suave)', marginTop: -6 }}>
          Cuenta el efectivo del cajón en cada moneda. El sistema compara con lo esperado.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {MONEDAS.map(mo => {
            const esperado = m[mo].esperado;
            const dif = contado[mo] === '' ? null : Math.round((Number(contado[mo]) - esperado) * 100) / 100;
            return (
              <div key={mo} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) minmax(150px, 1.2fr)', gap: 12, alignItems: 'center', background: INFO[mo].fondo, borderRadius: 14, padding: '12px 14px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.84rem', color: INFO[mo].color, display: 'flex', alignItems: 'center', gap: 6 }}><Chip moneda={mo} /> {INFO[mo].nombre}</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--texto-suave)' }}>Esperado: <strong>{fmt(mo, esperado)}</strong></div>
                  <div style={{ marginTop: 4 }}><Diferencia moneda={mo} valor={dif} /></div>
                </div>
                <InputMonto moneda={mo} value={contado[mo]} onChange={v => setContado(c => ({ ...c, [mo]: v }))} />
              </div>
            );
          })}
        </div>
        <Etiqueta>Notas del cierre (opcional)</Etiqueta>
        <input className="input-mm" placeholder="Ej: faltante por error de vuelto" value={contado.notas}
          onChange={e => setContado(c => ({ ...c, notas: e.target.value }))} style={{ marginBottom: 18 }} />
        <button className="btn-naranja" onClick={cerrar} disabled={enviando}
          style={{ width: '100%', padding: 14, fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <RiLockLine /> {enviando ? 'Cerrando...' : 'Confirmar cierre de caja'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10, fontSize: '0.76rem', color: 'var(--texto-suave)', flexWrap: 'wrap' }}>
          <RiPrinterLine /> Al cerrar se imprime el recibo con todas las ventas.
          {soportaImpresionDirecta() && (
            <button type="button" onClick={conectarImpresora} style={{ background: 'none', border: 'none', color: 'var(--verde)', fontWeight: 700, cursor: 'pointer', fontFamily: 'Poppins', fontSize: '0.76rem', padding: 0 }}>
              🔌 Conectar impresora
            </button>
          )}
        </div>
      </Modal>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   Tabla moneda × tipo de pago (diario y semanal)
   ════════════════════════════════════════════════════════════════ */
const TablaPorMoneda = ({ porMoneda, movimientos }) => (
  <div style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', minWidth: 520 }}>
      <thead>
        <tr style={{ color: 'var(--texto-suave)', fontSize: '0.72rem', textTransform: 'uppercase', textAlign: 'right' }}>
          <th style={{ textAlign: 'left', padding: '8px 10px' }}>Moneda</th>
          <th style={{ padding: '8px 10px' }}>Efectivo</th>
          <th style={{ padding: '8px 10px' }}>Transferencia</th>
          <th style={{ padding: '8px 10px' }}>Total vendido</th>
          {movimientos && <th style={{ padding: '8px 10px' }}>Ingresos / Egresos</th>}
        </tr>
      </thead>
      <tbody>
        {MONEDAS.map(mo => {
          const d = porMoneda[mo];
          const total = d.efectivo.total + d.transferencia.total;
          return (
            <tr key={mo} style={{ borderTop: '1px solid #F0F0F0', textAlign: 'right' }}>
              <td style={{ textAlign: 'left', padding: '10px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, color: INFO[mo].color }}>
                  <Chip moneda={mo} /> {INFO[mo].nombre}
                </span>
              </td>
              <td style={{ padding: 10 }}>{fmt(mo, d.efectivo.total)}<div style={{ fontSize: '0.7rem', color: 'var(--texto-suave)' }}>{ventasTxt(d.efectivo.cantidad)}</div></td>
              <td style={{ padding: 10 }}>{fmt(mo, d.transferencia.total)}<div style={{ fontSize: '0.7rem', color: 'var(--texto-suave)' }}>{ventasTxt(d.transferencia.cantidad)}</div></td>
              <td style={{ padding: 10, fontWeight: 800, color: INFO[mo].color }}>{fmt(mo, total)}</td>
              {movimientos && (
                <td style={{ padding: 10, fontSize: '0.78rem' }}>
                  <div style={{ color: '#2E7D32' }}>+ {fmt(mo, movimientos[mo].ingresos)}</div>
                  <div style={{ color: '#C62828' }}>− {fmt(mo, movimientos[mo].egresos)}</div>
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const botonIcono = {
  width: 38, height: 38, borderRadius: 11, border: '1px solid #E0E0E0', background: '#fff', color: 'var(--verde)',
  cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
};

const SelectorFecha = ({ valor, onAnterior, onSiguiente, onHoy, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
    <button onClick={onAnterior} style={botonIcono}><RiArrowLeftSLine /></button>
    {children}
    <button onClick={onSiguiente} style={botonIcono}><RiArrowRightSLine /></button>
    <button onClick={onHoy} style={{ ...botonIcono, width: 'auto', padding: '0 14px', fontSize: '0.8rem', fontWeight: 700, fontFamily: 'Poppins' }}>{valor}</button>
  </div>
);

const EstadoSesion = ({ estado }) => (
  <span style={{
    fontSize: '0.68rem', fontWeight: 700, borderRadius: 20, padding: '2px 10px', textTransform: 'uppercase',
    background: estado === 'abierta' ? '#E8F5E9' : '#F5F5F5', color: estado === 'abierta' ? '#2E7D32' : 'var(--texto-suave)'
  }}>{estado === 'abierta' ? '● Abierta' : 'Cerrada'}</span>
);

/* ════════════════════════════════════════════════════════════════
   TAB 2 — CONTABILIDAD DIARIA
   ════════════════════════════════════════════════════════════════ */
const TabDiario = ({ onVerSesion }) => {
  const [fecha, setFecha] = useState(hoy());
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    API.get(`/caja/diario?fecha=${fecha}`)
      .then(({ data }) => vigente && setDatos(data))
      .catch(err => errorApi(err, 'Error cargando el día'))
      .finally(() => vigente && setCargando(false));
    return () => { vigente = false; };
  }, [fecha]);

  return (
    <div>
      <div className="card-mm" style={{ padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontWeight: 700 }}>{cap(fmtFecha(fecha, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--texto-suave)' }}>Contabilidad del día (hora de Venezuela)</div>
        </div>
        <SelectorFecha valor="Hoy"
          onAnterior={() => setFecha(f => sumarDias(f, -1))}
          onSiguiente={() => setFecha(f => (sumarDias(f, 1) > hoy() ? f : sumarDias(f, 1)))}
          onHoy={() => setFecha(hoy())}>
          <input type="date" className="input-mm" value={fecha} max={hoy()} onChange={e => e.target.value && setFecha(e.target.value)} style={{ width: 170, padding: '8px 12px' }} />
        </SelectorFecha>
      </div>

      {cargando || !datos ? <Spinner /> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 16 }}>
            <MiniStat icono={<RiFileList3Line />} label="Ventas del día" valor={datos.ventas.cantidad} sub={`${datos.ventas.anuladas} anuladas`} />
            <MiniStat icono={<Chip moneda="COP" grande />} label="Equivalente en pesos" valor={fmt('COP', datos.ventas.total_cop)} color="#E65100" />
            <MiniStat icono={<Chip moneda="USD" grande />} label="Equivalente en dólares" valor={fmt('USD', datos.ventas.total_usd)} color="#1B5E20" />
            <MiniStat icono={<RiSafe2Line />} label="Cajas del día" valor={datos.sesiones.length} color="#1565C0"
              sub={datos.sesiones.some(s => s.estado === 'abierta') ? 'Hay una caja abierta' : 'Todas cerradas'} />
          </div>

          {datos.efectivo_fuera_de_caja > 0 && (
            <div style={{ background: '#FFF3E0', border: '1px solid #FFB300', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: '0.84rem', color: '#E65100', fontWeight: 600, display: 'flex', gap: 8, alignItems: 'center' }}>
              <RiErrorWarningLine style={{ fontSize: '1.2rem', flexShrink: 0 }} />
              {datos.efectivo_fuera_de_caja} venta{datos.efectivo_fuera_de_caja > 1 ? 's' : ''} en efectivo se hicieron con la caja cerrada y no quedan cuadradas en ninguna caja.
            </div>
          )}

          <div className="card-mm" style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Ventas por moneda y forma de pago</div>
            <TablaPorMoneda porMoneda={datos.ventas.por_moneda} movimientos={datos.totales_movimientos} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 16, marginBottom: 16 }}>
            <div className="card-mm">
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Cajas del día</div>
              {datos.sesiones.length === 0 ? <Vacio icono="🔒" texto="No se abrió caja este día" /> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {datos.sesiones.map(s => (
                    <div key={s.id} onClick={() => onVerSesion(s.id)} style={{ border: '1px solid #EEE', borderRadius: 12, padding: '12px 14px', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Caja #{s.id}</span>
                        <EstadoSesion estado={s.estado} />
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--texto-suave)', marginBottom: 8 }}>
                        {fmtHora(s.abierta_en)} → {s.cerrada_en ? fmtHora(s.cerrada_en) : 'en curso'} · {s.abierta_por}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {MONEDAS.map(mo => s.estado === 'cerrada'
                          ? <span key={mo} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.7rem' }}><Chip moneda={mo} /> <Diferencia moneda={mo} valor={s.monedas[mo].diferencia} /></span>
                          : <span key={mo} style={{ fontSize: '0.72rem', background: INFO[mo].fondo, color: INFO[mo].color, borderRadius: 8, padding: '2px 8px', fontWeight: 600 }}>{fmt(mo, s.monedas[mo].esperado)}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="card-mm">
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Ingresos y egresos</div>
              <ListaMovimientos movimientos={datos.movimientos} />
            </div>
          </div>

          <div className="card-mm">
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Detalle de ventas ({datos.lista_ventas.length})</div>
            {datos.lista_ventas.length === 0 ? <Vacio icono="🧾" texto="Sin ventas este día" /> : (
              <div style={{ overflowX: 'auto', maxHeight: 420, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: 560 }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#fff' }}>
                    <tr style={{ color: 'var(--texto-suave)', fontSize: '0.7rem', textTransform: 'uppercase', textAlign: 'left' }}>
                      {['Hora', 'Pedido', 'Moneda', 'Pago', 'Total', 'Cajero'].map(h => <th key={h} style={{ padding: '8px 10px' }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {datos.lista_ventas.map(v => {
                      // Un pago normal tiene una parte; un pago dividido, dos
                      const pagos = [{ m: v.moneda_pago, t: v.tipo_pago, x: v.total_pagado }, ...(v.moneda_pago_2 ? [{ m: v.moneda_pago_2, t: v.tipo_pago_2, x: v.total_pagado_2 }] : [])];
                      return (
                      <tr key={v.id} style={{ borderTop: '1px solid #F5F5F5', opacity: v.anulada ? 0.5 : 1 }}>
                        <td style={{ padding: '8px 10px' }}>{fmtHora(v.creado_en)}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 600 }}>#{v.id} {v.anulada && <span style={{ fontSize: '0.65rem', background: '#FFEBEE', color: '#C62828', borderRadius: 6, padding: '1px 6px', marginLeft: 4 }}>ANULADA</span>}</td>
                        <td style={{ padding: '8px 10px' }}>{pagos.map((p, i) => <div key={i}><span className={`badge badge-${p.m.toLowerCase()}`} style={{ borderRadius: 6 }}>{p.m}</span></div>)}</td>
                        <td style={{ padding: '8px 10px', textTransform: 'capitalize' }}>{pagos.map((p, i) => <div key={i}>{p.t}</div>)}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 700, textDecoration: v.anulada ? 'line-through' : 'none' }}>{pagos.map((p, i) => <div key={i}>{fmt(p.m, p.x)}</div>)}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--texto-suave)' }}>{v.cajero || '—'}</td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   TAB 3 — CIERRE SEMANAL
   ════════════════════════════════════════════════════════════════ */
const ResumenSemana = ({ resumen }) => {
  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(resumen.fecha_inicio, i));
  const porDia = Object.fromEntries(resumen.por_dia.map(d => [d.fecha, d]));
  const dif = resumen.sesiones.diferencias;
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 14 }}>
        <MiniStat icono={<RiFileList3Line />} label="Ventas de la semana" valor={resumen.ventas.cantidad} sub={`${resumen.ventas.anuladas} anuladas`} />
        <MiniStat icono={<Chip moneda="COP" grande />} label="Equivalente en pesos" valor={fmt('COP', resumen.ventas.total_cop)} color="#E65100" />
        <MiniStat icono={<Chip moneda="USD" grande />} label="Equivalente en dólares" valor={fmt('USD', resumen.ventas.total_usd)} color="#1B5E20" />
        <MiniStat icono={<RiSafe2Line />} label="Cajas de la semana" valor={resumen.sesiones.cantidad} color="#1565C0" />
      </div>

      <div className="card-mm" style={{ marginBottom: 14, padding: 18 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Día por día</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: 560 }}>
            <thead>
              <tr style={{ color: 'var(--texto-suave)', fontSize: '0.7rem', textTransform: 'uppercase', textAlign: 'right' }}>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Día</th><th style={{ padding: '6px 8px' }}>Ventas</th>
                {MONEDAS.map(mo => <th key={mo} style={{ padding: '6px 8px' }}>{mo}</th>)}
                <th style={{ padding: '6px 8px' }}>Eq. USD</th>
              </tr>
            </thead>
            <tbody>
              {dias.map(f => {
                const d = porDia[f];
                return (
                  <tr key={f} style={{ borderTop: '1px solid #F5F5F5', textAlign: 'right', color: d ? 'var(--texto)' : '#BDBDBD' }}>
                    <td style={{ textAlign: 'left', padding: '7px 8px', fontWeight: 600 }}>{cap(fmtFecha(f))}</td>
                    <td style={{ padding: '7px 8px' }}>{d?.cantidad || 0}</td>
                    {MONEDAS.map(mo => <td key={mo} style={{ padding: '7px 8px', color: d?.[mo] ? INFO[mo].color : undefined }}>{d?.[mo] ? fmt(mo, d[mo]) : '—'}</td>)}
                    <td style={{ padding: '7px 8px', fontWeight: 700 }}>{d ? fmt('USD', d.total_usd) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card-mm" style={{ marginBottom: 14, padding: 18 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Totales por moneda</div>
        <TablaPorMoneda porMoneda={resumen.ventas.por_moneda} movimientos={resumen.movimientos} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12, fontSize: '0.78rem', alignItems: 'center' }}>
          <span style={{ color: 'var(--texto-suave)', fontWeight: 600 }}>Descuadre acumulado de cajas:</span>
          {MONEDAS.map(mo => <span key={mo} style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}><Chip moneda={mo} /> <Diferencia moneda={mo} valor={dif[mo]} /></span>)}
        </div>
      </div>
    </div>
  );
};

const botonAccion = (color, bg) => ({
  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px 10px', borderRadius: 10, border: 'none',
  background: bg, color, fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.76rem', cursor: 'pointer', whiteSpace: 'nowrap'
});

const TarjetaCierre = ({ c, onVer, onBorrarVentas, onBorrarCierre }) => (
  <div className="card-mm" style={{ padding: 18, display: 'flex', flexDirection: 'column' }}>
    <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: 2 }}>
      {cap(fmtFecha(c.fecha_inicio, { day: 'numeric', month: 'short' }))} → {fmtFecha(c.fecha_fin, { day: 'numeric', month: 'short', year: 'numeric' })}
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
      <span style={{ fontSize: '0.72rem', color: 'var(--texto-suave)' }}>Cerrada {fmtFechaHora(c.cerrado_en)} · {c.cerrado_por}</span>
      {c.ventas_eliminadas
        ? <span style={{ fontSize: '0.66rem', fontWeight: 700, background: '#FFEBEE', color: '#C62828', borderRadius: 20, padding: '3px 9px', whiteSpace: 'nowrap' }}>{c.total_ventas_eliminadas} ventas borradas</span>
        : <span style={{ fontSize: '0.66rem', fontWeight: 700, background: '#E8F5E9', color: '#2E7D32', borderRadius: 20, padding: '3px 9px', whiteSpace: 'nowrap' }}>{ventasTxt(c.ventas_en_bd)} en sistema</span>}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 0.6fr', gap: 8, marginBottom: 12 }}>
      {[
        { label: 'Eq. pesos', valor: fmt('COP', c.resumen.ventas.total_cop), color: '#E65100', bg: '#FFF3E0' },
        { label: 'Eq. dólares', valor: fmt('USD', c.resumen.ventas.total_usd), color: '#1B5E20', bg: '#E8F5E9' },
        { label: 'Ventas', valor: c.resumen.ventas.cantidad, color: 'var(--texto)', bg: 'var(--crema)' }
      ].map(x => (
        <div key={x.label} style={{ background: x.bg, borderRadius: 10, padding: '8px 10px', minWidth: 0 }}>
          <div style={{ fontSize: '0.66rem', color: 'var(--texto-suave)' }}>{x.label}</div>
          <div style={{ fontWeight: 800, fontSize: '0.84rem', color: x.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.valor}</div>
        </div>
      ))}
    </div>
    {c.notas && <div style={{ fontSize: '0.76rem', color: 'var(--texto-suave)', marginBottom: 10 }}>📝 {c.notas}</div>}
    <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
      <button onClick={onVer} style={botonAccion('var(--verde)', '#E8F5E9')}><RiEyeLine /> Ver</button>
      <button onClick={onBorrarVentas} disabled={c.ventas_en_bd === 0}
        style={{ ...botonAccion('#C62828', '#FFEBEE'), opacity: c.ventas_en_bd === 0 ? 0.4 : 1, cursor: c.ventas_en_bd === 0 ? 'not-allowed' : 'pointer' }}>
        <RiDeleteBin6Line /> Borrar ventas
      </button>
      <button onClick={onBorrarCierre} title="Eliminar este cierre" style={{ ...botonAccion('var(--texto-suave)', '#F5F5F5'), flex: 'none', padding: '8px 11px' }}><RiCloseLine /></button>
    </div>
  </div>
);

const TabSemanal = () => {
  const [inicio, setInicio] = useState(lunesDe(hoy()));
  const [preview, setPreview] = useState(null);
  const [cierres, setCierres] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [notas, setNotas] = useState('');
  const [cerrando, setCerrando] = useState(false);
  const [verCierre, setVerCierre] = useState(null);
  const [borrarVentas, setBorrarVentas] = useState(null);
  const [borrarCierre, setBorrarCierre] = useState(null);

  const cargarCierres = useCallback(() =>
    API.get('/caja/semanal').then(({ data }) => setCierres(data.cierres)).catch(err => errorApi(err, 'Error cargando cierres')), []);

  const cargarPreview = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await API.get(`/caja/semanal/preview?fecha_inicio=${inicio}`);
      setPreview(data);
    } catch (err) { errorApi(err, 'Error calculando la semana'); }
    finally { setCargando(false); }
  }, [inicio]);

  useEffect(() => { cargarPreview(); }, [cargarPreview]);
  useEffect(() => { cargarCierres(); }, [cargarCierres]);

  const cerrarSemana = async () => {
    const aviso = preview.semana_en_curso ? '\n\nLa semana aún no termina: las ventas posteriores al cierre no quedarán en este resumen.' : '';
    if (!window.confirm(`¿Cerrar la semana del ${fmtFecha(inicio)} al ${fmtFecha(preview.resumen.fecha_fin)}?${aviso}`)) return;
    setCerrando(true);
    try {
      await API.post('/caja/semanal/cerrar', { fecha_inicio: inicio, notas });
      toast.success('📅 Semana cerrada');
      setNotas('');
      await Promise.all([cargarPreview(), cargarCierres()]);
    } catch (err) { errorApi(err, 'No se pudo cerrar la semana'); }
    finally { setCerrando(false); }
  };

  const confirmarBorrarVentas = async (cred) => {
    try {
      const { data } = await API.delete(`/caja/semanal/${borrarVentas.id}/ventas`, { data: cred });
      toast.success(data.mensaje);
      setBorrarVentas(null);
      await Promise.all([cargarCierres(), cargarPreview()]);
    } catch (err) { errorApi(err, 'No se pudieron eliminar las ventas'); }
  };

  const confirmarBorrarCierre = async (cred) => {
    try {
      await API.delete(`/caja/semanal/${borrarCierre.id}`, { data: cred });
      toast.success('Cierre semanal eliminado');
      setBorrarCierre(null);
      await Promise.all([cargarCierres(), cargarPreview()]);
    } catch (err) { errorApi(err, 'No se pudo eliminar el cierre'); }
  };

  return (
    <div>
      <div className="card-mm" style={{ padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontWeight: 700 }}>Semana del {fmtFecha(inicio, { day: 'numeric', month: 'long' })} al {fmtFecha(sumarDias(inicio, 6), { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--texto-suave)' }}>7 días · lunes a domingo (puedes elegir otro día de inicio)</div>
        </div>
        <SelectorFecha valor="Esta semana" onAnterior={() => setInicio(f => sumarDias(f, -7))} onSiguiente={() => setInicio(f => sumarDias(f, 7))} onHoy={() => setInicio(lunesDe(hoy()))}>
          <input type="date" className="input-mm" value={inicio} max={hoy()} onChange={e => e.target.value && setInicio(e.target.value)} style={{ width: 170, padding: '8px 12px' }} />
        </SelectorFecha>
      </div>

      {cargando || !preview ? <Spinner /> : (
        <>
          <ResumenSemana resumen={preview.resumen} />
          <div className="card-mm" style={{ marginBottom: 22, border: preview.puede_cerrar ? '2px solid var(--naranja-claro)' : '1px solid #EEE' }}>
            {preview.bloqueos.map(b => (
              <div key={b} style={{ background: '#FFF3E0', borderRadius: 10, padding: '10px 14px', marginBottom: 10, fontSize: '0.83rem', color: '#E65100', fontWeight: 600, display: 'flex', gap: 8, alignItems: 'center' }}>
                <RiErrorWarningLine style={{ flexShrink: 0 }} /> {b}
              </div>
            ))}
            {preview.puede_cerrar && preview.semana_en_curso && (
              <div style={{ background: '#E3F2FD', borderRadius: 10, padding: '10px 14px', marginBottom: 10, fontSize: '0.8rem', color: '#1565C0' }}>
                ℹ️ La semana aún está en curso. Lo ideal es cerrarla al terminar el domingo.
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <input className="input-mm" placeholder="Notas del cierre semanal (opcional)" value={notas} onChange={e => setNotas(e.target.value)} style={{ flex: '1 1 260px' }} disabled={!preview.puede_cerrar} />
              <button className="btn-naranja" onClick={cerrarSemana} disabled={!preview.puede_cerrar || cerrando}
                style={{ padding: '12px 22px', display: 'flex', alignItems: 'center', gap: 8, opacity: preview.puede_cerrar ? 1 : 0.5, cursor: preview.puede_cerrar ? 'pointer' : 'not-allowed' }}>
                <RiCalendarCheckLine /> {cerrando ? 'Cerrando...' : 'Cerrar semana'}
              </button>
            </div>
          </div>
        </>
      )}

      <h6 style={{ fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><RiHistoryLine style={{ color: 'var(--verde)' }} /> Semanas cerradas</h6>
      {cierres.length === 0 ? <div className="card-mm"><Vacio icono="📅" texto="Todavía no hay semanas cerradas" /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))', gap: 14 }}>
          {cierres.map(c => (
            <TarjetaCierre key={c.id} c={c} onVer={() => setVerCierre(c)} onBorrarVentas={() => setBorrarVentas(c)} onBorrarCierre={() => setBorrarCierre(c)} />
          ))}
        </div>
      )}

      <Modal show={!!verCierre} onClose={() => setVerCierre(null)} icono={<RiCalendarLine />} maxWidth={900}
        titulo={verCierre ? `Semana ${fmtFecha(verCierre.fecha_inicio, { day: 'numeric', month: 'short' })} → ${fmtFecha(verCierre.fecha_fin, { day: 'numeric', month: 'short' })}` : ''}>
        {verCierre && <ResumenSemana resumen={verCierre.resumen} />}
      </Modal>

      <ModalConfirmar show={!!borrarVentas} onClose={() => setBorrarVentas(null)} titulo="Eliminar ventas de la semana"
        pedirTexto="ELIMINAR" textoBoton={`Eliminar ${borrarVentas?.ventas_en_bd || 0} ventas definitivamente`} onConfirmar={confirmarBorrarVentas}>
        Se borrarán <strong>definitivamente</strong> las <strong>{borrarVentas?.ventas_en_bd}</strong> ventas del{' '}
        {borrarVentas && `${fmtFecha(borrarVentas.fecha_inicio)} al ${fmtFecha(borrarVentas.fecha_fin)}`} (con sus productos).
        El resumen de este cierre semanal y los cierres de caja se conservan. Esta acción no se puede deshacer.
      </ModalConfirmar>

      <ModalConfirmar show={!!borrarCierre} onClose={() => setBorrarCierre(null)} titulo="Eliminar cierre semanal"
        textoBoton="Eliminar cierre" onConfirmar={confirmarBorrarCierre}>
        Se eliminará el registro de este cierre y la semana quedará abierta para cerrarla de nuevo.
        {borrarCierre?.ventas_eliminadas && <><br /><br /><strong>Ojo:</strong> las ventas de esta semana ya fueron borradas; este resumen es el único registro que queda.</>}
      </ModalConfirmar>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   TAB 4 — HISTORIAL DE CAJAS
   ════════════════════════════════════════════════════════════════ */
const TabHistorial = ({ onVerSesion }) => {
  const [sesiones, setSesiones] = useState(null);
  useEffect(() => {
    API.get('/caja/sesiones?limite=100').then(({ data }) => setSesiones(data.sesiones)).catch(err => errorApi(err, 'Error cargando historial'));
  }, []);
  if (!sesiones) return <Spinner />;
  if (!sesiones.length) return <div className="card-mm"><Vacio icono="🗃️" texto="Aún no hay cajas registradas" /></div>;
  return (
    <div className="card-mm" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', minWidth: 760 }}>
          <thead style={{ background: 'var(--crema)' }}>
            <tr style={{ color: 'var(--texto-suave)', fontSize: '0.7rem', textTransform: 'uppercase', textAlign: 'left' }}>
              {['Caja', 'Apertura', 'Cierre', 'Estado'].map(h => <th key={h} style={{ padding: '12px 14px' }}>{h}</th>)}
              {MONEDAS.map(m => <th key={m} style={{ padding: '12px 14px' }}><Chip moneda={m} /> {m}</th>)}
              <th />
            </tr>
          </thead>
          <tbody>
            {sesiones.map(s => (
              <tr key={s.id} style={{ borderTop: '1px solid #F5F5F5' }}>
                <td style={{ padding: '12px 14px', fontWeight: 700 }}>#{s.id}{s.cierre_semanal_id && <span title="Incluida en un cierre semanal" style={{ marginLeft: 4 }}>📅</span>}</td>
                <td style={{ padding: '12px 14px' }}>{fmtFechaHora(s.abierta_en)}<div style={{ fontSize: '0.7rem', color: 'var(--texto-suave)' }}>{s.abierta_por}</div></td>
                <td style={{ padding: '12px 14px' }}>{s.cerrada_en ? fmtFechaHora(s.cerrada_en) : '—'}<div style={{ fontSize: '0.7rem', color: 'var(--texto-suave)' }}>{s.cerrada_por || ''}</div></td>
                <td style={{ padding: '12px 14px' }}><EstadoSesion estado={s.estado} /></td>
                {MONEDAS.map(mo => {
                  const d = s.monedas[mo];
                  return (
                    <td key={mo} style={{ padding: '12px 14px' }}>
                      {s.estado === 'cerrada' ? (
                        <>
                          <div style={{ fontWeight: 600 }}>{fmt(mo, d.contado)}</div>
                          <Diferencia moneda={mo} valor={d.contado - d.esperado} />
                        </>
                      ) : <span style={{ color: 'var(--texto-suave)', fontSize: '0.75rem' }}>Fondo {fmt(mo, d.apertura)}</span>}
                    </td>
                  );
                })}
                <td style={{ padding: '12px 14px' }}>
                  <button onClick={() => onVerSesion(s.id)} style={botonAccion('var(--verde)', '#E8F5E9')}><RiEyeLine /> Ver</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   PÁGINA
   ════════════════════════════════════════════════════════════════ */
export default function Caja() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'admin';
  const [tab, setTab] = useState('caja');
  const [sesionDetalle, setSesionDetalle] = useState(null);

  const verSesion = async (id) => {
    try {
      const { data } = await API.get(`/caja/sesiones/${id}`);
      setSesionDetalle(data.sesion);
    } catch (err) { errorApi(err, 'Error cargando la caja'); }
  };

  const tabs = [
    { v: 'caja', label: 'Caja', icono: <RiSafe2Line /> },
    ...(esAdmin ? [
      { v: 'diario', label: 'Contabilidad diaria', icono: <RiFileList3Line /> },
      { v: 'semanal', label: 'Cierre semanal', icono: <RiCalendarCheckLine /> },
      { v: 'historial', label: 'Historial', icono: <RiHistoryLine /> }
    ] : [])
  ];

  const subtitulos = {
    caja: 'Apertura, ingresos, egresos y cierre en COP, USD y BS',
    diario: 'Lo vendido y movido en caja cada día',
    semanal: 'Cierra la semana y administra sus registros',
    historial: 'Todas las cajas abiertas y cerradas'
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--texto)', marginBottom: 2 }}>Caja 💰</h1>
          <p style={{ color: 'var(--texto-suave)', fontSize: '0.82rem', margin: 0 }}>{subtitulos[tab]}</p>
        </div>
        {tabs.length > 1 && <Pestanas opciones={tabs} valor={tab} onChange={setTab} />}
      </div>

      {tab === 'caja' && <TabCaja esAdmin={esAdmin} />}
      {tab === 'diario' && esAdmin && <TabDiario onVerSesion={verSesion} />}
      {tab === 'semanal' && esAdmin && <TabSemanal />}
      {tab === 'historial' && esAdmin && <TabHistorial onVerSesion={verSesion} />}

      <Modal show={!!sesionDetalle} onClose={() => setSesionDetalle(null)} titulo={`Caja #${sesionDetalle?.id}`} icono={<RiSafe2Line />} maxWidth={880}>
        {sesionDetalle && <DetalleSesion sesion={sesionDetalle} />}
      </Modal>
    </div>
  );
}
