var radios = document.forms["radioform"].elements["title"];
var IDtoSend = document.getElementById("IDtoSend");

function updateIDtoSend() {
  IDtoSend.value = selectedID.value;
  console.log(IDtoSend.value);
}

// admin booking only enabled for admins
function adminButton(){
  const isAuthorized = document.getElementById("authorized").value;
  console.log(isAuthorized);
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
// selectedID.addEventListener('change', updateIDtoSend);

adminButton();
