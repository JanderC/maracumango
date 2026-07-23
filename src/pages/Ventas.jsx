import { useState, useEffect } from 'react';
import API from '../api/axios';
import { toast } from 'react-toastify';
import {
  RiAddLine, RiSubtractLine, RiDeleteBinLine,
  RiSearchLine, RiCloseLine, RiCheckLine,
  RiImageLine, RiHistoryLine,
  RiShoppingCartLine, RiEyeLine, RiFileList2Line
} from 'react-icons/ri';

/* ─── Modal genérico ─── */
const Modal = ({ show, onClose, children, titulo, maxWidth = 520 }) => {
  if (!show) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1050,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth,
        maxHeight: '92vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
      }}>
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #F0F0F0',
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

/* ─── Card producto en el POS ─── */
const ProductoCard = ({ prod, onClick }) => (
  <div
    onClick={() => onClick(prod)}
    style={{
      background: '#fff', borderRadius: 14, overflow: 'hidden',
      cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '2px solid transparent'
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-3px)';
      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
      e.currentTarget.style.borderColor = 'var(--verde)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
      e.currentTarget.style.borderColor = 'transparent';
    }}
  >
    <div style={{ height: 100, background: 'var(--crema)', position: 'relative', overflow: 'hidden' }}>
      {prod.imagen_url
        ? <img src={prod.imagen_url} alt={prod.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RiImageLine style={{ fontSize: 28, color: '#BDBDBD' }} />
          </div>
      }
      {prod.tiene_variantes && (
        <span style={{
          position: 'absolute', top: 6, right: 6,
          background: '#1565C0', color: '#fff',
          borderRadius: 20, padding: '2px 8px', fontSize: '0.65rem', fontWeight: 700
        }}>🔗 Ver opciones</span>
      )}
    </div>
    <div style={{ padding: '10px 12px' }}>
      <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 2, lineHeight: 1.2 }}>{prod.nombre}</div>
      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--verde)' }}>
        ${Number(prod.precio_final_cop).toLocaleString('es-CO')}
      </div>
    </div>
  </div>
);

/* ─── Card de carpeta en el POS ─── */
const CarpetaCard = ({ carpeta, onClick }) => (
  <div
    onClick={() => onClick(carpeta)}
    style={{
      background: '#fff', borderRadius: 14, overflow: 'hidden',
      cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '2px solid #F3E5F5'
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-3px)';
      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
    }}
  >
    <div style={{ height: 100, background: 'var(--crema)', position: 'relative', overflow: 'hidden' }}>
      {carpeta.imagen_url
        ? <img src={carpeta.imagen_url} alt={carpeta.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RiImageLine style={{ fontSize: 28, color: '#BDBDBD' }} />
          </div>
      }
      <span style={{
        position: 'absolute', top: 6, left: 6,
        background: '#6A1B9A', color: '#fff',
        borderRadius: 20, padding: '2px 8px', fontSize: '0.65rem', fontWeight: 700
      }}>📁 {carpeta.total_productos}</span>
    </div>
    <div style={{ padding: '10px 12px' }}>
      <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 2, lineHeight: 1.2 }}>{carpeta.nombre}</div>
      <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#6A1B9A' }}>Ver opciones →</div>
    </div>
  </div>
);

/* ─── Modal variantes (opciones de un producto principal) ─── */
const ModalVariantes = ({ padre, variantes, onSeleccionar, onClose }) => {
  if (!padre) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1055,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 440, maxHeight: '85vh', overflowY: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <h5 style={{ fontWeight: 700, margin: 0 }}>{padre.nombre}</h5>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer' }}><RiCloseLine /></button>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--texto-suave)', marginBottom: 16 }}>Elige la opción que desea el cliente</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {variantes.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--texto-suave)', fontSize: '0.85rem' }}>
              Este producto no tiene opciones activas todavía.
            </div>
          ) : variantes.map(v => (
            <button key={v.id} onClick={() => onSeleccionar(v)} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', borderRadius: 12, border: '2px solid #E0E0E0',
              background: '#fff', cursor: 'pointer', fontFamily: 'Poppins', textAlign: 'left'
            }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--crema)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {v.imagen_url ? <img src={v.imagen_url} alt={v.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <RiImageLine style={{ color: '#BDBDBD' }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{v.nombre}</div>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--verde)' }}>${Number(v.precio_final_cop).toLocaleString('es-CO')}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   🖨️ IMPRESIÓN — PLACEHOLDER
   Todavía no hay impresora ni API definida. Esta función es el ÚNICO
   punto donde se debe conectar la impresión real más adelante
   (ej: llamar a un endpoint del backend que hable con la impresora
   térmica, usar una librería tipo qz-tray, node-thermal-printer, o
   una API de impresión en red). Por ahora solo simula la acción
   para no romper el flujo ni bloquear al cajero.
   ════════════════════════════════════════════════════════════════ */
const imprimirOrdenPreparacion = (venta) => {
  // TODO: reemplazar este bloque cuando se defina la impresora/API.
  // Ejemplo futuro:
  //   await API.post('/impresion/orden', { venta_id: venta.id });
  console.log('[Impresión pendiente de configurar] Orden de venta:', venta?.id, venta);
  toast.info('🖨️ Impresión aún no configurada — la orden no se envió a ninguna impresora todavía', { autoClose: 3500 });
};

/* ─── Modal ticket ─── */
const ModalTicket = ({ show, venta, onClose, onImprimir }) => {
  if (!show || !venta) return null;
  const simbolo = venta.moneda_pago === 'USD' ? '$' : venta.moneda_pago === 'BS' ? 'Bs.' : 'COP$';
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1070,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 400,
        padding: '32px 28px', textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)'
      }}>
        <div style={{ fontSize: 52, marginBottom: 8 }}>✅</div>
        <h4 style={{ fontWeight: 800, color: 'var(--verde)', marginBottom: 4 }}>¡Pedido registrado!</h4>
        <p style={{ color: 'var(--texto-suave)', fontSize: '0.85rem', marginBottom: 24 }}>Pedido #{venta.id}</p>

        <div style={{ background: 'var(--crema)', borderRadius: 14, padding: '16px 20px', marginBottom: 20, textAlign: 'left' }}>
          {venta.items?.map((item, i) => {
            const totalToppingsUnit = (item.toppings || []).reduce((a, t) => a + (parseFloat(t.precio_cop) || 0), 0);
            const precioProductoUnit = parseFloat(item.precio_unitario_cop) - totalToppingsUnit;
            const subtotalProducto = precioProductoUnit * item.cantidad;
            return (
              <div key={i} style={{ marginBottom: 8, fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{item.producto_nombre}</span>
                    <span style={{ color: 'var(--texto-suave)' }}> x{item.cantidad}</span>
                  </div>
                  <span style={{ fontWeight: 700 }}>${Number(subtotalProducto).toLocaleString('es-CO')}</span>
                </div>
                {item.toppings?.length > 0 && item.toppings.map((t, ti) => (
                  <div key={ti} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--texto-suave)', marginTop: 2 }}>
                    <span>+ {t.topping_nombre} x{item.cantidad}</span>
                    <span>
                      {parseFloat(t.precio_cop) > 0
                        ? `$${Number(parseFloat(t.precio_cop) * item.cantidad).toLocaleString('es-CO')}`
                        : 'Gratis'}
                    </span>
                  </div>
                ))}
                {item.toppings?.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', fontWeight: 700, marginTop: 3 }}>
                    <span>Subtotal</span>
                    <span>${Number(item.subtotal_cop).toLocaleString('es-CO')}</span>
                  </div>
                )}
              </div>
            );
          })}
          <div style={{ borderTop: '1px dashed #E0E0E0', marginTop: 10, paddingTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
              <span>Total {venta.moneda_pago}</span>
              <span style={{ color: 'var(--verde)' }}>{simbolo} {Number(venta.total_pagado).toLocaleString()}</span>
            </div>
            {venta.moneda_pago !== 'USD' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginTop: 4, fontSize: '0.78rem', color: 'var(--texto-suave)' }}>
                <span>Total USD (ref.)</span>
                <span>${parseFloat(venta.total_usd).toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 24, fontSize: '0.82rem' }}>
          <div style={{ flex: 1, padding: 10, background: '#E8F5E9', borderRadius: 10 }}>
            <div style={{ color: 'var(--texto-suave)' }}>Pago</div>
            <div style={{ fontWeight: 700, color: 'var(--verde)', textTransform: 'capitalize' }}>{venta.tipo_pago}</div>
          </div>
          <div style={{ flex: 1, padding: 10, background: '#FFF3E0', borderRadius: 10 }}>
            <div style={{ color: 'var(--texto-suave)' }}>Moneda</div>
            <div style={{ fontWeight: 700, color: 'var(--naranja)' }}>{venta.moneda_pago}</div>
          </div>
          {venta.nombre_banco && (
            <div style={{ flex: 1, padding: 10, background: '#E3F2FD', borderRadius: 10 }}>
              <div style={{ color: 'var(--texto-suave)' }}>Banco</div>
              <div style={{ fontWeight: 700, color: '#1565C0', fontSize: '0.75rem' }}>{venta.nombre_banco}</div>
            </div>
          )}
        </div>

        {venta.tipo_pago === 'efectivo' && venta.monto_recibido !== null && venta.monto_recibido !== undefined && (
          <div style={{ background: '#E8F5E9', borderRadius: 14, padding: '14px 18px', marginBottom: 20, textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6 }}>
              <span style={{ color: 'var(--texto-suave)' }}>Pagó con</span>
              <span style={{ fontWeight: 700 }}>{simbolo} {Number(venta.monto_recibido).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
              <span style={{ fontWeight: 700, color: '#1B5E20' }}>Vuelto a entregar</span>
              <span style={{ fontWeight: 800, color: '#1B5E20' }}>{simbolo} {Number(venta.vuelto).toLocaleString()}</span>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => onImprimir(venta)} style={{
            flex: 1, padding: 13, borderRadius: 14, border: '2px solid var(--naranja)',
            background: '#fff', color: 'var(--naranja)', cursor: 'pointer',
            fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.9rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}>
            🖨️ Imprimir orden
          </button>
          <button className="btn-verde" style={{ flex: 1, padding: 13 }} onClick={onClose}>
            Nuevo pedido
          </button>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════
   PÁGINA PRINCIPAL
═══════════════════════════════════ */
export default function Ventas() {
  // ⚠️ Ajusta esta lectura si en tu app el usuario/rol se guarda con otra
  // clave de localStorage o viene de un contexto/AuthProvider distinto.
  const usuarioActual = (() => {
    try { return JSON.parse(localStorage.getItem('usuario')); } catch { return null; }
  })();
  const esAdmin = usuarioActual?.rol === 'admin';

  const [vista, setVista] = useState('pos'); // pos | historial

  /* POS */
  const [productos, setProductos] = useState([]);
  const [modalVariantes, setModalVariantes] = useState(null); // { padre, variantes }
  const [cargandoVariantes, setCargandoVariantes] = useState(false);
  const [carpetas, setCarpetas] = useState([]);
  const [carpetaActiva, setCarpetaActiva] = useState(null); // { id, nombre, productos, subcarpetas } — pantalla completa, no modal
  const [pilaCarpetas, setPilaCarpetas] = useState([]); // breadcrumb: [{ id, nombre }, ...] para navegar subcarpetas
  const [cargandoCarpeta, setCargandoCarpeta] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [tasas, setTasas] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [catActiva, setCatActiva] = useState('');
  const [carrito, setCarrito] = useState([]);
  const [toppingsExpandidoIdx, setToppingsExpandidoIdx] = useState(null); // idx del item del carrito con el split de toppings abierto
  const [toppingsDisponibles, setToppingsDisponibles] = useState([]); // TODOS los toppings activos del sistema — disponibles para cualquier producto
  const [moneda, setMoneda] = useState('COP');
  const [tasa, setTasa] = useState(''); // tasa BS/USD, solo aplica si moneda === 'BS'
  const [tasaCop, setTasaCop] = useState(null); // tasa COP/USD vigente (objeto tasas_cambio)
  const [tipoPago, setTipoPago] = useState('efectivo');
  const [montoRecibido, setMontoRecibido] = useState('');
  const [cuentaId, setCuentaId] = useState('');
  const [notas, setNotas] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [modalTicket, setModalTicket] = useState(false);
  const [ventaRealizada, setVentaRealizada] = useState(null);
  const [cargandoPOS, setCargandoPOS] = useState(true);

  /* Switch de impresión de orden de preparación (placeholder — sin impresora aún) */
  const [imprimirActivo, setImprimirActivo] = useState(() => {
    const guardado = localStorage.getItem('mm_imprimir_orden');
    return guardado === null ? true : guardado === 'true';
  });
  useEffect(() => {
    localStorage.setItem('mm_imprimir_orden', String(imprimirActivo));
  }, [imprimirActivo]);

  /* Historial */
  const [ventas, setVentas] = useState([]);
  const [cargandoHist, setCargandoHist] = useState(false);
  const [filtros, setFiltros] = useState({ fecha_inicio: '', fecha_fin: '', moneda: '', tipo_pago: '' });
  const [ventaDetalle, setVentaDetalle] = useState(null);
  const [modalDetalle, setModalDetalle] = useState(false);

  /* Anulación en dos pasos */
  const [ventaAAnular, setVentaAAnular] = useState(null); // id de la venta
  const [pasoAnular, setPasoAnular] = useState(1); // 1: motivo+confirmación, 2: contraseña
  const [motivoAnular, setMotivoAnular] = useState('');
  const [contrasenaAnular, setContrasenaAnular] = useState('');
  const [anulando, setAnulando] = useState(false);

  /* ── Cargar datos POS ── */
  const cargarPOS = async () => {
    setCargandoPOS(true);
    try {
      const [r1, r2, r3, r4, r5] = await Promise.all([
        API.get('/productos/activos'),
        API.get('/categorias'),
        API.get('/tasas-cambio'),
        API.get('/carpetas/activas'),
        API.get('/toppings')
      ]);
      setProductos(r1.data.productos);
      setCategorias(r2.data.categorias);
      setTasas(r3.data.tasas);
      const ultimaBS = r3.data.tasas.find(t => t.moneda === 'BS');
      if (ultimaBS) setTasa(ultimaBS.tasa_por_usd);
      const ultimaCOP = r3.data.tasas.find(t => t.moneda === 'COP');
      setTasaCop(ultimaCOP || null);
      setCarpetas(r4.data.carpetas || []);
      // Lista COMPLETA de toppings activos del sistema — cualquier producto puede
      // llevar cualquiera de estos toppings, esté o no asociado en producto_toppings.
      setToppingsDisponibles((r5.data.toppings || []).filter(t => t.activo !== false));
    } catch { toast.error('Error cargando productos'); }
    finally { setCargandoPOS(false); }
  };

  /* ── Cargar cuentas al cambiar moneda/tipo ── */
  useEffect(() => {
    if (tipoPago === 'transferencia') {
      API.get(`/cuentas-bancarias/moneda/${moneda}`)
        .then(r => { setCuentas(r.data.cuentas); setCuentaId(''); })
        .catch(() => setCuentas([]));
    }
  }, [tipoPago, moneda]);

  /* ── Cargar historial ── */
  const cargarHistorial = async () => {
    setCargandoHist(true);
    try {
      const params = new URLSearchParams();
      if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
      if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
      if (filtros.moneda) params.append('moneda', filtros.moneda);
      if (filtros.tipo_pago) params.append('tipo_pago', filtros.tipo_pago);
      const { data } = await API.get(`/ventas?${params}`);
      setVentas(data.ventas);
    } catch { toast.error('Error cargando historial'); }
    finally { setCargandoHist(false); }
  };

  useEffect(() => { cargarPOS(); }, []);
  useEffect(() => { if (vista === 'historial') cargarHistorial(); }, [vista]);

  /* ── POS: agregar producto ── */
  // Carga el contenido (subcarpetas + productos) de una carpeta por id, sin tocar la pila de breadcrumbs
  const cargarContenidoCarpeta = async (id) => {
    setCargandoCarpeta(true);
    try {
      const { data } = await API.get(`/carpetas/${id}`);
      setCarpetaActiva({
        ...data.carpeta,
        productos: data.productos || [],
        subcarpetas: data.subcarpetas || []
      });
    } catch { toast.error('Error cargando la carpeta'); }
    finally { setCargandoCarpeta(false); }
  };

  // Abre una carpeta (o subcarpeta) y la agrega al final del breadcrumb
  const abrirCarpeta = async (carpeta) => {
    setPilaCarpetas(prev => [...prev, { id: carpeta.id, nombre: carpeta.nombre }]);
    await cargarContenidoCarpeta(carpeta.id);
  };

  // Vuelve a la raíz (grid de carpetas de primer nivel)
  const cerrarCarpeta = () => {
    setCarpetaActiva(null);
    setPilaCarpetas([]);
  };

  // Navega directo a un nivel del breadcrumb (0 = primera carpeta abierta)
  const irANivelBreadcrumb = async (indice) => {
    const nuevaPila = pilaCarpetas.slice(0, indice + 1);
    setPilaCarpetas(nuevaPila);
    await cargarContenidoCarpeta(nuevaPila[nuevaPila.length - 1].id);
  };

  // Ya no se abre ningún modal al seleccionar un producto: siempre se agrega
  // directo al carrito sin toppings. Los toppings se eligen después, desde
  // el propio "Pedido del cliente" (carrito), con el split desplegable inline.
  const seleccionarProducto = (prod) => {
    agregarItem(prod, []);
  };

  const clickProducto = async (prod) => {
    if (prod.tiene_variantes) {
      setCargandoVariantes(true);
      try {
        const { data } = await API.get(`/productos/${prod.id}/variantes`);
        setModalVariantes({ padre: prod, variantes: data.variantes || [] });
      } catch { toast.error('Error cargando las opciones de este producto'); }
      finally { setCargandoVariantes(false); }
    } else {
      seleccionarProducto(prod);
    }
  };

  const agregarItem = (prod, tops) => {
    setCarrito(c => {
      const key = `${prod.id}-${tops.map(t => t.id).join(',')}`;
      const idx = c.findIndex(i => i._key === key);
      if (idx >= 0) {
        const n = [...c]; n[idx].cantidad += 1; return n;
      }
      return [...c, { ...prod, cantidad: 1, toppingsSeleccionados: tops, _key: key }];
    });
    toast.success(`${prod.nombre} añadido`, { autoClose: 800 });
  };

  // Despliega/colapsa el split de toppings de un item YA en el carrito (sin modal).
  // Ya no depende de si el producto tiene toppings propios asignados: se usa
  // siempre la lista completa de toppings activos del sistema.
  const toggleToppingsCarrito = (idx) => {
    setToppingsExpandidoIdx(prev => (prev === idx ? null : idx));
  };

  // Marca/desmarca un topping directamente sobre el item del carrito — suma o resta del precio al instante
  const toggleToppingEnItem = (idx, topping) => {
    setCarrito(c => {
      const n = [...c];
      const actuales = n[idx].toppingsSeleccionados || [];
      const yaEsta = actuales.some(t => t.id === topping.id);
      const nuevos = yaEsta ? actuales.filter(t => t.id !== topping.id) : [...actuales, topping];
      const key = `${n[idx].id}-${nuevos.map(t => t.id).join(',')}`;
      n[idx] = { ...n[idx], toppingsSeleccionados: nuevos, _key: key };
      return n;
    });
  };

  const cambiarCantidad = (idx, delta) => {
    setCarrito(c => {
      const n = [...c];
      n[idx].cantidad += delta;
      if (n[idx].cantidad <= 0) n.splice(idx, 1);
      return n;
    });
  };

  const quitarItem = (idx) => setCarrito(c => c.filter((_, i) => i !== idx));

  /* ── Totales (COP es la moneda nativa de los productos) ── */
  const totalCOP = carrito.reduce((acc, item) => {
    const base = parseFloat(item.precio_final_cop) * item.cantidad;
    const tops = (item.toppingsSeleccionados || []).reduce((a, t) => a + (parseFloat(t.precio_cop) || 0), 0) * item.cantidad;
    return acc + base + tops;
  }, 0);

  const totalUSD = tasaCop?.tasa_por_usd ? totalCOP / parseFloat(tasaCop.tasa_por_usd) : 0;

  const totalConvertido = () => {
    if (moneda === 'COP') return totalCOP.toFixed(2);
    if (moneda === 'USD') return totalUSD.toFixed(2);
    // BS: se cruza vía USD con la tasa BS/USD ingresada
    return (totalUSD * parseFloat(tasa || 1)).toFixed(2);
  };

  const simbolo = moneda === 'USD' ? '$' : moneda === 'BS' ? 'Bs.' : 'COP$';

  // Vuelto en tiempo real (solo aplica a pago en efectivo)
  const vueltoCalculado = () => {
    const recibido = parseFloat(montoRecibido);
    if (isNaN(recibido)) return null;
    return parseFloat((recibido - parseFloat(totalConvertido())).toFixed(2));
  };

  /* ── Confirmar venta ── */
  const confirmarVenta = async () => {
    if (carrito.length === 0) { toast.error('El carrito está vacío'); return; }
    if (!tasaCop) { toast.error('No hay tasa COP cargada. Regístrala en Tasas de cambio'); return; }
    if (moneda === 'BS' && !tasa) { toast.error('Ingresa la tasa de cambio (BS/USD)'); return; }
    if (tipoPago === 'transferencia' && !cuentaId) { toast.error('Selecciona una cuenta bancaria'); return; }
    if (tipoPago === 'efectivo') {
      if (montoRecibido === '' || isNaN(parseFloat(montoRecibido))) {
        toast.error('Ingresa el monto recibido en efectivo'); return;
      }
      if (parseFloat(montoRecibido) < parseFloat(totalConvertido()) - 0.01) {
        toast.error('El monto recibido es menor al total a cobrar'); return;
      }
    }

    setProcesando(true);
    try {
      const { data } = await API.post('/ventas', {
        moneda_pago: moneda,
        tipo_pago: tipoPago,
        cuenta_bancaria_id: cuentaId || null,
        tasa_cambio_usada: moneda === 'BS' ? tasa : null,
        monto_recibido: tipoPago === 'efectivo' ? montoRecibido : null,
        notas,
        items: carrito.map(i => ({
          producto_id: i.id,
          cantidad: i.cantidad,
          toppings_ids: (i.toppingsSeleccionados || []).map(t => t.id)
        }))
      });
      setVentaRealizada(data.venta);
      setCarrito([]);
      setNotas('');
      setTipoPago('efectivo');
      setCuentaId('');
      setMontoRecibido('');
      setModalTicket(true);
      if (imprimirActivo) imprimirOrdenPreparacion(data.venta);
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error procesando pedido');
    } finally { setProcesando(false); }
  };

  /* ── Ver detalle venta ── */
  const verDetalle = async (id) => {
    try {
      const { data } = await API.get(`/ventas/${id}`);
      setVentaDetalle(data.venta);
      setModalDetalle(true);
    } catch { toast.error('Error cargando detalle'); }
  };

  const abrirAnular = (id) => {
    setVentaAAnular(id);
    setPasoAnular(1);
    setMotivoAnular('');
    setContrasenaAnular('');
  };

  const cerrarModalAnular = () => {
    setVentaAAnular(null);
    setPasoAnular(1);
    setMotivoAnular('');
    setContrasenaAnular('');
  };

  const irAPasoContrasena = () => {
    if (!motivoAnular.trim()) { toast.error('Debes indicar el motivo de la anulación'); return; }
    setPasoAnular(2);
  };

  const confirmarAnulacionFinal = async () => {
    if (!contrasenaAnular) { toast.error('Ingresa tu contraseña para confirmar'); return; }
    setAnulando(true);
    try {
      await API.patch(`/ventas/${ventaAAnular}/anular`, { motivo: motivoAnular, contrasena: contrasenaAnular });
      toast.success('Pedido anulado exitosamente');
      cerrarModalAnular();
      cargarHistorial();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error anulando el pedido');
    } finally { setAnulando(false); }
  };

  const filtradosPOS = productos.filter(p => {
    const mb = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const mc = !catActiva || p.categoria_id === parseInt(catActiva);
    return mb && mc;
  });

  const carpetasFiltradasPOS = catActiva ? [] : carpetas.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Combina carpetas + productos de un mismo nivel y los ordena por "orden"
  // (menor primero), sin importar si es carpeta o producto — así una carpeta
  // con orden 1 sale antes que un producto con orden 2, tal cual estén mezclados.
  const combinarYOrdenar = (listaCarpetas, listaProductos) => {
    const items = [
      ...listaCarpetas.map(c => ({ tipo: 'carpeta', data: c, orden: Number(c.orden) || 0, nombre: c.nombre })),
      ...listaProductos.map(p => ({ tipo: 'producto', data: p, orden: Number(p.orden) || 0, nombre: p.nombre }))
    ];
    items.sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre));
    return items;
  };

  /* ════ RENDER ════ */
  return (
    <div>
      {/* Header + tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 2 }}>Pedidos 🧾</h1>
          <p style={{ color: 'var(--texto-suave)', fontSize: '0.85rem' }}>
            {vista === 'pos' ? 'Punto de venta — arma el pedido del cliente' : 'Historial de transacciones'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { v: 'pos', icon: <RiShoppingCartLine />, label: 'Punto de venta' },
            { v: 'historial', icon: <RiHistoryLine />, label: 'Historial' }
          ].map(tab => (
            <button key={tab.v} onClick={() => setVista(tab.v)} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 18px', borderRadius: 12, border: 'none',
              background: vista === tab.v ? 'var(--verde)' : '#fff',
              color: vista === tab.v ? '#fff' : 'var(--texto-suave)',
              fontFamily: 'Poppins', fontWeight: 600, fontSize: '0.85rem',
              cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'all 0.2s'
            }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════ VISTA POS ══════════ */}
      {vista === 'pos' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }} className="pos-grid">

          {/* ── Panel izquierdo: productos ── */}
          <div>
            {/* Búsqueda */}
            <div style={{ marginBottom: 16, position: 'relative' }}>
              <RiSearchLine style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--texto-suave)' }} />
              <input className="input-mm" placeholder="Buscar producto..." value={busqueda}
                onChange={e => setBusqueda(e.target.value)} style={{ paddingLeft: 40 }} />
            </div>

            {/* Grid productos */}
            {cargandoPOS ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <div className="spinner-border" style={{ color: 'var(--verde)' }} />
              </div>
            ) : carpetaActiva ? (
              <>
                {/* Breadcrumb: Inicio > Carpeta > Subcarpeta > ... */}
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  <button onClick={cerrarCarpeta} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: '#fff', border: '2px solid #E0E0E0', borderRadius: 10,
                    padding: '7px 12px', fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.8rem',
                    color: 'var(--texto-suave)', cursor: 'pointer'
                  }}>
                    ← Inicio
                  </button>
                  {pilaCarpetas.map((c, idx) => (
                    <span key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'var(--texto-suave)' }}>/</span>
                      <button
                        onClick={() => irANivelBreadcrumb(idx)}
                        disabled={idx === pilaCarpetas.length - 1}
                        style={{
                          background: idx === pilaCarpetas.length - 1 ? 'var(--verde)' : '#fff',
                          color: idx === pilaCarpetas.length - 1 ? '#fff' : 'var(--texto-suave)',
                          border: '2px solid #E0E0E0', borderRadius: 10,
                          padding: '7px 12px', fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.8rem',
                          cursor: idx === pilaCarpetas.length - 1 ? 'default' : 'pointer'
                        }}>
                        📁 {c.nombre}
                      </button>
                    </span>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
                  {combinarYOrdenar(
                    (carpetaActiva.subcarpetas || []).filter(c => c.nombre.toLowerCase().includes(busqueda.toLowerCase())),
                    carpetaActiva.productos.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
                  ).map(item => (
                    item.tipo === 'carpeta'
                      ? <CarpetaCard key={`subcarpeta-${item.data.id}`} carpeta={item.data} onClick={abrirCarpeta} />
                      : <ProductoCard key={`producto-${item.data.id}`} prod={item.data} onClick={clickProducto} />
                  ))}
                  {carpetaActiva.productos.length === 0 && (carpetaActiva.subcarpetas || []).length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 48, color: 'var(--texto-suave)', fontSize: '0.85rem' }}>
                      Esta carpeta no tiene productos ni subcarpetas disponibles todavía.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
                {combinarYOrdenar(carpetasFiltradasPOS, filtradosPOS).map(item => (
                  item.tipo === 'carpeta'
                    ? <CarpetaCard key={`carpeta-${item.data.id}`} carpeta={item.data} onClick={abrirCarpeta} />
                    : <ProductoCard key={`producto-${item.data.id}`} prod={item.data} onClick={clickProducto} />
                ))}
                {filtradosPOS.length === 0 && carpetasFiltradasPOS.length === 0 && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 48, color: 'var(--texto-suave)', fontSize: '0.85rem' }}>
                    Sin productos
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Panel derecho: carrito + pago ── */}
          <div style={{
            background: '#fff', borderRadius: 20,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            position: 'sticky', top: 80,
            maxHeight: 'calc(100vh - 100px)', overflowY: 'auto'
          }}>
            {/* Header carrito */}
            <div style={{
              padding: '18px 20px', borderBottom: '1px solid #F0F0F0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <RiShoppingCartLine style={{ color: 'var(--verde)' }} />
                Pedido del cliente
              </div>
              {carrito.length > 0 && (
                <button onClick={() => setCarrito([])} style={{
                  background: '#FFEBEE', border: 'none', borderRadius: 8,
                  padding: '4px 10px', color: '#C62828', fontSize: '0.75rem',
                  fontFamily: 'Poppins', fontWeight: 600, cursor: 'pointer'
                }}>Limpiar</button>
              )}
            </div>

            {/* Items carrito */}
            <div style={{ padding: '12px 20px', minHeight: 120 }}>
              {carrito.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--texto-suave)', fontSize: '0.85rem' }}>
                  <RiShoppingCartLine style={{ fontSize: 32, marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                  Selecciona productos del menú
                </div>
              ) : carrito.map((item, idx) => {
                const extras = (item.toppingsSeleccionados || []).reduce((a, t) => a + (parseFloat(t.precio_cop) || 0), 0);
                const subtotal = (parseFloat(item.precio_final_cop) + extras) * item.cantidad;
                return (
                  <div key={idx} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #F5F5F5' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.nombre}</div>
                        {item.toppingsSeleccionados?.length > 0 && (
                          <div style={{ marginTop: 2 }}>
                            {item.toppingsSeleccionados.map((t, ti) => (
                              <div key={ti} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--texto-suave)' }}>
                                <span>+ {t.nombre}</span>
                                <span>{parseFloat(t.precio_cop) > 0 ? `$${Number(t.precio_cop).toLocaleString('es-CO')}` : 'Gratis'}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <button onClick={() => quitarItem(idx)} style={{ background: 'none', border: 'none', color: '#BDBDBD', cursor: 'pointer', fontSize: '1rem', padding: 0 }}>
                        <RiDeleteBinLine />
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={() => cambiarCantidad(idx, -1)} style={{
                          width: 28, height: 28, borderRadius: '50%', border: '2px solid #E0E0E0',
                          background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem'
                        }}><RiSubtractLine /></button>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', minWidth: 20, textAlign: 'center' }}>{item.cantidad}</span>
                        <button onClick={() => cambiarCantidad(idx, 1)} style={{
                          width: 28, height: 28, borderRadius: '50%', border: 'none',
                          background: 'var(--verde)', color: '#fff', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem'
                        }}><RiAddLine /></button>
                        <button onClick={() => toggleToppingsCarrito(idx)} style={{
                          marginLeft: 4, background: '#FFF3E0', border: 'none', borderRadius: 8,
                          padding: '5px 10px', color: 'var(--naranja)', fontFamily: 'Poppins',
                          fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer', whiteSpace: 'nowrap',
                          display: 'flex', alignItems: 'center', gap: 4
                        }}>
                          {toppingsExpandidoIdx === idx ? 'Ocultar toppings ▲' : '+ Añadir toppings ▼'}
                        </button>
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--verde)', fontSize: '0.9rem' }}>${Number(subtotal).toLocaleString('es-CO')}</span>
                    </div>

                    {/* Split desplegable de toppings — directo aquí en el carrito, sin modal */}
                    {toppingsExpandidoIdx === idx && (
                      <div style={{ marginTop: 8, border: '1px solid #F0F0F0', borderRadius: 10, overflow: 'hidden' }}>
                        {toppingsDisponibles.length === 0 ? (
                          <div style={{ padding: 10, fontSize: '0.75rem', color: 'var(--texto-suave)', textAlign: 'center' }}>
                            No hay toppings registrados en el sistema.
                          </div>
                        ) : toppingsDisponibles.map((t, ti) => {
                          const marcado = (item.toppingsSeleccionados || []).some(x => x.id === t.id);
                          return (
                            <div
                              key={t.id}
                              role="button"
                              onClick={() => toggleToppingEnItem(idx, t)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                                borderTop: ti === 0 ? 'none' : '1px solid #F5F5F5',
                                background: marcado ? '#FFF3E0' : '#fff', cursor: 'pointer'
                              }}
                            >
                              <span style={{
                                width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                                border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                borderColor: marcado ? 'var(--naranja)' : '#CCC',
                                background: marcado ? 'var(--naranja)' : '#fff',
                                color: '#fff', fontSize: '0.6rem'
                              }}>
                                {marcado && '✓'}
                              </span>
                              <span style={{ flex: 1, fontSize: '0.76rem', fontWeight: 600, color: marcado ? 'var(--naranja)' : 'var(--texto-suave)' }}>
                                {t.nombre}
                              </span>
                              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: marcado ? 'var(--naranja)' : '#9E9E9E' }}>
                                {parseFloat(t.precio_cop) > 0 ? `+$${Number(t.precio_cop).toLocaleString('es-CO')}` : 'Gratis'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Configuración de pago */}
            {carrito.length > 0 && (
              <div style={{ padding: '0 20px 20px' }}>

                {/* Moneda */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--texto-suave)', marginBottom: 8 }}>MONEDA DE PAGO</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                    {['USD', 'BS', 'COP'].map(m => (
                      <button key={m} onClick={() => setMoneda(m)} style={{
                        padding: '8px 0', borderRadius: 10, border: '2px solid',
                        borderColor: moneda === m ? 'var(--verde)' : '#E0E0E0',
                        background: moneda === m ? '#E8F5E9' : '#fff',
                        color: moneda === m ? 'var(--verde)' : 'var(--texto-suave)',
                        fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer'
                      }}>
                        {m === 'USD' ? '💵' : m === 'BS' ? '🇻🇪' : '🇨🇴'} {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tasa */}
                {moneda === 'BS' && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--texto-suave)', marginBottom: 6 }}>TASA (BS/USD)</div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                      {tasas.filter(t => t.moneda === 'BS').slice(0, 2).map((t, i) => (
                        <button key={i} onClick={() => setTasa(t.tasa_por_usd)} style={{
                          padding: '4px 10px', borderRadius: 20, border: '2px solid',
                          borderColor: parseFloat(tasa) === parseFloat(t.tasa_por_usd) ? 'var(--verde)' : '#E0E0E0',
                          background: parseFloat(tasa) === parseFloat(t.tasa_por_usd) ? '#E8F5E9' : '#fff',
                          color: parseFloat(tasa) === parseFloat(t.tasa_por_usd) ? 'var(--verde)' : 'var(--texto-suave)',
                          fontFamily: 'Poppins', fontWeight: 600, fontSize: '0.74rem', cursor: 'pointer'
                        }}>
                          {parseFloat(t.tasa_por_usd).toLocaleString()} {i === 0 ? '⭐' : ''}
                        </button>
                      ))}
                    </div>
                    <input className="input-mm" type="number" step="0.01"
                      placeholder={`Tasa manual...`} value={tasa}
                      onChange={e => setTasa(e.target.value)}
                      style={{ fontSize: '0.85rem', padding: '10px 14px' }} />
                  </div>
                )}

                {(moneda === 'COP' || moneda === 'USD') && (
                  <div style={{ marginBottom: 14, padding: '8px 12px', background: '#F0F7FF', borderRadius: 10, fontSize: '0.74rem', color: '#1565C0' }}>
                    {tasaCop
                      ? `Tasa COP/USD vigente: ${Number(tasaCop.tasa_por_usd).toLocaleString('es-CO')}`
                      : '⚠️ No hay tasa COP cargada'}
                  </div>
                )}

                {/* Tipo pago */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--texto-suave)', marginBottom: 8 }}>TIPO DE PAGO</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {[{ v: 'efectivo', label: '💵 Efectivo' }, { v: 'transferencia', label: '🏦 Transfer.' }].map(t => (
                      <button key={t.v} onClick={() => { setTipoPago(t.v); setMontoRecibido(''); }} style={{
                        padding: '9px 0', borderRadius: 10, border: '2px solid',
                        borderColor: tipoPago === t.v ? 'var(--verde)' : '#E0E0E0',
                        background: tipoPago === t.v ? '#E8F5E9' : '#fff',
                        color: tipoPago === t.v ? 'var(--verde)' : 'var(--texto-suave)',
                        fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer'
                      }}>{t.label}</button>
                    ))}
                  </div>
                </div>

                {/* Cobro en efectivo: monto recibido + vuelto */}
                {tipoPago === 'efectivo' && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--texto-suave)', marginBottom: 8 }}>
                      ¿CON CUÁNTO PAGA? ({simbolo})
                    </div>
                    <input className="input-mm" type="number" step="0.01" min="0"
                      placeholder={`Ej: ${totalConvertido()}`}
                      value={montoRecibido}
                      onChange={e => setMontoRecibido(e.target.value)}
                      style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 8 }} />

                    {montoRecibido !== '' && !isNaN(parseFloat(montoRecibido)) && (
                      vueltoCalculado() >= 0 ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#E8F5E9', borderRadius: 10, padding: '10px 14px' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1B5E20' }}>Vuelto a entregar</span>
                          <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1B5E20' }}>{simbolo} {vueltoCalculado().toLocaleString()}</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFEBEE', borderRadius: 10, padding: '10px 14px' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#C62828' }}>Falta por cobrar</span>
                          <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#C62828' }}>{simbolo} {Math.abs(vueltoCalculado()).toLocaleString()}</span>
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* Cuenta bancaria */}
                {tipoPago === 'transferencia' && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--texto-suave)', marginBottom: 8 }}>
                      CUENTA DESTINO ({moneda})
                    </div>
                    {cuentas.length === 0 ? (
                      <div style={{ padding: '10px 14px', background: '#FFF3E0', borderRadius: 10, fontSize: '0.78rem', color: '#E65100' }}>
                        No hay cuentas activas para {moneda}
                      </div>
                    ) : cuentas.map(c => (
                      <button key={c.id} onClick={() => setCuentaId(c.id)} style={{
                        width: '100%', padding: '10px 14px', borderRadius: 10,
                        border: '2px solid', marginBottom: 6,
                        borderColor: cuentaId === c.id ? 'var(--verde)' : '#E0E0E0',
                        background: cuentaId === c.id ? '#E8F5E9' : '#fff',
                        textAlign: 'left', cursor: 'pointer', fontFamily: 'Poppins'
                      }}>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: cuentaId === c.id ? 'var(--verde)' : 'var(--texto)' }}>{c.nombre_banco}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--texto-suave)' }}>
                          {c.titular_cuenta}{c.numero_cuenta ? ` · ${c.numero_cuenta}` : ''}{c.telefono ? ` · ${c.telefono}` : ''}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Notas */}
                <div style={{ marginBottom: 16 }}>
                  <textarea className="input-mm" rows={2} placeholder="Notas del pedido..." value={notas}
                    onChange={e => setNotas(e.target.value)} style={{ resize: 'none', fontSize: '0.85rem', padding: '10px 14px' }} />
                </div>

                {/* Total */}
                <div style={{ background: 'var(--verde)', borderRadius: 14, padding: '14px 18px', marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.74rem' }}>Total a cobrar</div>
                      <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.4rem' }}>
                        {simbolo} {Number(totalConvertido()).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem' }}>
                        {moneda === 'COP' ? 'USD' : 'COP'}
                      </div>
                      <div style={{ color: 'var(--naranja-claro)', fontWeight: 700 }}>
                        {moneda === 'COP'
                          ? `$${totalUSD.toFixed(2)}`
                          : `$${Number(totalCOP).toLocaleString('es-CO')}`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Switch imprimir orden de preparación */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--crema)', borderRadius: 12, marginBottom: 14 }}>
                  <span style={{ fontSize: '1.1rem' }}>🖨️</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>Imprimir orden de preparación</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--texto-suave)' }}>Aún sin impresora conectada</div>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24 }}>
                    <input type="checkbox" checked={imprimirActivo} onChange={e => setImprimirActivo(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{
                      position: 'absolute', cursor: 'pointer', inset: 0,
                      background: imprimirActivo ? 'var(--naranja)' : '#ccc',
                      borderRadius: 24, transition: '0.3s'
                    }}>
                      <span style={{
                        position: 'absolute', height: 18, width: 18,
                        left: imprimirActivo ? 22 : 3, bottom: 3,
                        background: '#fff', borderRadius: '50%', transition: '0.3s'
                      }} />
                    </span>
                  </label>
                </div>

                <button
                  onClick={confirmarVenta}
                  disabled={procesando}
                  style={{
                    width: '100%', padding: '13px',
                    background: procesando ? '#9E9E9E' : 'var(--naranja)',
                    color: '#fff', border: 'none', borderRadius: 14,
                    fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.95rem',
                    cursor: procesando ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}
                >
                  {procesando ? <span className="spinner-border spinner-border-sm" /> : <RiCheckLine />}
                  {procesando ? 'Procesando...' : 'Registrar pedido'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════ VISTA HISTORIAL ══════════ */}
      {vista === 'historial' && (
        <div>
          {/* Filtros */}
          <div className="card-mm" style={{ marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: 6, display: 'block', color: 'var(--texto-suave)' }}>DESDE</label>
                <input className="input-mm" type="date" value={filtros.fecha_inicio}
                  onChange={e => setFiltros({ ...filtros, fecha_inicio: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: 6, display: 'block', color: 'var(--texto-suave)' }}>HASTA</label>
                <input className="input-mm" type="date" value={filtros.fecha_fin}
                  onChange={e => setFiltros({ ...filtros, fecha_fin: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: 6, display: 'block', color: 'var(--texto-suave)' }}>MONEDA</label>
                <select className="input-mm" value={filtros.moneda}
                  onChange={e => setFiltros({ ...filtros, moneda: e.target.value })}>
                  <option value="">Todas</option>
                  <option value="USD">USD</option>
                  <option value="BS">BS</option>
                  <option value="COP">COP</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: 6, display: 'block', color: 'var(--texto-suave)' }}>TIPO PAGO</label>
                <select className="input-mm" value={filtros.tipo_pago}
                  onChange={e => setFiltros({ ...filtros, tipo_pago: e.target.value })}>
                  <option value="">Todos</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </div>
              <button className="btn-verde" onClick={cargarHistorial} style={{ padding: '12px' }}>
                Filtrar
              </button>
            </div>
          </div>

          {/* Tabla historial */}
          {cargandoHist ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div className="spinner-border" style={{ color: 'var(--verde)' }} />
            </div>
          ) : (
            <div className="card-mm" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--crema)', borderBottom: '2px solid #F0F0F0' }}>
                      {['#', 'Fecha', 'Cajero', 'Total COP', 'Total Pagado', 'Moneda', 'Tipo Pago', 'Banco', 'Acciones'].map(h => (
                        <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, fontSize: '0.78rem', color: 'var(--texto-suave)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ventas.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: 48, color: 'var(--texto-suave)' }}>
                          <RiFileList2Line style={{ fontSize: 36, display: 'block', margin: '0 auto 8px' }} />
                          Sin ventas en este período
                        </td>
                      </tr>
                    ) : ventas.map(v => (
                      <tr key={v.id} style={{ borderBottom: '1px solid #F9F9F9', opacity: v.anulada ? 0.55 : 1 }}
                        onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--naranja)' }}>#{v.id}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--texto-suave)', whiteSpace: 'nowrap' }}>
                          {new Date(v.creado_en).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>{v.cajero}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--verde)' }}>${Number(v.total_cop).toLocaleString('es-CO')}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                          {v.moneda_pago === 'USD' ? '$' : v.moneda_pago === 'BS' ? 'Bs.' : 'COP$'} {parseFloat(v.total_pagado).toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            borderRadius: 20, padding: '3px 10px', fontSize: '0.75rem', fontWeight: 700,
                            background: v.moneda_pago === 'USD' ? '#E8F5E9' : v.moneda_pago === 'BS' ? '#E3F2FD' : '#FFF3E0',
                            color: v.moneda_pago === 'USD' ? '#1B5E20' : v.moneda_pago === 'BS' ? '#1565C0' : '#E65100'
                          }}>{v.moneda_pago}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                            <span style={{
                              borderRadius: 20, padding: '3px 10px', fontSize: '0.75rem', fontWeight: 700,
                              background: v.tipo_pago === 'efectivo' ? '#F3E5F5' : '#E8F5E9',
                              color: v.tipo_pago === 'efectivo' ? '#6A1B9A' : '#1B5E20',
                              textTransform: 'capitalize'
                            }}>{v.tipo_pago}</span>
                            {v.anulada && (
                              <span style={{
                                borderRadius: 20, padding: '3px 10px', fontSize: '0.7rem', fontWeight: 700,
                                background: '#FFEBEE', color: '#C62828'
                              }}>Anulada</span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--texto-suave)', fontSize: '0.8rem' }}>
                          {v.nombre_banco || '—'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => verDetalle(v.id)} title="Ver detalle" style={{ background: '#E8F5E9', border: 'none', borderRadius: 8, padding: '6px 9px', color: '#1B5E20', cursor: 'pointer', fontSize: '0.95rem' }}>
                              <RiEyeLine />
                            </button>
                            {esAdmin && !v.anulada && (
                              <button onClick={() => abrirAnular(v.id)} title="Anular" style={{ background: '#FFEBEE', border: 'none', borderRadius: 8, padding: '6px 9px', color: '#C62828', cursor: 'pointer', fontSize: '0.95rem' }}>
                                <RiCloseLine />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal variantes POS */}
      <ModalVariantes
        padre={modalVariantes?.padre}
        variantes={modalVariantes?.variantes || []}
        onSeleccionar={(variante) => { setModalVariantes(null); seleccionarProducto(variante); }}
        onClose={() => setModalVariantes(null)}
      />

      {/* Ya no hay modal de toppings al agregar un producto: se agrega directo
          al carrito y los toppings se eligen desde el split desplegable inline
          dentro del propio "Pedido del cliente". */}

      {/* Ticket */}
      <ModalTicket
        show={modalTicket}
        venta={ventaRealizada}
        onClose={() => setModalTicket(false)}
        onImprimir={imprimirOrdenPreparacion}
      />

      {/* Modal detalle venta */}
      <Modal show={modalDetalle} onClose={() => setModalDetalle(false)} titulo={`Detalle pedido #${ventaDetalle?.id}`} maxWidth={480}>
        {ventaDetalle && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Cajero', valor: ventaDetalle.cajero },
                { label: 'Fecha', valor: new Date(ventaDetalle.creado_en).toLocaleString('es-VE') },
                { label: 'Tipo pago', valor: ventaDetalle.tipo_pago },
                { label: 'Moneda', valor: ventaDetalle.moneda_pago },
                { label: 'Banco', valor: ventaDetalle.nombre_banco || '—' },
                { label: 'Tasa usada', valor: ventaDetalle.tasa_cambio_usada ? parseFloat(ventaDetalle.tasa_cambio_usada).toLocaleString() : '—' },
              ].map(d => (
                <div key={d.label} style={{ background: 'var(--crema)', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--texto-suave)', fontWeight: 600 }}>{d.label.toUpperCase()}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', textTransform: 'capitalize' }}>{d.valor}</div>
                </div>
              ))}
            </div>

            {ventaDetalle.tipo_pago === 'efectivo' && ventaDetalle.monto_recibido !== null && ventaDetalle.monto_recibido !== undefined && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <div style={{ flex: 1, background: '#F3E5F5', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--texto-suave)', fontWeight: 600 }}>PAGÓ CON</div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{Number(ventaDetalle.monto_recibido).toLocaleString()}</div>
                </div>
                <div style={{ flex: 1, background: '#E8F5E9', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#1B5E20', fontWeight: 600 }}>VUELTO</div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1B5E20' }}>{Number(ventaDetalle.vuelto).toLocaleString()}</div>
                </div>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--texto-suave)', marginBottom: 10 }}>PRODUCTOS</div>
              {ventaDetalle.items?.map((item, i) => {
                // El precio_unitario_cop guardado en la venta ya viene con los toppings
                // sumados. Para mostrarlo claro al cliente, separamos: precio base del
                // producto (sin toppings) + cada topping con su propio precio.
                const totalToppingsUnit = (item.toppings || []).reduce((a, t) => a + (parseFloat(t.precio_cop) || 0), 0);
                const precioProductoUnit = parseFloat(item.precio_unitario_cop) - totalToppingsUnit;
                const subtotalProducto = precioProductoUnit * item.cantidad;
                return (
                  <div key={i} style={{ padding: '10px 14px', background: '#F9F9F9', borderRadius: 10, marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.producto_nombre} x{item.cantidad}</span>
                      <span style={{ fontWeight: 700 }}>${Number(subtotalProducto).toLocaleString('es-CO')}</span>
                    </div>
                    {item.toppings?.length > 0 && (
                      <div style={{ marginTop: 2, marginBottom: 4 }}>
                        {item.toppings.map((t, ti) => (
                          <div key={ti} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--texto-suave)' }}>
                            <span>+ {t.topping_nombre} x{item.cantidad}</span>
                            <span>
                              {parseFloat(t.precio_cop) > 0
                                ? `$${Number(parseFloat(t.precio_cop) * item.cantidad).toLocaleString('es-CO')}`
                                : 'Gratis'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: 'var(--verde)', borderTop: '1px dashed #E0E0E0', paddingTop: 4, marginTop: 4 }}>
                      <span>Subtotal</span>
                      <span>${Number(item.subtotal_cop).toLocaleString('es-CO')}</span>
                    </div>
                    {esAdmin && (
                      <div style={{ fontSize: '0.74rem', color: 'var(--texto-suave)', marginTop: 2 }}>
                        Ganancia: <span style={{ color: '#2E7D32', fontWeight: 600 }}>${Number(item.ganancia_cop).toLocaleString('es-CO')}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ background: 'var(--verde)', borderRadius: 14, padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontWeight: 700, marginBottom: 6 }}>
                <span>Total COP</span>
                <span>${Number(ventaDetalle.total_cop).toLocaleString('es-CO')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--naranja-claro)', fontWeight: 700 }}>
                <span>Total {ventaDetalle.moneda_pago}</span>
                <span>{ventaDetalle.moneda_pago === 'USD' ? '$' : ventaDetalle.moneda_pago === 'BS' ? 'Bs.' : 'COP$'} {parseFloat(ventaDetalle.total_pagado).toLocaleString()}</span>
              </div>
            </div>

            {ventaDetalle.notas && (
              <div style={{ marginTop: 14, padding: '10px 14px', background: '#FFF3E0', borderRadius: 10, fontSize: '0.82rem' }}>
                📝 {ventaDetalle.notas}
              </div>
            )}

            {ventaDetalle.anulada && (
              <div style={{ marginTop: 14, padding: '14px 16px', background: '#FFEBEE', borderRadius: 12, fontSize: '0.82rem' }}>
                <div style={{ fontWeight: 800, color: '#C62828', marginBottom: 4 }}>🚫 Pedido anulado</div>
                <div style={{ color: '#C62828' }}>Motivo: {ventaDetalle.motivo_anulacion}</div>
                <div style={{ color: 'var(--texto-suave)', marginTop: 2 }}>
                  Por {ventaDetalle.anulado_por_nombre || '—'} · {ventaDetalle.anulada_en ? new Date(ventaDetalle.anulada_en).toLocaleString('es-VE') : ''}
                </div>
              </div>
            )}

            <button onClick={() => imprimirOrdenPreparacion(ventaDetalle)} style={{
              width: '100%', marginTop: 16, padding: 12, borderRadius: 14,
              border: '2px solid var(--naranja)', background: '#fff', color: 'var(--naranja)',
              cursor: 'pointer', fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.85rem'
            }}>
              🖨️ Reimprimir orden
            </button>
          </div>
        )}
      </Modal>

      {/* Modal anulación — Paso 1: motivo + confirmación */}
      <Modal show={!!ventaAAnular && pasoAnular === 1} onClose={cerrarModalAnular} titulo={`Anular pedido #${ventaAAnular}`} maxWidth={420}>
        <div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: '#FFF3E0', borderRadius: 12, padding: '14px 16px', marginBottom: 18 }}>
            <span style={{ fontSize: '1.3rem' }}>⚠️</span>
            <div style={{ fontSize: '0.85rem', color: '#E65100' }}>
              Esta acción es irreversible. La venta quedará marcada como anulada en el historial.
            </div>
          </div>
          <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>
            ¿Cuál es el motivo de la anulación?
          </label>
          <textarea className="input-mm" rows={3} placeholder="Ej: el cliente canceló el pedido, error en el cobro..."
            value={motivoAnular} onChange={e => setMotivoAnular(e.target.value)}
            style={{ resize: 'none', marginBottom: 20 }} />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button onClick={cerrarModalAnular} style={{ padding: '10px 20px', borderRadius: 12, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontFamily: 'Poppins', fontWeight: 600 }}>
              Cancelar
            </button>
            <button onClick={irAPasoContrasena} style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: '#C62828', color: '#fff', cursor: 'pointer', fontFamily: 'Poppins', fontWeight: 700 }}>
              Sí, continuar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal anulación — Paso 2: confirmar con contraseña */}
      <Modal show={!!ventaAAnular && pasoAnular === 2} onClose={cerrarModalAnular} titulo="Confirma tu identidad" maxWidth={400}>
        <div>
          <p style={{ fontSize: '0.85rem', color: 'var(--texto-suave)', marginBottom: 16 }}>
            Por seguridad, ingresa tu contraseña de administrador para autorizar la anulación del pedido #{ventaAAnular}.
          </p>
          <input className="input-mm" type="password" placeholder="Tu contraseña"
            value={contrasenaAnular} onChange={e => setContrasenaAnular(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && confirmarAnulacionFinal()}
            autoFocus style={{ marginBottom: 20 }} />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button onClick={cerrarModalAnular} disabled={anulando} style={{ padding: '10px 20px', borderRadius: 12, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontFamily: 'Poppins', fontWeight: 600 }}>
              Cancelar
            </button>
            <button onClick={confirmarAnulacionFinal} disabled={anulando} style={{
              padding: '10px 20px', borderRadius: 12, border: 'none',
              background: anulando ? '#9E9E9E' : '#C62828', color: '#fff',
              cursor: anulando ? 'not-allowed' : 'pointer', fontFamily: 'Poppins', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              {anulando ? <span className="spinner-border spinner-border-sm" /> : null}
              {anulando ? 'Anulando...' : 'Confirmar anulación'}
            </button>
          </div>
        </div>
      </Modal>

      <style>{`
        @media (max-width: 900px) {
          .pos-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}