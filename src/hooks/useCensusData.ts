import { useState, useEffect, useCallback } from 'react'
import { openDB, DBSchema, IDBPDatabase } from 'idb'
import { fetchCountyData, fetchCountyBoundaries } from '../utils/census'
import type { CountyData, GeoJsonData } from '../types'

interface CensusCache extends DBSchema {
  countyData: {
    key: string
    value: { data: CountyData[]; timestamp: number }
  }
  boundaries: {
    key: string
    value: { data: GeoJsonData; timestamp: number }
  }
}

const DB_NAME = 'census-affordability-db'
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

let dbPromise: Promise<IDBPDatabase<CensusCache>> | null = null
function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<CensusCache>(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore('countyData')
        db.createObjectStore('boundaries')
      },
    })
  }
  return dbPromise
}

export function useCensusData() {
  const [countyData, setCountyData] = useState<CountyData[]>([])
  const [boundaries, setBoundaries] = useState<GeoJsonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadFromCache = useCallback(async () => {
    const db = await getDB()
    const [cachedCounties, cachedBoundaries] = await Promise.all([
      db.get('countyData', 'latest'),
      db.get('boundaries', 'latest'),
    ])
    const now = Date.now()

    if (cachedCounties && now - cachedCounties.timestamp < CACHE_DURATION) {
      setCountyData(cachedCounties.data)
    }
    if (cachedBoundaries && now - cachedBoundaries.timestamp < CACHE_DURATION) {
      setBoundaries(cachedBoundaries.data)
    }

    return !!cachedCounties && !!cachedBoundaries
  }, [])

  const fetchAndCache = useCallback(async () => {
    try {
      setError(null)
      const [counties, geo] = await Promise.all([
        fetchCountyData(),
        fetchCountyBoundaries(),
      ])

      // Compute income-to-rent ratio (annual rent = monthly * 12)
      const processed: CountyData[] = counties.map((c) => ({
        ...c,
        median_income: c.income,
        median_rent: c.rent * 12,
        income_to_rent_ratio: c.income / (c.rent * 12),
      }))

      setCountyData(processed)
      setBoundaries(geo)

      const db = await getDB()
      const now = Date.now()
      await Promise.all([
        db.put('countyData', { data: processed, timestamp: now }, 'latest'),
        db.put('boundaries', { data: geo, timestamp: now }, 'latest'),
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    let debounceTimer: ReturnType<typeof setTimeout>

    async function init() {
      const hasCache = await loadFromCache()
      if (!mounted) return
      if (!hasCache) {
        // Debounce initial fetch to avoid hammering API on rapid reloads
        debounceTimer = setTimeout(() => {
          if (mounted) fetchAndCache()
        }, 300)
      } else {
        setLoading(false)
      }
    }

    init()
    return () => {
      mounted = false
      clearTimeout(debounceTimer)
    }
  }, [loadFromCache, fetchAndCache])

  return { countyData, boundaries, loading, error, refetch: fetchAndCache }
}
