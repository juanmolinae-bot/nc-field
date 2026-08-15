
export function Marco({ children, ancho = 'max-w-[520px]' }) {
  return (
    <div className="min-h-screen flex items-start justify-center py-6 px-3">
      <div className={`w-full ${ancho} bg-white rounded-[22px] border-[1.5px] border-tinta
                       shadow-sm overflow-hidden flex flex-col min-h-[780px]`}>
        {children}
      </div>
    </div>
  );
}

export function Cabecera({ titulo, derecha }) {
  return (
    <div className="mx-5 mt-5 mb-4 px-4 py-3 bg-t2 border border-borde flex items-center justify-between">
      <h1 className="text-[19px] font-bold text-tinta leading-none">{titulo}</h1>
      {derecha}
    </div>
  );
}

export function Campo({ etiqueta, valor, onChange, tipo = 'text', placeholder, tinte = false,
                        area = false, deshabilitado = false, opciones, className = '' }) {
  const base = `w-full border border-borde px-3 text-[14px] text-tinta placeholder-apagado
                focus:outline-none focus:border-tinta focus:ring-1 focus:ring-tinta
                ${tinte ? 'bg-t3' : 'bg-white'} ${deshabilitado ? 'text-apagado' : ''}`;
  return (
    <label className={`block ${className}`}>
      <span className="block text-[11.5px] text-apagado mb-1">{etiqueta}</span>
      {opciones ? (
        <select className={`${base} h-[38px]`} value={valor}
                onChange={(e) => onChange(e.target.value)}>
          {opciones.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : area ? (
        <textarea className={`${base} py-2 h-[92px] resize-none`} value={valor}
                  placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type={tipo} className={`${base} h-[38px]`} value={valor} placeholder={placeholder}
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
      className={`${fondo} border border-tinta rounded-[6px] px-4 py-2.5 text-[14px] font-bold
                  text-tinta transition-colors hover:bg-t1 focus:outline-none focus:ring-2
                  focus:ring-tinta focus:ring-offset-1 disabled:opacity-40
                  disabled:cursor-not-allowed ${className}`}>
      {children}
    </button>
  );
}

export function Aviso({ titulo, children, tinte = 'bg-t3' }) {
  return (
    <div className={`${tinte} border border-borde px-4 py-3 text-center`}>
      {titulo && <p className="text-[13px] font-bold text-tinta">{titulo}</p>}
      <p className="text-[12px] text-tinta leading-snug mt-0.5">{children}</p>
    </div>
  );
}

export function Pie({ children }) {
  return <p className="text-[12px] text-apagado italic px-5 pb-4">{children}</p>;
}
