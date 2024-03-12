import { createApp } from 'vue';
import { AgGridVue } from '@ag-grid-community/vue3';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import '@ag-grid-community/styles/ag-grid.css';
import "@ag-grid-community/styles/ag-theme-quartz.css";
import './styles.css';

import { ModuleRegistry } from '@ag-grid-community/core';
ModuleRegistry.registerModules([ClientSideRowModelModule]);

const VueExample = {
    template: `
      <div style="height: 100%">
      <div class="test-container">
        <div class="test-header">
          <button v-on:click="setHeaderNames()">Set Header Names</button>
          <button v-on:click="removeHeaderNames()">Remove Header Names</button>
          <button v-on:click="setValueFormatters()">Set Value Formatters</button>
          <button v-on:click="removeValueFormatters()">Remove Value Formatters</button>
        </div>
        <ag-grid-vue
            style="width: 100%; height: 100%;"
            :class="themeClass"
            id="myGrid"
            :gridOptions="gridOptions"
            @grid-ready="onGridReady"
            :defaultColDef="defaultColDef"
            :columnDefs="columnDefs"
            :rowData="rowData"></ag-grid-vue>
      </div>
      </div>
    `,
    components: {
        'ag-grid-vue': AgGridVue,
    },
    data: function () {
        return {
            gridOptions: null,
            gridApi: null,
            defaultColDef: {
                initialWidth: 100,
                filter: true,
            },
            columnDefs: null,
            rowData: null,
            themeClass: /** DARK MODE START **/document.documentElement.dataset.defaultTheme || 'ag-theme-quartz'/** DARK MODE END **/,
        };
    },
    beforeMount() {
        this.gridOptions = {};
        this.columnDefs = this.getColumnDefs();
    },
    mounted() {
    },
    methods: {
        setHeaderNames() {
            const columnDefs = this.getColumnDefs();
            columnDefs.forEach(function (colDef, index) {
                colDef.headerName = 'C' + index;
            });
            this.gridApi.setGridOption('columnDefs', columnDefs);
        },
        removeHeaderNames() {
            const columnDefs = this.getColumnDefs();
            columnDefs.forEach(function (colDef, index) {
                colDef.headerName = undefined;
            });
            this.gridApi.setGridOption('columnDefs', columnDefs);
        },
        setValueFormatters() {
            const columnDefs = this.getColumnDefs();
            columnDefs.forEach(function (colDef, index) {
                colDef.valueFormatter = function (params) {
                    return '[ ' + params.value + ' ]';
                };
            });
            this.gridApi.setGridOption('columnDefs', columnDefs);
        },
        removeValueFormatters() {
            const columnDefs = this.getColumnDefs();
            columnDefs.forEach(function (colDef, index) {
                colDef.valueFormatter = undefined;
            });
            this.gridApi.setGridOption('columnDefs', columnDefs);
        },
        getColumnDefs() {
            return [
                { field: 'athlete' },
                { field: 'age' },
                { field: 'country' },
                { field: 'sport' },
                { field: 'year' },
                { field: 'date' },
                { field: 'gold' },
                { field: 'silver' },
                { field: 'bronze' },
                { field: 'total' }
            ];
        },
        onGridReady(params) {
            this.gridApi = params.api;
            const updateData = (data) => {
                this.rowData = data;
            };

            fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
                .then((resp) => resp.json())
                .then((data) => updateData(data));
        },
    },
};

createApp(VueExample)
    .mount("#app")

