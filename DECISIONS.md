# Decisiones del proyecto

Para esta prueba prioricé dos cosas: que el proyecto fuera **fácil de entender** y que las **métricas y los datos de la base de datos fueran coherentes**.

## Cómo encaré la prueba

1. **Inventario de conocimientos.** Al leer la prueba separé qué sabía, qué no sabía y cómo iba a resolver lo que no sabía.
2. **Lo que sabía:** tengo experiencia gestionando bases de datos (insights, filtros, consultas). Eso me facilitó entender qué producto se pedía.
3. **Lo que no sabía:** cómo se construyen por dentro esas bases de datos que antes gestionaba. Investigar esto fue tiempo obligatorio; no podía avanzar sin entenderlo.
4. **Uso de IA:** la usé para crear la hoja de ruta, elegir tecnologías y escribir el código.
5. **Mi rol:** mantuve una posición crítica y basé mis decisiones en mi experiencia gestionando bases de datos.

### Tecnologías

| Tecnología | Para qué sirve aquí |
| --- | --- |
| Node + Express + TypeScript | Servidor de la API (Node lo pide la prueba; TypeScript avisa errores antes de ejecutar). |
| PostgreSQL (con `pg`, sin ORM) | Base de datos; maneja bien fechas con zona horaria y calcula totales y promedios. |
| Zod | Valida los datos que llegan y responde con errores claros. |
| React + Vite | Interfaz simple. |
| Docker | Levanta la base de datos con un solo comando. |

---

## 1. Estructura separada por módulos

Pedí separar el backend en tres módulos: **agentes, interacciones y métricas**.

- Dentro de cada módulo se separan las **peticiones** (rutas y controladores), las **reglas** (servicios) y las **consultas** (repositorios).
- Esto genera más archivos, pero también **orden**: facilita la lectura, los cambios y la escalabilidad.
- **Por qué lo pedí:** en las bases de datos que gestioné, cuando un usuario pedía un cambio, muchas veces se lo negaban porque era difícil de hacer por la forma en que se había estructurado la base de datos desde el principio.

## 2. Las métricas se miden por fecha de apertura

Cuando se consulta un rango de fechas, se incluyen las interacciones **abiertas** en ese rango, tanto las resueltas como las que no.

- **Consecuencia:** las cifras de un periodo pasado pueden cambiar si después se resuelve alguno de esos casos.
- **Cómo lo mejoraría:**
  - Medir también por **fecha de cierre**, para saber cuántos casos se resolvieron durante un periodo. Esto es muy útil y necesario.
  - Guardar un **historial de estados**.
  - Mostrar **indicadores separados**: recibidos, resueltos y cerrados durante el periodo.
- Todo esto depende de **lo que se quiera medir**.

## 3. Flujo de estados estricto

El flujo es `OPEN → IN_PROGRESS → RESOLVED`. **No se permiten saltos ni retrocesos**, las fechas de apertura y de cierre se registran **automáticamente** y, por ahora, **no se permite reabrir** una interacción.

- En mi experiencia, los datos se usan para medir rendimiento y funcionamiento, sacar insights y tomar decisiones. Por eso los estados son estrictos.
- Así se evita que una fecha de cierre sea anterior a la de apertura.
- Las interacciones las gestionan personas, y las personas pueden cometer errores; por eso el sistema no depende de que alguien escriba las fechas a mano.
- Reabrir una interacción alteraría sus fechas y, con ellas, las métricas y la salud de los datos.
- Si dos personas cambian la misma interacción al mismo tiempo, solo una lo logra y la otra recibe un aviso para recargar. Así no se pisan los cambios.

## 4. Sin ORM

Decidí no usar un ORM por **practicidad**: con mi nivel de conocimiento, el SQL directo me resulta más fácil de leer y controlar. Con SQL directo (`pg`) veo exactamente cómo se cuentan y promedian las métricas y cómo se convierte cada fecha.

- **Los cálculos los hace la base de datos.** No traigo todas las interacciones al servidor para sumarlas una por una: PostgreSQL cuenta y promedia, y el servidor solo recibe el resultado (una fila por agente y una por día). Es la forma que sigue funcionando cuando hay muchos datos.

## 5. Zona horaria de Colombia

Una llamada a las 9 p. m. pertenece al día de Colombia, aunque en UTC ya sea el día siguiente. Las métricas agrupan por día usando `America/Bogota`.

- La configuración está **centralizada en el backend** y la interfaz consulta ese mismo valor.
- Pedí que fuera **fácil de cambiar**: si en algún momento no se quiere medir `America/Bogota` sino, por ejemplo, `Europe/Paris`, basta con cambiar una variable (`BUSINESS_TIMEZONE`), sin tocar el código.
- **Límite:** de momento solo acepta **una** zona horaria.

## 6. Paginación

- Tamaño predeterminado de **20 registros** y máximo de **100** por página.
- Al cambiar de página **se conservan los filtros**.
- Resultados ordenados por **fecha de apertura**.
- Se hizo según el alcance de la prueba; su rendimiento debe validarse en una situación real.
- **Por qué el máximo:** según mi experiencia, permitir páginas con muchos registros afecta mucho el rendimiento.
- Con la misma idea, el rango de fechas de una consulta tiene un máximo de **366 días**, para evitar que alguien pida por error una consulta enorme.

## 7. Con más tiempo

1. **Ordenamientos (sorts)**: son muy útiles para leer datos.
2. **Insights** mensuales, anuales y de otros periodos, pensados siempre en el usuario.
3. **Gráficos** más sencillos de leer que una tabla.
4. Métricas por **fecha de cierre**, **historial de estados** e **indicadores separados** (ver punto 2).

## 8. Qué salió mal

1. **Zona horaria en el frontend.** En el backend se implementó bien, pero el frontend tomaba la hora del navegador.
   - Lo detecté con una auditoría que hice con Claude al manejo de la zona horaria.
   - Ahora el frontend toma la zona horaria del backend y funciona sin importar la zona horaria del PC o del navegador.
2. **Cambio de Prisma a SQL con `pg`.** Empecé con Prisma (un ORM) y luego decidí cambiar a SQL directo; eso generó un retraso.
3. **Estados.** Aunque pedí desde el principio una lógica de estados estricta, al final me di cuenta de que se podía pasar de `OPEN` a `RESOLVED`. Se corrigió. Lección: **la IA comete errores** y hay que revisar.

## 9. Qué haría diferente

1. **Mejorar mi uso de git.** Hice commits después de acumular muchos cambios, y eso no es una buena práctica.
2. **Probar con más datos.** Probé con 1 o 2 registros, y así los resultados eran confusos.
3. **Crear la estructura de páginas (vistas del frontend) desde el principio.**
