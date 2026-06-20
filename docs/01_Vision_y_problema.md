# 01 — Visión y Definición del Problema

> **Propósito de este documento:** que cualquiera (incluido tu yo de dentro de 6 meses) entienda el problema a fondo *antes* de mirar una línea de código. Si no entiendes el problema con precisión, ninguna solución será buena.

---

## 1. El problema en una frase

Los negocios pequeños que dependen de **citas** y manejan **recursos limitados que se cruzan entre sí** (personal, salas, equipos) no tienen una herramienta que les agende esas citas *respetando todas sus reglas y aprovechando bien sus recursos*. Usan papel, Excel, o herramientas de calendario tontas que no entienden que una cita necesita simultáneamente a la persona correcta, en la sala correcta, con el equipo correcto.

## 2. El problema a fondo

### El patrón común
Imagina una clínica de fisioterapia pequeña:
- Tiene **3 terapeutas**, pero no todos hacen todo (solo Ana hace punción seca).
- Tiene **2 salas**, pero la sala 1 no tiene camilla eléctrica.
- Tiene **1 equipo de ultrasonido** compartido.
- Cada **tipo de sesión** requiere una combinación distinta: una "evaluación inicial" necesita 1 terapeuta + 1 sala por 45 min; una "sesión de ultrasonido" necesita 1 terapeuta + 1 sala + el equipo de ultrasonido por 30 min.
- Hay **reglas**: 15 min de limpieza entre pacientes en la misma sala, el horario de Ana es solo de mañana, etc.

Cuando entra una solicitud de cita, alguien tiene que resolver mentalmente un rompecabezas: *¿hay algún momento esta semana en que coincidan un terapeuta capaz, una sala adecuada y (si hace falta) el equipo, sin romper ninguna regla?* Lo hacen a ojo, se equivocan, dejan huecos muertos, y a veces agendan dobles que luego tienen que deshacer con una llamada incómoda al cliente.

### Por qué las herramientas actuales no sirven
- **Calendarios genéricos (Google Calendar):** solo bloquean tiempo ocupado. No entienden recursos ni reglas. No saben que "esta cita necesita la sala 2 *y* el ultrasonido".
- **Calendly y similares:** agendan contra *una* persona o un calendario simple. No modelan recursos múltiples cruzados ni capacidades por servicio. No optimizan nada — solo muestran huecos libres.
- **ERPs grandes / software de clínica caro:** existen, pero son caros, complejos, y pensados para empresas grandes. La PYME no los puede pagar ni configurar.

### El hueco de mercado
Hay un espacio entre "calendario tonto y barato" y "ERP caro y complejo": una herramienta **asequible, autoservicio, que sí entiende recursos y reglas, y que además optimiza**. Ese es el espacio que atacamos.

## 3. La solución (visión)

Un **SaaS de scheduling inteligente** donde:
1. El negocio modela su realidad: sus recursos, sus servicios, sus reglas.
2. Un **motor de optimización** decide qué citas caben, con qué combinación de recursos, y cuál es la *mejor* asignación posible (no solo una válida).
3. Los clientes finales del negocio pueden **reservar online** y el motor les ofrece huecos reales y válidos.
4. Todo en autoservicio, asequible, sin necesidad de un consultor.

### La tesis de producto: "motor genérico, producto afilado"
El **motor por dentro** es genérico: resuelve asignación de recursos con restricciones para cualquier dominio. El **producto por fuera** es concreto y afilado: empezamos vendiendo a un vertical específico (clínicas pequeñas) y luego clonamos el producto a otros verticales (talleres, tutorías, estética) reusando el motor. No vendemos abstracción; vendemos una solución concreta a un dolor concreto, sobre un motor reutilizable.

## 4. Stakeholders (quién toca el sistema)

| Stakeholder | Quién es | Qué necesita |
|---|---|---|
| **Dueño del negocio** | El fisioterapeuta/dentista dueño | Configurar su negocio, ver su agenda optimizada, no perder citas |
| **Recepcionista / staff** | Quien agenda manualmente | Crear y mover citas rápido, sin generar conflictos |
| **Cliente final** | El paciente/cliente | Reservar una cita online fácil, recibir recordatorios |
| **Tú (operador del SaaS)** | El dueño de la plataforma | Que sea estable, escale, y cobre suscripciones |

## 5. Alcance: qué SÍ y qué NO

### Dentro de alcance (lo que construimos)
- Modelado de recursos, servicios y reglas.
- Motor de factibilidad y optimización de asignaciones.
- Agenda interna (calendario para el staff).
- Portal público de reservas para clientes finales.
- Notificaciones (confirmaciones, recordatorios).
- Cuentas multi-negocio con aislamiento (multi-tenancy).
- Planes de suscripción y cobro.

### Fuera de alcance (a propósito, por ahora)
- App móvil nativa (la web responsive basta al inicio).
- Pagos del cliente final por el servicio (solo agendamos, no cobramos la consulta).
- Integraciones con sistemas externos (historias clínicas, contabilidad).
- Reportería avanzada / BI.
- Soporte multi-idioma (un idioma al inicio).

Mantener este "fuera de alcance" explícito es lo que evita que el proyecto se vuelva infinito.

## 6. Glosario del dominio

Definir el vocabulario evita confusiones eternas. Estos términos se usan de forma consistente en TODOS los documentos y en el código.

| Término | Definición |
|---|---|
| **Recurso (Resource)** | Cualquier cosa limitada que una cita consume durante un tiempo: una persona (staff), un espacio (sala), o un equipo. |
| **Tipo de recurso** | Categoría de recurso (ej: "terapeuta", "sala", "equipo"). |
| **Servicio (Service)** | Un tipo de cita que el negocio ofrece, con una duración y unos requisitos de recursos. |
| **Requisito de recurso** | La regla de qué recursos (y cuántos de cada tipo) necesita un servicio. |
| **Cita (Appointment / Booking)** | Una reserva concreta: un servicio, en un horario, con recursos específicos asignados. |
| **Restricción (Constraint)** | Una regla que toda asignación válida debe respetar (buffers, capacidades, horarios, habilidades). |
| **Factibilidad** | Si existe al menos una asignación de recursos válida para una cita en un horario dado. |
| **Asignación (Assignment)** | La combinación concreta de recursos elegida para satisfacer una cita. |
| **Función objetivo** | La métrica que el optimizador busca mejorar (minimizar huecos, maximizar ocupación, balancear carga). |
| **Hueco (Slot)** | Un intervalo de tiempo en el que un servicio podría agendarse. |
| **Tenant (Inquilino)** | Un negocio cliente del SaaS. Sus datos están aislados de otros tenants. |
| **Buffer** | Tiempo obligatorio entre citas (ej: limpieza) durante el cual un recurso no está disponible aunque no haya cita. |

## 7. Por qué este problema es técnicamente difícil

No es un CRUD. El núcleo es un **problema de satisfacción de restricciones (CSP)** y, en su forma plena, un **problema de optimización combinatoria**:

- Validar una cita = encontrar una asignación que satisfaga todas las restricciones simultáneamente.
- Generar disponibilidad = resolver ese problema para todos los huecos de un periodo.
- Optimizar la agenda = entre todas las asignaciones válidas, encontrar la que maximiza la función objetivo.

El espacio de combinaciones crece de forma explosiva con el número de recursos, servicios y citas. Resolverlo bien requiere algoritmos de verdad (backtracking con poda, propagación de restricciones, metaheurísticas), no fuerza bruta ingenua a escala. **Aquí es donde el proyecto deja de ser un tutorial y se vuelve ingeniería.**

---

**Siguiente documento:** [02 — Requisitos](02_Requisitos.md)