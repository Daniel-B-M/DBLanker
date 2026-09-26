BEGIN;

CREATE TABLE agents (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE interactions (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    agent_id INTEGER NOT NULL,

    type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',

    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,

    CONSTRAINT fk_interactions_agent
        FOREIGN KEY (agent_id)
        REFERENCES agents(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_interaction_type
        CHECK (type IN ('CALL', 'TICKET')),

    CONSTRAINT chk_interaction_status
        CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED')),

    CONSTRAINT chk_closed_after_opened
        CHECK (
            closed_at IS NULL
            OR closed_at >= opened_at
        ),

    CONSTRAINT chk_resolution_status
        CHECK (
            (status = 'RESOLVED' AND closed_at IS NOT NULL)
            OR
            (status <> 'RESOLVED' AND closed_at IS NULL)
        )
);

CREATE INDEX idx_interactions_opened_at
    ON interactions(opened_at);

CREATE INDEX idx_interactions_agent_opened_at
    ON interactions(agent_id, opened_at);

CREATE INDEX idx_interactions_status_opened_at
    ON interactions(status, opened_at);

COMMIT;