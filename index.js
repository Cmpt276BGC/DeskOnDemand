
const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
const session = require('express-session')

// database connection
const { Pool } = require('pg');
var pool;
pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // connectionString: 'postgres://postgres:1433@localhost/bgc',  // emmii's local database
  ssl: {
    rejectUnauthorized: false
  }
});

var app = express()
app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/public', express.static('public'));
app.use(session({
  name: "sesson",
  secret: 'this is the way', 
  resave: false, // forces session to be saved back to session store
  saveUninitialized: false, // forces a session that is "uninitialized" to be saved to store
  maxAge: 30 * 60 * 1000, // 30 minutes
})) 

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

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

app.get('/db', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM BGCUsers');
    const results = { 'results': (result) ? result.rows : null};
    res.render('pages/db', results );
    client.release();
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
})

app.post('/register', async (req, res) => {
  var newfname =req.body.fname;
  var newlname = req.body.lname;
  var newuemail =req.body.email;
  var newupass = req.body.password;
  try {
    const result = await pool.query(`INSERT INTO bgcusers (uemail, upass, admin, fname, lname) VALUES ('${newuemail}', '${newupass}', 'f','${newfname}','${newlname}')`);
    res.redirect('/login');
  } catch {
    res.send(error);
  }
});

app.post('/login', async (req, res) =>{
  let ue = req.body.email;
  let pw = req.body.password;
  // database
  userPasswordQuery = `SELECT * FROM BGCUsers WHERE uemail='${ue}' AND upass='${pw}'`;
  // run query
  var user = await pool.query(userPasswordQuery);
  req.session.user = user;
  res.send(`
    <br>
    <a href="/dashboard">GO TO DASHBOARD</a>
  `)
});

app.get('/dashboard', (req,res)=>{
  if (req.session.user) {
    res.render('pages/dashboard')
  } else {
    res.redirect('/login');
  }
  
})


