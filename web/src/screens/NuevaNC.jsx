import { useRef, useState } from 'react';
import { encolarNC, sincronizar, subirEvidencia } from '../api';
import { Marco, Cabecera, Campo, Boton } from '../ui/base';

export default function NuevaNC({ irA }) {
  const [f, setF] = useState({
    titulo: '', tag_equipo: '', severidad: 'mayor', norma_ref: '',
    descripcion: '', responsable: '',
  });
  const [foto, setFoto] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const archivo = useRef(null);

  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  const listo = f.titulo.trim() && f.descripcion.trim();

  function elegirFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const lector = new FileReader();
    lector.onload = () => setFoto({ nombre: file.name, base64: lector.result.split(',')[1] });
    lector.readAsDataURL(file);
  }

  async function guardar() {
    setGuardando(true);
    const item = encolarNC(f);
    const cola = await sincronizar();
    const mia = cola.find((i) => i.uuid_offline === item.uuid_offline);

    if (foto && mia?.nc_id) {
      try { await subirEvidencia(mia.nc_id, foto.nombre, foto.base64); } catch { /* queda para el próximo intento */ }
    }
    setGuardando(false);
    setResultado(mia);
  }

  if (resultado) {
    const enviada = resultado.estado === 'enviada' || resultado.estado === 'duplicada';
    return (
      <Marco>
        <Cabecera titulo="Nueva no conformidad" />
        <div className="px-5 flex-1 flex flex-col justify-center text-center">
          <p className="text-lg font-bold text-tinta">
            {enviada ? `Enviada como ${resultado.folio}` : 'Guardada en el equipo'}
          </p>
          <p className="text-base text-tinta mt-2 px-4">
            {enviada
              ? 'La NC quedó registrada en el servidor con su folio y su primera entrada de bitácora.'
              : 'No hay señal. La NC quedó en la cola y se envía sola al recuperar conexión.'}
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <Boton variante="secundario" onClick={() => irA('listado')}>Ver el listado</Boton>
            {!enviada && <Boton onClick={() => irA('sync')}>Ver la cola</Boton>}
          </div>
        </div>
      </Marco>
    );
  }

  return (
    <Marco>
      <Cabecera titulo="Nueva no conformidad" derecha={
        <button onClick={() => irA('listado')}
          className="text-sm text-apagado underline underline-offset-2 hover:text-tinta">
          Volver
        </button>} />

      <div className="px-6 py-4 flex-1 flex flex-col">
        <div className="space-y-3">
          <Campo etiqueta="Título" valor={f.titulo} onChange={set('titulo')}
                 placeholder="Ej: Falta torque en conexión" />
          <Campo etiqueta="TAG del equipo" valor={f.tag_equipo} onChange={set('tag_equipo')}
                 placeholder="Ej: 220kV GIS bahía J23" />
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Severidad" valor={f.severidad} onChange={set('severidad')}
                   tinte opciones={['menor', 'mayor', 'critica']} />
            <Campo etiqueta="Norma" valor={f.norma_ref} onChange={set('norma_ref')}
                   tinte placeholder="Ej: IEC 62271-203" />
          </div>
          <Campo etiqueta="Descripción" area valor={f.descripcion} onChange={set('descripcion')}
                 placeholder="Describe la desviación encontrada" />
          <Campo etiqueta="Responsable" valor={f.responsable} onChange={set('responsable')}
                 placeholder="Nombre o empresa" />
        </div>

        <input ref={archivo} type="file" accept="image/*" capture="environment"
               className="hidden" onChange={elegirFoto} />

        <div className="grid grid-cols-2 gap-3 mt-5">
          <Boton variante="secundario" onClick={() => archivo.current?.click()}>
            {foto ? '1 foto adjunta' : 'Adjuntar foto'}
          </Boton>
          <Boton onClick={guardar} deshabilitado={!listo || guardando}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </Boton>
        </div>


      </div>
    </Marco>
  );
}
