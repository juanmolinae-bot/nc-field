const puppeteer = require('puppeteer-core');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const OUT = '/home/claude/deck8/';
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const p = await b.newPage();
  await p.setViewport({ width: 560, height: 900, deviceScaleFactor: 2 });
  const cap = async (n) => { await dormir(500); await p.screenshot({ path: OUT + n }); console.log('  ✓', n); };
  const clic = async (t) => {
    for (const e of await p.$$('button'))
      if ((await p.evaluate((x) => x.textContent.trim(), e)) === t) { await e.click(); return; }
    throw new Error(`sin boton "${t}"`);
  };

  await p.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await p.evaluate(() => localStorage.clear());
  await p.reload({ waitUntil: 'networkidle0' });
  await p.type('input[type="text"]', 'pem1');
  await p.type('input[type="password"]', 'pem1234');
  await cap('app_01_login.png');
  await clic('Entrar'); await dormir(1000);
  await cap('app_02_listado.png');

  const tarj = await p.$$('button.w-full.text-left');
  await tarj[0].click(); await dormir(900);
  await cap('app_03_detalle.png');

  // Tablero como PEM (apaisado)
  await p.setViewport({ width: 960, height: 760, deviceScaleFactor: 2 });
  await clic('Tablero'); await dormir(900);
  await cap('app_04_tablero.png');

  await b.close();
  console.log('capturas listas');
})().catch((e) => { console.error('FALLO:', e.message); process.exit(1); });
