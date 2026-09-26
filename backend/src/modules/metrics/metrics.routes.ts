import { Router } from "express";
import {
    getAgentMetricsHandler,
    getDailyVolumeHandler,
} from "./metrics.controller.js";

const router = Router();

router.get("/agents", getAgentMetricsHandler);
router.get("/daily-volume", getDailyVolumeHandler);

export default router;