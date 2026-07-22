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
const expectedJoinScript = await readFile(
  new URL('../family/join/join.js', import.meta.url),
  'utf8',
)

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
]

const pageContracts = new Map([
  ['/family/', {
    required: [
      'Built for private, adult-led households',
      'Adults age 18 or older create households.',
      'The first public release is coming to the U.S. App Store.',
    ],
    forbidden: [
      'Built for invited households',
      'Access is limited to invited households.',
    ],
  }],
  ['/family/privacy/', {
    required: [
      'Effective July 18, 2026',
      'The first public release is intended only for users in the United States.',
      'An adult age 18 or older creates the household.',
      'Simpli-FI Family 1.0 does not request location',
      'Simpli-FI Family does not move funds',
    ],
    forbidden: [
      'The first release is intended only for invited users',
      'Adult-only finance and email summaries',
      'Approximate location for weather',
      'Connected email providers',
    ],
  }],
  ['/family/terms/', {
    required: [
      'Effective July 18, 2026',
      'The first public release is available only in the United States.',
      'A household creator must be at least 18 years old.',
      'Quest points, custom rewards, and money amounts are private household records.',
    ],
    forbidden: [
      'available only to invited users',
      'end an invite-only pilot',
      'finance summaries',
      'connected email providers',
      'weather result',
    ],
  }],
  ['/family/security/', {
    required: [
      'Last reviewed July 18, 2026',
      'private, adult-led households',
      'Public household creation requires an adult Sign in with Apple session',
      'The first release does not request location',
    ],
    forbidden: [
      'private, invitation-based households',
      'connected-email dashboard',
      'Weather requests reduce location precision',
    ],
  }],
  ['/family/support/', {
    required: [
      'In the public release, an adult age 18 or older signs in with Apple',
      'The first release does not permit linking a child under 13.',
      'Money rewards are private household ledger promises only.',
    ],
    forbidden: [
      'Access is limited to invited households.',
      'Ask support to invite your household',
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
        if (!body.includes(text)) findings.push(`${url} is missing the Build 5 disclosure: ${text}`)
      }
      for (const text of pageContract.forbidden) {
        if (body.includes(text)) findings.push(`${url} still contains superseded disclosure: ${text}`)
      }
    }
    if (!body.includes(`<link rel="canonical" href="${new URL(canonicalPath, baseURL.origin)}">`)) {
      findings.push(`${url} does not declare the direct trailing-slash canonical URL`)
    }
    for (const finding of validateFamilyResponseHeaders(response.headers, {
      join: canonicalPath === '/family/join/',
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

try {
  const { response, url } = await directFetch('/family/join/join.js')
  if (response.status !== 200) findings.push(`${url} returned ${response.status}, expected 200`)
  for (const finding of validateFamilyResponseHeaders(response.headers, {
    join: true,
    script: true,
  })) {
    findings.push(`${url}: ${finding}`)
  }
  const source = await response.text()
  if (source !== expectedJoinScript) {
    findings.push(`${url} bytes do not exactly match the reviewed release source`)
  }
  for (const finding of validateJoinScriptSource(source)) {
    findings.push(`${url}: ${finding}`)
  }
} catch (error) {
  findings.push(`production join.js could not be verified: ${error instanceof Error ? error.message : 'unknown error'}`)
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
