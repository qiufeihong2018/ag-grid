"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@ag-grid-community/core");
const ag_charts_community_1 = require("ag-charts-community");
const cartesianChartProxy_1 = require("./cartesianChartProxy");
const object_1 = require("../../utils/object");
const color_1 = require("../../utils/color");
class BarChartProxy extends cartesianChartProxy_1.CartesianChartProxy {
    constructor(params) {
        super(params);
        // when the standalone chart type is 'bar' - xAxis is positioned to the 'left'
        this.xAxisType = params.grouping ? 'groupedCategory' : 'category';
        this.yAxisType = 'number';
        this.recreateChart();
    }
    createChart() {
        const [isBar, isNormalised] = [this.standaloneChartType === 'bar', this.isNormalised()];
        return ag_charts_community_1.AgChart.create({
            container: this.chartProxyParams.parentElement,
            theme: this.chartTheme,
            axes: this.getAxes(isBar, isNormalised),
            series: this.getSeries(isNormalised),
        });
    }
    update(params) {
        this.updateAxes(params);
        const barSeries = this.chart.series[0];
        if (this.crossFiltering) {
            this.updateCrossFilteringSeries(barSeries, params);
        }
        else {
            barSeries.fills = this.chartTheme.palette.fills;
            barSeries.strokes = this.chartTheme.palette.strokes;
        }
        barSeries.data = this.transformData(params.data, params.category.id);
        barSeries.xKey = params.category.id;
        barSeries.xName = params.category.name;
        barSeries.yKeys = params.fields.map(f => f.colId);
        barSeries.yNames = params.fields.map(f => f.displayName);
        this.updateLabelRotation(params.category.id);
    }
    updateCrossFilteringSeries(barSeries, params) {
        // add additional filtered out field
        let fields = params.fields;
        fields.forEach(field => {
            const crossFilteringField = Object.assign({}, field);
            crossFilteringField.colId = field.colId + '-filtered-out';
            fields.push(crossFilteringField);
        });
        const palette = this.chartTheme.palette;
        // introduce cross filtering transparent fills
        const fills = [];
        palette.fills.forEach(fill => {
            fills.push(fill);
            fills.push(color_1.hexToRGBA(fill, '0.3'));
        });
        barSeries.fills = fills;
        // introduce cross filtering transparent strokes
        const strokes = [];
        palette.strokes.forEach(stroke => {
            fills.push(stroke);
            fills.push(color_1.hexToRGBA(stroke, '0.3'));
        });
        barSeries.strokes = strokes;
        // disable series highlighting by default
        barSeries.highlightStyle.fill = undefined;
        // hide 'filtered out' legend items
        const colIds = params.fields.map(f => f.colId);
        barSeries.hideInLegend = colIds.filter(colId => colId.indexOf('-filtered-out') !== -1);
        // sync toggling of legend item with hidden 'filtered out' item
        this.chart.legend.addEventListener('click', (event) => {
            barSeries.toggleSeriesItem(event.itemId + '-filtered-out', event.enabled);
        });
        this.chart.tooltip.delay = 500;
        // add node click cross filtering callback to series
        barSeries.addEventListener('nodeClick', this.crossFilterCallback);
    }
    getAxes(isBar, normalised) {
        const axisOptions = this.getAxesOptions();
        let axes = [
            Object.assign(Object.assign({}, object_1.deepMerge(axisOptions[this.xAxisType], axisOptions[this.xAxisType].bottom)), { type: this.xAxisType, position: isBar ? ag_charts_community_1.ChartAxisPosition.Left : ag_charts_community_1.ChartAxisPosition.Bottom }),
            Object.assign(Object.assign({}, object_1.deepMerge(axisOptions[this.yAxisType], axisOptions[this.yAxisType].left)), { type: this.yAxisType, position: isBar ? ag_charts_community_1.ChartAxisPosition.Bottom : ag_charts_community_1.ChartAxisPosition.Left }),
        ];
        // special handling to add a default label formatter to show '%' for normalized charts if none is provided
        if (normalised) {
            const numberAxis = axes[1];
            numberAxis.label = Object.assign(Object.assign({}, numberAxis.label), { formatter: (params) => Math.round(params.value) + '%' });
        }
        return axes;
    }
    getSeries(normalised) {
        const groupedCharts = ['groupedColumn', 'groupedBar'];
        const isGrouped = !this.crossFiltering && core_1._.includes(groupedCharts, this.chartType);
        return [Object.assign(Object.assign({}, this.chartOptions[this.standaloneChartType].series), { type: this.standaloneChartType, grouped: isGrouped, normalizedTo: normalised ? 100 : undefined })];
    }
    isNormalised() {
        const normalisedCharts = ['normalizedColumn', 'normalizedBar'];
        return !this.crossFiltering && core_1._.includes(normalisedCharts, this.chartType);
    }
}
exports.BarChartProxy = BarChartProxy;
//# sourceMappingURL=barChartProxy.js.map