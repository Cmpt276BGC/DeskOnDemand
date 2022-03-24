var radios = document.forms["radioform"].elements["title"];
var IDtoSend = document.getElementById("IDtoSend");

// admin booking only enabled for admins
function adminButton(){
  const isAuthorized = document.getElementById("authorized").value;
 
  if (isAuthorized != "true") {
    document.getElementById("adminButton").disabled = true;
  }
};

for (var i = 0; i<radios.length; i++) {
  radios[i].onclick = function(){
    IDtoSend.value = this.value;
    console.log(this.value);
  }
}

adminButton();
