import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  getInteractions,
  type Interaction,
  type InteractionFilters,
  type Pagination,
} from '../services/interactions.api'
import {
  getAgents,
  type Agent,
} from '../services/agents.api'
import { formatTimezoneLabel } from '../utils/timezone'

interface InteractionsPageProps {
  timezone: string | null
  visible: boolean
}

function InteractionsPage({ timezone, visible }: InteractionsPageProps) {
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [appliedFilters, setAppliedFilters] =
    useState<InteractionFilters>({})
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [agentId, setAgentId] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const operationDateFormatter = useMemo(
    () =>
      timezone
        ? new Intl.DateTimeFormat('es-CO', {
            timeZone: timezone,
            dateStyle: 'short',
            timeStyle: 'medium',
          })
        : null,
    [timezone],
  )

  async function loadInteractions(filters: InteractionFilters = {}) {
    try {
      setLoading(true)
      setError(null)

      const response = await getInteractions(filters)

      setInteractions(response.data)
      setPagination(response.pagination)
    } catch (error) {
      console.error(error)
      setError('Unable to load interactions.')
    } finally {
      setLoading(false)
    }
  }

  // Initial load. State is only updated after each request finishes.
  useEffect(() => {
    async function loadInitialData() {
      const [interactionsResult, agentsResult] = await Promise.allSettled([
        getInteractions(),
        getAgents(),
      ])

      if (interactionsResult.status === 'fulfilled') {
        setInteractions(interactionsResult.value.data)
        setPagination(interactionsResult.value.pagination)
      } else {
        console.error(interactionsResult.reason)
        setError('Unable to load interactions.')
      }

      if (agentsResult.status === 'fulfilled') {
        setAgents(agentsResult.value)
      } else {
        console.error('Unable to load agents:', agentsResult.reason)
      }

      setLoading(false)
    }

    loadInitialData()
  }, [])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const filters: InteractionFilters = {
      agentId: agentId ? Number(agentId) : undefined,
      type: type || undefined,
      status: status || undefined,
      from: from || undefined,
      to: to || undefined,
      page: 1,
    }

    setAppliedFilters(filters)
    loadInteractions(filters)
  }

  function handleClearFilters() {
    setAgentId('')
    setType('')
    setStatus('')
    setFrom('')
    setTo('')

    setAppliedFilters({})
    loadInteractions()
  }

  function handlePageChange(page: number) {
    const filters = {
      ...appliedFilters,
      page,
    }

    setAppliedFilters(filters)
    loadInteractions(filters)
  }

  if (!timezone || !operationDateFormatter) return null

  return (
    <section hidden={!visible}>
      <h2>Interactions</h2>
      <p>Dates and times in {formatTimezoneLabel(timezone)}.</p>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="agentId">Agent</label>

          <select
            id="agentId"
            value={agentId}
            onChange={(event) => setAgentId(event.target.value)}
          >
            <option value="">All agents</option>

            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="type">Type</label>
          <select
            id="type"
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            <option value="">All types</option>
            <option value="CALL">CALL</option>
            <option value="TICKET">TICKET</option>
          </select>
        </div>

        <div>
          <label htmlFor="status">Status</label>
          <select
            id="status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>
        </div>

        <div>
          <label htmlFor="from">From</label>
          <input
            id="from"
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="to">To</label>
          <input
            id="to"
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </div>

        <button type="submit">Apply filters</button>

        <button type="button" onClick={handleClearFilters}>
          Clear filters
        </button>
      </form>

      {loading && <p>Loading interactions...</p>}

      {error && <p>{error}</p>}

      {!loading && !error && interactions.length === 0 && (
        <p>No interactions found.</p>
      )}

      {!loading && !error && interactions.length > 0 && (
        <>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Agent</th>
                <th>Type</th>
                <th>Status</th>
                <th>Opened at</th>
                <th>Closed at</th>
              </tr>
            </thead>

            <tbody>
              {interactions.map((interaction) => (
                <tr key={interaction.id}>
                  <td>{interaction.id}</td>
                  <td>{interaction.agentName}</td>
                  <td>{interaction.type}</td>
                  <td>{interaction.status}</td>
                  <td>
                    {operationDateFormatter.format(new Date(interaction.openedAt))}
                  </td>
                  <td>
                    {interaction.closedAt
                      ? operationDateFormatter.format(new Date(interaction.closedAt))
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pagination && (
            <div className="pagination">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() =>
                  handlePageChange(pagination.page - 1)
                }
              >
                Previous
              </button>

              <span>
                Page {pagination.page} of {pagination.totalPages}
                {' '}({pagination.total} interactions)
              </span>

              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() =>
                  handlePageChange(pagination.page + 1)
                }
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default InteractionsPage
