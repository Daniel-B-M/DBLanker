import { pool } from "../../config/database.js";
export interface Agent {
    id: number;
    name: string;
}

export async function findAllAgents(): Promise<Agent[]> {
    const result = await pool.query<Agent>(`
        SELECT id, name
        FROM agents
        ORDER BY id ASC;
    `);

    return result.rows;
}

export async function findAgentById(
    id: number,
): Promise<Agent | null> {
    const result = await pool.query<Agent>(
        `
        SELECT id, name
        FROM agents
        WHERE id = $1
        LIMIT 1;
        `,
        [id],
    );

    return result.rows[0] ?? null;
}