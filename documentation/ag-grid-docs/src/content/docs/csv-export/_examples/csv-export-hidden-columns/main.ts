import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { GridApi, GridOptions, createGrid } from '@ag-grid-community/core';
import { ModuleRegistry } from '@ag-grid-community/core';
import { CsvExportModule } from '@ag-grid-community/csv-export';
import { MenuModule } from '@ag-grid-enterprise/menu';

import { getData } from './data';

ModuleRegistry.registerModules([ClientSideRowModelModule, CsvExportModule, MenuModule]);

let gridApi: GridApi;

const gridOptions: GridOptions = {
    defaultColDef: {
        editable: true,
        minWidth: 100,
        flex: 1,
    },

    suppressExcelExport: true,
    popupParent: document.body,

    columnDefs: [
        { field: 'athlete' },
        { field: 'country' },
        { field: 'sport' },
        { field: 'gold', hide: true },
        { field: 'silver', hide: true },
        { field: 'bronze', hide: true },
        { field: 'total' },
    ],

    rowData: getData(),
};

function getBoolean(id: string) {
    var field: any = document.querySelector('#' + id);

    return !!field.checked;
}

function getParams() {
    return {
        allColumns: getBoolean('allColumns'),
    };
}

function onBtnExport() {
    gridApi!.exportDataAsCsv(getParams());
}

function onBtnUpdate() {
    (document.querySelector('#csvResult') as any).value = gridApi!.getDataAsCsv(getParams());
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    var gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
