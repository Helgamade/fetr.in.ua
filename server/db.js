import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'idesig02',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'idesig02_fetrinua',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 50,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  timezone: '+02:00', // Киев (EET/EEST) — NOW() и CURRENT_TIMESTAMP = киевское время
});

export default pool;

