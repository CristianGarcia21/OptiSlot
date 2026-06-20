# 04 — Modelo de Datos

> **Propósito:** diseñar cómo se estructura la base de datos. Un buen modelo de datos hace que el código sea simple; uno malo lo hace imposible. Este documento explica no solo *qué* tablas, sino *por qué* están así.

> **Nota de método:** este documento te da el modelo *conceptual* y las decisiones de diseño. El SQL exacto (tipos precisos, índices, constraints) lo escribes tú al implementar cada fase — ahí aprendes. Aquí está el mapa, no el territorio compilado.

---

## 1. Principios de modelado para este proyecto

1. **El tenant está en todo.** Casi toda tabla lleva un `tenant_id`. Esto habilita el aislamiento (RNF-08) desde el primer día, aunque la autenticación llegue en la Fase 7. Reescribir esto después sería brutal — por eso se contempla ya.
2. **El tiempo es delicado.** Todo instante se guarda con zona horaria (timestamptz). Los solapamientos de intervalos son la fuente #1 de bugs sutiles en este dominio.
3. **Flexibilidad controlada en las reglas.** Las restricciones de servicios varían mucho entre negocios. Hay una tensión entre tablas rígidas (claras pero limitadas) y campos flexibles (potentes pero caóticos). Este documento marca dónde usar cada uno.
4. **Las reservas son sagradas.** El modelo debe hacer *imposible* a nivel de base de datos una doble-reserva (RNF-04), no solo improbable a nivel de aplicación.

---

## 2. Entidades núcleo y sus relaciones

### Diagrama conceptual (entidad-relación)

```
  TENANT (negocio)
    │
    ├──< RESOURCE_TYPE (tipo de recurso: "terapeuta", "sala"...)
    │        │
    │        └──< RESOURCE (Ana, Sala 1, Ultrasonido...)
    │                 │
    │                 └──< RESOURCE_AVAILABILITY (horarios base del recurso)
    │
    ├──< SERVICE (tipo de cita: "evaluación inicial"...)
    │        │
    │        └──< SERVICE_REQUIREMENT (qué tipos de recurso, cuántos, restricciones)
    │
    └──< APPOINTMENT (cita concreta)
             │
             └──< APPOINTMENT_RESOURCE (qué recursos concretos reserva)
```

### Las entidades explicadas

**TENANT** — Un negocio cliente. La raíz del aislamiento. Todo cuelga de aquí.

**RESOURCE_TYPE** — La categoría de un recurso. Permite decir "este servicio necesita *un* recurso de tipo terapeuta" sin nombrar a uno concreto. Clave para la flexibilidad del solver.

**RESOURCE** — Una unidad concreta y limitada: una persona, una sala, un equipo. Pertenece a un tipo. Es lo que se reserva.

**RESOURCE_AVAILABILITY** — Cuándo está disponible un recurso (horario base + excepciones). Ana solo de mañana; la sala 1 cerrada los domingos. Modela RF-06.

**SERVICE** — Un tipo de cita que el negocio ofrece. Tiene una duración base. Modela RF-02.

**SERVICE_REQUIREMENT** — La parte conceptualmente más rica: qué necesita un servicio. "1 recurso de tipo terapeuta + 1 de tipo sala". Y restricciones más finas: "el terapeuta debe tener la habilidad X", "la sala debe tener el atributo Y". Modela RF-03, RF-04.

**APPOINTMENT** — Una cita real: un servicio, un intervalo de tiempo, un estado, y opcionalmente un cliente final. Modela RF-07, RF-16.

**APPOINTMENT_RESOURCE** — Qué recursos concretos quedan reservados por una cita. Esta tabla es el **corazón de la no-doble-reserva**: si un recurso ya está aquí para un intervalo solapado, no puede volver a estarlo.

---

## 3. La decisión de diseño difícil: ¿cómo modelar las restricciones?

Esta es la decisión que más vas a pensar, y la que el roadmap (Fase 1) te marcó como "reto nuevo". Hay un espectro:

### Opción A — Todo en tablas rígidas
Cada tipo de restricción es una columna o tabla propia. Claro, validable, rápido de consultar. Pero cada nueva clase de regla = cambio de esquema y migración. Rígido.

### Opción B — Todo en un campo flexible (JSON)
Una columna JSON guarda reglas arbitrarias. Flexibilísimo, pero el caos: no hay garantías, las queries se complican, los bugs se esconden.

### Recomendación: híbrido
- **Las restricciones comunes y estructurales** (qué tipos de recurso, cuántos, duración, buffers) → **tablas rígidas**. Son el 90% de los casos y quieres que sean claras y rápidas.
- **Las restricciones finas y variables** (atributos/habilidades: "sala con camilla eléctrica", "terapeuta certificado en X") → un mecanismo de **etiquetas/atributos** (una tabla de atributos por recurso + requisitos de atributos por servicio). Más flexible que columnas fijas, más controlado que JSON libre.

> **Por qué importa:** si eliges mal aquí, o el sistema no podrá expresar las reglas de un negocio real (demasiado rígido), o se volverá un pantano imposible de mantener (demasiado flexible). No hay respuesta perfecta — hay *trade-offs*. Documenta tu elección como un ADR (documento 07). Esto es ingeniería de verdad: decidir con criterio bajo incertidumbre.

---

## 4. El problema del tiempo y los solapamientos

El núcleo de "no doble-reservar" es detectar **solapamiento de intervalos**: dos citas usan el mismo recurso si sus intervalos `[inicio, fin)` se cruzan.

Decisiones que debes tomar (y entender por qué):
- **Intervalos semiabiertos `[inicio, fin)`:** una cita de 10:00–10:30 y otra de 10:30–11:00 NO se solapan. Usar intervalos semiabiertos evita el clásico bug del minuto compartido.
- **Buffers como extensión del intervalo:** un buffer de limpieza se modela extendiendo el intervalo ocupado del recurso, no como una cita aparte. Decide si lo haces en el solver o en los datos.
- **Zona horaria:** guarda siempre en UTC con timestamptz; convierte a la zona del negocio solo para mostrar. Mezclar zonas es una fuente garantizada de dolor.

> PostgreSQL tiene soporte nativo para tipos de rango y restricciones de exclusión que pueden hacer *imposible* a nivel de base de datos que dos filas tengan rangos solapados para el mismo recurso. Investiga esto cuando llegues a la Fase 3 — es exactamente la herramienta para RNF-04, y descubrirla tú al estrellarte con el problema vale más que si te la dijera ahora con todo el detalle.

---

## 5. Multi-tenancy: cómo se aísla

Estrategia recomendada para empezar: **base de datos compartida, esquema compartido, discriminada por `tenant_id`**.
- Toda tabla de negocio lleva `tenant_id`.
- Toda query DEBE filtrar por `tenant_id`. Sin excepción.
- El riesgo: olvidar el filtro en una query = fuga entre tenants (viola RNF-08). 

Mitigaciones a considerar (decisión para la Fase 7): una capa de repositorio que inyecte el `tenant_id` automáticamente, o políticas a nivel de base de datos (row-level security de Postgres) que lo garanticen incluso si el código falla. La segunda es más robusta; investígala cuando llegues ahí.

> Alternativas (un esquema por tenant, una DB por tenant) dan más aislamiento pero más complejidad operativa. Para una PYME-SaaS al inicio, la discriminada por columna es el equilibrio correcto. Si algún día un cliente enorme exige aislamiento físico, se migra. No optimices para ese caso hoy.

---

## 6. Estados de una cita (máquina de estados)

```
   [pendiente] ──confirmar──> [confirmada] ──completar──> [completada]
       │                          │
       └──cancelar──> [cancelada] <┘
```

- Al pasar a **confirmada**, los recursos quedan reservados (filas en APPOINTMENT_RESOURCE).
- Al pasar a **cancelada**, los recursos se liberan (RF-09).
- **completada** es terminal (la cita ya ocurrió).
- Modela RF-16. Define qué transiciones son válidas y hazlas explícitas en el código de dominio.

---

## 7. Índices y rendimiento (cuándo preocuparte)

No optimices índices al inicio. Pero ten presente desde el diseño:
- Las queries más frecuentes serán "dame las reservas de estos recursos en este rango de tiempo". Ese patrón (recurso + rango temporal) querrá índices apropiados.
- El filtro por `tenant_id` está en casi todo: considéralo en los índices compuestos.
- Esto se afina en la Fase 9 (rendimiento), no antes. Diséñalo consciente, optimízalo cuando midas.

---

## 8. Resumen de tablas (mapa rápido)

| Tabla | Propósito | Fase donde aparece |
|---|---|---|
| `tenant` | El negocio | 0-1 (estructura), 7 (auth real) |
| `resource_type` | Categorías de recurso | 1 |
| `resource` | Recursos concretos | 1 |
| `resource_availability` | Horarios de recursos | 1 |
| `service` | Tipos de cita | 1 |
| `service_requirement` | Qué necesita un servicio | 1 |
| `resource_attribute` / `requirement_attribute` | Habilidades/atributos (el híbrido) | 1-2 |
| `appointment` | Citas | 3 |
| `appointment_resource` | Recursos reservados por cita | 3 |
| `user` / `role` | Usuarios del negocio | 7 |
| `subscription` / `plan` | Monetización | 8 |

---

**Anterior:** [03 — Arquitectura](./03-arquitectura.md) · **Siguiente:** [05 — Features y Criterios](./05-features-y-criterios.md)