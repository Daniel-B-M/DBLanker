BEGIN;

WITH daily_plan (
    local_date,
    total_interactions
) AS (
    VALUES
        (DATE '2026-09-01', 34),
        (DATE '2026-09-02', 42),
        (DATE '2026-09-03', 29),
        (DATE '2026-09-04', 47),
        (DATE '2026-09-05', 0),
        (DATE '2026-09-06', 39),
        (DATE '2026-09-07', 53),
        (DATE '2026-09-08', 31),
        (DATE '2026-09-09', 45),
        (DATE '2026-09-10', 38),
        (DATE '2026-09-11', 0),
        (DATE '2026-09-12', 51),
        (DATE '2026-09-13', 44),
        (DATE '2026-09-14', 47)
),

generated_interactions AS (
    SELECT
        dp.local_date,
        gs.day_sequence,
        ROW_NUMBER() OVER (
            ORDER BY dp.local_date, gs.day_sequence
        ) AS interaction_sequence
    FROM daily_plan dp
    CROSS JOIN LATERAL generate_series(
        1,
        dp.total_interactions
    ) AS gs(day_sequence)
),

agent_plan (
    agent_name,
    total_interactions,
    resolved_interactions,
    in_progress_interactions
) AS (
    VALUES
        ('Ana Torres',       70, 50, 10),
        ('Carlos Ruiz',      65, 45, 10),
        ('Laura Gomez',      60, 40, 10),
        ('Alice Johnson',    55, 35, 10),
        ('Bob Smith',        50, 30, 10),
        ('Carol Williams',   50, 30, 10),
        ('Diego Martinez',   45, 25, 10),
        ('Sofia Ramirez',    40, 20, 10),
        ('Miguel Castro',    35, 15, 10),
        ('Valentina Lopez',  30, 10, 10)
),

agent_slots AS (
    SELECT
        ap.agent_name,
        ap.total_interactions,
        ap.resolved_interactions,
        ap.in_progress_interactions,
        gs.slot_sequence,

        ROW_NUMBER() OVER (
            ORDER BY
                md5(
                    ap.agent_name
                    || '-'
                    || gs.slot_sequence::text
                )
        ) AS interaction_sequence

    FROM agent_plan ap

    CROSS JOIN LATERAL generate_series(
        1,
        ap.total_interactions
    ) AS gs(slot_sequence)
),

assigned_interactions AS (
    SELECT
        gi.local_date,
        gi.day_sequence,
        gi.interaction_sequence,
        slots.agent_name,
        slots.slot_sequence,
        slots.resolved_interactions,
        slots.in_progress_interactions

    FROM generated_interactions gi

    JOIN agent_slots slots
        ON slots.interaction_sequence =
           gi.interaction_sequence
),

classified_interactions AS (
    SELECT
        local_date,
        day_sequence,
        interaction_sequence,
        agent_name,

        CASE
            WHEN slot_sequence <= resolved_interactions
                THEN 'RESOLVED'

            WHEN slot_sequence <=
                 resolved_interactions
                 + in_progress_interactions
                THEN 'IN_PROGRESS'

            ELSE 'OPEN'
        END AS status,

        CASE
            WHEN slot_sequence % 2 = 1
                THEN 'CALL'
            ELSE 'TICKET'
        END AS type

    FROM assigned_interactions
),

timed_interactions AS (
    SELECT
        ci.*,

        CASE
            -- 23:59:59 Bogota = 04:59:59 UTC del dia siguiente.
            WHEN ci.interaction_sequence = 10
                THEN (
                    ci.local_date
                    + TIME '23:59:59'
                ) AT TIME ZONE 'America/Bogota'

            -- 00:00:00 Bogota = 05:00:00 UTC.
            WHEN ci.interaction_sequence = 11
                THEN (
                    ci.local_date
                    + TIME '00:00:00'
                ) AT TIME ZONE 'America/Bogota'

            -- 30% ocurre entre 19:00 y 23:59 en Bogota.
            -- En UTC pertenece al dia calendario siguiente.
            WHEN ci.interaction_sequence % 10 IN (0, 3, 6)
                THEN (
                    ci.local_date
                    + TIME '19:00:00'
                    + (
                        (ci.interaction_sequence * 7) % 300
                    ) * INTERVAL '1 minute'
                ) AT TIME ZONE 'America/Bogota'

            -- El 70% restante ocurre entre 08:00 y 18:59.
            ELSE (
                ci.local_date
                + TIME '08:00:00'
                + (
                    (ci.interaction_sequence * 11) % 660
                ) * INTERVAL '1 minute'
            ) AT TIME ZONE 'America/Bogota'

        END AS opened_at

    FROM classified_interactions ci
),

completed_interactions AS (
    SELECT
        ti.*,

        CASE
            WHEN ti.status = 'RESOLVED'
                THEN ti.opened_at
                    + (
                        CASE ti.agent_name
                            WHEN 'Ana Torres'       THEN 10
                            WHEN 'Carlos Ruiz'      THEN 15
                            WHEN 'Laura Gomez'      THEN 20
                            WHEN 'Alice Johnson'    THEN 25
                            WHEN 'Bob Smith'        THEN 30
                            WHEN 'Carol Williams'   THEN 35
                            WHEN 'Diego Martinez'   THEN 40
                            WHEN 'Sofia Ramirez'    THEN 45
                            WHEN 'Miguel Castro'    THEN 50
                            WHEN 'Valentina Lopez'  THEN 55
                        END
                        + (ti.interaction_sequence % 10)
                    ) * INTERVAL '1 minute'

            ELSE NULL
        END AS closed_at

    FROM timed_interactions ti
),

resolved_agents AS (
    SELECT
        ci.*,
        a.id AS agent_id
    FROM completed_interactions ci
    JOIN agents a
        ON a.name = ci.agent_name
)

INSERT INTO interactions (
    agent_id,
    type,
    status,
    opened_at,
    closed_at
)
SELECT
    agent_id,
    type,
    status,
    opened_at,
    closed_at
FROM resolved_agents
ORDER BY interaction_sequence;

COMMIT;