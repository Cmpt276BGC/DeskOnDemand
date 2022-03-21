const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
const session = require('express-session')

var bodyParser = require('body-parser');

const { Pool } = require('pg');
const res = require('express/lib/response');
const { request } = require('http');
const { user } = require('pg/lib/defaults');
const { error } = require('console');
var pool;
pool = new Pool({
  //connectionString: process.env.DATABASE_URL,
  //connectionString: 'postgres://postgres:1433@localhost/bgc',  // emmii's local database
  connectionString: 'postgres://postgres:Jojek2020.@localhost/dod', //matts local db
  //connectionString: 'postgres://postgres:Reset123@localhost/bgcuser'
  //ssl: {
  //  rejectUnauthorized: false
  //}
  
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
  
  //redirects user back to original register page and prevents the submission of the registration with mismatched passwords.
  //error message is displayed with javascript function
  if(newUserPasswordInput != newUserConfirmedPasswordInput){
    return;
  }

  //redirects user back to original register page and prevents the submission of invalid password lengths
  //error message is handled with html validation
  if(newUserPasswordInput.length < 8 || newUserPasswordInput.length > 32){
    return;
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
        res.redirect('/login');
      }
  
    } catch {
      res.send("error");
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
    res.render('pages/failedLoginPage');
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

//SEARCH FUNCTIONALITY

app.post('/searchTablesSpecificDate', async (req, res) =>{
  try{
    const searchTablesClient = await pool.connect();
    
    //set javascript calendar datetime to align with sql default datetime value
    var specificDate = new Date(req.body.specificDate);
    var specificDateISOString = specificDate.toISOString().split('T')[0];

    //variables
    var floor = req.body.floor;
    
    var office = req.body.office;
    if(office==undefined){
      office='false'
    }
    var window = req.body.window;
    if(window==undefined){
      window='false'
    }
    var corner = req.body.corner;
    if(corner==undefined){
      corner='false'
    }
    var cubicle = req.body.cubicle;
    if(cubicle==undefined){
      cubicle='false'
    }
    var single = req.body.single;
    if(single==undefined){
      single='false'
    }
    var double = req.body.double;
    if(double==undefined){
      double='false'
    }

    
    //queries DB for specific date if no specific attributes are selected
    //intended for when people simply want a desk to use
    //complete
    //searches for any floor with no attributes selected
    if(floor === 'any' && office=='false' && window=='false' && corner=='false' && cubicle=='false' && single=='false' && double=='false'){
      const noAttributeSpecificDateQuery = await searchTablesClient.query(`select bgctables.tableid from bgcbookings full join bgctables on bgcbookings.tableid=bgctables.tableid where reserveddate!='${specificDateISOString}' OR reserveddate IS NULL and '${specificDateISOString}' not between fromdate and todate or reserveddate is null and fromdate is null and todate is null ORDER BY tableid;`);
      const noAttributeSpecificDateQueryResults = {'noAttributeSpecificDateQueryResults' : noAttributeSpecificDateQuery.rows };
      if(noAttributeSpecificDateQuery.rows.length>0){
        res.render('pages/noAttributeSpecificDateQueryResults', noAttributeSpecificDateQueryResults)
      } else{
        res.redirect('/noResultsForSearch')
      }
    }
    //complete
    //searches db for specific floor, extra attributes unchecked
    else if(office=='false' && window=='false' && corner=='false' && cubicle=='false' && single=='false' && double=='false'){
      const noAttributeSpecificDateSpecificFloorQuery = await searchTablesClient.query(`select bgctables.tableid from bgcbookings full join bgctables on bgcbookings.tableid=bgctables.tableid where reserveddate!='${specificDateISOString}' AND '${specificDateISOString}' not between fromdate and todate AND floor='${floor}' OR reserveddate IS NULL and '${specificDateISOString}' not between fromdate and todate and floor='${floor}' ORDER BY tableid;`)
      const noAttributeSpecificDateSpecificFloorQueryResults = {'noAttributeSpecificDateSpecificFloorQueryResults' : noAttributeSpecificDateSpecificFloorQuery.rows};
      if(noAttributeSpecificDateSpecificFloorQuery.rows.length>0){
        res.render('pages/noAttributeSpecificDateSpecificFloorQueryResults', noAttributeSpecificDateSpecificFloorQueryResults);
      } else {
        res.redirect('/noResultsForSearch');
      }
    } else{ 
        //searches db for the specific set of attributes, for any kind of floor
        if(floor === 'any'){
          const anyFloorSpecificDateQuery = await searchTablesClient.query(`select bgctables.tableid from bgcbookings full join bgctables on bgcbookings.tableid=bgctables.tableid where reserveddate!='${specificDateISOString}' AND office='${office}' AND haswindow='${window}' AND corner='${corner}' and cubicle='${cubicle}' and single='${single}' and double='${double}' OR reserveddate IS NULL and office='${office}' and haswindow='${window}' and corner='${corner}' and cubicle='${cubicle}' and single='${single}' and double='${double}' ORDER BY tableid;`);
          const anyFloorSpecificDateQueryResults = {'anyFloorSpecificDateQueryResults' :  anyFloorSpecificDateQuery.rows };
          if(anyFloorSpecificDateQuery.rows.length>0){
            res.render('pages/anyFloorSpecificDateQueryResults', anyFloorSpecificDateQueryResults);
          }
          else{
            res.redirect('/noResultsForSearch')
          }
        searchTablesClient.release();
        //searches db for the specific set of attributes for a particular floor
        } else {
          const specificFloorSpecificDateQuery = await searchTablesClient.query(`select bgctables.tableid from bgcbookings full join bgctables on bgcbookings.tableid=bgctables.tableid where reserveddate!='${specificDateISOString}' AND floor='${floor}' AND office='${office}' AND haswindow='${window}' AND corner='${corner}' and cubicle='${cubicle}' and single='${single}' and double='${double}' OR reserveddate IS NULL and floor='${floor}' and office='${office}' and haswindow='${window}' and corner='${corner}' and cubicle='${cubicle}' and single='${single}' and double='${double}' ORDER BY tableid;`);
          const specificFloorSpecificDateQueryResults = {'specificFloorSpecificDateQueryResults' :  specificFloorSpecificDateQuery.rows};
          if(specificFloorSpecificDateQuery.rows.length>0){
            res.render('pages/specificFloorSpecificDateQueryResults', specificFloorSpecificDateQueryResults);
          } else {
          res.redirect('/noResultsForSearch')
          }
       searchTablesClient.release();
     } 
   }

  } catch(err) {
    res.send(err);
  }
})

//function to search for a table which is available for a specific range of dates
app.post('/searchTablesDateRange', async (req,res)=>{
  try{
    const searchTablesDateRangeClient = await pool.connect();
  
    //set javascript calendar datetime to align with sql default datetime value
    var fromDate = new Date(req.body.fromDate);
    var fromDateISOString = fromDate.toISOString().split('T')[0];
    console.log(fromDateISOString);

    var toDate = new Date(req.body.toDate);
    var toDateISOString = toDate.toISOString().split('T')[0];
    console.log(toDateISOString);

    //variables
    var floor = req.body.floor;

    var office = req.body.office;
    if(office==undefined){
    office='false'
    }
    var window = req.body.window;
    if(window==undefined){
      window='false'
    }
    var corner = req.body.corner;
    if(corner==undefined){
      corner='false'
    }
    var cubicle = req.body.cubicle;
    if(cubicle==undefined){
     cubicle='false'
   }
    var single = req.body.single;
    if(single==undefined){
     single='false'
   }
    var double = req.body.double;
   if(double==undefined){
      double='false'
   }

   //searches a range of dates for any floor when all attributes are unchecked
   if(floor === 'any' && office=='false' && window=='false' && corner=='false' && cubicle=='false' && single=='false' && double=='false'){
    const rangeOfDatesQuery = await searchTablesDateRangeClient.query(`select bgctables.tableid from bgcbookings full join bgctables on bgcbookings.tableid=bgctables.tableid where not (fromdate < '${toDateISOString}') and ('${fromDateISOString}' < todate) OR fromdate IS NULL and todate IS NULL order by tableid`);
    const rangeOfDatesQueryResults = {'rangeOfDatesQueryResults' : rangeOfDatesQuery.rows};
    console.log(rangeOfDatesQueryResults);
    if(rangeOfDatesQuery.rows.length > 0){
     res.render('pages/rangeOfDatesNoAttributeQueryResults', rangeOfDatesQueryResults);
    } else {
      res.redirect('/noResultsForSearch');
    }

   } else if(office=='false' && window=='false' && corner=='false' && cubicle=='false' && single=='false' && double=='false'){
     const rangeOfDatesSpecificFloorQuery = await searchTablesDateRangeClient.query(`select bgctables.tableid from bgcbookings full join bgctables on bgcbookings.tableid=bgctables.tableid where not (fromdate < '${toDateISOString}') and ('${fromDateISOString}' < todate) and floor='${floor}' OR fromdate IS NULL and todate IS NULL and floor='${floor}'`);
     const rangeOfDatesSpecificFloorQueryResults = {'rangeOfDatesSpecificFloorQueryResults' : rangeOfDatesSpecificFloorQuery.rows};
     if(rangeOfDatesSpecificFloorQuery.rows.length>0){
       res.render('pages/rangeOfDatesSpecificFloorQueryResults', rangeOfDatesSpecificFloorQueryResults);
     } else{
       res.redirect('/noResultsForSearch');
     }
   } else {
     
    if(floor=='any'){
      const rangeOfDatesSpecificAttributeQuery = await searchTablesDateRangeClient.query(`select bgctables.tableid from bgcbookings full join bgctables on bgcbookings.tableid=bgctables.tableid where not (fromdate < '${toDateISOString}') and ('${fromDateISOString}' < todate) and office='${office}' AND haswindow='${window}' AND corner='${corner}' and cubicle='${cubicle}' and single='${single}' and double='${double}' OR fromdate IS NULL and todate IS NULL and office='${office}' AND haswindow='${window}' AND corner='${corner}' and cubicle='${cubicle}' and single='${single}' and double='${double}' order by tableid`)
      const rangeOfDatesSpecificAttributeQueryResults = {'rangeOfDatesSpecificAttributeQueryResults' : rangeOfDatesSpecificAttributeQuery.rows};
      if(rangeOfDatesSpecificAttributeQuery.rows.length>0){
        res.render('pages/rangeOfDatesSpecificAttributeQueryResults', rangeOfDatesSpecificAttributeQueryResults)
      } else {
        res.redirect('/noResultsForSearch')
      }
    } else {
      const rangeOfDatesSpecificFloorSpecificAttributeQuery = await searchTablesDateRangeClient.query(`select bgctables.tableid from bgcbookings full join bgctables on bgcbookings.tableid=bgctables.tableid where not (fromdate < '${toDateISOString}') and ('${fromDateISOString}' < todate) and floor='${floor}' and office='${office}' AND haswindow='${window}' AND corner='${corner}' and cubicle='${cubicle}' and single='${single}' and double='${double}' OR fromdate IS NULL and todate IS NULL and floor='${floor}' and office='${office}' AND haswindow='${window}' AND corner='${corner}' and cubicle='${cubicle}' and single='${single}' and double='${double}' order by tableid`)
      const rangeofDatesSpecificFloorSpecificAttributeQueryResults = {'rangeOfDatesSpecificFloorSpecificAttributeQueryResults' : rangeOfDatesSpecificFloorSpecificAttributeQuery.rows};
      if(rangeOfDatesSpecificFloorSpecificAttributeQuery.rows.length>0){
        res.render('pages/rangeOfDatesSpecificFloorSpecificAttributeQueryResults', rangeofDatesSpecificFloorSpecificAttributeQueryResults);
      } else {
        res.redirect('/noResultsForSearch');
      }
    }

   }
    
  searchTablesDateRangeClient.release();
  } catch(err) {
    res.send(err);
  }
})

//redirects user to search for range of dates
app.get('/userPageRangeOfDates', (req, res) =>{
  if(req.session.user){
    res.render('pages/userPageRangeOfDatesSearch')
  } else {
    res.redirect('/login')
  }
})

app.get('/noResultsForSearch', (req, res) => {
  res.render('pages/userPageQueryNoResults')
})

app.get('/returnToSearch', (req, res) =>{
  try{
        res.redirect('/userPage');
  } catch(err) {
    res.send(err);
  }
})

//View information about selected workstation from query and book
/*
app.get('/table/:tableid', (req, res) =>{
  try{

  } catch(err) {
    res.render("Error");
  }
})

*/


//remember to ensure booking system adds fromdate and todate 
//EXAMPLE IN DB- reserveddate: 2022-03-10 | fromdate: 2022-03-10 | todate: 2022-03-10
app.post('/booking', async (req,res)=>{
  var tableid = req.body.title;
  console.log(tableid);
  console.log(req.session.user.rows[0].uemail);
  const searchTablesClient = await pool.connect();
    

  //const booking = await searchTablesClient.query(`Insert into bgcbooking values()`)
  res.send("hello")
})




