import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { GridApi, GridOptions, IGroupCellRendererParams, createGrid } from '@ag-grid-community/core';
import { ModuleRegistry } from '@ag-grid-community/core';
import { ColumnsToolPanelModule } from '@ag-grid-enterprise/column-tool-panel';
import { MenuModule } from '@ag-grid-enterprise/menu';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    ColumnsToolPanelModule,
    MenuModule,
    RowGroupingModule,
    SetFilterModule,
]);

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [
        { field: 'country', rowGroup: true, hide: true },
        { field: 'sport', rowGroup: true, hide: true },
        { field: 'age', minWidth: 120 },
        { field: 'year', maxWidth: 120 },
        { field: 'date', minWidth: 150 },
        { field: 'gold', aggFunc: 'sum' },
        { field: 'silver', aggFunc: 'sum' },
        { field: 'bronze', aggFunc: 'sum' },
        { field: 'total', aggFunc: 'sum' },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 100,
        filter: true,
    },
    autoGroupColumnDef: {
        headerName: 'Athlete',
        field: 'athlete',
        minWidth: 250,
        cellRenderer: 'agGroupCellRenderer',
        cellRendererParams: {
            checkbox: true,
        } as IGroupCellRendererParams,
    },
    rowSelection: 'multiple',
    groupSelectsChildren: true,
    groupSelectsFiltered: true,
    suppressAggFuncInHeader: true,
    suppressRowClickSelection: true,
};

function filterSwimming() {
    gridApi!.setFilterModel({
        sport: {
            type: 'set',
            values: ['Swimming'],
        },
    });
}

function ages16And20() {
    gridApi!.setFilterModel({
        age: {
            type: 'set',
            values: ['16', '20'],
        },
    });
}

function clearFilter() {
    gridApi!.setFilterModel(null);
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    var gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
