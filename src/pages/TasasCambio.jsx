import { useState, useEffect } from 'react';
import API from '../api/axios';
import { toast } from 'react-toastify';
import { RiRefreshLine, RiAddLine, RiDownloadLine, RiTimeLine } from 'react-icons/ri';

export default function TasasCambio() {
  const [tasasBCV, setTasasBCV] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [cargandoBCV, setCargandoBCV] = useState(false);
  const [cargandoHist, setCargandoHist] = useState(true);
  const [formManual, setFormManual] = useState({ moneda: 'BS', tasa_por_usd: '' });
  const [guardando, setGuardando] = useState(false);
  const [importando, setImportando] = useState('');

  const cargarBCV = async () => {
    setCargandoBCV(true);
    try {
      const { data } = await API.get('/tasas-cambio/bcv');
      setTasasBCV(data.tasas);
    } catch { toast.error('Error consultando BCV'); }
    finally { setCargandoBCV(false); }
  };

  const cargarHistorial = async () => {
    setCargandoHist(true);
    try {
      const { data } = await API.get('/tasas-cambio');
      setHistorial(data.tasas);
    } catch { toast.error('Error cargando historial'); }
    finally { setCargandoHist(false); }
  };

  useEffect(() => { cargarBCV(); cargarHistorial(); }, []);

  const importarBCV = async (monedaBCV) => {
    setImportando(monedaBCV);
    try {
      const { data } = await API.post('/tasas-cambio/importar-bcv', { moneda: monedaBCV });
      toast.success(data.mensaje);
      cargarHistorial();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error importando');
    } finally { setImportando(''); }
  };

  const guardarManual = async () => {
    if (!formManual.tasa_por_usd) { toast.error('Ingresa la tasa'); return; }
    setGuardando(true);
    try {
      await API.post('/tasas-cambio/manual', formManual);
      toast.success('Tasa manual guardada');
      setFormManual({ ...formManual, tasa_por_usd: '' });
      cargarHistorial();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error guardando');
    } finally { setGuardando(false); }
  };

  const ultimaBS = historial.find(t => t.moneda === 'BS');
  const ultimaCOP = historial.find(t => t.moneda === 'COP');

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 2 }}>Tasas de Cambio 💱</h1>
        <p style={{ color: 'var(--texto-suave)', fontSize: '0.85rem' }}>Gestiona las tasas activas para Bs y COP</p>
      </div>

      {/* Tasas activas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { moneda: 'BS', label: '🇻🇪 Bolívar', tasa: ultimaBS, color: '#1565C0', bg: '#E3F2FD' },
          { moneda: 'COP', label: '🇨🇴 Peso colombiano', tasa: ultimaCOP, color: '#E65100', bg: '#FFF3E0' }
        ].map(item => (
          <div key={item.moneda} className="card-mm">
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--texto-suave)', marginBottom: 8 }}>{item.label}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: item.color, marginBottom: 4 }}>
              {item.tasa ? parseFloat(item.tasa.tasa_por_usd).toLocaleString() : '—'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--texto-suave)' }}>
              {item.tasa ? `Actualizada: ${new Date(item.tasa.actualizado_en).toLocaleDateString('es-VE')}` : 'Sin tasa registrada'}
            </div>
            <div style={{ marginTop: 10, background: item.bg, borderRadius: 10, padding: '6px 12px', fontSize: '0.78rem', color: item.color, fontWeight: 600 }}>
              1 USD = {item.tasa ? parseFloat(item.tasa.tasa_por_usd).toLocaleString() : '?'} {item.moneda}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="tasas-grid">

        {/* BCV en tiempo real */}
        <div className="card-mm">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h6 style={{ fontWeight: 700, margin: 0 }}>📡 BCV — Tasas oficiales</h6>
            <button onClick={cargarBCV} disabled={cargandoBCV} style={{
              background: '#E8F5E9', border: 'none', borderRadius: 10,
              padding: '7px 12px', color: 'var(--verde)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: 'Poppins', fontWeight: 600, fontSize: '0.8rem'
            }}>
              <RiRefreshLine style={{ animation: cargandoBCV ? 'spin 1s linear infinite' : 'none' }} />
              Actualizar
            </button>
          </div>

          {cargandoBCV ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div className="spinner-border" style={{ color: 'var(--verde)' }} />
            </div>
          ) : tasasBCV.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--texto-suave)', padding: 40, fontSize: '0.85rem' }}>
              Sin datos del BCV
            </div>
          ) : tasasBCV.map(t => (
            <div key={t.moneda} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', background: 'var(--crema)', borderRadius: 12, marginBottom: 10
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t.nombre} ({t.moneda})</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--texto-suave)' }}>
                  {new Date(t.fecha_actualizacion).toLocaleDateString('es-VE')}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--verde)' }}>
                  {parseFloat(t.promedio).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </div>
                <button
                  onClick={() => importarBCV(t.moneda)}
                  disabled={importando === t.moneda}
                  style={{
                    background: 'var(--verde)', border: 'none', borderRadius: 8,
                    padding: '4px 12px', color: '#fff', fontSize: '0.72rem',
                    fontFamily: 'Poppins', fontWeight: 600, cursor: 'pointer',
                    marginTop: 4, display: 'flex', alignItems: 'center', gap: 4
                  }}
                >
                  <RiDownloadLine />
                  {importando === t.moneda ? 'Importando...' : 'Usar como BS'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Tasa manual */}
        <div className="card-mm">
          <h6 style={{ fontWeight: 700, marginBottom: 20 }}>✏️ Ingresar tasa manual</h6>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Moneda</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {['BS', 'COP'].map(m => (
                <button key={m} onClick={() => setFormManual({ ...formManual, moneda: m })} style={{
                  padding: '10px', borderRadius: 12, border: '2px solid',
                  borderColor: formManual.moneda === m ? 'var(--verde)' : '#E0E0E0',
                  background: formManual.moneda === m ? '#E8F5E9' : '#fff',
                  color: formManual.moneda === m ? 'var(--verde)' : 'var(--texto-suave)',
                  fontFamily: 'Poppins', fontWeight: 700, cursor: 'pointer'
                }}>
                  {m === 'BS' ? '🇻🇪 Bolívar' : '🇨🇴 COP'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>
              Tasa (1 USD = ? {formManual.moneda})
            </label>
            <input
              className="input-mm"
              type="number"
              step="0.01"
              min="0"
              placeholder={formManual.moneda === 'BS' ? 'Ej: 36.50' : 'Ej: 4050'}
              value={formManual.tasa_por_usd}
              onChange={e => setFormManual({ ...formManual, tasa_por_usd: e.target.value })}
            />
          </div>
          {formManual.tasa_por_usd && (
            <div style={{ background: '#E8F5E9', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
              <span style={{ fontSize: '0.82rem', color: '#1B5E20', fontWeight: 600 }}>
                💡 1 USD = {parseFloat(formManual.tasa_por_usd).toLocaleString()} {formManual.moneda}
              </span>
            </div>
          )}
          <button className="btn-verde" onClick={guardarManual} disabled={guardando} style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {guardando ? <span className="spinner-border spinner-border-sm" /> : <RiAddLine />}
            {guardando ? 'Guardando...' : 'Guardar tasa'}
          </button>

          {/* Historial últimas tasas */}
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--texto-suave)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <RiTimeLine /> ÚLTIMAS TASAS GUARDADAS
            </div>
            {cargandoHist ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <div className="spinner-border spinner-border-sm" style={{ color: 'var(--verde)' }} />
              </div>
            ) : historial.slice(0, 6).map(t => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 10, marginBottom: 6, background: '#FAFAFA' }}>
                <div>
                  <span style={{
                    background: t.moneda === 'BS' ? '#E3F2FD' : '#FFF3E0',
                    color: t.moneda === 'BS' ? '#1565C0' : '#E65100',
                    borderRadius: 20, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700, marginRight: 8
                  }}>{t.moneda}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--texto-suave)' }}>
                    {new Date(t.actualizado_en).toLocaleDateString('es-VE')}
                  </span>
                </div>
                <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                  {parseFloat(t.tasa_por_usd).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 768px) { .tasas-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}