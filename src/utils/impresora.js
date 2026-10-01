import { toast } from 'react-toastify';

/* ─── Impresión térmica ESC/POS por Web Serial (COM del Bluetooth emparejado en Windows) ───
   Compatible solo con Chrome/Edge de escritorio. La JAL-880L (u otra impresora térmica
   80mm ESC/POS) debe estar previamente emparejada por Bluetooth en Windows: eso le crea
   un puerto COM virtual, y es ese puerto el que se elige aquí.
   Compartido por Ventas (orden de preparación) y Caja (recibo de cierre). */
let puertoImpresoraCache = null;

export const soportaImpresionDirecta = () => typeof navigator !== 'undefined' && 'serial' in navigator;

// Abre el selector de puertos del navegador (requiere click del usuario) y guarda el permiso.
// Solo hay que hacerlo una vez; el navegador recuerda el puerto autorizado.
export const conectarImpresora = async () => {
  if (!soportaImpresionDirecta()) {
    toast.error('Este navegador no soporta impresión directa. Usa Chrome o Edge en Windows.');
    return null;
  }
  try {
    const puerto = await navigator.serial.requestPort();
    puertoImpresoraCache = puerto;
    toast.success('🔌 Impresora conectada correctamente');
    return puerto;
  } catch {
    // El usuario cerró el selector sin elegir nada
    return null;
  }
};

// Recupera un puerto ya autorizado antes, sin volver a preguntar (para imprimir automático)
export const obtenerPuertoAutorizado = async () => {
  if (!soportaImpresionDirecta()) return null;
  if (puertoImpresoraCache) return puertoImpresoraCache;
  const puertos = await navigator.serial.getPorts();
  if (puertos.length > 0) {
    puertoImpresoraCache = puertos[0];
    return puertoImpresoraCache;
  }
  return null;
};

// Envía bytes ESC/POS ya armados a la impresora. Devuelve true si se imprimió.
export const enviarAImpresora = async (bytes, mensajeOk = '🖨️ Enviado a la impresora') => {
  if (!soportaImpresionDirecta()) {
    toast.error('Impresión directa no disponible en este navegador (usa Chrome/Edge en Windows)');
    return false;
  }
  const puerto = await obtenerPuertoAutorizado();
  if (!puerto) {
    toast.error('Primero conecta la impresora con el botón "🔌 Conectar impresora"');
    return false;
  }
  try {
    if (!puerto.readable && !puerto.writable) {
      await puerto.open({ baudRate: 9600 }); // la mayoría de térmicas BT usan 9600; si no imprime bien, prueba 19200 o 115200
    }
    const writer = puerto.writable.getWriter();
    await writer.write(bytes);
    writer.releaseLock();
    toast.success(mensajeOk);
    return true;
  } catch (err) {
    console.error('Error imprimiendo:', err);
    toast.error('No se pudo imprimir. Verifica que la impresora esté encendida y conectada.');
    return false;
  }
};
