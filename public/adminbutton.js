var radios = document.forms["radioform"].elements["title"];
var IDtoSend = document.getElementById("IDtoSend");

// admin booking only enabled for admins
function adminButton(){
  const isAuthorized = document.getElementById("authorized").value;
  console.log(isAuthorized);
  if (isAuthorized != "true") {
    document.getElementById("adminButton").type = "hidden";
    document.getElementById("useremailLookup").type = "hidden";
  }
};

for (var i = 0; i<radios.length; i++) {
  radios[i].onclick = function(){
    IDtoSend.value = this.value;
    console.log(this.value);
  }
}

adminButton();

function floorplan(evt, floor) {
  // Declare all variables
  var i, tabcontent, tablinks;

  // Get all elements with class="tabcontent" and hide them
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  // Get all elements with class="tablinks" and remove the class "active"
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // Show the current tab, and add an "active" class to the button that opened the tab
  document.getElementById(floor).style.display = "block";
  evt.currentTarget.className += " active";
}


var table = document.getElementsByName('title')
var tableid = document.getElementsByClassName('workstation');
for(let i=0;i<table.length;i++){
  console.log(table[i].value.length);
}

 let newtable=[];
for(let i=0;i<table.length;i++){
  for(let j=0;j<table[i].value.length;j++){
      if(table[i].value[j]==" "){
        newtable[i]=table[i].value.substring(0,j)
        break;
      }
  }
}
for(let i=0;i<newtable.length;i++){
  console.log(newtable[i].length);
}


  for(let i=0;i<tableid.length;i++){
  for(let j=0;j<newtable.length;j++){
    if(tableid[i].attributes.id.value==newtable[j]){
      console.log('hello')
        tableid[i].setAttribute('style', 'fill:green;stroke-width:2;stroke:rgb(0,0,0)')
    }
  }
}  
