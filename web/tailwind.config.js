/** Tokens tomados directamente de los mockups M1 a M6. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        tinta: '#1A1A1A',   // texto
        apagado: '#5A6472', // etiquetas y metadatos
        borde: '#9AA2AC',   // borde de campos y tarjetas
        t1: '#E7EAEE',      // tinte de tarjeta alterna
        t2: '#DDE2E7',      // tinte de cabecera y boton primario
        t3: '#F3F4F6',      // tinte suave
      },
      fontFamily: {
        // Carlito es metricamente identica a Calibri y viene en Linux Mint.
        sans: ['Carlito', 'Calibri', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
