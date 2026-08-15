/* Verifica que cada pantalla renderizada contiene los elementos del mockup. */
const puppeteer = require('puppeteer-core');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
let ok = 0, fallo = 0;

function comprobar(cond, desc) {
  console.log(`  ${cond ? '✓' : '✗ FALLA'}  ${desc}`);
  cond ? ok++ : fallo++;
}

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const p = await b.newPage();
  await p.setViewport({ width: 560, height: 900 });
  const texto = () => p.evaluate(() => document.body.innerText);
  const clic = async (t) => {
    const els = await p.$$('button');
    for (const e of els) if ((await p.evaluate((x) => x.textContent.trim(), e)) === t) { await e.click(); return; }
    throw new Error(`sin boton "${t}"`);
  };

  await p.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await p.evaluate(() => localStorage.clear());
  await p.reload({ waitUntil: 'networkidle0' });

  console.log('\nM1 · Inicio de sesión');
  let t = await texto();
  for (const s of ['NC-Field', 'Iniciar sesión', 'Usuario', 'Contraseña', 'Entrar',
                   'Sin conexión', 'Sesión válida por 8 h'])
    comprobar(t.includes(s), `muestra "${s}"`);
  const fuente = await p.evaluate(() => getComputedStyle(document.body).fontFamily);
  comprobar(/Carlito|Calibri/.test(fuente), `tipografía Carlito/Calibri (${fuente.split(',')[0]})`);

  // credenciales malas -> mensaje que dice que hacer, no un stacktrace
  await p.type('input[type="text"]', 'pem1');
  await p.type('input[type="password"]', 'clave-mala');
  await clic('Entrar'); await dormir(700);
  comprobar((await texto()).includes('incorrectos'), 'clave mala muestra un mensaje accionable');

  await p.evaluate(() => { document.querySelector('input[type="password"]').value = ''; });
  await p.reload({ waitUntil: 'networkidle0' });
  await p.type('input[type="text"]', 'pem1');
  await p.type('input[type="password"]', 'pem1234');
  await clic('Entrar'); await dormir(900);

  console.log('\nM2 · Listado');
  t = await texto();
  comprobar(t.includes('No conformidades'), 'cabecera "No conformidades"');
  comprobar(await p.$('input[placeholder="Buscar por folio, TAG o severidad"]') !== null,
            'buscador con el placeholder del mockup');
  comprobar(t.includes('+ Nueva NC'), 'botón "+ Nueva NC"');
  comprobar(/NC-\d{4}-\d{4}/.test(t), 'muestra folios con formato NC-AAAA-NNNN');

  console.log('\nM4 · Detalle y bitácora');
  const tarj = await p.$$('button.w-full.text-left');
  await tarj[0].click(); await dormir(800);
  t = await texto();
  comprobar(t.includes('Bitácora (solo inserción)'), 'sección "Bitácora (solo inserción)"');
  comprobar(t.includes('Evidencia'), 'sección "Evidencia"');
  comprobar(t.includes('Estado:'), 'muestra el estado en mayúsculas');
  comprobar(t.includes('Los botones dependen del rol'), 'nota del motor de estados');
  comprobar(/Creación → Abierta/.test(t), 'la bitácora arranca en Creación → Abierta');

  console.log('\nM5 · Sincronización');
  await clic('Sincronización'); await dormir(600);
  t = await texto();
  comprobar(t.includes('Sincronizar ahora'), 'botón "Sincronizar ahora"');
  comprobar(t.includes('uuid_offline evita folios duplicados'), 'nota de idempotencia');

  console.log('\nM6 · Tablero como PEM');
  await p.setViewport({ width: 960, height: 760 });
  await clic('Tablero'); await dormir(800);
  t = await texto();
  for (const s of ['Tablero de control', 'Abiertas', 'En tratamiento', 'En verificación',
                   'Cerradas', 'NC por severidad', 'Antigüedad de NC abiertas'])
    comprobar(t.includes(s), `muestra "${s}"`);

  console.log('\n403 · Tablero como contratista');
  await p.evaluate(() => localStorage.removeItem('ncfield.sesion'));
  await p.reload({ waitUntil: 'networkidle0' });
  await p.setViewport({ width: 560, height: 900 });
  await p.type('input[type="text"]', 'contra1');
  await p.type('input[type="password"]', 'contratista1234');
  await clic('Entrar'); await dormir(900);
  await p.setViewport({ width: 960, height: 760 });
  await clic('Tablero'); await dormir(900);
  t = await texto();
  comprobar(t.includes('no está disponible para tu rol'), 'el contratista ve la negativa');
  comprobar(t.includes('403'), 'declara el 403 explícitamente');

  console.log('\nMotor de estados en la UI');
  await p.setViewport({ width: 560, height: 900 });
  await clic('No conformidades'); await dormir(700);
  const t3 = await p.$$('button.w-full.text-left');
  await t3[0].click(); await dormir(800);
  t = await texto();
  comprobar(!t.includes('Asignar tratamiento'),
            'al contratista NO se le ofrece "Asignar tratamiento"');

  await b.close();
  console.log(`\n${ok} comprobaciones en verde, ${fallo} fallas.`);
  process.exit(fallo ? 1 : 0);
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
