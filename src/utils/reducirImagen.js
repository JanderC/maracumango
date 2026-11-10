// Achica una foto antes de subirla (máximo 800 px por lado, JPEG ~82%) para que
// suba rápido y ocupe poco espacio. Si el navegador no puede procesarla, se envía tal cual.
export const reducirImagen = (archivo, maximo = 800, calidad = 0.82) => new Promise((resolve) => {
  if (!archivo || !/^image\/(jpeg|png|webp)$/.test(archivo.type)) return resolve(archivo);
  const url = URL.createObjectURL(archivo);
  const img = new Image();
  img.onload = () => {
    URL.revokeObjectURL(url);
    const escala = Math.min(1, maximo / Math.max(img.width, img.height));
    const ancho = Math.round(img.width * escala), alto = Math.round(img.height * escala);
    const canvas = document.createElement('canvas');
    canvas.width = ancho; canvas.height = alto;
    const ctx = canvas.getContext('2d');
    if (!ctx) return resolve(archivo);
    ctx.fillStyle = '#fff'; // las PNG con fondo transparente quedan sobre blanco
    ctx.fillRect(0, 0, ancho, alto);
    ctx.drawImage(img, 0, 0, ancho, alto);
    canvas.toBlob((blob) => {
      if (!blob || (escala === 1 && blob.size >= archivo.size)) return resolve(archivo); // no ganó nada
      resolve(new File([blob], archivo.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg', calidad);
  };
  img.onerror = () => { URL.revokeObjectURL(url); resolve(archivo); };
  img.src = url;
});
