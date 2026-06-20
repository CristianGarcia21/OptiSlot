# 08 — Diseño de API (Contratos de Endpoints)

> **Propósito:** definir el contrato entre el frontend (React) y el backend (Rust) *antes* de escribir cualquiera de los dos. El contrato es el acuerdo: qué rutas existen, qué reciben, qué devuelven, cómo fallan. Tenerlo antes evita el ciclo infernal de "cambio el backend → rompo el frontend → rehago el frontend → cambio el backend otra vez".

> **Nota de método:** esto es el *contrato*, no la implementación. Las formas exactas de los JSON (nombres precisos de campos, tipos) las afinarás al implementar, pero la estructura y la semántica se deciden aquí. Versiona este documento cuando el contrato cambie de verdad.

---

## 1. Principios de diseño de la API

1. **REST orientado a recursos.** Las rutas representan cosas (recursos, servicios, citas), no acciones. `POST /appointments`, no `/createAppointment`.
2. **El tenant es implícito, nunca un parámetro de URL.** El tenant se deriva de la autenticación (Fase 7), jamás se pasa como `?tenant_id=`. Pasarlo por URL es la receta para una fuga de datos (RNF-08). Antes de la Fase 7, trabajas con un tenant fijo de desarrollo.
3. **Errores con estructura consistente.** Todo error devuelve el mismo formato (ver sección 4), para que el frontend los maneje uniformemente.
4. **Idempotencia donde importa.** Las operaciones que crean reservas o pagos soportan claves de idempotencia para que un reintento no duplique.
5. **El portal público y el panel interno son dos superficies distintas.** Endpoints públicos exponen lo mínimo (RNF-10); endpoints internos requieren autenticación.

---

## 2. Convenciones generales

| Aspecto | Convención |
|---|---|
| Formato | JSON en request y response. |
| Identificadores | IDs opacos (no expongas enteros secuenciales que revelen volumen/permitan enumeración). |
| Fechas/horas | Siempre ISO 8601 con zona (UTC en el almacén, la zona del negocio para mostrar). |
| Paginación | Las listas que pueden crecer (citas) se paginan. Decide el estilo (cursor recomendado para datos que cambian). |
| Versionado | Prefijo de versión en la ruta (ej: `/v1/...`) para poder evolucionar sin romper clientes. |
| Autenticación | Token en cabecera (Fase 7). Antes, sin auth en desarrollo. |

---

## 3. Catálogo de endpoints por dominio

> Notación: el **cuerpo** describe los campos conceptuales, no el JSON literal exacto. La **fase** indica cuándo se construye.

### 3.1 — Configuración: Recursos (Fase 1, F-01)

| Método | Ruta | Propósito |
|---|---|---|
| `GET` | `/v1/resources` | Listar recursos del negocio. |
| `POST` | `/v1/resources` | Crear un recurso (nombre, tipo, disponibilidad base). |
| `GET` | `/v1/resources/{id}` | Detalle de un recurso. |
| `PATCH` | `/v1/resources/{id}` | Editar un recurso. |
| `DELETE` | `/v1/resources/{id}` | Eliminar (con la regla de F-01: no si tiene citas futuras). |

**Crear recurso — cuerpo conceptual:** nombre, tipo de recurso, disponibilidad base (horarios), atributos/habilidades opcionales.
**Respuesta:** el recurso creado con su ID.
**Errores notables:** tipo de recurso inexistente; eliminación con citas futuras (conflicto).

### 3.2 — Configuración: Servicios (Fase 1, F-02)

| Método | Ruta | Propósito |
|---|---|---|
| `GET` | `/v1/services` | Listar servicios. |
| `POST` | `/v1/services` | Crear servicio con sus requisitos de recursos. |
| `GET` | `/v1/services/{id}` | Detalle. |
| `PATCH` | `/v1/services/{id}` | Editar. |
| `DELETE` | `/v1/services/{id}` | Eliminar. |

**Crear servicio — cuerpo conceptual:** nombre, duración, lista de requisitos (cada uno: tipo de recurso, cantidad, restricciones de atributos, recursos concretos permitidos si aplica), buffers.
**Errores notables:** requisito que referencia un tipo de recurso inexistente; duración inválida.

### 3.3 — Motor: Factibilidad y disponibilidad (Fases 2 y 4, F-04, F-06)

| Método | Ruta | Propósito |
|---|---|---|
| `POST` | `/v1/scheduling/feasibility` | ¿Es factible este servicio en este horario? Con qué asignación. |
| `GET` | `/v1/scheduling/availability` | Todos los huecos válidos de un servicio en un periodo. |

**Factibilidad — cuerpo conceptual:** servicio, instante propuesto.
**Respuesta:** factible (sí/no) y, si sí, la asignación concreta de recursos.

**Disponibilidad — parámetros:** servicio, rango de fechas. (El rango se pasa acotado para no pedir cálculos enormes.)
**Respuesta:** lista de huecos válidos.
**Nota de rendimiento:** este es el endpoint costoso (RNF-02). Es el que motiva el solver inteligente de la Fase 5.

> **Decisión de diseño pendiente:** ¿la factibilidad es un endpoint propio o parte del flujo de creación? Recomendación: sepáralo, porque la UI necesita preguntar "¿cabe?" sin comprometerse a reservar. Pero la creación SIEMPRE revalida (no confía en una factibilidad previa que pudo quedar obsoleta).

### 3.4 — Agenda: Citas (Fase 3, F-05, F-09)

| Método | Ruta | Propósito |
|---|---|---|
| `GET` | `/v1/appointments` | Listar citas (filtrable por rango, recurso, estado). Paginada. |
| `POST` | `/v1/appointments` | Crear una cita (reserva atómica de recursos). |
| `GET` | `/v1/appointments/{id}` | Detalle. |
| `PATCH` | `/v1/appointments/{id}` | Mover / cambiar estado (respeta la máquina de estados). |
| `POST` | `/v1/appointments/{id}/cancel` | Cancelar (libera recursos). |

**Crear cita — cuerpo conceptual:** servicio, instante, datos del cliente (si aplica), clave de idempotencia.
**Respuesta:** la cita creada con su asignación de recursos.
**Errores notables (importantes):**
- *Conflicto de recursos* (el hueco se ocupó): este es el caso crítico de RNF-04. Debe devolver un error claro y específico que el frontend distinga de otros errores, para ofrecer re-elegir.
- *Transición de estado inválida* (ej: completar una cancelada).

> **Por qué `cancel` es un POST a un sub-recurso y no un DELETE:** cancelar no borra la cita (queremos su historial), cambia su estado y libera recursos. DELETE implicaría borrado; el dominio aquí es "cancelar", una acción con semántica propia. Esta clase de decisión es la que registras y razonas.

### 3.5 — Portal público (Fase 4, F-10, F-11)

Estos endpoints son **públicos** (sin auth) y exponen lo mínimo.

| Método | Ruta | Propósito |
|---|---|---|
| `GET` | `/v1/public/{businessSlug}` | Datos públicos del negocio y sus servicios reservables. |
| `GET` | `/v1/public/{businessSlug}/availability` | Huecos disponibles de un servicio (vista pública). |
| `POST` | `/v1/public/{businessSlug}/bookings` | Reservar como cliente final. |

**Reserva pública — cuerpo conceptual:** servicio, hueco elegido, datos de contacto del cliente, clave de idempotencia.
**Diferencia clave con la creación interna:** aquí el cliente es anónimo, y la exposición de datos es mínima. Nunca se devuelven nombres de recursos internos ni datos de otros clientes (RNF-10). El cliente reserva "un servicio a tal hora", no "con el terapeuta X en la sala Y" (a menos que el negocio decida exponer eso).

### 3.6 — Notificaciones (Fase 6) — mayormente internas

Las notificaciones se disparan por eventos del sistema (reserva creada, recordatorio programado), no por llamadas directas de la API en general. Puede existir algún endpoint administrativo para reenviar manualmente, pero el grueso es asíncrono (ver doc 03, flujos).

### 3.7 — Cuentas y auth (Fase 7, F-14, F-15)

| Método | Ruta | Propósito |
|---|---|---|
| `POST` | `/v1/auth/register` | Registrar un negocio (crea tenant + usuario dueño). |
| `POST` | `/v1/auth/login` | Autenticar, devuelve token. |
| `POST` | `/v1/auth/logout` | Cerrar sesión. |
| `GET` | `/v1/me` | Datos del usuario/negocio autenticado. |

> A partir de esta fase, TODOS los endpoints internos (3.1–3.4) requieren el token y derivan el tenant de él. Los públicos (3.5) siguen sin auth.

### 3.8 — Monetización (Fase 8, F-17, F-18)

| Método | Ruta | Propósito |
|---|---|---|
| `GET` | `/v1/plans` | Planes disponibles. |
| `GET` | `/v1/subscription` | Suscripción actual del negocio. |
| `POST` | `/v1/subscription` | Iniciar/cambiar suscripción (vía pasarela). |
| `POST` | `/v1/webhooks/payments` | Recibir eventos de la pasarela (público pero verificado por firma). |

> **Crítico de seguridad:** el endpoint de webhooks es público pero DEBE verificar la firma de la pasarela. Y tú nunca recibes ni almacenas datos de tarjeta — eso vive en la pasarela. (Acción prohibida manejar credenciales financieras directamente.)

---

## 4. Formato de errores (consistente en toda la API)

Todo error devuelve la misma estructura conceptual:
- un **código** estable y legible por máquina (ej: `resource_conflict`, `invalid_state_transition`, `tenant_forbidden`),
- un **mensaje** legible por humano,
- opcionalmente, **detalles** (qué campo, qué restricción).

**Por qué un código estable importa:** el frontend reacciona distinto a `resource_conflict` (ofrecer re-elegir hueco) que a `validation_error` (resaltar el campo). Si los errores fueran solo texto, el frontend no podría distinguirlos sin parsear strings (frágil).

**Mapa de códigos HTTP a usar con criterio:**

| Situación | HTTP | Código de negocio |
|---|---|---|
| Petición mal formada | 400 | `validation_error` |
| No autenticado | 401 | `unauthenticated` |
| Autenticado pero sin permiso / otro tenant | 403/404 | `tenant_forbidden` / `not_found` |
| Recurso inexistente | 404 | `not_found` |
| Conflicto de reserva (hueco ocupado) | 409 | `resource_conflict` |
| Transición de estado inválida | 409 | `invalid_state_transition` |
| Límite de plan alcanzado | 402/403 | `plan_limit_reached` |

> **Decisión sutil de seguridad:** al acceder a un recurso de otro tenant, ¿devuelves 403 (existe pero no puedes) o 404 (como si no existiera)? El 404 filtra menos información (no confirma que el recurso existe). Decídelo y regístralo — es una decisión de seguridad real.

---

## 5. Cómo usar este documento

- Antes de implementar una feature, mira aquí su(s) endpoint(s) y define el JSON exacto en este doc.
- El frontend puede empezar a construirse contra este contrato aunque el backend no esté (con datos simulados).
- Cuando cambies un contrato, actualiza ESTE documento primero, luego el código. El documento es la fuente de verdad del acuerdo.
- Los errores de la sección 4 son parte del contrato tanto como los endpoints. Un frontend que no conoce los códigos de error no puede dar buena UX.

---

**Anterior:** [07 — ADRs](./07-decisiones-arquitectonicas.md) · **Siguiente:** [09 — Estrategia de Testing](./09-estrategia-testing.md)