# Decisiones del proyecto

## Cómo trabajé

Lo digo desde el inicio: **me apoyé en IA para planear la prueba, proponer las tecnologías y escribir el código.**

Mi papel fue **supervisar y decidir**. Pregunté el porqué de cada propuesta, acepté lo que entendía y tenía sentido, y rechacé lo que no. No domino cada línea del código, pero sí entiendo **qué se decidió y por qué**, y eso es lo que explico aquí.

### Lo que yo pedí desde la planeación

La IA no decidió todo por su cuenta. Estas condiciones las puse yo antes de empezar, y el proyecto se construyó a partir de ellas:

- **Responsabilidades separadas** (punto 1).
- **Zona horaria fácil de cambiar** (punto 6).
- **No usar ORM** (punto 4).

### En qué me guio la IA: las tecnologías

Todavía no tengo experiencia para saber qué tecnologías o bases de datos son mejores que otras. Por eso **la IA me guio en esta elección**, según el alcance de la prueba y las buenas prácticas para este tipo de producto. Mi parte fue preguntar si eran las adecuadas para este caso y entender para qué sirve cada una:

| Tecnología | Para qué sirve aquí | Por qué encaja |
| --- | --- | --- |
| **Node + Express** | El servidor que recibe las peticiones. | Node lo pide la prueba; Express es simple y muy usado. |
| **TypeScript** | JavaScript con tipos. | Avisa de errores antes de ejecutar el programa. |
| **PostgreSQL** | La base de datos. | Maneja muy bien fechas con zona horaria y calcula totales y promedios rápido. |
| **Zod** | Revisa los datos que llegan. | Rechaza entradas inválidas con un mensaje claro. |
| **React + Vite** | La interfaz. | Suficiente para una vista simple; arranca rápido. |
| **Docker** | Levanta la base de datos. | Cualquiera puede iniciarla con un solo comando, sin instalar PostgreSQL. |

La excepción fue el ORM: la IA lo sugirió y yo lo rechacé (punto 4).

---

## 1. Estructura con responsabilidades separadas

Desde la planeación pedí que el código estuviera separado. Se separó de dos maneras.

**Primero, por tema (módulos).** El backend tiene tres carpetas, una por cada parte del negocio:

| Módulo | De qué se encarga |
| --- | --- |
| **Agentes** | Consultar la lista de agentes del equipo. |
| **Interacciones** | Crear llamadas y tickets, cambiar su estado y listarlos con filtros. |
| **Métricas** | Calcular los totales, la tasa de resolución, el tiempo promedio y el volumen por día. |

Así, si hay que cambiar algo de las métricas, todo está en la carpeta de métricas.

**Segundo, por tarea dentro de cada módulo.** Cada archivo hace **una sola cosa**:

| Parte | Qué hace |
| --- | --- |
| Rutas | Dicen qué direcciones (endpoints) existen. |
| Controladores | Reciben la petición y revisan que los datos vengan bien. |
| Servicios | Tienen las reglas del negocio (por ejemplo, qué cambios de estado se permiten). |
| Repositorios | Tienen las consultas a la base de datos. |

**En el frontend se siguió la misma idea.** Cada pantalla tiene su propio archivo:

| Archivo | Qué hace |
| --- | --- |
| `App.tsx` | Solo carga la zona horaria y cambia entre las dos vistas. |
| `pages/InteractionsPage.tsx` | La vista del listado con sus filtros y paginación. |
| `pages/MetricsPage.tsx` | La vista de métricas por agente y volumen por día. |
| `services/` | Las llamadas a la API, separadas de las pantallas. |

Al cambiar de vista, la otra **se oculta en lugar de borrarse**. Así el usuario no pierde sus filtros ni sus resultados al ir y volver entre Interacciones y Métricas.

**Por qué lo pedí:** pensé en **otros desarrolladores**. Si alguien nuevo llega al proyecto, sabe dónde buscar: primero la carpeta del tema (agentes, interacciones o métricas) y luego el archivo según la tarea (una regla está en el servicio y una consulta en el repositorio). Puede cambiar una parte sin romper las demás.

**Costo que acepto:** hay más archivos y más código, incluso para operaciones sencillas.

## 2. Medir por fecha de apertura, no de cierre

Cuando el usuario elige un rango de fechas, las métricas toman las interacciones **que se abrieron** en ese rango.

**Por qué:**

1. **Todas las interacciones tienen fecha de apertura; solo las resueltas tienen fecha de cierre.** Si filtrara por cierre, las abiertas y en progreso desaparecerían del conteo. Todas las que cuento estarían resueltas y la tasa de resolución daría **siempre 100 %**. La métrica no serviría.
2. **Responde a la pregunta del líder.** "¿Cuántas interacciones atendió cada agente?" y "volumen por día" hablan de cuánto trabajo **llegó** cada día. Eso lo marca la apertura.
3. **Todas las métricas miran el mismo grupo.** El total, las resueltas, la tasa y el promedio se calculan sobre las mismas interacciones. Así los números son coherentes entre sí.

**Costo que acepto:** los números de un rango pasado pueden cambiar. Si una interacción de la semana pasada se resuelve hoy, al consultar otra vez aparece como resuelta. Muestro el **estado actual**, no una "foto" del pasado.

## 3. No permitir saltar de OPEN a RESOLVED

Una interacción solo puede avanzar así: `OPEN → IN_PROGRESS → RESOLVED`. No se puede saltar pasos ni retroceder.

**Por qué:**

1. **Es el flujo que pide el enunciado:** abierta → en progreso → resuelta.
2. **Datos confiables.** Si se pudiera saltar, habría interacciones "resueltas" que nadie tomó ni trabajó. Obligar el paso por "en progreso" asegura que cada caso resuelto pasó por el trabajo de un agente.
3. **La hora de cierre se guarda sola** al resolver. Nadie la escribe a mano, así que no se puede equivocar.

**Costo que acepto:** una llamada muy rápida necesita dos cambios de estado en vez de uno, y no se puede reabrir una interacción. Si el negocio lo pidiera, se podría cambiar.

**Extra:** si dos personas cambian la misma interacción al mismo tiempo, solo una lo logra y la otra recibe un aviso para recargar. Así no se pisan los cambios.

## 4. No usar ORM (SQL directo)

Un ORM es una herramienta que escribe las consultas a la base de datos por ti. **La IA me lo sugirió y lo rechacé.**

**Por qué:**

1. **Lo más evaluado son las métricas.** Quería ver exactamente cómo se cuenta y se promedia, sin que una herramienta lo esconda.
2. **Para mí, como junior, el SQL directo es más fácil de leer y explicar.** Un ORM agrega otra capa que tendría que aprender y que no sabría explicar si genera algo mal.
3. **La zona horaria es delicada**, y con SQL directo veo exactamente cómo se convierte cada fecha.

**Costo que acepto:** escribo más código a mano y, si cambio una tabla, tengo que actualizar las consultas yo mismo.

## 5. Los cálculos los hace la base de datos

No traigo las 500 (o un millón de) interacciones al servidor para sumarlas una por una. Le pido a PostgreSQL que cuente y promedie, y el servidor solo recibe el resultado: una fila por agente y una por día.

**Por qué:** es lo que pide el enunciado y es la forma que sigue funcionando cuando hay muchos datos. La base de datos está hecha para esto.

## 6. La zona horaria (UTC-5)

Una interacción de las **8 p. m. en Cali** es la **1 a. m. del día siguiente en UTC**, pero debe contar para el día de Cali.

- Guardo la **hora exacta** del evento.
- Al agrupar "por día", la base de datos usa la hora de **Colombia (`America/Bogota`)**, no la del servidor.
- La zona está configurada en **un solo lugar** del backend, y el frontend la pide a la API. Así nunca pueden quedar distintas.

**Pedido mío desde la planeación: que fuera fácil de cambiar.** Si mañana la operación fuera, por ejemplo, un equipo completo en Francia, basta cambiar una línea de configuración (`BUSINESS_TIMEZONE=Europe/Paris`), sin tocar el código.

Por eso se usa el nombre de la zona (`America/Bogota`, `Europe/Paris`) y no un número fijo como "-5". Francia cambia de hora en verano e invierno, y el nombre de la zona ya tiene en cuenta esos cambios.

**Límite:** hoy el sistema maneja **una zona a la vez**. Si hubiera equipos en Colombia y en Francia al mismo tiempo, cada equipo necesitaría su propia zona guardada. Eso quedaría como mejora.

**Comprobado:** con los datos de ejemplo, el volumen por día da igual aunque la base de datos esté configurada en otra zona horaria (se probó con UTC, Tokio y Los Ángeles).

## 7. Otras decisiones cortas

| Decisión | Por qué |
| --- | --- |
| Llamadas y tickets en **una sola tabla** | Tienen los mismos datos; las métricas salen de una sola consulta. |
| Rango máximo de **366 días** | Evitar que alguien pida por error una consulta enorme. |
| **Paginación** simple (página y límite) | Fácil de entender; suficiente para esta prueba. |
| **Validar las entradas** (fechas, estados, agentes) | Responder con un error claro en vez de fallar o guardar datos malos. |
| **Datos de ejemplo** con días vacíos y casos cerca de medianoche | Poder comprobar que el agrupamiento por día y la zona horaria funcionan. |

## 8. Uso de IA

- **En qué me apoyé:** planificación, selección de tecnologías (me guio según el alcance y las buenas prácticas, porque no tengo experiencia para compararlas) y escritura del código.
- **Qué pedí yo:** responsabilidades separadas (punto 1) y una zona horaria fácil de cambiar (punto 6).
- **Qué rechacé:** el ORM (punto 4).
- **Qué revisé:** pedí una auditoría del manejo de la hora. Confirmó que los cálculos estaban bien, pero encontró que el frontend tenía la zona horaria escrita a mano mientras el backend la leía de la configuración. Se corrigió para que haya una sola fuente.
- **Lo que entiendo y lo que no:** entiendo las decisiones y sus costos. No podría escribir todo el código solo todavía, y prefiero decirlo con claridad.

## 9. Qué haría con más tiempo

1. **Pruebas automáticas** de las métricas y la zona horaria. Es donde un error pasa más desapercibido.
2. **Historial de estados**, para saber cuánto tiempo pasa una interacción en cada etapa.
3. **Probar con muchos más datos** antes de decir que está listo para producción.
4. Para producción: **inicio de sesión y permisos**.
