import { API_URL } from './config.api';

export interface Agent {
    id: number
    name: string
}



export async function getAgents(): Promise<Agent[]> {
    const response = await fetch(`${API_URL}/agents`)

    if (!response.ok) {
        throw new Error('Failed to load agents')
    }

    return response.json()
}