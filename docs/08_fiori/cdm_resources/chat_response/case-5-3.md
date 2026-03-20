我来帮你修改这个Echart主题加载的逻辑，用实际参数值替换主题文件中的CSS变量。以下是修改后的代码：

```javascript
sap.ui.define([
 "sap/ui/core/Control",
 "cdm/libs/echarts/echarts-min",
 "cdm/ui/control/EchartContainerRenderer",
], function (
 Control,
 __echarts,
 EchartContainerRenderer
) {
 "use strict";

 // Echart主题编辑器
 // https://echarts.apache.org/zh/theme-builder.html

 const echartTheme = 'theme-cdm';
 var oThemeModel = new sap.ui.model.json.JSONModel("./ui/control/echart-cdm-theme.json");
 
 /**
  * 替换主题中的CSS变量为实际值
  * @param {Object} themeData - 原始主题数据
  * @returns {Object} 处理后的主题数据
  */
 function processThemeVariables(themeData) {
  // 获取根元素的CSS变量值
  const rootStyles = getComputedStyle(document.documentElement);
  
  // 递归处理对象中的所有字符串值
  function replaceVariables(obj) {
   if (typeof obj === 'string') {
    // 匹配 var(--variable-name, defaultValue) 格式
    return obj.replace(/var\(\s*--([^,\s)]+)(?:\s*,\s*([^)]+))?\s*\)/g, (match, varName, defaultValue) => {
     // 获取CSS变量值
     const value = rootStyles.getPropertyValue(`--${varName}`).trim();
     return value || defaultValue || match;
    });
   } else if (Array.isArray(obj)) {
    return obj.map(item => replaceVariables(item));
   } else if (obj && typeof obj === 'object') {
    const result = {};
    for (const key in obj) {
     if (obj.hasOwnProperty(key)) {
      result[key] = replaceVariables(obj[key]);
     }
    }
    return result;
   }
   return obj;
  }

  return replaceVariables(themeData);
 }

 oThemeModel.attachRequestCompleted(() => {
  const rawThemeData = oThemeModel.getData();
  const processedThemeData = processThemeVariables(rawThemeData);
  echarts.registerTheme(echartTheme, processedThemeData);
 });

 // 监听CSS变量变化，动态更新主题（可选）
 const observer = new MutationObserver(() => {
  if (echarts.getTheme && echarts.getTheme(echartTheme)) {
   const rawThemeData = oThemeModel.getData();
   const processedThemeData = processThemeVariables(rawThemeData);
   echarts.registerTheme(echartTheme, processedThemeData);
  }
 });

 // 观察根元素的属性变化（包括style）
 observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['style']
 });

 return Control.extend("cdm.ui.control.EchartContainer", {
  metadata: {
   properties: {
    option: { type: "string", defaultValue: "" },
   },
   renderer: EchartContainerRenderer
  },

  /**
   * @override
   * @returns {void|undefined}
   */
  init: function () {
   this._echart = null;
   // 绑定窗口大小调整事件
   window.addEventListener("resize", () => { this._handleWindowResize(); });
  },

  /**
   * @override
   * @param {jQuery.Event} oEvent <p>onAfterRendering event object</p>
   * @returns {void|undefined}
   */
  onAfterRendering: function (oEvent) {
   if (!this._echart) {
    this._echart = echarts.init(document.getElementById(this.getId() + "-echart"), echartTheme);
   }
  },

  /**
   * 设置ECharts配置选项
   * @param {Object} option - ECharts配置对象
   */
  setOption: function (option) {
   if (this._echart && option) {
    this._echart.setOption(option);
   }
  },

  /**
   * 处理窗口大小调整事件
   * @private
   */
  _handleWindowResize: function () {
   if (this._echart) {
    this._echart.resize();
   }
  },

  getEchart() {
   return this._echart;
  },

  /**
   * 销毁控件时的清理工作
   * @override
   */
  exit: function() {
   // 移除事件监听
   window.removeEventListener("resize", this._handleWindowResize);
   
   // 销毁echarts实例
   if (this._echart) {
    this._echart.dispose();
    this._echart = null;
   }
  }
 });
});
```

主要修改：

1. **添加 `processThemeVariables` 函数**：递归处理主题对象，将所有 `var(--variable-name)` 格式的CSS变量替换为实际的计算值。

2. **使用 `getComputedStyle`**：获取根元素的实际CSS变量值。

3. **支持默认值**：处理 `var(--name, defaultValue)` 格式，当变量未定义时使用默认值。

4. **可选功能 - 监听CSS变量变化**：通过 `MutationObserver` 监听根元素的style属性变化，当CSS变量改变时自动更新主题（如果echarts支持动态更新主题）。

5. **添加 `exit` 方法**：正确清理事件监听和echarts实例，防止内存泄漏。

使用这个修改后，你的主题文件可以这样写：

```json
{
  "color": ["var(--chart-color-1, #5470c6)", "var(--chart-color-2, #fac858)", "var(--chart-color-3, #ee6666)"],
  "backgroundColor": "var(--chart-bg-color, #ffffff)",
  "textStyle": {
    "color": "var(--chart-text-color, #333333)"
  },
  "title": {
    "textStyle": {
      "color": "var(--chart-title-color, #333333)"
    }
  }
}
```

这些CSS变量会在运行时被替换为实际值，确保主题能够正确生效。
