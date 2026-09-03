import { useState } from 'react';
import { leerSesion, borrarSesion } from './api';
import Login from './screens/Login';
import Listado from './screens/Listado';
import NuevaNC from './screens/NuevaNC';
import Detalle from './screens/Detalle';
import Sync from './screens/Sync';
import Tablero from './screens/Tablero';

export default function App() {
  const [sesion, setSesion] = useState(leerSesion());
  const [vista, setVista] = useState({ p: 'listado', id: null });

  const irA = (p, id = null) => setVista({ p, id });
  const salir = () => { borrarSesion(); setSesion(null); irA('listado'); };

  if (!sesion) return <Login alEntrar={setSesion} />;

  const pantalla = {
    listado: <Listado irA={irA} sesion={sesion} salir={salir} />,
    nueva: <NuevaNC irA={irA} />,
    detalle: <Detalle id={vista.id} irA={irA} sesion={sesion} />,
    sync: <Sync irA={irA} />,
    tablero: <Tablero irA={irA} sesion={sesion} />,
  }[vista.p];

  return (
    <>
      {pantalla}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-borde shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
        <div className="max-w-[1200px] mx-auto flex">
          {[['listado', '☰', 'NC'], ['sync', '↑↓', 'Sync'], ['tablero', '▦', 'Tablero']]
            .map(([p, icono, l]) => (
              <button key={p} onClick={() => irA(p)}
                className={`flex-1 py-2 flex flex-col items-center gap-0.5 border-r border-borde/50 last:border-r-0
                            transition-colors ${vista.p === p
                              ? 'bg-t2 text-tinta'
                              : 'text-apagado hover:bg-t3 hover:text-tinta'}`}>
                <span className="text-[16px] leading-none">{icono}</span>
                <span className={`text-[10.5px] ${vista.p === p ? 'font-bold' : ''}`}>{l}</span>
              </button>
            ))}
        </div>
      </nav>
      <div className="h-14" />
    </>
  );
}
