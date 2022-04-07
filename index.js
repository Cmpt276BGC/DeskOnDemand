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
var AgGrid = require('ag-grid-enterprise');

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


// temp desks page
app.get('/desks', (req, res) => {
  res.render('pages/desks');
});

// temp second floor SVG
app.get('/f2', (req, res) => {
  res.render('pages/floor2');
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

// bgcusers to json test code
app.get('/desksjson', async (req,res)=>{
  try {
    const desksQueryResult = await pool.query(`SELECT * FROM bgctables`);
    const allDesks = { 'deskRows': desksQueryResult.rows };
    res.json(desksQueryResult.rows);
  } catch(error) {
    res.send(error);
  }
});


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
              res.redirect("/db");
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
app.get('/manageDesks', async (req,res)=>{
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
  
  let {inputNewType, inputNewWindow, inputNewCorner} = req.body;
  let errors = [];  // form validation
  
  try {
    const deskUpdateQueryResult = await pool.query(`UPDATE bgctables SET type='${inputNewType}', haswindow='${inputNewWindow}', corner='${inputNewCorner}' WHERE tableid='${tableID}'`);
    req.flash('success_msg', "Workstation information successfully updated!");
    res.redirect('/manageDesks');
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
    res.redirect('/manageDesks');
  } catch (error) {
    res.send(error);
  }
});

app.get('/users/admindash/editUserInfo/:uemail', async (req, res) => {
  try{  
    var uemail = req.params.uemail;
    const editUserInfoClient = await pool.connect();
    const editUserInfoQuery = await editUserInfoClient.query(`select * from bgcusers where uemail='${uemail}'`);
    const editUserInfoQueryResults = {'editUserInfoQueryResults' : editUserInfoQuery.rows};
    res.render('pages/editUser', editUserInfoQueryResults);
    editUserInfoClient.release();
  } catch(err){
    res.send(err);
  }
})

function adminCheck(admin) {
  if(admin===''){
    return ``
  } else {
    return ` , admin='${admin}'`
  }
}

app.post('/updateUserInfo', async (req, res) => {
  try{
    
    var fname = req.body.fname;
    var lname = req.body.lname;
    var email = req.body.uemail;
    var password = req.body.password;
    var admin = req.body.admin;

    var adminChecked = adminCheck(admin);

    console.log(fname)
    console.log(lname)
    console.log(email)
    console.log(password)
    console.log(admin)

    if(password===''){
      const emptyPWUpdate = await pool.connect();
      const emptyPWQuery = await emptyPWUpdate.query(`update bgcusers set fname='${fname}', lname='${lname}'` + adminChecked + ` where uemail='${email}'`)
      req.flash("Information Updated")
      res.redirect(`/users/admindash/editUserInfo/${email}`)
    } else {
      const filledPWUpdate = await pool.connect();
      var hashedPW = await bcrypt.hash(password, 10);
      const filledPWQuery = await filledPWUpdate.query(`update bgcusers set fname='${fname}', lname='${lname}', upass='${hashedPW}'` + adminChecked + ` where uemail='${email}'`)
      req.flash("Information Updated")
      res.redirect(`/users/admindash/editUserInfo/${email}`)
    }
    
  } catch(err) {
    res.send(err)
  }
})

app.get('/users/admindash/viewUserBookings/:uemail', async (req, res) => {
  try{
    var uemail = req.params.uemail;
    const viewUserBookings = await pool.connect();
    const viewUserBookingsQuery = await viewUserBookings.query(`SELECT * FROM BGCBOOKINGS WHERE uemail='${uemail}'`)

    let emailJSON = {'uemail' : uemail}

    var viewUserBookingsQueryResults = {'viewUserBookingsQueryResults' : viewUserBookingsQuery.rows, emailJSON}
    console.log(uemail)
    console.log(viewUserBookingsQueryResults)
    res.render('pages/viewUserBookings', viewUserBookingsQueryResults)
    viewUserBookings.release();
  } catch(err) {
    res.send(err)
  }
})

app.post('/users/admindash/deleteUserBooking', async (req, res) =>{
  try{
    var uniqueIDToDelete = req.body.deleteID
    var uemailForNext = req.body.uemail
    const deleteUserBooking = await pool.connect();
    const deleteUserBookingQuery = await deleteUserBooking.query(`DELETE FROM bgcbookings where uniqueid='${uniqueIDToDelete}'`)
    console.log(uemailForNext)
    req.flash('success_msg', "Booking successfully deleted!");
    res.redirect(`/users/admindash/viewUserBookings/${uemailForNext}`);
    deleteUserBooking.release();
  } catch(err) {
    res.send(err)
  }
})


//SEARCH FUNCTIONALITY

//Check functions
function workstationCheck(workstationType){
  if(workstationType==='any'){
    return ``
  } else {
    return ` workstationtype='${workstationType}' and`
  }
}

function floorCheck(floor){
  if(floor==='any'){
    return ``
  } else {
    return ` floor='${floor}' and`
  }
}

function windowCheck(window){
  if(window==='true'){
    return ` haswindow='t' and`
  } else {
    return ``
  }
}

function cornerCheck(corner){
  if(corner==='true'){
    return ` corner='t' and`
  } else {
    return ``
  }
}

//search for specific date
app.post('/searchTablesSpecificDate', async (req, res) =>{
  try{
    const searchTablesClient = await pool.connect();
    
    //set javascript calendar datetime to align with sql default datetime value
    var specificDate = new Date(req.body.specificDate);
    var specificDateEnd = new Date(req.body.specificDate);
    specificDateEnd.setDate(specificDate.getDate() + 1);
    var specificDateISOString = specificDate.toISOString().split('T')[0];
    var specificDateEndISOString = specificDateEnd.toISOString().split('T')[0];

    var permanentBooking = req.body.permanent;
    
    if(permanentBooking=='true'){
      specificDateEndISOString = '2999-12-31'
    }

    //variables
    var floor = req.body.floor;
    
    var window = req.body.window;
    if(window==undefined){
      window='false'
    }
    var corner = req.body.corner;
    if(corner==undefined){
      corner='false'
    }

    var workstationType = req.body.workstationType;
    

    let dates ={
      nextFromDate: specificDateISOString,
      nextToDate: specificDateEndISOString
    }
 
    //checks whether values are selected or not, if values are unselected or marked as "any" then not included in sql query
    var workstationChecked = workstationCheck(workstationType);
    var floorChecked = floorCheck(floor);
    var windowChecked = windowCheck(window);
    var cornerChecked = cornerCheck(corner);
    
    var query = await searchTablesClient.query(`select tableid from bgctables a where` + workstationChecked + floorChecked + windowChecked + cornerChecked + ` not exists (select 1 from bgcbookings b where a.tableid=b.tableid and ('${specificDateISOString}' between fromdate and todate or '${specificDateEndISOString}' between fromdate and todate));`) 
    var queryResults = {'queryResults' : query.rows, dates}
    
    if(query.rows.length>0){
      res.render('pages/queryResults', queryResults)
    } else {
      res.redirect('/noResultsForSearch')
    }
    
    searchTablesClient.release();

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

    var toDate = new Date(req.body.toDate);
    var toDateISOString = toDate.toISOString().split('T')[0];

    console.log(toDateISOString)

    //variables
    var floor = req.body.floor;
    
    var window = req.body.window;
    if(window==undefined){
      window='false'
    }
    var corner = req.body.corner;
    if(corner==undefined){
      corner='false'
    }
    var workstationType = req.body.workstationType;

   //create date object to merge with query results to be sent to next page and allow for smooth booking

   let dates = {
     nextFromDate: fromDateISOString,
     nextToDate: toDateISOString
   }

   var dateCheck = fromDateISOString.localeCompare(toDateISOString)

   if(dateCheck>-1){
     res.redirect('back')
   }

   //checks whether values are selected or not, if values are unselected or marked as "any" then not included in sql query
   var workstationChecked = workstationCheck(workstationType);
   var floorChecked = floorCheck(floor);
   var windowChecked = windowCheck(window);
   var cornerChecked = cornerCheck(corner);

   var query = await searchTablesDateRangeClient.query(`select tableid from bgctables a where` + workstationChecked + floorChecked + windowChecked + cornerChecked + ` not exists (select 1 from bgcbookings b where a.tableid=b.tableid and ('${fromDateISOString}' between fromdate and todate or '${toDateISOString}' between fromdate and todate));`) 
   var queryResults = {'queryResults' : query.rows, dates}
   
   if(query.rows.length>0){
     res.render('pages/queryResults', queryResults)
   } else {
     res.redirect('/noResultsForSearch')
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
  console.log(tableid);
  var userEmail = req.user.uemail;
  var bookFromDate = req.body.fromDate;
  var bookToDate = req.body.toDate;
  console.log(bookFromDate);
  console.log(bookToDate);
  const generateUniqueId = require('generate-unique-id');
  let id = generateUniqueId({
    excludeSymbols: ['0','#','@','|'],
    length: 10
  });
  console.log(id);
  
  //query
  const bookTableQuery = bookingClient.query(`insert into bgcbookings values('${id}','${tableid}', '${userEmail}', '${bookFromDate}', '${bookToDate}')`)

  req.flash('success_msg', "Workstation successfully booked!");
  res.redirect('/users/dashboard')
  bookingClient.release();
})

app.post('/adminbooking', async (req,res)=>{
  
  const bookingClient = await pool.connect();
  let errors = [];  // form validation

  //variables
  var tableid = req.body.IDtoSend;
  console.log(tableid);
  var email = req.body.useremail;
  var bookFromDate = req.body.startDate;
  var bookToDate = req.body.endDate;

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
      const generateUniqueId = require('generate-unique-id');
      let id = generateUniqueId({
        excludeSymbols: ['0','#','@','|'],
        length: 10
      });
    console.log(id);

      console.log(results.rows);  // debugging

      if (results.rows.length == 0) {
        errors.push({ message: "Email not registered" });
      } else {
        bookingClient.query(`insert into bgcbookings values( '${id}','${tableid}', '${email}', '${bookFromDate}', '${bookToDate}')`);
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
  var tableidcancellation = req.body.title;
  console.log(tableidcancellation);
  try{
    const cancelBooking= await pool.connect();
    const cancel = await cancelBooking.query(`DELETE from bgcbookings where uniqueid='${tableidcancellation}'`);
  }catch(err){
    res.send(err);
  }

  try{
    const bookedworkstations = await pool.connect();
    const booked = await bookedworkstations.query(`SELECT * from bgcbookings where uemail='${req.user.uemail}'`);
    const bookedResults = {'bookedResults':(booked) ?  booked.rows: null};
    //res.redirect('/users/dashboard');
     if(booked.rows.length>0){
      res.render('pages/bookedWorkstations',bookedResults);
      }
      else{
        res.render('pages/nobookedWorkstation')
      } 

  }catch(err){
    res.send(err);
  }
   

})


// environment listen
app.listen(PORT, () => console.log(`Listening on ${ PORT }`));

module.exports = app; // need for testing

