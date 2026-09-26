import type {
    Request,
    Response,
    NextFunction,
} from "express";

import { getAllAgents } from "./agent.service.js";

export async function getAgentsController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const agents = await getAllAgents();

        res.status(200).json(agents);
    } catch (error) {
        next(error);
    }
}