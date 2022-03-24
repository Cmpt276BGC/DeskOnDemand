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
//
// passport initialization
initializePassport(passport);

// environment variable
const PORT = process.env.PORT || 5000


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

app.get('/users/admindash/manageUsers', checkAuthorization, (req, res) => {
  res.render('pages/manageUsers');
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

app.post('/users/addUser', checkAuthorization, async (req, res) => {

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
    res.render('pages/manageUsers', { errors });
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
          res.render('pages/manageUsers', { errors });
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
              res.redirect("/users/admindash/manageUsers");
            }
          )
        }
      }
    );
  }
});

app.post('/users/updateUser', checkAuthorization, async (req, res) => {

  let {fname, lname, email, password, confirmpw} = req.body;
  let errors = [];  // form validation

  // check that no field(s) left empty
  if (!email) {
    errors.push({ message: "Please fill in an email" });
  }

  if(req.body.fname && req.body.email){
    pool.query (
      `UPDATE bgcusers SET fname = $1 WHERE uemail=$2`, [fname,email], (err, results) => {
        if (err) {
          throw err;
        }
        console.log(results.rows);
        req.flash('success_msg', "Successfully registered, please log in");
        res.redirect("/users/admindash/manageUsers");
      }
    )
  }
    
    if(req.body.lname && req.body.email){
      pool.query (
        `UPDATE bgcusers SET lname = $1 WHERE uemail=$2`, [lname,email], (err, results) => {
          if (err) {
            throw err;
          }
          console.log(results.rows);
          req.flash('success_msg', "Successfully registered, please log in");
          res.redirect("/users/admindash/manageUsers");
        }
      )
    }
    
    if(req.body.password && req.body.email){
        // check password length
      if (password.length < 8) {
        errors.push({ message: "Password must be at least 8 characters" });
      }
        // check password re-entered correctly
      if (password != confirmpw) {
        errors.push({ message: "Passwords do not match" })
      }
      let hashedPW = await bcrypt.hash(password, 10);
      console.log(hashedPW);
        pool.query (
          `UPDATE bgcusers SET upass = $1 WHERE uemail=$2`, [hashedPW,email], (err, results) => {
            if (err) {
              throw err;
            }
            console.log(results.rows);
            req.flash('success_msg', "Successfully registered, please log in");
            res.redirect("/users/admindash/manageUsers");
          }
        )
    }
});

app.post('/addAdmin', checkAuthorization, async (req, res) => {

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
    res.render('pages/manageUsers', { errors });
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
          res.render('pages/manageUsers', { errors });
        } else {
          pool.query (
            `INSERT INTO bgcusers (fname, lname, uemail, upass, admin) 
            VALUES ($1, $2, $3, $4, 't') 
            RETURNING id, upass`, [fname,lname,email,hashedPW], (err, results) => {
              if (err) {
                throw err;
              }
              console.log(results.rows);
              req.flash('success_msg', "Successfully registered, please log in");
              res.redirect("/users/admindash/manageUsers");
            }
          )
        }
      }
    );
  }
});

app.post('/deleteUser', checkAuthorization, async (req, res) => {

  let {fname, lname, email, password, confirmpw} = req.body;
  let errors = [];  // form validation

  // check that no field(s) left empty
  if (!email) {
    errors.push({ message: "Please fill in the email field to delete a user" });
  }

    // check if email exists
    pool.query(
      `SELECT * FROM bgcusers WHERE uemail=$1`, [email], (err, results) => {
        if (err) {
          throw err;
        } 

        console.log(results.rows);

        // email already in database
        if (results.rows.length == 0) {
          errors.push ({ message: "Email not registered" });
          res.render('pages/manageUsers', { errors });
        } else {
          pool.query (
            `DELETE FROM bgcusers WHERE uemail=$1`, [email], (err, results) => {
              if (err) {
                throw err;
              }
              console.log(results.rows);
              req.flash('success_msg', "Successfully registered, please log in");
              res.redirect("/users/admindash/manageUsers");
            }
          )
        }
      }
    );
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

// for troubleshooting purposes - displays bgcusers db data
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

// ADMIN DESK FUNCTIONS

// manage desks
app.get('/desks/manageDesks', async (req,res)=>{
  try {
    const desksQueryResult = await pool.query(`SELECT * FROM bgctables`);
    const allDesks = { 'deskRows': desksQueryResult.rows };
    res.render('pages/manageDesks', allDesks);
  } catch(error) {
    res.send(error);
  }
});

// bookings under admin
app.get('/desks/bookDesks', async(req,res)=>{
  res.redirect('/users/dashboard');
});

// edit desk by id
app.post('/editDesk/:tableid', async (req, res) =>{
  
  var deskIDLookup = req.params.tableid;
  // search the database using the idlookup
  try {
    const deskQueryResult = await pool.query(`SELECT * FROM bgctables WHERE tableid='${deskIDLookup}'`);
    const deskData = { 'deskDataRow' : deskQueryResult.rows };
    res.render('pages/editDesk', deskData);
  } catch (error) {
    res.send(error);
  }
});

// update a desk
app.post('/updateDesk/:tableid', async (req, res) =>{
  const tableID = req.params.tableid;
  
  let {inputNewFloor, inputNewOffice, inputNewWindow, inputNewCorner, inputNewCubicle, inputNewSingle, inputNewDouble} = req.body;
  let errors = [];  // form validation
  
  try {
    const deskUpdateQueryResult = await pool.query(`UPDATE bgctables SET floor='${inputNewFloor}', office='${inputNewOffice}', haswindow='${inputNewWindow}', corner='${inputNewCorner}', cubicle='${inputNewCubicle}', Single='${inputNewSingle}', double='${inputNewDouble}' WHERE tableid='${tableID}'`);
    req.flash('success_msg', "Workstation information successfully updated!");
    res.redirect('/desks/manageDesks');
  }
  catch (error) {
    res.send(error);
  }
});

// delete a workstation
app.post('/delete/:tableid', async (req, res) => {
  const tableIDtoDelete = req.params.tableid;
  try {
    const result = await pool.query(`DELETE FROM bgctables WHERE tableid='${tableIDtoDelete}'`);
    req.flash('success_msg', "Workstation successfully deleted!");
    res.redirect('/desks/manageDesks');
  } catch (error) {
    res.send(error);
  }
});




//SEARCH FUNCTIONALITY

app.post('/searchTablesSpecificDate', async (req, res) =>{
  // admin check
  const isAdmin = req.user.admin;
  try{
    const searchTablesClient = await pool.connect();
    
    //set javascript calendar datetime to align with sql default datetime value
    var specificDate = new Date(req.body.specificDate);
    var specificDateEnd = new Date(req.body.specificDate);
    specificDateEnd.setDate(specificDate.getDate() + 1);
    var specificDateISOString = specificDate.toISOString().split('T')[0];
    var specificDateEndISOString = specificDateEnd.toISOString().split('T')[0];

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

    let dates ={
      nextFromDate: specificDateISOString,
      nextToDate: specificDateEndISOString
    }

    console.log(dates.nextFromDate)
    console.log(dates.nextToDate)

    //queries DB for specific date if no specific attributes are selected
    //intended for when people simply want a desk to use
    //complete
    //searches for any floor with no attributes selected
    if(floor === 'any' && office=='false' && window=='false' && corner=='false' && cubicle=='false' && single=='false' && double=='false'){
      const noAttributeSpecificDateQuery = await searchTablesClient.query(`select tableid from bgctables a where not exists (select 1 from bgcbookings b where a.tableid=b.tableid and ('${specificDateISOString}' between fromdate and todate or '${specificDateEndISOString}' between fromdate and todate));`);
      const noAttributeSpecificDateQueryResults = {'noAttributeSpecificDateQueryResults' : noAttributeSpecificDateQuery.rows, dates, isAdmin};
      console.log(typeof noAttributeSpecificDateQueryResults)
      if(noAttributeSpecificDateQuery.rows.length>0){
        res.render('pages/noAttributeSpecificDateQueryResults', noAttributeSpecificDateQueryResults)
      } else{
        res.redirect('/noResultsForSearch')
      }
    }
    //complete
    //searches db for specific floor, extra attributes unchecked
    else if(office=='false' && window=='false' && corner=='false' && cubicle=='false' && single=='false' && double=='false'){
      const noAttributeSpecificDateSpecificFloorQuery = await searchTablesClient.query(`select tableid from bgctables a where floor='${floor}' and not exists (select 1 from bgcbookings b where a.tableid=b.tableid and ('${specificDateISOString}' between fromdate and todate or '${specificDateEndISOString}' between fromdate and todate));`)
      const noAttributeSpecificDateSpecificFloorQueryResults = {'noAttributeSpecificDateSpecificFloorQueryResults' : noAttributeSpecificDateSpecificFloorQuery.rows, dates, isAdmin};
      if(noAttributeSpecificDateSpecificFloorQuery.rows.length>0){
        res.render('pages/noAttributeSpecificDateSpecificFloorQueryResults', noAttributeSpecificDateSpecificFloorQueryResults);
      } else {
        res.redirect('/noResultsForSearch');
      }
    }
     else{
        //searches db for the specific set of attributes, for any kind of floor
        //complete
        if(floor === 'any'){
          const anyFloorSpecificDateQuery = await searchTablesClient.query(`select tableid from bgctables a where office='${office}' AND haswindow='${window}' AND corner='${corner}' and cubicle='${cubicle}' and single='${single}' and double='${double}' and not exists (select 1 from bgcbookings b where a.tableid=b.tableid and ('${specificDateISOString}' between fromdate and todate or '${specificDateEndISOString}' between fromdate and todate));`);
          const anyFloorSpecificDateQueryResults = {'anyFloorSpecificDateQueryResults' :  anyFloorSpecificDateQuery.rows, dates, isAdmin};
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
          const specificFloorSpecificDateQuery = await searchTablesClient.query(`select tableid from bgctables a where office='${office}' and floor='${floor}' AND haswindow='${window}' AND corner='${corner}' and cubicle='${cubicle}' and single='${single}' and double='${double}' and not exists (select 1 from bgcbookings b where a.tableid=b.tableid and ('${specificDateISOString}' between fromdate and todate or '${specificDateEndISOString}' between fromdate and todate));`);
          const specificFloorSpecificDateQueryResults = {'specificFloorSpecificDateQueryResults' :  specificFloorSpecificDateQuery.rows, dates, isAdmin};
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
  // admin check
  const isAdmin = req.user.admin;
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

   //create date object to merge with query results to be sent to next page and allow for smooth booking

   let dates = {
     nextFromDate: fromDateISOString,
     nextToDate: toDateISOString
   }

   var dateCheck = fromDateISOString.localeCompare(toDateISOString)

   if(dateCheck>-1){
     res.redirect('back')
   }

   //searches a range of dates for any floor when all attributes are unchecked
   if(floor === 'any' && office=='false' && window=='false' && corner=='false' && cubicle=='false' && single=='false' && double=='false'){
    //const rangeOfDatesQuery = await searchTablesDateRangeClient.query(`select bgctables.tableid from bgcbookings full join bgctables on bgcbookings.tableid=bgctables.tableid where not (fromdate < '${toDateISOString}') and ('${fromDateISOString}' < todate) or fromdate IS NULL and todate IS NULL order by tableid`);
    const rangeOfDatesQuery = await searchTablesDateRangeClient.query(`select tableid from bgctables a where not exists (select 1 from bgcbookings b where a.tableid=b.tableid and ('${fromDateISOString}' between fromdate and todate or '${toDateISOString}' between fromdate and todate));`)
    const rangeOfDatesQueryResults = {'rangeOfDatesQueryResults' : rangeOfDatesQuery.rows, dates, isAdmin}
    if(rangeOfDatesQuery.rows.length > 0){
      res.render('pages/rangeOfDatesNoAttributeQueryResults', rangeOfDatesQueryResults)
    } else {
      res.redirect('/noResultsForSearch');
    }
    //searches a range of dates for a particular floor when all attributes are unchecked
   } else if(office=='false' && window=='false' && corner=='false' && cubicle=='false' && single=='false' && double=='false'){
     const rangeOfDatesSpecificFloorQuery = await searchTablesDateRangeClient.query(`select tableid from bgctables a where floor='${floor}' and not exists (select 1 from bgcbookings b where a.tableid=b.tableid and ('${fromDateISOString}' between fromdate and todate or '${toDateISOString}' between fromdate and todate));`);
     const rangeOfDatesSpecificFloorQueryResults = {'rangeOfDatesSpecificFloorQueryResults' : rangeOfDatesSpecificFloorQuery.rows, dates, isAdmin};
     if(rangeOfDatesSpecificFloorQuery.rows.length>0){
       res.render('pages/rangeOfDatesSpecificFloorQueryResults', rangeOfDatesSpecificFloorQueryResults);
     } else{
       res.redirect('/noResultsForSearch');
     }
   } else {
     //searches a range of dates for any floors with the particular attributes selected
    if(floor=='any'){
      const rangeOfDatesSpecificAttributeQuery = await searchTablesDateRangeClient.query(`select tableid from bgctables a where office='${office}' AND haswindow='${window}' AND corner='${corner}' and cubicle='${cubicle}' and single='${single}' and double='${double}' and not exists (select 1 from bgcbookings b where a.tableid=b.tableid and ('${fromDateISOString}' between fromdate and todate or '${toDateISOString}' between fromdate and todate));`)
      const rangeOfDatesSpecificAttributeQueryResults = {'rangeOfDatesSpecificAttributeQueryResults' : rangeOfDatesSpecificAttributeQuery.rows, dates, isAdmin};
      if(rangeOfDatesSpecificAttributeQuery.rows.length>0){
        res.render('pages/rangeOfDatesSpecificAttributeQueryResults', rangeOfDatesSpecificAttributeQueryResults)
      } else {
        res.redirect('/noResultsForSearch')
      }
      //searches a range of dates for a particular floor with particular attributes selected
    } else {
      const rangeOfDatesSpecificFloorSpecificAttributeQuery = await searchTablesDateRangeClient.query(`select tableid from bgctables a where floor='${floor}' and office='${office}' AND haswindow='${window}' AND corner='${corner}' and cubicle='${cubicle}' and single='${single}' and double='${double}' and not exists (select 1 from bgcbookings b where a.tableid=b.tableid and ('${fromDateISOString}' between fromdate and todate or '${toDateISOString}' between fromdate and todate));`)
      const rangeofDatesSpecificFloorSpecificAttributeQueryResults = {'rangeOfDatesSpecificFloorSpecificAttributeQueryResults' : rangeOfDatesSpecificFloorSpecificAttributeQuery.rows, dates, isAdmin};
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
        res.redirect('/users/dashboard');
  } catch(err) {
    res.send(err);
  }
})


app.post('/booking', async (req,res)=>{
  
  const bookingClient = await pool.connect();

  //variables
  var tableid = req.body.title;
  var userEmail = req.user.uemail;
  var bookFromDate = req.body.fromDate;
  var bookToDate = req.body.toDate;
  console.log(bookFromDate);
  console.log(bookToDate);
  
  //query
  const bookTableQuery = bookingClient.query(`insert into bgcbookings values('${tableid}', '${userEmail}', '${bookFromDate}', '${bookToDate}')`)

  req.flash('success_msg', "Workstation successfully booked!");
  res.redirect('/users/dashboard')
  bookingClient.release();
})


app.post('/adminbooking', async (req,res)=>{
  
  const bookingClient = await pool.connect();
  let errors = [];  // form validation

  //variables
  var tableid = req.body.title;
  var email = req.body.useremail;
  var bookFromDate = req.body.startDate;
  var bookToDate = req.body.endDate;
  console.log(bookFromDate);
  console.log(bookToDate);

  // check that no field(s) left empty
  if (!email) {
    errors.push({ message: "Please fill in an email" });
  }

  // check if email exists
  pool.query(
    `SELECT * FROM bgcusers WHERE uemail=$1`, [email], (err, results) => {
      if (err) {
        throw err;
      } 

      console.log(results.rows);  // debugging

      if (results.rows.length == 0) {
        errors.push({ message: "Email not registered" });
      } else {
        bookingClient.query(`insert into bgcbookings values('${tableid}', '${email}', '${bookFromDate}', '${bookToDate}')`);
        req.flash('success_msg', "Workstation successfully booked!");
        res.redirect('/users/admindash')
        bookingClient.release();
      }
    }
  );
  
});

app.get('/bookedworkstations', async (req, res) => {
  try{
    const bookedworkstations = await pool.connect();
    const booked = await bookedworkstations.query(`SELECT * from bgcbookings where uemail='${req.user.uemail}'`);
    const bookedResults = {'bookedResults':(booked) ?  booked.rows: null};
    if(booked.rows.length>0){
    res.render('pages/bookedWorkstations',bookedResults);
    }
    else{
      res.render('pages/nobookedWorkstation')
    }
  }catch(err){
    res.send('error')
  }


})
// Not woking in process -Bhavneet
app.post('/cancelBooking', async (req,res)=>{
  var tableidcancellation = req.body.cancel;
  var fromDatebook = req.body.fromDate;
  var toDatebook = req.body.toDate;
  console.log(tableidcancellation);
  try{
    const cancelBooking= await pool.connect();
    const cancel = await cancelBooking.query(`DELETE from bgcbookings where tableid='${tableidcancellation}' AND uemail='${req.user.email}' AND fromdate='${fromDatebook} AND todate='${toDatebook}'`);
    res.redirect('/users/dashboard');
  }catch(err){
    res.send(err);
  }
   

})
  

// environment listen
app.listen(PORT, () => console.log(`Listening on ${ PORT }`));

module.exports = app; // need for testing

