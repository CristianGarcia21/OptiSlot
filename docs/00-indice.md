# Documentación del Proyecto — SaaS de Scheduling Inteligente

> Motor de optimización de asignación de recursos y citas, vendido como producto de scheduling para PYMEs.
> **Stack:** React · Rust · PostgreSQL · **Filosofía:** construido a mano, por features, para aprender de verdad.

---

## Cómo leer esta documentación

Está ordenada para llevarte del **entendimiento del problema** a la **ejecución**, en ese orden. No saltes al código sin pasar por aquí — el punto de estos documentos es que entiendas el problema y la solución con tanta claridad que el desarrollo sea cuestión de ejecutar, no de improvisar.

| # | Documento | Qué responde | Cuándo leerlo |
|---|---|---|---|
| 01 | [Visión y Problema](./01-vision-y-problema.md) | ¿Qué problema resuelvo y por qué importa? | Primero. Antes que nada. |
| 02 | [Requisitos](./02-requisitos.md) | ¿Qué debe hacer y cómo de bien? | Tras entender el problema. |
| 03 | [Arquitectura](./03-arquitectura.md) | ¿Cómo se estructura técnicamente? | Antes de diseñar el código. |
| 04 | [Modelo de Datos](./04-modelo-de-datos.md) | ¿Cómo se guardan los datos y por qué así? | Antes del Sprint 1. |
| 05 | [Features y Criterios](./05-features-y-criterios.md) | ¿Qué construyo exactamente y cómo sé que está bien? | Consulta continua durante cada sprint. |
| 06 | [Planeación de Sprints](./06-planeacion-sprints.md) | ¿En qué orden y ritmo lo construyo? | Al planear cada sprint. |
| 07 | [Decisiones Arquitectónicas](./07-decisiones-arquitectonicas.md) | ¿Por qué elegí cada cosa? | Cuando tomes cada decisión grande. |
| 08 | [Diseño de API](./08-diseno-api.md) | ¿Qué endpoints existen y qué contrato cumplen? | Antes de implementar cada feature con API. |
| 09 | [Estrategia de Testing](./09-estrategia-testing.md) | ¿Cómo verifico que funciona y dónde concentro el esfuerzo? | Al escribir pruebas en cada sprint. |
| 10 | [Diccionario de Dominio](./10-diccionario-dominio.md) | ¿Cómo se llama todo, qué estados y errores existen? | Consulta continua para mantener consistencia. |

---

## El proyecto en una página

**El problema:** los negocios pequeños con citas y recursos limitados que se cruzan (personal + salas + equipos) no tienen herramienta que los agende respetando todas sus reglas y aprovechando bien sus recursos. Los calendarios genéricos son tontos; los ERP, caros.

**La solución:** un SaaS con un motor de optimización de verdad que entiende recursos, restricciones y objetivos, con portal público de reservas, en autoservicio y asequible.

**La tesis:** *motor genérico, producto afilado.* El corazón resuelve asignación con restricciones para cualquier dominio; el producto se vende concreto a un vertical (clínicas), y luego se clona a otros reusando el motor.

**El corazón técnico:** un problema de satisfacción de restricciones y optimización combinatoria. No es CRUD. Es donde el proyecto deja de ser tutorial y se vuelve ingeniería.

---

## Las dos reglas innegociables del proyecto

Si todo lo demás fallara, estas dos no pueden fallar:

1. **RNF-04 — Nunca una doble-reserva.** Dos citas jamás toman el mismo recurso en intervalos solapados, ni bajo concurrencia. (Ver ADR-003.)
2. **RNF-08 — Aislamiento de tenants perfecto.** Un negocio jamás ve datos de otro, bajo ninguna ruta. (Ver ADR-006.)

Un fallo en cualquiera de estas no es un bug: es un defecto de producto.

---

## El recorrido de aprendizaje (dónde está el oro)

```
  Sprint 0-1 ──── andamiaje y dominio ──── [base, hazlo bien pero rápido]
       │
  Sprint 2-5 ──── EL CORAZÓN ──────────── [aquí vive el 80% del aprendizaje]
       │           solver: factibilidad → optimización
       │
  Sprint 6-9 ──── producto de verdad ───── [async, multi-tenancy, billing, 2º vertical]
```

**El pico:** el Sprint 5 (solver inteligente) es lo más difícil y lo más formativo. Tu base de Investigación de Operaciones es tu ventaja ahí. Es donde más te vas a estrellar y más vas a crecer.

---

## El pacto anti-vibecoding

Estos documentos te dicen **qué** construir y **por qué**, nunca el **cómo** detallado. El cómo lo descubres tú. El método:

1. Lee el objetivo y el "reto nuevo" de la fase.
2. Intenta. Diséñalo. Estréllate.
3. Cuando lleves un buen rato trabado en *un punto concreto* (no a los 5 minutos), trae *ese* punto específico para desglosarlo juntos.
4. Una rama por feature, commits pequeños, criterios de aceptación como definición de "hecho".
5. Lleva tu bitácora. En 6 meses te mostrará cuánto avanzaste.

---

*Documentación viva: actualízala cuando la realidad contradiga al plan. Un documento que miente es peor que ninguno.*