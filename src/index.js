import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import App from './App';

// Si una imagen no carga (ej. el servicio de imágenes dejó de responder) se muestra
// un ícono gris de "sin imagen" en lugar del ícono de imagen rota del navegador.
const SIN_IMAGEN = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="240" height="240"><rect width="24" height="24" fill="#FFF8E7"/>' +
  '<g transform="translate(6 6) scale(0.5)" fill="#BDBDBD"><path d="M2.9918 21C2.44405 21 2 20.5551 2 20.0066V3.9934C2 3.44476 2.45531 3 2.9918 3H21.0082C21.556 3 22 3.44495 22 3.9934V20.0066C22 20.5552 21.5447 21 21.0082 21H2.9918ZM20 15V5H4V19L14 9L20 15ZM20 17.8284L14 11.8284L6.82843 19H20V17.8284ZM8 11C6.89543 11 6 10.1046 6 9C6 7.89543 6.89543 7 8 7C9.10457 7 10 7.89543 10 9C10 10.1046 9.10457 11 8 11Z"/></g></svg>');
window.addEventListener('error', (e) => {
  const img = e.target;
  if (img && img.tagName === 'IMG' && img.src !== SIN_IMAGEN) {
    img.src = SIN_IMAGEN;
    img.style.objectFit = 'contain';
  }
}, true);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);