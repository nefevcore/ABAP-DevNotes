我将基于 `MonitorBackground` 控件创建一个粒子飘浮背景组件。这个组件将继承原有的背景功能，并添加动态粒子效果。

## 粒子飘浮背景组件

### 1. 主控件文件 - ParticleBackground.js

```javascript
sap.ui.define([
    "cdm/ui/control/MonitorBackground",
    "sap/ui/core/Core",
    "./ParticleBackgroundRenderer"
], function (
    MonitorBackground,
    Core,
    ParticleBackgroundRenderer
) {
    "use strict";

    return MonitorBackground.extend("cdm.ui.control.ParticleBackground", {
        metadata: {
            properties: {
                // 粒子数量
                particleCount: { type: "int", defaultValue: 50 },
                // 粒子颜色
                particleColor: { type: "string", defaultValue: "rgba(255, 255, 255, 0.5)" },
                // 粒子最小大小
                minSize: { type: "int", defaultValue: 2 },
                // 粒子最大大小
                maxSize: { type: "int", defaultValue: 6 },
                // 粒子移动速度
                speed: { type: "float", defaultValue: 0.5 },
                // 是否启用鼠标交互
                interactive: { type: "boolean", defaultValue: false },
                // 鼠标影响半径
                mouseRadius: { type: "int", defaultValue: 100 },
                // 连接线颜色
                lineColor: { type: "string", defaultValue: "rgba(255, 255, 255, 0.1)" },
                // 连接线最大距离
                lineDistance: { type: "int", defaultValue: 150 },
                // 是否显示连接线
                showLines: { type: "boolean", defaultValue: true }
            },
            aggregations: {},
            events: {
                // 粒子初始化完成事件
                initialized: {},
                // 动画帧事件
                animationFrame: {
                    parameters: {
                        timestamp: { type: "float" },
                        particles: { type: "array" }
                    }
                }
            },
            renderer: ParticleBackgroundRenderer
        },

        init: function() {
            MonitorBackground.prototype.init.call(this);
            
            // 初始化粒子数组
            this._aParticles = [];
            this._bAnimating = false;
            this._iAnimationFrame = null;
            
            // 鼠标位置
            this._oMousePosition = { x: 0, y: 0 };
            this._bMouseInside = false;
            
            // 绑定动画帧
            this._fnAnimationHandler = this._animate.bind(this);
            
            // 初始化Canvas上下文
            this._oCanvas = null;
            this._oContext = null;
            
            // 容器尺寸
            this._iWidth = 0;
            this._iHeight = 0;
            
            // 添加resize监听
            this._fnResizeHandler = this._handleResize.bind(this);
        },

        onAfterRendering: function() {
            MonitorBackground.prototype.onAfterRendering.call(this);
            
            // 获取canvas元素
            var oCanvas = this.getDomRef()?.querySelector(".cdm-particle-canvas");
            if (oCanvas) {
                this._oCanvas = oCanvas;
                this._oContext = oCanvas.getContext("2d");
                
                // 设置尺寸
                this._updateCanvasSize();
                
                // 初始化粒子
                this._initParticles();
                
                // 开始动画
                this.startAnimation();
                
                // 绑定鼠标事件
                if (this.getInteractive()) {
                    this._bindMouseEvents();
                }
            }
        },

        onBeforeRendering: function() {
            MonitorBackground.prototype.onBeforeRendering.call(this);
            
            // 停止动画
            this.stopAnimation();
        },

        exit: function() {
            MonitorBackground.prototype.exit.call(this);
            
            // 停止动画
            this.stopAnimation();
            
            // 移除事件监听
            this._unbindMouseEvents();
            Core.byId(sap.ui.core.ResizeHandler)?.deregister(this._fnResizeHandler);
        },

        /**
         * 更新Canvas尺寸
         * @private
         */
        _updateCanvasSize: function() {
            if (this._oCanvas && this._oCanvas.parentElement) {
                var oRect = this._oCanvas.parentElement.getBoundingClientRect();
                this._iWidth = oRect.width;
                this._iHeight = oRect.height;
                
                this._oCanvas.width = this._iWidth;
                this._oCanvas.height = this._iHeight;
            }
        },

        /**
         * 初始化粒子
         * @private
         */
        _initParticles: function() {
            this._aParticles = [];
            var iCount = this.getParticleCount();
            
            for (var i = 0; i < iCount; i++) {
                this._aParticles.push(this._createParticle());
            }
            
            // 触发初始化完成事件
            this.fireInitialized({
                particles: this._aParticles
            });
        },

        /**
         * 创建单个粒子
         * @private
         * @returns {object} 粒子对象
         */
        _createParticle: function() {
            var iMinSize = this.getMinSize();
            var iMaxSize = this.getMaxSize();
            var fSpeed = this.getSpeed();
            
            return {
                x: Math.random() * this._iWidth,
                y: Math.random() * this._iHeight,
                vx: (Math.random() - 0.5) * fSpeed,
                vy: (Math.random() - 0.5) * fSpeed,
                size: iMinSize + Math.random() * (iMaxSize - iMinSize),
                opacity: 0.3 + Math.random() * 0.7
            };
        },

        /**
         * 更新粒子位置
         * @private
         */
        _updateParticles: function() {
            var iWidth = this._iWidth;
            var iHeight = this._iHeight;
            var fSpeed = this.getSpeed();
            var oMouse = this._oMousePosition;
            var iMouseRadius = this.getMouseRadius();
            var bInteractive = this.getInteractive() && this._bMouseInside;
            
            this._aParticles.forEach(function(oParticle) {
                // 更新位置
                oParticle.x += oParticle.vx;
                oParticle.y += oParticle.vy;
                
                // 边界检查
                if (oParticle.x < 0) oParticle.x = iWidth;
                if (oParticle.x > iWidth) oParticle.x = 0;
                if (oParticle.y < 0) oParticle.y = iHeight;
                if (oParticle.y > iHeight) oParticle.y = 0;
                
                // 鼠标交互
                if (bInteractive) {
                    var dx = oParticle.x - oMouse.x;
                    var dy = oParticle.y - oMouse.y;
                    var distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < iMouseRadius) {
                        var angle = Math.atan2(dy, dx);
                        var force = (iMouseRadius - distance) / iMouseRadius * 0.5;
                        
                        oParticle.x += Math.cos(angle) * force * 5;
                        oParticle.y += Math.sin(angle) * force * 5;
                    }
                }
                
                // 随机速度变化
                if (Math.random() < 0.01) {
                    oParticle.vx += (Math.random() - 0.5) * 0.1;
                    oParticle.vy += (Math.random() - 0.5) * 0.1;
                    
                    // 限制速度范围
                    var maxSpeed = fSpeed;
                    oParticle.vx = Math.max(-maxSpeed, Math.min(maxSpeed, oParticle.vx));
                    oParticle.vy = Math.max(-maxSpeed, Math.min(maxSpeed, oParticle.vy));
                }
            });
        },

        /**
         * 绘制粒子
         * @private
         */
        _drawParticles: function() {
            if (!this._oContext) return;
            
            var ctx = this._oContext;
            var sColor = this.getParticleColor();
            var bShowLines = this.getShowLines();
            var iLineDistance = this.getLineDistance();
            var sLineColor = this.getLineColor();
            
            // 清空画布
            ctx.clearRect(0, 0, this._iWidth, this._iHeight);
            
            // 绘制连接线
            if (bShowLines && this._aParticles.length > 1) {
                ctx.beginPath();
                ctx.strokeStyle = sLineColor;
                ctx.lineWidth = 0.5;
                
                for (var i = 0; i < this._aParticles.length; i++) {
                    for (var j = i + 1; j < this._aParticles.length; j++) {
                        var p1 = this._aParticles[i];
                        var p2 = this._aParticles[j];
                        
                        var dx = p1.x - p2.x;
                        var dy = p1.y - p2.y;
                        var distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if (distance < iLineDistance) {
                            var opacity = 1 - (distance / iLineDistance);
                            ctx.strokeStyle = sLineColor.replace(/[^,]+(?=\))/, opacity);
                            
                            ctx.beginPath();
                            ctx.moveTo(p1.x, p1.y);
                            ctx.lineTo(p2.x, p2.y);
                            ctx.stroke();
                        }
                    }
                }
            }
            
            // 绘制粒子
            this._aParticles.forEach(function(oParticle) {
                ctx.beginPath();
                ctx.arc(oParticle.x, oParticle.y, oParticle.size, 0, Math.PI * 2);
                
                // 使用粒子颜色和透明度
                var fillColor = sColor;
                if (sColor.includes('rgba')) {
                    fillColor = sColor.replace(/[^,]+(?=\))/, oParticle.opacity);
                }
                
                ctx.fillStyle = fillColor;
                ctx.fill();
            });
        },

        /**
         * 动画循环
         * @private
         * @param {number} timestamp 时间戳
         */
        _animate: function(timestamp) {
            if (!this._bAnimating) return;
            
            // 更新粒子位置
            this._updateParticles();
            
            // 绘制粒子
            this._drawParticles();
            
            // 触发动画帧事件
            this.fireAnimationFrame({
                timestamp: timestamp,
                particles: this._aParticles
            });
            
            // 继续下一帧
            this._iAnimationFrame = requestAnimationFrame(this._fnAnimationHandler);
        },

        /**
         * 处理窗口大小变化
         * @private
         */
        _handleResize: function() {
            this._updateCanvasSize();
            
            // 重新初始化粒子位置
            this._aParticles.forEach(function(oParticle) {
                oParticle.x = Math.random() * this._iWidth;
                oParticle.y = Math.random() * this._iHeight;
            }, this);
        },

        /**
         * 绑定鼠标事件
         * @private
         */
        _bindMouseEvents: function() {
            if (!this._oCanvas) return;
            
            this._fnMouseMoveHandler = this._handleMouseMove.bind(this);
            this._fnMouseLeaveHandler = this._handleMouseLeave.bind(this);
            
            this._oCanvas.addEventListener("mousemove", this._fnMouseMoveHandler);
            this._oCanvas.addEventListener("mouseleave", this._fnMouseLeaveHandler);
        },

        /**
         * 移除鼠标事件
         * @private
         */
        _unbindMouseEvents: function() {
            if (this._oCanvas) {
                this._oCanvas.removeEventListener("mousemove", this._fnMouseMoveHandler);
                this._oCanvas.removeEventListener("mouseleave", this._fnMouseLeaveHandler);
            }
        },

        /**
         * 处理鼠标移动
         * @private
         * @param {MouseEvent} oEvent 鼠标事件
         */
        _handleMouseMove: function(oEvent) {
            if (!this._oCanvas) return;
            
            var oRect = this._oCanvas.getBoundingClientRect();
            this._oMousePosition = {
                x: oEvent.clientX - oRect.left,
                y: oEvent.clientY - oRect.top
            };
            this._bMouseInside = true;
        },

        /**
         * 处理鼠标离开
         * @private
         */
        _handleMouseLeave: function() {
            this._bMouseInside = false;
        },

        /**
         * 开始动画
         * @public
         */
        startAnimation: function() {
            if (this._bAnimating) return;
            
            this._bAnimating = true;
            this._iAnimationFrame = requestAnimationFrame(this._fnAnimationHandler);
        },

        /**
         * 停止动画
         * @public
         */
        stopAnimation: function() {
            this._bAnimating = false;
            if (this._iAnimationFrame) {
                cancelAnimationFrame(this._iAnimationFrame);
                this._iAnimationFrame = null;
            }
        },

        /**
         * 重新初始化粒子
         * @public
         */
        reinitialize: function() {
            this._initParticles();
        },

        /**
         * 设置粒子颜色（重写）
         * @public
         * @param {string} sColor 颜色值
         * @returns {this} this
         */
        setParticleColor: function(sColor) {
            this.setProperty("particleColor", sColor);
            return this;
        },

        /**
         * 设置交互模式（重写）
         * @public
         * @param {boolean} bInteractive 是否交互
         * @returns {this} this
         */
        setInteractive: function(bInteractive) {
            this.setProperty("interactive", bInteractive);
            
            if (this._oCanvas) {
                if (bInteractive) {
                    this._bindMouseEvents();
                } else {
                    this._unbindMouseEvents();
                }
            }
            
            return this;
        }
    });
});
```

### 2. 渲染器文件 - ParticleBackgroundRenderer.js

```javascript
sap.ui.define([
    "cdm/ui/control/MonitorBackgroundRenderer"
], function (MonitorBackgroundRenderer) {
    "use strict";

    var ParticleBackgroundRenderer = Object.assign({}, MonitorBackgroundRenderer);

    ParticleBackgroundRenderer.render = function (rm, oControl) {
        // 先渲染父类的背景
        MonitorBackgroundRenderer.render(rm, oControl);
        
        // 获取父类渲染的div的ID
        var sParentId = oControl.getId();
        
        // 渲染粒子画布
        rm.openStart("canvas", sParentId + "-particleCanvas")
            .class("cdm-particle-canvas")
            .style("position", "absolute")
            .style("top", "0")
            .style("left", "0")
            .style("width", "100%")
            .style("height", "100%")
            .style("z-index", oControl.getZIndex() + 1)
            .style("pointer-events", oControl.getInteractive() ? "auto" : "none");
        
        rm.openEnd();
        rm.close("canvas");
    };

    return ParticleBackgroundRenderer;
});
```

### 3. 使用示例

```xml
<mvc:View 
    xmlns="sap.m"
    xmlns:core="sap.ui.core"
    xmlns:custom="cdm.ui.control"
    controllerName="your.controller">
    
    <App>
        <pages>
            <Page title="粒子背景示例">
                <custom:ParticleBackground
                    src="path/to/your/background.jpg"
                    particleCount="80"
                    particleColor="rgba(100, 200, 255, 0.6)"
                    minSize="2"
                    maxSize="5"
                    speed="0.3"
                    interactive="true"
                    mouseRadius="120"
                    showLines="true"
                    lineColor="rgba(100, 200, 255, 0.2)"
                    lineDistance="150"
                    backgroundColor="#001122" />
                
                <!-- 其他页面内容 -->
                <VBox class="sapUiMediumMargin">
                    <Text text="粒子背景示例" class="sapUiLargeText"/>
                    <Button text="重新初始化粒子" press="onReinitializeParticles"/>
                    <Button text="切换动画" press="onToggleAnimation"/>
                </VBox>
            </Page>
        </pages>
    </App>
</mvc:View>
```

### 4. 控制器示例

```javascript
sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("your.controller.Main", {
        onReinitializeParticles: function() {
            var oParticleBackground = this.getView().byId("yourParticleBackgroundId");
            if (oParticleBackground) {
                oParticleBackground.reinitialize();
            }
        },

        onToggleAnimation: function() {
            var oParticleBackground = this.getView().byId("yourParticleBackgroundId");
            if (oParticleBackground) {
                // 这里可以根据需要调用 startAnimation 或 stopAnimation
                // 或者添加一个状态来控制
            }
        },

        // 监听动画帧事件
        onParticleBackgroundInit: function() {
            var oParticleBackground = this.getView().byId("yourParticleBackgroundId");
            oParticleBackground.attachAnimationFrame(function(oEvent) {
                var iTimestamp = oEvent.getParameter("timestamp");
                var aParticles = oEvent.getParameter("particles");
                // 可以在动画帧中执行自定义逻辑
            });
        }
    });
});
```

### 5. 样式文件 (可选) - ParticleBackground.css

```css
.cdm-particle-canvas {
    transition: opacity 0.3s ease;
}

.cdm-particle-canvas:hover {
    opacity: 0.9;
}

/* 响应式调整 */
@media (max-width: 768px) {
    .cdm-particle-canvas {
        opacity: 0.7;
    }
}
```

这个粒子飘浮背景组件具有以下特性：

1. **继承自MonitorBackground**：保留原有的背景图片功能
2. **动态粒子效果**：粒子会缓慢飘浮移动
3. **可配置性强**：粒子数量、颜色、大小、速度等都可配置
4. **鼠标交互**：可以选择启用鼠标交互，粒子会对鼠标位置做出反应
5. **连接线效果**：粒子之间可以根据距离显示连接线
6. **性能优化**：使用requestAnimationFrame进行动画渲染
7. **事件支持**：提供初始化完成和动画帧事件
