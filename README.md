# WeKall Tech Test

Backend desarrollado con Node.js, TypeScript, Express y PostgreSQL.

## Requisitos

- Node.js y npm.
- Docker con Docker Compose.

## Instalación

Desde la raíz del proyecto:

```bash
docker compose up -d
cd backend
npm ci
```

En PowerShell, crea la configuración local:

```powershell
Copy-Item .env.example .env
```

Si ya tienes `.env`, conserva el existente.

## Base de datos

Desde la raíz del proyecto, ejecuta la migración **solo en una base nueva**:

```powershell
Get-Content -Raw backend/database/migrations/001_initial_schema.sql |
    docker exec -i wekall-postgres psql -U wekall -d wekall -v ON_ERROR_STOP=1
```

### Datos de demostración

El proyecto incluye un seed determinista para probar filtros, paginación y métricas con un conjunto de datos conocido.

El seed genera:

- 10 agentes.
- 500 interacciones.
- Tipos `CALL` y `TICKET`.
- Estados `OPEN`, `IN_PROGRESS` y `RESOLVED`.
- 300 interacciones resueltas, 100 en progreso y 100 abiertas.
- Un rango de fechas local de `2026-09-01` a `2026-09-14`.
- Dos días sin actividad: `2026-09-05` y `2026-09-11`.
- 150 interacciones (30 %) cuya fecha calendario es distinta entre UTC y `America/Bogota`, para verificar que la agrupación diaria use la zona horaria del negocio.
- Casos frontera en `23:59:59` y `00:00:00` de `America/Bogota`.
- Distintos volúmenes, tasas de resolución y tiempos promedio por agente.

Los archivos se ejecutan en este orden:

```text
backend/database/seeds/000_reset.sql
backend/database/seeds/001_agents.sql
backend/database/seeds/002_interactions.sql
```

> `000_reset.sql` elimina los datos existentes de `agents` e `interactions` y reinicia sus identidades. Está pensado para reconstruir los datos de demostración en desarrollo.

Desde la raíz del proyecto, en PowerShell:

```powershell
Get-Content -Raw backend/database/seeds/000_reset.sql |
    docker exec -i wekall-postgres psql -U wekall -d wekall -v ON_ERROR_STOP=1

Get-Content -Raw backend/database/seeds/001_agents.sql |
    docker exec -i wekall-postgres psql -U wekall -d wekall -v ON_ERROR_STOP=1

Get-Content -Raw backend/database/seeds/002_interactions.sql |
    docker exec -i wekall-postgres psql -U wekall -d wekall -v ON_ERROR_STOP=1
```

Después del seed se esperan exactamente 10 agentes y 500 interacciones.

Puedes comprobarlo con:

```powershell
docker exec -it wekall-postgres psql -U wekall -d wekall -c "
SELECT
    (SELECT COUNT(*) FROM agents) AS agents,
    (SELECT COUNT(*) FROM interactions) AS interactions;
"
```

Resultado esperado:

```text
agents = 10
interactions = 500
```

Para validar el rango completo de demostración mediante la API:

```text
GET /api/metrics/agents?from=2026-09-01&to=2026-09-14
GET /api/metrics/daily-volume?from=2026-09-01&to=2026-09-14
```

El volumen diario esperado es:

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

La diferencia entre UTC y `America/Bogota` es intencional en parte de los datos. Por ejemplo, una interacción almacenada como `2026-09-15T04:22:00.000Z` corresponde a `2026-09-14 23:22` en Bogotá y, por tanto, pertenece al 14 de septiembre para las métricas del negocio.

## Ejecución

Desde `backend`, inicia el servidor de desarrollo:

```bash
npm run dev
```

Para compilar y ejecutar la versión compilada:

```bash
npm run build
npm start
```

Para comprobar tipos:

```bash
npm run typecheck
```

La API utiliza `http://localhost:3000` por defecto.

## Endpoints

| Método | Ruta | Función |
|---|---|---|
| GET | `/api/agents` | Listar agentes |
| POST | `/api/interactions` | Crear una interacción |
| GET | `/api/interactions` | Listar y filtrar interacciones |
| PATCH | `/api/interactions/:id/status` | Actualizar el estado |
| GET | `/api/metrics/agents` | Consultar métricas por agente |
| GET | `/api/metrics/daily-volume` | Consultar volumen diario |
| GET | `/api/health` | Comprobar que el servidor HTTP responde |

### Health check

`GET /api/health` responde con `200 OK` y:

```json
{
  "status": "ok"
}
```

Este endpoint comprueba únicamente que el servidor HTTP responde. No consulta PostgreSQL ni verifica su disponibilidad.

Ejemplo de creación:

```json
{
  "agentId": 1,
  "type": "CALL"
}
```

Usa un identificador existente obtenido de `/api/agents`.

Ejemplo de actualización:

```json
{
  "status": "RESOLVED"
}
```

## Filtros y métricas

Interacciones admite `agentId`, `status`, `from`, `to`, `page` y `limit`. Si se filtra por fechas, deben enviarse ambas.

Las métricas requieren `from` y `to` en formato `YYYY-MM-DD`, con un máximo de 366 días, incluyendo ambos extremos.

Ejemplo:

```text
/api/metrics/daily-volume?from=2026-09-01&to=2026-09-14
```

Los rangos se interpretan según `BUSINESS_TIMEZONE`, cuyo valor predeterminado es `America/Bogota`.

Las métricas seleccionan interacciones por fecha de apertura y consideran su estado actual. El volumen diario incluye los días sin actividad.