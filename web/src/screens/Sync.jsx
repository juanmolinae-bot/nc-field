import { useState } from 'react';
import { leerCola, sincronizar, vaciarSincronizadas } from '../api';
import { Marco, Cabecera, Boton } from '../ui/base';

const TEXTO = {
  enviada: 'Enviada  ✓',
  duplicada: 'Duplicada — ya existía',
  en_cola: 'En cola',
  error: 'No se pudo enviar',
};

export default function Sync({ irA }) {
  const [cola, setCola] = useState(leerCola());
  const [enviando, setEnviando] = useState(false);

  const pendientes = cola.filter((i) => i.estado === 'en_cola' || i.estado === 'error').length;

  async function enviar() {
    setEnviando(true);
    setCola(await sincronizar());
    setEnviando(false);
  }

  return (
    <Marco>
      <Cabecera titulo="Sincronización" derecha={
        <button onClick={() => irA('listado')}
          className="text-[11.5px] text-apagado underline underline-offset-2 hover:text-tinta">
          Volver
        </button>} />

      <div className="px-5 flex-1 flex flex-col">
        <div className="bg-t2 border border-tinta px-3 py-3 text-center">
          <p className="text-[15px] font-bold text-tinta">
            {pendientes === 0 ? 'Nada pendiente de envío'
              : `${pendientes} NC pendiente${pendientes > 1 ? 's' : ''} de envío`}
          </p>
        </div>

        <div className="mt-3 space-y-2 flex-1">
          {cola.length === 0 && (
            <div className="border border-borde bg-t3 px-4 py-6 text-center">
              <p className="text-[13px] font-bold text-tinta">La cola está vacía</p>
              <p className="text-[12px] text-tinta mt-1">
                Las NC que levantes sin señal aparecen aquí hasta que se envían.
              </p>
            </div>
          )}
          {cola.map((i, k) => (
            <div key={i.uuid_offline}
              className={`border border-borde px-3 py-2.5 ${k % 2 === 0 ? 'bg-t1' : 'bg-t3'}`}>
              <p className="text-[13px] font-bold text-tinta">
                {i.folio || `NC local #${k + 1}`}
              </p>
              <p className="text-[10.5px] text-apagado font-mono mt-0.5">
                uuid  {i.uuid_offline.slice(0, 4)}…{i.uuid_offline.slice(-3)}
              </p>
              <p className="text-[12px] text-tinta mt-0.5">{i.detalle || TEXTO[i.estado]}</p>
            </div>
          ))}
        </div>

        <div className="py-4 space-y-2">
          <Boton className="w-full" onClick={enviar} deshabilitado={enviando || cola.length === 0}>
            {enviando ? 'Sincronizando…' : 'Sincronizar ahora'}
          </Boton>
          {cola.some((i) => i.estado === 'enviada' || i.estado === 'duplicada') && (
            <Boton className="w-full" variante="secundario"
              onClick={() => { vaciarSincronizadas(); setCola(leerCola()); }}>
              Quitar las ya enviadas
            </Boton>
          )}

        </div>
      </div>
    </Marco>
  );
}
