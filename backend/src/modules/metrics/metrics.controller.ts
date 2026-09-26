import { dateSchema } from "../../shared/schemas/date.schema.js";
import type { Request, Response, NextFunction } from "express";
import {
    getAgentMetrics,
    getDailyVolume,
} from "./metrics.service.js";
const MAX_METRICS_DAYS = 366;

export async function getAgentMetricsHandler(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<Response | void> {
    const { from, to } = req.query;

    if (typeof from !== "string" || typeof to !== "string") {
        return res.status(400).json({
            error: {
                code: "VALIDATION_ERROR",
                message: "Query parameters 'from' and 'to' are required and must be strings.",
            },
        });
    }

    if (!dateSchema.safeParse(from).success || !dateSchema.safeParse(to).success) {
        {
            return res.status(400).json({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Query parameters 'from' and 'to' must be valid dates in YYYY-MM-DD format.",
                },
            });
        }
    }

    if (from > to) {
        return res.status(400).json({
            error: {
                code: "VALIDATION_ERROR",
                message: "'from' cannot be later than 'to'.",
            },
        });
    }

    const rangeDays =
        (Date.parse(`${to}T00:00:00Z`) -
            Date.parse(`${from}T00:00:00Z`)) /
        86_400_000 +
        1;

    if (rangeDays > MAX_METRICS_DAYS) {
        return res.status(400).json({
            error: {
                code: "VALIDATION_ERROR",
                message: `Date range cannot exceed ${MAX_METRICS_DAYS} days.`,
            },
        });
    }

    try {
        const metrics = await getAgentMetrics(from, to);

        return res.status(200).json(metrics);
    } catch (error) {
        next(error);
    }
}

export async function getDailyVolumeHandler(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<Response | void> {
    const { from, to } = req.query;

    if (typeof from !== "string" || typeof to !== "string") {
        return res.status(400).json({
            error: {
                code: "VALIDATION_ERROR",
                message: "Query parameters 'from' and 'to' are required and must be strings.",
            },
        });
    }

    if (
        !dateSchema.safeParse(from).success ||
        !dateSchema.safeParse(to).success
    ) {
        return res.status(400).json({
            error: {
                code: "VALIDATION_ERROR",
                message: "Query parameters 'from' and 'to' must be valid dates in YYYY-MM-DD format.",
            },
        });
    }

    if (from > to) {
        return res.status(400).json({
            error: {
                code: "VALIDATION_ERROR",
                message: "'from' cannot be later than 'to'.",
            },
        });
    }

    const rangeDays =
        (Date.parse(`${to}T00:00:00Z`) -
            Date.parse(`${from}T00:00:00Z`)) /
        86_400_000 +
        1;

    if (rangeDays > MAX_METRICS_DAYS) {
        return res.status(400).json({
            error: {
                code: "VALIDATION_ERROR",
                message: `Date range cannot exceed ${MAX_METRICS_DAYS} days.`,
            },
        });
    }

    try {
        const metrics = await getDailyVolume(from, to);

        return res.status(200).json(metrics);
    } catch (error) {
        next(error);
    }
}