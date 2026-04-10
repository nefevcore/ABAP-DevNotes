// cdm/webapp/ui/control/MonitorViewSwitcher.js
sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/Button",
    "sap/ui/core/Icon"
], function (
    Control,
    Button,
    Icon
) {
    "use strict";

    return Control.extend("cdm.ui.control.MonitorViewSwitcher", {
        metadata: {
            properties: {
                // 切换间隔时间（毫秒）
                switchInterval: { type: "int", defaultValue: 5000 },
                // 是否自动切换
                autoSwitch: { type: "boolean", defaultValue: true },
                // 按钮显示模式：always（始终显示）、hover（悬停显示）、corner（角落显示）
                buttonMode: { type: "string", defaultValue: "hover" },
                // 当前显示的视图索引
                currentViewIndex: { type: "int", defaultValue: 0 }
            },
            aggregations: {
                // 要切换的视图集合
                views: { type: "sap.ui.core.mvc.View", multiple: true, singularName: "view" },
                // 导航按钮容器
                _navButtons: { type: "sap.ui.core.Control", multiple: true, singularName: "_navButton", visibility: "hidden" }
            },
            events: {
                // 视图切换事件
                viewSwitch: {
                    parameters: {
                        previousIndex: { type: "int" },
                        currentIndex: { type: "int" },
                        view: { type: "sap.ui.core.mvc.View" }
                    }
                }
            }
        },

        init: function () {
            this._switchTimer = null;
            this._isHovering = false;
        },

        onAfterRendering: function () {
            this._initializeViews();
            this._createNavigationButtons();

            if (this.getAutoSwitch()) {
                this._startAutoSwitch();
            }
        },

        exit: function () {
            this._stopAutoSwitch();
        },

        _initializeViews: function () {
            const views = this.getViews();
            views.forEach((view, index) => {
                view.addStyleClass("CdmView");
                if (index === this.getCurrentViewIndex()) {
                    view.addStyleClass("CdmViewShow");
                    view.removeStyleClass("CdmViewHide");
                } else {
                    view.addStyleClass("CdmViewHide");
                    view.removeStyleClass("CdmViewShow");
                }
            });
        },

        _createNavigationButtons: function () {
            const views = this.getViews();
            if (views.length <= 1) return;

            // 创建上一页按钮
            const prevButton = new Button({
                icon: "sap-icon://navigation-left-arrow",
                type: "Transparent",
                press: this._switchToPrevious.bind(this)
            }).addStyleClass("cdm-view-switcher-nav-btn cdm-view-switcher-prev-btn");

            // 创建下一页按钮
            const nextButton = new Button({
                icon: "sap-icon://navigation-right-arrow",
                type: "Transparent",
                press: this._switchToNext.bind(this)
            }).addStyleClass("cdm-view-switcher-nav-btn cdm-view-switcher-next-btn");

            // 创建指示器按钮
            const indicatorContainer = this._createIndicatorButtons();

            this.addAggregation("_navButtons", prevButton);
            this.addAggregation("_navButtons", nextButton);
            if (indicatorContainer) {
                this.addAggregation("_navButtons", indicatorContainer);
            }
        },

        _createIndicatorButtons: function () {
            const views = this.getViews();
            if (views.length <= 1) return null;

            const container = new sap.ui.core.HTML({
                content: '<div class="cdm-view-switcher-indicators"></div>'
            });

            // 延迟创建指示器点，确保DOM已渲染
            setTimeout(() => {
                const indicatorDiv = this.getDomRef().querySelector('.cdm-view-switcher-indicators');
                if (indicatorDiv) {
                    views.forEach((view, index) => {
                        const indicator = document.createElement('div');
                        indicator.className = 'cdm-view-switcher-indicator';
                        if (index === this.getCurrentViewIndex()) {
                            indicator.classList.add('active');
                        }
                        indicator.addEventListener('click', () => this.switchToView(index));
                        indicatorDiv.appendChild(indicator);
                    });
                }
            }, 0);

            return container;
        },

        _startAutoSwitch: function () {
            this._stopAutoSwitch();
            this._switchTimer = setInterval(() => {
                if (!this._isHovering) {
                    this._switchToNext();
                }
            }, this.getSwitchInterval());
        },

        _stopAutoSwitch: function () {
            if (this._switchTimer) {
                clearInterval(this._switchTimer);
                this._switchTimer = null;
            }
        },

        _switchToPrevious: function () {
            const currentIndex = this.getCurrentViewIndex();
            const totalViews = this.getViews().length;
            const newIndex = (currentIndex - 1 + totalViews) % totalViews;
            this.switchToView(newIndex);
        },

        _switchToNext: function () {
            const currentIndex = this.getCurrentViewIndex();
            const totalViews = this.getViews().length;
            const newIndex = (currentIndex + 1) % totalViews;
            this.switchToView(newIndex);
        },

        switchToView: function (index) {
            const views = this.getViews();
            if (index < 0 || index >= views.length) return;

            const previousIndex = this.getCurrentViewIndex();
            const previousView = views[previousIndex];
            const currentView = views[index];

            // 切换样式类
            if (previousView) {
                previousView.removeStyleClass("CdmViewShow");
                previousView.addStyleClass("CdmViewHide");
            }

            currentView.removeStyleClass("CdmViewHide");
            currentView.addStyleClass("CdmViewShow");

            // 更新指示器
            this._updateIndicators(previousIndex, index);

            // 更新属性
            this.setProperty("currentViewIndex", index, true);

            // 触发事件
            this.fireViewSwitch({
                previousIndex: previousIndex,
                currentIndex: index,
                view: currentView
            });
        },

        _updateIndicators: function (previousIndex, currentIndex) {
            const indicators = this.getDomRef()?.querySelectorAll('.cdm-view-switcher-indicator');
            if (indicators) {
                if (previousIndex >= 0 && indicators[previousIndex]) {
                    indicators[previousIndex].classList.remove('active');
                }
                if (indicators[currentIndex]) {
                    indicators[currentIndex].classList.add('active');
                }
            }
        },

        setAutoSwitch: function (bAutoSwitch) {
            this.setProperty("autoSwitch", bAutoSwitch, true);
            if (bAutoSwitch) {
                this._startAutoSwitch();
            } else {
                this._stopAutoSwitch();
            }
        },

        setSwitchInterval: function (iInterval) {
            this.setProperty("switchInterval", iInterval, true);
            if (this.getAutoSwitch()) {
                this._stopAutoSwitch();
                this._startAutoSwitch();
            }
        }
    });
});