# Excel Viewer

使用SheetJS解析Excel数据，用Univer渲染网页。

## SheetJS

由于项目在内网中，无法在线访问脚本，所以要把用到的[脚本](./fiori/excel_viewer/xlsx.js)下载到本地进行引用

### 微调

由于SheetJS的解析不包含边框信息，因此要修改parse_borders方法将边框信息带出

<details>
  <summary>parse_borders</summary>

```JavaScript hl_lines="6 22-114"

/* [modify] read more style - xiaofeng */
/* 18.8.5 borders CT_Borders */
function parse_borders(t, styles, themes, opts) {
 styles.Borders = [];
 var border = {};
 var currentSide = null;
 var pass = false;
 (t[0].match(tagregex)||[]).forEach(function(x) {
  var y = parsexmltag(x);
  switch(strip_ns(y[0])) {
   case '<borders': case '<borders>': case '</borders>': break;

   /* 18.8.4 border CT_Border */
   case '<border': case '<border>': case '<border/>':
    border = {};
    if(y.diagonalUp) border.diagonalUp = parsexmlbool(y.diagonalUp);
    if(y.diagonalDown) border.diagonalDown = parsexmlbool(y.diagonalDown);
    styles.Borders.push(border);
    break;
   case '</border>': break;

   /* note: not in spec, appears to be CT_BorderPr */
   case '<left/>': border.left = { style: 'none' }; break;
   case '<left': case '<left>': 
    currentSide = 'left';
    border.left = {};
    if(y.style) border.left.style = y.style;
    break;
   case '</left>': currentSide = null; break;

   /* note: not in spec, appears to be CT_BorderPr */
   case '<right/>': border.right = { style: 'none' }; break;
   case '<right': case '<right>': 
    currentSide = 'right';
    border.right = {};
    if(y.style) border.right.style = y.style;
    break;
   case '</right>': currentSide = null; break;

   /* 18.8.43 top CT_BorderPr */
   case '<top/>': border.top = { style: 'none' }; break;
   case '<top': case '<top>': 
    currentSide = 'top';
    border.top = {};
    if(y.style) border.top.style = y.style;
    break;
   case '</top>': currentSide = null; break;

   /* 18.8.6 bottom CT_BorderPr */
   case '<bottom/>': border.bottom = { style: 'none' }; break;
   case '<bottom': case '<bottom>': 
    currentSide = 'bottom';
    border.bottom = {};
    if(y.style) border.bottom.style = y.style;
    break;
   case '</bottom>': currentSide = null; break;

   /* 18.8.13 diagonal CT_BorderPr */
   case '<diagonal/>': border.diagonal = { style: 'none' }; break;
   case '<diagonal': case '<diagonal>': 
    currentSide = 'diagonal';
    border.diagonal = {};
    if(y.style) border.diagonal.style = y.style;
    break;
   case '</diagonal>': currentSide = null; break;

   /* 18.8.25 horizontal CT_BorderPr */
   case '<horizontal/>': border.horizontal = { style: 'none' }; break;
   case '<horizontal': case '<horizontal>': 
    currentSide = 'horizontal';
    border.horizontal = {};
    if(y.style) border.horizontal.style = y.style;
    break;
   case '</horizontal>': currentSide = null; break;

   /* 18.8.44 vertical CT_BorderPr */
   case '<vertical/>': border.vertical = { style: 'none' }; break;
   case '<vertical': case '<vertical>': 
    currentSide = 'vertical';
    border.vertical = {};
    if(y.style) border.vertical.style = y.style;
    break;
   case '</vertical>': currentSide = null; break;

   /* 18.8.37 start CT_BorderPr */
   case '<start/>': border.start = { style: 'none' }; break;
   case '<start': case '<start>': 
    currentSide = 'start';
    border.start = {};
    if(y.style) border.start.style = y.style;
    break;
   case '</start>': currentSide = null; break;

   /* 18.8.16 end CT_BorderPr */
   case '<end/>': border.end = { style: 'none' }; break;
   case '<end': case '<end>': 
    currentSide = 'end';
    border.end = {};
    if(y.style) border.end.style = y.style;
    break;
   case '</end>': currentSide = null; break;

   /* 18.8.? color CT_Color */
   case '<color': case '<color>':
    if(currentSide && border[currentSide]) {
     border[currentSide].color = {};
     if(y.rgb) border[currentSide].color.rgb = y.rgb;
     if(y.theme) border[currentSide].color.theme = parseInt(y.theme);
     if(y.tint) border[currentSide].color.tint = parseFloat(y.tint);
     if(y.auto) border[currentSide].color.auto = parsexmlbool(y.auto);
     if(y.indexed) border[currentSide].color.indexed = parseInt(y.indexed);
    }
    break;
   case '<color/>': case '</color>': break;

   /* 18.2.10 extLst CT_ExtensionList ? */
   case '<extLst': case '<extLst>': case '</extLst>': break;
   case '<ext': pass = true; break;
   case '</ext>': pass = false; break;
   default: if(opts && opts.WTF) {
    if(!pass) throw new Error('unrecognized ' + y[0] + ' in borders');
   }
  }
 });
}
/* [modify] read more style - xiaofeng */

```

</details>

同理，由于SheetJS样式信息太少，需要调整：

<details>
  <summary>safe_format</summary>

```JavaScript hl_lines="1 27-54"

function safe_format(p, fmtid, fontid, fillid, borderid, alignment, opts, themes, styles, date1904) {
 try {
  if(opts.cellNF) p.z = table_fmt[fmtid];
 } catch(e) { if(opts.WTF) throw e; }
 if(p.t === 'z' && !opts.cellStyles) return;
 if(p.t === 'd' && typeof p.v === 'string') p.v = parseDate(p.v);
 if((!opts || opts.cellText !== false) && p.t !== 'z') try {
  if(table_fmt[fmtid] == null) SSF__load(SSFImplicit[fmtid] || "General", fmtid);
  if(p.t === 'e') p.w = p.w || BErr[p.v];
  else if(fmtid === 0) {
   if(p.t === 'n') {
    if((p.v|0) === p.v) p.w = p.v.toString(10);
    else p.w = SSF_general_num(p.v);
   }
   else if(p.t === 'd') {
    var dd = datenum(p.v, !!date1904);
    if((dd|0) === dd) p.w = dd.toString(10);
    else p.w = SSF_general_num(dd);
   }
   else if(p.v === undefined) return "";
   else p.w = SSF_general(p.v,_ssfopts);
  }
  else if(p.t === 'd') p.w = SSF_format(fmtid,datenum(p.v, !!date1904),_ssfopts);
  else p.w = SSF_format(fmtid,p.v,_ssfopts);
 } catch(e) { if(opts.WTF) throw e; }
 if(!opts.cellStyles) return; 
 /** [add] - read more style - xiaofeng */
 if(!p.s) p.s = {};
 if(fontid != null) try {
  p.s.font = styles.Fonts[fontid];
  if (p.s.font.color && p.s.font.color.theme && !p.s.font.color.rgb) {
   p.s.font.color.rgb = rgb_tint(themes.themeElements.clrScheme[p.s.font.color.theme].rgb, p.s.font.color.tint || 0);
   if(opts.WTF) p.s.font.color.raw_rgb = themes.themeElements.clrScheme[p.s.font.color.theme].rgb;
  }
 } catch(e) { if(opts.WTF && styles.Fonts) throw e; }
 
 if(fillid != null) try {
  p.s.fill = styles.Fills[fillid];
  if (p.s.fill.fgColor && p.s.fill.fgColor.theme && !p.s.fill.fgColor.rgb) {
   p.s.fill.fgColor.rgb = rgb_tint(themes.themeElements.clrScheme[p.s.fill.fgColor.theme].rgb, p.s.fill.fgColor.tint || 0);
   if(opts.WTF) p.s.fill.fgColor.raw_rgb = themes.themeElements.clrScheme[p.s.fill.fgColor.theme].rgb;
  }
  if (p.s.fill.bgColor && p.s.fill.bgColor.theme) {
   p.s.fill.bgColor.rgb = rgb_tint(themes.themeElements.clrScheme[p.s.fill.bgColor.theme].rgb, p.s.fill.bgColor.tint || 0);
   if(opts.WTF) p.s.fill.bgColor.raw_rgb = themes.themeElements.clrScheme[p.s.fill.bgColor.theme].rgb;
  }
 } catch(e) { if(opts.WTF && styles.Fills) throw e; }
 
 if(borderid != null) try {
  p.s.border = styles.Borders[borderid];
 } catch(e) { if(opts.WTF && styles.Borders) throw e; }
 
 if(alignment != null) p.s.alignment = alignment;
 /** [add] - read more style - xiaofeng */
}

```

</details>

调用safe_format的地方也要调整

<details>
  <summary>parse_ws_xml_data</summary>

```JavaScript hl_lines="4 5 13 14 15 19"

return function parse_ws_xml_data(sdata, s, opts, guess, themes, styles, wb) {
   /* ... */
   /* formatting */
   fmtid = fontid = fillid = borderid = 0; // read more style - xiaofeng
   alignment = null; // read more style - xiaofeng
   cf = null;
   if(do_format && tag.s !== undefined) {
    cf = styles.CellXf[tag.s];
    if(cf != null) {
     if(cf.numFmtId != null) fmtid = cf.numFmtId;
     if(opts.cellStyles) {
      if(cf.fillId != null) fillid = cf.fillId;
      if(cf.fontId != null) fontid = cf.fontId;
      if(cf.borderId != null) borderid = cf.borderId;
      if(cf.alignment != null) alignment = cf.alignment;
     }
    }
   }
   safe_format(p, fmtid, fontid, fillid, borderid, alignment, opts, themes, styles, date1904);
   if(opts.cellDates && do_format && p.t == 'n' && fmt_is_date(table_fmt[fmtid])) { p.v = numdate(p.v + (date1904 ? 1462 : 0)); p.t = typeof p.v == "number" ? 'n' : 'd'; }
   /* ... */
};

```

</details>

## Univer

Univer代码没有要调整的，只是由于项目在内网中，无法在线访问脚本，所以要把用到的[脚本](./fiori/excel_viewer/univer.zip)都下载到本地进行引用

注意，由于Univer需要一个id=app的div块，所以还要将下面的div块加上id

<details>
  <summary>index.html加载第三方工具</summary>

```html hl_lines="14-48 64"

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Excel Viewer</title>
    <style>
        html, body, body > div, #container, #container-uiarea {
            height: 100%;
        }
    </style>
    
    <script src="./util/xlsx.js"></script>

    <script src="./util/univer/react.production.min.js"></script>
    <script src="./util/univer/react-dom.production.min.js"></script>
    <script src="./util/univer/rxjs.umd.min.js"></script> 
    <script src="./util/univer/echarts.min.js"></script>
    
    <script src="./util/univer/preset.js"></script> 
    
    <script src="./util/univer/preset-sheets-core/index.js"></script>
    <script src="./util/univer/preset-sheets-core/locales/zh-CN.js"></script>
    <link rel="stylesheet" href="./util/univer/preset-sheets-core/css/index.css" />
    
    <script src="./util/univer/preset-sheets-conditional-formatting/index.js"></script>
    <script src="./util/univer/preset-sheets-conditional-formatting/locales/zh-CN.js"></script>
    <link rel="stylesheet" href="./util/univer/preset-sheets-conditional-formatting/css/index.css" />

    <script src="./util/univer/preset-sheets-data-validation/index.js"></script>
    <script src="./util/univer/preset-sheets-data-validation/locales/zh-CN.js"></script>
    <link rel="stylesheet" href="./util/univer/preset-sheets-data-validation/css/index.css" />
    
    <script src="./util/univer/preset-sheets-drawing/index.js"></script>
    <script src="./util/univer/preset-sheets-drawing/locales/zh-CN.js"></script>
    <link rel="stylesheet" href="./util/univer/preset-sheets-drawing/css/index.css" />
    
    <script src="./util/univer/preset-sheets-filter/index.js"></script>
    <script src="./util/univer/preset-sheets-filter/locales/zh-CN.js"></script>
    <link rel="stylesheet" href="./util/univer/preset-sheets-filter/css/index.css" />
    
    <script src="./util/univer/preset-sheets-hyper-link/index.js"></script>
    <script src="./util/univer/preset-sheets-hyper-link/locales/zh-CN.js"></script>
    <link rel="stylesheet" href="./util/univer/preset-sheets-hyper-link/css/index.css" />

    <!-- 核心样式优先，最后加载再加载一次样式，调整渲染优先度 -->
    <link rel="stylesheet" href="./util/univer/preset-sheets-core/css/index.css" />
    
   <script
        id="sap-ui-bootstrap"
        src="resources/sap-ui-core.js"
        data-sap-ui-theme="sap_horizon"
        data-sap-ui-resourceroots='{
            "zexcelviewer": "./"
        }'
        data-sap-ui-oninit="module:sap/ui/core/ComponentSupport"
        data-sap-ui-compatVersion="edge"
        data-sap-ui-async="true"
        data-sap-ui-frameOptions="trusted"
    ></script>
</head>
<body class="sapUiBody sapUiSizeCompact" id="content">
    <div id="app"
        data-sap-ui-component
        data-name="zexcelviewer"
        data-id="container"
        data-settings='{"id" : "zexcelviewer"}'
        data-handle-validation="true"
    ></div>
</body>

</html>

```

</details>

## ExcelViewer工具

里面主要逻辑是将SheetJS数据转换为Univer要求的数据格式，具体见下面代码：

<details>
  <summary>ExcelViewer.js</summary>

```JavaScript
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
            const cols = sheetJsSheet['!cols'] || [];
            for (let colIndex = 0; colIndex < cols.length; colIndex++) {
                const col = cols[colIndex];

                if (!col) {
                    univerSheet.columnData.push(null); // 直接 push(null)
                    continue;
                }

                // 严格判断 hidden 属性：必须是显式定义的 boolean 类型
                const isHidden = typeof col.hidden === 'boolean' && col.hidden;

                univerSheet.columnData.push({
                    w: col.wpx, // 如果 wpx 是 null，会保持 null
                    hd: isHidden ? true : undefined
                });
            }
        }

        // 行设置
        if (sheetJsSheet['!rows']) {
            // 筛选内的隐藏不作为隐藏处理
            const filterRange = sheetJsSheet['!autofilter'] ? XLSX.utils.decode_range(sheetJsSheet['!autofilter']['ref']) : { s: { c: 0, r: 0 }, e: { c: 0, r: 0 } };
            const rows = sheetJsSheet['!rows'] || [];
            for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
                const row = rows[rowIndex];

                if (!row) {
                    univerSheet.rowData.push(null); // 直接 push(null)
                    continue;
                }

                // 检查当前行是否在筛选范围内
                const isInFilterRange = rowIndex >= filterRange.s.r && rowIndex <= filterRange.e.r;

                // 严格判断 hidden 属性：必须是显式定义的 boolean 类型
                const isHidden = typeof row.hidden === 'boolean' && row.hidden;

                // 只有在不在筛选范围内且被隐藏时才设置 hd 为 true
                const shouldHide = isHidden && !isInFilterRange;

                univerSheet.rowData.push({
                    h: row.hpx, // 如果 hpx 是 null，会保持 null（取决于业务需求）
                    hd: isHidden ? shouldHide : undefined
                });
            }
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
                ul: convertUnderline(sheetJsCell),
                st: convertStrike(sheetJsCell),
                bg: convertColor(sheetJsCell.s.fill ? sheetJsCell.s.fill.fgColor : null),
                bd: convertBorder(sheetJsCell.s.border),
                cl: convertColor(sheetJsCell.s.font ? sheetJsCell.s.font.color : null),
                vt: convertAlignmentVertical(sheetJsCell.s.alignment ? sheetJsCell.s.alignment.vertical : null),
                ht: convertAlignmentHorizontal(sheetJsCell.s.alignment ? sheetJsCell.s.alignment.horizontal : null),
                tb: convertWrapStrategy(sheetJsCell)

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
                ul: convertUnderline(sheetJsCell),
                st: convertStrike(sheetJsCell),
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
     * @param {import('xlsx').CellObject} sheetJsCell
     * @returns {string}
     */
    function determineCellType(sheetJsCell) {
        if (sheetJsCell.t === 's') return UniverCore.CellValueType.STRING; // 字符串
        if (sheetJsCell.t === 'n') return UniverCore.CellValueType.NUMBER; // 数字
        if (sheetJsCell.t === 'b') return UniverCore.CellValueType.BOOLEAN; // 布尔值
        if (sheetJsCell.t === 'e') return UniverCore.CellValueType.FORCE_STRING; // 错误
        if (sheetJsCell.t === 'd') return UniverCore.CellValueType.NUMBER; // 日期
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
     * 下划线
     * @param {import('xlsx').CellObject} sheetJsCell
     * @returns {string}
     */
    function convertUnderline(sheetJsCell) {
        if (sheetJsCell.s && sheetJsCell.s.font && sheetJsCell.s.font.underline) {
            return {
                s: 1,
                t: UniverCore.BorderStyleTypes.DASH
            };
        }
        return null;
    }

    /**
     * 删除线
     * @param {import('xlsx').CellObject} sheetJsCell
     * @returns {string}
     */
    function convertStrike(sheetJsCell) {
        if (sheetJsCell.s && sheetJsCell.s.font && sheetJsCell.s.font.strike) {
            return {
                s: 1,
                t: UniverCore.BorderStyleTypes.DASH
            };
        }
        return null;
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
     * @param {import('xlsx').CellObject} sheetJsCell
     * @returns {string}
     */
    function convertWrapStrategy(sheetJsCell) {
        if (sheetJsCell.s && sheetJsCell.s.alignment)
            return sheetJsCell.s.alignment.wrapText ? UniverCore.WrapStrategy.WRAP : UniverCore.WrapStrategy.UNSPECIFIED;
        return null;
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
                        fFilter = fWorksheet.getFilter();
                        // 测试发现Range只有一行也是无法创建筛选的，额外增加判断
                        if (fFilter) {
                            fFilter.remove();
                            fFilter = fRange.createFilter();
                        }
                    }
                }
            }, 1000);
        }
    };
});

```

</details>

## Controller调整

加载页面后，解析网页地址上的ExcelID，到后端获取Excel文件。解析Excel数据后，转换成Univer数据格式并进行渲染

<details>
  <summary>Home.controller.js</summary>

```JavaScript

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "zexcelviewer/util/Service",
    "zexcelviewer/util/ExcelViewer",
], (Controller, Service, ExcelViewer) => {
    "use strict";

    return Controller.extend("zexcelviewer.controller.Home", {
        onInit() {
            /** @type {sap.ui.model.odata.v2.ODataModel} */
            this.ODataModel = this.getOwnerComponent().getModel();
        },

        /**
         * @override
         */
        onAfterRendering() {
            var sExcelId = this._getLocationParameter('excel-id');
            if (sExcelId) {
                this._renderExcel(sExcelId);
            } else {
                ExcelViewer.loadUniverData({ name: "Sheet1" });
            }
        },

        _renderExcel: function (excelId) {
            if (!excelId) return;
            var oRequestData = {
                Action: "GET_EXCEL",
                to_Header: {
                    Name: excelId
                }
            };
            Service.request(this.ODataModel, "/Backend", oRequestData).then((oData) => {
                var name = oData.to_Header.Filename;
                var data = oData.to_Header.Content;
                var type = oData.to_Header.Mimetype;
                var uint8Array = new Uint8Array(Service.hexToBytes(data));
                var file = new Blob([uint8Array], { type: "application/" + type + ";charset=utf-8" });
                ExcelViewer.loadFile(file);
            });
        },

        /**
         * 从当前页面的 URL 中获取指定参数的值
         * @param {string} paramName - 要获取的参数名
         * @param {object} [options] - 可选配置
         * @param {boolean} [options.caseSensitive=false] - 是否区分大小写
         * @returns {string|null} 参数值，如果不存在则返回 null
         */
        _getLocationParameter: function (paramName, options = {}) {
            const { caseSensitive = false } = options;
            const searchParam = caseSensitive ? paramName : paramName.toLowerCase();

            // 1. 检查 search 参数（?后面的部分）
            const searchParams = new URLSearchParams(window.location.search);
            for (const [key, value] of searchParams.entries()) {
                const currentKey = caseSensitive ? key : key.toLowerCase();
                if (currentKey === searchParam) {
                    return value;
                }
            }

            // 2. 检查 hash 参数（#后面的部分，可能带 ? 参数）
            const hash = window.location.hash;
            if (hash.includes('?')) {
                const hashQueryString = hash.split('?')[1];
                const hashParams = new URLSearchParams(hashQueryString);
                for (const [key, value] of hashParams.entries()) {
                    const currentKey = caseSensitive ? key : key.toLowerCase();
                    if (currentKey === searchParam) {
                        return value;
                    }
                }
            }

            // 3. 如果都没找到，返回 null
            return null;
        }

    });
});

```

</details>

## 结语

整个方案的核心是Univer渲染，所以文件下载，数据格式转换这些都是可替换的，按自己方式来就行
