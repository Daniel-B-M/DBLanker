import { Router } from "express";

import {
    createInteractionController,
    getInteractionsController,
    updateInteractionStatusController,
} from "./interaction.controller.js";

const router = Router();

router.get("/", getInteractionsController);
router.post("/", createInteractionController);
router.patch("/:id/status", updateInteractionStatusController);

export default router;