
export function Marco({ children, ancho = 'max-w-[1100px]' }) {
  return (
    <div className="min-h-screen bg-white">
      <div className={`w-full ${ancho} mx-auto flex flex-col min-h-screen`}>
        {children}
      </div>
    </div>
  );
}

export function Cabecera({ titulo, derecha }) {
  return (
    <div className="px-8 py-5 bg-t2 border-b border-borde flex items-center justify-between">
      <h1 className="text-2xl font-bold text-tinta">{titulo}</h1>
      {derecha}
    </div>
  );
}

export function Campo({ etiqueta, valor, onChange, tipo = 'text', placeholder, tinte = false,
                        area = false, deshabilitado = false, opciones, className = '' }) {
  const base = `w-full border border-borde px-4 text-base text-tinta placeholder-apagado
                focus:outline-none focus:border-tinta focus:ring-1 focus:ring-tinta
                ${tinte ? 'bg-t3' : 'bg-white'} ${deshabilitado ? 'text-apagado' : ''}`;
  return (
    <label className={`block ${className}`}>
      <span className="block text-sm text-apagado mb-1.5">{etiqueta}</span>
      {opciones ? (
        <select className={`${base} h-12`} value={valor}
                onChange={(e) => onChange(e.target.value)}>
          {opciones.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : area ? (
        <textarea className={`${base} py-3 h-28 resize-none`} value={valor}
                  placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type={tipo} className={`${base} h-12`} value={valor} placeholder={placeholder}
               disabled={deshabilitado} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

export function Boton({ children, onClick, variante = 'primario', className = '', tipo = 'button',
                        deshabilitado = false }) {
  const fondo = variante === 'primario' ? 'bg-t2' : 'bg-white';
  return (
    <button type={tipo} onClick={onClick} disabled={deshabilitado}
      className={`${fondo} border border-tinta rounded-lg px-6 py-3 text-base font-bold
                  text-tinta transition-colors hover:bg-t1 focus:outline-none focus:ring-2
                  focus:ring-tinta focus:ring-offset-1 disabled:opacity-40
                  disabled:cursor-not-allowed ${className}`}>
      {children}
    </button>
  );
}

export function Aviso({ titulo, children, tinte = 'bg-t3' }) {
  return (
    <div className={`${tinte} border border-borde px-6 py-4 text-center`}>
      {titulo && <p className="text-base font-bold text-tinta">{titulo}</p>}
      <p className="text-sm text-tinta leading-snug mt-1">{children}</p>
    </div>
  );
}

export function Pie({ children }) {
  return <p className="text-sm text-apagado italic px-8 pb-5">{children}</p>;
}
