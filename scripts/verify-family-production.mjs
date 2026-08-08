#!/usr/bin/env node

import { readFile } from 'node:fs/promises'
import {
  validateAssociationResponseHeaders,
  validateExactFamilyAASA,
  validateFamilyResponseHeaders,
  validateJoinScriptSource,
} from './family-production-security-contract.mjs'

const baseURL = new URL(process.argv[2] ?? 'https://simpli-fi-os.com')
const findings = []

// Fragment-bearer pages: tighter CSP, no-store caching, and byte-exact scripts.
const bearerScripts = [
  { path: '/family/join/join.js', source: '../family/join/join.js' },
  { path: '/family/app-review/app-review.js', source: '../family/app-review/app-review.js' },
]
for (const bearer of bearerScripts) {
  bearer.expected = await readFile(new URL(bearer.source, import.meta.url), 'utf8')
}
const bearerRoutes = new Set(['/family/join/', '/family/app-review/'])

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

const routes = [
  { canonical: '/family/', alias: '/family' },
  { canonical: '/family/support/', alias: '/family/support' },
  { canonical: '/family/privacy/', alias: '/family/privacy' },
  { canonical: '/family/security/', alias: '/family/security' },
  { canonical: '/family/terms/', alias: '/family/terms' },
  { canonical: '/family/join/', alias: '/family/join' },
  { canonical: '/family/app-review/', alias: '/family/app-review' },
]

const pageContracts = new Map([
  ['/family/', {
    required: [
      'Built for private, adults-only households',
      'An adult age 18 or older creates the household and may add exactly one second adult through mutual confirmation.',
      'The first public release is coming to the U.S. App Store.',
    ],
    forbidden: [
      'Built for invited households',
      'Access is limited to invited households.',
    ],
  }],
  ['/family/privacy/', {
    required: [
      'Effective July 26, 2026',
      'The first public release is intended only for adults in the United States.',
      'Possessing or opening a link does not grant household membership.',
      'Simpli-FI Family 1.0 does not request location',
      'Simpli-FI Family does not move funds',
    ],
    forbidden: [
      'The first release is intended only for invited users',
      'Adult-only finance and email summaries',
      'Approximate location for weather',
      'Connected email providers',
      'Dependents age 13',
      'dependent-device',
    ],
  }],
  ['/family/terms/', {
    required: [
      'Effective July 26, 2026',
      'The first public release is available only to adults in the United States.',
      'You must be at least 18 years old',
      'Each adult may hold only one active Simpli-FI Family household membership at a time.',
      'Possessing or opening an invitation does not grant membership.',
      'Quest points, custom rewards, and money amounts are private household records.',
    ],
    forbidden: [
      'available only to invited users',
      'end an invite-only pilot',
      'finance summaries',
      'connected email providers',
      'weather result',
      'at least 13 years old',
      'child under 13',
    ],
  }],
  ['/family/security/', {
    required: [
      'Last reviewed July 26, 2026',
      'private, adults-only households',
      'Public household creation requires an adult Sign in with Apple session',
      'Possessing a link never grants membership.',
      'The first release does not request location',
    ],
    forbidden: [
      'private, invitation-based households',
      'connected-email dashboard',
      'Weather requests reduce location precision',
      'Dependents are linked',
    ],
  }],
  ['/family/support/', {
    required: [
      'In the public release, an adult age 18 or older signs in with Apple',
      'How does a second adult join?',
      'both adults compare the same six-character code',
      'Opening a link does not grant membership.',
      'account identifiers removed or replaced by a deletion pseudonym',
      'Money rewards are private household ledger promises only.',
    ],
    forbidden: [
      'Access is limited to invited households.',
      'Ask support to invite your household',
      'How does a dependent join?',
      'child under 13',
    ],
  }],
])

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
    const pageContract = pageContracts.get(canonicalPath)
    if (pageContract) {
      for (const text of pageContract.required) {
        if (!body.includes(text)) findings.push(`${url} is missing the adults-only release disclosure: ${text}`)
      }
      for (const text of pageContract.forbidden) {
        if (body.includes(text)) findings.push(`${url} still contains superseded disclosure: ${text}`)
      }
    }
    if (!body.includes(`<link rel="canonical" href="${new URL(canonicalPath, baseURL.origin)}">`)) {
      findings.push(`${url} does not declare the direct trailing-slash canonical URL`)
    }
    for (const finding of validateFamilyResponseHeaders(response.headers, {
      join: bearerRoutes.has(canonicalPath),
    })) {
      findings.push(`${url}: ${finding}`)
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
  for (const finding of validateAssociationResponseHeaders(response.headers)) {
    findings.push(`${url}: ${finding}`)
  }
  const body = await response.text()
  if (Buffer.byteLength(body) > 128 * 1024) findings.push('AASA exceeds Apple’s 128 KB uncompressed limit')
  const association = JSON.parse(body)
  findings.push(...validateExactFamilyAASA(association))
} catch (error) {
  findings.push(`production AASA could not be verified: ${error instanceof Error ? error.message : 'unknown error'}`)
}

for (const bearer of bearerScripts) {
  try {
    const { response, url } = await directFetch(bearer.path)
    if (response.status !== 200) findings.push(`${url} returned ${response.status}, expected 200`)
    for (const finding of validateFamilyResponseHeaders(response.headers, {
      join: true,
      script: true,
    })) {
      findings.push(`${url}: ${finding}`)
    }
    const source = await response.text()
    if (source !== bearer.expected) {
      findings.push(`${url} bytes do not exactly match the reviewed release source`)
    }
    for (const finding of validateJoinScriptSource(source)) {
      findings.push(`${url}: ${finding}`)
    }
  } catch (error) {
    findings.push(`production ${bearer.path} could not be verified: ${error instanceof Error ? error.message : 'unknown error'}`)
  }
}

try {
  const { response, url } = await directFetch('/.well-known/security.txt')
  if (response.status !== 200) findings.push(`${url} returned ${response.status}, expected 200`)
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().startsWith('text/plain')) {
    findings.push(`${url} returned ${contentType || 'no Content-Type'}, expected text/plain`)
  }
  const body = await response.text()
  for (const field of ['Contact:', 'Expires:', 'Canonical:', 'Policy:']) {
    if (!body.includes(field)) findings.push(`${url} is missing ${field}`)
  }
} catch (error) {
  findings.push(`production security.txt could not be verified: ${error instanceof Error ? error.message : 'unknown error'}`)
}

if (findings.length > 0) {
  console.error('Family production route verification failed:')
  for (const finding of findings) console.error(`- ${finding}`)
  process.exit(1)
}

console.log(`Family production routes verified at ${baseURL.origin}`)
