const CENSUS_API_BASE = 'https://api.census.gov/data/2022/acs/acs5'
const INCOME_TABLE = 'B19013_001E' // Median household income
const RENT_TABLE = 'B25064_001E'   // Median gross rent

// Census allows up to 50 variables per request; we need 2 + GEOID + NAME
export async function fetchCountyData(): Promise<Array<{
  geoid: string
  name: string
  state: string
  income: number
  rent: number
}>> {
  const vars = `NAME,${INCOME_TABLE},${RENT_TABLE}`
  const url = `${CENSUS_API_BASE}?get=${vars}&for=county:*&in=state:*`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Census API error: ${response.status} ${response.statusText}`)
  }

  const json = await response.json()
  // First row is headers: [NAME, B19013_001E, B25064_001E, state, county]
  const [headers, ...rows] = json

  return rows
    .map((row: string[]) => {
      const [name, incomeStr, rentStr, stateFips, countyFips] = row
      const income = parseInt(incomeStr, 10)
      const rent = parseInt(rentStr, 10)
      // Skip invalid/missing data (negative values indicate suppression)
      if (income <= 0 || rent <= 0) return null
      const geoid = `${stateFips}${countyFips}`
      return { geoid, name, state: stateFips, income, rent }
    })
    .filter((d): d is NonNullable<typeof d> => d !== null)
}

export async function fetchCountyBoundaries(): Promise<GeoJsonData> {
  // Using Census TIGER/Line 2022 county boundaries (simplified 20m)
  const url = 'https://www2.census.gov/geo/tiger/GENZ2022/shp/cb_2022_us_county_20m.zip'
  // For client-side only, we use a hosted GeoJSON mirror
  const geojsonUrl = 'https://raw.githubusercontent.com/plotly/datasets/master/geojson-counties-fips.json'
  const response = await fetch(geojsonUrl)
  if (!response.ok) {
    throw new Error(`Failed to load county boundaries: ${response.status}`)
  }
  return response.json()
}
