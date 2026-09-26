export interface Interaction {
    id: number
    agentId: number
    agentName: string
    type: string
    status: string
    openedAt: string
    closedAt: string | null
}

export interface Pagination {
    page: number
    limit: number
    total: number
    totalPages: number
}

export interface InteractionsResponse {
    data: Interaction[]
    pagination: Pagination
}

export interface InteractionFilters {
    agentId?: number
    type?: string
    status?: string
    from?: string
    to?: string
    page?: number
    limit?: number
}

const API_URL = 'http://localhost:3000/api'

export async function getInteractions(
    filters: InteractionFilters = {},
): Promise<InteractionsResponse> {
    const params = new URLSearchParams()

    if (filters.agentId) {
        params.set('agentId', filters.agentId.toString())
    }

    if (filters.type) {
        params.set('type', filters.type)
    }

    if (filters.status) {
        params.set('status', filters.status)
    }

    if (filters.from) {
        params.set('from', filters.from)
    }

    if (filters.to) {
        params.set('to', filters.to)
    }

    if (filters.page) {
        params.set('page', filters.page.toString())
    }

    if (filters.limit) {
        params.set('limit', filters.limit.toString())
    }

    const queryString = params.toString()

    const url = queryString
        ? `${API_URL}/interactions?${queryString}`
        : `${API_URL}/interactions`

    const response = await fetch(url)

    if (!response.ok) {
        throw new Error('Failed to load interactions')
    }

    return response.json()
}