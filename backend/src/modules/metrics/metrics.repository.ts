import { pool } from "../../config/database.js";

export interface AgentMetrics {
    agentId: number;
    agentName: string;
    totalInteractions: number;
    resolvedInteractions: number;
    resolutionRate: number;
    averageResolutionMinutes: number | null;
}

export interface DailyVolumeMetric {
    date: string;
    totalInteractions: number;
}

export async function findAgentMetrics(
    from: string,
    to: string,
    timezone: string
): Promise<AgentMetrics[]> {
    const query = `
    SELECT
      a.id AS "agentId",
      a.name AS "agentName",

      COUNT(i.id)::int AS "totalInteractions",

      COUNT(i.id) FILTER (
        WHERE i.status = 'RESOLVED'
      )::int AS "resolvedInteractions",

      (
        ROUND(
          CASE
            WHEN COUNT(i.id) = 0 THEN 0
            ELSE (
              COUNT(i.id) FILTER (
                WHERE i.status = 'RESOLVED'
              ) * 100.0
              / COUNT(i.id)
            )
          END,
          2
        )
      )::float8 AS "resolutionRate",

      (
        ROUND(
          AVG(
            EXTRACT(EPOCH FROM (i.closed_at - i.opened_at)) / 60
          ) FILTER (
            WHERE i.status = 'RESOLVED'
          ),
          2
        )
      )::float8 AS "averageResolutionMinutes"

    FROM agents a

    LEFT JOIN interactions i
      ON i.agent_id = a.id
      AND i.opened_at >= (
        $1::date::timestamp
        AT TIME ZONE $3
      )
      AND i.opened_at < (
        (($2::date + 1)::timestamp)
        AT TIME ZONE $3
      )

    GROUP BY
      a.id,
      a.name

    ORDER BY
      a.id;
  `;

    const result = await pool.query<AgentMetrics>(
        query,
        [from, to, timezone]
    );

    return result.rows;
}

export async function findDailyVolume(
    from: string,
    to: string,
    timezone: string
): Promise<DailyVolumeMetric[]> {
    const query = `
    WITH days AS (
      SELECT
        generate_series(
          $1::date,
          $2::date,
          interval '1 day'
        )::date AS day
    )

    SELECT
      d.day::text AS "date",
      COUNT(i.id)::int AS "totalInteractions"

    FROM days d

    LEFT JOIN interactions i
      ON i.opened_at >= (
        d.day::timestamp
        AT TIME ZONE $3
      )
      AND i.opened_at < (
        ((d.day + 1)::timestamp)
        AT TIME ZONE $3
      )

    GROUP BY
      d.day

    ORDER BY
      d.day;
  `;

    const result = await pool.query<DailyVolumeMetric>(
        query,
        [from, to, timezone]
    );

    return result.rows;
}