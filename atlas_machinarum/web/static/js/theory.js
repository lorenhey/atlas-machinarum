/**
 * ATLAS MACHINARUM - Tratado Teórico y Catálogo Historiográfico
 * Documentación de ingeniería, ecuaciones en LaTeX y aplicaciones industriales.
 * Autor: Loren
 */

export const MECHANISM_CATALOG = {
    "slider_crank": {
        id: "slider_crank",
        name: "Biela-Manivela",
        subtitle: "Conversión de rotación continua en traslación rectilínea alternativa",
        family: "Eslabonamientos Planos (Linkages)",
        dof: 1,
        input_type: "continuous_rotation",
        output_type: "oscillating_linear",
        params: {
            crank: { label: "Radio de Manivela (R)", val: 0.05, min: 0.01, max: 0.15, step: 0.005, unit: "m" },
            rod: { label: "Longitud de Biela (L)", val: 0.20, min: 0.05, max: 0.40, step: 0.01, unit: "m" },
            offset: { label: "Descentrado (E)", val: 0.0, min: -0.05, max: 0.05, step: 0.005, unit: "m" }
        },
        equation: `x_B(\\theta) = R\\cos\\theta + \\sqrt{L^2 - (E - R\\sin\\theta)^2}`,
        velocity_eq: `\\dot{x}_B(\\theta) = -R\\omega \\left( \\sin\\theta + \\frac{R\\sin(2\\theta)}{2\\sqrt{L^2 - R^2\\sin^2\\theta}} \\right)`,
        description: `El mecanismo de biela-manivela es el elemento cinemático primordial de la Revolución Industrial y la base de los motores de combustión interna, compresores de pistón y prensas mecánicas. 
Convierte el movimiento circular uniforme de la manivela en un vaivén lineal no armónico del pistón. Debido a la longitud finita de la biela $L$, la aceleración no es senoidal pura: presenta armónicos superiores (fuerzas de inercia de segundo orden) que exigen contrapesos dinámicos en cigüeñales de ingeniería automotriz.`,
        historical_context: `Aparece por primera vez documentado formalmente en el aserradero hidráulico de Hierápolis (siglo III d.C.) y fue perfeccionado sistemáticamente por Al-Jazari (1206) y Francesco di Giorgio Martini (siglo XV), antes de convertirse en el corazón motriz de las máquinas de vapor de Watt y los motores Otto y Diésel.`,
        industrial_uses: [
            "Motores de combustión interna alternativos (ciclo Otto y Diésel).",
            "Compresores de aire y bombas de émbolo recíproco.",
            "Prensas mecánicas de estampado y forja en caliente.",
            "Máquinas de coser industriales y telares automáticos."
        ]
    },

    "four_bar": {
        id: "four_bar",
        name: "Cuatro Barras",
        subtitle: "El eslabonamiento articulado cerrado más elemental y versátil",
        family: "Eslabonamientos Planos (Linkages)",
        dof: 1,
        input_type: "continuous_rotation",
        output_type: "oscillating_rotation",
        params: {
            ground: { label: "Bancada / Fijo (r1)", val: 0.20, min: 0.05, max: 0.40, step: 0.01, unit: "m" },
            crank: { label: "Manivela / Entrada (r2)", val: 0.05, min: 0.01, max: 0.20, step: 0.005, unit: "m" },
            coupler: { label: "Acoplador / Biela (r3)", val: 0.15, min: 0.05, max: 0.35, step: 0.01, unit: "m" },
            rocker: { label: "Balancín / Salida (r4)", val: 0.15, min: 0.05, max: 0.35, step: 0.01, unit: "m" },
            cp_length: { label: "Distancia al Punto P", val: 0.10, min: 0.0, max: 0.30, step: 0.01, unit: "m" },
            cp_angle: { label: "Ángulo de Desfase P", val: 0.5, min: -3.14, max: 3.14, step: 0.1, unit: "rad" }
        },
        equation: `\\mathbf{r}_1 + \\mathbf{r}_4 = \\mathbf{r}_2 + \\mathbf{r}_3 \\quad \\implies \\quad r_1 + r_4 e^{i\\theta_4} = r_2 e^{i\\theta_2} + r_3 e^{i\\theta_3}`,
        velocity_eq: `\\cos\\mu = \\frac{r_3^2 + r_4^2 - D^2}{2 r_3 r_4}, \\quad D = \\| \\mathbf{r}_1 - \\mathbf{r}_2 \\|`,
        description: `El eslabonamiento de cuatro barras articulado (4R) posee un único grado de libertad según el criterio de Grübler-Kutzbach ($M = 3(4 - 1) - 2(4) = 1$). 
La ley de Grashof determina si algún eslabón puede girar de manera continua: si la suma del eslabón más corto y el más largo es menor o igual a la suma de los otros dos ($s + l \\le p + q$), existe al menos un eslabón de rotación continua. 
El ángulo de transmisión $\\mu$ entre el acoplador y el balancín mide la eficiencia mecánica en la transmisión de fuerza; los valores óptimos se sitúan entre $45^\\circ$ y $135^\\circ$.`,
        historical_context: `Analizado sistemáticamente por Ferdinand Freudenstein en 1955 mediante su célebre ecuación de síntesis analítica, este mecanismo fue la piedra fundamental sobre la que Franz Reuleaux erigió la cinemática moderna en 1876.`,
        industrial_uses: [
            "Sistemas de suspensión automotriz independiente (doble horquilla / McPherson).",
            "Mecanismos de bombeo petrolero (aparato de bombeo de balancín).",
            "Limpiaparabrisas automotrices y pantógrafos de trenes de alta velocidad.",
            "Palas cargadoras, retroexcavadoras y prensas articuladas."
        ]
    },

    "scotch_yoke": {
        id: "scotch_yoke",
        name: "Yugo Escocés",
        subtitle: "Generador de movimiento armónico simple puro sin armónicos parásitos",
        family: "Mecanismos de Corredera y Ranura",
        dof: 1,
        input_type: "continuous_rotation",
        output_type: "oscillating_linear",
        params: {
            crank: { label: "Radio de Manivela (R)", val: 0.05, min: 0.01, max: 0.15, step: 0.005, unit: "m" }
        },
        equation: `x(t) = R\\cos(\\omega t), \\quad v(t) = -R\\omega\\sin(\\omega t), \\quad a(t) = -R\\omega^2\\cos(\\omega t)`,
        velocity_eq: `\\text{Distorsión armónica THD} = 0\\% \\quad (\\text{Espectro senoidal puro})`,
        description: `A diferencia de la biela-manivela tradicional, donde la obliquidad de la biela introduce infinitos armónicos pares en la aceleración, el yugo escocés traslada la proyección ortogonal exacta del perno giratorio. 
El desplazamiento, la velocidad y la aceleración son funciones senoidales rigurosas de frecuencia fundamental única. Esto elimina las vibraciones de segundo orden y permite una desaceleración suave en los extremos de carrera, a costa de una mayor presión de contacto superficial en la ranura deslizante.`,
        historical_context: `Ampliamente empleado en bombas de vapor de acción directa en Escocia e Inglaterra durante el siglo XIX, se convirtió en el mecanismo preferido para actuadores neumáticos de válvulas de alta precisión y probadores de fatiga senoidal.`,
        industrial_uses: [
            "Actuadores neumáticos e hidráulicos para válvulas esféricas de cuartos de vuelta.",
            "Máquinas de ensayo de fatiga y calibración de acelerómetros.",
            "Compresores de refrigeración herméticos compactos.",
            "Sierras de vaivén de alta frecuencia y corte suave."
        ]
    },

    "geneva": {
        id: "geneva",
        name: "Cruz de Malta (Geneva Drive)",
        subtitle: "Conversión de rotación continua en indexación angular intermitente",
        family: "Mecanismos Intermitentes",
        dof: 1,
        input_type: "continuous_rotation",
        output_type: "intermittent_rotation",
        params: {
            n_slots: { label: "Número de Ranuras (N)", val: 4, min: 3, max: 8, step: 1, unit: "ranuras" },
            center_distance: { label: "Distancia entre Ejes (C)", val: 0.10, min: 0.05, max: 0.25, step: 0.01, unit: "m" }
        },
        equation: `R_2 = C \\sin\\left(\\frac{\\pi}{N}\\right), \\quad R_3 = C \\cos\\left(\\frac{\\pi}{N}\\right)`,
        velocity_eq: `\\tan\\beta(\\theta_2) = \\frac{-R_2\\sin\\theta_2}{C - R_2\\cos\\theta_2} \\quad \\text{para } |\\theta_2| \\le \\frac{\\pi}{2} - \\frac{\\pi}{N}`,
        description: `La cruz de Malta o mecanismo de Ginebra produce un giro intermitente preciso con un período de bloqueo mecánico (*dwell*) absoluto.
El perno de la rueda conductora ingresa a la ranura radial en dirección exactamente tangente a la misma, lo que garantiza que la aceleración angular de arranque sea cero y el impacto inicial quede minimizado. Durante la fase inactiva, un collarín circular concéntrico calza en el arco de la cruz, impidiendo cualquier giro accidental.`,
        historical_context: `Desarrollado originalmente por los relojeros suizos de Ginebra (siglo XVII) para prevenir el sobrebobinado de resortes reales, alcanzó su gloria mundial al resolver el arrastre intermitente cuadro a cuadro de la película cinematográfica de 35 mm en proyectores (24 cuadros por segundo con tiempo de exposición quieto).`,
        industrial_uses: [
            "Mesas de indexado rotativas en líneas de montaje y mecanizado transfer.",
            "Proyectores cinematográficos clásicos de 35 mm y 70 mm.",
            "Llenadoras, etiquetadoras y dosificadoras en envasado farmacéutico.",
            "Cambiadores automáticos de herramientas (ATC) en centros de mecanizado CNC."
        ]
    },

    "gears": {
        id: "gears",
        name: "Par de Engranajes Rectos",
        subtitle: "Transmisión de par y velocidad angular con relación cinemática rigurosamente constante",
        family: "Transmisiones Dentadas",
        dof: 1,
        input_type: "continuous_rotation",
        output_type: "continuous_rotation",
        params: {
            n1: { label: "Dientes Conductor (n1)", val: 20, min: 10, max: 60, step: 1, unit: "dientes" },
            n2: { label: "Dientes Conducido (n2)", val: 40, min: 10, max: 80, step: 1, unit: "dientes" },
            module: { label: "Módulo Normalizado (m)", val: 0.002, min: 0.001, max: 0.005, step: 0.0005, unit: "m" }
        },
        equation: `d_1 = m \\cdot n_1, \\quad d_2 = m \\cdot n_2, \\quad a = \\frac{d_1 + d_2}{2}`,
        velocity_eq: `i = \\frac{\\omega_1}{\\omega_2} = -\\frac{n_2}{n_1} = -\\frac{r_2}{r_1}`,
        description: `El par de engranajes rectos cilíndricos satisface la ley fundamental del engrane: la normal común en el punto de contacto entre dos perfiles dentados pasa invariablemente por el punto primitivo fijo $P$, manteniendo la relación de velocidades angulares $i$ exactamente constante y libre de fluctuaciones instantáneas.
Los perfiles de evolvente de círculo (involuta) poseen la propiedad geométrica insuperable de tolerar pequeñas variaciones en la distancia entre centros sin alterar la relación de transmisión ni la suavidad cinemática.`,
        historical_context: `Conceptualizados en sus principios matemáticos por Leonhard Euler en 1762 y formalizados por Robert Willis, sustituyeron a las primitivas ruedas dentadas de clavijas de madera de los molinos medievales.`,
        industrial_uses: [
            "Cajas reductoras de velocidad en maquinaria pesada y minería.",
            "Transmisiones mecánicas de tornos paralelos y fresadoras universales.",
            "Bombas hidráulicas de engranajes para circuitos oleohidráulicos.",
            "Mecanismos de sincronización de árboles de levas."
        ]
    },

    "planetary": {
        id: "planetary",
        name: "Tren Epicicloidal / Planetario",
        subtitle: "Densidad de par y reducciones colosales en configuración coaxial",
        family: "Transmisiones Dentadas",
        dof: 1,
        input_type: "continuous_rotation",
        output_type: "continuous_rotation",
        params: {
            n_sun: { label: "Dientes Sol (Z_s)", val: 20, min: 12, max: 40, step: 2, unit: "dientes" },
            n_planet: { label: "Dientes Satélite (Z_p)", val: 20, min: 10, max: 30, step: 1, unit: "dientes" },
            n_ring: { label: "Dientes Corona (Z_r = Z_s + 2Z_p)", val: 60, min: 36, max: 100, step: 2, unit: "dientes" },
            module: { label: "Módulo (m)", val: 0.002, min: 0.001, max: 0.005, step: 0.0005, unit: "m" }
        },
        equation: `Z_r = Z_s + 2 Z_p \\quad \\text{(Condición geométrica de cierre de malla)}`,
        velocity_eq: `\\frac{\\omega_s - \\omega_c}{\\omega_r - \\omega_c} = -\\frac{Z_r}{Z_s} \\quad \\implies \\quad i = \\frac{\\omega_s}{\\omega_c} = 1 + \\frac{Z_r}{Z_s} \\quad (\\text{con } \\omega_r = 0)`,
        description: `Los engranajes planetarios o epicicloidales distribuyen la carga de torsión entre múltiples satélites simultáneos dispuestos simétricamente, logrando una densidad de potencia inigualable en un volumen cilíndrico coaxial compacto.
La ecuación fundamental de Willis gobierna las relaciones cinemáticas relativas al portasatélites móvil. Fijando la corona exterior, se obtiene una alta reducción en el mismo sentido de giro; fijando el sol o el portasatélites se logran multiplicaciones o inversiones de marcha instantáneas.`,
        historical_context: `Descubierto en el mecanismo helenístico de Anticitera (~150 a.C.) para modelar la anomalía lunar, fue reinventado por James Watt en su mecanismo 'sol y planeta' para eludir la patente del cigüeñal de Pickard en 1781.`,
        industrial_uses: [
            "Transmisiones automáticas vehiculares y trenes híbridos tipo e-CVT (Toyota Prius).",
            "Cajas reductoras de turbinas eólicas y reductores de propulsión de buques.",
            "Articulaciones de brazos robóticos industriales (reductores cicloidales y armónicos).",
            "Mandos finales de tracción sobre orugas en excavadoras de minería."
        ]
    },

    "peaucellier": {
        id: "peaucellier",
        name: "Inversor de Peaucellier-Lipkin",
        subtitle: "La primera solución matemática rigurosa para trazar una línea recta exacta",
        family: "Mecanismos de Línea Recta (Straight-Line Linkages)",
        dof: 1,
        input_type: "oscillating_rotation",
        output_type: "oscillating_linear",
        params: {
            a: { label: "Manivela y Base (a)", val: 0.10, min: 0.05, max: 0.20, step: 0.01, unit: "m" },
            b: { label: "Brazos Largos (b)", val: 0.30, min: 0.15, max: 0.45, step: 0.01, unit: "m" },
            c: { label: "Rombo Articulado (c)", val: 0.10, min: 0.05, max: 0.20, step: 0.01, unit: "m" }
        },
        equation: `\\| \\mathbf{P} - \\mathbf{O} \\| \\cdot \\| \\mathbf{A} - \\mathbf{O} \\| = b^2 - c^2 = k^2 \\quad (\\text{Inversión Geométrica})`,
        velocity_eq: `x_P = \\frac{b^2 - c^2}{2a} = \\text{Constante} \\quad (\\forall \\theta)`,
        description: `Durante casi un siglo, los mayores matemáticos e ingenieros del mundo (incluido James Watt) creyeron que era imposible transformar rotación en línea recta exacta utilizando únicamente pares de revolución (juntas de pasador sin correderas deslizantes).
En 1864, el oficial de artillería francés Charles Peaucellier demostró que mediante un rombo articulado de lados $c$ acoplado a dos brazos largos de longitud $b$ anclados a un polo $O$, se obtiene una transformación de inversión en el plano: el producto de distancias $OA \\cdot OP = b^2 - c^2 = \\text{cte}$. 
Al obligar al punto $A$ a describir un círculo que pasa por el polo $O$ (mediante una manivela de radio $a$ con centro a distancia $a$), la inversa de un círculo que pasa por el polo es **una línea recta matemáticamente rigurosa**.`,
        historical_context: `Presentado en 1864 y redescubierto de forma independiente por el estudiante ruso Yom Tov Lipman Lipkin en 1870. Cuando Lord Kelvin conoció el modelo físico, exclamó que era 'la cosa más hermosa que jamás había visto en su vida'.`,
        industrial_uses: [
            "Guías lineales de máquinas herramientas sin fricción de corredera.",
            "Mecanismos de émbolo de alta presión para motores y bombas libres de desgaste lateral.",
            "Aparatos de dibujo de planos de precisión y pantógrafos de inversión.",
            "Instrumentos de metrología dimensional y bancadas ópticas."
        ]
    },

    "chebyshev": {
        id: "chebyshev",
        name: "Línea Recta de Chebyshev",
        subtitle: "Aproximación cinemática óptima con error minimax uniforme",
        family: "Mecanismos de Línea Recta (Straight-Line Linkages)",
        dof: 1,
        input_type: "continuous_rotation",
        output_type: "continuous_linear",
        params: {
            a: { label: "Factor de Escala (a)", val: 0.10, min: 0.04, max: 0.25, step: 0.01, unit: "m" }
        },
        equation: `r_1 = 2a, \\quad r_2 = a, \\quad r_3 = 2.5a, \\quad r_4 = 2.5a, \\quad cp = 1.25a`,
        velocity_eq: `\\max |y(x) - y_0| \\le 0.0008 a \\quad \\text{en el tramo central}`,
        description: `El matemático ruso Pafnuty Chebyshev diseñó este eslabonamiento de cuatro barras cruzado para aproximar una traslación horizontal recta con una desviación prácticamente imperceptible.
Las proporciones canónicas $(2a : a : 2.5a : 2.5a)$ sitúan el punto trazador exactamente en el centro del acoplador. Durante la carrera media, la trayectoria describe una recta casi matemáticamente perfecta, minimizando el error máximo absoluto conforme a la teoría de aproximación minimax que inmortalizó los polinomios de Chebyshev.`,
        historical_context: `Desarrollado hacia 1850 como alternativa de bajísima fricción al paralelogramo de Watt en locomotoras de vapor rusas. Chebyshev construyó decenas de modelos cinemáticos de madera y latón que se conservan en el Museo Politécnico de Moscú.`,
        industrial_uses: [
            "Mecanismos de marcha para robots caminantes de extremidades articuladas ('Chebyshev Walking Machine').",
            "Guías de suspensión trasera automotriz independientes.",
            "Mesas elevadoras y plataformas de transporte de paneles solares.",
            "Manipuladores mecánicos de posicionamiento horizontal."
        ]
    },

    "pantograph": {
        id: "pantograph",
        name: "Pantógrafo Articulado",
        subtitle: "Escalado, reproducción y mapeo homotético de curvas continuas",
        family: "Mecanismos de Copia y Escalado",
        dof: 2,
        input_type: "complex_path",
        output_type: "complex_path",
        params: {
            L1: { label: "Longitud Brazo Corto (L1)", val: 0.20, min: 0.10, max: 0.40, step: 0.02, unit: "m" },
            L2: { label: "Longitud Extensión (L2)", val: 0.40, min: 0.15, max: 0.60, step: 0.02, unit: "m" }
        },
        equation: `\\mathbf{r}_{out} = k \\cdot \\mathbf{r}_{in}, \\quad k = \\frac{L_1 + L_2}{L_1} > 1`,
        velocity_eq: `\\mathbf{v}_{out} = k \\cdot \\mathbf{v}_{in}, \\quad \\mathbf{a}_{out} = k \\cdot \\mathbf{a}_{in}`,
        description: `El pantógrafo es un mecanismo de paralelogramo articulado fundado en el principio geométrico de la homotecia. 
Al fijar un polo central $O$, cualquier trayectoria bidimensional descrita por el punto trazador de entrada $D_{in}$ es replicada exactamente en el punto de salida $C_{out}$, escalada por el factor geométrico constante $k = (L_1 + L_2) / L_1$, preservando rigurosamente todos los ángulos, proporciones y similitud formal.`,
        historical_context: `Inventado por el astrónomo jesuita Christoph Scheiner en 1603 para duplicar dibujos y esquemas a diferente escala, fue el instrumento supremo de cartógrafos, arquitectos y grabadores durante tres siglos antes de la fotocopia y el diseño asistido por computadora (CAD).`,
        industrial_uses: [
            "Máquinas grabadoras de pantógrafo para troqueles, punzones y tipografía de precisión.",
            "Pantógrafos ferroviarios colectores de corriente eléctrica en catenarias de trenes.",
            "Brazos articulados de lámparas de quirófano y microscopios quirúrgicos.",
            "Mecanismos de copiado de esculturas y fresadoras mecánicas manuales."
        ]
    },

    "cam_follower": {
        id: "cam_follower",
        name: "Leva Radial con Seguidor",
        subtitle: "Síntesis directa de cualquier ley cinemática arbitraria de elevación y reposo",
        family: "Mecanismos de Contacto Superior (Higher Pairs)",
        dof: 1,
        input_type: "continuous_rotation",
        output_type: "oscillating_linear",
        params: {
            base_radius: { label: "Radio Base de Leva (Rb)", val: 0.10, min: 0.05, max: 0.20, step: 0.01, unit: "m" },
            lift: { label: "Alzada Máxima (h)", val: 0.05, min: 0.01, max: 0.10, step: 0.005, unit: "m" },
            roller_radius: { label: "Radio del Rodillo (Rr)", val: 0.02, min: 0.01, max: 0.05, step: 0.005, unit: "m" }
        },
        equation: `r(\\theta) = R_b + R_r + s(\\theta), \\quad s(\\theta) = \\frac{h}{2}\\left(1 - \\cos\\theta\\right) \\quad (\\text{Perfil Armónico Simple})`,
        velocity_eq: `\\tan\\phi = \\frac{1}{r} \\frac{dr}{d\\theta} \\quad (\\phi = \\text{Ángulo de Presión} \\le 30^\\circ)`,
        description: `Las levas son el mecanismo de mayor flexibilidad cinemática: permiten programar prácticamente cualquier función de posición $s(\\theta)$, incluyendo pausas prolongadas (*dwells*), rampas de aceleración cicloidales o polinómicas (polinomios 4-5-6-7) diseñadas para anular el tirón (*jerk*, derivada de la aceleración) y prevenir el despegue del seguidor.
El ángulo de presión $\\phi$ entre la normal a la superficie de la leva y la dirección del movimiento del seguidor debe mantenerse estrictamente por debajo de $30^\\circ$ para evitar el atascamiento por flexión en los bujes.`,
        historical_context: `Empleadas empíricamente en martinetes medievales y órganos mecánicos autómatas, su diseño científico moderno nació con los estudios cinemáticos de cam-design para los árboles de levas de motores aeronáuticos a principios del siglo XX.`,
        industrial_uses: [
            "Árboles de levas de distribución de válvulas de admisión y escape en motores.",
            "Tornos automáticos mecánicos monohusillo (tornos tipo suizo / Index).",
            "Máquinas tejedoras Jacquard y trenzadoras de alambre de alta cadencia.",
            "Bombas mecánicas de inyección de combustible Diésel common-rail."
        ]
    },

    "ratchet": {
        id: "ratchet",
        name: "Trinquete y Uñeta",
        subtitle: "Avance discreto paso a paso con bloqueo mecánico unidireccional irrecuperable",
        family: "Mecanismos Intermitentes y de Retención",
        dof: 1,
        input_type: "oscillating_rotation",
        output_type: "intermittent_rotation",
        params: {
            teeth: { label: "Cantidad de Dientes (Z)", val: 12, min: 6, max: 36, step: 1, unit: "dientes" },
            radius: { label: "Radio Exterior (R)", val: 0.10, min: 0.05, max: 0.25, step: 0.01, unit: "m" }
        },
        equation: `\\Delta\\theta = \\frac{2\\pi}{Z} = \\frac{360^\\circ}{Z} \\quad (\\text{Paso angular mínimo discretizado})`,
        velocity_eq: `\\theta_{k+1} = \\theta_k + \\Delta\\theta \\quad (\\text{Avance monótono irreversible})`,
        description: `El mecanismo de trinquete consta de una rueda con dientes asimétricos inclinados (diente de sierra) y una o más uñetas articuladas cargadas por resorte o gravedad.
Cuando la palanca motriz oscila en sentido directo, la uñeta empuja el flanco recto del diente, induciendo un giro discreto proporcional al número de dientes. En el retroceso, la uñeta resbala sobre la rampa oblicua sin transmitir movimiento, mientras una segunda uñeta fija de retención impide el retorno por carga antagónica.`,
        historical_context: `Utilizado desde la antigüedad clásica en cabrestantes marítimos para anclas y gatos de elevación, fue fundamental para el desarrollo del escape de áncora en la relojería mecánica de precisión del siglo XVII.`,
        industrial_uses: [
            "Llaves de tubo crique (cricket) y herramientas de apriete dinamométrico.",
            "Cabrestantes, malacates y guinches de izaje de seguridad portuaria.",
            "Frenos de estacionamiento automotriz (palanca de freno de mano).",
            "Mecanismos de alimentación paso a paso de cintas transportadoras e impresoras térmicas."
        ]
    }
};

export const MOTION_TRANSFORM_MATRIX = [
    {
        input: "Rotación Continua",
        output: "Traslación Alternativa",
        mechanisms: ["slider_crank", "scotch_yoke", "cam_follower"],
        note: "La biela-manivela produce armónicos secundarios; el yugo escocés entrega armónico simple puro; la leva permite curvas personalizadas con dwell."
    },
    {
        input: "Rotación Continua",
        output: "Rotación Oscilante",
        mechanisms: ["four_bar"],
        note: "La configuración manivela-balancín (Grashof tipo 1) convierte rotación continua completa en oscilación angular de amplitud definida."
    },
    {
        input: "Rotación Continua",
        output: "Rotación Intermitente",
        mechanisms: ["geneva", "ratchet"],
        note: "La cruz de Malta indexa con bloqueo cinemático suave; el trinquete avanza paso a paso de manera unidireccional."
    },
    {
        input: "Rotación Continua",
        output: "Rotación Continua (Distinta Relación)",
        mechanisms: ["gears", "planetary"],
        note: "Los engranajes rectos invierten el sentido de giro con relación fija; los epicicloidales entregan reducciones colosales coaxiales."
    },
    {
        input: "Rotación Continua / Oscilante",
        output: "Traslación Rectilínea Pura",
        mechanisms: ["peaucellier", "chebyshev"],
        note: "Peaucellier produce una línea recta matemática rigurosa; Chebyshev proporciona una aproximación minimax óptima."
    },
    {
        input: "Trayectoria 2D Arbitraria",
        output: "Trayectoria Homotética Escalada",
        mechanisms: ["pantograph"],
        note: "Multiplica o reduce cualquier curva conservando la similitud geométrica absoluta."
    }
];
