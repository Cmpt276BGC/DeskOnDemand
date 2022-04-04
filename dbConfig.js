const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === "production";  // checks if our app is in production or in development
if (!isProduction) {
  require('dotenv').config();
}

<<<<<<< HEAD
// const connectionString =`postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;
const connectionString = 'postgres://postgres:Jojek2020.@localhost/dod' //matts local db
// const connectionString = 'postgres://postgres:Reset123@localhost/bgcuser'
=======
//const connectionString =`postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;
// const connectionString = 'postgres://postgres:Jojek2020.@localhost/dod' //matts local db
 const connectionString = 'postgres://postgres:Reset123@localhost/bgcuser'
>>>>>>> e1a78a6e8b3b5fa6c779dae2283742e6b239ae9b
// connectionString = 'postgres://postgres:root@localhost/bgcusers'

const pool = new Pool({
  connectionString: isProduction ? process.env.DATABASE_URL : connectionString
});


// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: {
//     rejectUnauthorized: false
//   }
// });

module.exports = { pool };
