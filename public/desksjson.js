var tableid = document.getElementById('tableid');

// specify the columns
const columnDefs = [
    { headerName: 'Table ID', field: "tableid", sortable: true, filter: true, checkboxSelection: true },
    { field: "floor", sortable: true, filter: true },
    { field: "type", sortable: true, filter: true },
    { headerName: 'Has Window', field: "haswindow", sortable: true, filter: true},
    { headerName: 'Is Corner', field: "corner", sortable: true, filter: true},
  ];

  // let the grid know which columns to use
  const gridOptions = {
    columnDefs: columnDefs,
    onCellMouseOver: cellMouseOver,
    onCellMouseOut: cellMouseOut
  };

// lookup the container we want the Grid to use
const eGridDiv = document.querySelector('#myGrid');

// create the grid passing in the div to use together with the columns & data we want to use
new agGrid.Grid(eGridDiv, gridOptions);

// fetch the row data to use and one ready provide it to the Grid via the Grid API
fetch('./desksjson/')
    .then(response => response.json())
    .then(data => {
        
        console.log(data);
        gridOptions.api.setRowData(data);
    });

const getSelectedRow = () => {
  const selectedNodes = gridOptions.api.getSelectedNodes()
  const selectedData = selectedNodes.map( node => node.data )
  const selectedDataStringPresentation = selectedData.map( node => `${node.tableid}`)
  tableid.value = selectedDataStringPresentation;
  console.log(tableid.value);
  document.getElementById('deletedesk').action = '/delete/'+tableid.value;
  document.getElementById('deletedesk').submit();
}

function delSelected() {
  const selectedNodes = gridOptions.api.getSelectedNodes()
  const selectedData = selectedNodes.map( node => node.data )
  const selectedDataStringPresentation = selectedData.map( node => `${node.tableid}`)
  alert(`Selected Table: ${selectedDataStringPresentation}`);
}

function editSelected() {
  const selectedNodes = gridOptions.api.getSelectedNodes()
  const selectedData = selectedNodes.map( node => node.data )
  const selectedDataStringPresentation = selectedData.map( node => `${node.tableid}`);
  tableid.value = selectedDataStringPresentation;
  console.log(tableid.value);
  document.getElementById('editdesk').action = '/editDesk/'+tableid.value;
  document.getElementById('editdesk').submit();
}

function cellMouseOver(event){
  console.log(event.data.tableid);
  workstationhighlight(event.data.tableid);
}

function workstationhighlight(workstationID){
  var deskID = workstationID.replace(/\s/g,'');
  console.log(`"${deskID}"`);
  deskID = document.getElementById(deskID);
  console.log(deskID);
  if (deskID='NULL'){
    return;
  } else {
    deskID.style.fill= 'cyan';
  }
}

function cellMouseOut(event){
  console.log(event.data.tableid);
  unhighlight(event.data.tableid);
}

function unhighlight(workstationID){
  var deskID = workstationID.replace(/\s/g,'');
  deskID = document.getElementById(deskID);
  console.log(deskID);
  if (deskID='NULL'){
    return;
  } else {
    deskID.style.fill= 'lightgrey';
  }
}