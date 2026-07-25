import { useState, useEffect } from 'react';
import API from '../api/axios';
import {
  RiMoneyDollarCircleLine, RiShoppingCartLine,
  RiTrophyLine, RiArrowUpLine, RiArrowDownLine,
  RiRefreshLine, RiBarChartLine, RiPriceTag3Line,
  RiAlertLine, RiCoinLine, RiStore2Line
} from 'react-icons/ri';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line, Legend
} from 'recharts';

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtCOP = (v) => `$${Number(v || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtUSD = (v) => `$${parseFloat(v || 0).toFixed(2)}`;
const pct = (a, b) => (b > 0 ? ((a / b) * 100).toFixed(1) : '0.0');

// ── Componentes pequeños ─────────────────────────────────────────────────────
const StatCard = ({ icon, label, valor, sub, subColor, color, tendencia, onClick }) => (
  <div className="card-mm" onClick={onClick}
    style={{ display: 'flex', flexDirection: 'column', gap: 10, cursor: onClick ? 'pointer' : 'default', transition: 'transform 0.15s' }}
    onMouseEnter={e => onClick && (e.currentTarget.style.transform = 'translateY(-2px)')}
    onMouseLeave={e => onClick && (e.currentTarget.style.transform = 'none')}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{
        width: 42, height: 42, borderRadius: 12,
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.2rem', color
      }}>{icon}</div>
      {tendencia !== undefined && (
        <span style={{
          display: 'flex', alignItems: 'center', gap: 3,
          fontSize: '0.72rem', fontWeight: 700,
          color: tendencia >= 0 ? '#2E7D32' : '#C62828',
          background: tendencia >= 0 ? '#E8F5E9' : '#FFEBEE',
          padding: '2px 8px', borderRadius: 20
        }}>
          {tendencia >= 0 ? <RiArrowUpLine /> : <RiArrowDownLine />}
          {Math.abs(tendencia)}%
        </span>
      )}
    </div>
    <div>
      <div style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--texto)', lineHeight: 1.1 }}>
        {valor}
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--texto-suave)', marginTop: 4 }}>{label}</div>
      {sub && (
        <div style={{ fontSize: '0.73rem', color: subColor || color, fontWeight: 600, marginTop: 3 }}>{sub}</div>
      )}
    </div>
  </div>
);

const Badge = ({ children, color, bg }) => (
  <span style={{ background: bg, color, borderRadius: 20, padding: '2px 10px', fontSize: '0.73rem', fontWeight: 700 }}>
    {children}
  </span>
);

const SectionTitle = ({ children }) => (
  <h6 style={{ fontWeight: 700, marginBottom: 18, color: 'var(--texto)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
    {children}
  </h6>
);

// ── Tooltip personalizado para gráfica ───────────────────────────────────────
const TooltipCOP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #E0E0E0', borderRadius: 10, padding: '10px 14px', fontFamily: 'Poppins', fontSize: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--texto)' }}>📅 {label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {p.name.includes('COP') ? fmtCOP(p.value) : fmtUSD(p.value)}
        </div>
      ))}
    </div>
  );
};

// ── Dashboard principal ──────────────────────────────────────────────────────
export default function Dashboard() {
  const [resumen, setResumen] = useState(null);
  const [ventasDia, setVentasDia] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [periodo, setPeriodo] = useState('mes');
  const [vistaGrafica, setVistaGrafica] = useState('cop'); // 'cop' | 'usd'

  const obtenerFechas = () => {
    const hoy = new Date();
    const fin = hoy.toISOString().split('T')[0];
    let inicio;
    if (periodo === 'hoy') {
      inicio = fin;
    } else if (periodo === 'semana') {
      const d = new Date(hoy); d.setDate(d.getDate() - 7);
      inicio = d.toISOString().split('T')[0];
    } else {
      const d = new Date(hoy); d.setDate(1);
      inicio = d.toISOString().split('T')[0];
    }
    return { inicio, fin };
  };

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const { inicio, fin } = obtenerFechas();
      const [r1, r2] = await Promise.all([
        API.get(`/reportes/resumen?fecha_inicio=${inicio}&fecha_fin=${fin}`),
        API.get(`/reportes/ventas-por-dia?fecha_inicio=${inicio}&fecha_fin=${fin}`)
      ]);
      setResumen(r1.data);
      setVentasDia(r2.data.ventas_por_dia.slice(0, 14).reverse());
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarDatos(); }, [periodo]);

  if (cargando) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
      <div className="spinner-border" style={{ color: 'var(--verde)' }} />
    </div>
  );

  const r = resumen?.resumen || {};
  const masVendidos = resumen?.productos_mas_vendidos || [];
  const porMoneda = resumen?.por_moneda || [];
  const porTipoPago = resumen?.por_tipo_pago || [];
  const alertasStock = resumen?.alertas_stock || 0;
  const margenPct = pct(r.total_ganancias_cop, r.total_ingresos_cop);

  const labelPeriodo = periodo === 'hoy' ? 'hoy' : periodo === 'semana' ? 'esta semana' : 'este mes';

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--texto)', marginBottom: 2 }}>
            Dashboard 📊
          </h1>
          <p style={{ color: 'var(--texto-suave)', fontSize: '0.82rem' }}>
            Resumen del negocio — <strong>{labelPeriodo}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: '#F5F5F5', borderRadius: 12, padding: 3, gap: 2 }}>
            {[['hoy','Hoy'], ['semana','Semana'], ['mes','Mes']].map(([val, lbl]) => (
              <button key={val} onClick={() => setPeriodo(val)} style={{
                padding: '6px 14px', borderRadius: 10, border: 'none',
                background: periodo === val ? '#fff' : 'transparent',
                color: periodo === val ? 'var(--verde)' : 'var(--texto-suave)',
                fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.78rem',
                cursor: 'pointer', boxShadow: periodo === val ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s'
              }}>{lbl}</button>
            ))}
          </div>
          <button onClick={cargarDatos} style={{
            padding: '7px 12px', borderRadius: 10, border: '1px solid #E0E0E0',
            background: '#fff', color: 'var(--verde)', cursor: 'pointer', fontSize: '1rem'
          }}>
            <RiRefreshLine />
          </button>
        </div>
      </div>

      {/* ── Alerta stock bajo ── */}
      {alertasStock > 0 && (
        <div style={{
          background: '#FFF3E0', border: '1px solid #FFB300', borderRadius: 12,
          padding: '12px 18px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 10
        }}>
          <RiAlertLine style={{ color: '#E65100', fontSize: '1.3rem', flexShrink: 0 }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#E65100' }}>
            Hay <strong>{alertasStock}</strong> alerta{alertasStock > 1 ? 's' : ''} de stock bajo en inventario. Revisa los insumos.
          </span>
        </div>
      )}

      {/* ── Stats principales ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 20 }}>
        <StatCard
          icon={<RiShoppingCartLine />}
          label={`Ventas ${labelPeriodo}`}
          valor={r.total_ventas || 0}
          sub={`Ticket prom. ${fmtCOP(r.ticket_promedio_cop)}`}
          color="#1B5E20"
        />
        <StatCard
          icon={<RiCoinLine />}
          label="Ingresos totales (COP)"
          valor={fmtCOP(r.total_ingresos_cop)}
          sub={`≈ ${fmtUSD(r.total_ingresos_usd)} USD`}
          subColor="var(--texto-suave)"
          color="#F57F17"
        />
        <StatCard
          icon={<RiTrophyLine />}
          label="Ganancias netas (COP)"
          valor={fmtCOP(r.total_ganancias_cop)}
          sub={`≈ ${fmtUSD(r.total_ganancias_usd)} USD`}
          subColor="var(--texto-suave)"
          color="#1565C0"
        />
        <StatCard
          icon={<RiBarChartLine />}
          label="Margen de ganancia"
          valor={`${margenPct}%`}
          sub="sobre ingresos COP"
          color="#6A1B9A"
        />
      </div>

      {/* ── Gráfica + Desglose moneda ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, marginBottom: 20 }} className="dashboard-grid">

        {/* Gráfica ventas por día */}
        <div className="card-mm">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <SectionTitle>📈 Ventas por día</SectionTitle>
            <div style={{ display: 'flex', background: '#F5F5F5', borderRadius: 8, padding: 2, gap: 2 }}>
              {[['cop','COP'], ['usd','USD']].map(([val, lbl]) => (
                <button key={val} onClick={() => setVistaGrafica(val)} style={{
                  padding: '4px 10px', borderRadius: 7, border: 'none',
                  background: vistaGrafica === val ? '#fff' : 'transparent',
                  color: vistaGrafica === val ? 'var(--verde)' : 'var(--texto-suave)',
                  fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer',
                  boxShadow: vistaGrafica === val ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                }}>{lbl}</button>
              ))}
            </div>
          </div>
          {ventasDia.length > 0 ? (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={ventasDia} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="fecha" tick={{ fontSize: 10, fontFamily: 'Poppins' }}
                  tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fontSize: 10, fontFamily: 'Poppins' }}
                  tickFormatter={v => vistaGrafica === 'cop'
                    ? `$${(v/1000).toFixed(0)}k`
                    : `$${v.toFixed(0)}`} />
                <Tooltip content={<TooltipCOP />} />
                <Bar
                  dataKey={vistaGrafica === 'cop' ? 'total_cop' : 'total_usd'}
                  name={vistaGrafica === 'cop' ? 'Ingresos COP' : 'Ingresos USD'}
                  fill="var(--verde)" radius={[6,6,0,0]}
                />
                <Bar
                  dataKey={vistaGrafica === 'cop' ? 'ganancia_cop' : 'ganancia_usd'}
                  name={vistaGrafica === 'cop' ? 'Ganancia COP' : 'Ganancia USD'}
                  fill="var(--naranja)" radius={[6,6,0,0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--texto-suave)', fontSize: '0.85rem' }}>
              Sin ventas en este período
            </div>
          )}
          <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: '0.72rem', color: 'var(--texto-suave)' }}>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: 'var(--verde)', marginRight: 5 }} />Ingresos</span>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: 'var(--naranja)', marginRight: 5 }} />Ganancias</span>
          </div>
        </div>

        {/* Desglose por moneda + tipo de pago */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Por moneda */}
          <div className="card-mm" style={{ flex: 1 }}>
            <SectionTitle>💳 Por moneda</SectionTitle>
            {porMoneda.length > 0 ? porMoneda.map(m => {
              const colores = {
                USD: { bg: '#E8F5E9', color: '#1B5E20', emoji: '💵' },
                BS:  { bg: '#E3F2FD', color: '#1565C0', emoji: '🇻🇪' },
                COP: { bg: '#FFF3E0', color: '#E65100', emoji: '🇨🇴' }
              };
              const c = colores[m.moneda_pago] || { bg: '#F5F5F5', color: '#666', emoji: '💰' };
              return (
                <div key={m.moneda_pago} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: 10, marginBottom: 8, background: c.bg
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: c.color }}>
                      {c.emoji} {m.moneda_pago === 'USD' ? 'Dólar' : m.moneda_pago === 'BS' ? 'Bolívar' : 'Peso COP'}
                    </div>
                    <div style={{ fontSize: '0.71rem', color: 'var(--texto-suave)', marginTop: 1 }}>
                      {m.cantidad} venta{m.cantidad > 1 ? 's' : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: c.color }}>
                      {fmtCOP(m.total_cop)}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--texto-suave)' }}>
                      {fmtUSD(m.total_usd)} USD
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div style={{ color: 'var(--texto-suave)', fontSize: '0.82rem', textAlign: 'center', paddingTop: 24 }}>Sin datos</div>
            )}
          </div>

          {/* Por tipo de pago */}
          <div className="card-mm" style={{ flex: 1 }}>
            <SectionTitle>🏦 Tipo de pago</SectionTitle>
            {porTipoPago.length > 0 ? porTipoPago.map(t => (
              <div key={t.tipo_pago} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px', borderRadius: 10, marginBottom: 8,
                background: t.tipo_pago === 'efectivo' ? '#E8F5E9' : '#F3E5F5'
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: t.tipo_pago === 'efectivo' ? '#1B5E20' : '#6A1B9A' }}>
                    {t.tipo_pago === 'efectivo' ? '💵 Efectivo' : '🏦 Transferencia'}
                  </div>
                  <div style={{ fontSize: '0.71rem', color: 'var(--texto-suave)', marginTop: 1 }}>
                    {t.cantidad} venta{t.cantidad > 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: t.tipo_pago === 'efectivo' ? '#1B5E20' : '#6A1B9A' }}>
                  {fmtCOP(t.total_cop)}
                </div>
              </div>
            )) : (
              <div style={{ color: 'var(--texto-suave)', fontSize: '0.82rem', textAlign: 'center', paddingTop: 24 }}>Sin datos</div>
            )}
          </div>

        </div>
      </div>

      {/* ── Productos más vendidos ── */}
      <div className="card-mm">
        <SectionTitle>🏆 Productos más vendidos</SectionTitle>
        {masVendidos.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #F0F0F0' }}>
                  {['#', 'Código', 'Producto', 'Unidades', 'Ingresos COP', '≈ USD', 'Ganancia COP', 'Margen'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--texto-suave)', fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {masVendidos.map((p, i) => {
                  const margen = pct(p.ganancia_cop, p.total_cop);
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #F9F9F9' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px', fontWeight: 800, color: 'var(--naranja)' }}>#{i+1}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', background: '#F0F0F0', borderRadius: 6, padding: '2px 7px', color: 'var(--texto-suave)', fontWeight: 700 }}>
                          {p.codigo || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{p.nombre}</td>
                      <td style={{ padding: '12px' }}>
                        <Badge bg="#E8F5E9" color="#1B5E20">{p.unidades_vendidas}</Badge>
                      </td>
                      <td style={{ padding: '12px', fontWeight: 700, color: 'var(--texto)' }}>{fmtCOP(p.total_cop)}</td>
                      <td style={{ padding: '12px', fontSize: '0.75rem', color: 'var(--texto-suave)' }}>{fmtUSD(p.total_usd)}</td>
                      <td style={{ padding: '12px', color: '#2E7D32', fontWeight: 700 }}>{fmtCOP(p.ganancia_cop)}</td>
                      <td style={{ padding: '12px' }}>
                        <Badge
                          bg={parseFloat(margen) >= 20 ? '#E8F5E9' : parseFloat(margen) >= 10 ? '#FFF3E0' : '#FFEBEE'}
                          color={parseFloat(margen) >= 20 ? '#1B5E20' : parseFloat(margen) >= 10 ? '#E65100' : '#C62828'}
                        >
                          {margen}%
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--texto-suave)', padding: '40px 0', fontSize: '0.85rem' }}>
            Sin ventas en este período
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .dashboard-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}