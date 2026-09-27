import type { AgentMetrics } from '../services/metrics.api'

interface AgentMetricsTableProps {
    metrics: AgentMetrics[]
}

function AgentMetricsTable({ metrics }: AgentMetricsTableProps) {
    if (metrics.length === 0) {
        return <p>No agent metrics found.</p>
    }

    return (
        <table>
            <thead>
                <tr>
                    <th>Agent</th>
                    <th>Total interactions</th>
                    <th>Resolved interactions</th>
                    <th>Resolution rate</th>
                    <th>Average resolution time</th>
                </tr>
            </thead>

            <tbody>
                {metrics.map((metric) => (
                    <tr key={metric.agentId}>
                        <td>{metric.agentName}</td>
                        <td>{metric.totalInteractions}</td>
                        <td>{metric.resolvedInteractions}</td>
                        <td>{metric.resolutionRate.toFixed(2)}%</td>
                        <td>
                            {metric.averageResolutionMinutes === null
                                ? '—'
                                : `${metric.averageResolutionMinutes.toFixed(2)} min`}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

export default AgentMetricsTable