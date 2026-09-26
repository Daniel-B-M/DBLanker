import type { Request, Response, NextFunction } from "express";

import {
    createInteractionSchema,
    listInteractionsSchema,
    interactionIdSchema,
    updateInteractionStatusSchema,
} from "./interaction.schema.js";

import {
    createInteraction,
    getInteractions,
    changeInteractionStatus,
} from "./interaction.service.js";

export async function createInteractionController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const validationResult = createInteractionSchema.safeParse(req.body);

        if (!validationResult.success) {
            res.status(400).json({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Invalid request body",
                    details: validationResult.error.issues.map((issue) => ({
                        field: issue.path.join("."),
                        message: issue.message,
                    })),
                },
            });

            return;
        }

        const interaction = await createInteraction(validationResult.data);

        if (!interaction) {
            res.status(404).json({
                error: {
                    code: "AGENT_NOT_FOUND",
                    message: `Agent ${validationResult.data.agentId} was not found`,
                },
            });

            return;
        }

        res.status(201).json({
            data: interaction,
        });
    } catch (error) {
        next(error);
    }
}

export async function getInteractionsController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const validationResult = listInteractionsSchema.safeParse(req.query);

        if (!validationResult.success) {
            res.status(400).json({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Invalid query parameters",
                    details: validationResult.error.issues.map((issue) => ({
                        field: issue.path.join("."),
                        message: issue.message,
                    })),
                },
            });

            return;
        }

        const result = await getInteractions(validationResult.data);

        res.status(200).json({
            data: result.interactions,
            pagination: result.pagination,
        });
    } catch (error) {
        next(error);
    }
}

export async function updateInteractionStatusController(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const paramsValidation = interactionIdSchema.safeParse(req.params);

        if (!paramsValidation.success) {
            return res.status(400).json({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Invalid interaction id",
                    details: paramsValidation.error.issues.map((issue) => ({
                        field: issue.path.join("."),
                        message: issue.message,
                    })),
                },
            });
        }

        const bodyValidation = updateInteractionStatusSchema.safeParse(req.body);

        if (!bodyValidation.success) {
            return res.status(400).json({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Invalid request body",
                    details: bodyValidation.error.issues.map((issue) => ({
                        field: issue.path.join("."),
                        message: issue.message,
                    })),
                },
            });
        }

        const result = await changeInteractionStatus(
            paramsValidation.data.id,
            bodyValidation.data,
        );

        if (result.outcome === "NOT_FOUND") {
            return res.status(404).json({
                error: {
                    code: "INTERACTION_NOT_FOUND",
                    message: "Interaction not found",
                },
            });
        }

        if (result.outcome === "INVALID_TRANSITION") {
            return res.status(409).json({
                error: {
                    code: "INVALID_STATUS_TRANSITION",
                    message: `Cannot transition interaction from ${result.currentStatus} to ${result.newStatus}`,
                },
            });
        }

        if (result.outcome === "CONCURRENT_UPDATE") {
            return res.status(409).json({
                error: {
                    code: "CONCURRENT_UPDATE",
                    message: "Interaction changed during the request. Refresh and try again.",
                },
            });
        }

        return res.status(200).json({
            data: result.interaction,
        });
    } catch (error) {
        next(error);
    }
}