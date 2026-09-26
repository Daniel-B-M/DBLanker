import {
    findAgentMetrics,
    findDailyVolume,
    type AgentMetrics,
    type DailyVolumeMetric,
} from "./metrics.repository.js";

import { BUSINESS_TIMEZONE } from "../../config/environment.js";

export async function getAgentMetrics(
    from: string,
    to: string
): Promise<AgentMetrics[]> {
    return findAgentMetrics(
        from,
        to,
        BUSINESS_TIMEZONE
    );
}

export async function getDailyVolume(
    from: string,
    to: string
): Promise<DailyVolumeMetric[]> {
    return findDailyVolume(
        from,
        to,
        BUSINESS_TIMEZONE
    );
}