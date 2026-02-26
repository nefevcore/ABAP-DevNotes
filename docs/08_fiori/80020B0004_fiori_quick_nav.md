# Fiori自开发平台快捷导航

基于CSS设计的页面

> 自开发程度太高，基本上没有复用场景，只是难得弄出来，如果不记录下来感觉可惜。

## 配置表设计

页面采用扁平设计，因此配置设计也比较简单，采用【分组-项目】两级嵌套。

基于此，设计如下表：

| 字段名 | 描述 |
|--------------------|---------------------------------|
| UUID               | 主键 |
| AREA               | 考虑多个页面复用这套快捷导航 |
| QKEY               | 快捷导航节点 |
| UPKEY              | 快捷导航节点，该节点为空表示组节点，非空表示挂靠在分组下 |
| ACTIVE             | 是否启用 |
| TEXT               | 节点描述 |
| TCODE              | 事务代码 |
| LINK               | 网页链接 |
| ICON               | 图标 |
| WEBGUI             | 复选框 |
| NOCHECKAUTH        | 不检查权限 |
| LAST_CHANGED_BY    | RAP设计用 |
| LAST_CHANGED       | RAP设计用 |

仅供参考，只要取值的时候能保持【分组-项目】两级设计即可。

## 快捷导航模块

代码主要内容是读取配置表信息，并根据配置表动态创建容器，容器的显示效果根据样式表控制。

<details>
  <summary>QuickAccess.js</summary>

```JavaScript

jQuery.sap.registerModulePath("company.zcommon", "/sap/bc/ui5_ui5/sap/zcommon");
sap.ui.define([
    "sap/ui/model/odata/v2/ODataModel",
    "sap/ui/model/json/JSONModel",
    "company/zcommon/util/Service",
    "company/zcommon/util/Message"
], function (
    ODataModel,
    JSONModel,
    Service,
    Message
) {
    "use strict";

    return {
        initQuickAccess: function (oParamater) {
            this._oController = oParamater.controller;
            this._oDataModel = new ODataModel("/sap/opu/odata/sap/ZUI_COMMON");

            this._readQuickAccessConfig(oParamater.Area)
                .then((oData) => this._aQuickAccessToMap(oData.results))
                .then((oQuickMap) => this._sortQuickMap(oQuickMap))
                .then((oQuickMap) => this._generateQuickAccess(oQuickMap, oParamater.uiControl));
        },

        _readQuickAccessConfig: function (Area) {
            return Service.read(this._oDataModel, "/QuickAccess", {
                filters: [
                    new sap.ui.model.Filter("Area", "EQ", Area),
                    new sap.ui.model.Filter("Active", "EQ", true)
                ],
                sorters: [
                    new sap.ui.model.Sorter("Area"),
                    new sap.ui.model.Sorter("Qkey"),
                    new sap.ui.model.Sorter("Upkey"),
                ]
            });
        },

        _aQuickAccessToMap: function (aQuickAccesss) {
            var oQuickMap = new Map();
            // 先获取全部组节点
            aQuickAccesss.forEach((oItem) => {
                if (!oItem.Upkey)
                    oQuickMap.set(oItem.Qkey, Object.assign({ items: [] }, oItem));
            });
            // 再将子节点划入组节点
            aQuickAccesss.forEach((oItem) => {
                if (oItem.Upkey) {
                    var oGroup = oQuickMap.get(oItem.Upkey);
                    if (oGroup)
                        oGroup.items.push(Object.assign({}, oItem));
                }
            });
            return oQuickMap;
        },

        _sortQuickMap: function (oQuickMap) {
            // 1. 转换为数组
            const groupsArray = Array.from(oQuickMap.values());

            // 2. 过滤掉空 items 的组（可选）
            const nonEmptyGroups = groupsArray.filter(oGroup => oGroup.items.length > 0);

            // 3. 排序：先按 items.length 升序，再按 Qkey 升序
            nonEmptyGroups.sort((a, b) => {
                // 按 items 数量降序
                if (a.items.length != b.items.length) {
                    return a.items.length - b.items.length;
                }
                // 数量相同则按 Qkey 升序
                return a.Qkey.localeCompare(b.Qkey);
            });

            // 4. 清空原 Directory 并重新插入排序后的数据（如果需要保持 oQuickMap 结构）
            var oNewQuickMap = new Map();
            nonEmptyGroups.forEach(oGroup => {
                oNewQuickMap.set(oGroup.Qkey, oGroup);
            });
            return oNewQuickMap;
        },

        _generateQuickAccess: function (oQuickMap, oUiControl) {
            oQuickMap.forEach((oGroup) => {
                if (oGroup.items.length === 0)
                    return;
                // 新增分组容器
                var oListContenter = new sap.m.FlexBox();
                oListContenter.addStyleClass("custom-list");
                oUiControl.addItem(oListContenter); // 写入要展示的容器中
                // 新增分组标题
                var oTitle = new sap.m.Text({ text: oGroup.Text });
                oTitle.addStyleClass("custom-list-title");
                oListContenter.addItem(oTitle);
                // 新增子项目容器
                var oListContentContainer = new sap.m.FlexBox();
                oListContentContainer.addStyleClass("custom-list-content");
                oListContenter.addItem(oListContentContainer);
                // 逐项目处理
                oGroup.items.forEach((oItem) => {
                    // 新增链接控件，并写入子项目容器中
                    var oLink = new sap.m.Link({
                        text: oItem.Text,
                        tooltip: oItem.Text,
                        press: () => this.pressQuickAccess(oItem)
                    });
                    // 有图标会好看一些
                    if (oItem.Icon) {
                        if (oItem.Icon.indexOf("sap-icon")) {
                            // 标准图标
                            oLink.setIcon(oItem.Icon);
                        } else {
                            // 自定义图标
                            oLink.addStyleClass("custom-link custom-icon");
                            oLink.addStyleClass(`custom-icon-${oItem.Icon}`);
                        }
                    }
                    oListContentContainer.addItem(oLink);
                });
            });
        },

        pressQuickAccess: function (oItem) {
            // Tcode跳转
            if (oItem.Tcode) {
                this._startGui(`*${oItem.Tcode}`, oItem.Webgui);
                return;
            }

            // 页面跳转
            if (oItem.Link) {
                if (oItem.Link[0] === "#") {
                    // Fiori跳转
                    window.open(this._getFioriAddress(...oItem.Link.split("?")));
                } else {
                    // 直接跳转
                    window.open(oItem.Link);
                }
                return;
            }

            Message.toast("快捷方式功能未维护，请联系运维人员");
        },

        _startGui: function (transaction, webgui) {
            if (webgui) {
                window.open(this._getWebguiAddress(transaction));
            } else {
                // 从后端下载GUI启动脚本
                var oRequestData = {
                    Action: "GET_GUI_SHORTCUT",
                    to_Header: {
                        Transation: transaction
                    }
                };
                Service.request(this._oDataModel, "/Backend", oRequestData).then((oData) => {
                    var data = oData.to_Header.Content;
                    var type = oData.to_Header.Mimetype;
                    Service.downloadFile(data, type, "tx.sap");
                });
            }
        },

        _getHost: function () {
            var host = window.location.origin;
            if (window.location.host.includes("localhost"))
                host = "https://companyerp.company.com.cn:44300";
            return host;
        },

        _getWebguiAddress: function (transaction) {
            var host = this._getHost();
            var path = "/sap/bc/gui/sap/its/webgui";
            var oSearchParams = new URLSearchParams(window.location.search);
            // 当前页面上的SAP信息（包括Client等）
            var search = "?";
            if (oSearchParams.toString() !== "")
                search = `?${oSearchParams.toString()}&`;
            var uri = `${host}${path}${search}~transaction=${transaction}`;
            return uri;
        },

        _getFioriAddress: function (semobj, paramaters) {
            var host = this._getHost();
            var path = "/sap/bc/ui2/flp";
            var uri = `${host}${path}`;
            var oSearchParams = new URLSearchParams(window.location.search);
            oSearchParams.set("sap-language", "ZH"); // 固定中文
            oSearchParams.set("sap-ushell-config", "headerless"); // 无Fiori栏
            var uri = `${host}${path}?${oSearchParams.toString()}${semobj}`;
            if (paramaters)
                uri = uri.concat("&", paramaters);
            return uri;
        }
    };
});

```

</details>

样式使用纯CSS方案，让16种底色循环，给页面增添设计感。

<details>
  <summary>样式代码</summary>

```css
.custom-quick-access-content {
    display: flex;
    flex-wrap: wrap;
    column-gap: 1rem;
    row-gap: 1rem;
    margin-left: 1rem;
    margin-bottom: 1rem;
}

.custom-quick-access-content .custom-list {
    width: 16rem;
    display: block;
    background-color: var(--list-color, #ffffff); /* 默认白色 */
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); /* 更自然的缓动函数 */
    box-shadow: 0 1px 3px rgba(0,0,0,0.12), 
                0 1px 2px rgba(0,0,0,0.24); /* 双层阴影更有层次 */
    border: 1px solid;
    border-color: color-mix(in srgb, var(--list-color, #ffffff) 80%, #888);
}

.custom-quick-access-content .custom-list:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 28px rgba(0,0,0,0.12), 
                0 10px 10px rgba(0,0,0,0.10);
    border-color: color-mix(in srgb, var(--list-color) 60%, #555);
}

/* 预设16种颜色 - 使用16n+1到16n+16的循环 */
.custom-quick-access-content .custom-list:nth-child(16n+1) { --list-color: #FFEBEE; } /* 极淡粉红 */
.custom-quick-access-content .custom-list:nth-child(16n+2) { --list-color: #FCE4EC; } /* 淡粉 */
.custom-quick-access-content .custom-list:nth-child(16n+3) { --list-color: #F3E5F5; } /* 极淡紫 */
.custom-quick-access-content .custom-list:nth-child(16n+4) { --list-color: #EDE7F6; } /* 淡薰衣草 */
.custom-quick-access-content .custom-list:nth-child(16n+5) { --list-color: #E8EAF6; } /* 淡蓝灰 */
.custom-quick-access-content .custom-list:nth-child(16n+6) { --list-color: #E3F2FD; } /* 淡天蓝 */
.custom-quick-access-content .custom-list:nth-child(16n+7) { --list-color: #E1F5FE; } /* 极淡蓝 */
.custom-quick-access-content .custom-list:nth-child(16n+8) { --list-color: #E0F7FA; } /* 淡青蓝 */
.custom-quick-access-content .custom-list:nth-child(16n+9) { --list-color: #E0F2F1; } /* 淡蓝绿 */
.custom-quick-access-content .custom-list:nth-child(16n+10) { --list-color: #E8F5E9; } /* 极淡绿 */
.custom-quick-access-content .custom-list:nth-child(16n+11) { --list-color: #F1F8E9; } /* 淡黄绿 */
.custom-quick-access-content .custom-list:nth-child(16n+12) { --list-color: #F9FBE7; } /* 淡米黄 */
.custom-quick-access-content .custom-list:nth-child(16n+13) { --list-color: #FFF8E1; } /* 淡奶油 */
.custom-quick-access-content .custom-list:nth-child(16n+14) { --list-color: #FFF3E0; } /* 淡杏色 */
.custom-quick-access-content .custom-list:nth-child(16n+15) { --list-color: #FBE9E7; } /* 淡珊瑚 */
.custom-quick-access-content .custom-list:nth-child(16n+16) { --list-color: #EFEBE9; } /* 淡米白 */

.custom-quick-access-content .custom-list .custom-list-title {
    font-size: large;
    font-weight: bold;
}

.custom-quick-access-content .custom-list .custom-list-content {
    display: flex;
    flex-direction: column;
    margin-top: 0.25rem; /* 增加与标题的间距 */
    line-height: 0; /* 紧凑行项目 */
}

```

</details>

## UI5页面

首先在Component.js开始位置引入库和样式

<details open>
  <summary>Component.js</summary>

```JavaScript

jQuery.sap.registerModulePath("company.zcommon", "/sap/bc/ui5_ui5/sap/zcommon");
jQuery.sap.includeStyleSheet("/sap/bc/ui5_ui5/sap/zcommon/css/style.css");

```

</details>

然后创建一个用于容纳快捷导航的容器

<details open>
  <summary>View</summary>

```xml hl_lines="9"

<mvc:View controllerName="zdev001.controller.Home"
    xmlns="http://www.w3.org/1999/xhtml"
    xmlns:core="sap.ui.core"
    xmlns:mvc="sap.ui.core.mvc"
    xmlns:m="sap.m">
    <m:FlexBox class="custom-page">
        <m:FlexBox class="custom-content">
            <m:FlexBox class="custom-content-item custom-quick-access">
                <m:FlexBox id="idQuickAccessContainer">
                </m:FlexBox>
            </m:FlexBox>
        </m:FlexBox>
    </m:FlexBox>
</mvc:View>

```

</details>

在页面初始化中创建快捷导航

<details open>
  <summary>Controller</summary>

```JavaScript

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "company/zcommon/util/QuickAccess"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller,
        QuickAccess) {
        "use strict";

        return Controller.extend("zdev001.controller.Home", {
            onInit: function () {
                QuickAccess.initQuickAccess({
                    controller: this,
                    container: this.byId("idQuickAccessContainer"),
                    Area: "ZA01"
                });
            },
        });
    });

```

</details>
