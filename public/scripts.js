//Function to check if passwords are matching
var password = document.getElementById("password")
  , confirm_password = document.getElementById("confirm_password");

function validatePasswordMatch(){
  if(password.value != confirm_password.value) {
    confirm_password.setCustomValidity("Passwords don't match.");
  } else {
    confirm_password.setCustomValidity('');
  }
}

password.onchange = validatePasswordMatch;
confirm_password.onkeyup = validatePasswordMatch;

//Function to display error message if email is duplicate



