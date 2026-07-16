#!/usr/bin/env node

const baseURL = new URL(process.argv[2] ?? 'https://simpli-fi-os.com')
const findings = []
const warnings = []

if (baseURL.protocol !== 'https:') {
  findings.push('production verification requires an HTTPS origin')
}

async function directFetch(path) {
  const url = new URL(path, baseURL)
  const response = await fetch(url, {
    redirect: 'manual',
    headers: { 'user-agent': 'Simpli-FI-Family-release-verifier/1.0' },
  })
  return { response, url }
}

const syntheticToken = 'A'.repeat(43)
const routes = [
  { canonical: '/family/', alias: '/family' },
  { canonical: '/family/support/', alias: '/family/support' },
  { canonical: '/family/privacy/', alias: '/family/privacy' },
  {
    canonical: `/family/join/?token=${syntheticToken}`,
    alias: `/family/join?token=${syntheticToken}`,
  },
]

for (const { canonical } of routes) {
  try {
    const { response, url } = await directFetch(canonical)
    if (response.status !== 200) findings.push(`${url} returned ${response.status}, expected a direct 200 at the canonical trailing-slash URL`)
    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.toLowerCase().startsWith('text/html')) {
      findings.push(`${url} returned ${contentType || 'no Content-Type'}, expected text/html`)
    }
    const body = await response.text()
    if (!body.includes('Simpli-FI Family')) findings.push(`${url} did not return the Family page`)
    if (/\b(?:TODO|TBD|not ready for publication|pending owner|will be added here|release draft)\b/i.test(body)) {
      findings.push(`${url} contains release-placeholder copy`)
    }
    const canonicalPath = new URL(canonical, baseURL).pathname
    if (!body.includes(`<link rel="canonical" href="${new URL(canonicalPath, baseURL.origin)}">`)) {
      findings.push(`${url} does not declare the direct trailing-slash canonical URL`)
    }
    if (!(response.headers.get('x-content-type-options') ?? '').toLowerCase().includes('nosniff')) {
      warnings.push(`${url} does not advertise X-Content-Type-Options: nosniff`)
    }
    if (!(response.headers.get('content-security-policy') ?? '').includes("frame-ancestors 'none'")) {
      warnings.push(`${url} does not advertise a response-header CSP with frame-ancestors 'none'; meta CSP remains the document fallback`)
    }
    if (canonicalPath === '/family/join/') {
      const cacheControl = response.headers.get('cache-control') ?? ''
      if (!/\b(?:no-store|private)\b/i.test(cacheControl)) {
        warnings.push(`${url} does not advertise private/no-store caching; confirm the production edge policy for invite fallbacks`)
      }
      if (!/^no-referrer(?:\s|,|$)/i.test(response.headers.get('referrer-policy') ?? '')) {
        warnings.push(`${url} does not advertise Referrer-Policy: no-referrer as a response header; the page-level policy must remain before all subresources`)
      }
    }
  } catch (error) {
    findings.push(`${new URL(canonical, baseURL)} could not be fetched: ${error instanceof Error ? error.message : 'unknown error'}`)
  }
}

for (const { canonical, alias } of routes) {
  try {
    const { response, url } = await directFetch(alias)
    if (![301, 302, 307, 308].includes(response.status)) {
      findings.push(`${url} returned ${response.status}, expected a redirect to the canonical trailing-slash URL`)
      continue
    }
    const location = response.headers.get('location')
    if (!location) {
      findings.push(`${url} redirected without a Location header`)
      continue
    }
    const resolvedLocation = new URL(location, url)
    const expectedLocation = new URL(canonical, baseURL)
    if (resolvedLocation.href !== expectedLocation.href) {
      findings.push(`${url} redirected to ${resolvedLocation.href}, expected ${expectedLocation.href}`)
    }
  } catch (error) {
    findings.push(`${new URL(alias, baseURL)} alias could not be fetched: ${error instanceof Error ? error.message : 'unknown error'}`)
  }
}

try {
  const { response, url } = await directFetch('/.well-known/apple-app-site-association')
  if (response.status !== 200) findings.push(`${url} returned ${response.status}, expected 200 without a redirect`)
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().startsWith('application/json')) {
    findings.push(`${url} returned ${contentType || 'no Content-Type'}, expected application/json`)
  }
  if (!(response.headers.get('x-content-type-options') ?? '').toLowerCase().includes('nosniff')) {
    warnings.push(`${url} does not advertise X-Content-Type-Options: nosniff`)
  }
  const body = await response.text()
  if (Buffer.byteLength(body) > 128 * 1024) findings.push('AASA exceeds Apple’s 128 KB uncompressed limit')
  const association = JSON.parse(body)
  const details = association.applinks?.details ?? []
  const hasProductionInvite = details.some(detail =>
    detail.appIDs?.length === 1
    && detail.appIDs[0] === 'N8J5KA7B3N.com.simplifi.familyos'
    && detail.components?.some(component =>
      component['/'] === '/family/join/'
      && JSON.stringify(component['?']) === JSON.stringify({ token: '*' })
    )
  )
  if (!hasProductionInvite) findings.push('production AASA does not bind the release app to /family/join/?token=*')
} catch (error) {
  findings.push(`production AASA could not be verified: ${error instanceof Error ? error.message : 'unknown error'}`)
}

for (const warning of warnings) console.warn(`WARNING: ${warning}`)
if (findings.length > 0) {
  console.error('Family production route verification failed:')
  for (const finding of findings) console.error(`- ${finding}`)
  process.exit(1)
}

console.log(`Family production routes verified at ${baseURL.origin}`)
