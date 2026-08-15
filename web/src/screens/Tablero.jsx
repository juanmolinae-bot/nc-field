import { useEffect, useState } from 'react';
import { verTablero, listarNC } from '../api';
import { Marco, Cabecera } from '../ui/base';

const SEV = [['critica', 'Crítica'], ['mayor', 'Mayor'], ['menor', 'Menor']];
const KPI = [['abierta', 'Abiertas'], ['en_tratamiento', 'En tratamiento'],
             ['verificacion', 'En verificación'], ['cerrada', 'Cerradas']];

export default function Tablero({ irA, sesion }) {
  const [resumen, setResumen] = useState(null);
  const [nc, setNC] = useState([]);
  const [negado, setNegado] = useState(false);

  useEffect(() => {
    verTablero()
      .then((d) => setResumen(d.resumen))
      .catch((e) => { if (e.status === 403) setNegado(true); });
    listarNC().then(setNC).catch(() => {});
  }, []);

  // El 403 no es un fallo: es el sistema haciendo lo que debe.
  if (negado) return (
    <Marco ancho="max-w-[880px]">
      <Cabecera titulo="Tablero de control" derecha={
        <button onClick={() => irA('listado')}
          className="text-[11.5px] text-apagado underline underline-offset-2 hover:text-tinta">
          Volver
        </button>} />
      <div className="px-6 flex-1 flex flex-col justify-center text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-t1 flex items-center justify-center">
          <span className="text-[28px]">⊘</span>
        </div>
        <p className="text-[16px] font-bold text-tinta">Acceso restringido</p>
        <p className="text-[13px] text-apagado mt-2 max-w-sm mx-auto">
          Tu perfil no tiene permisos para ver los indicadores del proyecto.
        </p>
      </div>
    </Marco>
  );

  const suma = (estado) => (resumen || []).filter((r) => r.estado === estado)
    .reduce((a, r) => a + r.cantidad, 0);
  const porSev = (sev) => (resumen || []).filter((r) => r.severidad === sev)
    .reduce((a, r) => a + r.cantidad, 0);
  const maxSev = Math.max(1, ...SEV.map(([s]) => porSev(s)));

  const dias = (iso) => Math.floor((Date.now() - new Date(iso)) / 86400000);
  const abiertas = nc.filter((n) => n.estado === 'abierta');
  const rangos = [['0-7 días', (d) => d <= 7], ['8-15 días', (d) => d > 7 && d <= 15],
                  ['16-30 días', (d) => d > 15 && d <= 30], ['> 30 días', (d) => d > 30]];

  return (
    <Marco ancho="max-w-[880px]">
      <Cabecera titulo="Tablero de control — BESS Cristales" derecha={
        <button onClick={() => irA('listado')}
          className="text-[11.5px] text-apagado underline underline-offset-2 hover:text-tinta">
          Volver
        </button>} />

      <div className="px-5 pb-5 flex-1">
        <div className="grid grid-cols-4 gap-3">
          {KPI.map(([k, l], i) => {
            const colores = ['border-l-amber-500', 'border-l-blue-500', 'border-l-purple-500', 'border-l-emerald-500'];
            return (
              <div key={k} className={`bg-white border border-borde ${colores[i]} border-l-[3px] py-4 text-center`}>
                <p className="text-[30px] font-bold text-tinta leading-none">{suma(k)}</p>
                <p className="text-[11.5px] text-apagado mt-1.5">{l}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-[1fr_320px] gap-5 mt-5">
          <div>
            <h3 className="text-[13.5px] font-bold text-tinta mb-2">NC por severidad</h3>
            <div className="space-y-2">
              {SEV.map(([s, l], i) => {
                const v = porSev(s);
                return (
                  <div key={s} className="flex items-center gap-2">
                    <span className="w-16 text-[12px] text-tinta">{l}</span>
                    <div className="flex-1 h-[22px] relative">
                      <div className={`${i === 0 ? 'bg-t1' : i === 1 ? 'bg-t2' : 'bg-t3'}
                                       border border-borde h-full`}
                           style={{ width: `${Math.max(4, (v / maxSev) * 100)}%` }} />
                    </div>
                    <span className="w-6 text-[12px] text-tinta text-right">{v}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-t3 border border-borde p-3">
            <h3 className="text-[12px] font-bold text-tinta text-center mb-2">
              Antigüedad de NC abiertas
            </h3>
            {rangos.map(([l, test]) => (
              <div key={l} className="flex justify-between text-[11.5px] text-tinta py-0.5">
                <span>{l}</span>
                <span className="font-bold">{abiertas.filter((n) => test(dias(n.creada_en))).length}</span>
              </div>
            ))}
          </div>
        </div>


      </div>
    </Marco>
  );
}
