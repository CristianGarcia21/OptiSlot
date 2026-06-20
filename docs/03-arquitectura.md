# 03 — Arquitectura del Sistema

> **Propósito:** describir la estructura técnica del sistema, las decisiones grandes y *por qué* se tomaron. La arquitectura no es dibujar cajas bonitas; es decidir dónde vive cada responsabilidad y qué se puede cambiar sin romper todo.

---

## 1. Vista de alto nivel (el sistema en una imagen mental)

```
   ┌──────────────────┐        ┌──────────────────┐
   │  Cliente final   │        │   Staff / Dueño  │
   │  (navegador)     │        │   (navegador)    │
   └────────┬─────────┘        └─────────┬────────┘
            │                            │
            │  HTTP/JSON                 │  HTTP/JSON
            ▼                            ▼
   ┌─────────────────────────────────────────────────┐
   │              FRONTEND (React SPA)                │
   │  Portal público de reservas + Panel interno      │
   └────────────────────────┬────────────────────────┘
                            │  API REST (JSON)
                            ▼
   ┌─────────────────────────────────────────────────┐
   │                BACKEND (Rust)                    │
   │                                                  │
   │  ┌────────────┐  ┌──────────────┐  ┌──────────┐  │
   │  │ Capa API   │  │  Lógica de   │  │  MOTOR   │  │
   │  │ (handlers) │──│   dominio    │──│  SOLVER  │  │
   │  └────────────┘  └──────┬───────┘  └──────────┘  │
   │                         │                        │
   │  ┌──────────────────────┴───────────────────┐   │
   │  │        Capa de persistencia (repos)        │   │
   │  └────────────────────┬───────────────────────┘   │
   └───────────────────────┼─────────────────────────┘
                          │
            ┌─────────────┴──────────────┐
            ▼                            ▼
   ┌─────────────────┐         ┌──────────────────┐
   │   PostgreSQL    │         │  Cola de tareas  │
   │  (datos)        │         │  (notificaciones)│
   └─────────────────┘         └──────────────────┘
```

## 2. Decisiones tecnológicas (con justificación)

Cada elección aquí tiene un **ADR** completo en el documento 07. Resumen:

| Capa | Elección | Por qué (corto) |
|---|---|---|
| Frontend | **React** | Tu fortaleza es JS. Ecosistema maduro para UI rica (calendarios, dashboards). |
| Backend | **Rust** | El motor de optimización es cómputo intenso: Rust da rendimiento sin GC y seguridad de memoria. Es el campo nuevo que quieres aprender. |
| Framework web Rust | **axum** | Estándar actual, ergonómico, del ecosistema tokio. |
| Acceso a datos | **sqlx** | SQL real (aprendes SQL de verdad), queries verificadas en compile-time. |
| Base de datos | **PostgreSQL** | Transacciones serias (clave para no doble-reservar), tipos ricos, maduro. |
| Cola de tareas | **A definir en Fase 6** | Para notificaciones asíncronas. Opciones: tabla en Postgres como cola simple, o un sistema dedicado. |

## 3. Las tres responsabilidades del backend (separación clave)

El backend Rust se organiza en tres capas con responsabilidades estrictas. **Esta separación es la decisión arquitectónica más importante del proyecto** (RNF-11):

### Capa API (handlers)
- Recibe peticiones HTTP, valida entrada, serializa salida.
- **No** contiene lógica de negocio. Es un traductor entre HTTP y el dominio.
- Si mañana quisieras exponer el sistema por gRPC en vez de REST, solo cambiarías esta capa.

### Lógica de dominio
- Las reglas del negocio: crear una cita, validar, cancelar, liberar recursos.
- Orquesta al solver y a la persistencia.
- **No** sabe de HTTP ni de SQL. Habla en términos del dominio (citas, recursos, servicios).

### Motor / Solver
- El corazón. Resuelve factibilidad y optimización.
- **Totalmente puro y aislado:** recibe el estado del problema (recursos, restricciones, citas) como estructuras de datos en memoria, y devuelve asignaciones. No toca la base de datos ni la red.
- Esto permite **testearlo sin levantar nada** (RNF-12): le das un problema, verificas la solución. Es lo que lo hace confiable.

> **Por qué importa esta pureza:** el solver es lo más difícil y lo más crítico. Si estuviera entrelazado con SQL y HTTP, no podrías razonar sobre él ni testearlo bien. Aislado, puedes lanzarle miles de casos de prueba y demostrar que es correcto. Esta es la diferencia entre un solver "que parece funcionar" y uno en el que confías.

## 4. Modelo C4 — niveles de zoom

### Nivel 1 — Contexto
El sistema completo es una caja. Interactúan: el **cliente final**, el **staff/dueño**, y sistemas externos (**pasarela de pago**, **proveedor de email**).

### Nivel 2 — Contenedores
- **SPA React** (lo que corre en el navegador).
- **API Rust** (el backend con sus tres capas).
- **PostgreSQL** (datos).
- **Worker de tareas** (procesa notificaciones en segundo plano — Fase 6+).

### Nivel 3 — Componentes (dentro de la API Rust)
- Módulo de **configuración** (recursos, servicios, reglas).
- Módulo de **scheduling** (citas, agenda).
- Módulo **solver** (el motor).
- Módulo de **cuentas** (auth, tenants).
- Módulo de **billing** (planes, pagos).
- Módulo de **notificaciones**.

## 5. Flujos críticos

### Flujo A — Reserva desde el portal público
1. Cliente final elige servicio en la SPA.
2. SPA pide al backend la disponibilidad del servicio para un periodo.
3. Backend invoca al **solver** en modo "generar huecos válidos".
4. Solver devuelve huecos; backend los filtra por reglas de exposición pública (RNF-10) y responde.
5. Cliente elige un hueco y confirma.
6. Backend, en una **transacción**, vuelve a validar factibilidad (el hueco pudo ocuparse mientras el cliente decidía), reserva los recursos, y crea la cita.
7. Se encola una notificación de confirmación.

> El paso 6 es donde vive RNF-04 (no doble-reserva). La revalidación dentro de la transacción es obligatoria: la disponibilidad mostrada pudo quedar obsoleta.

### Flujo B — Generación de disponibilidad (el costoso)
Calcular *todos* los huecos válidos de un periodo es mucho más caro que validar uno. Es el flujo que estresa al solver y el que motiva, en la Fase 5, pasar de fuerza bruta a algo inteligente. Estrategias a considerar (las descubrirás al estrellarte): cacheo, cálculo incremental, poda temprana.

## 6. Decisiones diferidas (no las tomes antes de tiempo)

Estas decisiones NO se toman al inicio. Tomarlas temprano = sobre-ingeniería. Se deciden cuando el dolor las exija:

- **Cómo escalar el solver** (RNF-17): se diseña la separación que lo permita, pero no se implementa escalado real hasta tener carga.
- **Sistema de cola definitivo** (Fase 6): empezar simple (tabla en Postgres) y migrar si hace falta.
- **Cacheo de disponibilidad** (Fase 4-5): solo cuando el cálculo duela de verdad.
- **Estrategia de despliegue / infra**: irrelevante hasta tener algo que desplegar.

## 7. Principios transversales

- **El dominio es el rey.** El código se organiza alrededor de los conceptos del negocio (documento 01, glosario), no alrededor de detalles técnicos.
- **Lo difícil, aislado y testeado.** El solver vive solo y se prueba a muerte.
- **Multi-tenancy desde el modelo de datos.** Aunque la auth llega en Fase 7, el esquema contempla el tenant desde el inicio para no reescribir todo después (ver documento 04).
- **Transaccionalidad donde hay dinero o recursos.** Reservar y cobrar son operaciones atómicas, no "casi siempre correctas".

---

**Anterior:** [02 — Requisitos](./02-requisitos.md) · **Siguiente:** [04 — Modelo de Datos](./04-modelo-de-datos.md)