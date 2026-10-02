/* Reporte de cierre de caja para impresora normal (hoja tamaño carta).
   Arma un documento HTML y lo manda al diálogo de impresión del navegador
   desde un iframe oculto (no abre ventanas nuevas). */
const MONEDAS = ['COP', 'USD', 'BS'];
const NOMBRE = { COP: 'Pesos (COP)', USD: 'Dólares (USD)', BS: 'Bolívares (BS)' };
const SIMBOLO = { COP: 'COP$', USD: '$', BS: 'Bs.' };

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const monto = (m, v) => {
  const n = Number(v || 0);
  const dec = m === 'COP' && Number.isInteger(n) ? 0 : 2;
  return `${SIMBOLO[m]} ${n.toLocaleString('es-CO', { minimumFractionDigits: dec, maximumFractionDigits: 2 })}`;
};
const fechaHora = (iso) => iso
  ? new Date(iso).toLocaleString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
  : '—';
const hora = (iso) => new Date(iso).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true });
const formaPago = (t) => (t === 'efectivo' ? 'Efectivo' : 'Transferencia');

const diferencia = (m, d) => {
  if (d.contado === null || d.contado === undefined) return '—';
  const dif = Number(d.diferencia || 0);
  if (Math.abs(dif) < 0.005) return '<span class="ok">Cuadrada</span>';
  return dif > 0 ? `<span class="sobra">Sobra ${monto(m, dif)}</span>` : `<span class="falta">Falta ${monto(m, -dif)}</span>`;
};

export const htmlReporteCierre = (sesion) => {
  const v = sesion.ventas || {};
  const cerrada = sesion.estado === 'cerrada';

  const filasMoneda = [
    ['Fondo de apertura', (m, d) => monto(m, d.apertura)],
    ['+ Ventas en efectivo', (m, d) => `${monto(m, d.ventas_efectivo)} <small>(${d.cantidad_efectivo})</small>`],
    ['+ Ingresos', (m, d) => monto(m, d.ingresos)],
    ['− Egresos', (m, d) => monto(m, d.egresos)],
    ['= Efectivo esperado', (m, d) => `<strong>${monto(m, d.esperado)}</strong>`, 'total'],
    ['Efectivo contado', (m, d) => (d.contado === null || d.contado === undefined ? '—' : monto(m, d.contado))],
    ['Diferencia', (m, d) => diferencia(m, d), 'total'],
    ['Transferencias (no entran al cajón)', (m, d) => `${monto(m, d.transferencias)} <small>(${d.cantidad_transferencias})</small>`]
  ].map(([label, celda, clase]) =>
    `<tr class="${clase || ''}"><td>${label}</td>${MONEDAS.map(m => `<td class="num">${celda(m, sesion.monedas[m])}</td>`).join('')}</tr>`
  ).join('');

  const movimientos = (sesion.movimientos || []).slice().reverse();
  const filasMov = movimientos.map(mv => `
    <tr><td>${hora(mv.creado_en)}</td><td>${mv.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}</td>
        <td>${esc(mv.descripcion)}</td><td>${esc(mv.usuario || '')}</td>
        <td class="num ${mv.tipo === 'ingreso' ? 'ok' : 'falta'}">${mv.tipo === 'ingreso' ? '+' : '−'} ${monto(mv.moneda, mv.monto)}</td></tr>`).join('');

  // Una venta con pago dividido ocupa dos renglones (uno por pago)
  const filasVentas = (sesion.lista_ventas || []).map(x => {
    const pagos = [{ m: x.moneda_pago, t: x.tipo_pago, x: x.total_pagado }, ...(x.moneda_pago_2 ? [{ m: x.moneda_pago_2, t: x.tipo_pago_2, x: x.total_pagado_2 }] : [])];
    return pagos.map((p, i) => `
      <tr class="${x.anulada ? 'anulada' : ''}">
        <td>${i === 0 ? `#${x.id}` : ''}</td><td>${i === 0 ? hora(x.creado_en) : ''}</td>
        <td>${p.m}</td><td>${formaPago(p.t)}${pagos.length > 1 ? ` <small>(pago ${i + 1})</small>` : ''}${x.anulada && i === 0 ? ' <small>ANULADA</small>' : ''}</td>
        <td class="num">${monto(p.m, p.x)}</td></tr>`).join('');
  }).join('');

  const filasProductos = (sesion.productos_vendidos || []).map(p =>
    `<tr><td class="num">${p.cantidad}</td><td>${esc(p.nombre)}</td><td class="num">${monto('COP', p.total_cop)}</td></tr>`).join('');

  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>${cerrada ? 'Cierre' : 'Corte parcial'} de caja #${sesion.id}</title>
<style>
  @page { size: letter; margin: 14mm 13mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10.5pt; color: #111; margin: 0; }
  h1 { font-size: 17pt; margin: 0; color: #1B5E20; }
  h2 { font-size: 11.5pt; margin: 16px 0 6px; padding-bottom: 3px; border-bottom: 2px solid #1B5E20; color: #1B5E20; }
  .cab { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #F57F17; padding-bottom: 8px; }
  .cab .sub { font-size: 12.5pt; font-weight: bold; }
  .datos { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px 14px; margin-top: 10px; font-size: 9.5pt; }
  .datos b { display: block; font-size: 8pt; color: #555; text-transform: uppercase; font-weight: normal; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 8.5pt; text-transform: uppercase; color: #444; background: #F3F3F3; padding: 5px 7px; border-bottom: 1px solid #999; }
  td { padding: 4px 7px; border-bottom: 1px solid #E2E2E2; vertical-align: top; }
  .num, th.num { text-align: right; white-space: nowrap; }
  tr.total td { background: #FFF8E7; font-weight: bold; }
  tr.anulada td { color: #999; text-decoration: line-through; }
  tr.anulada small { text-decoration: none; display: inline-block; }
  small { color: #666; font-size: 8pt; }
  .ok { color: #1B5E20; font-weight: bold; } .falta { color: #C62828; font-weight: bold; } .sobra { color: #1565C0; font-weight: bold; }
  thead { display: table-header-group; } tr { page-break-inside: avoid; }
  .notas { border: 1px solid #CCC; border-radius: 4px; padding: 7px 9px; margin-top: 6px; }
  .firmas { display: flex; gap: 40px; margin-top: 46px; page-break-inside: avoid; }
  .firmas div { flex: 1; border-top: 1px solid #111; padding-top: 4px; text-align: center; font-size: 9.5pt; }
  .pie { margin-top: 14px; font-size: 8pt; color: #777; text-align: right; }
</style></head><body>
  <div class="cab">
    <div><h1>Maracu Mango</h1><div class="sub">${cerrada ? 'Cierre de caja' : 'Corte parcial de caja'} #${sesion.id}</div></div>
    <div style="text-align:right;font-size:9pt;color:#555">Impreso: ${fechaHora(new Date().toISOString())}</div>
  </div>
  <div class="datos">
    <div><b>Apertura</b>${fechaHora(sesion.abierta_en)}<br>${esc(sesion.abierta_por || '—')}</div>
    <div><b>Cierre</b>${cerrada ? `${fechaHora(sesion.cerrada_en)}<br>${esc(sesion.cerrada_por || '—')}` : 'Caja aún abierta'}</div>
    <div><b>Ventas</b>${v.cantidad ?? 0} válidas${v.anuladas ? `<br>${v.anuladas} anuladas` : ''}</div>
    <div><b>Total vendido (equivalente)</b>${monto('COP', v.total_cop)}<br>${monto('USD', v.total_usd)}</div>
  </div>

  <h2>Resumen por moneda</h2>
  <table><thead><tr><th>Concepto</th>${MONEDAS.map(m => `<th class="num">${NOMBRE[m]}</th>`).join('')}</tr></thead><tbody>${filasMoneda}</tbody></table>

  ${movimientos.length ? `<h2>Ingresos y egresos (${movimientos.length})</h2>
  <table><thead><tr><th>Hora</th><th>Tipo</th><th>Descripción</th><th>Registró</th><th class="num">Monto</th></tr></thead><tbody>${filasMov}</tbody></table>` : ''}

  ${sesion.notas_apertura || sesion.notas_cierre ? `<h2>Notas</h2><div class="notas">
    ${sesion.notas_apertura ? `<div><strong>Apertura:</strong> ${esc(sesion.notas_apertura)}</div>` : ''}
    ${sesion.notas_cierre ? `<div><strong>Cierre:</strong> ${esc(sesion.notas_cierre)}</div>` : ''}</div>` : ''}

  ${sesion.lista_ventas ? `<h2>Ventas (${sesion.lista_ventas.length})</h2>
  <table><thead><tr><th>Pedido</th><th>Hora</th><th>Moneda</th><th>Forma de pago</th><th class="num">Total</th></tr></thead><tbody>${filasVentas}</tbody></table>` : ''}

  ${filasProductos ? `<h2>Productos vendidos</h2>
  <table><thead><tr><th class="num" style="width:70px">Cant.</th><th>Producto</th><th class="num">Total</th></tr></thead><tbody>${filasProductos}</tbody></table>` : ''}

  <div class="firmas"><div>Firma cajero</div><div>Firma administrador</div></div>
  <div class="pie">Maracu Mango · Caja #${sesion.id}</div>
</body></html>`;
};

// Abre el diálogo de impresión del navegador con el reporte en hoja carta
export const imprimirCierreCarta = (sesion) => {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(htmlReporteCierre(sesion));
  doc.close();
  const quitar = () => setTimeout(() => iframe.remove(), 1000);
  iframe.contentWindow.onafterprint = quitar;
  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => iframe.isConnected && iframe.remove(), 60000); // por si el navegador no avisa onafterprint
  }, 250);
};
