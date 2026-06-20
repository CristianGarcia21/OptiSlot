# 02 — Requisitos

> **Propósito:** definir *qué* debe hacer el sistema (funcionales) y *cómo de bien* debe hacerlo (no funcionales), de forma numerada y rastreable. Cada feature y cada criterio de aceptación después apuntará a estos IDs.

**Convención de IDs:**
- `RF-XX` = Requisito Funcional
- `RNF-XX` = Requisito No Funcional
- Prioridad: **MUST** (imprescindible) · **SHOULD** (importante) · **COULD** (deseable) · **WON'T** (fuera por ahora)

---

## Parte A — Requisitos Funcionales (RF)

### Dominio: Configuración del negocio

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | El sistema permite definir **recursos** (personal, salas, equipos), cada uno con un tipo y una disponibilidad horaria base. | MUST |
| RF-02 | El sistema permite definir **servicios**, cada uno con una duración y los requisitos de recursos que consume. | MUST |
| RF-03 | El sistema permite expresar que un servicio requiere **N recursos de ciertos tipos** (ej: 1 terapeuta + 1 sala). | MUST |
| RF-04 | El sistema permite definir qué recursos concretos pueden satisfacer un requisito (ej: "solo Ana hace punción seca"). | MUST |
| RF-05 | El sistema permite definir **buffers** entre citas (tiempo de preparación/limpieza). | SHOULD |
| RF-06 | El sistema permite definir el **horario de apertura** del negocio y excepciones (festivos, vacaciones de un recurso). | SHOULD |

### Dominio: Motor de scheduling

| ID | Requisito | Prioridad |
|---|---|---|
| RF-07 | Dada una solicitud de cita (servicio + horario), el sistema determina si es **factible** y con qué asignación de recursos. | MUST |
| RF-08 | El sistema **reserva** los recursos de una cita al confirmarla, impidiendo doble-reserva. | MUST |
| RF-09 | El sistema **libera** los recursos al cancelar una cita. | MUST |
| RF-10 | El sistema calcula **todos los huecos disponibles** para un servicio en un periodo dado. | MUST |
| RF-11 | El sistema **optimiza** la asignación según una función objetivo configurable (minimizar huecos / maximizar ocupación / balancear carga). | SHOULD |
| RF-12 | El sistema garantiza que ninguna asignación viola una restricción (capacidad, habilidad, buffer, horario). | MUST |

### Dominio: Agenda interna (staff)

| ID | Requisito | Prioridad |
|---|---|---|
| RF-13 | El staff puede ver las citas en una **vista de calendario** (por día/semana, por recurso). | MUST |
| RF-14 | El staff puede crear, mover y cancelar citas manualmente. | MUST |
| RF-15 | El sistema impide al staff crear citas que generen conflictos de recursos. | MUST |
| RF-16 | Las citas tienen **estados** (pendiente, confirmada, cancelada, completada). | SHOULD |

### Dominio: Portal público de reservas

| ID | Requisito | Prioridad |
|---|---|---|
| RF-17 | Un cliente final puede ver una página pública del negocio y elegir un servicio. | MUST |
| RF-18 | El cliente final ve **huecos reales y válidos** calculados por el motor. | MUST |
| RF-19 | El cliente final puede reservar una cita y recibir confirmación. | MUST |
| RF-20 | El cliente final puede cancelar o reprogramar su cita (dentro de reglas configurables). | SHOULD |

### Dominio: Notificaciones

| ID | Requisito | Prioridad |
|---|---|---|
| RF-21 | El sistema envía **confirmación** por email al reservar. | SHOULD |
| RF-22 | El sistema envía **recordatorio** antes de la cita. | SHOULD |
| RF-23 | El sistema notifica cancelaciones/reprogramaciones a las partes afectadas. | COULD |

### Dominio: Cuentas y multi-tenancy

| ID | Requisito | Prioridad |
|---|---|---|
| RF-24 | Un negocio puede **registrarse** y autenticarse. | MUST |
| RF-25 | Los datos de cada negocio están **aislados**: un negocio jamás accede a datos de otro. | MUST |
| RF-26 | Un negocio puede tener varios usuarios con **roles** (dueño, staff). | SHOULD |
| RF-27 | Un negocio nuevo puede completar su **onboarding** (configurar su realidad) sin intervención externa. | SHOULD |

### Dominio: Monetización

| ID | Requisito | Prioridad |
|---|---|---|
| RF-28 | El sistema ofrece **planes de suscripción** con límites diferenciados. | SHOULD |
| RF-29 | El sistema **aplica los límites** del plan (nº recursos, citas/mes, features). | SHOULD |
| RF-30 | El sistema procesa **pagos recurrentes** vía una pasarela externa. | SHOULD |
| RF-31 | El sistema maneja el ciclo de vida de la suscripción (alta, baja, pago fallido). | COULD |

---

## Parte B — Requisitos No Funcionales (RNF)

Los no funcionales son los que distinguen un juguete de un producto. Cada uno debe ser **medible**.

### Rendimiento

| ID | Requisito | Métrica objetivo |
|---|---|---|
| RNF-01 | Validar la factibilidad de una cita debe ser rápido. | < 100 ms para un negocio típico (≤ 20 recursos). |
| RNF-02 | Calcular disponibilidad de una semana debe ser tolerable para una UI interactiva. | < 1 s para un negocio típico. |
| RNF-03 | La optimización de agenda completa puede ser más lenta pero acotada. | < 10 s, o ejecutarse en segundo plano si excede. |

### Confiabilidad / Integridad

| ID | Requisito | Criterio |
|---|---|---|
| RNF-04 | **Nunca** debe ocurrir una doble-reserva del mismo recurso en el mismo intervalo. | Garantía transaccional. Cero tolerancia. |
| RNF-05 | Una cita reservada no se pierde ante fallos. | Persistencia durable; las reservas son atómicas. |
| RNF-06 | Las notificaciones no se duplican ni se pierden silenciosamente. | Idempotencia + reintentos con registro. |

### Seguridad

| ID | Requisito | Criterio |
|---|---|---|
| RNF-07 | Las contraseñas se almacenan con hashing fuerte, nunca en texto plano. | Algoritmo de hashing moderno (argon2/bcrypt). |
| RNF-08 | El aislamiento entre tenants es inviolable a nivel de aplicación. | Toda query filtra por tenant; tests que lo prueban. |
| RNF-09 | Los datos sensibles no viajan en URLs ni logs. | Revisión en code review. |
| RNF-10 | El portal público no expone datos internos del negocio (otros clientes, recursos privados). | Solo se expone disponibilidad agregada. |

### Mantenibilidad / Calidad

| ID | Requisito | Criterio |
|---|---|---|
| RNF-11 | El motor de optimización está **desacoplado** de la capa web y la DB. | Se puede testear el solver de forma aislada. |
| RNF-12 | El núcleo (solver) tiene **tests** que verifican factibilidad y optimalidad. | Cobertura significativa en la lógica crítica. |
| RNF-13 | Las decisiones de arquitectura quedan **registradas** (ADRs). | Ver documento 07. |
| RNF-14 | Las migraciones de base de datos están **versionadas**. | Desde el día uno. |

### Usabilidad

| ID | Requisito | Criterio |
|---|---|---|
| RNF-15 | Un negocio puede configurarse y agendar su primera cita sin manual. | Onboarding autoexplicativo. |
| RNF-16 | El portal público funciona en móvil (responsive). | Sin app nativa, web adaptable. |

### Escalabilidad (a futuro, no bloqueante al inicio)

| ID | Requisito | Criterio |
|---|---|---|
| RNF-17 | La arquitectura permite escalar el motor independientemente de la web. | Separación que lo habilite, aunque no se implemente ya. |
| RNF-18 | El sistema soporta múltiples tenants concurrentes sin degradación cruzada. | El trabajo pesado de un tenant no bloquea a otro. |

---

## Cómo usar este documento

- Cada **feature** (documento 05) referencia los RF que implementa.
- Cada **criterio de aceptación** valida uno o más requisitos.
- Los **RNF** se verifican continuamente, no en una sola fase. RNF-04 (no doble-reserva) y RNF-08 (aislamiento de tenants) son los dos *innegociables* del proyecto: un fallo ahí no es un bug, es un defecto de producto.

---

**Anterior:** [01 — Visión y Problema](01_Vision_y_problema.md) · **Siguiente:** [03 — Arquitectura](./03-arquitectura.md)