import { useState, useEffect, useCallback } from 'react'
import type { FilterState, CountyData } from '../types'

interface ControlsProps {
  countyData: CountyData[]
  initialFilters: FilterState
  onFiltersChange: (filters: FilterState) => void
}

export default function Controls({ countyData, initialFilters, onFiltersChange }: ControlsProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [states, setStates] = useState<string[]>([])
  const [debouncedFilters, setDebouncedFilters] = useState<FilterState>(initialFilters)

  // Extract unique states from data
  useEffect(() => {
    const uniqueStates = [...new Set(countyData.map((c) => c.state))].sort()
    setStates(uniqueStates)
  }, [countyData])

  // Compute min/max ratio from data
  const ratioRange = useCallback(() => {
    if (!countyData.length) return { min: 0, max: 5 }
    const ratios = countyData.map((c) => c.income_to_rent_ratio)
    return { min: Math.floor(Math.min(...ratios) * 100) / 100, max: Math.ceil(Math.max(...ratios) * 100) / 100 }
  }, [countyData])

  // Debounce filter changes (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters)
      onFiltersChange(filters)
    }, 300)
    return () => clearTimeout(timer)
  }, [filters, onFiltersChange])

  const handleRatioChange = (min: number, max: number) => {
    setFilters((f) => ({ ...f, minRatio: min, maxRatio: max }))
  }

  const handleStateToggle = (state: string) => {
    setFilters((f) => ({
      ...f,
      states: f.states.includes(state)
        ? f.states.filter((s) => s !== state)
        : [...f.states, state],
    }))
  }

  const { min, max } = ratioRange()

  return (
    <aside aria-labelledby="controls-heading" style={{ padding: '1rem', maxWidth: '320px' }}>
      <h2 id="controls-heading" style={{ marginTop: 0 }}>Filters</h2>

      <fieldset style={{ marginBottom: '1.5rem' }}>
        <legend>Income-to-Rent Ratio Range</legend>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
          <label htmlFor="min-ratio" style={{ minWidth: '50px' }}>
            Min: {filters.minRatio.toFixed(2)}
          </label>
          <input
            type="range"
            id="min-ratio"
            min={min.toString()}
            max={max.toString()}
            step="0.01"
            value={filters.minRatio}
            onChange={(e) => handleRatioChange(parseFloat(e.target.value), filters.maxRatio)}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={filters.minRatio}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <label htmlFor="max-ratio" style={{ minWidth: '50px' }}>
            Max: {filters.maxRatio.toFixed(2)}
          </label>
          <input
            type="range"
            id="max-ratio"
            min={min.toString()}
            max={max.toString()}
            step="0.01"
            value={filters.maxRatio}
            onChange={(e) => handleRatioChange(filters.minRatio, parseFloat(e.target.value))}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={filters.maxRatio}
          />
        </div>
      </fieldset>

      <fieldset style={{ marginBottom: '1.5rem' }}>
        <legend>States (hold Ctrl/Cmd for multi-select)</legend>
        <select
          multiple
          size={6}
          style={{ width: '100%', maxHeight: '200px', overflow: 'auto' }}
          value={filters.states}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions).map((o) => o.value)
            setFilters((f) => ({ ...f, states: selected }))
          }}
          aria-label="Select states to filter"
        >
          {states.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
        <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
          {filters.states.length} of {states.length} selected
        </p>
      </fieldset>

      <button
        onClick={() => {
          const { min, max } = ratioRange()
          setFilters({ minRatio: min, maxRatio: max, states: [] })
        }}
        style={{ width: '100%', padding: '0.5rem' }}
      >
        Reset Filters
      </button>
    </aside>
  )
}
