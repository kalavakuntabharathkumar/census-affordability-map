import { useState, useEffect } from 'react'
import { useCensusData } from './hooks/useCensusData'
import { useSqlite } from './hooks/useSqlite'
import { initA11yAudit } from './utils/accessibility'
import Map from './components/Map'
import Chart from './components/Chart'
import Controls from './components/Controls'
import CountyDetail from './components/CountyDetail'
import type { CountyData, FilterState } from './types'

function App() {
  const { countyData, boundaries, loading, error, refetch } = useCensusData()
  const { ready, filterByRatio, getStats, getTopCounties } = useSqlite(countyData)

  const [filters, setFilters] = useState<FilterState>({ minRatio: 0, maxRatio: 5, states: [] })
  const [selectedCounty, setSelectedCounty] = useState<CountyData | null>(null)
  const [filteredCounties, setFilteredCounties] = useState<CountyData[]>([])
  const [stats, setStats] = useState<{ minRatio: number; maxRatio: number; avgRatio: number; count: number } | null>(null)

  // Run accessibility audit in development
  useEffect(() => {
    initA11yAudit()
  }, [])

  // Update filtered counties when filters change
  useEffect(() => {
    if (!ready) return
    const results = filterByRatio(filters.minRatio, filters.maxRatio, filters.states)
    const filtered = results.map((r) => countyData.find((c) => c.geoid === r.geoid)!).filter(Boolean)
    setFilteredCounties(filtered)
    const s = getStats()
    if (s) setStats(s)
  }, [filters, ready, filterByRatio, getStats, countyData])

  if (loading) {
    return (
      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div role="status" aria-live="polite">Loading Census data…</div>
      </main>
    )
  }

  if (error) {
    return (
      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Error Loading Data</h1>
        <p>{error}</p>
        <button onClick={refetch}>Retry</button>
      </main>
    )
  }

  const top5 = getTopCounties(5, false)
  const bottom5 = getTopCounties(5, true)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', padding: '1rem', maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ gridColumn: '1 / -1' }}>
        <h1>Census Income &amp; Housing Affordability Mapper</h1>
        <p style={{ color: '#666', maxWidth: '800px' }}>
          Explore income-to-rent ratios across 3,200+ US counties. Data from US Census ACS 2022 5-Year Estimates.
          Ratio = Median Household Income ÷ (Median Gross Rent × 12). Values below 2 indicate severe cost burden.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1rem' }}>
        <Controls
          countyData={countyData}
          initialFilters={filters}
          onFiltersChange={setFilters}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Map
            geojson={boundaries}
            countyData={countyData}
            filters={filters}
            onCountyClick={setSelectedCounty}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Chart data={top5} title="Top 5 Most Affordable Counties" />
            <Chart data={bottom5} title="Top 5 Least Affordable Counties" />
          </div>

          <CountyDetail county={selectedCounty} />
        </div>
      </div>

      {stats && (
        <footer style={{ gridColumn: '1 / -1', padding: '1rem', background: '#f5f5f5', borderRadius: '8px', fontSize: '0.9rem' }}>
          <strong>Summary:</strong> {stats.count} counties | Avg Ratio: {stats.avgRatio.toFixed(2)} | Range: {stats.minRatio.toFixed(2)} – {stats.maxRatio.toFixed(2)}
        </footer>
      )}
    </div>
  )
}

export default App
