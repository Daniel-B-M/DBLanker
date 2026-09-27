export interface AgentMetrics {
    agentId: number
    agentName: string
    totalInteractions: number
    resolvedInteractions: number
    resolutionRate: number
    averageResolutionMinutes: number | null
}

export interface MetricsFilters {
    from: string
    to: string
}

const API_URL = 'http://localhost:3000/api'

export async function getAgentMetrics(
    filters: MetricsFilters,
): Promise<AgentMetrics[]> {
    const params = new URLSearchParams({
        from: filters.from,
        to: filters.to,
    })

    const response = await fetch(
        `${API_URL}/metrics/agents?${params.toString()}`,
    )

    if (!response.ok) {
        throw new Error('Failed to load agent metrics')
    }

    return response.json()
}

export interface DailyVolumeMetric {
    date: string
    totalInteractions: number
}

export async function getDailyVolume(
    filters: MetricsFilters,
): Promise<DailyVolumeMetric[]> {
    const params = new URLSearchParams({
        from: filters.from,
        to: filters.to,
    })

    const response = await fetch(
        `${API_URL}/metrics/daily-volume?${params.toString()}`,
    )

    if (!response.ok) {
        throw new Error('Failed to load daily volume')
    }

    return response.json()
}