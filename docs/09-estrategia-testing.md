# 09 — Estrategia de Testing

> **Propósito:** definir *cómo* verificas que el sistema funciona, no solo *qué* debe hacer. Los criterios de aceptación (doc 05) dicen qué probar; este documento dice cómo, con qué tipo de prueba, y dónde concentrar el esfuerzo. Testear no es burocracia: en este proyecto, donde "no doble-reservar" es innegociable, los tests son lo único que te deja *dormir tranquilo* tras un cambio.

---

## 1. Filosofía de testing para este proyecto

No vas a testear todo al 100% — eso es irreal trabajando solo y aprendiendo. La estrategia es **testear donde el fallo duele más**, no donde es más fácil:

```
        Esfuerzo de testing   →   concentrado aquí
                                        │
   El SOLVER  ████████████████████████  (lógica pura, crítica, testeable)
   Concurrencia ███████████████          (innegociable RNF-04)
   Aislamiento tenant ██████████████     (innegociable RNF-08)
   Lógica de dominio ████████            (reglas de negocio)
   Endpoints API ████                    (integración, los caminos clave)
   UI React ██                           (lo mínimo: que no explote)
```

La forma de la pirámide importa: **muchas pruebas pequeñas y rápidas del solver y la lógica; pocas y selectas de integración; mínimas de UI.** Lo invertido (mucho test de UI, poco de núcleo) es el antipatrón clásico — lento, frágil, y deja el corazón sin proteger.

---

## 2. Los tipos de prueba y dónde aplicarlos

### Pruebas unitarias — el grueso, sobre el solver y el dominio
Prueban una pieza aislada, sin base de datos ni red. Son rápidas y abundantes.

**Dónde concentrarlas:**
- **El solver** (su mayor activo de testing). Como lo diseñaste puro y aislado (doc 03), puedes lanzarle problemas en memoria y verificar la solución sin levantar nada. Cada criterio de F-04 y F-07 es una prueba unitaria.
- **La lógica de solapamiento de intervalos.** Aquí viven los bugs sutiles. Prueba exhaustivamente: intervalos que se tocan en el borde (no se solapan), contenidos, idénticos, adyacentes con y sin buffer.
- **La máquina de estados de citas.** Cada transición válida e inválida es una prueba.

### Pruebas de integración — los caminos críticos de extremo a extremo
Prueban varias piezas juntas, normalmente con una base de datos real (de prueba).

**Dónde concentrarlas:**
- **Reserva atómica** (F-05): crear una cita reserva recursos en la DB correctamente.
- **El flujo de reserva pública** completo (F-11): disponibilidad → reserva → aparece en agenda.
- **Aislamiento de tenant** (F-15): un tenant pidiendo datos jamás recibe los de otro, por ninguna ruta.

### Pruebas de concurrencia — pocas pero vitales
Las más difíciles de escribir y las más importantes aquí.

**El test que no puede faltar:** lanzar dos (o N) reservas simultáneas por el último recurso libre en el mismo intervalo, y verificar que **exactamente una** tiene éxito. Este test valida RNF-04, el corazón de la integridad del producto. Si este test pasa de forma confiable, tu sistema es serio. Escríbelo en cuanto implementes reservas (Sprint 3) y córrelo siempre.

### Pruebas de la API — los contratos
Verifican que los endpoints respetan el contrato del doc 08: códigos de estado correctos, formato de error consistente, los códigos de negocio adecuados (`resource_conflict`, etc.).

### Pruebas de UI — el mínimo viable
No te obsesiones aquí. Lo justo para que los flujos principales no se rompan silenciosamente. El esfuerzo serio va al backend.

---

## 3. Pruebas por sprint (qué testear en cada fase)

| Sprint | Qué testear como prioridad | Tipo |
|---|---|---|
| 0 | Que el camino React→Rust→DB→React vive. | Integración mínima (humo). |
| 1 | Validaciones del modelo (servicio con tipo inexistente se rechaza). | Unitaria + API. |
| 2 | **El solver de factibilidad.** Todos los criterios de F-04. La lógica de solapamiento. | Unitaria (mucha). |
| 3 | **Concurrencia de reservas (RNF-04).** Reserva/liberación atómica. Máquina de estados. | Concurrencia + integración. |
| 4 | Disponibilidad correcta (huecos mostrados = huecos reservables). Flujo público. | Integración. |
| 5 | **Optimalidad del solver** (la solución es medible-mente mejor). Rendimiento (RNF-01/02/03). | Unitaria + benchmark. |
| 6 | Idempotencia de notificaciones (no duplica, no pierde). Reintentos. | Integración. |
| 7 | **Aislamiento de tenant (RNF-08)**, incluso con IDs manipulados. Hashing de contraseñas. | Integración + seguridad. |
| 8 | Enforcement de límites. Estados de suscripción ante webhooks. | Integración. |
| 9 | El solver bajo carga. Regresión general. | Benchmark + regresión. |

---

## 4. Las dos suites innegociables

Si solo mantuvieras dos conjuntos de pruebas, serían estos. Córrelos antes de cada merge:

### Suite "Integridad de reservas" (RNF-04)
- Solapamientos detectados correctamente en todos los casos borde.
- Reserva atómica: o se reserva todo o nada (no estados a medias).
- Concurrencia: N reservas simultáneas por el último hueco → exactamente una gana.
- Cancelación libera recursos y el hueco vuelve a estar disponible.

### Suite "Aislamiento de tenant" (RNF-08)
- Un tenant nunca lista datos de otro.
- Acceso directo por ID a un recurso de otro tenant → rechazado (como `not_found`).
- Ninguna ruta de la API (interna) filtra datos cruzados.

Estas dos suites son tu red de seguridad. Un fallo aquí bloquea el merge, sin excepción.

---

## 5. Cómo el solver aislado te regala testing fácil

Vale la pena insistir en esto porque es una consecuencia hermosa de una buena decisión de arquitectura: como el solver no toca DB ni red (doc 03), testearlo es trivial conceptualmente. Construyes un escenario en memoria ("2 terapeutas, 1 sala, estas citas existentes"), le preguntas algo, y verificas la respuesta. Sin mocks complicados, sin base de datos, sin esperar. Esto significa que puedes tener **cientos** de pruebas del solver corriendo en segundos. Esa es la recompensa de haberlo aislado — la pureza arquitectónica se paga sola en testabilidad.

Si en algún momento te cuesta mucho testear el solver, es señal de que se está acoplando con cosas que no debería. El dolor de testing es un detector de mala arquitectura.

---

## 6. Datos de prueba y escenarios

Mantén un conjunto de **escenarios de negocio realistas** reutilizables: la clínica de fisio del doc 01 (3 terapeutas, 2 salas, 1 ultrasonido, sus servicios y reglas) es tu escenario canónico. Tener escenarios fijos y nombrados hace tus pruebas legibles ("dado el escenario clínica-base...") y te evita reconstruir el mundo en cada test.

Considera, llegando a la Fase 5, generar escenarios grandes para probar rendimiento y encontrar casos donde el solver se degrada — ahí aprendes sus límites.

---

## 7. Qué NO hacer

- **No persigas cobertura del 100%.** Es un espejismo que consume tiempo sin proporción al valor. Cubre lo crítico bien, lo trivial poco.
- **No testees getters/setters ni código sin lógica.** Testea decisiones, no plomería.
- **No escribas tests frágiles de UI** que se rompen con cada cambio de estilo. Prueba comportamiento, no apariencia.
- **No pospongas el test de concurrencia** "para cuando funcione lo demás". Escríbelo con la feature; es el que más probabilidad tiene de revelar un defecto grave.

---

## 8. La regla práctica para trabajo solo

Como trabajas solo, no tienes a nadie que revise tu código. Los tests son **tu revisor**. Una feature no está "hecha" (doc 05) hasta que sus criterios de aceptación tienen pruebas que pasan. Esto reemplaza el "lo probé a mano y parecía andar" — que es justo el hábito que produce los bugs que aparecen tres semanas después sin que sepas qué los causó.

Regla simple: **cada bug que encuentres y arregles, conviértelo primero en un test que falle, luego arréglalo.** Así ese bug nunca vuelve sin que te enteres. Es la forma más barata de construir una red de seguridad con el tiempo.

---

**Anterior:** [08 — Diseño de API](./08-diseno-api.md) · **Siguiente:** [10 — Diccionario de Dominio](./10-diccionario-dominio.md)