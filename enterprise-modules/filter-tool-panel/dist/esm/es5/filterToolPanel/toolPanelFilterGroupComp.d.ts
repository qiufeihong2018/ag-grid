import { Component, IProvidedColumn, ITooltipParams } from "@ag-grid-community/core";
import { ToolPanelFilterComp } from "./toolPanelFilterComp";
export declare type ToolPanelFilterItem = ToolPanelFilterGroupComp | ToolPanelFilterComp;
export declare class ToolPanelFilterGroupComp extends Component {
    private static TEMPLATE;
    private filterGroupComp;
    private columnModel;
    private readonly depth;
    private readonly columnGroup;
    private readonly showingColumn;
    private childFilterComps;
    private expandedCallback;
    private filterGroupName;
    constructor(columnGroup: IProvidedColumn, childFilterComps: ToolPanelFilterItem[], expandedCallback: () => void, depth: number, showingColumn: boolean);
    private preConstruct;
    init(): void;
    private setupTooltip;
    getTooltipParams(): ITooltipParams;
    addCssClassToTitleBar(cssClass: string): void;
    refreshFilters(): void;
    isColumnGroup(): boolean;
    isExpanded(): boolean;
    getChildren(): ToolPanelFilterItem[];
    getFilterGroupName(): string;
    getFilterGroupId(): string;
    hideGroupItem(hide: boolean, index: number): void;
    hideGroup(hide: boolean): void;
    private forEachToolPanelFilterChild;
    private addExpandCollapseListeners;
    private getColumns;
    private addFilterChangedListeners;
    private refreshFilterClass;
    private onFilterOpened;
    expand(): void;
    collapse(): void;
    private setGroupTitle;
    private getColumnGroupName;
    private getColumnName;
    private destroyFilters;
    protected destroy(): void;
}
