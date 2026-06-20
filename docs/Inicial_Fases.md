# Documento de Fases de Desarrollo
## SaaS de Scheduling Inteligente con Recursos Restringidos

**Stack:** React (frontend) · Rust (backend / motor de optimización) · PostgreSQL (persistencia)
**Filosofía:** desarrollo por features verticales · cada fase entrega algo funcional de punta a punta · construido a mano, no por vibecoding.

---

## Principios de este roadmap

1. **Rebanadas verticales, no capas.** Cada fase toca DB + backend + frontend y deja algo que puedes *usar*. Nunca "primero todo el back, luego todo el front".
2. **El solver evoluciona.** Empieza como fuerza bruta honesta y se vuelve inteligente con las fases. Un solver tonto que funciona vale más que uno genial que no compila.
3. **Cada fase tiene un "reto nuevo".** Es el concepto que probablemente no dominas y que te va a hacer estrellarte. Ese es el objetivo, no el obstáculo.
4. **Commits por feature.** Cada feature es una rama, varios commits pequeños, un merge. Nada de un commit gigante con todo hecho.
5. **No optimices lo que no duele.** Multi-tenancy serio, billing, escalado: hasta el final. Primero el corazón.

---

## FASE 0 — Cimientos y "hola mundo" de extremo a extremo

**Objetivo:** que un dato viaje desde React → Rust → Postgres → de vuelta a React. Sin lógica de negocio aún.

**Qué construir:**
- Repo con estructura clara (monorepo o dos repos, tú decides y justifica por qué).
- Backend Rust levantando un servidor HTTP con un endpoint de salud y uno que lea/escriba algo trivial en Postgres.
- Frontend React que consuma esos endpoints y muestre el resultado.
- Postgres corriendo en Docker. Migraciones versionadas desde el día uno.

**Reto nuevo probable:** elegir y configurar el framework web de Rust (axum es el estándar actual), conexión a DB con un pool (sqlx te obliga a escribir SQL real y valida queries en compile-time — brutal para aprender), y CORS entre front y back.

**Criterio de "terminado":** abres React, haces clic en un botón, y un registro aparece en Postgres. Ni más ni menos.

---

## FASE 1 — Modelo del dominio: recursos, servicios y reglas

**Objetivo:** representar el mundo del negocio. Aún sin agendar nada.

**Qué construir:**
- Modelo de datos para las entidades núcleo:
  - **Recursos** (personal, salas, equipos) — cada uno con un tipo y disponibilidad horaria base.
  - **Servicios** (tipos de cita) — cada uno con duración y qué recursos requiere (ej: "limpieza dental" necesita 1 dentista + 1 sala + 30 min).
  - **Reglas/restricciones** — buffers entre citas, qué recurso puede hacer qué servicio, horarios de apertura.
- CRUD completo de estas entidades (back + front). UI sencilla para que un negocio defina su realidad.

**Reto nuevo probable:** modelar la relación "un servicio requiere N recursos de ciertos tipos" sin que el esquema se vuelva un monstruo. Aquí decides si las restricciones viven en tablas rígidas o en un formato flexible (JSON en una columna). Decisión de diseño con consecuencias — piénsala.

**Criterio de "terminado":** puedes configurar una clínica ficticia completa (3 recursos, 4 servicios, sus reglas) desde la interfaz, y queda persistido.

---

## FASE 2 — El solver v0: ¿cabe esta cita? (motor de factibilidad)

**Objetivo:** el corazón empieza a latir. Dada una solicitud de cita y un instante, responder: ¿es posible? ¿con qué recursos?

**Qué construir:**
- Un módulo en Rust que, dado un servicio + un horario propuesto + el estado actual de citas, determine si existe una asignación válida de recursos que respete TODAS las restricciones.
- Empieza con **fuerza bruta**: prueba combinaciones de recursos disponibles hasta encontrar una que sirva o agotar opciones. No te avergüences de esto — es correcto y te enseña el problema.
- Endpoint que reciba una solicitud y devuelva factible/no factible + la asignación.

**Reto nuevo probable:** esto ES un problema de satisfacción de restricciones (CSP). Tu primer encuentro con modelar restricciones como código. También: manejar el tiempo correctamente (solapamientos de intervalos es más sutil de lo que parece — ojo con los off-by-one y zonas horarias).

**Criterio de "terminado":** le pides una cita que cabe → te dice con qué recursos. Le pides una que choca → te dice que no. A mano, vía API.

---

## FASE 3 — Agendar de verdad: citas, calendario y estado

**Objetivo:** convertir factibilidad en citas reales persistidas y visibles.

**Qué construir:**
- Crear citas que reserven recursos (la asignación de la Fase 2 ahora se guarda).
- Vista de calendario en React: ver citas por recurso, por día/semana. Esta es tu primera UI rica de verdad.
- Manejo de estados de cita (pendiente, confirmada, cancelada) y liberación de recursos al cancelar.
- **Concurrencia:** ¿qué pasa si dos solicitudes piden el último hueco al mismo tiempo? Aquí te estrellas con condiciones de carrera.

**Reto nuevo probable:** transacciones de base de datos y bloqueos para evitar doble-reserva. Este es uno de los aprendizajes más valiosos de todo el proyecto y casi ningún tutorial lo enseña bien. También: renderizar un calendario decente sin librería mágica (o eligiendo una y entendiéndola).

**Criterio de "terminado":** agendas varias citas, las ves en el calendario, cancelas una y su recurso queda libre. Dos reservas simultáneas del mismo hueco: solo una gana.

---

## FASE 4 — La cara pública: portal de reservas

**Objetivo:** el cliente final del negocio entra y pide su cita solo. Aquí el producto se vuelve vendible.

**Qué construir:**
- Página pública por negocio donde un visitante elige servicio y ve huecos disponibles reales (calculados por tu solver, no una lista tonta).
- Flujo de reserva: elegir servicio → ver disponibilidad → reservar → confirmación.
- El solver ahora corre en modo "dame todos los huecos válidos de la próxima semana para este servicio", no solo "¿cabe este instante?".

**Reto nuevo probable:** generar disponibilidad eficientemente. Calcular *todos* los huecos válidos es mucho más caro que validar uno. Aquí tu fuerza bruta empieza a dolerte y entiendes *por qué* necesitas un solver mejor. Ese dolor es pedagógico: lo vas a sentir antes de arreglarlo.

**Criterio de "terminado":** desde un navegador anónimo, alguien reserva una cita en tu clínica ficticia y aparece en el calendario interno del negocio.

---

## FASE 5 — El solver inteligente: de factibilidad a optimización

**Objetivo:** el salto conceptual grande. No solo "¿cabe?", sino "¿cuál es la *mejor* asignación?".

**Qué construir:**
- Reemplazar la fuerza bruta por algo serio: backtracking con poda, propagación de restricciones, o una metaheurística. Aquí decides el enfoque (constraint programming vs. optimización).
- Definir una **función objetivo**: minimizar huecos muertos, maximizar ocupación, balancear carga entre el personal. El negocio elige qué optimizar.
- Optimización de la agenda completa, no solo de una cita: dado un conjunto de citas pendientes, encontrar la mejor distribución.

**Reto nuevo probable:** este es tu terreno de Investigación de Operaciones aplicado de verdad. Modelar la función objetivo, podar el espacio de búsqueda, y que corra rápido. Posiblemente evalúes usar un crate de constraint solving o construir el tuyo (sufrir aquí = aprender mucho).

**Criterio de "terminado":** das un conjunto de citas y restricciones, y el sistema produce una asignación medible-mente mejor que la ingenua, en tiempo razonable. Puedes *probar* que es mejor con una métrica.

---

## FASE 6 — Notificaciones y ciclo de vida real

**Objetivo:** que el producto se comporte como un producto.

**Qué construir:**
- Recordatorios y confirmaciones por email (y la base para SMS/WhatsApp después).
- Trabajos en segundo plano / cola de tareas para enviar sin bloquear el request.
- Reprogramación y cancelación desde el lado del cliente final.

**Reto nuevo probable:** procesamiento asíncrono y colas de trabajos en Rust. Manejar fallos de envío, reintentos, idempotencia (no mandar el mismo recordatorio dos veces). Tu primer sistema que hace cosas "solo", fuera del ciclo request-respuesta.

**Criterio de "terminado":** reservas una cita y, sin que nadie haga nada, llega un email de confirmación; antes de la cita, un recordatorio.

---

## FASE 7 — Multi-tenancy, cuentas y el negocio como negocio

**Objetivo:** de "una clínica ficticia hardcodeada" a "cualquier negocio se registra y opera aislado".

**Qué construir:**
- Registro y autenticación de negocios. Cada negocio ve solo sus datos (aislamiento de datos = multi-tenancy).
- Roles dentro del negocio (dueño, recepcionista).
- Onboarding: que un negocio nuevo configure su realidad sin tu ayuda.

**Reto nuevo probable:** autenticación hecha bien (sesiones/tokens, hashing de contraseñas — nunca a mano de forma ingenua) y, sobre todo, **aislamiento de tenants**: garantizar que un negocio jamás vea datos de otro. Un error aquí es una brecha de seguridad. Concepto crítico de todo SaaS real.

**Criterio de "terminado":** dos negocios distintos se registran, configuran sus recursos, y son completamente invisibles entre sí.

---

## FASE 8 — Monetización: planes, límites y billing

**Objetivo:** cerrar el lazo de SaaS. Ahora sí, dinero.

**Qué construir:**
- Niveles de suscripción con límites (nº de recursos, citas/mes, features premium como el portal público o las notificaciones).
- Aplicación de límites según el plan.
- Integración con una pasarela de pagos para suscripciones recurrentes.

**Reto nuevo probable:** modelar planes y *enforcement* de límites sin ensuciar todo el código con condicionales. Manejar el ciclo de vida de suscripciones (alta, baja, pago fallido) vía webhooks de la pasarela — que conecta con el procesamiento asíncrono de la Fase 6.

**Criterio de "terminado":** un negocio se registra en plan gratis, choca con un límite, sube a plan pago, y el límite se levanta. El pago es real (en modo test).

---

## FASE 9 — Pulido, observabilidad y segundo vertical

**Objetivo:** robustez de producto y validar la tesis de "motor genérico, producto afilado".

**Qué construir:**
- Logging estructurado, métricas, manejo de errores decente, tests donde más duele (el solver).
- Performance: el solver bajo carga real.
- **La prueba de fuego de la generalización:** clonar el producto a un segundo vertical (de clínica a, por ejemplo, taller mecánico o tutorías) reusando el motor. Si el motor está bien diseñado, esto es rápido. Si no, lo descubres aquí y aprendes por qué.

**Reto nuevo probable:** descubrir qué tan genérico era de verdad tu motor. Refactor guiado por un caso de uso real distinto. Es el mejor profesor de arquitectura que existe.

**Criterio de "terminado":** el mismo motor sirve a dos verticales con configuración distinta, sin reescribir el corazón.

---

## Cómo trabajar cada fase (para no caer en el infierno de tutoriales)

1. **Lee el objetivo y el reto nuevo.** Identifica qué no sabes *antes* de buscar nada.
2. **Intenta primero.** Diseña tu solución en papel o pseudocódigo. Estréllate.
3. **Cuando te trabes de verdad** (no en los primeros 5 minutos), trae *ese punto específico* — no "cómo hago la fase 5", sino "mi backtracking no poda bien, aquí está mi lógica". Desglosamos solo eso.
4. **Una rama por feature.** Commits pequeños y descriptivos. Al terminar la feature, merge.
5. **No avances de fase sin cumplir el criterio de terminado.** Cada fase se apoya en la anterior.

---

## Notas de alcance

- **Lo que va al final a propósito:** billing pulido, multi-tenancy robusto, segundo vertical. No los necesitas para aprender el corazón y meterlos temprano te frena.
- **El corazón del proyecto son las Fases 2 a 5.** Si solo tuvieras tiempo para una parte, es esa: el solver de factibilidad evolucionando a optimizador. Ahí vive el 80% del aprendizaje y la diferenciación.
- **Las Fases 0-1 son andamiaje.** Hazlas bien pero rápido; no son el punto.