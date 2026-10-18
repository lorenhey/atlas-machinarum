/**
 * ATLAS MACHINARUM - Motor Cinemático Analítico
 * Implementación matemática pura en JavaScript de mecanismos planos.
 * Autor: Loren
 */

export class KinematicsEngine {
    static TWO_PI = 2 * Math.PI;

    /**
     * Biela-Manivela (Slider-Crank Mechanism)
     */
    static solveSliderCrank(params, theta) {
        const { crank: R, rod: L, offset: E = 0.0 } = params;
        const Ax = R * Math.cos(theta);
        const Ay = R * Math.sin(theta);

        // Verificación de ensamblaje (cierre cinemático)
        const deltaY = E - Ay;
        if (Math.abs(deltaY) > L) {
            throw new Error(`Incompatibilidad geométrica: L (${L}) < |E - Ay| (${Math.abs(deltaY).toFixed(4)})`);
        }

        const deltaX = Math.sqrt(Math.max(0, L * L - deltaY * deltaY));
        const Bx = Ax + deltaX;
        const By = E;

        // Velocidad analítica de la corredera (para omega = 1 rad/s)
        const dDeltaY_dTheta = -R * Math.cos(theta);
        const vx = -R * Math.sin(theta) - (deltaY * dDeltaY_dTheta) / Math.max(0.0001, deltaX);

        // Ángulo de la biela (phi)
        const phi = Math.asin(Math.max(-1, Math.min(1, (Ay - E) / L)));

        return {
            input: theta,
            points: {
                O: [0, 0],
                A: [Ax, Ay],
                B: [Bx, By]
            },
            vectors: {
                vB: [vx, 0]
            },
            metrics: {
                stroke_pos: Bx,
                rod_angle_deg: (phi * 180 / Math.PI),
                slider_velocity: vx,
                grashof: L >= (R + Math.abs(E)) ? "Rotación completa admisible" : "Balancín oscilante"
            }
        };
    }

    /**
     * Eslabonamiento de Cuatro Barras (Four-Bar Linkage)
     */
    static solveFourBar(params, theta2, assemblyMode = 1) {
        const { ground: r1, crank: r2, coupler: r3, rocker: r4, cp_length = 0.0, cp_angle = 0.0 } = params;
        const O2 = [0, 0];
        const O4 = [r1, 0];

        const Ax = r2 * Math.cos(theta2);
        const Ay = r2 * Math.sin(theta2);

        // Vector diagonal A -> O4
        const Dx = r1 - Ax;
        const Dy = -Ay;
        const D2 = Dx * Dx + Dy * Dy;
        const D = Math.sqrt(D2);

        // Condición de cierre de lazo
        if (D > r3 + r4 || D < Math.abs(r3 - r4)) {
            throw new Error(`Geometría no cierra para theta2 = ${(theta2 * 180 / Math.PI).toFixed(1)}° (D=${D.toFixed(3)})`);
        }

        const cosAlpha = Math.max(-1, Math.min(1, (r3 * r3 + D2 - r4 * r4) / (2 * r3 * D)));
        const alpha = Math.acos(cosAlpha);
        const gamma = Math.atan2(Dy, Dx);

        // Rama de ensamblaje (modo 1 o -1)
        const theta3 = gamma - assemblyMode * alpha;

        const Bx = Ax + r3 * Math.cos(theta3);
        const By = Ay + r3 * Math.sin(theta3);

        // Ángulo de transmisión mu (entre acoplador y balancín)
        const cosMu = Math.max(-1, Math.min(1, (r3 * r3 + r4 * r4 - D2) / (2 * r3 * r4)));
        const mu = Math.acos(cosMu);

        // Punto del acoplador P (curva acopladora)
        const thetaP = theta3 + cp_angle;
        const Px = Ax + cp_length * Math.cos(thetaP);
        const Py = Ay + cp_length * Math.sin(thetaP);

        // Velocidad estimada del punto P
        const omega2 = 1.0;
        const vAx = -r2 * omega2 * Math.sin(theta2);
        const vAy = r2 * omega2 * Math.cos(theta2);

        // Clasificación de Grashof
        const lengths = [
            { id: 'ground', val: r1 },
            { id: 'crank', val: r2 },
            { id: 'coupler', val: r3 },
            { id: 'rocker', val: r4 }
        ].sort((a, b) => a.val - b.val);

        const s = lengths[0];
        const l = lengths[3];
        const p = lengths[1];
        const q = lengths[2];

        let grashof = "";
        if (s.val + l.val < p.val + q.val) {
            if (s.id === 'crank') grashof = "Manivela-Balancín (Crank-Rocker)";
            else if (s.id === 'ground') grashof = "Doble Manivela (Drag-Link)";
            else if (s.id === 'coupler') grashof = "Doble Balancín de Grashof";
            else grashof = "Balancín-Manivela";
        } else if (s.val + l.val === p.val + q.val) {
            grashof = "Punto de Cambio (Plegable)";
        } else {
            grashof = "No-Grashof (Doble Balancín)";
        }

        return {
            input: theta2,
            points: {
                O2,
                A: [Ax, Ay],
                B: [Bx, By],
                O4,
                P: [Px, Py]
            },
            vectors: {
                vA: [vAx, vAy]
            },
            metrics: {
                transmission_angle_deg: (mu * 180 / Math.PI),
                transmission_quality: (mu >= Math.PI / 4 && mu <= 3 * Math.PI / 4) ? "Óptimo (45°-135°)" : "Riesgo de bloqueo",
                grashof_type: grashof,
                coupler_angle_deg: (theta3 * 180 / Math.PI)
            }
        };
    }

    /**
     * Yugo Escocés (Scotch Yoke Mechanism)
     */
    static solveScotchYoke(params, theta) {
        const { crank: R } = params;
        const Ax = R * Math.cos(theta);
        const Ay = R * Math.sin(theta);

        // El yugo desliza horizontalmente
        const Yx = Ax;
        const Yy = 0;

        const vx = -R * Math.sin(theta);
        const ax = -R * Math.cos(theta);

        return {
            input: theta,
            points: {
                O: [0, 0],
                A: [Ax, Ay],
                YokeCenter: [Yx, Yy],
                YokeTop: [Yx, R * 1.5],
                YokeBottom: [Yx, -R * 1.5],
                SliderPin: [Ax, Ay]
            },
            vectors: {
                vYoke: [vx, 0]
            },
            metrics: {
                displacement: Yx,
                velocity: vx,
                acceleration: ax,
                harmonic_purity: "Movimiento Armónico Simple Puro (100%)"
            }
        };
    }

    /**
     * Cruz de Malta / Mecanismo de Ginebra (Geneva Drive)
     */
    static solveGeneva(params, theta) {
        const { n_slots: N = 4, center_distance: C = 0.1 } = params;
        const R2 = C * Math.sin(Math.PI / N); // Radio de la manivela conductora
        const R3 = C * Math.cos(Math.PI / N); // Radio exterior de la cruz
        const alpha = Math.PI / 2 - Math.PI / N; // Semi-ángulo de enganche

        // Normalizar theta a [-pi, pi]
        let thetaNorm = ((theta + Math.PI) % KinematicsEngine.TWO_PI) - Math.PI;

        const O2 = [0, 0];
        const O3 = [C, 0];

        // Pin conductor
        const PinX = R2 * Math.cos(thetaNorm);
        const PinY = R2 * Math.sin(thetaNorm);

        let engaged = Math.abs(thetaNorm) <= alpha;
        let beta = 0; // Ángulo de rotación de la cruz

        if (engaged) {
            // Relación cinemática exacta durante el engrane
            beta = Math.atan2(-PinY, C - PinX);
        } else {
            // Dwell (bloqueo por collarín de radio R2 * cos(pi/N))
            beta = Math.sign(thetaNorm) * (Math.PI / N);
        }

        return {
            input: theta,
            points: {
                O2,
                O3,
                Pin: [PinX, PinY]
            },
            metrics: {
                engaged: engaged ? "Fase activa (arrastre)" : "Fase de reposo (dwell)",
                driven_angle_deg: (beta * 180 / Math.PI),
                crank_radius: R2,
                wheel_radius: R3,
                dwell_ratio: `${(((KinematicsEngine.TWO_PI - 2 * alpha) / KinematicsEngine.TWO_PI) * 100).toFixed(1)}% reposo`
            }
        };
    }

    /**
     * Par de Engranajes Rectos (Spur Gears)
     */
    static solveGears(params, theta1) {
        const { n1 = 20, n2 = 40, module = 0.002, internal = false } = params;
        const r1 = (module * n1) / 2.0;
        const r2 = (module * n2) / 2.0;
        const C = internal ? (r2 - r1) : (r1 + r2);
        const ratio = internal ? (n1 / n2) : (-n1 / n2);
        const theta2 = theta1 * ratio;

        return {
            input: theta1,
            points: {
                O1: [0, 0],
                O2: [C, 0],
                PitchPoint: [r1, 0]
            },
            metrics: {
                gear_ratio: Math.abs(ratio).toFixed(3),
                driven_angle_deg: (theta2 * 180 / Math.PI),
                center_distance: C,
                pitch_r1: r1,
                pitch_r2: r2,
                type: internal ? "Engranaje Interno" : "Engranaje Externo"
            }
        };
    }

    /**
     * Tren Epicicloidal / Planetario (Planetary Gears)
     */
    static solvePlanetary(params, thetaSun) {
        const { n_sun = 20, n_planet = 20, n_ring = 60, module = 0.002 } = params;
        const rSun = (n_sun * module) / 2;
        const rPlanet = (n_planet * module) / 2;
        const rRing = (n_ring * module) / 2;
        const rCarrier = rSun + rPlanet;

        // Ecuación de Willis (corona fija: theta_ring = 0)
        const ratioCarrier = n_sun / (n_sun + n_ring);
        const thetaCarrier = thetaSun * ratioCarrier;

        // Rotación del satélite sobre su propio eje
        const thetaPlanetRel = - (n_sun / n_planet) * (thetaSun - thetaCarrier);
        const thetaPlanet = thetaCarrier + thetaPlanetRel;

        // Posición del centro del satélite
        const Px = rCarrier * Math.cos(thetaCarrier);
        const Py = rCarrier * Math.sin(thetaCarrier);

        return {
            input: thetaSun,
            points: {
                Center: [0, 0],
                CarrierPin: [Px, Py]
            },
            metrics: {
                ratio_carrier: ratioCarrier.toFixed(4),
                carrier_angle_deg: (thetaCarrier * 180 / Math.PI),
                planet_spin_deg: (thetaPlanet * 180 / Math.PI),
                reduction: `1 : ${(1 / ratioCarrier).toFixed(2)}`,
                sun_radius: rSun,
                planet_radius: rPlanet,
                ring_radius: rRing
            }
        };
    }

    /**
     * Inversor de Peaucellier-Lipkin (Línea Recta Exacta)
     */
    static solvePeaucellier(params, theta) {
        const { a = 0.1, b = 0.3, c = 0.1 } = params;
        if (b <= c) {
            throw new Error("El brazo largo 'b' debe ser estrictamente mayor que el lado del rombo 'c'.");
        }

        const O = [0, 0];
        const Oprime = [a, 0];

        // Manivela O'A que rota sobre O' con radio a
        const Ax = a + a * Math.cos(theta);
        const Ay = a * Math.sin(theta);

        // Distancia OA
        const distOA = Math.sqrt(Ax * Ax + Ay * Ay);
        if (distOA === 0 || distOA > 2 * a) {
            throw new Error("Punto singular en el origen.");
        }

        // Propiedad de inversión: OA * OP = b^2 - c^2 = k^2
        const k2 = b * b - c * c;
        const distOP = k2 / distOA;

        // Vector unitario en dirección OA
        const ux = Ax / distOA;
        const uy = Ay / distOA;

        // Punto P (traza una línea recta vertical exacta en x = k^2 / (2a))
        const Px = ux * distOP;
        const Py = uy * distOP;

        // Vértices laterales del rombo B y C
        // En el rombo O-B-P-C: el punto medio de AP está a distancia distOA + (distOP - distOA)/2 = (distOA + distOP)/2
        const midX = ux * (distOA + distOP) / 2;
        const midY = uy * (distOA + distOP) / 2;

        // Semidiagonal del rombo
        const halfDiagAP = (distOP - distOA) / 2;
        const halfDiagBC = Math.sqrt(Math.max(0, c * c - halfDiagAP * halfDiagAP));

        // Vector perpendicular (-uy, ux)
        const Bx = midX - uy * halfDiagBC;
        const By = midY + ux * halfDiagBC;
        const Cx = midX + uy * halfDiagBC;
        const Cy = midY - ux * halfDiagBC;

        return {
            input: theta,
            points: {
                O,
                Oprime,
                A: [Ax, Ay],
                B: [Bx, By],
                C: [Cx, Cy],
                P: [Px, Py]
            },
            metrics: {
                line_x: Px,
                theoretical_x: k2 / (2 * a),
                error_straightness: Math.abs(Px - k2 / (2 * a)),
                potency: k2
            }
        };
    }

    /**
     * Eslabonamiento de Línea Recta de Chebyshev (Aproximada)
     */
    static solveChebyshev(params, theta2) {
        const { a = 0.1 } = params;
        const r1 = 2 * a;   // Bancada
        const r2 = a;       // Manivela motriz
        const r3 = 2.5 * a; // Acoplador cruzado
        const r4 = 2.5 * a; // Balancín
        const cp = 1.25 * a; // Punto medio del acoplador

        const O2 = [0, 0];
        const O4 = [r1, 0];

        const Ax = r2 * Math.cos(theta2);
        const Ay = r2 * Math.sin(theta2);

        const Dx = r1 - Ax;
        const Dy = -Ay;
        const D2 = Dx * Dx + Dy * Dy;
        const D = Math.sqrt(D2);

        if (D > r3 + r4 || D < Math.abs(r3 - r4)) {
            throw new Error("Límite de carrera alcanzado en Chebyshev");
        }

        const cosAlpha = Math.max(-1, Math.min(1, (r3 * r3 + D2 - r4 * r4) / (2 * r3 * D)));
        const alpha = Math.acos(cosAlpha);
        const gamma = Math.atan2(Dy, Dx);

        // Configuración cruzada (assemblyMode = -1)
        const theta3 = gamma + alpha;

        const Bx = Ax + r3 * Math.cos(theta3);
        const By = Ay + r3 * Math.sin(theta3);

        const Px = Ax + cp * Math.cos(theta3);
        const Py = Ay + cp * Math.sin(theta3);

        return {
            input: theta2,
            points: {
                O2,
                A: [Ax, Ay],
                B: [Bx, By],
                O4,
                P: [Px, Py]
            },
            metrics: {
                vertical_pos: Py,
                straightness_plane_height: 1.5 * a,
                deviation: Math.abs(Py - 1.5 * a)
            }
        };
    }

    /**
     * Pantógrafo (Pantograph Linkage)
     */
    static solvePantograph(params, t) {
        const { L1 = 0.2, L2 = 0.4 } = params;
        const scaleFactor = (L1 + L2) / L1;

        // Trayectoria de entrada en forma de corazón / cicloidal o Lissajous
        const inputR = 0.08;
        const inX = inputR * (Math.cos(t) + 0.5 * Math.cos(2 * t));
        const inY = inputR * (Math.sin(t) - 0.5 * Math.sin(2 * t));

        // Punto de entrada D_in desplazado de un centro relativo
        const baseOffset = [0.25, 0.15];
        const Din = [baseOffset[0] + inX, baseOffset[1] + inY];

        // Polo fijo O en el origen
        const O = [0, 0];

        // Punto de salida escalado Cout = scaleFactor * Din
        const Cout = [Din[0] * scaleFactor, Din[1] * scaleFactor];

        // Articulaciones intermedias del paralelogramo A y B
        const A = [Din[0], Din[1]];
        const B = [Cout[0] * (L1 / (L1 + L2)), Cout[1] * (L1 / (L1 + L2))];
        const C = [A[0] + (B[0] - O[0]), A[1] + (B[1] - O[1])];

        return {
            input: t,
            points: {
                O,
                Din,
                Cout,
                A,
                B,
                C
            },
            metrics: {
                scale_ratio: `${scaleFactor.toFixed(2)} : 1`,
                input_pos: Din,
                output_pos: Cout
            }
        };
    }

    /**
     * Leva Radial con Seguidor de Rodillo (Cam Follower)
     */
    static solveCamFollower(params, theta) {
        const { base_radius: Rb = 0.1, lift: h = 0.05, roller_radius: Rr = 0.02 } = params;
        const thetaMod = ((theta % KinematicsEngine.TWO_PI) + KinematicsEngine.TWO_PI) % KinematicsEngine.TWO_PI;

        // Perfil armónico simple (SHM)
        let s = 0;
        let ds_dtheta = 0;
        if (thetaMod <= Math.PI) {
            // Elevación (Rise)
            s = (h / 2) * (1 - Math.cos(thetaMod));
            ds_dtheta = (h / 2) * Math.sin(thetaMod);
        } else {
            // Retorno (Fall)
            s = (h / 2) * (1 + Math.cos(thetaMod - Math.PI));
            ds_dtheta = -(h / 2) * Math.sin(thetaMod - Math.PI);
        }

        const centerDistance = Rb + Rr + s;
        const RollerCenter = [0, centerDistance];
        const ContactPoint = [0, centerDistance - Rr];

        // Ángulo de presión del seguidor
        const pressureAngle = Math.atan2(ds_dtheta, centerDistance);

        return {
            input: theta,
            points: {
                CamCenter: [0, 0],
                RollerCenter,
                ContactPoint
            },
            metrics: {
                lift_mm: (s * 1000).toFixed(2),
                pressure_angle_deg: (pressureAngle * 180 / Math.PI).toFixed(2),
                roller_height: centerDistance
            }
        };
    }

    /**
     * Trinquete y Uñeta (Ratchet & Pawl Mechanism)
     */
    static solveRatchet(params, theta) {
        const { teeth = 12, radius = 0.1 } = params;
        const toothAngle = KinematicsEngine.TWO_PI / teeth;

        // Manivela oscilante que mueve la palanca de avance
        const oscAngle = (Math.PI / 6) * Math.sin(theta);
        const leverPivot = [0, 0];
        const leverLength = radius * 1.3;
        const leverEnd = [leverLength * Math.sin(oscAngle), leverLength * Math.cos(oscAngle)];

        // Avance acumulativo paso a paso
        const steps = Math.floor(theta / KinematicsEngine.TWO_PI);
        const wheelAngle = steps * toothAngle + Math.max(0, oscAngle);

        return {
            input: theta,
            points: {
                WheelCenter: [0, 0],
                LeverPivot: [0, 0],
                LeverEnd: leverEnd,
                PawlPin: [leverEnd[0] + radius * 0.2 * Math.cos(oscAngle), leverEnd[1] - radius * 0.2 * Math.sin(oscAngle)]
            },
            metrics: {
                teeth_count: teeth,
                pitch_angle_deg: (toothAngle * 180 / Math.PI).toFixed(1),
                step_progress: `${(steps % teeth)} / ${teeth}`,
                direction: "Unidireccional antirretorno"
            }
        };
    }

    /**
     * Despachador universal
     */
    static solve(name, params, inputVal) {
        switch (name) {
            case 'slider_crank': return this.solveSliderCrank(params, inputVal);
            case 'four_bar': return this.solveFourBar(params, inputVal);
            case 'scotch_yoke': return this.solveScotchYoke(params, inputVal);
            case 'geneva': return this.solveGeneva(params, inputVal);
            case 'gears': return this.solveGears(params, inputVal);
            case 'planetary': return this.solvePlanetary(params, inputVal);
            case 'peaucellier': return this.solvePeaucellier(params, inputVal);
            case 'chebyshev': return this.solveChebyshev(params, inputVal);
            case 'pantograph': return this.solvePantograph(params, inputVal);
            case 'cam_follower': return this.solveCamFollower(params, inputVal);
            case 'ratchet': return this.solveRatchet(params, inputVal);
            default: throw new Error(`Mecanismo desconocido: ${name}`);
        }
    }

    /**
     * Genera una trayectoria completa muestreada
     */
    static generateTrajectory(name, params, steps = 120) {
        const path = [];
        const stepSize = KinematicsEngine.TWO_PI / steps;
        for (let i = 0; i < steps; i++) {
            const theta = i * stepSize;
            try {
                const state = this.solve(name, params, theta);
                path.push(state);
            } catch (err) {
                // Punto fuera de dominio de ensamblaje
                continue;
            }
        }
        return path;
    }
}
