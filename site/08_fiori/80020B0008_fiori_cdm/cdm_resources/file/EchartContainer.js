
sap.ui.define([
	"sap/ui/core/Control",
	"cdm/libs/echarts/echarts-min",
	"cdm/ui/control/EchartContainerRenderer",
], function (
	Control,
	__echarts, // echarts是全局的，这里随便给个名称别污染全局就行
	EchartContainerRenderer
) {
	"use strict";

	// Echart主题编辑器
	// https://echarts.apache.org/zh/theme-builder.html

	const echartTheme = 'theme-cdm';
	var oThemeModel = new sap.ui.model.json.JSONModel("./ui/control/echart-cdm-theme.json");
	oThemeModel.attachRequestCompleted(() => {
		echarts.registerTheme(echartTheme, oThemeModel.getData());
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
		}
	});
});