#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const approvedIconHash = 'e0627f75cddffabad292df58b0e17c2008f43058e882282d98562daf6c38811d'
const exactLime = '9edd36'
const findings = []
const pages = [
  'family/index.html',
  'family/support/index.html',
  'family/privacy/index.html',
  'family/join/index.html',
]
const canonicalRoutes = new Map([
  ['family/index.html', 'https://simpli-fi-os.com/family/'],
  ['family/support/index.html', 'https://simpli-fi-os.com/family/support/'],
  ['family/privacy/index.html', 'https://simpli-fi-os.com/family/privacy/'],
  ['family/join/index.html', 'https://simpli-fi-os.com/family/join/'],
])

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

const joinHtml = await readFile('family/join/index.html', 'utf8').catch(() => '')
if (!joinHtml.includes('name="robots" content="noindex, nofollow, noarchive"')) {
  findings.push('join page must be excluded from indexing and archival snippets')
}
if (!joinHtml.includes('<button id="open-family-app"') || /id="open-family-app"[^>]+href=/i.test(joinHtml)) {
  findings.push('join page must use a button without a token-bearing href')
}

const joinScript = await readFile('family/join/join.js', 'utf8').catch(() => '')
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
  if (forbidden.test(joinScript)) findings.push(`join script contains forbidden token sink ${forbidden}`)
}
const clearIndex = joinScript.indexOf('window.history.replaceState')
const renderIndex = joinScript.indexOf("document.querySelector('#join-message')")
if (clearIndex < 0 || renderIndex < clearIndex) {
  findings.push('join script must clear the query before rendering invitation state')
}

const privacy = await readFile('family/privacy/index.html', 'utf8').catch(() => '')
for (const disclosure of ['Approximate location for weather', 'Adult-only finance and email summaries', 'age 13 or older']) {
  if (!privacy.includes(disclosure)) findings.push(`privacy policy is missing disclosure: ${disclosure}`)
}

const support = await readFile('family/support/index.html', 'utf8').catch(() => '')
if (!support.includes('<strong>Settings</strong>')) findings.push('support page must match the release Settings tab')
if (support.includes('<strong>More</strong>')) findings.push('support page still names the retired More tab')

const association = JSON.parse(await readFile('.well-known/apple-app-site-association', 'utf8'))
const details = association.applinks?.details ?? []
const hasProductionInvite = details.some((detail) =>
  detail.appIDs?.includes('N8J5KA7B3N.com.simplifi.familyos')
  && detail.components?.some((component) =>
    component['/'] === '/family/join/' && component['?']?.token === '*'
  )
)
if (!hasProductionInvite) findings.push('AASA does not bind the production app to /family/join/')

if (findings.length > 0) {
  console.error('Family public brand and link contract failed:')
  for (const finding of findings) console.error(`- ${finding}`)
  process.exit(1)
}

console.log('Family public local contract passed (routes, approved icon, grayscale + #9EDD36, privacy, safe invitation handoff, AASA content); production hosting remains unverified')
