var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, Component, DragSourceType, Events, HorizontalDirection, KeyCode, ManagedFocusFeature, PositionableFeature, VerticalDirection, _ } from "@ag-grid-community/core";
import { DropZoneColumnComp } from "./dropZoneColumnComp";
var BaseDropZonePanel = /** @class */ (function (_super) {
    __extends(BaseDropZonePanel, _super);
    function BaseDropZonePanel(horizontal, valueColumn) {
        var _this = _super.call(this, /* html */ "<div class=\"ag-unselectable\" aria-role=\"presentation\"></div>") || this;
        _this.horizontal = horizontal;
        _this.valueColumn = valueColumn;
        _this.state = BaseDropZonePanel.STATE_NOT_DRAGGING;
        _this.guiDestroyFunctions = [];
        _this.childColumnComponents = [];
        _this.resizeEnabled = false;
        _this.addElementClasses(_this.getGui());
        _this.eColumnDropList = document.createElement('div');
        _this.addElementClasses(_this.eColumnDropList, 'list');
        _.setAriaRole(_this.eColumnDropList, 'listbox');
        return _this;
    }
    BaseDropZonePanel.prototype.isHorizontal = function () {
        return this.horizontal;
    };
    BaseDropZonePanel.prototype.toggleResizable = function (resizable) {
        this.positionableFeature.setResizable(resizable ? { bottom: true } : false);
        this.resizeEnabled = resizable;
    };
    BaseDropZonePanel.prototype.setBeans = function (beans) {
        this.beans = beans;
    };
    BaseDropZonePanel.prototype.destroy = function () {
        this.destroyGui();
        _super.prototype.destroy.call(this);
    };
    BaseDropZonePanel.prototype.destroyGui = function () {
        this.guiDestroyFunctions.forEach(function (func) { return func(); });
        this.guiDestroyFunctions.length = 0;
        this.childColumnComponents.length = 0;
        _.clearElement(this.getGui());
        _.clearElement(this.eColumnDropList);
    };
    BaseDropZonePanel.prototype.init = function (params) {
        this.params = params;
        this.createManagedBean(new ManagedFocusFeature(this.getFocusableElement(), {
            handleKeyDown: this.handleKeyDown.bind(this)
        }));
        this.addManagedListener(this.beans.eventService, Events.EVENT_NEW_COLUMNS_LOADED, this.refreshGui.bind(this));
        this.addManagedListener(this.beans.gridOptionsWrapper, 'functionsReadOnly', this.refreshGui.bind(this));
        this.setupDropTarget();
        this.positionableFeature = new PositionableFeature(this.getGui(), { minHeight: 100 });
        this.createManagedBean(this.positionableFeature);
        // we don't know if this bean will be initialised before columnModel.
        // if columnModel first, then below will work
        // if columnModel second, then below will put blank in, and then above event gets first when columnModel is set up
        this.refreshGui();
        _.setAriaLabel(this.eColumnDropList, this.getAriaLabel());
    };
    BaseDropZonePanel.prototype.handleKeyDown = function (e) {
        var isVertical = !this.horizontal;
        var isNext = e.key === KeyCode.DOWN;
        var isPrevious = e.key === KeyCode.UP;
        if (!isVertical) {
            var isRtl = this.gridOptionsWrapper.isEnableRtl();
            isNext = (!isRtl && e.key === KeyCode.RIGHT) || (isRtl && e.key === KeyCode.LEFT);
            isPrevious = (!isRtl && e.key === KeyCode.LEFT) || (isRtl && e.key === KeyCode.RIGHT);
        }
        if (!isNext && !isPrevious) {
            return;
        }
        var el = this.focusService.findNextFocusableElement(this.getFocusableElement(), false, isPrevious);
        if (el) {
            e.preventDefault();
            el.focus();
        }
    };
    BaseDropZonePanel.prototype.addElementClasses = function (el, suffix) {
        suffix = suffix ? "-" + suffix : '';
        var direction = this.horizontal ? 'horizontal' : 'vertical';
        el.classList.add("ag-column-drop" + suffix, "ag-column-drop-" + direction + suffix);
    };
    BaseDropZonePanel.prototype.setupDropTarget = function () {
        this.dropTarget = {
            getContainer: this.getGui.bind(this),
            getIconName: this.getIconName.bind(this),
            onDragging: this.onDragging.bind(this),
            onDragEnter: this.onDragEnter.bind(this),
            onDragLeave: this.onDragLeave.bind(this),
            onDragStop: this.onDragStop.bind(this),
            isInterestedIn: this.isInterestedIn.bind(this)
        };
        this.beans.dragAndDropService.addDropTarget(this.dropTarget);
    };
    BaseDropZonePanel.prototype.isInterestedIn = function (type) {
        // not interested in row drags
        return type === DragSourceType.HeaderCell || type === DragSourceType.ToolPanel;
    };
    BaseDropZonePanel.prototype.checkInsertIndex = function (draggingEvent) {
        var newIndex = this.horizontal ? this.getNewHorizontalInsertIndex(draggingEvent) : this.getNewVerticalInsertIndex(draggingEvent);
        // <0 happens when drag is no a direction we are interested in, eg drag is up/down but in horizontal panel
        if (newIndex < 0) {
            return false;
        }
        var changed = newIndex !== this.insertIndex;
        if (changed) {
            this.insertIndex = newIndex;
        }
        return changed;
    };
    BaseDropZonePanel.prototype.getNewHorizontalInsertIndex = function (draggingEvent) {
        if (_.missing(draggingEvent.hDirection)) {
            return -1;
        }
        var newIndex = 0;
        var mouseEvent = draggingEvent.event;
        var enableRtl = this.beans.gridOptionsWrapper.isEnableRtl();
        var goingLeft = draggingEvent.hDirection === HorizontalDirection.Left;
        var mouseX = mouseEvent.clientX;
        this.childColumnComponents.forEach(function (childColumn) {
            var rect = childColumn.getGui().getBoundingClientRect();
            var rectX = goingLeft ? rect.right : rect.left;
            var horizontalFit = enableRtl ? mouseX <= rectX : mouseX >= rectX;
            if (horizontalFit) {
                newIndex++;
            }
        });
        return newIndex;
    };
    BaseDropZonePanel.prototype.getNewVerticalInsertIndex = function (draggingEvent) {
        if (_.missing(draggingEvent.vDirection)) {
            return -1;
        }
        var newIndex = 0;
        var mouseEvent = draggingEvent.event;
        this.childColumnComponents.forEach(function (childColumn) {
            var rect = childColumn.getGui().getBoundingClientRect();
            var verticalFit = mouseEvent.clientY >= (draggingEvent.vDirection === VerticalDirection.Down ? rect.top : rect.bottom);
            if (verticalFit) {
                newIndex++;
            }
        });
        return newIndex;
    };
    BaseDropZonePanel.prototype.checkDragStartedBySelf = function (draggingEvent) {
        if (this.state !== BaseDropZonePanel.STATE_NOT_DRAGGING) {
            return;
        }
        this.state = BaseDropZonePanel.STATE_REARRANGE_COLUMNS;
        this.potentialDndColumns = draggingEvent.dragSource.getDragItem().columns || [];
        this.refreshGui();
        this.checkInsertIndex(draggingEvent);
        this.refreshGui();
    };
    BaseDropZonePanel.prototype.onDragging = function (draggingEvent) {
        this.checkDragStartedBySelf(draggingEvent);
        if (this.checkInsertIndex(draggingEvent)) {
            this.refreshGui();
        }
    };
    BaseDropZonePanel.prototype.onDragEnter = function (draggingEvent) {
        // this will contain all columns that are potential drops
        var dragColumns = draggingEvent.dragSource.getDragItem().columns || [];
        this.state = BaseDropZonePanel.STATE_NEW_COLUMNS_IN;
        // take out columns that are not droppable
        var goodDragColumns = dragColumns.filter(this.isColumnDroppable.bind(this));
        if (goodDragColumns.length > 0) {
            this.potentialDndColumns = goodDragColumns;
            this.checkInsertIndex(draggingEvent);
            this.refreshGui();
        }
    };
    BaseDropZonePanel.prototype.isPotentialDndColumns = function () {
        return _.existsAndNotEmpty(this.potentialDndColumns);
    };
    BaseDropZonePanel.prototype.onDragLeave = function (draggingEvent) {
        // if the dragging started from us, we remove the group, however if it started
        // some place else, then we don't, as it was only 'asking'
        if (this.state === BaseDropZonePanel.STATE_REARRANGE_COLUMNS) {
            var columns = draggingEvent.dragSource.getDragItem().columns || [];
            this.removeColumns(columns);
        }
        if (this.isPotentialDndColumns()) {
            this.potentialDndColumns = [];
            this.refreshGui();
        }
        this.state = BaseDropZonePanel.STATE_NOT_DRAGGING;
    };
    BaseDropZonePanel.prototype.onDragStop = function () {
        if (this.isPotentialDndColumns()) {
            var success = false;
            if (this.state === BaseDropZonePanel.STATE_NEW_COLUMNS_IN) {
                this.addColumns(this.potentialDndColumns);
                success = true;
            }
            else {
                success = this.rearrangeColumns(this.potentialDndColumns);
            }
            this.potentialDndColumns = [];
            // If the function is passive, then we don't refresh, as we assume the client application
            // is going to call setRowGroups / setPivots / setValues at a later point which will then
            // cause a refresh. This gives a nice GUI where the ghost stays until the app has caught
            // up with the changes. However, if there was no change in the order, then we do need to
            // refresh to reset the columns
            if (!this.beans.gridOptionsWrapper.isFunctionsPassive() || !success) {
                this.refreshGui();
            }
        }
        this.state = BaseDropZonePanel.STATE_NOT_DRAGGING;
    };
    BaseDropZonePanel.prototype.removeColumns = function (columnsToRemove) {
        var newColumnList = this.getExistingColumns().filter(function (col) { return !_.includes(columnsToRemove, col); });
        this.updateColumns(newColumnList);
    };
    BaseDropZonePanel.prototype.addColumns = function (columnsToAdd) {
        if (!columnsToAdd) {
            return;
        }
        var newColumnList = this.getExistingColumns().slice();
        var colsToAddNoDuplicates = columnsToAdd.filter(function (col) { return newColumnList.indexOf(col) < 0; });
        _.insertArrayIntoArray(newColumnList, colsToAddNoDuplicates, this.insertIndex);
        this.updateColumns(newColumnList);
    };
    BaseDropZonePanel.prototype.rearrangeColumns = function (columnsToAdd) {
        var newColumnList = this.getNonGhostColumns().slice();
        _.insertArrayIntoArray(newColumnList, columnsToAdd, this.insertIndex);
        if (_.areEqual(newColumnList, this.getExistingColumns())) {
            return false;
        }
        this.updateColumns(newColumnList);
        return true;
    };
    BaseDropZonePanel.prototype.refreshGui = function () {
        // we reset the scroll position after the refresh.
        // if we don't do this, then the list will always scroll to the top
        // each time we refresh it. this is because part of the refresh empties
        // out the list which sets scroll to zero. so the user could be just
        // reordering the list - we want to prevent the resetting of the scroll.
        // this is relevant for vertical display only (as horizontal has no scroll)
        var scrollTop = this.eColumnDropList.scrollTop;
        var resizeEnabled = this.resizeEnabled;
        var focusedIndex = this.getFocusedItem();
        var alternateElement = this.focusService.findNextFocusableElement();
        if (!alternateElement) {
            alternateElement = this.focusService.findNextFocusableElement(undefined, false, true);
        }
        this.toggleResizable(false);
        this.destroyGui();
        this.addIconAndTitleToGui();
        this.addEmptyMessageToGui();
        this.addColumnsToGui();
        if (!this.isHorizontal()) {
            this.eColumnDropList.scrollTop = scrollTop;
        }
        if (resizeEnabled) {
            this.toggleResizable(resizeEnabled);
        }
        this.restoreFocus(focusedIndex, alternateElement);
    };
    BaseDropZonePanel.prototype.getFocusedItem = function () {
        var eGui = this.getGui();
        var activeElement = this.gridOptionsWrapper.getDocument().activeElement;
        if (!eGui.contains(activeElement)) {
            return -1;
        }
        var items = Array.from(eGui.querySelectorAll('.ag-column-drop-cell'));
        return items.indexOf(activeElement);
    };
    BaseDropZonePanel.prototype.restoreFocus = function (index, alternateElement) {
        var eGui = this.getGui();
        var items = Array.from(eGui.querySelectorAll('.ag-column-drop-cell'));
        if (index === -1) {
            return;
        }
        if (items.length === 0) {
            alternateElement.focus();
        }
        var indexToFocus = Math.min(items.length - 1, index);
        var el = items[indexToFocus];
        if (el) {
            el.focus();
        }
    };
    BaseDropZonePanel.prototype.getNonGhostColumns = function () {
        var _this = this;
        var existingColumns = this.getExistingColumns();
        if (this.isPotentialDndColumns()) {
            return existingColumns.filter(function (column) { return !_.includes(_this.potentialDndColumns, column); });
        }
        return existingColumns;
    };
    BaseDropZonePanel.prototype.addColumnsToGui = function () {
        var _this = this;
        var nonGhostColumns = this.getNonGhostColumns();
        var addingGhosts = this.isPotentialDndColumns();
        var itemsToAddToGui = [];
        nonGhostColumns.forEach(function (column, index) {
            if (addingGhosts && index >= _this.insertIndex) {
                return;
            }
            var columnComponent = _this.createColumnComponent(column, false);
            itemsToAddToGui.push(columnComponent);
        });
        if (this.isPotentialDndColumns()) {
            this.potentialDndColumns.forEach(function (column) {
                var columnComponent = _this.createColumnComponent(column, true);
                itemsToAddToGui.push(columnComponent);
            });
            nonGhostColumns.forEach(function (column, index) {
                if (index < _this.insertIndex) {
                    return;
                }
                var columnComponent = _this.createColumnComponent(column, false);
                itemsToAddToGui.push(columnComponent);
            });
        }
        this.appendChild(this.eColumnDropList);
        itemsToAddToGui.forEach(function (columnComponent, index) {
            if (index > 0) {
                _this.addArrow(_this.eColumnDropList);
            }
            _this.eColumnDropList.appendChild(columnComponent.getGui());
        });
        this.addAriaLabelsToComponents();
    };
    BaseDropZonePanel.prototype.addAriaLabelsToComponents = function () {
        var _this = this;
        this.childColumnComponents.forEach(function (comp, idx) {
            var eGui = comp.getGui();
            _.setAriaPosInSet(eGui, idx + 1);
            _.setAriaSetSize(eGui, _this.childColumnComponents.length);
        });
    };
    BaseDropZonePanel.prototype.createColumnComponent = function (column, ghost) {
        var _this = this;
        var columnComponent = new DropZoneColumnComp(column, this.dropTarget, ghost, this.valueColumn, this.horizontal);
        columnComponent.addEventListener(DropZoneColumnComp.EVENT_COLUMN_REMOVE, this.removeColumns.bind(this, [column]));
        this.beans.context.createBean(columnComponent);
        this.guiDestroyFunctions.push(function () { return _this.destroyBean(columnComponent); });
        if (!ghost) {
            this.childColumnComponents.push(columnComponent);
        }
        return columnComponent;
    };
    BaseDropZonePanel.prototype.addIconAndTitleToGui = function () {
        var eGroupIcon = this.params.icon;
        var eTitleBar = document.createElement('div');
        eTitleBar.setAttribute('aria-hidden', 'true');
        this.addElementClasses(eTitleBar, 'title-bar');
        this.addElementClasses(eGroupIcon, 'icon');
        this.addOrRemoveCssClass('ag-column-drop-empty', this.isExistingColumnsEmpty());
        eTitleBar.appendChild(eGroupIcon);
        if (!this.horizontal) {
            var eTitle = document.createElement('span');
            this.addElementClasses(eTitle, 'title');
            eTitle.innerHTML = this.params.title;
            eTitleBar.appendChild(eTitle);
        }
        this.appendChild(eTitleBar);
    };
    BaseDropZonePanel.prototype.isExistingColumnsEmpty = function () {
        return this.getExistingColumns().length === 0;
    };
    BaseDropZonePanel.prototype.addEmptyMessageToGui = function () {
        if (!this.isExistingColumnsEmpty() || this.isPotentialDndColumns()) {
            return;
        }
        var eMessage = document.createElement('span');
        eMessage.innerHTML = this.params.emptyMessage;
        this.addElementClasses(eMessage, 'empty-message');
        this.eColumnDropList.appendChild(eMessage);
    };
    BaseDropZonePanel.prototype.addArrow = function (eParent) {
        // only add the arrows if the layout is horizontal
        if (this.horizontal) {
            // for RTL it's a left arrow, otherwise it's a right arrow
            var enableRtl = this.beans.gridOptionsWrapper.isEnableRtl();
            var icon = _.createIconNoSpan(enableRtl ? 'smallLeft' : 'smallRight', this.beans.gridOptionsWrapper);
            this.addElementClasses(icon, 'cell-separator');
            eParent.appendChild(icon);
        }
    };
    BaseDropZonePanel.STATE_NOT_DRAGGING = 'notDragging';
    BaseDropZonePanel.STATE_NEW_COLUMNS_IN = 'newColumnsIn';
    BaseDropZonePanel.STATE_REARRANGE_COLUMNS = 'rearrangeColumns';
    __decorate([
        Autowired('focusService')
    ], BaseDropZonePanel.prototype, "focusService", void 0);
    return BaseDropZonePanel;
}(Component));
export { BaseDropZonePanel };
//# sourceMappingURL=baseDropZonePanel.js.map