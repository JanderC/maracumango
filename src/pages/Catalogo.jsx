import { useState, useEffect } from 'react';
import API from '../api/axios';
import { toast } from 'react-toastify';
import {
  RiShoppingCartLine, RiCloseLine, RiAddLine,
  RiSearchLine, RiCheckLine, RiImageLine,
  RiBankLine
} from 'react-icons/ri';

const ModalVenta = ({ show, onClose, carrito, moneda, setMoneda, tasa, setTasa, tasasDisponibles, onConfirmar, cargando }) => {
  const [tipoPago, setTipoPago] = useState('efectivo');
  const [cuentaId, setCuentaId] = useState('');
  const [cuentas, setCuentas] = useState([]);
  const [notas, setNotas] = useState('');

  useEffect(() => {
    if (show && tipoPago === 'transferencia' && moneda) {
      API.get(`/cuentas-bancarias/moneda/${moneda}`)
        .then(r => setCuentas(r.data.cuentas))
        .catch(() => setCuentas([]));
    }
  }, [show, tipoPago, moneda]);

  const totalUSD = carrito.reduce((acc, item) => {
    const base = parseFloat(item.precio_final_usd) * item.cantidad;
    const tops = (item.toppingsSeleccionados || []).reduce((a, t) => a + parseFloat(t.precio_usd), 0) * item.cantidad;
    return acc + base + tops;
  }, 0);

  const totalConvertido = () => {
    if (moneda === 'USD') return totalUSD.toFixed(2);
    return (totalUSD * parseFloat(tasa || 1)).toFixed(2);
  };

  const simbolo = moneda === 'USD' ? '$' : moneda === 'BS' ? 'Bs.' : 'COP$';

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1060,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-end',
      justifyContent: 'center', padding: '0'
    }} className="modal-venta-overlay">
      <div style={{
        background: '#fff', borderRadius: '24px 24px 0 0',
        width: '100%', maxWidth: 540,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
        padding: '28px 24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h5 style={{ fontWeight: 700, margin: 0 }}>Confirmar pedido 🧾</h5>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer' }}>
            <RiCloseLine />
          </button>
        </div>

        {/* Resumen items */}
        <div style={{ marginBottom: 20 }}>
          {carrito.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, padding: '10px 14px', background: 'var(--crema)', borderRadius: 12 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.nombre} x{item.cantidad}</div>
                {(item.toppingsSeleccionados || []).length > 0 && (
                  <div style={{ fontSize: '0.74rem', color: 'var(--texto-suave)' }}>
                    + {item.toppingsSeleccionados.map(t => t.nombre).join(', ')}
                  </div>
                )}
              </div>
              <div style={{ fontWeight: 700, color: 'var(--verde)', fontSize: '0.9rem' }}>
                ${(parseFloat(item.precio_final_usd) * item.cantidad + (item.toppingsSeleccionados || []).reduce((a, t) => a + parseFloat(t.precio_usd), 0) * item.cantidad).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {/* Moneda */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 8, display: 'block' }}>Moneda de pago</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {['USD', 'BS', 'COP'].map(m => (
              <button key={m} onClick={() => setMoneda(m)} style={{
                padding: '10px', borderRadius: 12, border: '2px solid',
                borderColor: moneda === m ? 'var(--verde)' : '#E0E0E0',
                background: moneda === m ? '#E8F5E9' : '#fff',
                color: moneda === m ? 'var(--verde)' : 'var(--texto-suave)',
                fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer'
              }}>
                {m === 'USD' ? '💵' : m === 'BS' ? '🇻🇪' : '🇨🇴'} {m}
              </button>
            ))}
          </div>
        </div>

        {/* Tasa */}
        {moneda !== 'USD' && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 8, display: 'block' }}>
              Tasa de cambio ({moneda}/USD)
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              {tasasDisponibles.filter(t => t.moneda === moneda).slice(0, 3).map((t, i) => (
                <button key={i} onClick={() => setTasa(t.tasa_por_usd)} style={{
                  padding: '6px 12px', borderRadius: 20, border: '2px solid',
                  borderColor: parseFloat(tasa) === parseFloat(t.tasa_por_usd) ? 'var(--verde)' : '#E0E0E0',
                  background: parseFloat(tasa) === parseFloat(t.tasa_por_usd) ? '#E8F5E9' : '#fff',
                  color: parseFloat(tasa) === parseFloat(t.tasa_por_usd) ? 'var(--verde)' : 'var(--texto-suave)',
                  fontFamily: 'Poppins', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer'
                }}>
                  {parseFloat(t.tasa_por_usd).toLocaleString()} {i === 0 ? '(más reciente)' : ''}
                </button>
              ))}
            </div>
            <input
              className="input-mm"
              type="number"
              step="0.01"
              placeholder={`Tasa manual (ej: ${moneda === 'BS' ? '36.5' : '4000'})`}
              value={tasa}
              onChange={e => setTasa(e.target.value)}
            />
          </div>
        )}

        {/* Tipo de pago */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 8, display: 'block' }}>Tipo de pago</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[{ v: 'efectivo', label: '💵 Efectivo' }, { v: 'transferencia', label: '🏦 Transferencia' }].map(t => (
              <button key={t.v} onClick={() => setTipoPago(t.v)} style={{
                padding: '11px', borderRadius: 12, border: '2px solid',
                borderColor: tipoPago === t.v ? 'var(--verde)' : '#E0E0E0',
                background: tipoPago === t.v ? '#E8F5E9' : '#fff',
                color: tipoPago === t.v ? 'var(--verde)' : 'var(--texto-suave)',
                fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer'
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cuenta bancaria */}
        {tipoPago === 'transferencia' && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 8, display: 'block' }}>
              <RiBankLine style={{ marginRight: 6 }} />
              Cuenta destino ({moneda})
            </label>
            {cuentas.length === 0 ? (
              <div style={{ padding: '12px 16px', background: '#FFF3E0', borderRadius: 12, fontSize: '0.82rem', color: '#E65100' }}>
                No hay cuentas activas para {moneda}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cuentas.map(c => (
                  <button key={c.id} onClick={() => setCuentaId(c.id)} style={{
                    padding: '12px 16px', borderRadius: 12, border: '2px solid',
                    borderColor: cuentaId === c.id ? 'var(--verde)' : '#E0E0E0',
                    background: cuentaId === c.id ? '#E8F5E9' : '#fff',
                    textAlign: 'left', cursor: 'pointer', fontFamily: 'Poppins'
                  }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: cuentaId === c.id ? 'var(--verde)' : 'var(--texto)' }}>
                      {c.nombre_banco}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--texto-suave)' }}>
                      {c.titular_cuenta} {c.numero_cuenta ? `· ${c.numero_cuenta}` : ''} {c.telefono ? `· ${c.telefono}` : ''}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notas */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Notas (opcional)</label>
          <textarea className="input-mm" rows={2} placeholder="Observaciones del pedido..." value={notas} onChange={e => setNotas(e.target.value)} style={{ resize: 'none' }} />
        </div>

        {/* Total */}
        <div style={{ background: 'var(--verde)', borderRadius: 16, padding: '16px 20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>Total a pagar</div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.5rem' }}>
                {simbolo} {totalConvertido()}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>En USD</div>
              <div style={{ color: 'var(--naranja-claro)', fontWeight: 700, fontSize: '1rem' }}>
                ${totalUSD.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => onConfirmar({ tipoPago, cuentaId, notas })}
          disabled={cargando || (tipoPago === 'transferencia' && !cuentaId) || (moneda !== 'USD' && !tasa)}
          style={{
            width: '100%', padding: '14px',
            background: 'var(--naranja)', color: '#fff',
            border: 'none', borderRadius: 14,
            fontFamily: 'Poppins', fontWeight: 700, fontSize: '1rem',
            cursor: 'pointer', transition: 'all 0.2s',
            opacity: (cargando || (tipoPago === 'transferencia' && !cuentaId) || (moneda !== 'USD' && !tasa)) ? 0.6 : 1
          }}
        >
          {cargando ? <span className="spinner-border spinner-border-sm me-2" /> : <RiCheckLine style={{ marginRight: 8 }} />}
          {cargando ? 'Procesando...' : 'Confirmar pedido'}
        </button>
      </div>
    </div>
  );
};

const ModalTicket = ({ show, onClose, venta }) => {
  if (!show || !venta) return null;
  const simbolo = venta.moneda_pago === 'USD' ? '$' : venta.moneda_pago === 'BS' ? 'Bs.' : 'COP$';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1070,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div style={{
        background: '#fff', borderRadius: 20,
        width: '100%', maxWidth: 400,
        padding: '32px 28px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
        <h4 style={{ fontWeight: 800, color: 'var(--verde)', marginBottom: 4 }}>¡Pedido registrado!</h4>
        <p style={{ color: 'var(--texto-suave)', fontSize: '0.85rem', marginBottom: 24 }}>
          Venta #{venta.id} procesada exitosamente
        </p>

        <div style={{ background: 'var(--crema)', borderRadius: 14, padding: '16px 20px', marginBottom: 20, textAlign: 'left' }}>
          {venta.items?.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.85rem' }}>
              <span>{item.producto_nombre} x{item.cantidad}</span>
              <span style={{ fontWeight: 600 }}>${parseFloat(item.subtotal_usd).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #E0E0E0', marginTop: 10, paddingTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
              <span>Total USD</span>
              <span style={{ color: 'var(--verde)' }}>${parseFloat(venta.total_usd).toFixed(2)}</span>
            </div>
            {venta.moneda_pago !== 'USD' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: 4 }}>
                <span>Total {venta.moneda_pago}</span>
                <span style={{ color: 'var(--naranja)' }}>{simbolo} {parseFloat(venta.total_pagado).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 24 }}>
          <div style={{ flex: 1, padding: '10px', background: '#E8F5E9', borderRadius: 10 }}>
            <div style={{ color: 'var(--texto-suave)' }}>Tipo pago</div>
            <div style={{ fontWeight: 700, color: 'var(--verde)', textTransform: 'capitalize' }}>{venta.tipo_pago}</div>
          </div>
          <div style={{ flex: 1, padding: '10px', background: '#FFF3E0', borderRadius: 10 }}>
            <div style={{ color: 'var(--texto-suave)' }}>Moneda</div>
            <div style={{ fontWeight: 700, color: 'var(--naranja)' }}>{venta.moneda_pago}</div>
          </div>
          {venta.nombre_banco && (
            <div style={{ flex: 1, padding: '10px', background: '#E3F2FD', borderRadius: 10 }}>
              <div style={{ color: 'var(--texto-suave)' }}>Banco</div>
              <div style={{ fontWeight: 700, color: '#1565C0', fontSize: '0.78rem' }}>{venta.nombre_banco}</div>
            </div>
          )}
        </div>

        <button onClick={onClose} className="btn-verde" style={{ width: '100%', padding: '13px' }}>
          Nuevo pedido
        </button>
      </div>
    </div>
  );
};

export default function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [tasas, setTasas] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('');
  const [cargando, setCargando] = useState(true);
  const [modalVenta, setModalVenta] = useState(false);
  const [modalTicket, setModalTicket] = useState(false);
  const [ventaRealizada, setVentaRealizada] = useState(null);
  const [moneda, setMoneda] = useState('USD');
  const [tasa, setTasa] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [modalToppings, setModalToppings] = useState(null);
  const [toppingsSeleccionados, setToppingsSeleccionados] = useState([]);

  const cargar = async () => {
    setCargando(true);
    try {
      const [r1, r2, r3] = await Promise.all([
        API.get('/productos/activos'),
        API.get('/categorias'),
        API.get('/tasas-cambio')
      ]);
      setProductos(r1.data.productos);
      setCategorias(r2.data.categorias);
      setTasas(r3.data.tasas);
      const ultimaBS = r3.data.tasas.find(t => t.moneda === 'BS');
      if (ultimaBS) setTasa(ultimaBS.tasa_por_usd);
    } catch { toast.error('Error cargando catálogo'); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  const abrirProducto = async (prod) => {
    if (prod.tiene_toppings) {
      try {
        const { data } = await API.get(`/productos/${prod.id}`);
        setModalToppings(data.producto);
        setToppingsSeleccionados([]);
      } catch { toast.error('Error cargando toppings'); }
    } else {
      agregarAlCarrito(prod, []);
    }
  };

  const agregarAlCarrito = (prod, tops) => {
    setCarrito(c => {
      const existe = c.findIndex(i => i.id === prod.id && JSON.stringify(i.toppingsSeleccionados) === JSON.stringify(tops));
      if (existe >= 0) {
        const nuevo = [...c];
        nuevo[existe].cantidad += 1;
        return nuevo;
      }
      return [...c, { ...prod, cantidad: 1, toppingsSeleccionados: tops }];
    });
    toast.success(`${prod.nombre} añadido al carrito`, { autoClose: 1000 });
    setModalToppings(null);
  };

  const cambiarCantidad = (index, delta) => {
    setCarrito(c => {
      const nuevo = [...c];
      nuevo[index].cantidad += delta;
      if (nuevo[index].cantidad <= 0) nuevo.splice(index, 1);
      return nuevo;
    });
  };

  const totalCarrito = carrito.reduce((acc, item) => {
    const base = parseFloat(item.precio_final_usd) * item.cantidad;
    const tops = (item.toppingsSeleccionados || []).reduce((a, t) => a + parseFloat(t.precio_usd), 0) * item.cantidad;
    return acc + base + tops;
  }, 0);

  const confirmarVenta = async ({ tipoPago, cuentaId, notas }) => {
    setProcesando(true);
    try {
      const items = carrito.map(item => ({
        producto_id: item.id,
        cantidad: item.cantidad,
        toppings_ids: (item.toppingsSeleccionados || []).map(t => t.id)
      }));

      const { data } = await API.post('/ventas', {
        moneda_pago: moneda,
        tipo_pago: tipoPago,
        cuenta_bancaria_id: cuentaId || null,
        tasa_cambio_usada: moneda !== 'USD' ? tasa : null,
        notas,
        items
      });

      setVentaRealizada(data.venta);
      setCarrito([]);
      setModalVenta(false);
      setModalTicket(true);
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error procesando venta');
    } finally { setProcesando(false); }
  };

  const filtrados = productos.filter(p => {
    const matchBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const matchCat = !categoriaActiva || p.categoria_id === parseInt(categoriaActiva);
    return matchBusqueda && matchCat;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 2 }}>Catálogo 🥭</h1>
        <p style={{ color: 'var(--texto-suave)', fontSize: '0.85rem' }}>{productos.length} productos disponibles</p>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <RiSearchLine style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--texto-suave)' }} />
          <input className="input-mm" placeholder="Buscar producto..." value={busqueda} onChange={e => setBusqueda(e.target.value)} style={{ paddingLeft: 40 }} />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setCategoriaActiva('')} style={{
            padding: '8px 16px', borderRadius: 20, border: '2px solid',
            borderColor: !categoriaActiva ? 'var(--verde)' : '#E0E0E0',
            background: !categoriaActiva ? '#E8F5E9' : '#fff',
            color: !categoriaActiva ? 'var(--verde)' : 'var(--texto-suave)',
            fontFamily: 'Poppins', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer'
          }}>
            Todos
          </button>
          {categorias.map(c => (
            <button key={c.id} onClick={() => setCategoriaActiva(c.id)} style={{
              padding: '8px 16px', borderRadius: 20, border: '2px solid',
              borderColor: categoriaActiva === c.id ? 'var(--verde)' : '#E0E0E0',
              background: categoriaActiva === c.id ? '#E8F5E9' : '#fff',
              color: categoriaActiva === c.id ? 'var(--verde)' : 'var(--texto-suave)',
              fontFamily: 'Poppins', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer'
            }}>
              {c.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Grid productos */}
      {cargando ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div className="spinner-border" style={{ color: 'var(--verde)' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {filtrados.map(prod => (
            <div key={prod.id} className="card-mm" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}
              onClick={() => abrirProducto(prod)}
            >
              <div style={{ height: 150, background: 'var(--crema)', position: 'relative', overflow: 'hidden' }}>
                {prod.imagen_url ? (
                  <img src={prod.imagen_url} alt={prod.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <RiImageLine style={{ fontSize: 36, color: '#BDBDBD' }} />
                  </div>
                )}
                {prod.tiene_toppings && (
                  <span style={{ position: 'absolute', top: 8, left: 8, background: 'var(--naranja)', color: '#fff', borderRadius: 20, padding: '3px 10px', fontSize: '0.7rem', fontWeight: 700 }}>
                    + Extras
                  </span>
                )}
              </div>
              <div style={{ padding: '12px 14px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 2 }}>{prod.nombre}</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--texto-suave)', marginBottom: 10 }}>{prod.categoria}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--verde)' }}>
                    ${parseFloat(prod.precio_final_usd).toFixed(2)}
                  </span>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'var(--naranja)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '1rem'
                  }}>
                    <RiAddLine />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Carrito flotante */}
      {carrito.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          zIndex: 1040
        }}>
          <button
            onClick={() => setModalVenta(true)}
            style={{
              background: 'var(--verde)', color: '#fff',
              border: 'none', borderRadius: 20,
              padding: '14px 24px',
              display: 'flex', alignItems: 'center', gap: 12,
              fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.95rem',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(27,94,32,0.4)'
            }}
          >
            <RiShoppingCartLine style={{ fontSize: '1.2rem' }} />
            Ver pedido ({carrito.reduce((a, i) => a + i.cantidad, 0)})
            <span style={{ background: 'var(--naranja)', borderRadius: 12, padding: '2px 10px', fontSize: '0.88rem' }}>
              ${totalCarrito.toFixed(2)}
            </span>
          </button>
        </div>
      )}

      {/* Modal toppings */}
      {modalToppings && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1055,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 420, padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h5 style={{ fontWeight: 700, margin: 0 }}>Extras para {modalToppings.nombre}</h5>
              <button onClick={() => setModalToppings(null)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer' }}>
                <RiCloseLine />
              </button>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--texto-suave)', marginBottom: 16 }}>
              Selecciona los adicionales que deseas agregar
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {modalToppings.toppings?.map(t => (
                <button key={t.id} onClick={() => setToppingsSeleccionados(ts =>
                  ts.find(x => x.id === t.id) ? ts.filter(x => x.id !== t.id) : [...ts, t]
                )} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', borderRadius: 12, border: '2px solid',
                  borderColor: toppingsSeleccionados.find(x => x.id === t.id) ? 'var(--naranja)' : '#E0E0E0',
                  background: toppingsSeleccionados.find(x => x.id === t.id) ? '#FFF3E0' : '#fff',
                  cursor: 'pointer', fontFamily: 'Poppins', textAlign: 'left'
                }}>
                  <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{t.nombre}</span>
                  <span style={{ fontWeight: 700, color: 'var(--naranja)', fontSize: '0.88rem' }}>
                    {parseFloat(t.precio_usd) > 0 ? `+$${parseFloat(t.precio_usd).toFixed(2)}` : 'Gratis'}
                  </span>
                </button>
              ))}
            </div>
            <button className="btn-verde" style={{ width: '100%', padding: '13px' }}
              onClick={() => agregarAlCarrito(modalToppings, toppingsSeleccionados)}>
              Añadir al carrito · ${(parseFloat(modalToppings.precio_final_usd) + toppingsSeleccionados.reduce((a, t) => a + parseFloat(t.precio_usd), 0)).toFixed(2)}
            </button>
          </div>
        </div>
      )}

      <ModalVenta
        show={modalVenta}
        onClose={() => setModalVenta(false)}
        carrito={carrito}
        moneda={moneda}
        setMoneda={setMoneda}
        tasa={tasa}
        setTasa={setTasa}
        tasasDisponibles={tasas}
        onConfirmar={confirmarVenta}
        cargando={procesando}
      />

      <ModalTicket
        show={modalTicket}
        onClose={() => setModalTicket(false)}
        venta={ventaRealizada}
      />
    </div>
  );
}