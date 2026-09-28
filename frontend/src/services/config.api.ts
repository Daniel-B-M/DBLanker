export interface AppConfig {
    businessTimezone: string
}

const API_URL = 'http://localhost:3000/api'

export async function getConfig(): Promise<AppConfig> {
    const response = await fetch(`${API_URL}/config`)

    if (!response.ok) {
        throw new Error('Failed to load configuration')
    }

    return response.json()
}
