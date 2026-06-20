# 06 — Planeación de Sprints (trabajo en solitario)

> **Propósito:** convertir el roadmap de fases en sprints ejecutables por *una sola persona* que además está aprendiendo. La planeación solo-dev es distinta de la de un equipo: no hay daily, no hay reparto de tareas, y el mayor riesgo no es la coordinación sino **perder el rumbo y caer en el infierno de tutoriales**.

---

## 1. Principios de Scrum/Agile adaptados a una persona

El Scrum de libro asume equipo. Aquí lo adaptamos honestamente:

| Ceremonia de equipo | Versión solo-dev |
|---|---|
| Sprint planning | 30 min al inicio del sprint: eliges qué features atacas y defines su "hecho". |
| Daily standup | Reemplázalo por un **log diario de 3 líneas**: qué hice, qué sigue, dónde me trabé. |
| Sprint review | Al cerrar el sprint, verificas criterios de aceptación. ¿Pasa? Hecho. ¿No? Vuelve al backlog. |
| Retrospectiva | 15 min: ¿qué me costó más de lo esperado? ¿qué subestimé? Ajustas el siguiente sprint. |
| Estimación en story points | Usa puntos *relativos*, no horas. Como aprendes, las horas son impredecibles; la dificultad relativa es más estable. |

**Reglas de oro para no descarrilar:**
1. **Un sprint = un objetivo demostrable.** Si al final no puedes *enseñar* algo que funciona, el sprint falló en su diseño, no tú.
2. **Time-box el atascamiento.** Si llevas más de X tiempo (defínelo, ej: 2 horas) estrellándote en *un* punto sin avanzar, ESE es el momento de pedir ayuda concreta — no antes (te pierdes el aprendizaje), no mucho después (te quemas).
3. **No arrastres deuda de fase.** No empieces un sprint nuevo con criterios del anterior sin cumplir. Se acumula y te entierra.

---

## 2. Cadencia recomendada

- **Sprints de 1 a 2 semanas** según tu disponibilidad real (compaginas con la universidad). Mejor sprints cortos y cumplidos que largos e incumplidos.
- **Sé honesto con tu capacidad.** Si tienes parciales esa semana, planea menos. Un sprint sobrecargado que no cierras es peor que uno modesto que sí.
- Los sprints están agrupados por fase del roadmap. Algunas fases caben en un sprint; las pesadas (la del solver) toman varios.

---

## 3. Backlog de sprints

> Las estimaciones de esfuerzo son **relativas** (S = pequeño, M = medio, L = grande, XL = muy grande) e incluyen el tiempo de *aprender* lo nuevo, no solo escribir código. Ajusta a tu ritmo real tras los primeros sprints.

---

### SPRINT 0 — Andamiaje (Fase 0)
**Objetivo demostrable:** un dato viaja React → Rust → Postgres → React.
**Esfuerzo:** M

**Backlog:**
- [ ] Estructura de repo decidida y justificada (ADR-001). · S
- [ ] Postgres en Docker corriendo localmente. · S
- [ ] Backend Rust con axum: endpoint de salud + uno que escribe/lee en Postgres con sqlx. · M
- [ ] Migraciones versionadas configuradas. · S
- [ ] React conectado al backend, mostrando el dato de ida y vuelta. · S
- [ ] CORS resuelto. · S

**Definición de hecho:** clic en React → registro en Postgres → visible de vuelta.
**Riesgo principal:** configuración inicial de Rust async + sqlx. Es el primer muro; no te desanimes, es normal que cueste.

---

### SPRINT 1 — Modelo del dominio (Fase 1)
**Objetivo demostrable:** configurar una clínica ficticia completa desde la UI.
**Esfuerzo:** L

**Backlog:**
- [ ] Esquema de recursos, tipos, disponibilidad (F-01). · M
- [ ] Esquema de servicios y requisitos (F-02). · M
- [ ] **Decisión de modelado de restricciones** (rígido vs híbrido) → ADR-002. · M
- [ ] Mecanismo de atributos/habilidades (el híbrido). · M
- [ ] CRUD backend de todas las entidades. · M
- [ ] UI de configuración (formularios, listas). · L

**Definición de hecho:** clínica con 3 recursos, 4 servicios y sus reglas, persistida y editable.
**Riesgo principal:** sobre-diseñar el modelo de restricciones. Empieza simple; puedes evolucionarlo.

---

### SPRINT 2 — Solver v0: factibilidad (Fase 2)
**Objetivo demostrable:** preguntar "¿cabe esta cita?" y recibir respuesta correcta con asignación.
**Esfuerzo:** L · **← aquí empieza el corazón**

**Backlog:**
- [ ] Modelar el problema en memoria (estructuras del solver, desacopladas de DB). · M
- [ ] Lógica de solapamiento de intervalos correcta (intervalos semiabiertos). · M
- [ ] Solver de factibilidad por fuerza bruta (F-04). · L
- [ ] Endpoint de factibilidad. · S
- [ ] **Tests del solver** con casos del documento 05 (F-04). · M

**Definición de hecho:** todos los criterios de F-04 pasan, vía test y vía API.
**Riesgo principal:** los bugs sutiles de tiempo (solapamientos, off-by-one). Aquí los tests te salvan la vida. No los pospongas.

---

### SPRINT 3 — Agendar de verdad (Fase 3)
**Objetivo demostrable:** agendar citas, verlas en calendario, cancelar libera recursos, sin doble-reserva.
**Esfuerzo:** XL (probablemente 2 sprints)

**Backlog:**
- [ ] Esquema de citas y recursos reservados (F-05). · M
- [ ] Reserva atómica con transacción (F-05). · L
- [ ] **Prevención de doble-reserva concurrente** (RNF-04) → ADR-003. · L
- [ ] Liberación al cancelar. · S
- [ ] Máquina de estados de cita. · M
- [ ] Vista de calendario en React (F-08). · XL
- [ ] Gestión manual de citas (F-09). · L

**Definición de hecho:** criterios de F-05, F-08, F-09. El test de doble-reserva concurrente PASA.
**Riesgo principal:** la concurrencia y el calendario son ambos grandes. Considera partirlo en dos sprints: uno backend (reservas/concurrencia), uno frontend (calendario).

---

### SPRINT 4 — Portal público (Fase 4)
**Objetivo demostrable:** un anónimo reserva online y aparece en la agenda interna.
**Esfuerzo:** L

**Backlog:**
- [ ] Generación de disponibilidad — solver en modo "todos los huecos" (F-06). · L
- [ ] Página pública del negocio (F-10). · M
- [ ] Flujo de reserva del cliente final (F-11). · L
- [ ] Revalidación en confirmación (no doble-reserva desde el portal). · M

**Definición de hecho:** criterios de F-06, F-10, F-11.
**Riesgo principal:** aquí la fuerza bruta del solver EMPIEZA A DOLER al generar toda la disponibilidad. Ese dolor es la señal pedagógica para el Sprint 5. No lo "arregles" prematuramente; siéntelo.

---

### SPRINT 5 — Solver inteligente (Fase 5)
**Objetivo demostrable:** una asignación medible-mente mejor que la ingenua, en tiempo razonable.
**Esfuerzo:** XL (probablemente 2-3 sprints) · **← el pico de aprendizaje**

**Backlog:**
- [ ] Definir función(es) objetivo (F-07). · M
- [ ] Reemplazar fuerza bruta por backtracking con poda / propagación. · XL
- [ ] **Decisión: solver propio vs crate de constraint solving** → ADR-004. · M
- [ ] Optimización de agenda completa. · L
- [ ] Métricas para *demostrar* la mejora. · M
- [ ] Tests de optimalidad y rendimiento (RNF-01/02/03). · L

**Definición de hecho:** criterios de F-07; mejora demostrable con métrica; cumple objetivos de rendimiento.
**Riesgo principal:** es el sprint más difícil de todo el proyecto. Aquí es donde más vas a estrellarte y más vas a aprender. Time-boxea agresivamente y trae problemas *concretos* cuando te trabes. No intentes el solver perfecto de una; itera.

---

### SPRINT 6 — Notificaciones asíncronas (Fase 6)
**Objetivo demostrable:** reservar dispara confirmación; antes de la cita llega recordatorio. Solo.
**Esfuerzo:** L

**Backlog:**
- [ ] Cola de tareas (empezar simple: tabla en Postgres) → ADR-005. · M
- [ ] Worker que procesa la cola. · L
- [ ] Envío de email (confirmación + recordatorio) (F-13). · M
- [ ] Idempotencia y reintentos (RNF-06). · M

**Definición de hecho:** criterios de F-13; sin duplicados ni pérdidas.
**Riesgo principal:** primer sistema asíncrono. La idempotencia es sutil — un recordatorio duplicado molesta al cliente real.

---

### SPRINT 7 — Multi-tenancy y cuentas (Fase 7)
**Objetivo demostrable:** dos negocios registrados, configurados, invisibles entre sí.
**Esfuerzo:** L

**Backlog:**
- [ ] Auth: registro, login, hashing de contraseñas (F-14, RNF-07). · L
- [ ] Aislamiento de tenants en toda query (F-15, RNF-08) → ADR-006. · L
- [ ] Roles (F-16). · M
- [ ] Onboarding guiado (F-16). · M

**Definición de hecho:** criterios de F-14, F-15, F-16. El test de aislamiento PASA bajo intentos manipulados.
**Riesgo principal:** olvidar el filtro de tenant en alguna query = fuga. Considera row-level security para garantizarlo estructuralmente.

---

### SPRINT 8 — Monetización (Fase 8)
**Objetivo demostrable:** free → choca límite → upgrade (pago test) → límite levantado.
**Esfuerzo:** L

**Backlog:**
- [ ] Modelo de planes y límites (F-17). · M
- [ ] Enforcement de límites sin ensuciar el código. · M
- [ ] Integración con pasarela (suscripciones) (F-18). · L
- [ ] Webhooks de ciclo de vida (reusa la cola del Sprint 6). · M

**Definición de hecho:** criterios de F-17, F-18, con pago en modo test.
**Riesgo principal:** los webhooks de pago y sus estados. Importante: tú *nunca* manejas datos de tarjeta directamente — eso lo hace la pasarela.

---

### SPRINT 9 — Pulido y segundo vertical (Fase 9)
**Objetivo demostrable:** el motor sirve a un segundo vertical reusando el corazón.
**Esfuerzo:** L

**Backlog:**
- [ ] Logging estructurado, métricas, manejo de errores. · M
- [ ] Tests donde más duele (solver bajo carga). · M
- [ ] Clonar producto a un segundo vertical. · L
- [ ] Refactor de lo que el segundo vertical revele como mal-generalizado. · L

**Definición de hecho:** mismo motor, dos verticales, sin reescribir el corazón.
**Riesgo principal:** descubrir que el motor era menos genérico de lo que creías. Eso no es fracaso — es el aprendizaje de arquitectura más valioso del proyecto.

---

## 4. Tu ritual de cierre de sprint (no lo saltes)

Al final de cada sprint, 20 minutos:
1. **¿Cumplí la definición de hecho?** Sí/No honesto.
2. **¿Qué subestimé?** Anótalo; mejora tu próxima estimación.
3. **¿Dónde me estrellé y qué aprendí?** Este es el registro de tu crecimiento real.
4. **¿Qué arrastro?** Si algo quedó, va al backlog del siguiente, explícitamente.

Lleva esto en un archivo simple (`docs/bitacora.md` o similar). En 6 meses, leerlo te mostrará cuánto avanzaste — y eso combate el desánimo de los días difíciles.

---

## 5. Sobre las estimaciones y la realidad

Vas a subestimar. Todos lo hacemos, y más cuando aprendemos algo nuevo a la vez. Eso no es un defecto tuyo; es la naturaleza del trabajo desconocido. Los Sprints 3 y 5 casi seguro se desbordan a múltiples iteraciones — está previsto y es sano. La meta no es cumplir un cronograma de fantasía, sino mantener avance constante y demostrable. Un sprint que entrega algo pequeño que *funciona* siempre vale más que uno ambicioso que queda a medias.

---

**Anterior:** [05 — Features y Criterios](./05-features-y-criterios.md) · **Siguiente:** [07 — Decisiones Arquitectónicas (ADRs)](./07-decisiones-arquitectonicas.md)