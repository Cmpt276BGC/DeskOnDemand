
const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
const session = require('express-session')

var bodyParser = require('body-parser');

const { Pool } = require('pg');
const res = require('express/lib/response');
const { request } = require('http');
const { user } = require('pg/lib/defaults');
var pool;
pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  //connectionString: 'postgres://postgres:1433@localhost/bgc',  // emmii's local database
  //connectionString: 'postgres://postgres:Jojek2020.@localhost/dod', //matts local db
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

app.get('/', (req, res) => {
  res.redirect('/login');
})

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

app.get('/duplicateEmailErrorPage', (req, res) => {
  res.render('/duplicateEmailErrorPage')
})

//register a new user 
app.post('/register', async (req, res) => {
  //pull data from html form
  var newUserFirstNameInput = req.body.firstNameInput;
  var newUserLastNameInput = req.body.lastNameInput;
  var newUserEmailInput = req.body.emailInput;
  var newUserPasswordInput = req.body.passwordInput;
  var newUserConfirmedPasswordInput = req.body.confirmPasswordInput;

  let error=[];
  //if there are errors the register page will render instead of going to a new page.
  if(newUserPasswordInput != newUserConfirmedPasswordInput){
    //res.render('pages/passwordMismatch');
    error.push({message: "Passwords do not match"}); 
  }
  if(newUserPasswordInput.length < 8){
    error.push({message: "Password should be of at least 7 characters"});
  }
  if(error.length > 0){
    res.render("pages/registerPage",{error});
  }
  else{
    try {
      //query database and determine if user already exists 
      var existsQuery = await pool.query(`SELECT EXISTS(SELECT FROM bgcusers WHERE uemail = '${newUserEmailInput}')`);
  
      //if the user already exists in the database, redirect to duplicate email error page
      if(existsQuery.rows[0].exists){
        res.render('pages/duplicateEmailErrorPage');
      }
      else{
      //if the user does not exist, create the user and redirect to main user page
        var result = await pool.query(`INSERT INTO bgcusers (uemail, upass, admin, fname, lname) VALUES ('${newUserEmailInput}', '${newUserPasswordInput}', 'f','${newUserFirstNameInput}','${newUserLastNameInput}')`);
        res.render('pages/userPage');
      }
  
    } catch {
      res.send("error??");
    }
  }
});



//login page
app.post('/login', async (req, res) =>{
  let userEmailInput = req.body.userEmailInput;
  let userPasswordInput = req.body.userPasswordInput;

  //verify the user exists at all and check password
  var existsQuery = await pool.query(`SELECT EXISTS(SELECT FROM bgcusers WHERE uemail = '${userEmailInput}' AND upass = '${userPasswordInput}')`);

  //if the user exists, query and confirm the password is correct and set the user session token from the database JSON object of the users information
  if(existsQuery.rows[0].exists){
    var user = await pool.query(`SELECT * FROM BGCUsers WHERE uemail='${userEmailInput}' AND upass='${userPasswordInput}'`);
    req.session.user = user;
    req.session.loggedin = true;
    //if the user is an admin send them to the admin page automatically
    if(req.session.user.rows[0].admin){
      res.redirect('/adminPage');
     }
     //if the user is not an admin, redirect them to the main user page
     else {
      res.redirect('/userPage');
     }
  }
  //if the user does not exist, redirect to error page login failed
  else{
    res.render('/failedLoginPage');
  }
});

//logout function to destroy token when /logout is accessed 
app.post('/logout', (req,res)=>{
  req.session.loggedin = false;
  req.session.destroy((err)=>{
    res.redirect('/login')
  })
})

//redirects to user page url if logged in, else back to login page
app.get('/userPage', (req, res)=>{
  if(req.session.user){
    res.render('pages/userPage')
  } else {
    res.redirect('/login')
  }
  res.end();
})

app.get('/adminPage', (req,res)=>{

//redirects to login page to prevent access to admin page from url and hide undefined rows error
if(req.session.user === undefined){
  res.redirect('/login')
}

//redirect to admin page if JSON token has admin flag set to true (an admin)
 if(req.session.user.rows[0].admin){
  res.render('pages/adminPage');
 }

//redirect back to regular user page if JSON token admin flag is set to false (not an admin)
 else if(req.session.user){
  res.redirect('/userPage');
 } 

 //redirect back to login if user not logged in
 else {
   res.redirect('/login')
 }

})

app.get('/tokenDump', (req,res)=>{

  //for debugging, will dump JSON token assigned to the user session by the server
  res.send(req.session.user.rows[0]);
  
})







