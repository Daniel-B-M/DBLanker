import {
    findAllAgents,
    findAgentById,
} from "./agent.repository.js";

export async function getAllAgents() {
    return await findAllAgents();
}

export async function getAgentById(id: number) {
    return await findAgentById(id);
}