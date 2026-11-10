/* Reporte de ventas (pantalla Reportes) para imprimir en hoja tamaño carta */
import { imprimirHtml } from './reporteCierre';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const n = (v) => Number(v || 0);
const cop = (v) => `COP$ ${n(v).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`;
const usd = (v) => `$ ${n(v).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const SIMBOLO = { COP: 'COP$', USD: '$', BS: 'Bs.' };
const enMoneda = (m, v) => `${SIMBOLO[m] || ''} ${n(v).toLocaleString('es-CO', { minimumFractionDigits: m === 'COP' ? 0 : 2, maximumFractionDigits: 2 })}`;
const NOMBRE_MONEDA = { COP: 'Pesos (COP)', USD: 'Dólares (USD)', BS: 'Bolívares (BS)' };
const fecha = (ymd) => (ymd ? new Date(`${String(ymd).slice(0, 10)}T12:00:00`).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—');
const fechaLarga = (ymd) => new Date(`${String(ymd).slice(0, 10)}T12:00:00`).toLocaleDateString('es-VE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });

export const htmlReporteVentas = ({ periodo, resumen, ventasPorDia = [], inventario = [] }) => {
  const r = resumen?.resumen || {};
  const porMoneda = resumen?.por_moneda || [];
  const porTipo = resumen?.por_tipo_pago || [];
  const productos = resumen?.productos_mas_vendidos || [];
  const margen = n(r.total_ingresos_cop) > 0 ? ((n(r.total_ganancias_cop) / n(r.total_ingresos_cop)) * 100).toFixed(1) : '0.0';
  const dias = [...ventasPorDia].sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
  const tot = dias.reduce((t, d) => ({ v: t.v + n(d.total_ventas), c: t.c + n(d.total_cop), u: t.u + n(d.total_usd), g: t.g + n(d.ganancia_cop) }), { v: 0, c: 0, u: 0, g: 0 });

  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>Reporte de ventas ${esc(periodo.fecha_inicio)} a ${esc(periodo.fecha_fin)}</title>
<style>
  @page { size: letter; margin: 14mm 13mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #111; margin: 0; }
  h1 { font-size: 17pt; margin: 0; color: #1B5E20; }
  h2 { font-size: 11.5pt; margin: 16px 0 6px; padding-bottom: 3px; border-bottom: 2px solid #1B5E20; color: #1B5E20; page-break-after: avoid; }
  .cab { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #F57F17; padding-bottom: 8px; }
  .cab .sub { font-size: 12.5pt; font-weight: bold; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 12px; }
  .kpi { border: 1px solid #DDD; border-radius: 6px; padding: 7px 9px; }
  .kpi b { display: block; font-size: 7.5pt; color: #555; text-transform: uppercase; font-weight: normal; }
  .kpi span { font-size: 12pt; font-weight: bold; }
  .kpi small { display: block; color: #666; font-size: 8pt; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 8pt; text-transform: uppercase; color: #444; background: #F3F3F3; padding: 5px 7px; border-bottom: 1px solid #999; }
  td { padding: 4px 7px; border-bottom: 1px solid #E2E2E2; }
  .num, th.num { text-align: right; white-space: nowrap; }
  tr.total td { background: #FFF8E7; font-weight: bold; border-top: 2px solid #999; }
  .bajo { color: #C62828; font-weight: bold; }
  .dos { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  thead { display: table-header-group; } tr { page-break-inside: avoid; }
  .vacio { color: #777; font-style: italic; padding: 6px 0; }
  .pie { margin-top: 14px; font-size: 8pt; color: #777; text-align: right; }
</style></head><body>
  <div class="cab">
    <div><h1>Maracu Mango</h1><div class="sub">Reporte de ventas</div>
      <div style="font-size:10pt;margin-top:2px">Del <strong>${fecha(periodo.fecha_inicio)}</strong> al <strong>${fecha(periodo.fecha_fin)}</strong></div></div>
    <div style="text-align:right;font-size:9pt;color:#555">Impreso: ${new Date().toLocaleString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</div>
  </div>

  <div class="kpis">
    <div class="kpi"><b>Ventas</b><span>${n(r.total_ventas)}</span><small>Ticket prom. ${cop(r.ticket_promedio_cop)}</small></div>
    <div class="kpi"><b>Ingresos</b><span>${cop(r.total_ingresos_cop)}</span><small>${usd(r.total_ingresos_usd)}</small></div>
    <div class="kpi"><b>Ganancias</b><span>${cop(r.total_ganancias_cop)}</span><small>${usd(r.total_ganancias_usd)}</small></div>
    <div class="kpi"><b>Margen</b><span>${margen}%</span><small>sobre ingresos</small></div>
  </div>

  <h2>Ventas por día</h2>
  ${dias.length ? `<table><thead><tr><th>Día</th><th class="num">Ventas</th><th class="num">Ingresos COP</th><th class="num">Ingresos USD</th><th class="num">Ganancia COP</th></tr></thead><tbody>
    ${dias.map(d => `<tr><td>${fechaLarga(d.fecha)}</td><td class="num">${n(d.total_ventas)}</td><td class="num">${cop(d.total_cop)}</td><td class="num">${usd(d.total_usd)}</td><td class="num">${cop(d.ganancia_cop)}</td></tr>`).join('')}
    <tr class="total"><td>Total (${dias.length} ${dias.length === 1 ? 'día' : 'días'})</td><td class="num">${tot.v}</td><td class="num">${cop(tot.c)}</td><td class="num">${usd(tot.u)}</td><td class="num">${cop(tot.g)}</td></tr>
  </tbody></table>` : '<div class="vacio">Sin ventas en el período</div>'}

  <div class="dos">
    <div>
      <h2>Por moneda de pago</h2>
      ${porMoneda.length ? `<table><thead><tr><th>Moneda</th><th class="num">Pagos</th><th class="num">Cobrado</th><th class="num">Equiv. COP</th></tr></thead><tbody>
        ${porMoneda.map(m => `<tr><td>${NOMBRE_MONEDA[m.moneda_pago] || esc(m.moneda_pago)}</td><td class="num">${n(m.cantidad)}</td><td class="num">${enMoneda(m.moneda_pago, m.total_pagado)}</td><td class="num">${cop(m.total_cop)}</td></tr>`).join('')}
      </tbody></table>` : '<div class="vacio">Sin datos</div>'}
    </div>
    <div>
      <h2>Por forma de pago</h2>
      ${porTipo.length ? `<table><thead><tr><th>Forma</th><th class="num">Pagos</th><th class="num">Equiv. COP</th><th class="num">Equiv. USD</th></tr></thead><tbody>
        ${porTipo.map(t => `<tr><td style="text-transform:capitalize">${esc(t.tipo_pago)}</td><td class="num">${n(t.cantidad)}</td><td class="num">${cop(t.total_cop)}</td><td class="num">${usd(t.total_usd)}</td></tr>`).join('')}
      </tbody></table>` : '<div class="vacio">Sin datos</div>'}
    </div>
  </div>

  <h2>Los 10 productos más vendidos</h2>
  ${productos.length ? `<table><thead><tr><th style="width:32px">#</th><th>Producto</th><th class="num">Unidades</th><th class="num">Ingresos COP</th><th class="num">Ganancia COP</th></tr></thead><tbody>
    ${productos.map((p, i) => `<tr><td>${i + 1}</td><td>${esc(p.nombre)}</td><td class="num">${n(p.unidades_vendidas)}</td><td class="num">${cop(p.total_cop)}</td><td class="num">${cop(p.ganancia_cop)}</td></tr>`).join('')}
  </tbody></table>` : '<div class="vacio">Sin productos vendidos</div>'}

  ${inventario.length ? `<h2>Estado del inventario</h2>
  <table><thead><tr><th>Insumo</th><th>Categoría</th><th class="num">Cantidad</th><th>Unidad</th><th class="num">Costo unit.</th><th>Proveedor</th></tr></thead><tbody>
    ${inventario.map(i => `<tr><td>${esc(i.nombre)}</td><td>${esc(i.categoria || '—')}</td>
      <td class="num ${n(i.cantidad) <= 5 ? 'bajo' : ''}">${n(i.cantidad).toLocaleString('es-CO', { maximumFractionDigits: 2 })}${n(i.cantidad) <= 5 ? ' (bajo)' : ''}</td>
      <td>${esc(i.unidad_medida || '—')}</td><td class="num">COP$ ${n(i.costo_unitario).toLocaleString('es-CO', { maximumFractionDigits: 2 })}</td><td>${esc(i.proveedor || '—')}</td></tr>`).join('')}
  </tbody></table>` : ''}

  <div class="pie">Maracu Mango · Reporte del ${fecha(periodo.fecha_inicio)} al ${fecha(periodo.fecha_fin)}</div>
</body></html>`;
};

export const imprimirReporteVentas = (datos) => imprimirHtml(htmlReporteVentas(datos));
