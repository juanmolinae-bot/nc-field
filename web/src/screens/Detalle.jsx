import { useEffect, useState } from 'react';
import { verNC, verHistorial, verEvidencia, cambiarEstado } from '../api';
import { Marco, Cabecera, Boton } from '../ui/base';

const ETIQUETA = {
  creacion: 'Creación', abierta: 'Abierta', en_tratamiento: 'En tratamiento',
  verificacion: 'Verificación', cerrada: 'Cerrada', rechazada: 'Rechazada',
};
const SEV = { menor: 'Menor', mayor: 'Mayor', critica: 'Crítica' };

const ACCIONES = {
  abierta: [
    { a: 'en_tratamiento', texto: 'Asignar tratamiento', roles: ['pem', 'admin'] },
    { a: 'rechazada', texto: 'Rechazar', roles: ['pem', 'qaqc', 'admin'], variante: 'secundario' },
  ],
  en_tratamiento: [
    { a: 'verificacion', texto: 'Declarar tratada', roles: ['contratista', 'admin'] },
  ],
  verificacion: [
    { a: 'cerrada', texto: 'Verificar y cerrar', roles: ['pem', 'qaqc', 'admin'] },
    { a: 'en_tratamiento', texto: 'Devolver a tratamiento', roles: ['pem', 'qaqc', 'admin'], variante: 'secundario' },
  ],
  cerrada: [], rechazada: [],
};

const fecha = (iso) => {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}-${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

export default function Detalle({ id, irA, sesion }) {
  const [nc, setNC] = useState(null);
  const [hist, setHist] = useState([]);
  const [ev, setEv] = useState([]);
  const [error, setError] = useState(null);

  const cargar = () => {
    verNC(id).then(setNC).catch((e) => setError(e.message));
    verHistorial(id).then(setHist).catch(() => {});
    verEvidencia(id).then(setEv).catch(() => {});
  };
  useEffect(cargar, [id]);

  async function mover(estado_nuevo) {
    try {
      await cambiarEstado(id, estado_nuevo, null);
      setError(null);
      cargar();
    } catch (e) {
      // 409 = el motor de estados rechazó la transición. Se muestra tal cual.
      setError(e.message);
    }
  }

  if (!nc) return (
    <Marco><Cabecera titulo="Cargando…" /></Marco>
  );

  const acciones = (ACCIONES[nc.estado] || []).filter((x) => x.roles.includes(sesion.rol));

  return (
    <Marco>
      <Cabecera titulo={nc.folio} derecha={
        <button onClick={() => irA('listado')}
          className="text-[11.5px] text-apagado underline underline-offset-2 hover:text-tinta">
          Volver
        </button>} />

      <div className="px-5 flex-1 flex flex-col pb-5">
        <div className="bg-t1 border border-borde px-3 py-2.5">
          <p className="text-[14px] font-bold text-tinta">{nc.titulo}</p>
          <p className="text-[12.5px] text-tinta mt-0.5">
            {nc.tag_equipo || 'Sin TAG'}  ·  {SEV[nc.severidad]}
          </p>
          <p className="text-[13px] font-bold text-tinta mt-1 flex items-center gap-2">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${
              nc.estado === 'abierta' ? 'bg-amber-500' :
              nc.estado === 'en_tratamiento' ? 'bg-blue-500' :
              nc.estado === 'verificacion' ? 'bg-purple-500' :
              nc.estado === 'cerrada' ? 'bg-emerald-500' : 'bg-gray-400'
            }`} />
            {ETIQUETA[nc.estado].toUpperCase()}
          </p>
        </div>

        {nc.norma_ref && (
          <p className="text-[12px] text-apagado mt-2">Norma de referencia: {nc.norma_ref}</p>
        )}
        <p className="text-[12.5px] text-tinta mt-2">{nc.descripcion}</p>

        <h3 className="text-[14px] font-bold text-tinta mt-5 mb-2">Bitácora (solo inserción)</h3>
        <div className="relative ml-3 border-l-2 border-borde pl-4 space-y-3">
          {hist.map((h, i) => (
            <div key={i} className="relative">
              <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-t2 border-2 border-borde" />
              <p className="text-[12.5px] font-bold text-tinta">
                {ETIQUETA[h.estado_desde]} → {ETIQUETA[h.estado_hasta]}
              </p>
              <p className="text-[10.5px] text-apagado">
                {h.usuario} · {fecha(h.registrado)}
              </p>
              {h.comentario && <p className="text-[11px] text-tinta mt-0.5">{h.comentario}</p>}
            </div>
          ))}
        </div>

        <h3 className="text-[14px] font-bold text-tinta mt-5 mb-2">Evidencia</h3>
        {ev.length === 0 ? (
          <p className="text-[12px] text-apagado">
            Sin evidencia adjunta. Se agrega al levantar la NC o desde el equipo.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {ev.map((e) => (
              <div key={e.id} className="bg-t3 border border-borde px-2 py-4 text-center"
                   title={`${e.nombre_arch}\nSHA-256 ${e.sha256}`}>
                <p className="text-[11px] text-tinta">SHA-256 ✓</p>
                <p className="text-[9px] text-apagado mt-1 font-mono truncate">
                  {e.sha256.slice(0, 8)}…
                </p>
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="mt-4 text-[12.5px] text-tinta border border-tinta bg-t3 px-3 py-2">{error}</p>
        )}

        <div className="mt-auto pt-5">
          {acciones.length === 0 ? (
            <p className="text-[12px] text-apagado italic">
              {nc.estado === 'cerrada' || nc.estado === 'rechazada'
                ? 'Esta NC está cerrada. La bitácora queda como respaldo permanente.'
                : `Tu rol (${sesion.rol}) no ejecuta el siguiente paso de esta NC.`}
            </p>
          ) : (
            <div className={`grid gap-3 ${acciones.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {acciones.map((x) => (
                <Boton key={x.a} variante={x.variante || 'primario'} onClick={() => mover(x.a)}>
                  {x.texto}
                </Boton>
              ))}
            </div>
          )}

        </div>
      </div>
    </Marco>
  );
}
