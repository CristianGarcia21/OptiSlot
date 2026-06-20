# 07 — Registro de Decisiones Arquitectónicas (ADRs)

> **Propósito:** un ADR (Architecture Decision Record) registra *una decisión importante*, el contexto en que se tomó, las alternativas, y las consecuencias. Su valor real aparece meses después, cuando tu yo futuro pregunta "¿por qué demonios hice esto así?" y aquí está la respuesta.

> **Cómo usar este documento:** la mayoría de estos ADRs están **pendientes** a propósito — son decisiones que TÚ tomarás al llegar a la fase correspondiente, después de estrellarte con el problema real. No los decido por ti; te dejo el contexto y las opciones para que decidas con criterio y registres tu razón. Esa es la parte de ingeniería de software que de verdad te forma.

---

## Formato de un ADR

```
## ADR-XXX — [Título de la decisión]
- Estado: [Propuesto | Aceptado | Pendiente | Reemplazado por ADR-YYY]
- Fecha: [cuándo lo decidiste]
- Contexto: ¿qué problema o necesidad fuerza esta decisión?
- Opciones consideradas: las alternativas reales, con sus pros/contras.
- Decisión: qué elegiste.
- Consecuencias: qué ganas, qué sacrificas, qué se vuelve más difícil después.
```

---

## ADR-001 — Estructura del repositorio (monorepo vs multi-repo)
- **Estado:** Pendiente (decídelo en Sprint 0)
- **Contexto:** El proyecto tiene frontend (React) y backend (Rust). Hay que decidir si viven en un mismo repositorio o separados.
- **Opciones consideradas:**
  - *Monorepo:* todo junto. Más simple de coordinar, un solo historial, fácil de versionar cambios que cruzan front y back. Puede volverse grande.
  - *Multi-repo:* separados. Más limpio conceptualmente, despliegues independientes, pero coordinar cambios que tocan ambos es más fricción.
- **Decisión:** _[tú la escribes]_
- **Consecuencias:** _[tú las escribes — pista: para un solo dev, el monorepo suele reducir fricción]_

---

## ADR-002 — Modelado de restricciones de servicios (rígido vs híbrido)
- **Estado:** Pendiente (decídelo en Sprint 1)
- **Contexto:** Los servicios tienen requisitos de recursos que varían mucho entre negocios. Necesitas un modelo que sea expresivo sin volverse ingobernable (ver documento 04, sección 3).
- **Opciones consideradas:**
  - *Tablas rígidas:* claro, validable, rápido. Cada nueva clase de regla exige migración.
  - *JSON flexible:* expresa cualquier cosa, pero sin garantías, queries complejas, bugs ocultos.
  - *Híbrido (recomendado en doc 04):* tablas rígidas para lo común, sistema de atributos/etiquetas para lo variable.
- **Decisión:** _[tú la escribes tras intentar modelar 3-4 servicios reales distintos]_
- **Consecuencias:** _[tú las escribes]_

---

## ADR-003 — Prevención de doble-reserva concurrente
- **Estado:** Pendiente (decídelo en Sprint 3)
- **Contexto:** RNF-04 es innegociable: dos reservas no pueden tomar el mismo recurso en intervalos solapados, ni siquiera bajo concurrencia. Esta es una de las decisiones más importantes del proyecto.
- **Opciones consideradas:**
  - *Bloqueo pesimista:* bloqueas los recursos al reservar. Seguro pero puede limitar concurrencia.
  - *Bloqueo optimista:* asumes que no habrá conflicto y verificas al final; reintentas si lo hubo.
  - *Restricción de exclusión en Postgres (tipos de rango):* la base de datos hace *imposible* el solapamiento a nivel de constraint. Muy robusto.
- **Decisión:** _[tú la escribes tras estrellarte con el problema real de concurrencia]_
- **Consecuencias:** _[tú las escribes — esta decisión afecta rendimiento y garantías]_

---

## ADR-004 — Solver propio vs librería de constraint solving
- **Estado:** Pendiente (decídelo en Sprint 5)
- **Contexto:** Al pasar de factibilidad a optimización, el solver se vuelve serio. ¿Construyes el algoritmo tú (backtracking, poda, metaheurística) o usas un crate de constraint programming existente?
- **Opciones consideradas:**
  - *Solver propio:* aprendes muchísimo (es el punto del proyecto), control total, pero más lento de construir y posiblemente menos eficiente al inicio.
  - *Crate existente:* más rápido a producción, probablemente más eficiente, pero aprendes menos del núcleo algorítmico y dependes de su modelo.
- **Decisión:** _[tú la escribes — considera tu objetivo de equilibrio aprender/monetizar]_
- **Consecuencias:** _[tú las escribes — pista: podrías empezar propio para aprender y migrar si el rendimiento lo exige; documenta esa estrategia]_

---

## ADR-005 — Sistema de cola de tareas
- **Estado:** Pendiente (decídelo en Sprint 6)
- **Contexto:** Las notificaciones deben enviarse fuera del ciclo request-respuesta, con reintentos e idempotencia.
- **Opciones consideradas:**
  - *Tabla en Postgres como cola:* simple, sin infraestructura nueva, suficiente al inicio. Menos eficiente a gran escala.
  - *Sistema de cola dedicado:* más robusto y escalable, pero suma una pieza de infraestructura que operar.
- **Decisión:** _[tú la escribes — pista: empieza simple, migra si el volumen lo justifica]_
- **Consecuencias:** _[tú las escribes]_

---

## ADR-006 — Estrategia de aislamiento de tenants
- **Estado:** Pendiente (decídelo en Sprint 7)
- **Contexto:** RNF-08 innegociable: aislamiento perfecto entre negocios. El riesgo es olvidar el filtro de tenant en alguna query.
- **Opciones consideradas:**
  - *Filtro por `tenant_id` a nivel de aplicación:* simple, pero depende de no olvidarlo nunca (frágil ante error humano).
  - *Row-Level Security de Postgres:* la base de datos garantiza el aislamiento aunque el código falle. Más robusto, más complejo de configurar.
  - *Esquema o DB por tenant:* aislamiento físico, máxima seguridad, máxima complejidad operativa.
- **Decisión:** _[tú la escribes]_
- **Consecuencias:** _[tú las escribes — esta decisión es de seguridad: ponderala con cuidado]_

---

## Decisiones ya tomadas (contexto del proyecto)

Estas no son ADRs "pendientes" — son las elecciones de partida que justifican el stack. Las registro como aceptadas para que conste el porqué.

## ADR-000a — Rust para el backend
- **Estado:** Aceptado
- **Contexto:** El núcleo del sistema es un motor de optimización con cómputo intenso. Se buscaba además un campo de aprendizaje nuevo.
- **Decisión:** Rust.
- **Consecuencias:** Rendimiento sin recolector de basura y seguridad de memoria, ideal para el solver. Curva de aprendizaje más pronunciada (parte del objetivo formativo). Ecosistema web menos "plug-and-play" que otros, lo que obliga a entender más — bueno para aprender.

## ADR-000b — React para el frontend
- **Estado:** Aceptado
- **Contexto:** El desarrollador domina JS; la UI necesita componentes ricos (calendarios, dashboards).
- **Decisión:** React.
- **Consecuencias:** Aprovecha la fortaleza existente, ecosistema maduro para UI compleja. El foco de aprendizaje queda en el backend, lo cual es deliberado.

## ADR-000c — PostgreSQL como base de datos
- **Estado:** Aceptado
- **Contexto:** Se necesitan transacciones serias (no doble-reserva), tipos ricos (rangos de tiempo), y madurez.
- **Decisión:** PostgreSQL.
- **Consecuencias:** Soporte transaccional fuerte y tipos de rango/exclusión que resuelven elegantemente el problema central de reservas. Es la elección estándar y robusta para este tipo de sistema.

---

## Por qué este documento te importa más de lo que crees

Cuando trabajas solo, eres tu propio arquitecto, y también el único que sufre tus decisiones a futuro. Sin un registro, dentro de tres meses vas a mirar una parte rara del código y no vas a recordar si fue una decisión pensada o un parche apurado. Los ADRs te dan **memoria de tus propias razones**. Además, llenarlos te obliga a *decidir conscientemente* en vez de dejar que el código "simplemente pase" — que es exactamente el hábito que te aleja del vibecoding y te acerca a ser ingeniero.

Llena cada ADR pendiente *cuando tomes la decisión*, no antes. Escríbelo tú. Esa es la práctica.

---

**Anterior:** [06 — Planeación de Sprints](./06-planeacion-sprints.md) · **Siguiente:** [08 — Diseno Api](08-diseno-api.md)