# Decisiones del proyecto

> Borrador inicial. Antes de entregar, completar los apartados pendientes con las razones y comprobaciones personales del desarrollo.

## 1. Organización del proyecto

El proyecto está separado en `backend` y `frontend`. El backend recibe las peticiones, aplica las reglas de las interacciones y consulta PostgreSQL. El frontend muestra las interacciones y las métricas consumiendo la API.

El backend se organiza por módulos: agentes, interacciones y métricas. Dentro de estos módulos se separan las responsabilidades:

- **Rutas:** definen las operaciones disponibles en la API.
- **Controladores:** reciben las peticiones, validan sus entradas y preparan las respuestas HTTP.
- **Servicios:** contienen las reglas y coordinan las operaciones. Por ejemplo, comprueban si un cambio de estado está permitido.
- **Repositorios:** contienen las consultas SQL.

Esta separación permite ubicar las reglas y las consultas sin concentrar todo en un solo archivo. Como costo, hay más archivos y algunas operaciones sencillas pasan por varias funciones.

En el frontend, las llamadas a la API están en `src/services`. La vista de métricas y su tabla por agente tienen archivos separados. La vista de interacciones todavía está en `App.tsx`; extraerla sería una mejora de organización.

## 2. Tecnologías utilizadas

| Tecnología | Función en el proyecto |
| --- | --- |
| Node.js y Express | Ejecutar el backend y definir las rutas HTTP. |
| TypeScript | Describir los datos y detectar errores de tipos durante el desarrollo. |
| PostgreSQL | Guardar los datos y calcular las métricas con SQL. |
| `pg` | Ejecutar consultas SQL desde el backend, sin un ORM. |
| Zod | Validar las entradas que recibe la API. |
| React y Vite | Construir la interfaz y ejecutar el entorno de desarrollo del frontend. |
| Docker Compose | Levantar PostgreSQL para el desarrollo local. |

Las consultas escritas con SQL permiten ver directamente cómo se filtran y calculan las métricas. A cambio, hay que mantener manualmente las consultas y su correspondencia con los tipos de TypeScript.

**Pendiente personal:** explicar brevemente por qué elegí estas herramientas. Indicar cuáles conocía y cuáles aprendí durante la prueba. La tabla describe su uso, pero no sustituye esa justificación.

## 3. Modelo de datos y reglas

Hay dos tablas principales: `agents` e `interactions`. Un agente puede tener muchas interacciones y cada interacción pertenece a un agente. Las llamadas y los tickets comparten una tabla porque, para el alcance de la prueba, tienen los mismos datos: agente, tipo, estado, apertura y cierre.

Las interacciones se crean en `OPEN` y siguen este recorrido:

```text
OPEN -> IN_PROGRESS -> RESOLVED
```

No se permite saltar directamente de `OPEN` a `RESOLVED`, retroceder ni repetir el estado actual. Al resolver una interacción se registra la fecha de cierre. No se implementó reapertura.

La base de datos también tiene restricciones: exige un agente existente, limita los tipos y estados, y evita que el cierre sea anterior a la apertura. Una interacción resuelta debe tener fecha de cierre; las demás no deben tenerla.

El modelo guarda el estado actual, no un historial de cambios. Esto alcanza para las métricas solicitadas, pero no permite reconstruir cuánto tiempo permaneció una interacción en cada estado.

## 4. Métricas y zona horaria

Las métricas se calculan en PostgreSQL mediante conteos y promedios. El backend recibe los resultados agregados; no carga todas las interacciones en memoria para sumarlas.

Se exponen dos rutas: `/api/metrics/agents` para el resumen por agente y `/api/metrics/daily-volume` para la serie diaria. La vista de métricas consulta ambas con el mismo rango de fechas.

El rango selecciona las interacciones por su **fecha de apertura**. Dentro de ese grupo se calculan:

- Total de interacciones.
- Total cuyo estado actual es `RESOLVED`.
- Tasa de resolución: resueltas divididas por el total, multiplicado por 100.
- Promedio de minutos entre apertura y cierre, considerando únicamente las resueltas.

Esto significa que una interacción abierta dentro del rango y resuelta después puede contar como resuelta al consultar nuevamente. El resultado refleja su estado actual, no una fotografía histórica del último día seleccionado.

Los agentes sin interacciones aparecen con conteos y tasa en cero. Cuando no hay interacciones resueltas, el promedio es `null`, porque no existe una duración para promediar. La serie diaria incluye con cero los días sin actividad.

Las fechas de apertura y cierre usan `TIMESTAMPTZ`. Para interpretar los filtros y agrupar por día, las consultas usan `BUSINESS_TIMEZONE`, cuyo valor predeterminado es `America/Bogota`. Por ejemplo, una interacción de las 8 p. m. en Colombia pertenece a ese día, aunque en UTC ya sea el siguiente.

El rango incluye desde el inicio del primer día hasta antes del inicio del día siguiente al último. Así se incluye completo el último día. Se limita el rango a 366 días para acotar la consulta.

## 5. Consultas, decisiones y límites

El listado usa filtros y paginación con `LIMIT` y `OFFSET`. Es una solución sencilla para esta prueba, aunque las páginas muy avanzadas pueden resultar costosas cuando hay muchos registros.

Hay índices por fecha de apertura y por combinaciones de agente/fecha y estado/fecha, relacionados con los filtros de la API. Su existencia no demuestra por sí sola un buen rendimiento: todavía habría que medir las consultas con más datos.

Las métricas se calculan al solicitarse, sin guardar resúmenes precalculados. Esto mantiene el cálculo ligado a los datos actuales, pero implica repetir las consultas en cada petición.

**Pendiente personal:** explicar las alternativas que realmente consideré y por qué las descarté. No presentar como evaluadas opciones que no llegué a revisar. También confirmar las razones para separar las métricas en dos rutas y para limitar el rango a 366 días.

## 6. Datos de ejemplo y validación

El seed genera 10 agentes y 500 interacciones con distintos tipos, estados y fechas. Incluye días sin actividad e interacciones cuya fecha en Colombia difiere de su fecha en UTC. Estos datos permiten revisar los filtros, los conteos y el agrupamiento diario.

**Pendiente personal:** registrar únicamente las comprobaciones que ejecuté y sus resultados. Casos útiles para comprobar:

- Crear una interacción con un agente válido y rechazar un agente inexistente.
- Recorrer los estados permitidos y rechazar el salto directo a `RESOLVED`.
- Confirmar que el cierre se registra al resolver la interacción.
- Comparar los totales de las métricas con los datos del seed.
- Comprobar los días sin actividad y los casos que cruzan medianoche en UTC.
- Revisar entradas inválidas, paginación y estados de carga y error de la interfaz.

Esta lista es una guía de revisión, no un registro de pruebas ya realizadas.

## 7. Uso de IA

**Pendiente de completar con mi experiencia real:**

- En qué partes del desarrollo me apoyé en IA.
- Qué sugerencias necesité entender o revisar antes de incorporarlas.
- Qué resultado estuvo incompleto o incorrecto y qué se corrigió.
- Qué comprobé personalmente y cómo lo hice.

Un cambio confirmado durante la revisión fue restringir las transiciones para impedir `OPEN -> RESOLVED`. Antes de usarlo como ejemplo de un error de IA, debo confirmar cómo se originó y describir mi participación real en la corrección.

## 8. Mejoras pendientes

- Agregar pruebas automatizadas de las métricas, fechas y cambios de estado.
- Medir las consultas con un volumen mayor antes de afirmar que su rendimiento es suficiente para producción.
- Separar la vista de interacciones de `App.tsx`.
- Configurar explícitamente la zona horaria de las fechas mostradas en el listado; actualmente su presentación depende de la zona del navegador, aunque las métricas se calculan con la zona de la operación.
- Para un despliegue real, revisar autenticación, permisos y configuración de credenciales y direcciones de los servicios.

**Pendiente personal:** priorizar las mejoras que considero más importantes y explicar brevemente por qué.
