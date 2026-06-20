# 05 — Catálogo de Features y Criterios de Aceptación

> **Propósito:** descomponer el sistema en features concretas, cada una con descripción, los requisitos que satisface, y **criterios de aceptación** verificables. Un criterio de aceptación responde: "¿cómo sé que esto está *bien* terminado?".

**Formato de criterios:** uso el estilo Gherkin (**Dado / Cuando / Entonces**) porque obliga a pensar en escenarios concretos, no en deseos vagos. "El sistema debe ser rápido" no es un criterio; "Dado un negocio con 20 recursos, Cuando pido factibilidad, Entonces responde en < 100ms" sí lo es.

**Mapa feature → fase:** cada feature indica en qué fase del roadmap se construye.

---

## ÉPICA 1 — Configuración del negocio

### F-01 · Gestión de recursos
**Fase:** 1 · **Requisitos:** RF-01
**Descripción:** El negocio define sus recursos (personal, salas, equipos), cada uno con un tipo y disponibilidad base.

**Criterios de aceptación:**
- **Dado** que soy un negocio configurando mi cuenta, **Cuando** creo un recurso con nombre, tipo y horario, **Entonces** queda persistido y visible en mi lista de recursos.
- **Dado** un recurso existente, **Cuando** edito su disponibilidad, **Entonces** los cambios se reflejan y afectan cálculos futuros de factibilidad.
- **Dado** un recurso con citas futuras, **Cuando** intento eliminarlo, **Entonces** el sistema me advierte o impide la eliminación sin resolver esas citas.

### F-02 · Gestión de servicios y sus requisitos
**Fase:** 1 · **Requisitos:** RF-02, RF-03, RF-04
**Descripción:** El negocio define los servicios que ofrece y qué recursos consume cada uno.

**Criterios de aceptación:**
- **Dado** que defino un servicio, **Cuando** especifico que requiere "1 terapeuta + 1 sala" por 45 min, **Entonces** el sistema guarda ese requisito de forma estructurada.
- **Dado** un servicio con requisitos, **Cuando** restrinjo qué recursos concretos pueden satisfacerlo (ej: solo Ana), **Entonces** el solver respetará esa restricción.
- **Dado** un servicio mal definido (requiere un tipo de recurso que no existe), **Cuando** intento guardarlo, **Entonces** el sistema lo rechaza con un mensaje claro.

### F-03 · Reglas y restricciones (buffers, horarios)
**Fase:** 1 · **Requisitos:** RF-05, RF-06
**Descripción:** El negocio define reglas que el solver debe respetar: buffers entre citas, horarios de apertura, excepciones.

**Criterios de aceptación:**
- **Dado** un buffer de 15 min configurado para una sala, **Cuando** se agenda una cita, **Entonces** la sala queda no-disponible 15 min después del fin de la cita.
- **Dado** un horario de apertura de lunes a viernes, **Cuando** se pide disponibilidad un sábado, **Entonces** no se ofrecen huecos.

---

## ÉPICA 2 — Motor de scheduling (el corazón)

### F-04 · Validación de factibilidad (solver v0)
**Fase:** 2 · **Requisitos:** RF-07, RF-12
**Descripción:** Dada una solicitud de cita y un horario, determinar si existe una asignación válida de recursos.

**Criterios de aceptación:**
- **Dado** un servicio que requiere 1 terapeuta + 1 sala, y ambos libres a las 10:00, **Cuando** pido factibilidad a las 10:00, **Entonces** el sistema responde "factible" con la asignación concreta (qué terapeuta, qué sala).
- **Dado** que todos los terapeutas están ocupados a las 10:00, **Cuando** pido factibilidad a las 10:00, **Entonces** el sistema responde "no factible".
- **Dado** un servicio que solo Ana puede hacer, y Ana está ocupada, **Cuando** pido factibilidad, **Entonces** responde "no factible" aunque haya otros terapeutas libres.
- **Dado** una restricción de buffer, **Cuando** pido una cita que cabría sin el buffer pero no con él, **Entonces** responde "no factible".

### F-05 · Reserva y liberación de recursos
**Fase:** 3 · **Requisitos:** RF-08, RF-09
**Descripción:** Confirmar una cita reserva sus recursos atómicamente; cancelarla los libera.

**Criterios de aceptación:**
- **Dado** una cita factible, **Cuando** la confirmo, **Entonces** sus recursos quedan reservados y no disponibles para otras citas en ese intervalo.
- **Dado** una cita confirmada, **Cuando** la cancelo, **Entonces** sus recursos vuelven a estar disponibles.
- **Dado** dos solicitudes simultáneas por el último recurso libre en el mismo intervalo, **Cuando** ambas intentan confirmar, **Entonces** exactamente una tiene éxito y la otra es rechazada (RNF-04 — *innegociable*).

### F-06 · Generación de disponibilidad
**Fase:** 4 · **Requisitos:** RF-10
**Descripción:** Calcular todos los huecos válidos para un servicio en un periodo.

**Criterios de aceptación:**
- **Dado** un servicio y una semana, **Cuando** pido disponibilidad, **Entonces** recibo todos los huecos en que el servicio es factible, y ninguno en que no lo es.
- **Dado** un negocio típico (≤ 20 recursos), **Cuando** pido disponibilidad de una semana, **Entonces** la respuesta llega en < 1s (RNF-02).
- **Dado** un hueco mostrado como disponible, **Cuando** lo reservo inmediatamente, **Entonces** la reserva tiene éxito (la disponibilidad mostrada era real).

### F-07 · Optimización de asignaciones (solver inteligente)
**Fase:** 5 · **Requisitos:** RF-11
**Descripción:** Entre las asignaciones válidas, elegir la mejor según una función objetivo.

**Criterios de aceptación:**
- **Dado** varias asignaciones válidas para una cita, **Cuando** el objetivo es "balancear carga del personal", **Entonces** el sistema elige el recurso menos cargado.
- **Dado** un conjunto de citas pendientes, **Cuando** ejecuto la optimización de agenda, **Entonces** la solución producida tiene una métrica objetivo medible-mente mejor que la asignación ingenua.
- **Dado** un problema de tamaño típico, **Cuando** optimizo, **Entonces** termina en < 10s o se mueve a segundo plano (RNF-03).

---

## ÉPICA 3 — Agenda interna

### F-08 · Vista de calendario del staff
**Fase:** 3 · **Requisitos:** RF-13
**Descripción:** El staff ve las citas en un calendario por día/semana y por recurso.

**Criterios de aceptación:**
- **Dado** citas agendadas, **Cuando** abro el calendario, **Entonces** veo cada cita en su horario y recurso correctos.
- **Dado** la vista semanal, **Cuando** cambio de semana, **Entonces** veo las citas de esa semana sin recargar toda la página.

### F-09 · Gestión manual de citas
**Fase:** 3 · **Requisitos:** RF-14, RF-15, RF-16
**Descripción:** El staff crea, mueve y cancela citas, con el sistema impidiendo conflictos.

**Criterios de aceptación:**
- **Dado** un hueco libre, **Cuando** el staff crea una cita ahí, **Entonces** se agenda y reserva recursos.
- **Dado** una cita existente, **Cuando** el staff la mueve a un horario con conflicto de recursos, **Entonces** el sistema lo impide y explica por qué.
- **Dado** una cita, **Cuando** el staff cambia su estado, **Entonces** la transición respeta la máquina de estados (no se puede "completar" una cita cancelada).

---

## ÉPICA 4 — Portal público de reservas

### F-10 · Página pública del negocio
**Fase:** 4 · **Requisitos:** RF-17
**Descripción:** Página pública donde el cliente final ve los servicios y elige uno.

**Criterios de aceptación:**
- **Dado** un negocio con servicios públicos, **Cuando** un visitante anónimo abre su página, **Entonces** ve los servicios reservables (y solo esos).
- **Dado** la página pública, **Cuando** la cargo, **Entonces** NO se expone información interna (otros clientes, nombres de recursos privados) — RNF-10.

### F-11 · Flujo de reserva del cliente final
**Fase:** 4 · **Requisitos:** RF-18, RF-19
**Descripción:** El cliente elige servicio, ve huecos reales, reserva y recibe confirmación.

**Criterios de aceptación:**
- **Dado** un servicio elegido, **Cuando** veo la disponibilidad, **Entonces** los huecos mostrados son válidos según el solver.
- **Dado** un hueco elegido, **Cuando** confirmo mis datos y reservo, **Entonces** la cita aparece en la agenda interna del negocio.
- **Dado** que el hueco se ocupó mientras yo decidía, **Cuando** intento confirmar, **Entonces** el sistema me avisa y me ofrece re-elegir (no crea una doble-reserva).

### F-12 · Cancelación/reprogramación por el cliente
**Fase:** 4-6 · **Requisitos:** RF-20
**Descripción:** El cliente final gestiona su cita dentro de reglas configurables.

**Criterios de aceptación:**
- **Dado** una cita futura mía, **Cuando** la cancelo dentro del plazo permitido, **Entonces** se cancela y libera recursos.
- **Dado** una cita fuera del plazo de cancelación, **Cuando** intento cancelarla, **Entonces** el sistema lo impide según la regla del negocio.

---

## ÉPICA 5 — Notificaciones

### F-13 · Confirmaciones y recordatorios
**Fase:** 6 · **Requisitos:** RF-21, RF-22, RF-23
**Descripción:** Envío asíncrono de emails de confirmación y recordatorio.

**Criterios de aceptación:**
- **Dado** una reserva confirmada, **Cuando** se crea, **Entonces** se envía un email de confirmación sin bloquear la respuesta al usuario.
- **Dado** una cita próxima, **Cuando** llega el momento del recordatorio, **Entonces** se envía exactamente un recordatorio (no cero, no dos — RNF-06).
- **Dado** un fallo temporal del proveedor de email, **Cuando** falla el envío, **Entonces** el sistema reintenta sin duplicar.

---

## ÉPICA 6 — Cuentas y multi-tenancy

### F-14 · Registro y autenticación
**Fase:** 7 · **Requisitos:** RF-24, RNF-07
**Descripción:** Un negocio se registra y sus usuarios se autentican de forma segura.

**Criterios de aceptación:**
- **Dado** un negocio nuevo, **Cuando** se registra, **Entonces** se crea su tenant y un usuario dueño.
- **Dado** una contraseña, **Cuando** se almacena, **Entonces** está hasheada con algoritmo fuerte, nunca en texto plano.

### F-15 · Aislamiento de tenants
**Fase:** 7 · **Requisitos:** RF-25, RNF-08
**Descripción:** Cada negocio accede solo a sus datos. *Innegociable.*

**Criterios de aceptación:**
- **Dado** dos negocios A y B, **Cuando** un usuario de A pide datos, **Entonces** jamás recibe datos de B, bajo ninguna ruta de la API.
- **Dado** un intento (incluso manipulado) de acceder a un recurso de otro tenant por su ID, **Cuando** se procesa, **Entonces** se rechaza como si no existiera.

### F-16 · Roles y onboarding
**Fase:** 7 · **Requisitos:** RF-26, RF-27
**Criterios de aceptación:**
- **Dado** un usuario con rol staff, **Cuando** intenta una acción solo-de-dueño, **Entonces** se le deniega.
- **Dado** un negocio recién registrado, **Cuando** completa el onboarding guiado, **Entonces** queda configurado para agendar su primera cita sin ayuda externa.

---

## ÉPICA 7 — Monetización

### F-17 · Planes y límites
**Fase:** 8 · **Requisitos:** RF-28, RF-29
**Criterios de aceptación:**
- **Dado** un plan gratis con límite de X recursos, **Cuando** intento crear el recurso X+1, **Entonces** el sistema me lo impide y me invita a mejorar el plan.
- **Dado** que mejoro mi plan, **Cuando** el pago se confirma, **Entonces** el límite se levanta inmediatamente.

### F-18 · Pagos recurrentes
**Fase:** 8 · **Requisitos:** RF-30, RF-31
**Criterios de aceptación:**
- **Dado** una suscripción activa, **Cuando** llega el ciclo de cobro, **Entonces** se procesa el pago vía la pasarela.
- **Dado** un pago fallido, **Cuando** la pasarela lo notifica, **Entonces** el sistema reacciona según la política (reintento, aviso, suspensión) sin perder el estado.

---

## Cómo usar este catálogo

- **Una feature = una rama de git** (o varias si es grande). Sus criterios de aceptación son tu definición de "hecho".
- **No marques una feature como terminada** hasta que *todos* sus criterios pasen. Esto reemplaza al "parece que funciona".
- Los criterios con marca *innegociable* (F-05, F-15) son los que, si fallan, son defectos graves de producto, no bugs menores.
- Estos criterios son la base de tus **tests**: cada "Dado/Cuando/Entonces" puede volverse un caso de prueba.

---

**Anterior:** [04 — Modelo de Datos](./04-modelo-de-datos.md) · **Siguiente:** [06 — Planeación de Sprints](./06-planeacion-sprints.md)