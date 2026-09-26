export interface Agent {
    id: number
    name: string
}

const API_URL = 'http://localhost:3000/api'

export async function getAgents(): Promise<Agent[]> {
    const response = await fetch(`${API_URL}/agents`)

    if (!response.ok) {
        throw new Error('Failed to load agents')
    }

    return response.json()
}