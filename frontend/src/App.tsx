import { useEffect, useState } from 'react'
import { getConfig } from './services/config.api'
import { formatTimezoneLabel } from './utils/timezone'
import InteractionsPage from './pages/InteractionsPage'
import MetricsPage from './pages/MetricsPage'

function App() {
  const [activeView, setActiveView] =
    useState<'interactions' | 'metrics'>('interactions')
  const [timezone, setTimezone] = useState<string | null>(null)
  const [configError, setConfigError] = useState<string | null>(null)

  useEffect(() => {
    async function loadConfig() {
      try {
        const config = await getConfig()
        setTimezone(config.businessTimezone)
      } catch (error) {
        console.error('Unable to load configuration:', error)
        setConfigError('Unable to load the operation time zone.')
      }
    }

    loadConfig()
  }, [])

  return (
    <main>
      <h1>WeKall Dashboard</h1>

      {configError && <p role="alert">{configError}</p>}

      <nav aria-label="Dashboard views">
        <button
          type="button"
          aria-pressed={activeView === 'interactions'}
          onClick={() => setActiveView('interactions')}
        >
          Interactions
        </button>
        <button
          type="button"
          aria-pressed={activeView === 'metrics'}
          onClick={() => setActiveView('metrics')}
        >
          Metrics
        </button>
      </nav>

      {!timezone && !configError && <p>Loading configuration...</p>}

      <InteractionsPage
        timezone={timezone}
        visible={activeView === 'interactions'}
      />

      {timezone && (
        <MetricsPage
          timezoneLabel={formatTimezoneLabel(timezone)}
          visible={activeView === 'metrics'}
        />
      )}
    </main>
  )
}

export default App

