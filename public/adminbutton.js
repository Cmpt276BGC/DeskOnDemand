
// admin booking only enabled for admins
function adminButton(){
  const isAuthorized = document.getElementById("authorized").value;
  console.log(isAuthorized);
  if (isAuthorized != "true") {
    document.getElementById("adminButton").disabled = true;
  }
};

adminButton();
