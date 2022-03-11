/**
 * @ag-grid-community/core - Advanced Data Grid / Data Table supporting Javascript / Typescript / React / Angular / Vue
 * @version v27.1.0
 * @link http://www.ag-grid.com/
 * @license MIT
 */
import { doOnce } from "../../utils/function";
import { TextCellEditor } from "./textCellEditor";
export class PopupTextCellEditor extends TextCellEditor {
    constructor() {
        super();
        doOnce(() => console.warn('AG Grid: The PopupTextCellEditor (agPopupTextCellEditor) is deprecated. Instead use {cellEditor: "agTextCellEditor", cellEditorPopup: true} '), 'PopupTextCellEditor.deprecated');
    }
    isPopup() {
        return true;
    }
}
