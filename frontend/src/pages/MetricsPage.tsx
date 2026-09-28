import { useState, type FormEvent } from 'react'
import AgentMetricsTable from '../components/AgentMetricsTable'
import {
    getAgentMetrics,
    getDailyVolume,
    type AgentMetrics,
    type DailyVolumeMetric,
} from '../services/metrics.api'

interface MetricsPageProps {
    timezoneLabel: string
    visible: boolean
}

function MetricsPage({ timezoneLabel, visible }: MetricsPageProps) {
    const [from, setFrom] = useState('2026-09-01')
    const [to, setTo] = useState('2026-09-14')
    const [metrics, setMetrics] = useState<AgentMetrics[] | null>(null)
    const [dailyVolume, setDailyVolume] = useState<DailyVolumeMetric[] | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError(null)
        setMetrics(null)
        setDailyVolume(null)

        if (from > to) {
            setError('From cannot be later than To.')
            return
        }

        const rangeDays =
            (Date.parse(`${to}T00:00:00Z`) -
                Date.parse(`${from}T00:00:00Z`)) /
            86_400_000 +
            1

        if (rangeDays > 366) {
            setError('Date range cannot exceed 366 days.')
            return
        }

        try {
            setLoading(true)

            const [agentMetrics, dailyMetrics] = await Promise.all([
                getAgentMetrics({ from, to }),
                getDailyVolume({ from, to }),
            ])

            setMetrics(agentMetrics)
            setDailyVolume(dailyMetrics)
        } catch (error) {
            console.error(error)
            setError('Unable to load metrics.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <section hidden={!visible}>
            <h2>Metrics</h2>
            <p>Days are grouped in {timezoneLabel}.</p>

            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="metrics-from">From</label>
                    <input
                        id="metrics-from"
                        type="date"
                        required
                        value={from}
                        disabled={loading}
                        onChange={(event) => setFrom(event.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="metrics-to">To</label>
                    <input
                        id="metrics-to"
                        type="date"
                        required
                        value={to}
                        disabled={loading}
                        onChange={(event) => setTo(event.target.value)}
                    />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Loading...' : 'Load metrics'}
                </button>
            </form>

            {error && <p role="alert">{error}</p>}

            {!loading && !error && metrics === null && (
                <p>Select a date range and load metrics.</p>
            )}

            {!loading && !error && metrics !== null && (
                <AgentMetricsTable metrics={metrics} />
            )}

            {!loading && !error && dailyVolume !== null && (
                <>
                    <h3>Daily volume</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Total interactions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {dailyVolume.map((day) => (
                                <tr key={day.date}>
                                    <td>{day.date.split('-').reverse().join('/')}</td>
                                    <td>{day.totalInteractions}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}
        </section>
    )
}

export default MetricsPage