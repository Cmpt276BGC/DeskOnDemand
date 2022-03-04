//Patrick Pulled / pushed successfully 
// harsh's commit
//Matt's commit

// emmii's commit 02-28-2022

const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
const session = require('express-session')

// database connection
const { Pool } = require('pg');
var pool;
pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // connectionString: 'postgres://postgres:@localhost/',
  ssl: {
    rejectUnauthorized: false
  }
});

var app = express()
app.use(express.static(path.join(__dirname, 'public')))
app.use(session({
  name: "sesson",
  secret: 'this is the way', 
  resave: false, // forces session to be saved back to session store
  saveUninitialized: false, // forces a session that is "uninitialized" to be saved to store
  maxAge: 30 * 60 * 1000, // 30 minutes
})) 

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.get('/', (req, res) => res.render('pages/index'))
app.listen(PORT, () => console.log(`Listening on ${ PORT }`))

app.get('/login', (req, res) => {
    res.render('pages/loginPage')
})

app.get('/register', (req, res) => {
  res.render('pages/registerPage')
})

app.get('/dashboard', (req,res)=>{
  res.render('pages/dashboard')
})


app.get('/db', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM test_table');
    const results = { 'results': (result) ? result.rows : null};
    res.render('pages/db', results );
    client.release();
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
})