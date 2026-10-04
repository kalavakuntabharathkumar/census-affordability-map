export interface CountyData {
  geoid: string
  name: string
  state: string
  median_income: number
  median_rent: number
  income_to_rent_ratio: number
}

export interface GeoFeature {
  type: 'Feature'
  properties: {
    GEOID: string
    NAME: string
    STATE: string
  }
  geometry: GeoJSON.Geometry
}

export interface GeoJsonData {
  type: 'FeatureCollection'
  features: GeoFeature[]
}

export interface FilterState {
  minRatio: number
  maxRatio: number
  states: string[]
}
