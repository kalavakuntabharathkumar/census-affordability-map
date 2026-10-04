import axe from 'axe-core'

// Run axe-core audit and log violations to console
// In CI, this can be run via Playwright/Puppeteer and fail the build

export async function runA11yAudit(): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    const results = await axe.run(document, {
      runOnly: {
        type: 'tag',
        values: ['wcag2aa', 'wcag21aa'],
      },
      resultTypes: ['violations'],
    })

    if (results.violations.length > 0) {
      console.group('🔍 Accessibility Violations (WCAG 2.1 AA)')
      results.violations.forEach((v) => {
        console.error(`[${v.impact}] ${v.help} (${v.nodes.length} nodes)`)
        console.log(v.helpUrl)
        v.nodes.forEach((n) => console.log('  ', n.target.join(' > ')))
      })
      console.groupEnd()
    } else {
      console.log('✅ No WCAG 2.1 AA violations found')
    }
  } catch (err) {
    console.error('Axe audit failed:', err)
  }
}

// Auto-run in development
export function initA11yAudit() {
  if (import.meta.env.DEV) {
    // Run after first paint and on route changes
    let timeoutId: ReturnType<typeof setTimeout>
    const run = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(runA11yAudit, 1000)
    }
    run()
    window.addEventListener('hashchange', run)
  }
}
