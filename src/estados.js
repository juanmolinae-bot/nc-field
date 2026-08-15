// Transiciones validas de una NC y que rol puede ejecutar cada una.
// No se puede saltar de abierta a cerrada: tiene que pasar por tratamiento y verificacion.

const TRANSICIONES = {
  abierta:        { en_tratamiento: ['pem', 'admin'],
                    rechazada:      ['pem', 'qaqc', 'admin'] },
  en_tratamiento: { verificacion:   ['contratista', 'admin'] },
  verificacion:   { cerrada:        ['pem', 'qaqc', 'admin'],
                    en_tratamiento: ['pem', 'qaqc', 'admin'] },
  cerrada:        {},
  rechazada:      {},
};

function validarTransicion(desde, hasta, rol) {
  const destinos = TRANSICIONES[desde];
  if (!destinos || !(hasta in destinos)) {
    return { ok: false, motivo: `Transicion '${desde}' -> '${hasta}' no es valida` };
  }
  if (!destinos[hasta].includes(rol)) {
    return { ok: false, motivo: `Rol '${rol}' no puede ejecutar '${desde}' -> '${hasta}'` };
  }
  return { ok: true };
}

module.exports = { validarTransicion, TRANSICIONES };
