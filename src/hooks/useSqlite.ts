import { useState, useEffect, useCallback, useRef } from 'react'
import initSqlJs, { Database } from 'sql.js'
import type { CountyData } from '../types'

// sql.js loads a WASM binary; we use the CDN version via import
const SQL_WASM_URL = 'https://sql.js.org/dist/sql-wasm.wasm'

export function useSqlite(countyData: CountyData[]) {
  const [db, setDb] = useState<Database | null>(null)
  const [ready, setReady] = useState(false)
  const initRef = useRef(false)

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    async function init() {
      try {
        const SQL = await initSqlJs({ locateFile: () => SQL_WASM_URL })
        const database = new SQL.Database()

        // Create table and index for fast filtering
        database.run(`
          CREATE TABLE counties (
            geoid TEXT PRIMARY KEY,
            name TEXT,
            state TEXT,
            median_income INTEGER,
            median_rent INTEGER,
            income_to_rent_ratio REAL
          )
        `)
        database.run('CREATE INDEX idx_ratio ON counties(income_to_rent_ratio)')
        database.run('CREATE INDEX idx_state ON counties(state)')

        // Bulk insert using a transaction for speed
        const stmt = database.prepare(
          'INSERT INTO counties VALUES (?, ?, ?, ?, ?, ?)'
        )
        for (const c of countyData) {
          stmt.run([c.geoid, c.name, c.state, c.median_income, c.median_rent, c.income_to_rent_ratio])
        }
        stmt.free()

        setDb(database)
        setReady(true)
      } catch (err) {
        console.error('sql.js init failed:', err)
      }
    }
    init()
  }, [countyData])

  const query = useCallback(
    (sql: string, params: (string | number)[] = []) => {
      if (!db) return []
      try {
        const stmt = db.prepare(sql)
        const results: any[] = []
        while (stmt.step()) results.push(stmt.getAsObject())
        stmt.free()
        return results
      } catch (err) {
        console.error('Query failed:', err)
        return []
      }
    },
    [db]
  )

  const filterByRatio = useCallback(
    (minRatio: number, maxRatio: number, states: string[] = []) => {
      let sql = 'SELECT geoid, income_to_rent_ratio FROM counties WHERE income_to_rent_ratio BETWEEN ? AND ?'
      const params: (string | number)[] = [minRatio, maxRatio]
      if (states.length > 0) {
        sql += ` AND state IN (${states.map(() => '?').join(',')})`
        params.push(...states)
      }
      return query(sql, params)
    },
    [query]
  )

  const getStats = useCallback(() => {
    return query(`
      SELECT 
        MIN(income_to_rent_ratio) as minRatio,
        MAX(income_to_rent_ratio) as maxRatio,
        AVG(income_to_rent_ratio) as avgRatio,
        COUNT(*) as count
      FROM counties
    `)[0]
  }, [query])

  const getTopCounties = useCallback(
    (limit: number, ascending = false) => {
      return query(
        `SELECT geoid, name, state, income_to_rent_ratio, median_income, median_rent 
         FROM counties ORDER BY income_to_rent_ratio ${ascending ? 'ASC' : 'DESC'} LIMIT ?`,
        [limit]
      )
    },
    [query]
  )

  return { ready, filterByRatio, getStats, getTopCounties }
}
