# SAPUI5开发小知识

一些零散的技巧，暂时先放到这篇文章内

## **去除DynamicPage的Content两边空白**

- `class="sapUiNoContentPadding"`，Page控件内加入这个样式
- `appWidthLimited: false`，index里，new shell里面加上这段

## **取GridTable选择行**

<details open>
    <summary>示例代码</summary>

```JavaScript

var aIndices = this.byId("GridTable").getSelectedIndices();

```

</details>

## **取GridTable选择行的数据**

<details open>
    <summary>示例代码</summary>

```JavaScript

var item = this.byId("GridTable").getContextByIndex(i).getObject();

```

</details>

## **CDS搜索帮助用下拉框形式**

<details open>
    <summary>示例代码</summary>

```sql

@ObjectModel.resultSet.sizeCategory: #XS

```

</details>

## **设置返回格式为JSON**

我记得默认是返回JSON的，如果没有返回JSON，可以用下面设置：

<details open>
    <summary>示例代码</summary>

```JavaScript

this._oDataModel.setHeaders({
    "Accept": "application/json",
    "Content-Type": "application/json",
});

```

</details>

## **更灵活的标准模板页面增强**

有时候需要在标准模板生成的页面中加减一些控件，可以通过筛选控件反查页面控件，然后自由加入需要的控件。

> 现在想来，可以通过ID的方式直接获取页面控件，以后有机会再测试

<details open>
    <summary>示例代码</summary>

```JavaScript

onInitSmartFilterBarExtension: function (oEvent) {
    var ofilter = oEvent.getSource();
    var oPage = ofilter.getParent().getParent();
    var oTitle = oPage.getTitle();
    oTitle.insertExpandedContent(new sap.m.Label({ text: "" }));
},

```

</details>

## **SmartTable用代码设置列可编辑**

<details open>
    <summary>示例代码</summary>

```JavaScript

oSmartTable.attachInitialise(function (oEvent) {
    var aColumns = oSmartTable.getTable().getColumns();
    for (var i = 0; i < aColumns.length; i++) {
        if (aColumns[i].data("p13nData").columnKey === "Field") {
            aColumns[i].setTemplate(new sap.m.Input({
                value: "{Field}"
            }));
        }
    }
});

```

</details>

## **金额格式化**

<details open>
  <summary>标准实现</summary>

```xml

<t:Column width="10em"
    sortProperty="Amount"
    filterProperty="Amount">
    <m:Label text="{i18n>Amount}"></m:Label>
    <t:template>
        <m:Text text="{ parts:[{ path: 'Amount' }, { path: 'Currency' }], type: 'sap.ui.model.type.Currency', formatOptions: { showMeasure: false } }"
            textAlign="Right"
            width="100%"></m:Text>
    </t:template>
    <t:customData>
        <core:CustomData key="p13nData"
            value='\{ "columnKey": "Amount", "leadingProperty": "Amount", "type": "numeric", "scale": "2", "columnIndex": "11" }' />
    </t:customData>
</t:Column>

```

</details>

<details open>
    <summary>自定义格式化</summary>

```JavaScript

/**
 * Amount Formatter
 * @returns sap.ui.core.format.NumberFormat
 */
_getAmountFormat: function () {
    this._oAmountFormat = this._oAmountFormat || sap.ui.core.format.NumberFormat.getFloatInstance({
        "groupingEnabled": true,
        "groupingSeparator": ',',
        "groupingSize": 3,
        "decimalSeparator": ".",
        "minFractionDigits": 2,
        "maxFractionDigits": 2
    });
    return this._oAmountFormat;
},

/**
 * @param {any} val 
 */
_parseAmount: function (val) {
    return this._getAmountFormat().parse(String(val) || "0.00") || "0.00";
},

/**
 * 
 * @param {any} val 
 */
_formatAmount: function (val) {
    return this._getAmountFormat().format(this._parseAmount(val))
},

```

</details>

## **uiTable加底纹**

绑定RowsUpdated事件：

<details open>
    <summary>示例代码</summary>

```JavaScript

oTable.attachRowsUpdated((oEvent) => {
    var aRows = oEvent.getSource().getRows();
    aRows.forEach((oRow) => {
        var oItem = oRow.getBindingContext().getObject()
        var sClass = "custom-group"
        if (!oItem.Group)
            oRow.addStyleClass(sClass);
        else
            oRow.removeStyleClass(sClass);
    })
})

```

</details>

样式表中自定义样式：

<details open>
    <summary>示例代码</summary>

```css

/* Enter your custom styles here */
.custom-group {
    background-color: #dddddd !important;
    border: 1px solid;
}

.custom-group .sapUiTableCell .sapUiTableCellInner .sapMText {
    font-weight: bold;
}

```

</details>

## **获取Session信息**

<details>
  <summary>示例代码</summary>

```JavaScript

var oModel = new sap.ui.model.json.JSONModel();
oModel.loadData("/sap/bc/ui2/start_up");
oModel.attachRequestCompleted(function (oEvent) {
    var st = oModel.getProperty("/");
});

```

</details>
