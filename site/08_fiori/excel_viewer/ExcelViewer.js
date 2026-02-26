sap.ui.define([
], () => {
    "use strict";

    // 将索引颜色转换为RGB
    const indexedColors = [
        "#000000",
        "#FFFFFF",
        "#FF0000",
        "#00FF00",
        "#0000FF",
        "#FFFF00",
        "#FF00FF",
        "#00FFFF",
        "#000000",
        "#FFFFFF",
        "#FF0000",
        "#00FF00",
        "#0000FF",
        "#FFFF00",
        "#FF00FF",
        "#00FFFF",
        "#800000",
        "#008000",
        "#000080",
        "#808000",
        "#800080",
        "#008080",
        "#C0C0C0",
        "#808080",
        "#9999FF",
        "#993366",
        "#FFFFCC",
        "#CCFFFF",
        "#660066",
        "#FF8080",
        "#0066CC",
        "#CCCCFF",
        "#000080",
        "#FF00FF",
        "#FFFF00",
        "#00FFFF",
        "#800080",
        "#800000",
        "#008080",
        "#0000FF",
        "#00CCFF",
        "#CCFFFF",
        "#CCFFCC",
        "#FFFF99",
        "#99CCFF",
        "#FF99CC",
        "#CC99FF",
        "#FFCC99",
        "#3366FF",
        "#33CCCC",
        "#99CC00",
        "#FFCC00",
        "#FF9900",
        "#FF6600",
        "#666699",
        "#969696",
        "#003366",
        "#339966",
        "#003300",
        "#333300",
        "#993300",
        "#993366",
        "#333399",
        "#333333",
        // "#000000",
        // "#FFFFFF",
        "auto",
    ];

    /**
     * 将 SheetJS 工作簿对象转换为 Univer 数据格式
     * @param {import('xlsx').WorkBook} sheetJsWorkbook SheetJS 工作簿对象
     * @returns {object} Univer 兼容的工作表数据
     */
    function convertSheetJsToUniver(sheetJsWorkbook) {
        const univerData = {
            id: 'workbook-1', // 可以生成唯一ID
            name: sheetJsWorkbook.SheetNames[0] || 'Sheet1',
            sheetOrder: [],
            appVersion: '<%= pkg.version %>',
            sheets: {},
            locale: 'zh',
            styles: {},
            resources: []
        };

        // 全局样式计数器，确保所有工作表的样式ID唯一
        let globalStyleCounter = 0;

        // 处理每个工作表
        sheetJsWorkbook.SheetNames.forEach((sheetName, index) => {
            const sheetId = `sheet-${index + 1}`;
            univerData.sheetOrder.push(sheetId);

            const sheetJsSheet = sheetJsWorkbook.Sheets[sheetName];
            const { univerSheet, univerStyles } = convertSheetJsSheet(
                sheetJsSheet,
                () => `s${globalStyleCounter++}` // 传入ID生成器
            );

            // 合并样式
            Object.assign(univerData.styles, univerStyles);

            univerData.sheets[sheetId] = {
                ...univerSheet,
                id: sheetId,
                name: sheetName,
                tabColor: '',
                hidden: false,
                rowCount: univerSheet.rowCount || 100,
                columnCount: univerSheet.columnCount || 100,
                zoomRatio: 1,
                scrollTop: 0,
                scrollLeft: 0,
                freeze: {
                    xSplit: 0,
                    ySplit: 0,
                    startRow: 0,
                    startColumn: 0
                },
                selections: ['A1'],
                rightToLeft: false,
                filterRanges: []
            };
        });

        return univerData;
    }

    /**
     * 转换单个 SheetJS 工作表到 Univer 格式
     * @param {import('xlsx').WorkSheet} sheetJsSheet
     * @returns {object}
     */
    function convertSheetJsSheet(sheetJsSheet, generateStyleId) {
        const univerSheet = {
            cellData: {},
            rowData: [],
            columnData: [],
            rowCount: 0,
            columnCount: 0,
            status: 0,
            showGridlines: true,
            mergeData: [],
            autofilter: undefined
        };
        const univerStyles = {};

        // 获取单元格范围
        const range = sheetJsSheet['!ref'] ? XLSX.utils.decode_range(sheetJsSheet['!ref']) : { s: { c: 0, r: 0 }, e: { c: 0, r: 0 } };
        univerSheet.rowCount = range.e.r + 1;
        univerSheet.columnCount = range.e.c + 1;

        // 转换单元格数据
        for (let r = range.s.r; r <= range.e.r; r++) {
            for (let c = range.s.c; c <= range.e.c; c++) {
                const cellAddress = XLSX.utils.encode_cell({ r, c });
                const sheetJsCell = sheetJsSheet[cellAddress];

                if (sheetJsCell) {
                    const rowKey = r.toString();
                    const colKey = c.toString();

                    if (!univerSheet.cellData[rowKey]) {
                        univerSheet.cellData[rowKey] = {};
                    }

                    const { univerCell, univerStyle } = convertCell(sheetJsCell);
                    univerSheet.cellData[rowKey][colKey] = univerCell;

                    // 处理样式
                    if (univerStyle) {
                        const styleId = generateStyleId();
                        univerStyles[styleId] = univerStyle;
                        univerSheet.cellData[rowKey][colKey].s = styleId;
                    }
                }
            }
        }

        // 列设置
        if (sheetJsSheet['!cols']) {
            sheetJsSheet['!cols'].forEach(col => {
                univerSheet.columnData.push({
                    w: col.wpx,
                    hd: col["hidden"] ? 1 : undefined
                });
            });
        }

        // 行设置
        if (sheetJsSheet['!rows']) {
            // 筛选内的隐藏不作为隐藏处理
            const filterRange = sheetJsSheet['!autofilter'] ? XLSX.utils.decode_range(sheetJsSheet['!autofilter']['ref']) : { s: { c: 0, r: 0 }, e: { c: 0, r: 0 } };
            sheetJsSheet['!rows'].forEach((row, rowIndex) => {
                // 检查当前行是否在筛选范围内
                const isInFilterRange = rowIndex >= filterRange.s.r && rowIndex <= filterRange.e.r;
                // 只有在不在筛选范围内且被隐藏时才设置hd为true
                const shouldHide = row.hidden && !isInFilterRange;
                univerSheet.rowData.push({
                    h: row.hpx,
                    hd: row["hidden"] ? shouldHide : undefined
                });
            });
        }

        // 处理合并单元格
        if (sheetJsSheet['!merges']) {
            sheetJsSheet['!merges'].forEach(merge => {
                univerSheet.mergeData.push({
                    startRow: merge.s.r,
                    endRow: merge.e.r,
                    startColumn: merge.s.c,
                    endColumn: merge.e.c
                });
            });
        }

        // 筛选范围
        if (sheetJsSheet['!autofilter']) {
            univerSheet.autofilter = sheetJsSheet['!autofilter']['ref'];
        }

        return { univerSheet, univerStyles };
    }

    /**
     * 转换单个单元格数据
     * @link https://docs.univer.ai/zh-CN/guides/sheets/getting-started/cell-data 参考Univer单元格文档
     * @link https://xlsx.nodejs.cn/docs/csf/cell SheetJS
     * @param {import('xlsx').CellObject} sheetJsCell
     * @returns {object}
     */
    function convertCell(sheetJsCell) {
        const univerCell = {
            v: sheetJsCell.v,
            p: converCellRichValue(sheetJsCell),
            t: determineCellType(sheetJsCell),
            s: null,
            f: sheetJsCell.f || null
        };

        // 样式采用共享样式方案，单独处理
        let univerStyle = convertCellStyle(sheetJsCell);

        return { univerCell, univerStyle };
    }

    /**
     * 处理富文本
     * @param {import('xlsx').CellObject} sheetJsCell
     * @returns {object}
     */
    function converCellRichValue(sheetJsCell) {
        // 文本需要转换下换行
        if (sheetJsCell.t === 's' && sheetJsCell.v && sheetJsCell.v.indexOf("\n") > 0) {
            return {
                body: { dataStream: sheetJsCell.v.replace(/\r\n|\n/g, "\r").concat("\r\n") },
                documentStyle: { textStyle: convertRichValueStyle(sheetJsCell) }
            };
        }
        return null;
    }

    /**
     * 处理样式
     * @param {import('xlsx').CellObject} sheetJsCell
     * @returns {object}
     */
    function convertCellStyle(sheetJsCell) {
        let univerStyle = null;
        if (sheetJsCell.s) {
            univerStyle = {
                ff: sheetJsCell.s.font ? sheetJsCell.s.font.name : 'Arial',
                fs: sheetJsCell.s.font ? sheetJsCell.s.font.sz : 12,
                it: sheetJsCell.s.font ? sheetJsCell.s.font.italic : 0,
                bl: sheetJsCell.s.font ? sheetJsCell.s.font.bold : 0,
                // ul: sheetJsCell.s.font ? sheetJsCell.s.font.underline : 0, // 下划线
                // st: sheetJsCell.s.font ? sheetJsCell.s.font.strike : 0, // 删除线
                bg: convertColor(sheetJsCell.s.fill ? sheetJsCell.s.fill.fgColor : null),
                bd: convertBorder(sheetJsCell.s.border),
                cl: convertColor(sheetJsCell.s.font ? sheetJsCell.s.font.color : null),
                vt: convertAlignmentVertical(sheetJsCell.s.alignment ? sheetJsCell.s.alignment.vertical : 'top'),
                ht: convertAlignmentHorizontal(sheetJsCell.s.alignment ? sheetJsCell.s.alignment.horizontal : 'left'),
                tb: convertWrapStrategy(sheetJsCell.s.alignment ? sheetJsCell.s.alignment.wrapText : false)
            };
        }
        return univerStyle;
    }

    /**
     * 处理样式
     * @param {import('xlsx').CellObject} sheetJsCell
     * @returns {object}
     */
    function convertRichValueStyle(sheetJsCell) {
        let univerStyle = null;
        if (sheetJsCell.s) {
            univerStyle = {
                ff: sheetJsCell.s.font ? sheetJsCell.s.font.name : 'Arial',
                fs: sheetJsCell.s.font ? sheetJsCell.s.font.sz : 12,
                it: sheetJsCell.s.font ? sheetJsCell.s.font.italic : 0,
                bl: sheetJsCell.s.font ? sheetJsCell.s.font.bold : 0,
                // ul: sheetJsCell.s.font ? sheetJsCell.s.font.underline : 0, // 下划线
                // st: sheetJsCell.s.font ? sheetJsCell.s.font.strike : 0, // 删除线
                // bg: convertColor(sheetJsCell.s.fill ? sheetJsCell.s.fill.fgColor : null),
                // bd: convertBorder(sheetJsCell.s.border),
                // cl: convertColor(sheetJsCell.s.font ? sheetJsCell.s.font.color : null),
                vt: convertAlignmentVertical(sheetJsCell.s.alignment ? sheetJsCell.s.alignment.vertical : 'top'),
                ht: convertAlignmentHorizontal(sheetJsCell.s.alignment ? sheetJsCell.s.alignment.horizontal : 'left'),
                tb: convertWrapStrategy(sheetJsCell.s.alignment ? sheetJsCell.s.alignment.wrapText : false)
            };
        }
        return univerStyle;
    }

    /**
     * 确定单元格类型
     * @param {import('xlsx').CellObject} cell
     * @returns {string}
     */
    function determineCellType(cell) {
        if (cell.t === 's') return UniverCore.CellValueType.STRING; // 字符串
        if (cell.t === 'n') return UniverCore.CellValueType.NUMBER; // 数字
        if (cell.t === 'b') return UniverCore.CellValueType.BOOLEAN; // 布尔值
        if (cell.t === 'e') return UniverCore.CellValueType.FORCE_STRING; // 错误
        if (cell.t === 'd') return UniverCore.CellValueType.NUMBER; // 日期
        return UniverCore.CellValueType.STRING; // 默认字符串
    }

    /**
     * 转换边框设置
     */
    function convertBorder(sheetJsBorder) {
        var univerBorder = {};
        if (sheetJsBorder.top) {
            univerBorder.t = {
                cl: convertColor(sheetJsBorder.top.color),
                s: convertBorderType(sheetJsBorder.top.style)
            };
        }
        if (sheetJsBorder.bottom) {
            univerBorder.b = {
                cl: convertColor(sheetJsBorder.bottom.color),
                s: convertBorderType(sheetJsBorder.bottom.style)
            };
        }
        if (sheetJsBorder.left) {
            univerBorder.l = {
                cl: convertColor(sheetJsBorder.left.color),
                s: convertBorderType(sheetJsBorder.left.style)
            };
        }
        if (sheetJsBorder.right) {
            univerBorder.r = {
                cl: convertColor(sheetJsBorder.right.color),
                s: convertBorderType(sheetJsBorder.right.style)
            };
        }
        return univerBorder;
    }

    /**
     * 转换边框类型
     */
    function convertBorderType(borderstyle) {
        if (borderstyle === 'thin') return UniverCore.BorderStyleTypes.THIN;
        if (borderstyle === 'hair') return UniverCore.BorderStyleTypes.HAIR;
        if (borderstyle === 'dotted') return UniverCore.BorderStyleTypes.DOTTED;
        if (borderstyle === 'dashed') return UniverCore.BorderStyleTypes.DASHED;
        if (borderstyle === 'dash_dot') return UniverCore.BorderStyleTypes.DASH_DOT;
        if (borderstyle === 'dasg_dot_dot') return UniverCore.BorderStyleTypes.DASH_DOT_DOT;
        if (borderstyle === 'double') return UniverCore.BorderStyleTypes.DOUBLE;
        if (borderstyle === 'medium') return UniverCore.BorderStyleTypes.MEDIUM;
        if (borderstyle === 'medium_dashed') return UniverCore.BorderStyleTypes.MEDIUM_DASHED;
        if (borderstyle === 'medium_dash_dot') return UniverCore.BorderStyleTypes.MEDIUM_DASH_DOT;
        if (borderstyle === 'medium_dash_dot_dot') return UniverCore.BorderStyleTypes.MEDIUM_DASH_DOT_DOT;
        if (borderstyle === 'slant_dash_dot') return UniverCore.BorderStyleTypes.SLANT_DASH_DOT;
        if (borderstyle === 'thick') return UniverCore.BorderStyleTypes.THICK;
        return UniverCore.BorderStyleTypes.NONE;
    }

    /**
     * 转换水平对齐方式
     */
    function convertAlignmentHorizontal(horizontal) {
        if (horizontal === 'left') return UniverCore.HorizontalAlign.LEFT;
        if (horizontal === 'center') return UniverCore.HorizontalAlign.CENTER;
        if (horizontal === 'right') return UniverCore.HorizontalAlign.RIGHT;
        return UniverCore.HorizontalAlign.LEFT;
    }

    /**
     * 转换垂直对齐方式
     */
    function convertAlignmentVertical(vertical) {
        if (vertical === 'top') return UniverCore.VerticalAlign.TOP;
        if (vertical === 'center') return UniverCore.VerticalAlign.MIDDLE;
        if (vertical === 'buttom') return UniverCore.VerticalAlign.BOTTOM;
        return UniverCore.VerticalAlign.TOP;
    }

    /**
     * 自动换行
     */
    function convertWrapStrategy(WrapStrategy) {
        return WrapStrategy ? UniverCore.WrapStrategy.WRAP : UniverCore.WrapStrategy.UNSPECIFIED;
    }

    /**
     * 转换颜色格式
     */
    function convertColor(color) {
        if (!color) return undefined;
        var univerColor = {};
        if (color.rgb)
            univerColor.rgb = `\#${color.rgb}`;
        // theme color 已被弃用
        // if (color.theme)
        //     univerColor.th = color.theme;
        if (color.auto)
            univerColor.rgb = indexedColors[64];
        if (color.indexed)
            univerColor.rgb = indexedColors[color.indexed] || indexedColors[64];
        if (color.tint)
            univerColor.rgb = `\#${applyTintToColor("FFFFFF", color.tint)}`;
        if (!univerColor["rgb"])
            return null;
        return univerColor;
    }

    function applyTintToColor(baseColor, tint) {
        // baseColor 格式为 RRGGBB 十六进制字符串
        // tint 是 OpenXML 的 tint 值 (-1 到 1)

        // 将十六进制转换为RGB分量
        let r = parseInt(baseColor.substr(0, 2), 16);
        let g = parseInt(baseColor.substr(2, 2), 16);
        let b = parseInt(baseColor.substr(4, 2), 16);

        if (tint < 0) {
            // 变暗：与黑色混合
            let factor = 1 + tint; // tint是负值，所以1 + (-0.5) = 0.5
            r = Math.round(r * factor);
            g = Math.round(g * factor);
            b = Math.round(b * factor);
        } else if (tint > 0) {
            // 变亮：与白色混合
            r = Math.round(r + (255 - r) * tint);
            g = Math.round(g + (255 - g) * tint);
            b = Math.round(b + (255 - b) * tint);
        }

        // 确保值在0-255范围内
        r = Math.max(0, Math.min(255, r));
        g = Math.max(0, Math.min(255, g));
        b = Math.max(0, Math.min(255, b));

        // 转换回十六进制
        const toHex = (c) => c.toString(16).padStart(2, '0');
        return toHex(r) + toHex(g) + toHex(b);
    }

    return {
        createUniver() {
            if (!this.univerAPI) {
                const { createUniver } = UniverPresets;
                const { LocaleType, merge } = UniverCore;
                const { defaultTheme } = UniverDesign;
                const { UniverSheetsCorePreset } = UniverPresetSheetsCore;
                const { UniverSheetsConditionalFormattingPreset } = UniverPresetSheetsConditionalFormatting;
                const { UniverSheetsDataValidationPreset } = UniverPresetSheetsDataValidation;
                const { UniverSheetsDrawingPreset } = UniverPresetSheetsDrawing;
                const { UniverSheetsFilterPreset } = UniverPresetSheetsFilter;
                const { UniverSheetsHyperLinkPreset } = UniverPresetSheetsHyperLink;

                const { univerAPI } = createUniver({
                    locale: LocaleType.ZH_CN,
                    locales: {
                        [LocaleType.ZH_CN]: merge(
                            {},
                            UniverPresetSheetsCoreZhCN,
                            UniverPresetSheetsConditionalFormattingZhCN,
                            UniverPresetSheetsDataValidationZhCN,
                            UniverPresetSheetsDrawingZhCN,
                            UniverPresetSheetsFilterZhCN,
                            UniverPresetSheetsHyperLinkZhCN,
                        ),
                    },
                    theme: defaultTheme,
                    presets: [
                        UniverSheetsCorePreset(),
                        UniverSheetsConditionalFormattingPreset(),
                        UniverSheetsDataValidationPreset(),
                        UniverSheetsDrawingPreset(),
                        UniverSheetsFilterPreset(),
                        UniverSheetsHyperLinkPreset(),
                    ],
                });
                this.univerAPI = univerAPI;
            }
            return this.univerAPI;
        },

        loadFile: function (file) {
            // 使用SheetJS解析Excel文件
            const fnReadFile = function (file, callback) {
                var fileReader = new FileReader();
                fileReader.onload = function (oEvent) {
                    callback(XLSX.read(new Uint8Array(oEvent.target.result), { type: 'array', cellStyles: true }));
                };
                fileReader.readAsArrayBuffer(file);
            };

            // 转换成Univer格式并展示
            fnReadFile(file, (oExcel) => {
                // 转换为Univer格式
                const univerData = convertSheetJsToUniver(oExcel);
                // 使用Univer数据
                this.loadUniverData(univerData);
            });
        },

        loadUniverData: function (univerData) {
            const univerAPI = this.createUniver();
            const fWorkbook = univerAPI.createWorkbook(univerData);

            // 创建工作表后命令还没注册，因此要稍微延时一点时间再处理筛选项
            setTimeout(() => {
                for (const sheetId in univerData.sheets) {
                    const fWorksheet = fWorkbook.getSheetBySheetId(sheetId);
                    const univerSheet = univerData.sheets[sheetId];
                    if (!univerSheet["autofilter"]) continue;

                    const fRange = fWorksheet.getRange(univerSheet["autofilter"]);
                    let fFilter = fRange.createFilter();

                    // 如果工作表已经有筛选器，则移除它并创建一个新的筛选器。
                    if (!fFilter) {
                        fWorksheet.getFilter().remove();
                        fFilter = fRange.createFilter();
                    }
                }
            }, 1000);
        }
    };
});
