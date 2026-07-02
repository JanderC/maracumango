import { useState, useEffect, useRef, useCallback } from 'react';
import API from '../api/axios';
import { toast } from 'react-toastify';
import {
  RiCloseLine, RiArrowUpLine, RiLeafLine, RiSearchLine,
  RiSparklingLine, RiPaletteLine
} from 'react-icons/ri';

/* ═══════════════════════════════════════════════════════════════
   MARACU MANGO — Menú público
   Paleta:  pulpa #3D1140 · pulpa-osc #220A24 · mango #FF9F29
            dorado #FFC857 · crema #FFF9F0 · semilla #241220 · hoja #5B8C5A
   Firma:   motivo de "semillas" repetido como separador / loader / scroll-cue
   ═══════════════════════════════════════════════════════════════ */

const fmtCOP = (v) => `$${Number(v || 0).toLocaleString('es-CO')}`;

// ── Logotipo real del negocio (public/logo.png), con fallback a texto si falla ──
const Logotipo = ({ size = 44, claro = true }) => {
  const [errorLogo, setErrorLogo] = useState(false);

  if (errorLogo) {
    return (
      <span style={{
        fontFamily: "'Baloo 2', cursive", fontWeight: 700, fontSize: size * 0.5,
        color: claro ? 'var(--mm-crema)' : 'var(--mm-semilla)', letterSpacing: 0.2, lineHeight: 1
      }}>
        Maracu<span style={{ color: 'var(--mm-dorado)' }}>Mango</span>
      </span>
    );
  }

  return (
    <img
      src="/logo.png"
      alt="Maracu Mango"
      onError={() => setErrorLogo(true)}
      style={{ height: size, width: 'auto', objectFit: 'contain', display: 'block' }}
    />
  );
};

// ── Separador "semillas" — la firma visual repetida en todo el menú ──
const SeparadorSemillas = ({ oscuro = false }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '6px 0' }} aria-hidden="true">
    {Array.from({ length: 7 }).map((_, i) => (
      <span key={i} style={{
        width: i === 3 ? 6 : 4, height: i === 3 ? 6 : 4, borderRadius: '50%',
        background: oscuro ? 'var(--mm-semilla)' : 'var(--mm-dorado)',
        opacity: 0.35 + (i === 3 ? 0.65 : Math.abs(3 - i) * -0.08 + 0.4)
      }} />
    ))}
  </div>
);

// ── Placeholder cuando el producto no tiene imagen (o falla al cargar) ──
const PlaceholderFruta = ({ nombre }) => (
  <div style={{
    width: '100%', height: '100%',
    background: 'linear-gradient(135deg, var(--mm-mango) 0%, var(--mm-dorado) 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative', overflow: 'hidden'
  }}>
    <div style={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage:
      'radial-gradient(circle, var(--mm-semilla) 1.5px, transparent 1.5px)', backgroundSize: '14px 14px' }} />
    <span style={{ fontSize: '2.4rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}>🥭</span>
  </div>
);

export default function Menu() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [toppings, setToppings] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState(null);
  const [imagenesFallidas, setImagenesFallidas] = useState(new Set());
  const [detalle, setDetalle] = useState(null);
  const [detalleCargando, setDetalleCargando] = useState(false);
  const [mostrarArriba, setMostrarArriba] = useState(false);

  const seccionRefs = useRef({});

  const cargar = async () => {
    setCargando(true);
    try {
      const [r1, r2, r3] = await Promise.all([
        API.get('/menu/productos'),
        API.get('/menu/categorias'),
        API.get('/menu/toppings').catch(() => ({ data: { toppings: [] } }))
      ]);
      setProductos(r1.data.productos || []);
      setCategorias(r2.data.categorias || []);
      setToppings((r3.data.toppings || []).filter(t => t.activo !== false));
    } catch {
      toast.error('No se pudo cargar el menú');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  // Scroll: botón "subir" + resaltar categoría activa
  useEffect(() => {
    const onScroll = () => {
      setMostrarArriba(window.scrollY > 480);
      const posY = window.scrollY + 160;
      let actual = null;
      Object.entries(seccionRefs.current).forEach(([id, el]) => {
        if (el && el.offsetTop <= posY) actual = id;
      });
      if (actual) setCategoriaActiva(actual);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [productos, categorias]);

  const irACategoria = (id) => {
    seccionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const abrirDetalle = async (prod) => {
    setDetalleCargando(true);
    setDetalle({ ...prod, toppings: [] });
    try {
      const { data } = await API.get(`/menu/productos/${prod.id}`);
      setDetalle(data.producto);
    } catch {
      // si falla, se queda con los datos básicos ya cargados
    } finally {
      setDetalleCargando(false);
    }
  };

  // ── Agrupar productos por categoría (solo categorías con productos) ──
  const term = busqueda.trim().toLowerCase();
  const productosFiltrados = term
    ? productos.filter(p => p.nombre.toLowerCase().includes(term) || (p.descripcion || '').toLowerCase().includes(term))
    : productos;

  const grupos = categorias
    .map(c => ({ ...c, productos: productosFiltrados.filter(p => p.categoria_id === c.id) }))
    .filter(g => g.productos.length > 0);

  const sinCategoria = productosFiltrados.filter(p => !p.categoria_id || !categorias.find(c => c.id === p.categoria_id));
  if (sinCategoria.length > 0) grupos.push({ id: 'otros', nombre: 'Otras delicias', productos: sinCategoria });

  // Recomendado: un producto por categoría (curación editorial, no dato de ventas)
  const recomendadoPorCategoria = {};
  grupos.forEach(g => {
    const elegido = g.productos.find(p => p.tiene_toppings) || g.productos[0];
    if (elegido) recomendadoPorCategoria[g.id] = elegido.id;
  });

  if (cargando) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--mm-pulpa)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18
      }}>
        <EstilosGlobales />
        <div style={{ fontSize: '2.6rem', animation: 'mm-flotar 1.6s ease-in-out infinite' }}>🥭</div>
        <SeparadorSemillas />
        <span style={{ color: 'var(--mm-crema)', fontFamily: 'Poppins', fontSize: '0.85rem', opacity: 0.75 }}>
          Preparando el menú...
        </span>
      </div>
    );
  }

  return (
    <div className="mm-root" style={{ background: 'var(--mm-crema)', minHeight: '100vh' }}>
      <EstilosGlobales />

      {/* ═══ HERO ═══ */}
      <header style={{
        position: 'relative', overflow: 'hidden',
        background: 'radial-gradient(ellipse at 30% 0%, var(--mm-pulpa) 0%, var(--mm-pulpa-osc) 75%)',
        padding: '64px 24px 110px', textAlign: 'center'
      }}>
        <div className="mm-textura-semillas" aria-hidden="true" />

        <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
            <Logotipo size={30} />
          </div>

          <span style={{
            display: 'inline-block', fontFamily: 'Poppins', fontSize: '0.72rem', fontWeight: 700,
            letterSpacing: 3, textTransform: 'uppercase', color: 'var(--mm-dorado)', marginBottom: 14
          }}>
            Menú
          </span>

          <h1 style={{
            fontFamily: "'Baloo 2', cursive", fontWeight: 700,
            fontSize: 'clamp(2.4rem, 7vw, 4rem)', lineHeight: 1.02,
            color: 'var(--mm-crema)', margin: '0 0 16px'
          }}>
            Maracu<span style={{ color: 'var(--mm-mango)' }}>Mango</span>
          </h1>

          <p style={{
            fontFamily: 'Poppins', fontSize: 'clamp(0.95rem, 2.4vw, 1.1rem)',
            color: 'var(--mm-crema)', opacity: 0.82, maxWidth: 440, margin: '0 auto 26px', lineHeight: 1.6
          }}>
            Fruta de verdad, toppings de antojo y una copa distinta para cada gusto.
          </p>

          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,200,87,0.35)',
            borderRadius: 30, padding: '7px 16px', fontFamily: 'Poppins',
            fontSize: '0.76rem', fontWeight: 600, color: 'var(--mm-dorado)'
          }}>
            🇨🇴 Precios en pesos colombianos
          </span>

          <div style={{ marginTop: 46, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'Poppins', fontSize: '0.72rem', color: 'var(--mm-crema)', opacity: 0.55, letterSpacing: 1 }}>
              DESCUBRE EL MENÚ
            </span>
            <SeparadorSemillas />
          </div>
        </div>

        {/* Borde "goteo" — transición hacia el contenido */}
        <svg viewBox="0 0 1440 90" preserveAspectRatio="none"
          style={{ position: 'absolute', bottom: -2, left: 0, width: '100%', height: 70, display: 'block' }}>
          <path
            d="M0,0 L0,40 C60,75 130,10 200,45 C270,80 340,15 410,42 C480,68 550,8 630,40
               C710,72 780,12 860,44 C940,76 1010,10 1090,42 C1170,74 1250,14 1320,44
               C1370,64 1410,50 1440,38 L1440,0 Z"
            fill="var(--mm-crema)" />
        </svg>
      </header>

      {/* ═══ NAV STICKY: logo mini + categorías + búsqueda ═══ */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40, background: 'var(--mm-crema)',
        borderBottom: '1px solid rgba(36,18,32,0.08)', paddingTop: 12
      }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 20px 12px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="mm-solo-desktop" style={{ flexShrink: 0 }}>
            <Logotipo size={26} claro={false} />
          </div>

          <div className="mm-nav-pills" style={{ display: 'flex', gap: 8, overflowX: 'auto', flex: 1, scrollbarWidth: 'none' }}>
            {grupos.map(g => (
              <button key={g.id} onClick={() => irACategoria(g.id)} style={{
                flexShrink: 0, padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.78rem', whiteSpace: 'nowrap',
                transition: 'all 0.18s',
                background: categoriaActiva === String(g.id) ? 'var(--mm-mango)' : 'rgba(61,17,64,0.06)',
                color: categoriaActiva === String(g.id) ? '#fff' : 'var(--mm-semilla)'
              }}>
                {g.nombre}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', flexShrink: 0 }}>
            <RiSearchLine style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--mm-semilla)', opacity: 0.4, fontSize: '0.95rem' }} />
            <input
              placeholder="Buscar..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{
                width: 150, padding: '8px 12px 8px 34px', borderRadius: 20,
                border: '1px solid rgba(36,18,32,0.12)', fontFamily: 'Poppins', fontSize: '0.8rem',
                outline: 'none', background: '#fff', color: 'var(--mm-semilla)'
              }}
            />
          </div>
        </div>
      </div>

      {/* ═══ Personaliza tu copa — toppings promo ═══ */}
      {toppings.length > 0 && (
        <section style={{ maxWidth: 1180, margin: '0 auto', padding: '36px 20px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <RiPaletteLine style={{ color: 'var(--mm-mango)', fontSize: '1.3rem' }} />
            <h2 style={{ fontFamily: "'Baloo 2', cursive", fontSize: '1.3rem', color: 'var(--mm-semilla)', margin: 0 }}>
              Personaliza tu copa
            </h2>
          </div>
          <p style={{ fontFamily: 'Poppins', fontSize: '0.82rem', color: 'var(--mm-semilla)', opacity: 0.6, margin: '0 0 16px' }}>
            Suma tus toppings favoritos a cualquier producto personalizable.
          </p>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
            {toppings.map(t => (
              <div key={t.id} style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8,
                background: '#fff', border: '1px solid rgba(36,18,32,0.08)',
                borderRadius: 16, padding: '10px 16px', boxShadow: '0 2px 8px rgba(61,17,64,0.05)'
              }}>
                <span style={{ fontSize: '1.1rem' }}>🍯</span>
                <div>
                  <div style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.8rem', color: 'var(--mm-semilla)', whiteSpace: 'nowrap' }}>
                    {t.nombre}
                  </div>
                  <div style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '0.74rem', color: 'var(--mm-mango)' }}>
                    {parseFloat(t.precio_cop) > 0 ? `+${fmtCOP(t.precio_cop)}` : 'Gratis'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ Menú por categorías ═══ */}
      <main style={{ maxWidth: 1180, margin: '0 auto', padding: '20px 20px 80px' }}>
        {grupos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '2.4rem', marginBottom: 12 }}>🥭</div>
            <p style={{ fontFamily: 'Poppins', color: 'var(--mm-semilla)', opacity: 0.6 }}>
              {term ? 'No encontramos productos con ese nombre.' : 'Estamos preparando el menú. ¡Vuelve pronto!'}
            </p>
          </div>
        ) : grupos.map(g => (
          <section key={g.id} ref={el => (seccionRefs.current[g.id] = el)}
            style={{ scrollMarginTop: 130, marginBottom: 46 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
              <h2 style={{ fontFamily: "'Baloo 2', cursive", fontSize: '1.5rem', color: 'var(--mm-semilla)', margin: 0 }}>
                {g.nombre}
              </h2>
              <span style={{ fontFamily: 'Poppins', fontSize: '0.75rem', color: 'var(--mm-semilla)', opacity: 0.45 }}>
                {g.productos.length} producto{g.productos.length > 1 ? 's' : ''}
              </span>
            </div>
            <SeparadorSemillas oscuro />

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
              gap: 18, marginTop: 18
            }}>
              {g.productos.map(p => {
                const esRecomendado = recomendadoPorCategoria[g.id] === p.id;
                const imgFalla = imagenesFallidas.has(p.id) || !p.imagen_url;
                return (
                  <button key={p.id} onClick={() => abrirDetalle(p)} className="mm-card"
                    style={{
                      textAlign: 'left', border: 'none', cursor: 'pointer', padding: 0,
                      background: '#fff', borderRadius: 18, overflow: 'hidden',
                      boxShadow: '0 3px 14px rgba(61,17,64,0.08)', display: 'flex', flexDirection: 'column'
                    }}>
                    <div style={{ position: 'relative', aspectRatio: '4 / 3', overflow: 'hidden' }}>
                      {imgFalla ? <PlaceholderFruta nombre={p.nombre} /> : (
                        <img src={p.imagen_url} alt={p.nombre}
                          onError={() => setImagenesFallidas(s => new Set(s).add(p.id))}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.35s' }}
                          className="mm-card-img" />
                      )}
                      {esRecomendado && (
                        <span style={{
                          position: 'absolute', top: 10, left: 10,
                          background: 'var(--mm-mango)', color: '#fff',
                          fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.66rem',
                          padding: '4px 10px', borderRadius: 20,
                          display: 'flex', alignItems: 'center', gap: 4
                        }}>
                          <RiSparklingLine /> Recomendado
                        </span>
                      )}
                    </div>
                    <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.92rem', color: 'var(--mm-semilla)', marginBottom: 4 }}>
                        {p.nombre}
                      </div>
                      {p.descripcion && (
                        <div style={{
                          fontFamily: 'Poppins', fontSize: '0.76rem', color: 'var(--mm-semilla)', opacity: 0.55,
                          marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                        }}>
                          {p.descripcion}
                        </div>
                      )}
                      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, fontSize: '1.15rem', color: 'var(--mm-mango)' }}>
                          {fmtCOP(p.precio_final_cop)}
                        </span>
                        {p.tiene_toppings && (
                          <span style={{
                            fontFamily: 'Poppins', fontWeight: 600, fontSize: '0.66rem',
                            color: 'var(--mm-hoja)', background: 'rgba(91,140,90,0.12)',
                            borderRadius: 12, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 3
                          }}>
                            <RiLeafLine /> Personalizable
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </main>

      {/* ═══ Footer ═══ */}
      <footer style={{ background: 'var(--mm-pulpa)', padding: '36px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <Logotipo size={22} />
        </div>
        <SeparadorSemillas />
        <p style={{ fontFamily: 'Poppins', fontSize: '0.74rem', color: 'var(--mm-crema)', opacity: 0.5, marginTop: 10 }}>
          Hecho con 🧡 fruta fresca
        </p>
      </footer>

      {/* ═══ Botón subir ═══ */}
      {mostrarArriba && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Subir al inicio"
          style={{
            position: 'fixed', bottom: 22, right: 22, zIndex: 50,
            width: 46, height: 46, borderRadius: '50%', border: 'none',
            background: 'var(--mm-mango)', color: '#fff', fontSize: '1.2rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 4px 16px rgba(255,159,41,0.45)'
          }}>
          <RiArrowUpLine />
        </button>
      )}

      {/* ═══ Modal de detalle ═══ */}
      {detalle && (
        <div onClick={() => setDetalle(null)} style={{
          position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(34,10,36,0.6)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
        }} className="mm-modal-overlay">
          <div onClick={e => e.stopPropagation()} style={{
            background: 'var(--mm-crema)', width: '100%', maxWidth: 480,
            borderRadius: '24px 24px 0 0', maxHeight: '88vh', overflowY: 'auto',
            animation: 'mm-subir 0.28s ease-out'
          }}>
            <div style={{ position: 'relative', aspectRatio: '16 / 10' }}>
              {(imagenesFallidas.has(detalle.id) || !detalle.imagen_url)
                ? <PlaceholderFruta nombre={detalle.nombre} />
                : <img src={detalle.imagen_url} alt={detalle.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              <button onClick={() => setDetalle(null)} aria-label="Cerrar" style={{
                position: 'absolute', top: 14, right: 14, width: 34, height: 34, borderRadius: '50%',
                background: 'rgba(255,255,255,0.9)', border: 'none', display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--mm-semilla)'
              }}>
                <RiCloseLine />
              </button>
            </div>

            <div style={{ padding: '22px 24px 32px' }}>
              {detalle.categoria && (
                <span style={{
                  fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.68rem', letterSpacing: 1,
                  textTransform: 'uppercase', color: 'var(--mm-mango)'
                }}>
                  {detalle.categoria}
                </span>
              )}
              <h3 style={{ fontFamily: "'Baloo 2', cursive", fontSize: '1.5rem', color: 'var(--mm-semilla)', margin: '4px 0 10px' }}>
                {detalle.nombre}
              </h3>
              {detalle.descripcion && (
                <p style={{ fontFamily: 'Poppins', fontSize: '0.86rem', color: 'var(--mm-semilla)', opacity: 0.65, lineHeight: 1.6, marginBottom: 18 }}>
                  {detalle.descripcion}
                </p>
              )}

              <div style={{
                fontFamily: "'Baloo 2', cursive", fontWeight: 700, fontSize: '1.8rem',
                color: 'var(--mm-mango)', marginBottom: 20
              }}>
                {fmtCOP(detalle.precio_final_cop)}
              </div>

              {detalle.tiene_toppings && (
                <div>
                  <SeparadorSemillas oscuro />
                  <div style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.85rem', color: 'var(--mm-semilla)', margin: '10px 0 10px' }}>
                    🍯 Toppings disponibles
                  </div>
                  {detalleCargando ? (
                    <div style={{ fontFamily: 'Poppins', fontSize: '0.8rem', color: 'var(--mm-semilla)', opacity: 0.5 }}>Cargando...</div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {(detalle.toppings || []).map(t => (
                        <span key={t.id} style={{
                          background: '#fff', border: '1px solid rgba(36,18,32,0.1)', borderRadius: 14,
                          padding: '6px 12px', fontFamily: 'Poppins', fontSize: '0.76rem', fontWeight: 600, color: 'var(--mm-semilla)'
                        }}>
                          {t.nombre} <span style={{ color: 'var(--mm-mango)' }}>
                            {parseFloat(t.precio_cop) > 0 ? `+${fmtCOP(t.precio_cop)}` : 'gratis'}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Estilos globales: fuentes, variables de color, keyframes, responsive ──
function EstilosGlobales() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700&family=Poppins:wght@400;500;600;700&display=swap');

      .mm-root, .mm-root * { box-sizing: border-box; }
      .mm-root {
        --mm-pulpa: #3D1140;
        --mm-pulpa-osc: #220A24;
        --mm-mango: #FF9F29;
        --mm-dorado: #FFC857;
        --mm-crema: #FFF9F0;
        --mm-semilla: #241220;
        --mm-hoja: #5B8C5A;
      }

      .mm-textura-semillas {
        position: absolute; inset: 0; opacity: 0.35; pointer-events: none;
        background-image: radial-gradient(circle, rgba(255,200,87,0.35) 1.5px, transparent 1.5px);
        background-size: 26px 26px;
      }

      .mm-card { transition: transform 0.22s ease, box-shadow 0.22s ease; }
      .mm-card:hover { transform: translateY(-4px); box-shadow: 0 10px 26px rgba(61,17,64,0.16); }
      .mm-card:hover .mm-card-img { transform: scale(1.06); }
      .mm-card:focus-visible { outline: 2px solid var(--mm-mango); outline-offset: 2px; }

      button:focus-visible, input:focus-visible { outline: 2px solid var(--mm-mango); outline-offset: 2px; }

      @keyframes mm-flotar {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
      }
      @keyframes mm-subir {
        from { transform: translateY(24px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      .mm-nav-pills::-webkit-scrollbar { display: none; }

      @media (max-width: 640px) {
        .mm-solo-desktop { display: none; }
      }

      @media (prefers-reduced-motion: reduce) {
        .mm-root * { animation: none !important; transition: none !important; }
      }
    `}</style>
  );
}