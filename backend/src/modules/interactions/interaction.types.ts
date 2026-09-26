export type InteractionType = "CALL" | "TICKET";

export type InteractionStatus =
    | "OPEN"
    | "IN_PROGRESS"
    | "RESOLVED";

export interface Interaction {
    id: number;
    agentId: number;
    type: InteractionType;
    status: InteractionStatus;
    openedAt: Date;
    closedAt: Date | null;
}

export interface InteractionWithAgent extends Interaction {
    agentName: string;
}