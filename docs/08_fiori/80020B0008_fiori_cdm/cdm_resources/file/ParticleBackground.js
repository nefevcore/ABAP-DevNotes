sap.ui.define([
    "cdm/ui/control/MonitorBackground",
    "cdm/ui/control/ParticleBackgroundRenderer",
    "sap/ui/core/ResizeHandler",
], function (MonitorBackground, ParticleBackgroundRenderer, ResizeHandler) {
    "use strict";

    return MonitorBackground.extend("cdm.ui.control.ParticleBackground", {
        metadata: {
            properties: {
                "particleCount": {
                    type: "int",
                    defaultValue: 80  // 减少粒子数量以提高性能
                },
                "lineDistance": {
                    type: "int",
                    defaultValue: 120  // 增加连接距离
                },
                "particleSize": {
                    type: "float",
                    defaultValue: 1.5  // 稍微增大粒子
                },
                "maxSpeed": {
                    type: "float",
                    defaultValue: 0.5  // 降低速度，更平滑
                },
                "mouseRadius": {
                    type: "int",
                    defaultValue: 200  // 增大鼠标影响范围
                },
                "particleColor": {
                    type: "string",
                    defaultValue: "rgba(64, 158, 255, 0.8)"  // 科技蓝，带透明度
                },
                "lineColor": {
                    type: "string",
                    defaultValue: "rgba(64, 158, 255, 0.15)"  // 更淡的连接线
                },
                "backgroundColor": {
                    type: "string",
                    defaultValue: "transparent"  // 透明背景，便于叠加
                },
                "drawLines": {
                    type: "boolean",
                    defaultValue: true
                },
                "interactivity": {
                    type: "boolean",
                    defaultValue: true
                },
                "gradientEffect": {
                    type: "boolean",
                    defaultValue: true  // 新增：渐变效果
                },
                "flowDirection": {
                    type: "string",
                    defaultValue: "random",  // 新增：流动方向
                    values: ["random", "horizontal", "vertical", "center"]
                },
                "particleOpacity": {
                    type: "float",
                    defaultValue: 0.8  // 新增：粒子透明度
                }
            },
            events: {
                "particleClick": {
                    parameters: {
                        x: { type: "int" },
                        y: { type: "int" }
                    }
                }
            },
            renderer: ParticleBackgroundRenderer
        },

        init: function () {
            this.particles = [];
            this.mouse = { x: null, y: null, radius: this.getMouseRadius() };
            this.animationId = null;
            this.resizeHandlerId = null;
            this.lastTime = 0;
            this.fps = 60;
            this.frameInterval = 1000 / this.fps;
        },

        onAfterRendering: function () {
            this.initCanvas();
            this.initParticles();
            this.bindEvents();
            this.startAnimation();
        },

        _getCanvasDomRef: function () {
            return this.getDomRef().children[0];
        },

        initCanvas: function () {
            this.canvas = this._getCanvasDomRef();
            this.ctx = this.canvas.getContext('2d');
            this.updateCanvasSize();
        },

        updateCanvasSize: function () {
            const oRect = this._getCanvasDomRef().getBoundingClientRect();
            this.canvas.width = oRect.width;
            this.canvas.height = oRect.height;
        },

        initParticles: function () {
            this.particles = [];
            const flowDirection = this.getFlowDirection();

            for (let i = 0; i < this.getParticleCount(); i++) {
                let speedX, speedY;

                // 根据流动方向设置初始速度
                switch (flowDirection) {
                    case "horizontal":
                        speedX = Math.random() * this.getMaxSpeed() * 2 - this.getMaxSpeed();
                        speedY = (Math.random() - 0.5) * 0.2;  // 很小的垂直扰动
                        break;
                    case "vertical":
                        speedX = (Math.random() - 0.5) * 0.2;  // 很小的水平扰动
                        speedY = Math.random() * this.getMaxSpeed() * 2 - this.getMaxSpeed();
                        break;
                    case "center":
                        const angle = Math.random() * Math.PI * 2;
                        const speed = Math.random() * this.getMaxSpeed();
                        speedX = Math.cos(angle) * speed;
                        speedY = Math.sin(angle) * speed;
                        break;
                    default: // random
                        speedX = Math.random() * this.getMaxSpeed() * 2 - this.getMaxSpeed();
                        speedY = Math.random() * this.getMaxSpeed() * 2 - this.getMaxSpeed();
                }

                this.particles.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    size: Math.random() * this.getParticleSize() + 1,
                    speedX: speedX,
                    speedY: speedY,
                    originalSpeedX: speedX,
                    originalSpeedY: speedY,
                    color: this.getParticleColor(),
                    opacity: Math.random() * 0.5 + 0.5,  // 随机透明度
                    pulse: Math.random() * Math.PI * 2  // 脉动相位
                });
            }
        },

        updateParticles: function (timestamp) {
            // 限制帧率以提高性能
            if (!this.lastTime) this.lastTime = timestamp;
            const deltaTime = timestamp - this.lastTime;

            if (deltaTime < this.frameInterval) return;

            this.lastTime = timestamp - (deltaTime % this.frameInterval);

            const oRect = this.getDomRef().getBoundingClientRect();
            const flowDirection = this.getFlowDirection();

            this.particles.forEach(particle => {
                // 脉动效果
                particle.pulse += 0.05;
                const pulseFactor = 0.8 + Math.sin(particle.pulse) * 0.2;

                // 更新位置
                particle.x += particle.speedX;
                particle.y += particle.speedY;

                // 边界检查 - 更平滑的边界处理
                if (particle.x > oRect.width + 10) {
                    particle.x = -10;
                    particle.y = Math.random() * oRect.height;
                }
                if (particle.x < -10) {
                    particle.x = oRect.width + 10;
                    particle.y = Math.random() * oRect.height;
                }
                if (particle.y > oRect.height + 10) {
                    particle.y = -10;
                    particle.x = Math.random() * oRect.width;
                }
                if (particle.y < -10) {
                    particle.y = oRect.height + 10;
                    particle.x = Math.random() * oRect.width;
                }

                // 鼠标互动 - 更平滑的互动效果
                if (this.getInteractivity() && this.mouse.x && this.mouse.y) {
                    const dx = this.mouse.x - particle.x;
                    const dy = this.mouse.y - particle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < this.mouse.radius) {
                        const force = (this.mouse.radius - distance) / this.mouse.radius;
                        const angle = Math.atan2(dy, dx);

                        // 更自然的排斥效果
                        particle.speedX -= Math.cos(angle) * force * 0.3;
                        particle.speedY -= Math.sin(angle) * force * 0.3;

                        // 限制最大速度
                        const currentSpeed = Math.sqrt(particle.speedX * particle.speedX + particle.speedY * particle.speedY);
                        const maxSpeed = this.getMaxSpeed() * 2;
                        if (currentSpeed > maxSpeed) {
                            particle.speedX = (particle.speedX / currentSpeed) * maxSpeed;
                            particle.speedY = (particle.speedY / currentSpeed) * maxSpeed;
                        }
                    } else {
                        // 逐渐恢复原始速度
                        particle.speedX += (particle.originalSpeedX - particle.speedX) * 0.05;
                        particle.speedY += (particle.originalSpeedY - particle.speedY) * 0.05;
                    }
                }

                // 根据流动方向调整行为
                if (flowDirection !== "random") {
                    particle.speedX += (particle.originalSpeedX - particle.speedX) * 0.02;
                    particle.speedY += (particle.originalSpeedY - particle.speedY) * 0.02;
                }
            });
        },

        drawParticles: function () {
            this.particles.forEach(particle => {
                // 计算脉动大小
                const pulseFactor = 0.8 + Math.sin(particle.pulse) * 0.2;
                const currentSize = particle.size * pulseFactor;

                // 创建渐变效果
                if (this.getGradientEffect()) {
                    const gradient = this.ctx.createRadialGradient(
                        particle.x, particle.y, 0,
                        particle.x, particle.y, currentSize * 2
                    );
                    gradient.addColorStop(0, particle.color.replace('0.8', particle.opacity.toString()));
                    gradient.addColorStop(1, particle.color.replace('0.8', '0'));
                    this.ctx.fillStyle = gradient;
                } else {
                    this.ctx.fillStyle = particle.color.replace('0.8', particle.opacity.toString());
                }

                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, currentSize, 0, Math.PI * 2);
                this.ctx.fill();
            });
        },

        connectParticles: function () {
            const lineDistance = this.getLineDistance();
            const lineColor = this.getLineColor();

            // 使用空间分割优化连接计算
            const gridSize = lineDistance;
            const grid = {};

            // 将粒子分配到网格
            this.particles.forEach((particle, i) => {
                const gridX = Math.floor(particle.x / gridSize);
                const gridY = Math.floor(particle.y / gridSize);
                const key = `${gridX},${gridY}`;

                if (!grid[key]) grid[key] = [];
                grid[key].push({ particle, index: i });
            });

            // 只检查相邻网格中的粒子
            Object.keys(grid).forEach(key => {
                const [gridX, gridY] = key.split(',').map(Number);

                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        const neighborKey = `${gridX + dx},${gridY + dy}`;
                        if (grid[neighborKey]) {
                            grid[key].forEach(p1 => {
                                grid[neighborKey].forEach(p2 => {
                                    if (p1.index >= p2.index) return; // 避免重复检查

                                    const dx = p1.particle.x - p2.particle.x;
                                    const dy = p1.particle.y - p2.particle.y;
                                    const distance = Math.sqrt(dx * dx + dy * dy);

                                    if (distance < lineDistance) {
                                        const opacity = 1 - (distance / lineDistance);
                                        this.ctx.strokeStyle = lineColor.replace('0.15', opacity.toString());
                                        this.ctx.lineWidth = 0.5 * opacity;
                                        this.ctx.beginPath();
                                        this.ctx.moveTo(p1.particle.x, p1.particle.y);
                                        this.ctx.lineTo(p2.particle.x, p2.particle.y);
                                        this.ctx.stroke();
                                    }
                                });
                            });
                        }
                    }
                }
            });
        },

        startAnimation: function () {
            const animate = (timestamp) => {
                // 清除画布
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

                // 设置背景
                if (this.getBackgroundColor() !== 'transparent') {
                    this.ctx.fillStyle = this.getBackgroundColor();
                    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                }

                // 更新和绘制粒子
                this.updateParticles(timestamp);
                this.drawParticles();

                // 连接粒子
                if (this.getDrawLines()) {
                    this.connectParticles();
                }

                this.animationId = requestAnimationFrame(animate);
            };

            animate(0);
        },

        bindEvents: function () {
            // 鼠标移动
            this.canvas.addEventListener('mousemove', (e) => {
                if (this.getInteractivity()) {
                    const rect = this.canvas.getBoundingClientRect();
                    this.mouse.x = e.clientX - rect.left;
                    this.mouse.y = e.clientY - rect.top;
                    this.mouse.radius = this.getMouseRadius();
                }
            });

            // 鼠标离开
            this.canvas.addEventListener('mouseleave', () => {
                this.mouse.x = null;
                this.mouse.y = null;
            });

            // 点击事件
            this.canvas.addEventListener('click', (e) => {
                const rect = this.canvas.getBoundingClientRect();
                this.fireParticleClick({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                });
            });

            // 窗口大小调整
            this.resizeHandlerId = ResizeHandler.register(this, () => {
                this.updateCanvasSize();
                this.initParticles();
            });
        },

        // 新增方法：重置粒子
        resetParticles: function () {
            this.initParticles();
        },

        // 新增方法：设置流动方向
        setFlowDirection: function (direction) {
            this.setProperty("flowDirection", direction);
            this.initParticles();
        },

        exit: function () {
            // 停止动画
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }

            // 注销 resize handler
            if (this.resizeHandlerId) {
                ResizeHandler.deregister(this.resizeHandlerId);
                this.resizeHandlerId = null;
            }

            Control.prototype.exit.apply(this, arguments);
        }
    });
});