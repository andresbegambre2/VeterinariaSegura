const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), quiet: true });
let pool;
function obtenerPool() {
  if (pool) return pool;
  if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL: sigue GUIA_SUPABASE.md');
  const url = new URL(process.env.DATABASE_URL);
  for (const key of ['sslmode','sslcert','sslkey','sslrootcert']) url.searchParams.delete(key);
  const certPath = path.resolve(__dirname, '../..', process.env.DATABASE_CA_PATH || 'certs/prod-ca-2021.crt');
  const ca = fs.existsSync(certPath) ? fs.readFileSync(certPath, 'utf8') : undefined;
  const { Pool } = require('pg');
  pool = new Pool({ connectionString: url.toString(), ssl: { ...(ca ? { ca } : {}), rejectUnauthorized: true },
    max: 5, idleTimeoutMillis: 30000, connectionTimeoutMillis: 10000 });
  pool.on('error', () => console.error('Error en conexiÃ³n PostgreSQL inactiva'));
  return pool;
}
const consultar = (sql, parametros = []) => obtenerPool().query(sql, parametros);

// Cierra el Pool unicamente cuando existe. El script administrativo
// termina sin dejar conexiones y las pruebas conservan la carga diferida.
const cerrarPool = async () => {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
};

// Fachada que permite importar servicios y probarlos sin abrir conexiones.
const facade = {
  query: consultar,
  connect: () => obtenerPool().connect(),
  end: cerrarPool
};

module.exports = { consultar, pool: facade, cerrarPool };
