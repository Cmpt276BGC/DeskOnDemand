const localStrategy = require('passport-local').Strategy;
const { pool } = require('./dbConfig');
const bcrypt = require('bcrypt');

function initialize(passport) {
  const authenticateUser = (email, password, done) => {
    pool.query(
      `SELECT * FROM bgcusers WHERE uemail = $1`, [email], (err,results) => {
        if (err) {
          throw err;
        }
        console.log(results.rows);  // for troubleshooting purposes

        // if email in database
        if (results.rows.length > 0) {
          const user = results.rows[0];  // first element of list
          bcrypt.compare(password, user.upass, (err, isMatch) => {
            if (err) {
              throw err;
            }

            if (isMatch) {
              return done(null, user);
            } else {
              return done(null, false, { message: "Incorrect password" });  // passport stores these messages as error messages
            }
          });
        } else {  // if email not in database
          return done(null, false, { message: "Email is not registered" });
        }
      }
      );
  };

  passport.use(
    new localStrategy(
      {
        usernameField: "email",
        passwordField: "password"
      },
      authenticateUser
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser((id, done) => {
    pool.query (`SELECT * FROM bgcusers WHERE id=$1`, [id], (err, results) => {
        if (err) {
          throw err;
        }
        return done(null, results.rows[0]);
    });
  });
}

module.exports = initialize;  // export the function created above
