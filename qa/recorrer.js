/* Recorre la aplicación real y captura cada pantalla. No es un test:
   es la verificación visual de que la UI quedó igual a los mockups. */
const puppeteer = require('puppeteer-core');

const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const WEB = 'http://localhost:5173';
const OUT = '/home/claude/nc-field-api/qa/';

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 560, height: 900, deviceScaleFactor: 2 });
  page.on('console', (m) => m.type() === 'error' && console.log('  [consola]', m.text()));
  page.on('pageerror', (e) => console.log('  [error JS]', e.message));

  const captura = async (n) => { await dormir(500); await page.screenshot({ path: OUT + n }); console.log('  ✓', n); };
  const escribir = async (sel, txt) => { await page.click(sel); await page.type(sel, txt, { delay: 8 }); };
  const clicTexto = async (txt) => {
    const els = await page.$$('button');
    for (const e of els) {
      const t = await page.evaluate((x) => x.textContent.trim(), e);
      if (t === txt) { await e.click(); return true; }
    }
    throw new Error(`No encontré el botón "${txt}"`);
  };

  console.log('\nM1 · Login');
  await page.goto(WEB, { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await escribir('input[type="text"]', 'pem1');
  await escribir('input[type="password"]', 'pem1234');
  await captura('01_login.png');

  await clicTexto('Entrar');
  await dormir(900);

  console.log('\nM2 · Listado');
  await captura('02_listado.png');

  console.log('\nM3 · Nueva NC');
  await clicTexto('+ Nueva NC');
  await dormir(400);
  const campos = await page.$$('input[type="text"], textarea');
  await campos[0].type('Deflector de disco de ruptura abierto', { delay: 5 });
  await campos[1].type('220kV GIS · bahía J23', { delay: 5 });
  await page.select('select', 'mayor');
  await campos[2].type('IEC 62271-203', { delay: 5 });
  const ta = await page.$('textarea');
  await ta.type('Deflector orientado al pasillo', { delay: 5 });
  await campos[3].type('Contratista de montaje', { delay: 5 });
  await captura('03_nueva.png');

  await clicTexto('Guardar');
  await dormir(1200);
  await captura('04_guardada.png');

  console.log('\nM2 · Listado con la NC creada');
  await clicTexto('Ver el listado');
  await dormir(900);
  await captura('05_listado_con_nc.png');

  console.log('\nM4 · Detalle');
  const tarjetas = await page.$$('button.w-full.text-left');
  await tarjetas[0].click();
  await dormir(900);
  await captura('06_detalle.png');

  console.log('\nMotor de estados: PEM asigna tratamiento');
  await clicTexto('Asignar tratamiento');
  await dormir(900);
  await captura('07_detalle_en_tratamiento.png');

  console.log('\nM5 · Sincronización');
  await clicTexto('Sincronización');
  await dormir(700);
  await captura('08_sync.png');

  console.log('\nM6 · Tablero como PEM');
  await page.setViewport({ width: 960, height: 760, deviceScaleFactor: 2 });
  await clicTexto('Tablero');
  await dormir(900);
  await captura('09_tablero_pem.png');

  console.log('\n403 · Tablero como contratista');
  await page.evaluate(() => localStorage.removeItem('ncfield.sesion'));
  await page.reload({ waitUntil: 'networkidle0' });
  await page.setViewport({ width: 560, height: 900, deviceScaleFactor: 2 });
  await escribir('input[type="text"]', 'contra1');
  await escribir('input[type="password"]', 'contratista1234');
  await clicTexto('Entrar');
  await dormir(900);
  await page.setViewport({ width: 960, height: 760, deviceScaleFactor: 2 });
  await clicTexto('Tablero');
  await dormir(900);
  await captura('10_tablero_403.png');

  console.log('\n409 · El contratista intenta un paso que no le toca');
  await page.setViewport({ width: 560, height: 900, deviceScaleFactor: 2 });
  await clicTexto('No conformidades');
  await dormir(800);
  const t2 = await page.$$('button.w-full.text-left');
  await t2[0].click();
  await dormir(900);
  await captura('11_detalle_contratista.png');

  await browser.close();
  console.log('\nRecorrido terminado.');
})().catch((e) => { console.error('FALLÓ:', e.message); process.exit(1); });
