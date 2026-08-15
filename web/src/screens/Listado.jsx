import { useEffect, useState } from 'react';
import { listarNC, leerCola, pendientes } from '../api';
import { Marco, Cabecera, Boton } from '../ui/base';

const ETIQUETA = {
  abierta: 'Abierta', en_tratamiento: 'En tratamiento', verificacion: 'Verificación',
  cerrada: 'Cerrada', rechazada: 'Rechazada',
};
const SEV = { menor: 'Menor', mayor: 'Mayor', critica: 'Crítica' };

export default function Listado({ irA, sesion, salir }) {
  const [nc, setNC] = useState([]);
  const [busca, setBusca] = useState('');
  const [error, setError] = useState(null);
  const [pend, setPend] = useState(pendientes());

  useEffect(() => {
    listarNC().then(setNC).catch(() => setError('sin_red'));
    setPend(pendientes());
  }, []);

  // Las NC que aún están en la cola se muestran junto a las del servidor:
  // en terreno no importa dónde está guardada, importa que exista.
  const locales = leerCola()
    .filter((i) => i.estado === 'en_cola' || i.estado === 'error')
    .map((i) => ({ id: `local-${i.uuid_offline}`, folio: 'Sin folio — en cola',
                   titulo: i.datos.titulo, tag_equipo: i.datos.tag_equipo,
                   severidad: i.datos.severidad, estado: 'abierta', local: true }));

  const filtro = busca.trim().toLowerCase();
  const visibles = [...locales, ...nc].filter((n) =>
    !filtro || [n.folio, n.tag_equipo, SEV[n.severidad], ETIQUETA[n.estado], n.titulo]
      .filter(Boolean).some((c) => c.toLowerCase().includes(filtro)));

  return (
    <Marco>
      <Cabecera titulo="No conformidades" derecha={
        <button onClick={salir}
          className="text-[11.5px] text-apagado underline underline-offset-2 hover:text-tinta">
          {sesion.nombre} · Salir
        </button>} />

      <div className="px-5 flex-1 flex flex-col">
        <input value={busca} onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por folio, TAG o severidad"
          className="w-full h-[38px] bg-t3 border border-borde px-3 text-[13px] text-tinta
                     placeholder-apagado focus:outline-none focus:border-tinta" />

        {pend > 0 && (
          <button onClick={() => irA('sync')}
            className="mt-3 w-full bg-t2 border border-tinta px-3 py-2 text-[12.5px]
                       font-bold text-tinta text-left hover:bg-t1">
            {pend} NC pendiente{pend > 1 ? 's' : ''} de envío · toca para sincronizar
          </button>
        )}

        <div className="mt-3 space-y-2 flex-1">
          {error === 'sin_red' && locales.length === 0 && (
            <div className="border border-borde bg-t3 px-4 py-6 text-center">
              <p className="text-[13px] font-bold text-tinta">Sin conexión</p>
              <p className="text-[12px] text-apagado mt-1">
                Modo offline activo
              </p>
            </div>
          )}

          {!error && visibles.length === 0 && (
            <div className="border border-borde bg-t3 px-4 py-6 text-center">
              <p className="text-[13px] font-bold text-tinta">
                {filtro ? 'Ningún resultado' : 'Todavía no hay no conformidades'}
              </p>
              <p className="text-[12px] text-tinta mt-1">
                {filtro ? 'Prueba con otro folio, TAG o severidad.' : 'Levanta la primera con “+ Nueva NC”.'}
              </p>
            </div>
          )}

          {visibles.map((n, i) => (
            <button key={n.id} onClick={() => !n.local && irA('detalle', n.id)}
              className={`w-full text-left border border-borde px-3 py-2.5
                          ${i % 2 === 0 ? 'bg-t1' : 'bg-white'}
                          ${n.local ? 'cursor-default' : 'hover:bg-t2'}`}>
              <p className="text-[14px] font-bold text-tinta">{n.folio}</p>
              <p className="text-[12.5px] text-tinta mt-0.5">{n.tag_equipo || n.titulo}</p>
              <p className="text-[11.5px] text-apagado mt-0.5 flex items-center gap-1.5">
                <span className={`inline-block w-2 h-2 rounded-full ${
                  n.estado === 'abierta' ? 'bg-amber-500' :
                  n.estado === 'en_tratamiento' ? 'bg-blue-500' :
                  n.estado === 'verificacion' ? 'bg-purple-500' :
                  n.estado === 'cerrada' ? 'bg-emerald-500' : 'bg-gray-400'
                }`} />
                {SEV[n.severidad]}  ·  {ETIQUETA[n.estado]}
              </p>
            </button>
          ))}
        </div>

        <div className="flex justify-end py-4">
          <Boton onClick={() => irA('nueva')}>+ Nueva NC</Boton>
        </div>
      </div>
    </Marco>
  );
}
