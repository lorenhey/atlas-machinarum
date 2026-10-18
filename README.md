# ATLAS MACHINARUM

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Demo-38bdf8?style=for-the-badge&logo=github)](https://lorenhey.github.io/atlas-machinarum/)
[![Python](https://img.shields.io/badge/Python-3.9%2B-blue?style=for-the-badge&logo=python)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/Licencia-MIT-green?style=for-the-badge)](LICENSE)

> *"Un mecanismo es una forma bastante elaborada de persuadir a un movimiento para que se convierta en otro."*

**Atlas Machinarum** es un atlas computacional de mecanismos planos, eslabonamientos cinemáticos, levas y transmisiones dentadas. No es una galería de animaciones pre-renderizadas: es una biblioteca analítica, paramétrica y matemáticamente rigurosa para definir, simular, diagnosticar y sintetizar cadenas cinemáticas en tiempo real.

Accedé a la aplicación interactiva en vivo: **[lorenhey.github.io/atlas-machinarum](https://lorenhey.github.io/atlas-machinarum/)**

---

## 1. Filosofía y Enfoque

El proyecto aborda dos interrogantes cardinales de la ingeniería mecánica:
1. **Problema Directo**: Dado un mecanismo con una geometría y restricciones determinadas, ¿cuál es exactamente el movimiento, trayectoria, velocidad y aceleración que produce?
2. **Problema Inverso (Síntesis)**: Dado un requerimiento cinemático deseado (por ejemplo, transformar rotación continua en indexado intermitente o traslación rectilínea pura), ¿qué familias de mecanismos son capaces de generarlo y cuáles son sus márgenes de transmisión?

Atlas Machinarum separa el **solucionador matemático analítico** de la **definición del mecanismo**, implementando soluciones vectoriales cerradas (ecuaciones de lazo en el plano complejo, método de Freudenstein, criterio de Grashof, inversión geométrica de Peaucellier y relaciones de Willis para trenes epicicloidales).

---

## 2. Catálogo de Mecanismos Implementados

| Mecanismo | Familia Cinemática | GDL | Entrada | Salida | Ecuación / Principio Fundamental |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **Biela-Manivela** | Eslabonamientos Planos | 1 | Rotación continua | Traslación alternativa | $x_B = R\cos\theta + \sqrt{L^2 - (E - R\sin\theta)^2}$ |
| **Cuatro Barras (4R)** | Eslabonamientos Planos | 1 | Rotación continua | Rotación oscilante | Teorema de Grashof ($s+l \le p+q$), Lazo vectorial |
| **Yugo Escocés** | Corredera y Ranura | 1 | Rotación continua | Traslación alternativa | Movimiento armónico simple puro ($0\%$ distorsión) |
| **Cruz de Malta (Geneva)** | Mecanismos Intermitentes | 1 | Rotación continua | Rotación intermitente | Entrada tangencial ortogonal ($\alpha = \frac{\pi}{2} - \frac{\pi}{N}$) y dwell |
| **Par de Engranajes** | Transmisiones Dentadas | 1 | Rotación continua | Rotación continua | Ley fundamental del engrane, relación $i = -n_1/n_2$ |
| **Tren Epicicloidal** | Transmisiones Dentadas | 1 | Rotación continua | Rotación continua | Ecuación de Willis: $\frac{\omega_s - \omega_c}{\omega_r - \omega_c} = -\frac{Z_r}{Z_s}$ |
| **Inversor Peaucellier** | Línea Recta Exacta | 1 | Rotación oscilante | Traslación rectilínea | Inversión circular: $OA \cdot OP = b^2 - c^2 = \text{cte}$ |
| **Chebyshev** | Línea Recta Aproximada | 1 | Rotación continua | Traslación continua | Eslabones $2a : a : 2.5a : 2.5a$, error minimax |
| **Pantógrafo** | Copia y Escalado | 2 | Trayectoria 2D | Trayectoria escalada | Homotecia geométrica: $k = (L_1 + L_2) / L_1$ |
| **Leva con Seguidor** | Contacto Superior | 1 | Rotación continua | Traslación alternativa | Perfil armónico simple, control de ángulo de presión $\phi$ |
| **Trinquete y Uñeta** | Intermitente / Retención | 1 | Rotación oscilante | Rotación discreta | Avance angular discretizado $\Delta\theta = 2\pi / Z$ con antirretorno |

---

## 3. Características de la Plataforma Web (GitHub Pages)

- **Motor Cinemático Nativamente en Cliente (JavaScript ES6)**: Ejecución analítica a 60 FPS sin necesidad de servidores o backend Python.
- **Renderizador CAD de Alta Precisión**:
  - Cuadrícula milimétrica con zoom y paneo continuo interactivo (rueda de mouse y arrastre).
  - Trazado de trayectorias (curvas acopladoras) con gradiente temporal.
  - Vectores de velocidad tangencial en tiempo real.
  - Identificación visual de bancadas fijas ($\unicode{x25BD}$) y pares de revolución.
- **Sliders Paramétricos Reactivos**: Modificación en vivo de longitudes, excentricidades, radios y número de dientes con recomputación instantánea.
- **Modo Comparación (Overlay)**: Congelamiento de una curva testigo para contrastar el efecto de variaciones geométricas sobre la trayectoria y el ángulo de transmisión.
- **Tratado Teórico con KaTeX**: Ecuaciones cinemáticas completas, deducción analítica y contexto historiográfico.
- **Matriz de Síntesis**: Navegación interactiva por tipo de transformación cinemática.
- **Exportación de Datos**:
  - Trayectoria tabular en CSV para análisis numérico externo.
  - Esquema vectorial en SVG para CAD/Inkscape.

---

## 4. Uso de la Biblioteca en Python

### Instalación local

```bash
git clone https://github.com/lorenhey/atlas-machinarum.git
cd atlas-machinarum
pip install -e .
```

### Ejemplo de uso en scripts

```python
import numpy as np
from atlas_machinarum.library import FourBar

# Instanciar cuadrilátero articulado:
# bancada=0.20 m, manivela=0.05 m, acoplador=0.15 m, balancín=0.15 m
fb = FourBar(ground=0.20, crank=0.05, coupler=0.15, rocker=0.15, cp_length=0.10, cp_angle=0.5)

# Clasificación según el Teorema de Grashof
print("Tipo cinemático:", fb.grashof_condition())
# Salida: CRANK_ROCKER

# Resolver estado cinemático para un ángulo de entrada theta2 = pi/4 (45°)
state = fb.solve(theta2=np.pi / 4)

print("Coordenadas articulación A (manivela):", state.points["A"])
print("Coordenadas articulación B (balancín):", state.points["B"])
print("Coordenadas punto acoplador P:", state.points["P"])
print("Ángulo de transmisión (rad):", state.metrics["transmission_angle"])
```

### Interfaz por Línea de Comandos (CLI)

```bash
# Listar los mecanismos disponibles
atlas-machinarum list

# Iniciar el servidor web local interactivo
atlas-machinarum serve --port 8000
```

### Ejecución de Pruebas

```bash
pytest
```

---

## 5. Licencia

Distribuido bajo licencia MIT. Ver archivo [LICENSE](LICENSE) para más información.
