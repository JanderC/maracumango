import { useState, useEffect } from 'react';
import API from '../api/axios';
import { toast } from 'react-toastify';
import {
  RiFileExcel2Line, RiFilePdfLine, RiRefreshLine,
  RiMoneyDollarCircleLine, RiShoppingCartLine,
  RiTrophyLine, RiBarChartLine, RiArchiveLine
} from 'react-icons/ri';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const COLORES_MONEDA = { USD: '#1B5E20', BS: '#1565C0', COP: '#E65100' };
const COLORES_PIE = ['#1B5E20', '#F57F17', '#1565C0', '#6A1B9A', '#C62828'];

const StatCard = ({ icon, label, valor, sub, color }) => (
  <div className="card-mm">
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.3rem', color
      }}>{icon}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--texto-suave)', fontWeight: 600 }}>{label}</div>
    </div>
    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--texto)' }}>{valor}</div>
    {sub && <div style={{ fontSize: '0.75rem', color, fontWeight: 600, marginTop: 4 }}>{sub}</div>}
  </div>
);

export default function Reportes() {
  const [resumen, setResumen] = useState(null);
  const [ventasDia, setVentasDia] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [exportando, setExportando] = useState('');
  const [filtros, setFiltros] = useState({
    fecha_inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    fecha_fin: new Date().toISOString().split('T')[0]
  });

  const cargar = async () => {
    setCargando(true);
    try {
      const params = `fecha_inicio=${filtros.fecha_inicio}&fecha_fin=${filtros.fecha_fin}`;
      const [r1, r2, r3] = await Promise.all([
        API.get(`/reportes/resumen?${params}`),
        API.get(`/reportes/ventas-por-dia?${params}`),
        API.get('/reportes/inventario')
      ]);
      setResumen(r1.data);
      setVentasDia(r2.data.ventas_por_dia.slice(0, 30).reverse());
      setInventario(r3.data.inventario);
    } catch { toast.error('Error cargando reportes'); }
    finally { setCargando(false); }
  };

useEffect(() => { cargar(); }, []);

  const exportar = async (tipo) => {
    setExportando(tipo);
    try {
      const params = `fecha_inicio=${filtros.fecha_inicio}&fecha_fin=${filtros.fecha_fin}`;
      const resp = await API.get(`/reportes/exportar/${tipo}?${params}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `ventas_maracumango_${filtros.fecha_inicio}_${filtros.fecha_fin}.${tipo === 'excel' ? 'xlsx' : 'pdf'}`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`Exportado como ${tipo.toUpperCase()} exitosamente`);
    } catch { toast.error(`Error exportando ${tipo}`); }
    finally { setExportando(''); }
  };

  const r = resumen?.resumen || {};
  const porMoneda = resumen?.por_moneda || [];
  const porTipoPago = resumen?.por_tipo_pago || [];
  const masVendidos = resumen?.productos_mas_vendidos || [];

  const margen = r.total_ingresos_usd > 0
    ? ((r.total_ganancias_usd / r.total_ingresos_usd) * 100).toFixed(1)
    : '0';

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 2 }}>Reportes 📈</h1>
          <p style={{ color: 'var(--texto-suave)', fontSize: '0.85rem' }}>Análisis de ventas, ganancias e inventario</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => exportar('excel')}
            disabled={exportando === 'excel'}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 18px', borderRadius: 12, border: 'none',
              background: '#E8F5E9', color: '#1B5E20',
              fontFamily: 'Poppins', fontWeight: 600, fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            {exportando === 'excel'
              ? <span className="spinner-border spinner-border-sm" />
              : <RiFileExcel2Line />}
            Excel
          </button>
          <button
            onClick={() => exportar('pdf')}
            disabled={exportando === 'pdf'}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 18px', borderRadius: 12, border: 'none',
              background: '#FFEBEE', color: '#C62828',
              fontFamily: 'Poppins', fontWeight: 600, fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            {exportando === 'pdf'
              ? <span className="spinner-border spinner-border-sm" />
              : <RiFilePdfLine />}
            PDF
          </button>
        </div>
      </div>

      {/* Filtros fecha */}
      <div className="card-mm" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--texto-suave)', marginBottom: 6, display: 'block' }}>DESDE</label>
            <input className="input-mm" type="date" value={filtros.fecha_inicio}
              onChange={e => setFiltros({ ...filtros, fecha_inicio: e.target.value })} style={{ minWidth: 160 }} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--texto-suave)', marginBottom: 6, display: 'block' }}>HASTA</label>
            <input className="input-mm" type="date" value={filtros.fecha_fin}
              onChange={e => setFiltros({ ...filtros, fecha_fin: e.target.value })} style={{ minWidth: 160 }} />
          </div>
          <button className="btn-verde" onClick={cargar} disabled={cargando}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px' }}>
            {cargando
              ? <span className="spinner-border spinner-border-sm" />
              : <RiRefreshLine />}
            Generar
          </button>

          {/* Accesos rápidos */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { label: 'Hoy', fn: () => { const h = new Date().toISOString().split('T')[0]; setFiltros({ fecha_inicio: h, fecha_fin: h }); } },
              {
                label: 'Semana', fn: () => {
                  const h = new Date(); const i = new Date(h); i.setDate(i.getDate() - 7);
                  setFiltros({ fecha_inicio: i.toISOString().split('T')[0], fecha_fin: h.toISOString().split('T')[0] });
                }
              },
              {
                label: 'Mes', fn: () => {
                  const h = new Date();
                  const i = new Date(h.getFullYear(), h.getMonth(), 1);
                  setFiltros({ fecha_inicio: i.toISOString().split('T')[0], fecha_fin: h.toISOString().split('T')[0] });
                }
              }
            ].map(btn => (
              <button key={btn.label} onClick={btn.fn} style={{
                padding: '8px 14px', borderRadius: 10, border: '1px solid #E0E0E0',
                background: '#fff', color: 'var(--texto-suave)',
                fontFamily: 'Poppins', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer'
              }}>{btn.label}</button>
            ))}
          </div>
        </div>
      </div>

      {cargando ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <div className="spinner-border" style={{ color: 'var(--verde)', width: 40, height: 40 }} />
          <div style={{ marginTop: 16, color: 'var(--texto-suave)', fontSize: '0.85rem' }}>Generando reporte...</div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
            <StatCard icon={<RiShoppingCartLine />} label="Total ventas" valor={r.total_ventas || 0} color="#1B5E20" />
            <StatCard icon={<RiMoneyDollarCircleLine />} label="Ingresos USD" valor={`$${parseFloat(r.total_ingresos_usd || 0).toFixed(2)}`} sub="ingresos brutos" color="#F57F17" />
            <StatCard icon={<RiTrophyLine />} label="Ganancias USD" valor={`$${parseFloat(r.total_ganancias_usd || 0).toFixed(2)}`} sub="ganancia neta" color="#1565C0" />
            <StatCard icon={<RiBarChartLine />} label="Margen de ganancia" valor={`${margen}%`} sub="sobre ingresos" color="#6A1B9A" />
          </div>

          {/* Gráfica ventas por día + Pie moneda */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, marginBottom: 24 }} className="rep-grid-1">
            <div className="card-mm">
              <h6 style={{ fontWeight: 700, marginBottom: 20 }}>Ingresos por día (USD)</h6>
              {ventasDia.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={ventasDia} barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 10, fontFamily: 'Poppins' }} tickFormatter={v => v.slice(5)} />
                    <YAxis tick={{ fontSize: 10, fontFamily: 'Poppins' }} />
                    <Tooltip
                      formatter={(v, n) => [`$${parseFloat(v).toFixed(2)}`, n === 'total_usd' ? 'Ingresos' : 'Ganancia']}
                      labelFormatter={l => `Fecha: ${l}`}
                      contentStyle={{ borderRadius: 10, fontFamily: 'Poppins', fontSize: 12 }}
                    />
                    <Bar dataKey="total_usd" fill="var(--verde)" radius={[4, 4, 0, 0]} name="Ingresos" />
                    <Bar dataKey="ganancia_usd" fill="var(--naranja)" radius={[4, 4, 0, 0]} name="Ganancia" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--texto-suave)', fontSize: '0.85rem' }}>
                  Sin ventas en el período seleccionado
                </div>
              )}
            </div>

            <div className="card-mm">
              <h6 style={{ fontWeight: 700, marginBottom: 20 }}>Ventas por moneda</h6>
              {porMoneda.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={porMoneda} dataKey="cantidad" nameKey="moneda_pago" cx="50%" cy="50%" outerRadius={65} label={({ moneda_pago, percent }) => `${moneda_pago} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                        {porMoneda.map((entry, i) => (
                          <Cell key={i} fill={COLORES_MONEDA[entry.moneda_pago] || COLORES_PIE[i]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v, n) => [v, 'Ventas']} contentStyle={{ borderRadius: 10, fontFamily: 'Poppins', fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ marginTop: 10 }}>
                    {porMoneda.map(m => (
                      <div key={m.moneda_pago} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 8, marginBottom: 4, background: 'var(--crema)' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: COLORES_MONEDA[m.moneda_pago] }}>
                          {m.moneda_pago === 'USD' ? '💵' : m.moneda_pago === 'BS' ? '🇻🇪' : '🇨🇴'} {m.moneda_pago}
                        </span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>{m.cantidad} ventas</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--texto-suave)', fontSize: '0.85rem', marginTop: 60 }}>Sin datos</div>
              )}
            </div>
          </div>

          {/* Tipo de pago + Productos más vendidos */}
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, marginBottom: 24 }} className="rep-grid-2">
            <div className="card-mm">
              <h6 style={{ fontWeight: 700, marginBottom: 20 }}>Tipo de pago</h6>
              {porTipoPago.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={porTipoPago} dataKey="cantidad" nameKey="tipo_pago" cx="50%" cy="50%" outerRadius={65} label={({ tipo_pago, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                        {porTipoPago.map((entry, i) => (
                          <Cell key={i} fill={COLORES_PIE[i]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 10, fontFamily: 'Poppins', fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ marginTop: 10 }}>
                    {porTipoPago.map((t, i) => (
                      <div key={t.tipo_pago} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 10, marginBottom: 6, background: 'var(--crema)' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: COLORES_PIE[i], textTransform: 'capitalize' }}>
                          {t.tipo_pago === 'efectivo' ? '💵' : '🏦'} {t.tipo_pago}
                        </span>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>{t.cantidad} ventas</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--texto-suave)' }}>${parseFloat(t.total_usd).toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--texto-suave)', fontSize: '0.85rem', marginTop: 60 }}>Sin datos</div>
              )}
            </div>

            <div className="card-mm">
              <h6 style={{ fontWeight: 700, marginBottom: 20 }}>🏆 Productos más vendidos</h6>
              {masVendidos.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={masVendidos.slice(0, 5)} layout="vertical" barSize={16}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10, fontFamily: 'Poppins' }} />
                      <YAxis type="category" dataKey="nombre" tick={{ fontSize: 10, fontFamily: 'Poppins' }} width={120} />
                      <Tooltip
                        formatter={(v, n) => [n === 'unidades_vendidas' ? `${v} uds` : `$${parseFloat(v).toFixed(2)}`, n === 'unidades_vendidas' ? 'Unidades' : 'Ganancia']}
                        contentStyle={{ borderRadius: 10, fontFamily: 'Poppins', fontSize: 12 }}
                      />
                      <Bar dataKey="unidades_vendidas" fill="var(--verde)" radius={[0, 4, 4, 0]} name="Unidades" />
                      <Bar dataKey="ganancia_usd" fill="var(--naranja)" radius={[0, 4, 4, 0]} name="Ganancia" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{ overflowX: 'auto', marginTop: 16 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #F0F0F0' }}>
                          {['#', 'Producto', 'Unidades', 'Ingresos', 'Ganancia'].map(h => (
                            <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--texto-suave)', fontWeight: 600, fontSize: '0.76rem' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {masVendidos.map((p, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #F9F9F9' }}>
                            <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--naranja)' }}>#{i + 1}</td>
                            <td style={{ padding: '8px 10px', fontWeight: 600 }}>{p.nombre}</td>
                            <td style={{ padding: '8px 10px' }}>
                              <span style={{ background: '#E8F5E9', color: '#1B5E20', borderRadius: 20, padding: '2px 8px', fontWeight: 600, fontSize: '0.75rem' }}>
                                {p.unidades_vendidas}
                              </span>
                            </td>
                            <td style={{ padding: '8px 10px', fontWeight: 600 }}>${parseFloat(p.total_usd).toFixed(2)}</td>
                            <td style={{ padding: '8px 10px', color: '#2E7D32', fontWeight: 700 }}>${parseFloat(p.ganancia_usd).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--texto-suave)', padding: '40px 0', fontSize: '0.85rem' }}>
                  Sin ventas en este período
                </div>
              )}
            </div>
          </div>

          {/* Inventario */}
          <div className="card-mm">
            <h6 style={{ fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <RiArchiveLine /> Estado del inventario
            </h6>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'var(--crema)', borderBottom: '2px solid #F0F0F0' }}>
                    {['Producto', 'Categoría', 'Cantidad', 'Unidad', 'Costo total', 'Costo unit.', 'Proveedor', 'Productos asociados'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, fontSize: '0.76rem', color: 'var(--texto-suave)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {inventario.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--texto-suave)' }}>Sin inventario registrado</td>
                    </tr>
                  ) : inventario.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #F9F9F9' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>{item.nombre}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ background: '#E8F5E9', color: '#1B5E20', borderRadius: 20, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 600 }}>
                          {item.categoria || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontWeight: 700, color: item.cantidad <= 5 ? '#C62828' : item.cantidad <= 15 ? '#E65100' : '#1B5E20' }}>
                          {item.cantidad}
                        </span>
                        {item.cantidad <= 5 && (
                          <span style={{ marginLeft: 6, background: '#FFEBEE', color: '#C62828', borderRadius: 20, padding: '1px 7px', fontSize: '0.7rem', fontWeight: 700 }}>
                            ⚠️ Bajo
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--texto-suave)' }}>{item.unidad_medida || '—'}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>${parseFloat(item.costo_total).toFixed(2)}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--naranja)', fontWeight: 600 }}>${parseFloat(item.costo_unitario || 0).toFixed(2)}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--texto-suave)' }}>{item.proveedor || '—'}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ background: '#E3F2FD', color: '#1565C0', borderRadius: 20, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 600 }}>
                          {item.productos_asociados} productos
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <style>{`
        @media (max-width: 900px) {
          .rep-grid-1, .rep-grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}