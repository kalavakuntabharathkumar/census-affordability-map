import type { CountyData } from '../types'

interface CountyDetailProps {
  county: CountyData | null
}

export default function CountyDetail({ county }: CountyDetailProps) {
  if (!county) {
    return (
      <section aria-labelledby="detail-heading" style={{ padding: '1rem', background: '#fafafa', borderRadius: '8px' }}>
        <h2 id="detail-heading">County Details</h2>
        <p>Click a county on the map to see details.</p>
      </section>
    )
  }

  const affordabilityLabel = county.income_to_rent_ratio >= 3 ? 'Affordable' : county.income_to_rent_ratio >= 2 ? 'Moderate' : 'Cost-Burdened'

  return (
    <section aria-labelledby="detail-heading" style={{ padding: '1rem', background: '#fafafa', borderRadius: '8px' }}>
      <h2 id="detail-heading">{county.name}, {county.state}</h2>
      <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem 1rem' }}>
        <dt>Income-to-Rent Ratio</dt>
        <dd><strong>{county.income_to_rent_ratio.toFixed(2)}</strong> ({affordabilityLabel})</dd>
        <dt>Median Household Income</dt>
        <dd>${county.median_income.toLocaleString()}</dd>
        <dt>Median Annual Rent</dt>
        <dd>${county.median_rent.toLocaleString()}</dd>
        <dt>Median Monthly Rent</dt>
        <dd>${(county.median_rent / 12).toLocaleString()}</dd>
      </dl>
      <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '1rem' }}>
        Source: US Census Bureau ACS 2022 5-Year Estimates (Tables B19013, B25064).
        Ratio = Median Income / (Median Gross Rent × 12).
        Values < 2 indicate severe cost burden; > 3 generally affordable.
      </p>
    </section>
  )
}
