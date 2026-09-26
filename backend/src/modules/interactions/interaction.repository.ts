import { BUSINESS_TIMEZONE } from "../../config/environment.js";
import { pool } from "../../config/database.js";
import type {
    CreateInteractionInput,
    ListInteractionsInput,
    UpdateInteractionStatusInput,
} from "./interaction.schema.js";
import type {
    Interaction,
    InteractionWithAgent,
    InteractionStatus,
} from "./interaction.types.js";

export async function findInteractions(
    filters: ListInteractionsInput
) {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filters.agentId !== undefined) {
        values.push(filters.agentId);

        conditions.push(
            `i.agent_id = $${values.length}`
        );
    }

    if (filters.status !== undefined) {
        values.push(filters.status);

        conditions.push(
            `i.status = $${values.length}`
        );
    }

    if (
        filters.from !== undefined &&
        filters.to !== undefined
    ) {
        values.push(filters.from);
        const fromParameter = `$${values.length}`;

        values.push(filters.to);
        const toParameter = `$${values.length}`;

        values.push(BUSINESS_TIMEZONE);
        const timezoneParameter = `$${values.length}`;

        conditions.push(`
      i.opened_at >= (
        ${fromParameter}::date::timestamp
        AT TIME ZONE ${timezoneParameter}
      )
      AND i.opened_at < (
        (${toParameter}::date + INTERVAL '1 day')::timestamp
        AT TIME ZONE ${timezoneParameter}
      )
    `);
    }

    const whereClause =
        conditions.length > 0
            ? `WHERE ${conditions.join(" AND ")}`
            : "";

    const countResult = await pool.query<{ total: number }>(
        `
      SELECT COUNT(*)::int AS total
      FROM interactions i
      ${whereClause};
    `,
        values
    );

    const offset =
        (filters.page - 1) * filters.limit;

    const dataValues = [...values];

    dataValues.push(filters.limit);
    const limitParameter = `$${dataValues.length}`;

    dataValues.push(offset);
    const offsetParameter = `$${dataValues.length}`;

    const dataResult = await pool.query<InteractionWithAgent>(
        `
      SELECT
        i.id,
        i.agent_id AS "agentId",
        a.name AS "agentName",
        i.type,
        i.status,
        i.opened_at AS "openedAt",
        i.closed_at AS "closedAt"
      FROM interactions i
      INNER JOIN agents a
        ON a.id = i.agent_id
      ${whereClause}
      ORDER BY i.opened_at DESC, i.id DESC
      LIMIT ${limitParameter}
      OFFSET ${offsetParameter};
    `,
        dataValues
    );

    return {
        interactions: dataResult.rows,
        total: countResult.rows[0]?.total ?? 0,
    };
}

export async function insertInteraction(
    input: CreateInteractionInput
) {
    const result = await pool.query<Interaction>(
        `
      INSERT INTO interactions (
        agent_id,
        type,
        status,
        opened_at,
        closed_at
      )
      VALUES ($1, $2, 'OPEN', NOW(), NULL)
      RETURNING
        id,
        agent_id AS "agentId",
        type,
        status,
        opened_at AS "openedAt",
        closed_at AS "closedAt";
    `,
        [input.agentId, input.type]
    );

    const interaction = result.rows[0];

    if (!interaction) {
        throw new Error("Failed to insert interaction");
    }

    return interaction;
}

export async function findInteractionById(id: number) {
    const result = await pool.query<Interaction>(
        `
      SELECT
        id,
        agent_id AS "agentId",
        type,
        status,
        opened_at AS "openedAt",
        closed_at AS "closedAt"
      FROM interactions
      WHERE id = $1
      LIMIT 1;
    `,
        [id]
    );

    return result.rows[0] ?? null;
}

export async function updateInteractionStatus(
    id: number,
    status: UpdateInteractionStatusInput["status"],
    expectedStatus: InteractionStatus,
) {
    const result = await pool.query<Interaction>(
        `
      UPDATE interactions
      SET
        status = $2,
        closed_at = CASE
          WHEN $3 = 'RESOLVED' THEN NOW()
          ELSE NULL
        END
      WHERE id = $1 AND status = $4
      RETURNING
        id,
        agent_id AS "agentId",
        type,
        status,
        opened_at AS "openedAt",
        closed_at AS "closedAt";
    `,
        [id, status, status, expectedStatus],
    );

    return result.rows[0] ?? null;
}