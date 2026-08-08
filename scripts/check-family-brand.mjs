#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { expectedFamilyAASA } from './family-production-security-contract.mjs'
import { familySecurityTxt } from './family-security-txt.mjs'

const approvedIconHash = 'e0627f75cddffabad292df58b0e17c2008f43058e882282d98562daf6c38811d'
const exactLime = '9edd36'
const findings = []
const pages = [
  'family/index.html',
  'family/support/index.html',
  'family/privacy/index.html',
  'family/security/index.html',
  'family/terms/index.html',
  'family/join/index.html',
  'family/app-review/index.html',
]
const canonicalRoutes = new Map([
  ['family/index.html', 'https://simpli-fi-os.com/family/'],
  ['family/support/index.html', 'https://simpli-fi-os.com/family/support/'],
  ['family/privacy/index.html', 'https://simpli-fi-os.com/family/privacy/'],
  ['family/security/index.html', 'https://simpli-fi-os.com/family/security/'],
  ['family/terms/index.html', 'https://simpli-fi-os.com/family/terms/'],
  ['family/join/index.html', 'https://simpli-fi-os.com/family/join/'],
  ['family/app-review/index.html', 'https://simpli-fi-os.com/family/app-review/'],
])
// Both fragment-bearer pages carry a short-lived capability in the URL fragment
// and are held to the same no-index, no-sink, clear-before-render contract.
const bearerPages = [
  {
    label: 'join',
    html: 'family/join/index.html',
    script: 'family/join/join.js',
    renderSelector: "document.querySelector('#join-message')",
  },
  {
    label: 'app-review',
    html: 'family/app-review/index.html',
    script: 'family/app-review/app-review.js',
    renderSelector: "document.querySelector('#review-message')",
  },
]

const icon = await readFile('family/assets/app-icon.png').catch(() => null)
if (!icon) {
  findings.push('family/assets/app-icon.png is missing')
} else {
  const hash = createHash('sha256').update(icon).digest('hex')
  if (hash !== approvedIconHash) findings.push('public Family icon is not the approved dimensional F')
  if (icon.length < 24 || icon.toString('hex', 0, 8) !== '89504e470d0a1a0a') {
    findings.push('public Family icon is not a PNG')
  } else if (icon.readUInt32BE(16) !== 1024 || icon.readUInt32BE(20) !== 1024) {
    findings.push('public Family icon must be exactly 1024 by 1024 pixels')
  }
}

const css = await readFile('family/assets/family.css', 'utf8').catch(() => '')
if (!css) findings.push('family/assets/family.css is missing')
for (const match of css.matchAll(/#([0-9a-f]{6})(?![0-9a-f])/gi)) {
  const value = match[1].toLowerCase()
  const [red, green, blue] = [value.slice(0, 2), value.slice(2, 4), value.slice(4, 6)]
  if (value !== exactLime && !(red === green && green === blue)) {
    findings.push(`family.css contains disallowed chromatic color #${value}`)
  }
}
for (const match of css.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g)) {
  if (!(match[1] === match[2] && match[2] === match[3])) {
    findings.push(`family.css contains disallowed chromatic rgb value ${match[0]}`)
  }
}

const limeUses = css.match(/var\(--lime\)/g)?.length ?? 0
const primaryButtonBlock = css.match(/\.button--primary\s*\{[^}]*\}/s)?.[0] ?? ''
if (limeUses !== 1 || !primaryButtonBlock.includes('var(--lime)')) {
  findings.push('action lime must appear only on the public primary-action button style')
}

for (const page of pages) {
  const html = await readFile(page, 'utf8').catch(() => '')
  if (!html) {
    findings.push(`${page} is missing`)
    continue
  }
  if (!html.includes('/family/assets/app-icon.png')) {
    findings.push(`${page} does not reference the approved Family icon`)
  }
  if (!html.includes(`<link rel="canonical" href="${canonicalRoutes.get(page)}">`)) {
    findings.push(`${page} does not declare its direct trailing-slash production URL`)
  }
  for (const required of [
    '<meta charset="utf-8">',
    'name="viewport"',
    'name="description"',
    'name="referrer" content="no-referrer"',
    'Content-Security-Policy',
    'class="skip-link"',
    '<main',
    '<title>',
  ]) {
    if (!html.includes(required)) findings.push(`${page} is missing ${required}`)
  }
  if (/\b(?:TODO|TBD|not ready for publication|pending owner|will be added here|release draft)\b/i.test(html)) {
    findings.push(`${page} contains release-placeholder copy`)
  }
  if (/<script[^>]+src=["']https?:\/\//i.test(html)
      || /<img[^>]+src=["']https?:\/\//i.test(html)
      || /<link[^>]+rel=["']stylesheet["'][^>]+href=["']https?:\/\//i.test(html)) {
    findings.push(`${page} loads a third-party resource`)
  }

  for (const match of html.matchAll(/(?:href|src)="(\/[^"]+)"/g)) {
    const target = match[1].split(/[?#]/, 1)[0]
    const localPath = target.endsWith('/')
      ? `${target.slice(1)}index.html`
      : target.includes('.')
        ? target.slice(1)
        : `${target.slice(1)}/index.html`
    await access(resolve(localPath)).catch(() => {
      findings.push(`${page} references missing local path ${target}`)
    })
  }
}

for (const bearer of bearerPages) {
  const html = await readFile(bearer.html, 'utf8').catch(() => '')
  if (!html.includes('name="robots" content="noindex, nofollow, noarchive"')) {
    findings.push(`${bearer.label} page must be excluded from indexing and archival snippets`)
  }
  if (!html.includes('<button id="open-family-app"') || /id="open-family-app"[^>]+href=/i.test(html)) {
    findings.push(`${bearer.label} page must use a button without a token-bearing href`)
  }

  const script = await readFile(bearer.script, 'utf8').catch(() => '')
  for (const forbidden of [
    /localStorage/,
    /sessionStorage/,
    /document\.cookie/,
    /sendBeacon/,
    /fetch\(/,
    /XMLHttpRequest/,
    /console\./,
    /\.innerHTML/,
    /\.outerHTML/,
  ]) {
    if (forbidden.test(script)) findings.push(`${bearer.label} script contains forbidden token sink ${forbidden}`)
  }
  const clearIndex = script.indexOf('window.history.replaceState')
  const renderIndex = script.indexOf(bearer.renderSelector)
  if (clearIndex < 0 || renderIndex < clearIndex) {
    findings.push(`${bearer.label} script must clear the fragment before rendering bearer state`)
  }
  if (!script.includes('window.location.hash') || script.includes('window.location.search')) {
    findings.push(`${bearer.label} script must read its capability only from the URL fragment`)
  }
}

const privacy = await readFile('family/privacy/index.html', 'utf8').catch(() => '')
for (const disclosure of [
  'An adult age 18 or older creates one household',
  'exactly one second adult age 18 or older',
  'Possessing or opening a link does not grant household membership',
  'money reward is a private household allowance promise',
  'minimal pseudonymous binding between the active account and its Sign in with Apple identity',
  'we do not request or upload an ActivityKit push token',
]) {
  if (!privacy.includes(disclosure)) findings.push(`privacy policy is missing disclosure: ${disclosure}`)
}
for (const deferred of [
  'Approximate location for weather',
  'Adult-only finance and email summaries',
  'Apple Weather',
  'connected-email summaries are enabled',
  'Live Activity tokens',
]) {
  if (privacy.includes(deferred)) findings.push(`privacy policy still describes deferred Store feature: ${deferred}`)
}
if (!privacy.includes('Simpli-FI OS LLC, a Texas limited liability company')) {
  findings.push('privacy policy must identify the exact operating entity')
}
for (const incompatible of ['age 13', 'dependent-device', 'linked dependent', 'managed-dependent', 'A teen']) {
  if (privacy.includes(incompatible)) findings.push(`privacy policy contradicts the adults-only 1.0 contract: ${incompatible}`)
}

const terms = await readFile('family/terms/index.html', 'utf8').catch(() => '')
for (const disclosure of ['Simpli-FI OS LLC', 'Denton County, Texas', 'at least 18 years old', 'only one active Simpli-FI Family household membership', 'Possessing or opening an invitation does not grant membership', 'household records', 'Apple’s Standard Licensed Application End User License Agreement']) {
  if (!terms.includes(disclosure)) findings.push(`terms are missing required language: ${disclosure}`)
}
for (const deferred of ['finance summaries', 'connected email providers', 'EMAIL SUMMARY', 'WEATHER RESULT']) {
  if (terms.includes(deferred)) findings.push(`terms still describe deferred Store feature: ${deferred}`)
}
for (const incompatible of ['at least 13', 'age 13', 'under 13', 'Dependents join', 'invites a dependent']) {
  if (terms.includes(incompatible)) findings.push(`terms contradict the adults-only 1.0 contract: ${incompatible}`)
}

const security = await readFile('family/security/index.html', 'utf8').catch(() => '')
for (const disclosure of ['does not claim that household content is end-to-end encrypted', 'Report a suspected vulnerability', 'Simpli-FI OS LLC']) {
  if (!security.includes(disclosure)) findings.push(`security page is missing required language: ${disclosure}`)
}

// Served by api/security-txt.mjs, not a static file: a static file under
// /.well-known/ would shadow the rewrite and lose the response headers.
const securityTxt = familySecurityTxt
for (const field of ['Contact:', 'Expires:', 'Canonical:', 'Policy:']) {
  if (!securityTxt.includes(field)) findings.push(`security.txt is missing ${field}`)
}

const support = await readFile('family/support/index.html', 'utf8').catch(() => '')
if (!support.includes('<strong>More</strong>')) findings.push('support page must match the release More tab')
if (support.includes('uses invitation-based access')) {
  findings.push('support page still says public household creation is invitation-only')
}
for (const disclosure of ['How does a second adult join?', 'both adults compare the same six-character code', 'Opening a link does not grant membership']) {
  if (!support.includes(disclosure)) findings.push(`support page is missing adult-linking guidance: ${disclosure}`)
}
if (!support.includes('account identifiers removed or replaced by a deletion pseudonym')) {
  findings.push('support page is missing precise second-adult deletion behavior')
}
for (const incompatible of ['dependent invitation', 'a dependent join', 'child under 13', 'managed-dependent']) {
  if (support.includes(incompatible)) findings.push(`support page contradicts the adults-only 1.0 contract: ${incompatible}`)
}

for (const controlFile of ['CLAUDE.md', 'PRODUCT.md']) {
  const control = await readFile(controlFile, 'utf8').catch(() => '')
  if (!/adults.only/i.test(control)) {
    findings.push(`${controlFile} is missing the adults-only 1.0 boundary`)
  }
  if (/\bdependents?\b|\bteenagers?\b|age 13/i.test(control)) {
    findings.push(`${controlFile} contradicts the adults-only 1.0 boundary`)
  }
}

const association = expectedFamilyAASA
const details = association.applinks?.details ?? []
const detail = details.length === 1 ? details[0] : null
const bindsProductionApp = detail?.appIDs?.length === 1
  && detail.appIDs[0] === 'N8J5KA7B3N.com.simplifi.familyos'
if (!bindsProductionApp) {
  findings.push('AASA must bind exactly one detail entry to the production app')
}
// The native release verifier deep-equality checks this same two-component
// contract in path order, so both routes and their order are load-bearing.
const expectedComponentPaths = ['/family/join/', '/family/app-review/']
const components = detail?.components ?? []
if (components.length !== expectedComponentPaths.length) {
  findings.push(`AASA must declare exactly ${expectedComponentPaths.length} fragment components`)
} else {
  expectedComponentPaths.forEach((path, index) => {
    const component = components[index]
    const valid = component?.['/'] === path
      && component['#'] === 'token=*'
      && Object.keys(component).every(key => ['/', '#', 'comment'].includes(key))
      && typeof component.comment === 'string'
      && component.comment.length > 0
    if (!valid) findings.push(`AASA component ${index + 1} does not bind ${path} to the exact token fragment`)
  })
}

if (findings.length > 0) {
  console.error('Family public brand and link contract failed:')
  for (const finding of findings) console.error(`- ${finding}`)
  process.exit(1)
}

console.log('Family public local contract passed (routes, approved icon, grayscale + #9EDD36, adults-only legal copy, safe second-adult invitation handoff, AASA content); production hosting remains unverified')
