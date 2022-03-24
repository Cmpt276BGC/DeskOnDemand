const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === "production";  // checks if our app is in production or in development
if (!isProduction) {
  require('dotenv').config();
}

<<<<<<< HEAD

const connectionString =`postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;  // emmii's local db
//const connectionString = 'postgres://postgres:Jojek2020.@localhost/dod' //matts local db
=======
// emmii's database
//const connectionString =`postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;
const connectionString = 'postgres://postgres:Jojek2020.@localhost/dod' //matts local db
>>>>>>> ec4d5094677d1522eb75c63ce9b137690ce26e11
// const connectionString = 'postgres://postgres:Reset123@localhost/bgcuser
// connectionString = 'postgres://postgres:root@localhost/bgcusers'

const pool = new Pool({
<<<<<<< HEAD
 connectionString: isProduction ? process.env.DATABASE_URL : connectionString
});

//  const pool = new Pool({
//    connectionString: process.env.DATABASE_URL,
//    ssl: {
//      rejectUnauthorized: false
//    }
//  });

=======
  connectionString: isProduction ? process.env.DATABASE_URL : connectionString
});
/*
 const pool = new Pool({
   connectionString: process.env.DATABASE_URL,
   ssl: {
     rejectUnauthorized: false
   }
 });
*/
>>>>>>> ec4d5094677d1522eb75c63ce9b137690ce26e11
module.exports = { pool };
