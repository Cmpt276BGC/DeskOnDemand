// specify the columns
const columnDefs = [
    { headerName: 'Table ID', field: "tableid", sortable: true, filter: true, checkboxSelection: true },
    { field: "floor", sortable: true, filter: true },
    { field: "type", sortable: true, filter: true },
    { headerName: 'Has Window', field: "haswindow", sortable: true, filter: true},
  ];

  // let the grid know which columns to use
  const gridOptions = {
    columnDefs: columnDefs
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
  alert(`Selected Table: ${selectedDataStringPresentation}`);
}