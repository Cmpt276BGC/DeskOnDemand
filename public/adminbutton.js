// admin booking only enabled for admins
function adminButton(){
  const isAuthorized = document.getElementById("authorized").value;
  if (!isAuthorized) {
    document.getElementById("adminButton").disabled = true;
  }
};
adminButton();
