const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === "production";  // checks if our app is in production or in development
if (!isProduction) {
  require('dotenv').config();
}


//const connectionString =`postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;
//const connectionString = 'postgres://postgres:Jojek2020.@localhost/dod' //matts local db
// const connectionString = 'postgres://postgres:Reset123@localhost/bgcuser'

// const pool = new Pool({
//   connectionString: isProduction ? process.env.DATABASE_URL : connectionString
// });

const pool = new Pool({
   connectionString: process.env.DATABASE_URL,
   ssl: {
     rejectUnauthorized: false
   }
 });

module.exports = { pool };
