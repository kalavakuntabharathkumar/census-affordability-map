import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import { useMemo } from 'react'
import 'leaflet/dist/leaflet.css'
import type { CountyData, GeoJsonData, FilterState } from '../types'
import L from 'leaflet'

// Fix default marker icons for Leaflet + Vite
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function CountyLayer({
  geojson,
  countyData,
  filters,
  onCountyClick,
}: {
  geojson: GeoJsonData | null
  countyData: CountyData[]
  filters: FilterState
  onCountyClick: (county: CountyData | null) => void
}) {
  const map = useMap()

  // Build lookup for O(1) ratio access
  const ratioMap = useMemo(() => {
    const m = new Map<string, number>()
    countyData.forEach((c) => m.set(c.geoid, c.income_to_rent_ratio))
    return m
  }, [countyData])

  const getColor = (ratio: number | undefined) => {
    if (ratio === undefined) return '#e0e0e0'
    // Diverging color scale: red (low affordability) -> white -> green (high)
    const clamped = Math.max(0, Math.min(1, (ratio - filters.minRatio) / (filters.maxRatio - filters.minRatio)))
    const r = clamped < 0.5 ? 255 : Math.round(255 * (1 - clamped) * 2)
    const g = clamped < 0.5 ? Math.round(255 * clamped * 2) : 255
    return `rgb(${r}, ${g}, 100)`
  }

  const style = (feature: GeoJsonData['features'][0]) => {
    const geoid = feature.properties.GEOID
    const ratio = ratioMap.get(geoid)
    const inRange = ratio !== undefined && ratio >= filters.minRatio && ratio <= filters.maxRatio
    const stateMatch = filters.states.length === 0 || filters.states.includes(feature.properties.STATE)
    return {
      fillColor: inRange && stateMatch ? getColor(ratio) : '#f5f5f5',
      weight: 0.5,
      opacity: 1,
      color: '#666',
      fillOpacity: inRange && stateMatch ? 0.75 : 0.3,
    }
  }

  const highlightStyle = {
    weight: 2,
    color: '#000',
    fillOpacity: 0.9,
  }

  if (!geojson) return null

  return (
    <GeoJSON
      data={geojson}
      style={style}
      onEachFeature={(feature, layer) => {
        const geoid = feature.properties.GEOID
        const county = countyData.find((c) => c.geoid === geoid)
        layer.on({
          mouseover: (e) => e.target.setStyle(highlightStyle),
          mouseout: (e) => e.target.setStyle(style(feature)),
          click: () => onCountyClick(county ?? null),
        })
        if (county) {
          layer.bindTooltip(
            `<strong>${county.name}</strong><br/>Ratio: ${county.income_to_rent_ratio.toFixed(2)}<br/>Income: $${county.median_income.toLocaleString()}<br/>Annual Rent: $${county.median_rent.toLocaleString()}`,
            { sticky: true, direction: 'top' }
          )
        }
      }}
    />
  )
}

export default function Map({
  geojson,
  countyData,
  filters,
  onCountyClick,
}: {
  geojson: GeoJsonData | null
  countyData: CountyData[]
  filters: FilterState
  onCountyClick: (county: CountyData | null) => void
}) {
  return (
    <MapContainer
      center={[39.8283, -98.5795]}
      zoom={4}
      style={{ width: '100%', height: '100%', minHeight: '500px' }}
      aria-label="Choropleth map of US counties colored by income-to-rent ratio"
      tabIndex={0}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <CountyLayer
        geojson={geojson}
        countyData={countyData}
        filters={filters}
        onCountyClick={onCountyClick}
      />
    </MapContainer>
  )
}
