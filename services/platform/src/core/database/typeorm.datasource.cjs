require('dotenv').config();
const { DataSource } = require('typeorm');

const isProduction = process.env.NODE_ENV === 'production';

function firstEnv(keys) {
  for (const k of keys) {
    const v = process.env[k];
    if (v !== undefined && v !== '') return v;
  }
  return undefined;
}

module.exports = new DataSource({
  type: 'postgres',
  host: firstEnv(['PLATFORM_DB_HOST', 'DB_HOST']) || 'localhost',
  port: parseInt(firstEnv(['PLATFORM_DB_PORT', 'DB_PORT']) || '5432', 10),
  username:
    firstEnv(['PLATFORM_DB_USERNAME', 'DB_USERNAME']) || 'postgres',
  password:
    firstEnv(['PLATFORM_DB_PASSWORD', 'DB_PASSWORD']) || 'postgres',
  database:
    firstEnv(['PLATFORM_DB_DATABASE', 'DB_DATABASE']) ||
    'recommendation_trip_db',
  synchronize: false,
  logging: firstEnv(['PLATFORM_DB_LOGGING', 'DB_LOGGING']) === 'true',
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  entities: ['dist/**/*.orm-entity.js'],
  migrations: ['dist/core/database/migrations/*.js'],
});
