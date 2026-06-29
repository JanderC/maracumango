import { useState, useEffect } from 'react';
import API from '../api/axios';
import {
  RiMoneyDollarCircleLine, RiShoppingCartLine,
  RiTrophyLine, RiArrowUpLine, RiArrowDownLine,
  RiRefreshLine, RiBarChartLine
} from 'react-icons/ri';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

const StatCard = ({ icon, label, valor, sub, color, tendencia }) => (
  <div className="card-mm" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.3rem', color
      }}>
        {icon}
      </div>
      {tendencia !== undefined && (
        <span style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: '0.75rem', fontWeight: 600,
          color: tendencia >= 0 ? '#2E7D32' : '#C62828',
          background: tendencia >= 0 ? '#E8F5E9' : '#FFEBEE',
          padding: '3px 8px', borderRadius: 20
        }}>
          {tendencia >= 0 ? <RiArrowUpLine /> : <RiArrowDownLine />}
          {Math.abs(tendencia)}%
        </span>
      )}
    </div>
    <div>
      <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--texto)', lineHeight: 1.2 }}>
        {valor}
      </div>
      <div style={{ fontSize: '0.82rem', color: 'var(--texto-suave)', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.75rem', color, fontWeight: 600, marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
);

export default function Dashboard() {
  const [resumen, setResumen] = useState(null);
  const [ventasDia, setVentasDia] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [periodo, setPeriodo] = useState('mes');

  const obtenerFechas = () => {
    const hoy = new Date();
    const fin = hoy.toISOString().split('T')[0];
    let inicio;
    if (periodo === 'hoy') {
      inicio = fin;
    } else if (periodo === 'semana') {
      const d = new Date(hoy);
      d.setDate(d.getDate() - 7);
      inicio = d.toISOString().split('T')[0];
    } else {
      const d = new Date(hoy);
      d.setDate(1);
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

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--texto)', marginBottom: 2 }}>
            Dashboard 📊
          </h1>
          <p style={{ color: 'var(--texto-suave)', fontSize: '0.85rem' }}>
            Resumen general del negocio
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {['hoy', 'semana', 'mes'].map(p => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              style={{
                padding: '7px 16px',
                borderRadius: 10,
                border: 'none',
                background: periodo === p ? 'var(--verde)' : '#fff',
                color: periodo === p ? '#fff' : 'var(--texto-suave)',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'capitalize'
              }}
            >
              {p === 'hoy' ? 'Hoy' : p === 'semana' ? 'Semana' : 'Mes'}
            </button>
          ))}
          <button
            onClick={cargarDatos}
            style={{
              padding: '7px 12px', borderRadius: 10,
              border: '1px solid #E0E0E0',
              background: '#fff', color: 'var(--verde)',
              cursor: 'pointer', fontSize: '1rem'
            }}
          >
            <RiRefreshLine />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard
          icon={<RiShoppingCartLine />}
          label="Total de ventas"
          valor={r.total_ventas || 0}
          color="#1B5E20"
        />
        <StatCard
          icon={<RiMoneyDollarCircleLine />}
          label="Ingresos totales"
          valor={`$${parseFloat(r.total_ingresos_usd || 0).toFixed(2)}`}
          sub="en USD"
          color="#F57F17"
        />
        <StatCard
          icon={<RiTrophyLine />}
          label="Ganancias netas"
          valor={`$${parseFloat(r.total_ganancias_usd || 0).toFixed(2)}`}
          sub="en USD"
          color="#1565C0"
        />
        <StatCard
          icon={<RiBarChartLine />}
          label="Margen promedio"
          valor={r.total_ingresos_usd > 0
            ? `${((r.total_ganancias_usd / r.total_ingresos_usd) * 100).toFixed(1)}%`
            : '0%'}
          sub="ganancia / ingreso"
          color="#6A1B9A"
        />
      </div>

      {/* Gráfica + Por moneda */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, marginBottom: 24 }} className="dashboard-grid">
        {/* Gráfica ventas por día */}
        <div className="card-mm">
          <h6 style={{ fontWeight: 700, marginBottom: 20, color: 'var(--texto)' }}>
            Ventas por día (USD)
          </h6>
          {ventasDia.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ventasDia} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis
                  dataKey="fecha"
                  tick={{ fontSize: 11, fontFamily: 'Poppins' }}
                  tickFormatter={v => v.slice(5)}
                />
                <YAxis tick={{ fontSize: 11, fontFamily: 'Poppins' }} />
                <Tooltip
                  formatter={(v) => [`$${parseFloat(v).toFixed(2)}`, 'Total']}
                  labelFormatter={l => `Fecha: ${l}`}
                  contentStyle={{ borderRadius: 10, fontFamily: 'Poppins', fontSize: 12 }}
                />
                <Bar dataKey="total_usd" fill="var(--verde)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--texto-suave)', fontSize: '0.85rem' }}>
              Sin ventas en este período
            </div>
          )}
        </div>

        {/* Por moneda */}
        <div className="card-mm">
          <h6 style={{ fontWeight: 700, marginBottom: 20, color: 'var(--texto)' }}>
            Ventas por moneda
          </h6>
          {porMoneda.length > 0 ? porMoneda.map(m => (
            <div key={m.moneda_pago} style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: 12,
              marginBottom: 10,
              background: m.moneda_pago === 'USD' ? '#E8F5E9'
                : m.moneda_pago === 'BS' ? '#E3F2FD' : '#FFF3E0'
            }}>
              <div>
                <div style={{
                  fontWeight: 700, fontSize: '0.85rem',
                  color: m.moneda_pago === 'USD' ? '#1B5E20'
                    : m.moneda_pago === 'BS' ? '#1565C0' : '#E65100'
                }}>
                  {m.moneda_pago === 'USD' ? '💵 Dólar'
                    : m.moneda_pago === 'BS' ? '🇻🇪 Bolívar' : '🇨🇴 Peso'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--texto-suave)', marginTop: 2 }}>
                  {m.cantidad} ventas
                </div>
              </div>
              <div style={{
                fontWeight: 700, fontSize: '0.92rem',
                color: m.moneda_pago === 'USD' ? '#1B5E20'
                  : m.moneda_pago === 'BS' ? '#1565C0' : '#E65100'
              }}>
                {parseFloat(m.total).toLocaleString()}
              </div>
            </div>
          )) : (
            <div style={{ color: 'var(--texto-suave)', fontSize: '0.85rem', textAlign: 'center', marginTop: 60 }}>
              Sin datos
            </div>
          )}
        </div>
      </div>

      {/* Productos más vendidos */}
      <div className="card-mm">
        <h6 style={{ fontWeight: 700, marginBottom: 20, color: 'var(--texto)' }}>
          🏆 Productos más vendidos
        </h6>
        {masVendidos.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #F0F0F0' }}>
                  {['#', 'Producto', 'Unidades', 'Total USD', 'Ganancia USD'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--texto-suave)', fontWeight: 600, fontSize: '0.78rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {masVendidos.map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F9F9F9' }}>
                    <td style={{ padding: '12px', fontWeight: 700, color: 'var(--naranja)' }}>#{i + 1}</td>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{p.nombre}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ background: '#E8F5E9', color: '#1B5E20', borderRadius: 20, padding: '3px 10px', fontWeight: 600, fontSize: '0.78rem' }}>
                        {p.unidades_vendidas}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 600 }}>${parseFloat(p.total_usd).toFixed(2)}</td>
                    <td style={{ padding: '12px', color: '#2E7D32', fontWeight: 600 }}>${parseFloat(p.ganancia_usd).toFixed(2)}</td>
                  </tr>
                ))}
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