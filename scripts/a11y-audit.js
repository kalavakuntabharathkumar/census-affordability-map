import { chromium } from 'playwright'
import axeSource from 'axe-core/source/axe.js'
import fs from 'fs'

// CI script: runs axe-core on the built site via Playwright
// Usage: npm run build && node scripts/a11y-audit.js

async function runAudit() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  // Inject axe-core
  await page.addScriptTag({ content: axeSource })
  
  // Serve the built dist folder
  const port = 8765
  const server = Bun.serve({
    port,
    fetch(req) {
      return new Response(Bun.file(`dist${new URL(req.url).pathname}`))
    }
  })

  try {
    await page.goto(`http://localhost:${port}`, { waitUntil: 'networkidle' })
    
    const results = await page.evaluate(() => {
      // @ts-ignore axe is injected globally
      return axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2aa', 'wcag21aa'] },
        resultTypes: ['violations']
      })
    })

    if (results.violations.length > 0) {
      console.error('❌ Accessibility violations found:')
      results.violations.forEach((v: any) => {
        console.error(`  [${v.impact}] ${v.help} (${v.nodes.length} nodes)`)
        v.nodes.forEach((n: any) => console.error('    ', n.target.join(' > ')))
      })
      process.exitCode = 1
    } else {
      console.log('✅ No WCAG 2.1 AA violations found')
    }
  } finally {
    await browser.close()
    server.stop()
  }
}

runAudit()
