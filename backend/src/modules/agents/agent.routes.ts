import { Router } from "express";
import { getAgentsController } from "./agent.controller.js";

const router = Router();

router.get("/", getAgentsController);

export default router;