# Census Income & Housing Affordability Mapper

Client-side SQL-powered choropleth mapping 3,200+ US counties' income-to-rent ratios using Census ACS data with zero backend.

## Features

- **Client-side SQL querying** via sql.js (SQLite compiled to WASM) for sub-100ms affordability filtering
- **Debounced Census API fetching** with IndexedDB cache and stale-while-revalidate pattern
- **Interactive choropleth map** using Leaflet with tooltips and keyboard navigation
- **Recharts visualizations** for top/bottom affordability counties
- **Automated WCAG 2.1 AA audit** pipeline integrated via axe-core

## Data Sources

- **US Census Bureau ACS API**: Tables `B19013` (median household income) and `B25064` (median gross rent), 2022 5-year estimates
- **County Boundaries**: Census TIGER/Line 2022 generalized boundaries (20m resolution) via Plotly's hosted GeoJSON

## Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173

## Build & Preview

```bash
npm run build
npm run preview
```

## Accessibility Audit

Run the automated WCAG 2.1 AA audit (requires built site):

```bash
npm run build
npm run test:a11y
```

This launches a headless Chromium instance, injects axe-core, and fails the build if any violations are found.

## Project Structure

```
src/
├── main.tsx              # React entry point
├── App.tsx               # Main application component
├── types.ts              # TypeScript interfaces
├── styles.css            # Global styles
├── hooks/
│   ├── useCensusData.ts  # Census API fetching + IndexedDB caching
│   └── useSqlite.ts      # sql.js initialization & querying
├── utils/
│   ├── census.ts         # Census API helpers
│   └── accessibility.ts  # axe-core audit runner
└── components/
    ├── Map.tsx           # Leaflet choropleth map
    ├── Chart.tsx         # Recharts bar charts
    ├── Controls.tsx      # Filter controls (ratio slider, state multi-select)
    └── CountyDetail.tsx  # Clicked county detail panel
```

## Performance Notes

- sql.js WASM loads ~1.2 MB; initializes in ~200ms on modern devices
- County data (~3,200 rows) inserts into SQLite in ~50ms
- Filter queries execute in <5ms via indexed columns
- IndexedDB cache avoids repeat API calls for 7 days
- Leaflet tiles lazy-load; map only mounts when visible

## License

MIT
