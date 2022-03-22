const express = require('express');
const app = express();
const { pool } = require("./dbConfig");  // dbConfig.js has database configurations
const path = require('path');
const { request } = require('http');  // required so that http can be omitted
const bcrypt = require('bcrypt');  // for password hashing
const session = require('express-session');  // for session authentication
const flash = require('express-flash');   // for flash messages
const passport = require('passport');  // passportJS package
const initializePassport = require("./passportConfig");  // passport configurations
const cors = require("cors") // cross-origin resource sharing

const res = require('express/lib/response');
const { error } = require('console');
var bodyParser = require('body-parser');

// passport initialization
initializePassport(passport);

// environment variable
const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Listening on ${ PORT }`));

// middlewares
app.set('view engine', 'ejs');  // use ejs view engine to render ejs files
app.use(express.urlencoded({extended:false}));
app.use(express.json());
app.use(session({
  secret: 'this is the way', 
  resave: false, // if nothing is changed, do not resave
  saveUninitialized: false, // if empty, do not save
  maxAge: 30 * 60 * 1000, // 30 minutes
})) 
app.use(passport.initialize());  // sets up passport to use in our app
app.use(passport.session());
app.use(flash());  // use flash messages
app.use(express.static(path.join(__dirname, 'public')));
app.use('/public', express.static('public'));


app.set('views', path.join(__dirname, 'views'));
app.use("/", cors());

// main page
app.get('/', (req, res) => {
  res.render('pages/main');
});

app.get('/users/register', checkAuthenticated, (req, res) => {
  res.render('pages/register');
});

app.get('/users/login', checkAuthenticated, (req, res) => {
  res.render('pages/login');
});

app.get('/users/adminlogin', checkAuthenticated, (req, res) => {
  res.render('pages/adminlogin');
});

app.get('/users/dashboard', checkNotAuthenticated, (req, res) => {
  res.render('pages/dashboard', { user: req.user.fname });
});

app.get('/users/admindash', checkAuthorization, (req, res) => {
  res.render('pages/admindash', { user: req.user.fname });
});

app.get('/users/logout', checkNotAuthenticated, async (req, res) => {
  req.logOut();  // function within passport
  req.flash('success_msg', "Successfully logged out");
  res.redirect('/users/login');
})

app.post('/users/register', async (req, res) => {
  let {fname, lname, email, password, confirmpw} = req.body;

  let errors = [];  // form validation

  // check that no field(s) left empty
  if (!fname || !lname || !email || !password || !confirmpw) {
    errors.push({ message: "Please fill in all fields" });
  }

  // check password length
  if (password.length < 8) {
    errors.push({ message: "Password must be at least 8 characters" });
  }

  // check password re-entered correctly
  if (password != confirmpw) {
    errors.push({ message: "Passwords do not match" })
  }

  // if any validation checks resulted in error
  if (errors.length > 0) {
    res.render('pages/register', { errors });
  } else {  // passed validation checks
    // hash password
    let hashedPW = await bcrypt.hash(password, 10);  // hashed 10 times
    console.log(hashedPW);

    // check if email already exists
    pool.query(
      `SELECT * FROM bgcusers WHERE uemail=$1`, [email], (err, results) => {
        if (err) {
          throw err;
        } 

        console.log(results.rows);

        // email already in database
        if (results.rows.length > 0) {
          errors.push ({ message: "Email already registered" });
          res.render('pages/register', { errors });
        } else {
          pool.query (
            `INSERT INTO bgcusers (fname, lname, uemail, upass, admin) 
            VALUES ($1, $2, $3, $4, 'f') 
            RETURNING id, upass`, [fname,lname,email,hashedPW], (err, results) => {
              if (err) {
                throw err;
              }
              console.log(results.rows);
              req.flash('success_msg', "Successfully registered, please log in");
              res.redirect("/users/login");
            }
          )
        }
      }
    );
  }
});


// regular user login
app.post(
  "/users/login", 
  passport.authenticate('local', {
    successRedirect: "/users/dashboard",
    failureRedirect: "/users/login",
    failureFlash: true  // if authentication fails, pass in message (from err)
  })
);

// admin user login
app.post(
  "/users/adminlogin", 
  passport.authenticate('local', {
    successRedirect: "/users/admindash",
    failureRedirect: "/users/adminlogin",
    failureFlash: true  // if authentication fails, pass in message (from err)
  })
);

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {  // function within passport
    // redirects to dashboard if user IS authenticated
    return res.redirect('/users/dashboard');
  }
  next();  // otherwise, goes to next piece of middleware
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { 
    return next();
  }
  res.redirect('/users/login');
}


// if user is admin
function checkAuthorization(req, res, next) {
  if (req.isAuthenticated() && (req.user.admin)) {
      return next();
  }
  return res.redirect('/users/dashboard');
}



// emmii's note-to-self: DO NOT DELETE BEYOND THIS POINT!!!!!!



// ADMIN FUNCTIONS

// view as regular user
app.get('/regularUser', (req,res)=>{
  res.redirect('users/dashboard');
});

// register for another employee
app.get('/registerNew', (req,res)=>{
   res.redirect('users/register');
 
});


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
      const noAttributeSpecificDateQuery = await searchTablesClient.query(`select bgctables.tableid from bgcbookings full join bgctables on bgcbookings.tableid=bgctables.tableid where reserveddate!='${specificDateISOString}' and '${specificDateISOString}' not between fromdate and todate or reserveddate is null and fromdate is null and todate is null ORDER BY tableid;`);
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
      const noAttributeSpecificDateSpecificFloorQuery = await searchTablesClient.query(`select bgctables.tableid from bgcbookings full join bgctables on bgcbookings.tableid=bgctables.tableid where reserveddate!='${specificDateISOString}' AND '${specificDateISOString}' not between fromdate and todate AND floor='${floor}' or reserveddate is null and fromdate is null and todate is null and floor='${floor}' ORDER BY tableid;`)
      const noAttributeSpecificDateSpecificFloorQueryResults = {'noAttributeSpecificDateSpecificFloorQueryResults' : noAttributeSpecificDateSpecificFloorQuery.rows};
      if(noAttributeSpecificDateSpecificFloorQuery.rows.length>0){
        res.render('pages/noAttributeSpecificDateSpecificFloorQueryResults', noAttributeSpecificDateSpecificFloorQueryResults);
      } else {
        res.redirect('/noResultsForSearch');
      }
    } else{ 
        //searches db for the specific set of attributes, for any kind of floor
        //complete
        if(floor === 'any'){
          const anyFloorSpecificDateQuery = await searchTablesClient.query(`select bgctables.tableid from bgcbookings full join bgctables on bgcbookings.tableid=bgctables.tableid where reserveddate!='${specificDateISOString}' and '${specificDateISOString}' not between fromdate and todate AND office='${office}' AND haswindow='${window}' AND corner='${corner}' and cubicle='${cubicle}' and single='${single}' and double='${double}' OR reserveddate IS NULL and fromdate is null and todate is null and office='${office}' and haswindow='${window}' and corner='${corner}' and cubicle='${cubicle}' and single='${single}' and double='${double}' ORDER BY tableid;`);
          const anyFloorSpecificDateQueryResults = {'anyFloorSpecificDateQueryResults' :  anyFloorSpecificDateQuery.rows };
          if(anyFloorSpecificDateQuery.rows.length>0){
            res.render('pages/anyFloorSpecificDateQueryResults', anyFloorSpecificDateQueryResults);
          }
          else{
            res.redirect('/noResultsForSearch')
          }
        searchTablesClient.release();
        //searches db for the specific set of attributes for a particular floor
        //complete
        } else {
          const specificFloorSpecificDateQuery = await searchTablesClient.query(`select bgctables.tableid from bgcbookings full join bgctables on bgcbookings.tableid=bgctables.tableid where reserveddate!='${specificDateISOString}' and '${specificDateISOString}' not between fromdate and todate AND floor='${floor}' AND office='${office}' AND haswindow='${window}' AND corner='${corner}' and cubicle='${cubicle}' and single='${single}' and double='${double}' OR reserveddate IS NULL and fromdate is null and todate is null and floor='${floor}' and office='${office}' and haswindow='${window}' and corner='${corner}' and cubicle='${cubicle}' and single='${single}' and double='${double}' ORDER BY tableid;`);
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
app.post('/searchTablesDateRange',  async (req,res)=>{
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
    //const rangeOfDatesQuery = await searchTablesDateRangeClient.query(`select bgctables.tableid from bgcbookings full join bgctables on bgcbookings.tableid=bgctables.tableid where not (fromdate < '${toDateISOString}') and ('${fromDateISOString}' < todate) or fromdate IS NULL and todate IS NULL order by tableid`);
    const rangeOfDatesQuery = await searchTablesDateRangeClient.query(`select bgctables.tableid from bgcbookings full join bgctables on bgcbookings.tableid=bgctables.tableid where '${fromDateISOString}' not between fromdate and todate and '${toDateISOString}' not between fromdate and todate or fromdate is null and todate is null order by tableid`)
    const rangeOfDatesQueryResults = {'rangeOfDatesQueryResults' : rangeOfDatesQuery.rows};
    console.log(rangeOfDatesQueryResults);
    if(rangeOfDatesQuery.rows.length > 0){
     res.render('pages/rangeOfDatesNoAttributeQueryResults', rangeOfDatesQueryResults);
    } else {
      res.redirect('/noResultsForSearch');
    }
    //searches a range of dates for a particular floor when all attributes are unchecked
   } else if(office=='false' && window=='false' && corner=='false' && cubicle=='false' && single=='false' && double=='false'){
     const rangeOfDatesSpecificFloorQuery = await searchTablesDateRangeClient.query(`select bgctables.tableid from bgcbookings full join bgctables on bgcbookings.tableid=bgctables.tableid where '${fromDateISOString}' not between fromdate and todate and '${toDateISOString}' not between fromdate and todate OR fromdate IS NULL and todate IS NULL and floor='${floor}'`);
     const rangeOfDatesSpecificFloorQueryResults = {'rangeOfDatesSpecificFloorQueryResults' : rangeOfDatesSpecificFloorQuery.rows};
     if(rangeOfDatesSpecificFloorQuery.rows.length>0){
       res.render('pages/rangeOfDatesSpecificFloorQueryResults', rangeOfDatesSpecificFloorQueryResults);
     } else{
       res.redirect('/noResultsForSearch');
     }
   } else {
     //searches a range of dates for any floors with the particular attributes selected
    if(floor=='any'){
      const rangeOfDatesSpecificAttributeQuery = await searchTablesDateRangeClient.query(`select bgctables.tableid from bgcbookings full join bgctables on bgcbookings.tableid=bgctables.tableid where '${fromDateISOString}' not between fromdate and todate and '${toDateISOString}' not between fromdate and todate and office='${office}' AND haswindow='${window}' AND corner='${corner}' and cubicle='${cubicle}' and single='${single}' and double='${double}' OR fromdate IS NULL and todate IS NULL and office='${office}' AND haswindow='${window}' AND corner='${corner}' and cubicle='${cubicle}' and single='${single}' and double='${double}' order by tableid`)
      const rangeOfDatesSpecificAttributeQueryResults = {'rangeOfDatesSpecificAttributeQueryResults' : rangeOfDatesSpecificAttributeQuery.rows};
      if(rangeOfDatesSpecificAttributeQuery.rows.length>0){
        res.render('pages/rangeOfDatesSpecificAttributeQueryResults', rangeOfDatesSpecificAttributeQueryResults)
      } else {
        res.redirect('/noResultsForSearch')
      }
      //searches a range of dates for a particular floor with particular attributes selected
    } else {
      const rangeOfDatesSpecificFloorSpecificAttributeQuery = await searchTablesDateRangeClient.query(`select bgctables.tableid from bgcbookings full join bgctables on bgcbookings.tableid=bgctables.tableid where '${fromDateISOString}' not between fromdate and todate and '${toDateISOString}' not between fromdate and todate and floor='${floor}' and office='${office}' AND haswindow='${window}' AND corner='${corner}' and cubicle='${cubicle}' and single='${single}' and double='${double}' OR fromdate IS NULL and todate IS NULL and floor='${floor}' and office='${office}' AND haswindow='${window}' AND corner='${corner}' and cubicle='${cubicle}' and single='${single}' and double='${double}' order by tableid`)
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
app.get('/userPageRangeOfDates', checkNotAuthenticated, (req, res) =>{
  res.render('pages/userPageRangeOfDatesSearch');
  
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




module.exports = app; // need for testing

