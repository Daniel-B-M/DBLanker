# DBLanker

Mini panel de contact center: registro de interacciones (llamadas y tickets) por agente y métricas de desempeño.

- **Backend:** Node.js, TypeScript, Express y PostgreSQL (sin ORM).
- **Frontend:** React + Vite.
- **Base de datos:** PostgreSQL 17 en Docker.

Las decisiones técnicas están explicadas en [DECISIONS.md](DECISIONS.md).

---

## Requisitos

| Herramienta | Versión | Comprobar con |
|---|---|---|
| Node.js | 22 LTS o superior | `node -v` |
| npm | incluido con Node | `npm -v` |
| Docker Desktop (con Docker Compose) | cualquiera reciente | `docker compose version` |
| Git | cualquiera | `git --version` |

Docker Desktop debe estar **abierto** antes de empezar.

Puertos que se usan: `5432` (PostgreSQL), `3000` (API) y `5173` (frontend).

---

## Instalación paso a paso

> Todos los comandos se ejecutan **desde la raíz del proyecto**, salvo que el paso indique otra carpeta.
> Cuando un paso es distinto según el sistema, se muestran dos versiones: **PowerShell** (Windows) y **Bash** (macOS / Linux / Git Bash).

### Paso 1. Clonar el repositorio

```bash
git clone https://github.com/Daniel-B-M/DBLanker.git
cd DBLanker
```

### Paso 2. Levantar la base de datos

```bash
docker compose up -d
```

Espera unos segundos y comprueba que PostgreSQL está listo:

```bash
docker exec dblanker-postgres pg_isready -U dblanker -d dblanker
```

Debe responder `accepting connections`. Si dice `no response`, espera un poco y repítelo.

### Paso 3. Crear las tablas

PowerShell:

```powershell
Get-Content -Raw backend/database/migrations/001_initial_schema.sql | docker exec -i dblanker-postgres psql -U dblanker -d dblanker -v ON_ERROR_STOP=1
```

Bash:

```bash
docker exec -i dblanker-postgres psql -U dblanker -d dblanker -v ON_ERROR_STOP=1 < backend/database/migrations/001_initial_schema.sql
```

> Ejecuta este paso **solo una vez**, con la base vacía. Si las tablas ya existen, fallará (ver [Empezar desde cero](#empezar-desde-cero)).

### Paso 4. Cargar los datos de demostración

Ejecuta los tres archivos **en este orden**.

PowerShell:

```powershell
Get-Content -Raw backend/database/seeds/000_reset.sql | docker exec -i dblanker-postgres psql -U dblanker -d dblanker -v ON_ERROR_STOP=1
Get-Content -Raw backend/database/seeds/001_agents.sql | docker exec -i dblanker-postgres psql -U dblanker -d dblanker -v ON_ERROR_STOP=1
Get-Content -Raw backend/database/seeds/002_interactions.sql | docker exec -i dblanker-postgres psql -U dblanker -d dblanker -v ON_ERROR_STOP=1
```

Bash:

```bash
docker exec -i dblanker-postgres psql -U dblanker -d dblanker -v ON_ERROR_STOP=1 < backend/database/seeds/000_reset.sql
docker exec -i dblanker-postgres psql -U dblanker -d dblanker -v ON_ERROR_STOP=1 < backend/database/seeds/001_agents.sql
docker exec -i dblanker-postgres psql -U dblanker -d dblanker -v ON_ERROR_STOP=1 < backend/database/seeds/002_interactions.sql
```

Comprueba el resultado:

```bash
docker exec dblanker-postgres psql -U dblanker -d dblanker -c "SELECT (SELECT COUNT(*) FROM agents) AS agents, (SELECT COUNT(*) FROM interactions) AS interactions;"
```

Debe mostrar **10 agentes** y **500 interacciones**.

> `000_reset.sql` borra todos los datos de `agents` e `interactions`. Puedes repetir este paso cuando quieras volver a los datos originales.

### Paso 5. Configurar el backend

```bash
cd backend
```

Crea el archivo de variables de entorno a partir del ejemplo.

PowerShell:

```powershell
Copy-Item .env.example .env
```

Bash:

```bash
cp .env.example .env
```

Los valores por defecto ya funcionan con la base de datos del paso 2; no hace falta editar nada.

| Variable | Valor por defecto | Para qué sirve |
|---|---|---|
| `DATABASE_URL` | `postgresql://dblanker:dblanker_dev@localhost:5432/dblanker` | Conexión a PostgreSQL |
| `BUSINESS_TIMEZONE` | `America/Bogota` | Zona horaria usada para agrupar fechas en las métricas |
| `PORT` | `3000` | Puerto de la API |

### Paso 6. Instalar y arrancar el backend

Todavía dentro de `backend`:

```bash
npm ci
npm run dev
```

Debe aparecer: `Server running at http://localhost:3000`.

Comprueba que responde abriendo en el navegador <http://localhost:3000/api/health>. Debe mostrar:

```json
{ "status": "ok" }
```

**Deja esta terminal abierta.**

### Paso 7. Instalar y arrancar el frontend

Abre **otra terminal** en la raíz del proyecto:

```bash
cd frontend
npm ci
npm run dev
```

### Paso 8. Abrir la aplicación

Entra a <http://localhost:5173>.

- **Interactions:** listar y filtrar interacciones (crear y cambiar estado se hace por la API; ver [API](#api)).
- **Metrics:** métricas por agente y volumen diario en un rango de fechas.

Para ver los datos de demostración, usa el rango **2026-09-01** a **2026-09-14**.

---

## Datos de demostración

El seed es determinista: siempre genera los mismos datos, para poder verificar filtros, paginación y métricas.

- 10 agentes y 500 interacciones (`CALL` y `TICKET`).
- 300 `RESOLVED`, 100 `IN_PROGRESS` y 100 `OPEN`.
- Fechas locales del `2026-09-01` al `2026-09-14`, con dos días sin actividad: `2026-09-05` y `2026-09-11`.
- 150 interacciones (30 %) con fecha distinta en UTC y en `America/Bogota`, para verificar que la agrupación diaria usa la zona horaria del negocio.
- Casos frontera en `23:59:59` y `00:00:00` de `America/Bogota`.
- Volúmenes, tasas de resolución y tiempos promedio distintos por agente.

Ejemplo: una interacción guardada como `2026-09-15T04:22:00.000Z` es `2026-09-14 23:22` en Bogotá, así que cuenta para el 14 de septiembre.

### Volumen diario esperado

`GET /api/metrics/daily-volume?from=2026-09-01&to=2026-09-14`

| Fecha | Interacciones |
|---|---:|
| 2026-09-01 | 34 |
| 2026-09-02 | 42 |
| 2026-09-03 | 29 |
| 2026-09-04 | 47 |
| 2026-09-05 | 0 |
| 2026-09-06 | 39 |
| 2026-09-07 | 53 |
| 2026-09-08 | 31 |
| 2026-09-09 | 45 |
| 2026-09-10 | 38 |
| 2026-09-11 | 0 |
| 2026-09-12 | 51 |
| 2026-09-13 | 44 |
| 2026-09-14 | 47 |

---

## API

Base: `http://localhost:3000`

| Método | Ruta | Función |
|---|---|---|
| GET | `/api/health` | Comprueba que el servidor HTTP responde (no consulta la base de datos) |
| GET | `/api/config` | Devuelve la zona horaria del negocio que usa el frontend |
| GET | `/api/agents` | Lista los agentes |
| GET | `/api/interactions` | Lista y filtra interacciones (paginado) |
| POST | `/api/interactions` | Crea una interacción |
| PATCH | `/api/interactions/:id/status` | Cambia el estado de una interacción |
| GET | `/api/metrics/agents` | Métricas por agente |
| GET | `/api/metrics/daily-volume` | Volumen diario (incluye días sin actividad) |

### Crear una interacción

`POST /api/interactions`

```json
{ "agentId": 1, "type": "CALL" }
```

`type`: `CALL` o `TICKET`. El `agentId` debe existir (consúltalo en `/api/agents`).

### Cambiar el estado

`PATCH /api/interactions/1/status`

```json
{ "status": "IN_PROGRESS" }
```

Solo se permite avanzar en este orden: `OPEN` → `IN_PROGRESS` → `RESOLVED`.

Una interacción nueva empieza en `OPEN`, así que primero hay que enviar `IN_PROGRESS` y después `RESOLVED`. Cualquier otro cambio responde `409 INVALID_STATUS_TRANSITION`.

### Filtros de `/api/interactions`

| Parámetro | Valores | Notas |
|---|---|---|
| `agentId` | número | |
| `type` | `CALL`, `TICKET` | |
| `status` | `OPEN`, `IN_PROGRESS`, `RESOLVED` | |
| `from`, `to` | `YYYY-MM-DD` | Deben enviarse juntos |
| `page` | número | Por defecto `1` |
| `limit` | 1 a 100 | Por defecto `20` |

Ejemplo: `/api/interactions?status=OPEN&from=2026-09-01&to=2026-09-14&page=1&limit=20`

### Reglas de las métricas

- `from` y `to` son obligatorios, en formato `YYYY-MM-DD`, con un máximo de 366 días (ambos extremos incluidos).
- Las fechas se interpretan en `BUSINESS_TIMEZONE` (por defecto `America/Bogota`).
- Las interacciones se seleccionan por fecha de apertura y se cuentan con su estado actual.

---

## Otros comandos

Backend (desde `backend`):

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga automática |
| `npm run typecheck` | Comprueba los tipos de TypeScript |
| `npm run build` | Compila a `dist/` |
| `npm start` | Ejecuta la versión compilada |

Frontend (desde `frontend`):

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en el puerto 5173 |
| `npm run build` | Compila la versión de producción |
| `npm run lint` | Revisa el código con ESLint |

---

## Problemas comunes

| Síntoma | Causa probable | Solución |
|---|---|---|
| `docker: command not found` o error de conexión con Docker | Docker Desktop no está abierto | Abre Docker Desktop y espera a que inicie |
| `port is already allocated` al levantar la base | Ya hay un PostgreSQL usando el puerto 5432 | Detén ese PostgreSQL y repite el paso 2 |
| `relation "agents" already exists` en el paso 3 | La migración ya se había ejecutado | Nada que hacer; sigue al paso 4. O empieza desde cero |
| `DATABASE_URL is required` al arrancar el backend | Falta el archivo `.env` | Repite el paso 5 |
| El frontend muestra `Unable to load the operation time zone.` | El backend no está corriendo | Revisa la terminal del paso 6 |
| Errores de CORS en la consola del navegador | El frontend no quedó en el puerto 5173 (estaba ocupado) | Libera el puerto 5173 y reinicia el frontend |

---

## Empezar desde cero

Esto borra la base de datos por completo (contenedor y volumen):

```bash
docker compose down -v
```

Después repite desde el **paso 2**.
