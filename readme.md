# OptiSlot

> Scheduling inteligente con recursos restringidos. Un motor de optimización de asignación de recursos y citas, empaquetado como SaaS para PYMEs.

[![Repo](https://img.shields.io/badge/GitHub-OptiSlot-181717?logo=github)](https://github.com/CristianGarcia21/OptiSlot)

![Rust](https://img.shields.io/badge/Rust-000000?logo=rust&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![axum](https://img.shields.io/badge/axum-000000?logo=rust&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)

<!-- TODO: añade badges de CI, licencia, versión, etc. cuando los tengas. -->
<!-- Si usas TypeScript o una herramienta concreta en el frontend, añade su badge:
     ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
     ![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white) -->

---

## ¿Qué es esto?

Los negocios pequeños con citas y recursos que se cruzan (personal + salas + equipos) no tienen una herramienta que los agende respetando todas sus reglas y aprovechando bien sus recursos. Los calendarios genéricos son tontos; los ERP, caros. OptiSlot llena ese hueco con un motor de optimización de verdad.

El corazón técnico es un problema de satisfacción de restricciones y optimización combinatoria — no un CRUD. La documentación completa del diseño está en [`/docs`](./docs).

**Stack:** React (frontend) · Rust (backend + motor de optimización) · PostgreSQL

---

## Estructura del monorepo

```
OptiSlot/
├── frontend/          # SPA en React (portal público + panel interno)
├── backend/           # API en Rust (axum) + motor solver
├── docs/              # Documentación de ingeniería (empieza por docs/00-indice.md)
├── docker-compose.yml # Postgres (y servicios de apoyo) para desarrollo local
└── README.md
```

<!-- TODO: ajusta los nombres de carpeta a como realmente los subiste (puede ser apps/web, apps/api, etc.) -->

---

## Requisitos previos

Antes de arrancar necesitas instalado:

- **Rust** — <!-- TODO: fija la versión/toolchain que uses, ej: stable vía rustup -->
- **Node.js** — <!-- TODO: fija la versión, ej: 20 LTS -->
- **Docker** y **Docker Compose** — para levantar PostgreSQL local sin instalarlo a mano
- **PostgreSQL** — <!-- TODO: versión objetivo, ej: 16 -->

<!-- TODO: si decides usar herramientas extra (sqlx-cli, just, cargo-watch, pnpm...), lístalas aquí -->

---

## Puesta en marcha (desarrollo local)

### 1. Clonar el repositorio

```bash
git clone https://github.com/CristianGarcia21/OptiSlot.git
cd OptiSlot
```

### 2. Levantar la base de datos

```bash
docker compose up -d
```

<!-- TODO: confirma que tu docker-compose.yml expone Postgres y en qué puerto. Documenta aquí el puerto y credenciales de desarrollo. -->

### 3. Configurar variables de entorno

Cada proyecto necesita su configuración. Copia los ejemplos y ajusta:

```bash
# backend
cp backend/.env.example backend/.env

# frontend
cp frontend/.env.example frontend/.env
```

<!-- TODO: crea los archivos .env.example en cada carpeta con las claves necesarias (DATABASE_URL, puerto del API, URL del backend para el front, etc.). NUNCA subas los .env reales al repo. -->

### 4. Backend (Rust)

```bash
cd backend
# TODO: comandos reales de tu setup. Plantilla típica:
# sqlx migrate run        # aplicar migraciones
# cargo run               # levantar el servidor
```

<!-- TODO: documenta el comando exacto para correr migraciones y arrancar el servidor. Si usas cargo-watch para recarga en caliente, anótalo. -->

El API quedará disponible en <!-- TODO: http://localhost:PUERTO -->.

### 5. Frontend (React)

```bash
cd frontend
# TODO: comandos reales según tu herramienta (npm/pnpm/yarn + vite/next/etc.):
# npm install
# npm run dev
```

<!-- TODO: documenta el gestor de paquetes y el comando de desarrollo que elegiste. -->

La SPA quedará disponible en <!-- TODO: http://localhost:PUERTO -->.

---

## Verificar que todo arranca

<!-- TODO: cuando termines el Sprint 0, describe aquí el "humo" que confirma que el stack vive de punta a punta:
     ej: "abre el frontend, haz clic en X, y verifica que aparece un registro en Postgres". -->

---

## Pruebas

```bash
# backend
cd backend
# TODO: cargo test (o el comando que uses)

# frontend
cd frontend
# TODO: comando de tests del front
```

La estrategia de testing (qué probar y dónde concentrar el esfuerzo) está en [`docs/09-estrategia-testing.md`](./docs/09-estrategia-testing.md). Las dos suites innegociables son **integridad de reservas** (no doble-reserva) y **aislamiento de tenant**.

---

## Documentación

Toda la ingeniería de software del proyecto vive en [`/docs`](./docs). Orden de lectura recomendado:

| # | Documento | Qué responde |
|---|---|---|
| 00 | [Índice](./docs/00-indice.md) | Puerta de entrada y resumen del proyecto. |
| 01 | [Visión y Problema](./docs/01-vision-y-problema.md) | Qué problema resuelve y por qué importa. |
| 02 | [Requisitos](./docs/02-requisitos.md) | Qué debe hacer y cómo de bien. |
| 03 | [Arquitectura](./docs/03-arquitectura.md) | Cómo se estructura técnicamente. |
| 04 | [Modelo de Datos](./docs/04-modelo-de-datos.md) | Cómo se guardan los datos y por qué. |
| 05 | [Features y Criterios](./docs/05-features-y-criterios.md) | Qué construir y cómo saber que está bien. |
| 06 | [Planeación de Sprints](./docs/06-planeacion-sprints.md) | En qué orden y ritmo construirlo. |
| 07 | [Decisiones (ADRs)](./docs/07-decisiones-arquitectonicas.md) | Por qué se eligió cada cosa. |
| 08 | [Diseño de API](./docs/08-diseno-api.md) | Contratos de endpoints. |
| 09 | [Estrategia de Testing](./docs/09-estrategia-testing.md) | Cómo se verifica que funciona. |
| 10 | [Diccionario de Dominio](./docs/10-diccionario-dominio.md) | Vocabulario, estados y errores. |

---

## Estado del proyecto

<!-- TODO: ve marcando el avance por sprints. Plantilla: -->

- [ ] Sprint 0 — Andamiaje (React → Rust → Postgres → React)
- [ ] Sprint 1 — Modelo del dominio
- [ ] Sprint 2 — Solver v0: factibilidad
- [ ] Sprint 3 — Agendar de verdad (reservas + concurrencia)
- [ ] Sprint 4 — Portal público
- [ ] Sprint 5 — Solver inteligente (optimización)
- [ ] Sprint 6 — Notificaciones asíncronas
- [ ] Sprint 7 — Multi-tenancy y cuentas
- [ ] Sprint 8 — Monetización
- [ ] Sprint 9 — Pulido y segundo vertical

---

## Roadmap conceptual

```
  Sprint 0-1  ──  andamiaje y dominio     (base sólida, rápido)
  Sprint 2-5  ──  EL CORAZÓN              (solver: factibilidad → optimización)
  Sprint 6-9  ──  producto de verdad      (async, multi-tenancy, billing, 2º vertical)
```

El pico de aprendizaje está en el Sprint 5 (el solver inteligente).

---

## Licencia

<!-- TODO: elige una licencia. Si piensas monetizar a futuro, infórmate sobre las implicaciones de cada una (MIT, Apache-2.0, o propietaria). -->

---

## Autor

[Cristian García](https://github.com/CristianGarcia21)