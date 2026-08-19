const path = require('path');
const net = require('net');

if (net.setDefaultAutoSelectFamily) {
  net.setDefaultAutoSelectFamily(false);
}

require('dotenv').config({
  path: path.resolve(process.cwd(), '.env.local'),
  override: true,
});
console.log('DB_HOST:', env('DATABASE_HOST'));
console.log('DB_PORT:', env('DATABASE_PORT'));

module.exports = ({ env }) => ({
  connection: {
    client: 'mysql',
    connection: {
      host: env('DATABASE_HOST'),
      port: env.int('DATABASE_PORT', 3306),
      database: env('DATABASE_NAME'),
      user: env('DATABASE_USERNAME'),
      password: env('DATABASE_PASSWORD'),
      ssl: env.bool('DATABASE_SSL', true) ? { rejectUnauthorized: false } : false,
    },
    useNullAsDefault: true,
  },
});