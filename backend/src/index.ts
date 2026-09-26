import "dotenv/config";
import express from "express";
import cors from "cors";

import agentRoutes from "./modules/agents/agent.routes.js";
import interactionRoutes from "./modules/interactions/interaction.routes.js";
import metricsRoutes from "./modules/metrics/metrics.routes.js";

import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

app.use(
    cors({
        origin: "http://localhost:5173",
    }),
);

app.use(express.json());

const PORT = Number(process.env.PORT ?? 3000);

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
}

app.use(express.json());

app.use("/api/agents", agentRoutes);
app.use("/api/interactions", interactionRoutes);
app.use("/api/metrics", metricsRoutes);

app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});

app.use((_req, res) => {
    res.status(404).json({
        error: {
            code: "ROUTE_NOT_FOUND",
            message: "Route not found",
        },
    });
});

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});