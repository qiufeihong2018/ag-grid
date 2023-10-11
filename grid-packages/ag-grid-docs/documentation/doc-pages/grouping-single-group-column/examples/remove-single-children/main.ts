import { GridApi, createGrid, GridOptions } from '@ag-grid-community/core';
import { getData } from "./data";

let gridApi: GridApi;

const gridOptions: GridOptions = {
  columnDefs: [
    { field: 'athlete' },
    { field: 'country', rowGroup: true },
    { field: 'city', rowGroup: true },
    { field: 'year' },
    { field: 'gold', aggFunc: 'sum' },
    { field: 'silver', aggFunc: 'sum' },
    { field: 'bronze', aggFunc: 'sum' },
  ],
  defaultColDef: {
    flex: 1,
    minWidth: 150,
    resizable: true,
  },
  autoGroupColumnDef: {
    headerName: 'Group',
    field: 'athlete',
    minWidth: 220,
    cellRenderer: 'agGroupCellRenderer',
  },
  rowData: getData(),

  // optional as 'singleColumn' is the default group display type
  groupDisplayType: 'singleColumn',

  // set this to true to remove single children
  groupRemoveSingleChildren: false,

  // set this to true to remove leaf level single children
  groupRemoveLowestSingleChildren: false,

  // expand everything by default
  groupDefaultExpanded: -1,

  suppressAggFuncInHeader: true,
  animateRows: true,
}

function changeSelection(type: string) {
  // normal, single or lowest
  if (type === 'normal') {
    gridApi!.setGroupRemoveSingleChildren(false)
    gridApi!.setGroupRemoveLowestSingleChildren(false)
  } else if (type === 'single') {
    gridApi!.setGroupRemoveSingleChildren(true)
    gridApi!.setGroupRemoveLowestSingleChildren(false)
  } else if (type === 'lowest') {
    gridApi!.setGroupRemoveLowestSingleChildren(true)
    gridApi!.setGroupRemoveSingleChildren(false)
  } else {
    console.log('unknown type: ' + type)
  }
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
  var gridDiv = document.querySelector<HTMLElement>('#myGrid')!
  gridApi = createGrid(gridDiv, gridOptions);;
})
