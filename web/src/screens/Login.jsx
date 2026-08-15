import { useState } from 'react';
import { login, guardarSesion } from '../api';
import { Marco, Cabecera, Campo, Boton, Aviso } from '../ui/base';

export default function Login({ alEntrar }) {
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  async function entrar() {
    setError(null);
    setCargando(true);
    try {
      const s = await login(usuario, clave);
      guardarSesion(s);
      alEntrar(s);
    } catch (e) {
      setError(e.status === 401 ? 'Usuario o contraseña incorrectos. Revisa e intenta otra vez.'
                                : 'No hay conexión con el servidor. Puedes seguir y sincronizar después.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <Marco>
      <Cabecera titulo="NC-Field" />
      <div className="px-5 flex-1 flex flex-col">
        <h2 className="text-[26px] font-bold text-tinta text-center mt-12 mb-8">Iniciar sesión</h2>

        <div className="space-y-4">
          <Campo etiqueta="Usuario" valor={usuario} onChange={setUsuario} placeholder="jmolina" />
          <Campo etiqueta="Contraseña" tipo="password" valor={clave} onChange={setClave} />
        </div>

        <Boton className="w-full mt-6" onClick={entrar} deshabilitado={cargando || !usuario || !clave}>
          {cargando ? 'Entrando…' : 'Entrar'}
        </Boton>

        {error && (
          <p className="mt-3 text-[12.5px] text-tinta border border-tinta bg-t3 px-3 py-2">{error}</p>
        )}

        <div className="mt-8 flex justify-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-t3 border border-borde
                           rounded-full text-[11px] text-apagado">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Modo offline disponible
          </span>
        </div>
      </div>
    </Marco>
  );
}
