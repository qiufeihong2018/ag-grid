/**
 * @ag-grid-community/core - Advanced Data Grid / Data Table supporting Javascript / Typescript / React / Angular / Vue
 * @version v27.1.0
 * @link http://www.ag-grid.com/
 * @license MIT
 */
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
import { Component } from "./component";
var PopupComponent = /** @class */ (function (_super) {
    __extends(PopupComponent, _super);
    function PopupComponent() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PopupComponent.prototype.isPopup = function () {
        return true;
    };
    PopupComponent.prototype.setParentComponent = function (container) {
        container.addCssClass('ag-has-popup');
        _super.prototype.setParentComponent.call(this, container);
    };
    PopupComponent.prototype.destroy = function () {
        var parentComp = this.parentComponent;
        var hasParent = parentComp && parentComp.isAlive();
        if (hasParent) {
            parentComp.getGui().classList.remove('ag-has-popup');
        }
        _super.prototype.destroy.call(this);
    };
    return PopupComponent;
}(Component));
export { PopupComponent };
