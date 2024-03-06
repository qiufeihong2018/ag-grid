import {
  accentBorder,
  calc,
  foregroundBorder,
  opaqueForeground,
  ref,
  transparentAccent,
  transparentBackground,
  transparentForeground,
} from '../..';
import { definePart } from '../../theme-utils';
import coreCssImport from './css/core/core.css?inline';
import indentTsImport from './css/indent';

/**
 * Test docs!
 */
export const core = definePart({
  feature: 'core',
  variant: 'core',
  defaults: {
    backgroundColor: '#FFF',
    foregroundColor: '#181d1f',
    accentColor: '#2196f3',
    invalidColor: '#e02525',
    borderColor: transparentForeground(0.15),
    wrapperBorder: true,
    headerBorder: true,
    rowBorder: true,
    footerBorder: true,
    columnBorder: false,
    pinnedColumnBorder: true,
    pinnedRowBorder: true,
    sidePanelBorder: true,
    sideButtonSelectedBorder: true,
    sideButtonSelectedBackgroundColor: ref('backgroundColor'),
    sideBarBackgroundColor: ref('chromeBackgroundColor'),
    fontFamily:
      "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif",
    chromeBackgroundColor: transparentForeground(0.02),
    headerBackgroundColor: ref('chromeBackgroundColor'),
    headerFontWeight: '500',
    headerForegroundColor: ref('foregroundColor'),
    headerCellHoverBackgroundColor: 'transparent',
    headerCellHoverBackgroundTransitionDuration: '0.2s',
    dataColor: ref('foregroundColor'),
    subtleForegroundColor: transparentForeground(0.5),
    rangeSelectionBorderStyle: 'solid',
    rangeSelectionBorderColor: ref('accentColor'),
    rangeSelectionBackgroundColor: transparentAccent(0.2),
    rangeSelectionChartBackgroundColor: '#0058FF1A',
    rangeSelectionChartCategoryBackgroundColor: '#00FF841A',
    rangeSelectionHighlightColor: transparentAccent(0.5),
    rowHoverColor: transparentAccent(0.12),
    columnHoverColor: transparentAccent(0.05),
    selectedRowBackgroundColor: transparentAccent(0.08),
    modalOverlayBackgroundColor: transparentBackground(0.66),
    oddRowBackgroundColor: ref('backgroundColor'),
    borderRadius: '4px',
    wrapperBorderRadius: '8px',
    cellWidgetSpacing: calc('gridSize * 1.5'),
    labelWidgetSpacing: ref('gridSize'),
    rowGroupIndentSize: calc('cellWidgetSpacing + iconSize'),
    valueChangeDeltaUpColor: '#43a047',
    valueChangeDeltaDownColor: '#e53935',
    valueChangeValueHighlightBackgroundColor: '#16a08580',
    gridSize: '8px',
    cellHorizontalPadding: calc('gridSize * 2'),
    fontSize: '14px',
    rowHeight: calc('fontSize + gridSize * 3.5'),
    headerHeight: calc('fontSize + gridSize * 4.25'),
    popupShadow: '0 0 16px 0 #00000026',
    dropdownShadow: '0 1px 4px 1px #babfc766',
    dragGhostBackgroundColor: ref('backgroundColor'),
    dragGhostBorder: true,
    dragGhostShadow: ref('popupShadow'),
    focusShadow: '0 0 0 3px color-mix(in srgb, transparent, var(--ag-accent-color) 50%)',
    sideBarPanelWidth: '250px',
    headerColumnResizeHandleDisplay: 'block',
    headerColumnResizeHandleHeight: '30%',
    headerColumnResizeHandleWidth: '2px',
    headerColumnResizeHandleColor: ref('borderColor'),
    widgetContainerHorizontalPadding: calc('gridSize * 1.5'),
    widgetContainerVerticalPadding: calc('gridSize * 1.5'),
    widgetHorizontalSpacing: calc('gridSize * 1.5'),
    widgetVerticalSpacing: ref('gridSize'),
    listItemHeight: calc('iconSize + widgetVerticalSpacing'),
    inputBackgroundColor: ref('backgroundColor'),
    inputDisabledBackgroundColor: opaqueForeground(0.06),
    inputDisabledForegroundColor: transparentForeground(0.5),
    inputBorder: true,
    inputDisabledBorder: true,
    inputInvalidBorder: 'solid 1px var(--ag-invalid-color)',
    inputFocusBorder: accentBorder(),
    inputHorizontalPadding: ref('gridSize'),
    inputBorderRadius: ref('borderRadius'),
    toggleButtonWidth: '28px',
    toggleButtonHeight: '18px',
    toggleButtonBorderWidth: '2px',
    toggleButtonOnBorderColor: ref('accentColor'),
    toggleButtonOnBackgroundColor: ref('accentColor'),
    toggleButtonOffBorderColor: opaqueForeground(0.3),
    toggleButtonOffBackgroundColor: opaqueForeground(0.3),
    toggleButtonSwitchBorderColor: ref('toggleButtonOffBorderColor'),
    toggleButtonSwitchBackgroundColor: ref('backgroundColor'),
    checkboxBorderWidth: '1px',
    checkboxBorderRadius: ref('borderRadius'),
    checkboxUncheckedBackgroundColor: ref('backgroundColor'),
    checkboxUncheckedBorderColor: opaqueForeground(0.3),
    checkboxCheckedBackgroundColor: ref('accentColor'),
    checkboxCheckedBorderColor: ref('accentColor'),
    checkboxCheckedShapeImage:
      "url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2210%22%20height%3D%227%22%20fill%3D%22none%22%3E%3Cpath%20stroke%3D%22%23000%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.75%22%20d%3D%22M1%203.5%203.5%206l5-5%22%2F%3E%3C%2Fsvg%3E')",
    checkboxCheckedShapeColor: ref('backgroundColor'),
    checkboxIndeterminateBackgroundColor: opaqueForeground(0.3),
    checkboxIndeterminateBorderColor: opaqueForeground(0.3),
    checkboxIndeterminateShapeImage:
      "url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2210%22%20height%3D%222%22%20fill%3D%22none%22%3E%3Crect%20width%3D%2210%22%20height%3D%222%22%20fill%3D%22%23000%22%20rx%3D%221%22%2F%3E%3C%2Fsvg%3E')",
    checkboxIndeterminateShapeColor: ref('backgroundColor'),
    radioCheckedShapeImage:
      "url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%226%22%20height%3D%226%22%20fill%3D%22none%22%3E%3Ccircle%20cx%3D%223%22%20cy%3D%223%22%20r%3D%223%22%20fill%3D%22%23000%22%2F%3E%3C%2Fsvg%3E')",
    menuBorder: foregroundBorder(0.2),
    menuBackgroundColor: opaqueForeground(0.03),
    menuForegroundColor: opaqueForeground(0.95),
    menuShadow: ref('popupShadow'),
    menuSeparatorColor: ref('borderColor'),
    setFilterIndentSize: ref('iconSize'),
    chartMenuButtonBorder: true,
    iconButtonHoverColor: transparentForeground(0.1),
    dialogShadow: ref('popupShadow'),
    dialogBorder: foregroundBorder(0.2),
    panelBackgroundColor: ref('backgroundColor'),
    panelTitleBarBackgroundColor: ref('headerBackgroundColor'),
    panelTitleBarBorder: true,
    columnSelectIndentSize: ref('iconSize'),
    toolPanelSeparatorBorder: true,
    tooltipBackgroundColor: ref('chromeBackgroundColor'),
    tooltipForegroundColor: ref('foregroundColor'),
    tooltipBorder: true,
    columnDropCellBackgroundColor: transparentForeground(0.07),
    columnDropCellBorder: foregroundBorder(0.13),
    advancedFilterBuilderButtonBarBorder: true,
    advancedFilterBuilderIndentSize: calc('gridSize * 2 + iconSize'),
    advancedFilterBuilderJoinPillColor: '#f08e8d',
    advancedFilterBuilderColumnPillColor: '#a6e194',
    advancedFilterBuilderOptionPillColor: '#f3c08b',
    advancedFilterBuilderValuePillColor: '#85c0e4',
    filterToolPanelGroupIndent: calc('gridSize'),
    iconButtonHoverBackgroundColor: transparentForeground(0.1),
  },
  css: [coreCssImport, indentTsImport],
});
