import { getAgentById } from "../agents/agent.service.js";

import {
    insertInteraction,
    findInteractions,
    findInteractionById,
    updateInteractionStatus,
} from "./interaction.repository.js";

import type {
    CreateInteractionInput,
    ListInteractionsInput,
    UpdateInteractionStatusInput,
} from "./interaction.schema.js";

export async function createInteraction(
    input: CreateInteractionInput
) {
    const agent = await getAgentById(input.agentId);

    if (!agent) {
        return null;
    }

    return await insertInteraction(input);
}

export async function getInteractions(
    filters: ListInteractionsInput
) {
    const result = await findInteractions(filters);

    const totalPages = Math.ceil(
        result.total / filters.limit
    );

    return {
        interactions: result.interactions,
        pagination: {
            page: filters.page,
            limit: filters.limit,
            total: result.total,
            totalPages,
        },
    };
}

export async function changeInteractionStatus(
    id: number,
    input: UpdateInteractionStatusInput
) {
    const interaction = await findInteractionById(id);

    if (!interaction) {
        return {
            outcome: "NOT_FOUND" as const,
        };
    }

    const currentStatus = interaction.status;
    const newStatus = input.status;

    const isValidTransition =
        (currentStatus === "OPEN" &&
            newStatus === "IN_PROGRESS") ||
        (currentStatus === "IN_PROGRESS" &&
            newStatus === "RESOLVED");

    if (!isValidTransition) {
        return {
            outcome: "INVALID_TRANSITION" as const,
            currentStatus,
            newStatus,
        };
    }

    const updatedInteraction = await updateInteractionStatus(
        id,
        newStatus,
        currentStatus,
    );
    if (!updatedInteraction) {
        return {
            outcome: "CONCURRENT_UPDATE" as const,
        };
    }
    return {
        outcome: "UPDATED" as const,
        interaction: updatedInteraction,
    };
}