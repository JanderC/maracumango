/* Recibo de cierre de caja en ESC/POS (papel 80mm, 42 columnas).
   Se le quitan los acentos: la térmica en su página de códigos por defecto no los imprime bien. */
const ESC = 0x1B, GS = 0x1D;
const ANCHO = 42;
const MONEDAS = ['COP', 'USD', 'BS'];
const NOMBRE = { COP: 'PESOS (COP)', USD: 'DOLARES (USD)', BS: 'BOLIVARES (BS)' };
const SIMBOLO = { COP: 'COP$', USD: '$', BS: 'Bs.' };

const limpiar = (s) => String(s ?? '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^\x20-\x7E\n]/g, '');

export const montoTicket = (moneda, v) => {
  const n = Number(v || 0);
  const dec = moneda === 'COP' && Number.isInteger(n) ? 0 : 2;
  return `${SIMBOLO[moneda]} ${n.toLocaleString('es-CO', { minimumFractionDigits: dec, maximumFractionDigits: 2 })}`;
};

// Texto a la izquierda y a la derecha en una misma línea de 42 columnas
export const filaTicket = (izq, der = '') => {
  const a = limpiar(izq), b = limpiar(der);
  const espacio = ANCHO - a.length - b.length;
  if (espacio >= 1) return a + ' '.repeat(espacio) + b;
  return a.slice(0, Math.max(0, ANCHO - b.length - 1)) + ' ' + b;
};

const fechaHora = (iso) => iso
  ? new Date(iso).toLocaleString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
  : '-';
const hora = (iso) => new Date(iso).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: false });

// Solo se imprimen las monedas que tuvieron algún movimiento (pesos siempre)
const monedaActiva = (m, d) => m === 'COP' ||
  [d.apertura, d.ventas_efectivo, d.ingresos, d.egresos, d.transferencias, d.contado].some(x => Number(x || 0) !== 0);

export const lineasTicketCierre = (sesion) => {
  const L = []; // { t: texto, f: formato }
  const add = (t, f = 'normal') => L.push({ t: limpiar(t), f });
  const sep = () => add('-'.repeat(ANCHO));

  add('MARACU MANGO', 'titulo');
  add(sesion.estado === 'cerrada' ? `CIERRE DE CAJA #${sesion.id}` : `CORTE PARCIAL CAJA #${sesion.id}`, 'centro-negrita');
  sep();
  add(filaTicket('Apertura:', fechaHora(sesion.abierta_en)));
  add(filaTicket('  por', sesion.abierta_por || '-'));
  if (sesion.cerrada_en) {
    add(filaTicket('Cierre:', fechaHora(sesion.cerrada_en)));
    add(filaTicket('  por', sesion.cerrada_por || '-'));
  }
  add(filaTicket('Impreso:', fechaHora(new Date().toISOString())));
  sep();

  const v = sesion.ventas || {};
  add(filaTicket('Ventas validas', String(v.cantidad ?? 0)), 'negrita');
  if (v.anuladas) add(filaTicket('Ventas anuladas', String(v.anuladas)));
  add(filaTicket('Total equivalente COP', montoTicket('COP', v.total_cop)));
  add(filaTicket('Total equivalente USD', montoTicket('USD', v.total_usd)));

  MONEDAS.filter(m => monedaActiva(m, sesion.monedas[m])).forEach(m => {
    const d = sesion.monedas[m];
    sep();
    add(NOMBRE[m], 'negrita');
    add(filaTicket('Fondo de apertura', montoTicket(m, d.apertura)));
    add(filaTicket(`+ Ventas efectivo (${d.cantidad_efectivo})`, montoTicket(m, d.ventas_efectivo)));
    add(filaTicket('+ Ingresos', montoTicket(m, d.ingresos)));
    add(filaTicket('- Egresos', montoTicket(m, d.egresos)));
    add(filaTicket('= EFECTIVO ESPERADO', montoTicket(m, d.esperado)), 'negrita');
    if (d.contado !== null && d.contado !== undefined) {
      add(filaTicket('Contado', montoTicket(m, d.contado)));
      const dif = Number(d.diferencia || 0);
      const txt = Math.abs(dif) < 0.005 ? 'CUADRADA' : dif > 0 ? `SOBRA ${montoTicket(m, dif)}` : `FALTA ${montoTicket(m, -dif)}`;
      add(filaTicket('Diferencia', txt), 'negrita');
    }
    add(filaTicket(`Transferencias (${d.cantidad_transferencias})`, montoTicket(m, d.transferencias)));
  });

  if (sesion.movimientos?.length) {
    sep();
    add('INGRESOS Y EGRESOS', 'negrita');
    [...sesion.movimientos].reverse().forEach(mv => {
      add(filaTicket(`${hora(mv.creado_en)} ${mv.tipo === 'ingreso' ? '+' : '-'} ${mv.descripcion}`, montoTicket(mv.moneda, mv.monto)));
    });
  }

  if (sesion.lista_ventas) {
    sep();
    add(`VENTAS (${sesion.lista_ventas.length})`, 'negrita');
    add(filaTicket('#    Hora  Mon Pago', 'Total'));
    sesion.lista_ventas.forEach(x => {
      const pago = x.tipo_pago === 'efectivo' ? 'Efec' : 'Trans';
      const izq = `#${String(x.id).padEnd(4)}${hora(x.creado_en)} ${x.moneda_pago.padEnd(3)} ${pago}${x.anulada ? ' ANUL' : ''}`;
      add(filaTicket(izq, x.anulada ? `(${montoTicket(x.moneda_pago, x.total_pagado)})` : montoTicket(x.moneda_pago, x.total_pagado)));
    });
    if (sesion.lista_ventas.some(x => x.anulada)) add('(ANUL = anulada, no suma en caja)');
  }

  if (sesion.productos_vendidos?.length) {
    sep();
    add('PRODUCTOS VENDIDOS', 'negrita');
    sesion.productos_vendidos.forEach(p => add(filaTicket(`${p.cantidad}x ${p.nombre}`, montoTicket('COP', p.total_cop))));
  }

  if (sesion.notas_cierre) {
    sep();
    add('NOTAS:', 'negrita');
    add(sesion.notas_cierre);
  }

  sep();
  add('');
  add('Firma cajero: ___________________________');
  add('');
  add('Firma admin:  ___________________________');
  return L;
};

export const construirTicketCierre = (sesion) => {
  const enc = new TextEncoder();
  const bytes = [];
  const raw = (arr) => bytes.push(...arr);
  const texto = (s) => raw(Array.from(enc.encode(s)));

  raw([ESC, 0x40]); // inicializar
  lineasTicketCierre(sesion).forEach(({ t, f }) => {
    if (f === 'titulo') { raw([ESC, 0x61, 0x01, ESC, 0x21, 0x30]); texto(t + '\n'); raw([ESC, 0x21, 0x00, ESC, 0x61, 0x00]); return; }
    if (f === 'centro-negrita') { raw([ESC, 0x61, 0x01, ESC, 0x21, 0x18]); texto(t + '\n'); raw([ESC, 0x21, 0x00, ESC, 0x61, 0x00]); return; }
    if (f === 'negrita') { raw([ESC, 0x21, 0x08]); texto(t + '\n'); raw([ESC, 0x21, 0x00]); return; }
    texto(t + '\n');
  });
  texto('\n\n\n');
  raw([GS, 0x56, 0x42, 0x00]); // corte parcial
  return new Uint8Array(bytes);
};
