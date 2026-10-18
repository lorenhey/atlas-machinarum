/**
 * ATLAS MACHINARUM - Aplicación Interactiva y Renderizador CAD
 * Autor: Loren
 */

import { KinematicsEngine } from './kinematics.js';
import { MECHANISM_CATALOG, MOTION_TRANSFORM_MATRIX } from './theory.js';

class AtlasApp {
    constructor() {
        this.currentMechId = 'four_bar';
        this.params = {};
        this.angle = 0; // en radianes
        this.playing = true;
        this.speed = 1.0;
        
        // Estado del Canvas CAD
        this.canvas = document.getElementById('cadCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scale = 1400; // píxeles por metro
        this.panX = 0;
        this.panY = 0;
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        // Opciones visuales
        this.showTrajectory = true;
        this.showVelocities = true;
        this.showLabels = true;
        this.showGrid = true;
        
        // Travesía y comparación
        this.trajectory = [];
        this.overlayTrajectory = null;
        this.overlayMechName = null;
        
        // Inicialización
        this.initDOM();
        this.initEvents();
        this.loadMechanism(this.currentMechId);
        this.renderTheoryTab();
        this.renderMatrixTab();
        this.resizeCanvas();
        
        // Ciclo de animación a 60 FPS
        this.lastTime = performance.now();
        requestAnimationFrame(this.animate.bind(this));
    }

    initDOM() {
        // Selector de mecanismos
        const select = document.getElementById('mechSelector');
        select.innerHTML = '';
        
        // Agrupar por familias
        const families = {};
        for (const [id, data] of Object.entries(MECHANISM_CATALOG)) {
            if (!families[data.family]) families[data.family] = [];
            families[data.family].push(data);
        }
        
        for (const [famName, mechs] of Object.entries(families)) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = famName;
            mechs.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.id;
                opt.textContent = `${m.name} (${m.subtitle.split(' ')[0]}...)`;
                optgroup.appendChild(opt);
            });
            select.appendChild(optgroup);
        }
        select.value = this.currentMechId;
    }

    initEvents() {
        // Redimensionamiento
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Selector de mecanismo
        document.getElementById('mechSelector').addEventListener('change', (e) => {
            this.loadMechanism(e.target.value);
        });

        // Controles de simulación
        const btnPlay = document.getElementById('btnPlay');
        btnPlay.addEventListener('click', () => {
            this.playing = !this.playing;
            btnPlay.textContent = this.playing ? '⏸' : '▶';
        });

        const scrub = document.getElementById('angleScrubber');
        scrub.addEventListener('input', (e) => {
            this.angle = (parseFloat(e.target.value) * Math.PI) / 180;
            this.updateAngleDisplay();
        });

        document.getElementById('speedSelector').addEventListener('change', (e) => {
            this.speed = parseFloat(e.target.value);
        });

        document.getElementById('btnResetAngle').addEventListener('click', () => {
            this.angle = 0;
            this.updateAngleDisplay();
        });

        // Botones de vista / herramientas CAD
        document.getElementById('btnToggleTrajectory').addEventListener('click', (e) => {
            this.showTrajectory = !this.showTrajectory;
            e.currentTarget.classList.toggle('active', this.showTrajectory);
        });

        document.getElementById('btnToggleVelocities').addEventListener('click', (e) => {
            this.showVelocities = !this.showVelocities;
            e.currentTarget.classList.toggle('active', this.showVelocities);
        });

        document.getElementById('btnToggleLabels').addEventListener('click', (e) => {
            this.showLabels = !this.showLabels;
            e.currentTarget.classList.toggle('active', this.showLabels);
        });

        document.getElementById('btnResetView').addEventListener('click', () => {
            this.panX = 0;
            this.panY = 0;
            this.autoScale();
        });

        // Comparación / Snapshot
        document.getElementById('btnSnapshotOverlay').addEventListener('click', () => {
            if (this.overlayTrajectory) {
                this.overlayTrajectory = null;
                this.overlayMechName = null;
                document.getElementById('btnSnapshotOverlay').classList.remove('active-overlay');
                document.getElementById('btnSnapshotOverlay').textContent = '📸 Fijar Curva Testigo';
            } else {
                this.overlayTrajectory = [...this.trajectory];
                this.overlayMechName = MECHANISM_CATALOG[this.currentMechId].name;
                document.getElementById('btnSnapshotOverlay').classList.add('active-overlay');
                document.getElementById('btnSnapshotOverlay').textContent = '❌ Borrar Testigo';
            }
        });

        // Exportación de datos
        document.getElementById('btnExportCSV').addEventListener('click', () => this.exportCSV());
        document.getElementById('btnExportSVG').addEventListener('click', () => this.exportSVG());

        // Navegación por pestañas
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
                
                btn.classList.add('active');
                const tabId = btn.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
                
                if (tabId === 'tab-workbench') {
                    this.resizeCanvas();
                } else if (window.renderMathInElement) {
                    window.renderMathInElement(document.getElementById(tabId), {
                        delimiters: [
                            { left: "$$", right: "$$", display: true },
                            { left: "$", right: "$", display: false }
                        ]
                    });
                }
            });
        });

        // Alternador de tema Claro / Oscuro
        document.getElementById('btnToggleTheme').addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            document.getElementById('btnToggleTheme').textContent = newTheme === 'dark' ? '☀️ Claro' : '🌙 Oscuro';
        });

        // Eventos del Mouse en Canvas (Pan & Zoom)
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            const dx = e.clientX - this.lastMouseX;
            const dy = e.clientY - this.lastMouseY;
            this.panX += dx;
            this.panY += dy;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
            this.scale *= zoomFactor;
            this.scale = Math.max(200, Math.min(10000, this.scale));
        });
    }

    resizeCanvas() {
        const parent = this.canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = parent.clientWidth * dpr;
        this.canvas.height = parent.clientHeight * dpr;
        this.ctx.resetTransform();
        this.ctx.scale(dpr, dpr);
        this.displayWidth = parent.clientWidth;
        this.displayHeight = parent.clientHeight;
        if (this.panX === 0 && this.panY === 0) {
            this.autoScale();
        }
    }

    autoScale() {
        const meta = MECHANISM_CATALOG[this.currentMechId];
        this.panX = 0;
        this.panY = 0;
        if (this.currentMechId === 'slider_crank') this.scale = 1200;
        else if (this.currentMechId === 'four_bar') this.scale = 1300;
        else if (this.currentMechId === 'scotch_yoke') this.scale = 2200;
        else if (this.currentMechId === 'geneva') this.scale = 1800;
        else if (this.currentMechId === 'gears') this.scale = 2000;
        else if (this.currentMechId === 'planetary') this.scale = 2400;
        else if (this.currentMechId === 'peaucellier') this.scale = 900;
        else if (this.currentMechId === 'chebyshev') this.scale = 1400;
        else if (this.currentMechId === 'pantograph') this.scale = 550;
        else if (this.currentMechId === 'cam_follower') this.scale = 1400;
        else if (this.currentMechId === 'ratchet') this.scale = 1500;
    }

    loadMechanism(mechId) {
        this.currentMechId = mechId;
        const data = MECHANISM_CATALOG[mechId];
        
        // Copiar valores de parámetros por defecto
        this.params = {};
        for (const [key, p] of Object.entries(data.params)) {
            this.params[key] = p.val;
        }

        // Construir sliders de parámetros en el panel lateral
        this.renderParamsUI();
        
        // Actualizar badges
        document.getElementById('mechBadgeFamily').textContent = data.family;
        document.getElementById('mechBadgeDof').textContent = `${data.dof} GDL`;
        
        // Reset de trayectoria y auto escala
        this.recomputeTrajectory();
        this.autoScale();
        this.angle = 0;
        this.updateAngleDisplay();
    }

    renderParamsUI() {
        const container = document.getElementById('paramsContainer');
        container.innerHTML = '';
        const data = MECHANISM_CATALOG[this.currentMechId];

        for (const [key, p] of Object.entries(data.params)) {
            const group = document.createElement('div');
            group.className = 'param-group';

            const header = document.createElement('div');
            header.className = 'param-header';
            header.innerHTML = `<span>${p.label}</span><span class="param-val" id="val_${key}">${this.params[key]} ${p.unit}</span>`;

            const inputs = document.createElement('div');
            inputs.className = 'param-inputs';

            const slider = document.createElement('input');
            slider.type = 'range';
            slider.className = 'param-slider';
            slider.min = p.min;
            slider.max = p.max;
            slider.step = p.step;
            slider.value = this.params[key];

            const num = document.createElement('input');
            num.type = 'number';
            num.className = 'param-number';
            num.min = p.min;
            num.max = p.max;
            num.step = p.step;
            num.value = this.params[key];

            const updateVal = (newVal) => {
                const parsed = parseFloat(newVal);
                if (!isNaN(parsed)) {
                    this.params[key] = parsed;
                    slider.value = parsed;
                    num.value = parsed;
                    document.getElementById(`val_${key}`).textContent = `${parsed} ${p.unit}`;
                    this.recomputeTrajectory();
                }
            };

            slider.addEventListener('input', (e) => updateVal(e.target.value));
            num.addEventListener('change', (e) => updateVal(e.target.value));

            inputs.appendChild(slider);
            inputs.appendChild(num);
            group.appendChild(header);
            group.appendChild(inputs);
            container.appendChild(group);
        }
    }

    recomputeTrajectory() {
        try {
            this.trajectory = KinematicsEngine.generateTrajectory(this.currentMechId, this.params, 180);
        } catch (e) {
            console.warn("Falla en cálculo de trayectoria:", e);
            this.trajectory = [];
        }
    }

    updateAngleDisplay() {
        const deg = Math.round((this.angle * 180 / Math.PI) % 360);
        const positiveDeg = deg < 0 ? deg + 360 : deg;
        document.getElementById('angleReadout').textContent = `${positiveDeg}°`;
        document.getElementById('angleScrubber').value = positiveDeg;
    }

    animate(timestamp) {
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        if (this.playing) {
            // Velocidad base: 1 revolución cada 4 segundos * multiplicador
            const angularVel = (Math.PI / 2) * this.speed;
            this.angle = (this.angle + angularVel * dt) % KinematicsEngine.TWO_PI;
            this.updateAngleDisplay();
        }

        this.renderCanvas();
        requestAnimationFrame(this.animate.bind(this));
    }

    renderCanvas() {
        const ctx = this.ctx;
        const w = this.displayWidth;
        const h = this.displayHeight;

        ctx.clearRect(0, 0, w, h);

        const cx = w / 2 + this.panX;
        const cy = h / 2 + this.panY;

        // 1. Cuadrícula milimétrica CAD
        if (this.showGrid) {
            this.drawGrid(cx, cy, w, h);
        }

        // 2. Trazo de Curva Testigo Superpuesta (Overlay / Compare)
        if (this.overlayTrajectory && this.overlayTrajectory.length > 0) {
            this.drawTrajectoryCurve(this.overlayTrajectory, cx, cy, true);
        }

        // 3. Trazo de Trayectoria Activa (Coupler Curve)
        if (this.showTrajectory && this.trajectory.length > 0) {
            this.drawTrajectoryCurve(this.trajectory, cx, cy, false);
        }

        // 4. Cinemática del Estado Actual
        let currentState = null;
        try {
            currentState = KinematicsEngine.solve(this.currentMechId, this.params, this.angle);
            this.renderMetrics(currentState.metrics);
        } catch (err) {
            this.renderErrorState(err.message);
            return;
        }

        // 5. Dibujo técnico específico del mecanismo
        this.drawMechanism(currentState, cx, cy);
    }

    drawGrid(cx, cy, w, h) {
        const ctx = this.ctx;
        const isDark = (document.documentElement.getAttribute('data-theme') || 'dark') === 'dark';
        
        ctx.save();
        ctx.lineWidth = 1;
        ctx.strokeStyle = isDark ? '#1a2232' : '#e2e8f0';

        const gridSize = 0.05 * this.scale; // Cuadrícula de 50 mm
        if (gridSize > 15) {
            const startX = cx % gridSize;
            for (let x = startX; x < w; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, h);
                ctx.stroke();
            }

            const startY = cy % gridSize;
            for (let y = startY; y < h; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
                ctx.stroke();
            }
        }

        // Ejes coordenados principales
        ctx.strokeStyle = isDark ? '#2e3d55' : '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, cy);
        ctx.lineTo(w, cy);
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, h);
        ctx.stroke();

        ctx.restore();
    }

    drawTrajectoryCurve(pathData, cx, cy, isOverlay = false) {
        const ctx = this.ctx;
        if (!pathData || pathData.length < 2) return;

        ctx.save();
        ctx.beginPath();
        let started = false;

        for (let i = 0; i < pathData.length; i++) {
            const st = pathData[i];
            // Buscar el punto trazador relevante
            let pt = st.points.P || st.points.B || st.points.Cout || st.points.ContactPoint || st.points.YokeCenter;
            if (!pt) continue;

            const px = cx + pt[0] * this.scale;
            const py = cy - pt[1] * this.scale;

            if (!started) {
                ctx.moveTo(px, py);
                started = true;
            } else {
                ctx.lineTo(px, py);
            }
        }

        if (isOverlay) {
            ctx.strokeStyle = 'rgba(249, 115, 22, 0.75)';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([6, 6]);
            ctx.stroke();
        } else {
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
            ctx.lineWidth = 2.5;
            ctx.stroke();
        }
        ctx.restore();
    }

    drawMechanism(state, cx, cy) {
        const pts = state.points;
        const toScreen = (p) => [cx + p[0] * this.scale, cy - p[1] * this.scale];

        switch (this.currentMechId) {
            case 'slider_crank': {
                const sO = toScreen(pts.O);
                const sA = toScreen(pts.A);
                const sB = toScreen(pts.B);

                // Bancada en O
                this.drawGroundPivot(sO[0], sO[1], 'O');

                // Guía horizontal de la corredera
                this.drawSliderGuide(sB[0], sB[1]);

                // Eslabones
                this.drawLink(sO, sA, '#38bdf8', 6);
                this.drawLink(sA, sB, '#94a3b8', 5);

                // Corredera (Bloque de pistón)
                this.drawSliderBlock(sB[0], sB[1]);

                // Articulaciones
                this.drawJoint(sA[0], sA[1], 'A');
                this.drawJoint(sB[0], sB[1], 'B');

                // Vector de velocidad en B
                if (this.showVelocities && state.vectors.vB) {
                    const vx = state.vectors.vB[0] * this.scale * 0.4;
                    this.drawVelocityVector(sB[0], sB[1], sB[0] + vx, sB[1], 'v_B');
                }
                break;
            }

            case 'four_bar': {
                const sO2 = toScreen(pts.O2);
                const sA = toScreen(pts.A);
                const sB = toScreen(pts.B);
                const sO4 = toScreen(pts.O4);
                const sP = toScreen(pts.P);

                // Bancadas fijas
                this.drawGroundPivot(sO2[0], sO2[1], 'O2');
                this.drawGroundPivot(sO4[0], sO4[1], 'O4');
                this.drawConstructionLine(sO2, sO4);

                // Triángulo del acoplador hacia el punto P
                if (this.params.cp_length > 0) {
                    this.drawCouplerTriangle(sA, sB, sP);
                }

                // Eslabones principales
                this.drawLink(sO2, sA, '#38bdf8', 6); // Manivela
                this.drawLink(sA, sB, '#94a3b8', 5);   // Acoplador
                this.drawLink(sO4, sB, '#f59e0b', 6);  // Balancín

                // Articulaciones
                this.drawJoint(sA[0], sA[1], 'A');
                this.drawJoint(sB[0], sB[1], 'B');
                if (this.params.cp_length > 0) {
                    this.drawTracerPoint(sP[0], sP[1], 'P');
                }
                break;
            }

            case 'scotch_yoke': {
                const sO = toScreen(pts.O);
                const sA = toScreen(pts.A);
                const sTop = toScreen(pts.YokeTop);
                const sBottom = toScreen(pts.YokeBottom);
                const sCenter = toScreen(pts.YokeCenter);

                this.drawGroundPivot(sO[0], sO[1], 'O');
                this.drawLink(sO, sA, '#38bdf8', 5);

                // Ranura y Marco del Yugo
                this.drawYokeFrame(sTop, sBottom, sCenter);
                this.drawJoint(sA[0], sA[1], 'Perno');

                if (this.showVelocities && state.vectors.vYoke) {
                    const vx = state.vectors.vYoke[0] * this.scale * 0.4;
                    this.drawVelocityVector(sCenter[0], sCenter[1], sCenter[0] + vx, sCenter[1], 'v_yugo');
                }
                break;
            }

            case 'geneva': {
                const sO2 = toScreen(pts.O2);
                const sO3 = toScreen(pts.O3);
                const sPin = toScreen(pts.Pin);

                this.drawGroundPivot(sO2[0], sO2[1], 'Eje Conductor');
                this.drawGroundPivot(sO3[0], sO3[1], 'Eje Conducido');

                // Rueda conducida (Cruz de Malta con ranuras)
                this.drawGenevaWheel(sO3[0], sO3[1], state.metrics.wheel_radius * this.scale, this.params.n_slots, parseFloat(state.metrics.driven_angle_deg) * Math.PI / 180);

                // Manivela conductora con disco de bloqueo
                this.drawGenevaDriver(sO2[0], sO2[1], sPin, state.metrics.crank_radius * this.scale);
                break;
            }

            case 'gears': {
                const sO1 = toScreen(pts.O1);
                const sO2 = toScreen(pts.O2);

                this.drawGroundPivot(sO1[0], sO1[1], 'O1');
                this.drawGroundPivot(sO2[0], sO2[1], 'O2');

                const r1 = state.metrics.pitch_r1 * this.scale;
                const r2 = state.metrics.pitch_r2 * this.scale;

                this.drawGear(sO1[0], sO1[1], r1, this.params.n1, this.angle, '#38bdf8');
                this.drawGear(sO2[0], sO2[1], r2, this.params.n2, parseFloat(state.metrics.driven_angle_deg) * Math.PI / 180, '#f59e0b');
                break;
            }

            case 'planetary': {
                const sCenter = toScreen(pts.Center);
                const sCarrier = toScreen(pts.CarrierPin);

                this.drawGroundPivot(sCenter[0], sCenter[1], 'Eje Central');

                const rSun = state.metrics.sun_radius * this.scale;
                const rPlanet = state.metrics.planet_radius * this.scale;
                const rRing = state.metrics.ring_radius * this.scale;

                // Corona exterior
                this.drawRingGear(sCenter[0], sCenter[1], rRing, this.params.n_ring);

                // Portasatélites (Brazo portador)
                this.drawLink(sCenter, sCarrier, '#64748b', 8);

                // Sol central
                this.drawGear(sCenter[0], sCenter[1], rSun, this.params.n_sun, this.angle, '#38bdf8');

                // Satélite giratorio
                this.drawGear(sCarrier[0], sCarrier[1], rPlanet, this.params.n_planet, parseFloat(state.metrics.planet_spin_deg) * Math.PI / 180, '#f59e0b');
                this.drawJoint(sCarrier[0], sCarrier[1], 'Satélite');
                break;
            }

            case 'peaucellier': {
                const sO = toScreen(pts.O);
                const sOprime = toScreen(pts.Oprime);
                const sA = toScreen(pts.A);
                const sB = toScreen(pts.B);
                const sC = toScreen(pts.C);
                const sP = toScreen(pts.P);

                this.drawGroundPivot(sO[0], sO[1], 'O (Polo)');
                this.drawGroundPivot(sOprime[0], sOprime[1], "O'");

                // Manivela circular auxiliar O'A
                this.drawLink(sOprime, sA, '#64748b', 4);

                // Brazos largos OB y OC
                this.drawLink(sO, sB, '#38bdf8', 4);
                this.drawLink(sO, sC, '#38bdf8', 4);

                // Rombo articulado AB, BC, CP, PA
                this.drawLink(sA, sB, '#f59e0b', 5);
                this.drawLink(sB, sP, '#f59e0b', 5);
                this.drawLink(sP, sC, '#f59e0b', 5);
                this.drawLink(sC, sA, '#f59e0b', 5);

                this.drawJoint(sA[0], sA[1], 'A');
                this.drawJoint(sB[0], sB[1], 'B');
                this.drawJoint(sC[0], sC[1], 'C');
                this.drawTracerPoint(sP[0], sP[1], 'P (Recta)');
                break;
            }

            case 'chebyshev': {
                const sO2 = toScreen(pts.O2);
                const sO4 = toScreen(pts.O4);
                const sA = toScreen(pts.A);
                const sB = toScreen(pts.B);
                const sP = toScreen(pts.P);

                this.drawGroundPivot(sO2[0], sO2[1], 'O2');
                this.drawGroundPivot(sO4[0], sO4[1], 'O4');
                this.drawConstructionLine(sO2, sO4);

                // Eslabones cruzados
                this.drawLink(sO2, sA, '#38bdf8', 5);
                this.drawLink(sA, sB, '#94a3b8', 6);
                this.drawLink(sO4, sB, '#38bdf8', 5);

                this.drawJoint(sA[0], sA[1], 'A');
                this.drawJoint(sB[0], sB[1], 'B');
                this.drawTracerPoint(sP[0], sP[1], 'P');
                break;
            }

            case 'pantograph': {
                const sO = toScreen(pts.O);
                const sDin = toScreen(pts.Din);
                const sCout = toScreen(pts.Cout);
                const sA = toScreen(pts.A);
                const sB = toScreen(pts.B);
                const sC = toScreen(pts.C);

                this.drawGroundPivot(sO[0], sO[1], 'O (Polo Fijo)');

                // Paralelogramo
                this.drawLink(sO, sCout, '#38bdf8', 4);
                this.drawLink(sO, sDin, '#94a3b8', 4);
                this.drawLink(sB, sC, '#f59e0b', 4);
                this.drawLink(sA, sC, '#f59e0b', 4);

                this.drawJoint(sDin[0], sDin[1], 'Entrada');
                this.drawTracerPoint(sCout[0], sCout[1], 'Salida');
                break;
            }

            case 'cam_follower': {
                const sCam = toScreen(pts.CamCenter);
                const sRoller = toScreen(pts.RollerCenter);

                this.drawGroundPivot(sCam[0], sCam[1], 'Árbol');

                // Perfil de la leva girando
                this.drawCamProfile(sCam[0], sCam[1], this.params.base_radius * this.scale, this.params.lift * this.scale, this.angle);

                // Seguidor de rodillo y vástago
                this.drawRollerFollower(sRoller[0], sRoller[1], this.params.roller_radius * this.scale);
                break;
            }

            case 'ratchet': {
                const sCenter = toScreen(pts.WheelCenter);
                const sLeverEnd = toScreen(pts.LeverEnd);
                const sPawl = toScreen(pts.PawlPin);

                this.drawGroundPivot(sCenter[0], sCenter[1], 'Eje Central');

                // Rueda de dientes de sierra
                this.drawRatchetWheel(sCenter[0], sCenter[1], this.params.radius * this.scale, this.params.teeth);

                // Palanca motriz y uñeta
                this.drawLink(sCenter, sLeverEnd, '#38bdf8', 6);
                this.drawLink(sLeverEnd, sPawl, '#f59e0b', 4);
                this.drawJoint(sLeverEnd[0], sLeverEnd[1], 'Palanca');
                break;
            }
        }
    }

    // Primitivas gráficas CAD
    drawLink(p1, p2, color = '#cbd5e1', width = 6) {
        const ctx = this.ctx;
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineWidth = width;
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.stroke();

        // Núcleo interno más fino
        ctx.lineWidth = Math.max(1, width - 3);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.stroke();
        ctx.restore();
    }

    drawJoint(x, y, label) {
        const ctx = this.ctx;
        ctx.save();
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.arc(x, y, 6, 0, KinematicsEngine.TWO_PI);
        ctx.fill();
        ctx.stroke();

        if (this.showLabels && label) {
            ctx.fillStyle = '#e2e8f0';
            ctx.font = '11px JetBrains Mono, monospace';
            ctx.fillText(label, x + 10, y - 8);
        }
        ctx.restore();
    }

    drawTracerPoint(x, y, label) {
        const ctx = this.ctx;
        ctx.save();
        ctx.fillStyle = '#f59e0b';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(x, y, 7, 0, KinematicsEngine.TWO_PI);
        ctx.fill();
        ctx.stroke();

        if (this.showLabels && label) {
            ctx.fillStyle = '#f59e0b';
            ctx.font = 'bold 12px JetBrains Mono, monospace';
            ctx.fillText(label, x + 10, y - 8);
        }
        ctx.restore();
    }

    drawGroundPivot(x, y, label) {
        const ctx = this.ctx;
        ctx.save();

        // Pin central
        ctx.fillStyle = '#f43f5e';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, KinematicsEngine.TWO_PI);
        ctx.fill();
        ctx.stroke();

        // Triángulo de soporte fijo
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 10, y + 15);
        ctx.lineTo(x + 10, y + 15);
        ctx.closePath();
        ctx.stroke();

        // Rayado de tierra
        ctx.lineWidth = 1.5;
        for (let i = -12; i <= 12; i += 6) {
            ctx.beginPath();
            ctx.moveTo(x + i, y + 15);
            ctx.lineTo(x + i - 4, y + 21);
            ctx.stroke();
        }

        if (this.showLabels && label) {
            ctx.fillStyle = '#f43f5e';
            ctx.font = '10px JetBrains Mono, monospace';
            ctx.fillText(label, x + 12, y + 5);
        }
        ctx.restore();
    }

    drawCouplerTriangle(A, B, P) {
        const ctx = this.ctx;
        ctx.save();
        ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(A[0], A[1]);
        ctx.lineTo(B[0], B[1]);
        ctx.lineTo(P[0], P[1]);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    drawConstructionLine(p1, p2) {
        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.stroke();
        ctx.restore();
    }

    drawSliderGuide(x, y) {
        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(x - 150, y);
        ctx.lineTo(x + 150, y);
        ctx.stroke();
        ctx.restore();
    }

    drawSliderBlock(x, y) {
        const ctx = this.ctx;
        const w = 40;
        const h = 24;
        ctx.save();
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.fillRect(x - w / 2, y - h / 2, w, h);
        ctx.strokeRect(x - w / 2, y - h / 2, w, h);
        ctx.restore();
    }

    drawYokeFrame(top, bottom, center) {
        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(top[0], top[1]);
        ctx.lineTo(bottom[0], bottom[1]);
        ctx.stroke();

        // Eje de salida
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(center[0], center[1]);
        ctx.lineTo(center[0] + 100, center[1]);
        ctx.stroke();
        ctx.restore();
    }

    drawGenevaWheel(cx, cy, radius, nSlots, angle) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);

        ctx.strokeStyle = '#f59e0b';
        ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
        ctx.lineWidth = 2;

        // Cuerpo circular
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, KinematicsEngine.TWO_PI);
        ctx.fill();
        ctx.stroke();

        // Ranuras
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        for (let i = 0; i < nSlots; i++) {
            const slotAngle = (i * KinematicsEngine.TWO_PI) / nSlots;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(radius * Math.cos(slotAngle), radius * Math.sin(slotAngle));
            ctx.stroke();
        }
        ctx.restore();
    }

    drawGenevaDriver(cx, cy, sPin, crankRadius) {
        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, crankRadius, 0, KinematicsEngine.TWO_PI);
        ctx.stroke();

        this.drawLink([cx, cy], sPin, '#38bdf8', 4);
        this.drawJoint(sPin[0], sPin[1], 'Perno');
        ctx.restore();
    }

    drawGear(cx, cy, radius, teeth, angle, color) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);

        ctx.strokeStyle = color;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 2;

        // Círculo primitivo
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, KinematicsEngine.TWO_PI);
        ctx.fill();
        ctx.stroke();

        // Dientes simplificados tipo plano técnico
        ctx.lineWidth = 2.5;
        const dt = KinematicsEngine.TWO_PI / teeth;
        for (let i = 0; i < teeth; i++) {
            const a = i * dt;
            ctx.beginPath();
            ctx.moveTo((radius - 5) * Math.cos(a), (radius - 5) * Math.sin(a));
            ctx.lineTo((radius + 6) * Math.cos(a), (radius + 6) * Math.sin(a));
            ctx.stroke();
        }
        ctx.restore();
    }

    drawRingGear(cx, cy, radius, teeth) {
        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, KinematicsEngine.TWO_PI);
        ctx.stroke();
        ctx.restore();
    }

    drawCamProfile(cx, cy, Rb, h, angle) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-angle);

        ctx.fillStyle = 'rgba(56, 189, 248, 0.1)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();

        const samples = 120;
        for (let i = 0; i <= samples; i++) {
            const th = (i * KinematicsEngine.TWO_PI) / samples;
            let s = 0;
            if (th <= Math.PI) {
                s = (h / 2) * (1 - Math.cos(th));
            } else {
                s = (h / 2) * (1 + Math.cos(th - Math.PI));
            }
            const r = Rb + s;
            const x = r * Math.sin(th);
            const y = r * Math.cos(th);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    drawRollerFollower(x, y, Rr) {
        const ctx = this.ctx;
        ctx.save();
        // Rodillo
        ctx.fillStyle = '#f59e0b';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, Rr, 0, KinematicsEngine.TWO_PI);
        ctx.fill();
        ctx.stroke();

        // Vástago vertical
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y - 80);
        ctx.stroke();
        ctx.restore();
    }

    drawRatchetWheel(cx, cy, radius, teeth) {
        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const dt = KinematicsEngine.TWO_PI / teeth;
        for (let i = 0; i < teeth; i++) {
            const a1 = i * dt;
            const a2 = (i + 1) * dt;
            const rTip = radius;
            const rRoot = radius * 0.85;

            const x1 = cx + rTip * Math.cos(a1);
            const y1 = cy + rTip * Math.sin(a1);
            const x2 = cx + rRoot * Math.cos(a2);
            const y2 = cy + rRoot * Math.sin(a2);

            if (i === 0) ctx.moveTo(x1, y1);
            else ctx.lineTo(x1, y1);
            ctx.lineTo(x2, y2);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }

    drawVelocityVector(x1, y1, x2, y2, label) {
        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = '#10b981';
        ctx.fillStyle = '#10b981';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Punta de flecha
        const angle = Math.atan2(y2 - y1, x2 - x1);
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - 8 * Math.cos(angle - Math.PI / 6), y2 - 8 * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x2 - 8 * Math.cos(angle + Math.PI / 6), y2 - 8 * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();

        if (this.showLabels && label) {
            ctx.font = '10px JetBrains Mono, monospace';
            ctx.fillText(label, x2 + 5, y2 - 5);
        }
        ctx.restore();
    }

    renderMetrics(metrics) {
        const container = document.getElementById('metricsContainer');
        container.innerHTML = '';

        for (const [key, val] of Object.entries(metrics)) {
            const card = document.createElement('div');
            card.className = 'metric-card';

            const label = document.createElement('div');
            label.className = 'metric-label';
            label.textContent = key.replace(/_/g, ' ');

            const value = document.createElement('div');
            value.className = 'metric-value';
            
            if (typeof val === 'number') {
                value.textContent = val.toFixed(3);
                if (key.includes('angle') || key.includes('mu')) {
                    value.textContent += '°';
                }
            } else {
                value.textContent = val;
            }

            if (key === 'transmission_quality') {
                if (val.includes('Óptimo')) value.classList.add('safe');
                else value.classList.add('alert');
            }

            card.appendChild(label);
            card.appendChild(value);
            container.appendChild(card);
        }
    }

    renderErrorState(msg) {
        const container = document.getElementById('metricsContainer');
        container.innerHTML = `
            <div class="metric-card" style="grid-column: 1 / -1; border-color: var(--accent-red);">
                <div class="metric-label" style="color: var(--accent-red);">Singularidad Cinemática</div>
                <div class="metric-value" style="font-size: 0.8rem; color: #fca5a5;">${msg}</div>
            </div>
        `;
    }

    renderTheoryTab() {
        const container = document.getElementById('theoryArticles');
        container.innerHTML = '';

        for (const [id, data] of Object.entries(MECHANISM_CATALOG)) {
            const card = document.createElement('div');
            card.className = 'doc-card';
            card.id = `theory-${id}`;

            card.innerHTML = `
                <h2>${data.name} — <span style="font-size:0.95rem; color: var(--text-muted);">${data.subtitle}</span></h2>
                <div style="margin-bottom: 12px;">
                    <span class="mech-badge">${data.family}</span>
                    <span class="mech-badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">${data.dof} Grado de Libertad</span>
                    <span class="mech-badge" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;">Entrada: ${data.input_type} → Salida: ${data.output_type}</span>
                </div>
                
                <p>${data.description}</p>
                
                <div class="section-title">Ecuaciones de Lazo Cinemático y Velocidad</div>
                <div class="math-block">$$\\begin{aligned} ${data.equation} \\\\ ${data.velocity_eq} \\end{aligned}$$</div>
                
                <div class="section-title">Contexto Histórico y Genealogía</div>
                <p style="font-style: italic; color: var(--text-muted);">${data.historical_context}</p>
                
                <div class="section-title">Aplicaciones Industriales de Ingeniería</div>
                <ul>
                    ${data.industrial_uses.map(u => `<li>${u}</li>`).join('')}
                </ul>
            `;
            container.appendChild(card);
        }
    }

    renderMatrixTab() {
        const tbody = document.getElementById('matrixTableBody');
        tbody.innerHTML = '';

        MOTION_TRANSFORM_MATRIX.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${row.input}</strong></td>
                <td><strong>${row.output}</strong></td>
                <td>
                    ${row.mechanisms.map(mId => {
                        const m = MECHANISM_CATALOG[mId];
                        return `<span class="pill-mech" data-load-mech="${mId}">${m.name}</span>`;
                    }).join('')}
                </td>
                <td style="color: var(--text-muted); font-size: 0.85rem;">${row.note}</td>
            `;
            tbody.appendChild(tr);
        });

        // Click en pills para cargar mecanismo
        document.querySelectorAll('[data-load-mech]').forEach(pill => {
            pill.addEventListener('click', (e) => {
                const mId = e.currentTarget.getAttribute('data-load-mech');
                document.getElementById('mechSelector').value = mId;
                this.loadMechanism(mId);
                
                // Cambiar a la pestaña de simulador
                document.querySelector('[data-tab="tab-workbench"]').click();
            });
        });
    }

    exportCSV() {
        if (!this.trajectory || this.trajectory.length === 0) {
            alert("No hay trayectoria calculada para exportar.");
            return;
        }

        let csv = "step,input_rad,input_deg,x,y\n";
        this.trajectory.forEach((st, idx) => {
            const pt = st.points.P || st.points.B || st.points.Cout || st.points.ContactPoint || st.points.YokeCenter;
            if (pt) {
                csv += `${idx},${st.input.toFixed(5)},${(st.input * 180 / Math.PI).toFixed(2)},${pt[0].toFixed(6)},${pt[1].toFixed(6)}\n`;
            }
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `atlas_machinarum_${this.currentMechId}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    exportSVG() {
        const w = 800;
        const h = 600;
        let svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">\n`;
        svg += `<rect width="100%" height="100%" fill="#0f141d"/>\n`;
        svg += `<!-- Generado por Atlas Machinarum - Autor: Loren -->\n`;

        // Exportar curva de trayectoria
        if (this.trajectory && this.trajectory.length > 1) {
            let ptsStr = "";
            this.trajectory.forEach((st, idx) => {
                const pt = st.points.P || st.points.B || st.points.Cout || st.points.ContactPoint || st.points.YokeCenter;
                if (pt) {
                    const sx = (w / 2 + pt[0] * this.scale).toFixed(2);
                    const sy = (h / 2 - pt[1] * this.scale).toFixed(2);
                    ptsStr += `${idx === 0 ? 'M' : 'L'} ${sx} ${sy} `;
                }
            });
            svg += `<path d="${ptsStr}" fill="none" stroke="#38bdf8" stroke-width="2"/>\n`;
        }
        svg += `</svg>`;

        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `atlas_machinarum_${this.currentMechId}.svg`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Iniciar aplicación al cargar el DOM
window.addEventListener('DOMContentLoaded', () => {
    window.atlasApp = new AtlasApp();
});
