# 10 — Diccionario de Dominio, Errores y Estados

> **Propósito:** la referencia única y precisa del vocabulario, los estados y los errores del sistema. Cuando lleves tres meses y dudes "¿cómo llamé a esto?" o "¿qué transiciones de estado permití?", la respuesta está aquí. La consistencia de nombres entre documentos, código y base de datos evita una clase entera de confusiones.

> Este documento extiende el glosario del doc 01 con el detalle operativo: las máquinas de estado completas y el catálogo de errores de negocio.

---

## 1. Lenguaje ubicuo (los nombres oficiales)

La regla: **un concepto, un nombre, en todas partes.** El mismo término en los documentos, en el código (structs, funciones), en la base de datos (tablas, columnas) y en la API. Si en el código se llama `Resource`, en la DB es `resource` y en la API `/resources` — nunca `Recurso` en un lado y `Asset` en otro.

| Concepto | Nombre oficial (código/EN) | En la DB | En la API | Definición operativa |
|---|---|---|---|---|
| Negocio cliente | `Tenant` | `tenant` | (implícito en auth) | La unidad de aislamiento. Todo cuelga de aquí. |
| Tipo de recurso | `ResourceType` | `resource_type` | `/resource-types` | Categoría: "terapeuta", "sala", "equipo". |
| Recurso | `Resource` | `resource` | `/resources` | Unidad limitada concreta que se reserva. |
| Disponibilidad de recurso | `ResourceAvailability` | `resource_availability` | (anidado) | Cuándo un recurso puede usarse. |
| Atributo/habilidad | `Attribute` | `resource_attribute` | (anidado) | Capacidad fina: "certificado en X", "tiene camilla eléctrica". |
| Servicio | `Service` | `service` | `/services` | Tipo de cita ofrecida. |
| Requisito de servicio | `ServiceRequirement` | `service_requirement` | (anidado) | Qué recursos consume un servicio. |
| Cita | `Appointment` | `appointment` | `/appointments` | Reserva concreta. |
| Recurso reservado | `AppointmentResource` | `appointment_resource` | (anidado) | Qué recursos bloquea una cita. |
| Asignación | `Assignment` | (calculada) | (en respuestas) | Combinación de recursos elegida para una cita. |
| Hueco | `Slot` | (calculado) | (en disponibilidad) | Intervalo donde un servicio podría agendarse. |
| Restricción | `Constraint` | (varias formas) | — | Regla que toda asignación válida respeta. |
| Buffer | `Buffer` | (en requirement) | (anidado) | Tiempo obligatorio antes/después de una cita en un recurso. |
| Reserva pública | `Booking` | (es un `appointment`) | `/bookings` | Una cita creada desde el portal público. Mismo concepto subyacente que `Appointment`. |

> **Nota sobre `Booking` vs `Appointment`:** son el mismo concepto de datos (una cita), pero "booking" es el término de cara al cliente final en el portal público, y "appointment" el término interno. Decide si los unificas en código (recomendado: una entidad `Appointment`, con `Booking` solo como nombre de la operación pública) y regístralo. Mantener dos entidades distintas para lo mismo es una fuente de bugs.

---

## 2. Máquinas de estado

Los estados explícitos evitan el caos de los booleanos sueltos (`is_confirmed`, `is_cancelled`, `is_done`... que permiten combinaciones imposibles como confirmada-y-cancelada a la vez). Una máquina de estados hace ilegales los estados imposibles.

### 2.1 — Estado de una cita (`Appointment`)

```
                    ┌─────────────┐
        crear  ───> │  PENDING    │   (pendiente: creada, recursos aún no firmes)
                    └──────┬──────┘
                          │ confirm
                          ▼
                    ┌─────────────┐
                    │  CONFIRMED  │   (confirmada: recursos RESERVADOS)
                    └──────┬──────┘
              ┌───────────┼───────────┐
        cancel│           │ complete  │ no-show
              ▼           ▼           ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │CANCELLED │ │COMPLETED │ │ NO_SHOW  │
        └──────────┘ └──────────┘ └──────────┘
         (libera        (terminal:   (terminal:
          recursos)      ya ocurrió)  no se presentó)
```

**Transiciones válidas (y solo estas):**

| Desde | Evento | Hacia | Efecto |
|---|---|---|---|
| PENDING | confirm | CONFIRMED | Reserva los recursos (atómico). |
| PENDING | cancel | CANCELLED | No había recursos firmes; solo marca cancelada. |
| CONFIRMED | cancel | CANCELLED | **Libera los recursos** (RF-09). |
| CONFIRMED | complete | COMPLETED | La cita ocurrió. Terminal. |
| CONFIRMED | no-show | NO_SHOW | El cliente no llegó. Terminal. Libera recursos. |

**Transiciones inválidas (deben rechazarse — error `invalid_state_transition`):**
- Completar o cancelar una cita ya CANCELLED/COMPLETED/NO_SHOW (estados terminales).
- Confirmar algo que no está PENDING.
- Cualquier salto que no esté en la tabla de arriba.

> **Decisión pendiente:** ¿existe el estado PENDING o las citas nacen CONFIRMED? Depende de si tienes un paso de confirmación (ej: el negocio aprueba reservas públicas antes de firmarlas, o se confirman al instante). Si las reservas son inmediatas, podrías simplificar a CONFIRMED directo. Decídelo según tu flujo y regístralo. Documentar el modelo completo aquí no te obliga a implementar todos los estados desde el día uno.

### 2.2 — Estado de una suscripción (`Subscription`, Fase 8)

```
   ┌─────────┐  activar   ┌─────────┐  pago falla   ┌──────────┐
   │  TRIAL  │ ─────────> │ ACTIVE  │ ────────────> │ PAST_DUE │
   └─────────┘            └────┬────┘               └────┬─────┘
                              │ cancelar               │ pago ok / se resuelve
                              ▼                         │
                         ┌──────────┐ <─────────────────┘
                         │ CANCELLED│   (o reactiva a ACTIVE)
                         └──────────┘
```

Los detalles finos (periodos de gracia, reactivación) los defines en la Fase 8 según la pasarela. Lo importante ahora: los estados existen y las transiciones las dispara mayormente la pasarela vía webhooks, no el usuario directamente.

---

## 3. Catálogo de errores de negocio

Estos son los errores con significado de dominio (distintos de errores técnicos genéricos). Cada uno tiene un código estable (parte del contrato de API, doc 08) para que el frontend reaccione apropiadamente.

| Código | Cuándo ocurre | Cómo debe reaccionar el frontend |
|---|---|---|
| `validation_error` | Datos de entrada mal formados o incompletos. | Resaltar el campo problemático. |
| `resource_type_not_found` | Un servicio referencia un tipo de recurso inexistente. | Avisar al configurar el servicio. |
| `resource_has_future_appointments` | Se intenta borrar un recurso con citas futuras. | Pedir resolver esas citas primero. |
| `service_not_feasible` | Se pide una cita imposible (ningún recurso satisface). | Mostrar que no hay disponibilidad para ese instante. |
| `resource_conflict` | El hueco se ocupó entre la consulta y la reserva (RNF-04). | **Ofrecer re-elegir hueco.** El caso crítico. |
| `invalid_state_transition` | Transición de estado de cita no permitida. | Indicar que la acción no es posible en ese estado. |
| `tenant_forbidden` / `not_found` | Acceso a datos de otro tenant (RNF-08). | Tratar como no existente. No revelar nada. |
| `unauthenticated` | Falta autenticación válida. | Redirigir a login. |
| `plan_limit_reached` | Se excede un límite del plan (Fase 8). | Invitar a mejorar el plan. |
| `cancellation_window_passed` | Cancelación fuera del plazo permitido. | Explicar la política de cancelación del negocio. |

**Principio:** un error de negocio NUNCA es un crash. Es un resultado previsto del dominio, comunicado con un código claro. El frontend debe poder distinguir "el hueco se ocupó" (recuperable, re-elegir) de "tus datos son inválidos" (corregir input) de "no tienes permiso" (otra cosa). Errores sin estructura = frontend que no puede dar buena UX.

---

## 4. Invariantes del dominio (lo que SIEMPRE debe ser cierto)

Las invariantes son verdades que el sistema mantiene pase lo que pase. Violarlas es corrupción de datos, no un bug menor. Tenerlas escritas te da una checklist de lo que tus pruebas deben proteger.

1. **Un recurso nunca está reservado por dos citas en intervalos solapados.** (RNF-04. La invariante central.)
2. **Una cita CONFIRMED tiene exactamente la asignación de recursos que su servicio requiere.** Ni más, ni menos.
3. **Cancelar una cita CONFIRMED libera todos sus recursos.** No quedan recursos "fantasma" reservados.
4. **Todo dato de negocio pertenece a exactamente un tenant.** No hay datos huérfanos ni compartidos entre tenants. (RNF-08.)
5. **Una cita en estado terminal (CANCELLED/COMPLETED/NO_SHOW) no cambia más.** Los terminales son finales.
6. **Los huecos mostrados como disponibles eran factibles en el momento de mostrarlos.** (Pueden dejar de serlo después — por eso se revalida al reservar.)

> Cada invariante es candidata directa a prueba (doc 09). Si puedes escribir un test que intente violar una invariante y verificar que el sistema lo impide, tienes una red de seguridad sólida.

---

## 5. Cómo usar este documento

- **Al nombrar algo nuevo** (una tabla, un struct, un endpoint), consulta la sección 1 para mantener consistencia. Si es un concepto nuevo, añádelo aquí primero.
- **Al implementar transiciones de estado**, la sección 2 es tu especificación exacta. Las transiciones no listadas son ilegales por defecto.
- **Al definir respuestas de error**, usa los códigos de la sección 3. No inventes códigos ad-hoc dispersos.
- **Al escribir pruebas**, las invariantes de la sección 4 son tu lista de lo que nunca debe romperse.

Mantén este documento vivo: cuando el dominio crezca, crece aquí primero, luego en el código.

---

**Anterior:** [09 — Estrategia de Testing](./09-estrategia-testing.md) · **Volver al índice:** [00 — Índice](\00-indice.md)