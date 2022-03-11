var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Path } from "../../../scene/shape/path";
import { ContinuousScale } from "../../../scale/continuousScale";
import { Selection } from "../../../scene/selection";
import { Group } from "../../../scene/group";
import { SeriesTooltip } from "../series";
import { extent } from "../../../util/array";
import { PointerEvents } from "../../../scene/node";
import { Text } from "../../../scene/shape/text";
import { CartesianSeries, CartesianSeriesMarker } from "./cartesianSeries";
import { ChartAxisDirection } from "../../chartAxis";
import { getMarker } from "../../marker/util";
import { reactive } from "../../../util/observable";
import { toTooltipHtml } from "../../chart";
import { interpolate } from "../../../util/string";
import { Label } from "../../label";
import { sanitizeHtml } from "../../../util/sanitize";
import { isContinuous, isDiscrete } from "../../../util/value";
class LineSeriesLabel extends Label {
}
__decorate([
    reactive('change')
], LineSeriesLabel.prototype, "formatter", void 0);
export class LineSeriesTooltip extends SeriesTooltip {
}
__decorate([
    reactive('change')
], LineSeriesTooltip.prototype, "renderer", void 0);
__decorate([
    reactive('change')
], LineSeriesTooltip.prototype, "format", void 0);
export class LineSeries extends CartesianSeries {
    constructor() {
        super();
        this.xDomain = [];
        this.yDomain = [];
        this.xData = [];
        this.yData = [];
        this.lineNode = new Path();
        // We use groups for this selection even though each group only contains a marker ATM
        // because in the future we might want to add label support as well.
        this.nodeSelection = Selection.select(this.pickGroup).selectAll();
        this.nodeData = [];
        this.marker = new CartesianSeriesMarker();
        this.label = new LineSeriesLabel();
        this.stroke = '#874349';
        this.lineDash = [0];
        this.lineDashOffset = 0;
        this.strokeWidth = 2;
        this.strokeOpacity = 1;
        this.tooltip = new LineSeriesTooltip();
        this._xKey = '';
        this.xName = '';
        this._yKey = '';
        this.yName = '';
        const lineNode = this.lineNode;
        lineNode.fill = undefined;
        lineNode.lineJoin = 'round';
        lineNode.pointerEvents = PointerEvents.None;
        // Make line render before markers in the pick group.
        this.group.insertBefore(lineNode, this.pickGroup);
        this.addEventListener('update', this.scheduleUpdate);
        const { marker, label } = this;
        marker.fill = '#c16068';
        marker.stroke = '#874349';
        marker.addPropertyListener('shape', this.onMarkerShapeChange, this);
        marker.addEventListener('change', this.scheduleUpdate, this);
        label.enabled = false;
        label.addEventListener('change', this.scheduleUpdate, this);
    }
    onMarkerShapeChange() {
        this.nodeSelection = this.nodeSelection.setData([]);
        this.nodeSelection.exit.remove();
        this.fireEvent({ type: 'legendChange' });
    }
    setColors(fills, strokes) {
        this.stroke = fills[0];
        this.marker.stroke = strokes[0];
        this.marker.fill = fills[0];
    }
    set xKey(value) {
        if (this._xKey !== value) {
            this._xKey = value;
            this.xData = [];
            this.scheduleData();
        }
    }
    get xKey() {
        return this._xKey;
    }
    set yKey(value) {
        if (this._yKey !== value) {
            this._yKey = value;
            this.yData = [];
            this.scheduleData();
        }
    }
    get yKey() {
        return this._yKey;
    }
    processData() {
        const { xAxis, yAxis, xKey, yKey, xData, yData } = this;
        const data = xKey && yKey && this.data ? this.data : [];
        if (!xAxis || !yAxis) {
            return false;
        }
        const isContinuousX = xAxis.scale instanceof ContinuousScale;
        const isContinuousY = yAxis.scale instanceof ContinuousScale;
        xData.length = 0;
        yData.length = 0;
        for (let i = 0, n = data.length; i < n; i++) {
            const datum = data[i];
            const x = datum[xKey];
            const y = datum[yKey];
            if (isContinuousX) {
                xData.push(x);
            }
            else {
                // i.e. category axis
                xData.push(isDiscrete(x) ? x : String(x));
            }
            if (isContinuousY) {
                yData.push(y);
            }
            else {
                yData.push(isDiscrete(y) ? y : String(y));
            }
        }
        this.xDomain = isContinuousX ? this.fixNumericExtent(extent(xData, isContinuous), 'x', xAxis) : xData;
        this.yDomain = isContinuousY ? this.fixNumericExtent(extent(yData, isContinuous), 'y', yAxis) : yData;
        return true;
    }
    getDomain(direction) {
        if (direction === ChartAxisDirection.X) {
            return this.xDomain;
        }
        return this.yDomain;
    }
    onHighlightChange() {
        this.updateNodes();
    }
    resetHighlight() {
        this.lineNode.strokeWidth = this.strokeWidth;
    }
    update() {
        this.updatePending = false;
        this.updateSelections();
        this.updateNodes();
    }
    updateSelections() {
        if (!this.nodeDataPending) {
            return;
        }
        this.nodeDataPending = false;
        this.updateLinePath(); // this will create node data too
        this.updateNodeSelection();
    }
    updateLinePath() {
        const { data, xAxis, yAxis } = this;
        if (!data || !xAxis || !yAxis) {
            return;
        }
        const { xData, yData, lineNode, label } = this;
        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        const isContinuousX = xScale instanceof ContinuousScale;
        const isContinuousY = yScale instanceof ContinuousScale;
        const xOffset = (xScale.bandwidth || 0) / 2;
        const yOffset = (yScale.bandwidth || 0) / 2;
        const linePath = lineNode.path;
        const nodeData = [];
        linePath.clear();
        let moveTo = true;
        let prevXInRange = undefined;
        let nextXYDatums = undefined;
        for (let i = 0; i < xData.length; i++) {
            const xyDatums = nextXYDatums || this.checkDomainXY(xData[i], yData[i], isContinuousX, isContinuousY);
            if (!xyDatums) {
                prevXInRange = undefined;
                moveTo = true;
            }
            else {
                const [xDatum, yDatum] = xyDatums;
                const x = xScale.convert(xDatum) + xOffset;
                if (isNaN(x)) {
                    prevXInRange = undefined;
                    moveTo = true;
                    continue;
                }
                const tolerance = (xScale.bandwidth || (this.marker.size * 0.5 + (this.marker.strokeWidth || 0))) + 1;
                nextXYDatums = this.checkDomainXY(xData[i + 1], yData[i + 1], isContinuousX, isContinuousY);
                const xInRange = xAxis.inRangeEx(x, 0, tolerance);
                const nextXInRange = nextXYDatums && xAxis.inRangeEx(xScale.convert(nextXYDatums[0]) + xOffset, 0, tolerance);
                if (xInRange === -1 && nextXInRange === -1) {
                    moveTo = true;
                    continue;
                }
                if (xInRange === 1 && prevXInRange === 1) {
                    moveTo = true;
                    continue;
                }
                prevXInRange = xInRange;
                const y = yScale.convert(yDatum) + yOffset;
                if (moveTo) {
                    linePath.moveTo(x, y);
                    moveTo = false;
                }
                else {
                    linePath.lineTo(x, y);
                }
                let labelText;
                if (label.formatter) {
                    labelText = label.formatter({ value: yDatum });
                }
                else {
                    labelText = typeof yDatum === 'number' && isFinite(yDatum) ? yDatum.toFixed(2) : yDatum ? String(yDatum) : '';
                }
                nodeData.push({
                    series: this,
                    datum: data[i],
                    point: { x, y },
                    label: labelText ? {
                        text: labelText,
                        fontStyle: label.fontStyle,
                        fontWeight: label.fontWeight,
                        fontSize: label.fontSize,
                        fontFamily: label.fontFamily,
                        textAlign: 'center',
                        textBaseline: 'bottom',
                        fill: label.color
                    } : undefined
                });
            }
        }
        // Used by marker nodes and for hit-testing even when not using markers
        // when `chart.tooltip.tracking` is true.
        this.nodeData = nodeData;
    }
    updateNodeSelection() {
        const { marker } = this;
        const nodeData = marker.shape ? this.nodeData : [];
        const MarkerShape = getMarker(marker.shape);
        const updateSelection = this.nodeSelection.setData(nodeData);
        updateSelection.exit.remove();
        const enterSelection = updateSelection.enter.append(Group);
        enterSelection.append(MarkerShape);
        enterSelection.append(Text);
        this.nodeSelection = updateSelection.merge(enterSelection);
    }
    updateNodes() {
        this.group.visible = this.visible;
        this.updateLineNode();
        this.updateMarkerNodes();
        this.updateTextNodes();
    }
    updateLineNode() {
        const { lineNode } = this;
        lineNode.stroke = this.stroke;
        lineNode.strokeWidth = this.getStrokeWidth(this.strokeWidth);
        lineNode.strokeOpacity = this.strokeOpacity;
        lineNode.lineDash = this.lineDash;
        lineNode.lineDashOffset = this.lineDashOffset;
        lineNode.opacity = this.getOpacity();
    }
    updateMarkerNodes() {
        if (!this.chart) {
            return;
        }
        const { marker, xKey, yKey, stroke: lineStroke, chart: { highlightedDatum }, highlightStyle: { fill: deprecatedFill, stroke: deprecatedStroke, strokeWidth: deprecatedStrokeWidth, item: { fill: highlightedFill = deprecatedFill, stroke: highlightedStroke = deprecatedStroke, strokeWidth: highlightedDatumStrokeWidth = deprecatedStrokeWidth, } } } = this;
        const { size, formatter } = marker;
        const markerStrokeWidth = marker.strokeWidth !== undefined ? marker.strokeWidth : this.strokeWidth;
        const MarkerShape = getMarker(marker.shape);
        this.nodeSelection.selectByClass(MarkerShape)
            .each((node, datum) => {
            const isDatumHighlighted = datum === highlightedDatum;
            const fill = isDatumHighlighted && highlightedFill !== undefined ? highlightedFill : marker.fill;
            const stroke = isDatumHighlighted && highlightedStroke !== undefined ? highlightedStroke : marker.stroke || lineStroke;
            const strokeWidth = isDatumHighlighted && highlightedDatumStrokeWidth !== undefined
                ? highlightedDatumStrokeWidth
                : markerStrokeWidth;
            let format = undefined;
            if (formatter) {
                format = formatter({
                    datum: datum.datum,
                    xKey,
                    yKey,
                    fill,
                    stroke,
                    strokeWidth,
                    size,
                    highlighted: isDatumHighlighted
                });
            }
            node.fill = format && format.fill || fill;
            node.stroke = format && format.stroke || stroke;
            node.strokeWidth = format && format.strokeWidth !== undefined
                ? format.strokeWidth
                : strokeWidth;
            node.size = format && format.size !== undefined
                ? format.size
                : size;
            node.translationX = datum.point.x;
            node.translationY = datum.point.y;
            node.opacity = this.getOpacity(datum);
            node.visible = marker.enabled && node.size > 0;
        });
    }
    updateTextNodes() {
        this.nodeSelection.selectByClass(Text)
            .each((text, datum) => {
            const { point, label } = datum;
            const { enabled: labelEnabled, fontStyle, fontWeight, fontSize, fontFamily, color } = this.label;
            if (label && labelEnabled) {
                text.fontStyle = fontStyle;
                text.fontWeight = fontWeight;
                text.fontSize = fontSize;
                text.fontFamily = fontFamily;
                text.textAlign = label.textAlign;
                text.textBaseline = label.textBaseline;
                text.text = label.text;
                text.x = point.x;
                text.y = point.y - 10;
                text.fill = color;
                text.visible = true;
            }
            else {
                text.visible = false;
            }
        });
    }
    getNodeData() {
        return this.nodeData;
    }
    fireNodeClickEvent(event, datum) {
        this.fireEvent({
            type: 'nodeClick',
            event,
            series: this,
            datum: datum.datum,
            xKey: this.xKey,
            yKey: this.yKey
        });
    }
    getTooltipHtml(nodeDatum) {
        const { xKey, yKey, xAxis, yAxis } = this;
        if (!xKey || !yKey || !xAxis || !yAxis) {
            return '';
        }
        const { xName, yName, tooltip, marker } = this;
        const { renderer: tooltipRenderer, format: tooltipFormat } = tooltip;
        const datum = nodeDatum.datum;
        const xValue = datum[xKey];
        const yValue = datum[yKey];
        const xString = xAxis.formatDatum(xValue);
        const yString = yAxis.formatDatum(yValue);
        const title = sanitizeHtml(this.title || yName);
        const content = sanitizeHtml(xString + ': ' + yString);
        const { formatter: markerFormatter, fill, stroke, strokeWidth: markerStrokeWidth, size } = marker;
        const strokeWidth = markerStrokeWidth !== undefined ? markerStrokeWidth : this.strokeWidth;
        let format = undefined;
        if (markerFormatter) {
            format = markerFormatter({
                datum,
                xKey,
                yKey,
                fill,
                stroke,
                strokeWidth,
                size,
                highlighted: false
            });
        }
        const color = format && format.fill || fill;
        const defaults = {
            title,
            backgroundColor: color,
            content
        };
        if (tooltipFormat || tooltipRenderer) {
            const params = {
                datum,
                xKey,
                xValue,
                xName,
                yKey,
                yValue,
                yName,
                title,
                color
            };
            if (tooltipFormat) {
                return toTooltipHtml({
                    content: interpolate(tooltipFormat, params)
                }, defaults);
            }
            if (tooltipRenderer) {
                return toTooltipHtml(tooltipRenderer(params), defaults);
            }
        }
        return toTooltipHtml(defaults);
    }
    listSeriesItems(legendData) {
        const { id, data, xKey, yKey, yName, visible, title, marker, stroke, strokeOpacity } = this;
        if (data && data.length && xKey && yKey) {
            legendData.push({
                id: id,
                itemId: undefined,
                enabled: visible,
                label: {
                    text: title || yName || yKey
                },
                marker: {
                    shape: marker.shape,
                    fill: marker.fill || 'rgba(0, 0, 0, 0)',
                    stroke: marker.stroke || stroke || 'rgba(0, 0, 0, 0)',
                    fillOpacity: 1,
                    strokeOpacity
                }
            });
        }
    }
}
LineSeries.className = 'LineSeries';
LineSeries.type = 'line';
__decorate([
    reactive('layoutChange')
], LineSeries.prototype, "title", void 0);
__decorate([
    reactive('update')
], LineSeries.prototype, "stroke", void 0);
__decorate([
    reactive('update')
], LineSeries.prototype, "lineDash", void 0);
__decorate([
    reactive('update')
], LineSeries.prototype, "lineDashOffset", void 0);
__decorate([
    reactive('update')
], LineSeries.prototype, "strokeWidth", void 0);
__decorate([
    reactive('update')
], LineSeries.prototype, "strokeOpacity", void 0);
__decorate([
    reactive('update')
], LineSeries.prototype, "xName", void 0);
__decorate([
    reactive('update')
], LineSeries.prototype, "yName", void 0);
//# sourceMappingURL=lineSeries.js.map