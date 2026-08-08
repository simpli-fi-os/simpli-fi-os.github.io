import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  invitationTokenFromFragment,
} from '../family/join/join.js'
import {
  reviewAccessTokenFromFragment,
} from '../family/app-review/app-review.js'
import { expectedFamilyAASA } from '../scripts/family-production-security-contract.mjs'
import { familySecurityTxt } from '../scripts/family-security-txt.mjs'

const validToken = 'A'.repeat(43)

test('accepts only one exact URL-safe invitation token', () => {
  assert.equal(invitationTokenFromFragment(`#token=${validToken}`), validToken)
  assert.equal(invitationTokenFromFragment(`#token=${'b'.repeat(32)}`), 'b'.repeat(32))
  assert.equal(invitationTokenFromFragment(`#token=${'c'.repeat(200)}`), 'c'.repeat(200))

  for (const fragment of [
    '',
    `token=${validToken}`,
    `?token=${validToken}`,
    '#token=',
    '#token=short',
    `#token=${'d'.repeat(201)}`,
    `#token=${validToken}&source=email`,
    `#token=${validToken}&token=${validToken}`,
    `#Token=${validToken}`,
    `#token%3D${validToken}`,
    `#token=${validToken}%00`,
    `#token=${validToken}%2F`,
    `#token=${validToken}.`,
    ` #token=${validToken}`,
    `#token=${validToken} `,
  ]) {
    assert.equal(invitationTokenFromFragment(fragment), null, fragment)
  }
})

test('accepts only one exact URL-safe App Review access token', () => {
  const reviewToken = 'R'.repeat(43)
  assert.equal(reviewAccessTokenFromFragment(`#token=${reviewToken}`), reviewToken)
  assert.equal(reviewAccessTokenFromFragment(`#token=${'s'.repeat(128)}`), 's'.repeat(128))

  for (const fragment of [
    '',
    `token=${reviewToken}`,
    `?token=${reviewToken}`,
    '#token=',
    // The App Review contract is narrower than the invitation contract: the
    // server and the iOS parser both require 43 to 128 characters.
    `#token=${'t'.repeat(42)}`,
    `#token=${'u'.repeat(129)}`,
    `#token=${reviewToken}&source=email`,
    `#Token=${reviewToken}`,
    `#token=${reviewToken}.`,
    `#token=${reviewToken} `,
  ]) {
    assert.equal(reviewAccessTokenFromFragment(fragment), null, fragment)
  }
})

test('AASA binds only the production app to the exact join and App Review paths', async () => {
  const association = expectedFamilyAASA
  const details = association.applinks?.details
  assert.equal(Array.isArray(details), true)
  assert.equal(details.length, 1)
  assert.deepEqual(details[0].appIDs, ['N8J5KA7B3N.com.simplifi.familyos'])
  assert.equal(details[0].components.length, 2)
  assert.deepEqual(details[0].components[0], {
    '/': '/family/join/',
    '#': 'token=*',
    comment: 'Opens a short-lived Simpli-FI Family adult-household invitation. The app validates the token before use.',
  })
  assert.deepEqual(details[0].components[1], {
    '/': '/family/app-review/',
    '#': 'token=*',
    comment: 'Opens purpose-bound, expiring synthetic App Review access. The fragment token is never sent to the web origin.',
  })
})

test('published security.txt matches the static fallback byte for byte', async () => {
  const staticFile = await readFile('.well-known/security.txt', 'utf8')
  assert.equal(staticFile, familySecurityTxt)
  for (const field of ['Contact:', 'Expires:', 'Canonical:', 'Policy:']) {
    assert.ok(familySecurityTxt.includes(field), field)
  }
})

test('every static HTML route declares its direct trailing-slash production URL', async () => {
  const routes = new Map([
    ['family/index.html', 'https://simpli-fi-os.com/family/'],
    ['family/support/index.html', 'https://simpli-fi-os.com/family/support/'],
    ['family/privacy/index.html', 'https://simpli-fi-os.com/family/privacy/'],
    ['family/security/index.html', 'https://simpli-fi-os.com/family/security/'],
    ['family/terms/index.html', 'https://simpli-fi-os.com/family/terms/'],
    ['family/join/index.html', 'https://simpli-fi-os.com/family/join/'],
    ['family/app-review/index.html', 'https://simpli-fi-os.com/family/app-review/'],
  ])

  for (const [file, canonicalURL] of routes) {
    const html = await readFile(file, 'utf8')
    assert.match(html, new RegExp(`<link rel="canonical" href="${canonicalURL.replaceAll('.', '\\.')}">`))
  }
})

test('public navigation keeps the reviewed cache and touch-target contract', async () => {
  const files = [
    'family/index.html',
    'family/support/index.html',
    'family/privacy/index.html',
    'family/security/index.html',
    'family/terms/index.html',
    'family/join/index.html',
    'family/app-review/index.html',
  ]
  const stylesheet = await readFile('family/assets/family.css', 'utf8')

  for (const file of files) {
    const html = await readFile(file, 'utf8')
    assert.match(
      html,
      /<link rel="stylesheet" href="\/family\/assets\/family\.css\?v=20260726b">/,
      file,
    )
  }

  assert.match(stylesheet, /\.brand\s*\{[^}]*min-height:\s*44px;/s)
  assert.match(stylesheet, /\.site-nav a\s*\{[^}]*min-width:\s*44px;[^}]*min-height:\s*44px;/s)
  assert.match(stylesheet, /\.side-nav a\s*\{[^}]*min-height:\s*44px;/s)
  assert.match(stylesheet, /\.text-link\s*\{[^}]*min-height:\s*44px;/s)
  assert.match(stylesheet, /\.footer-links a\s*\{[^}]*min-width:\s*44px;[^}]*min-height:\s*44px;/s)
})

test('join page clears the URL before rendering invitation state and never stores the token', async () => {
  const source = await readFile('family/join/join.js', 'utf8')
  const html = await readFile('family/join/index.html', 'utf8')
  const clearIndex = source.indexOf('window.history.replaceState')
  const messageIndex = source.indexOf("document.querySelector('#join-message')")
  const referrerIndex = html.indexOf('<meta name="referrer" content="no-referrer">')
  const firstResourceIndex = Math.min(
    html.indexOf('<link rel="icon"'),
    html.indexOf('<link rel="stylesheet"'),
    html.indexOf('<script '),
  )

  assert.ok(clearIndex >= 0)
  assert.ok(messageIndex > clearIndex)
  assert.ok(referrerIndex >= 0)
  assert.ok(firstResourceIndex > referrerIndex, 'referrer policy must precede every subresource request')
  assert.match(source, /window\.location\.hash/)
  assert.doesNotMatch(source, /window\.location\.search|invitationTokenFromSearch/)
  assert.doesNotMatch(
    source,
    /simplififamily|window\.location\.assign|window\.location\.replace|window\.open/,
  )
  assert.doesNotMatch(source, /localStorage|sessionStorage|document\.cookie|sendBeacon|fetch\(|XMLHttpRequest|console\./)
  assert.doesNotMatch(source, /\.innerHTML|\.outerHTML|\.dataset/)
})

test('synthetic browser clears the fragment and gives manual HTTPS-link guidance without navigating', async (t) => {
  const events = []
  const panel = {
    setAttribute(name, value) {
      events.push(`panel:${name}:${value}`)
    },
  }
  const message = { textContent: '' }
  const openButton = {
    hidden: true,
    textContent: 'Open the app',
    addEventListener(name, callback) {
      events.push(`listener:${name}`)
      this.callback = callback
    },
  }
  const location = {
    hash: `#token=${validToken}`,
    pathname: '/family/join/',
    assign(destination) {
      throw new Error(`unexpected navigation to ${destination}`)
    },
  }

  globalThis.window = {
    location,
    history: {
      replaceState(_state, _title, path) {
        events.push(`history:${path}`)
        location.hash = ''
      },
    },
  }
  globalThis.document = {
    visibilityState: 'visible',
    querySelector(selector) {
      events.push(`query:${selector}`)
      return new Map([
        ['.join-panel', panel],
        ['#join-message', message],
        ['#open-family-app', openButton],
      ]).get(selector)
    },
  }
  t.after(() => {
    delete globalThis.window
    delete globalThis.document
  })

  await import(`../family/join/join.js?browser-harness=${Date.now()}`)

  assert.equal(events[0], 'history:/family/join/')
  assert.equal(location.hash, '')
  assert.equal(openButton.hidden, false)
  assert.equal(openButton.textContent, 'How to open securely')
  assert.doesNotMatch(message.textContent, new RegExp(validToken))
  assert.equal(
    events.findIndex(event => event.startsWith('query:')) > 0,
    true,
  )

  openButton.callback()
  assert.equal(openButton.hidden, true)
  assert.match(message.textContent, /original HTTPS invitation/)
  assert.doesNotMatch(message.textContent, new RegExp(validToken))
  assert.equal(events.some(event => event.startsWith('assign:')), false)
})

test('Vercel serves Family routes with canonical redirects and release security headers', async () => {
  const config = JSON.parse(await readFile('vercel.json', 'utf8'))
  assert.equal(config.trailingSlash, true)
  assert.deepEqual(config.rewrites, [
    {
      source: '/.well-known/apple-app-site-association',
      destination: '/api/aasa',
    },
    {
      source: '/.well-known/security.txt',
      destination: '/api/security-txt',
    },
  ])

  const headersBySource = new Map(
    config.headers.map(rule => [
      rule.source,
      new Map(rule.headers.map(header => [header.key.toLowerCase(), header.value])),
    ]),
  )

  const globalHeaders = headersBySource.get('/(.*)')
  assert.equal(globalHeaders?.get('x-content-type-options'), 'nosniff')

  const exactAssociationHeaders = headersBySource.get(
    '/.well-known/apple-app-site-association',
  )
  assert.match(
    exactAssociationHeaders?.get('content-type') ?? '',
    /^application\/json/,
  )
  assert.equal(
    exactAssociationHeaders?.get('x-content-type-options'),
    'nosniff',
  )

  const familyHeaders = headersBySource.get('/family/(.*)')
  assert.equal(familyHeaders?.get('referrer-policy'), 'no-referrer')
  assert.equal(familyHeaders?.get('x-content-type-options'), 'nosniff')
  assert.match(familyHeaders?.get('content-security-policy') ?? '', /frame-ancestors 'none'/)

  const joinHeaders = headersBySource.get('/family/join/(.*)')
  assert.match(joinHeaders?.get('cache-control') ?? '', /no-store/)
  assert.match(joinHeaders?.get('content-security-policy') ?? '', /base-uri 'none'/)

  const reviewHeaders = headersBySource.get('/family/app-review/(.*)')
  assert.match(reviewHeaders?.get('cache-control') ?? '', /no-store/)
  assert.match(reviewHeaders?.get('content-security-policy') ?? '', /base-uri 'none'/)

  const associationHeaders = headersBySource.get('/.well-known/(.*)')
  assert.match(associationHeaders?.get('content-type') ?? '', /^application\/json/)
  assert.equal(associationHeaders?.get('x-content-type-options'), 'nosniff')

  const securityTxtHeaders = headersBySource.get('/.well-known/security.txt')
  assert.match(securityTxtHeaders?.get('content-type') ?? '', /^text\/plain/)
})

test('Vercel is the only intended production host and CI is verification-only', async () => {
  const workflow = await readFile('.github/workflows/deploy.yml', 'utf8')
  const packageManifest = JSON.parse(await readFile('package.json', 'utf8'))

  await assert.rejects(readFile('CNAME', 'utf8'))
  assert.match(workflow, /^name: Verify public site$/m)
  assert.match(workflow, /runs-on: ubuntu-24\.04/)
  assert.match(workflow, /node-version: 22\.16\.0/)
  assert.doesNotMatch(
    workflow,
    /deploy-pages|upload-pages-artifact|configure-pages|pages:\s*write|github-pages/,
  )
  assert.equal(packageManifest.engines.node, '22.16.0')
})

test('legal surfaces name the exact operator and expose complete user controls', async () => {
  const privacy = await readFile('family/privacy/index.html', 'utf8')
  const terms = await readFile('family/terms/index.html', 'utf8')
  const security = await readFile('family/security/index.html', 'utf8')

  assert.match(privacy, /Simpli-FI OS LLC, a Texas limited liability company/)
  assert.match(privacy, /Your choices, rights, and appeals/)
  assert.match(privacy, /Version 1\.0 does not offer accounts, profiles, or invitations for anyone under 18/)
  assert.match(terms, /Denton County, Texas/)
  assert.match(terms, /at least 18 years old/)
  assert.match(terms, /only one active Simpli-FI Family household membership/)
  assert.match(terms, /Possessing or opening an invitation does not grant membership/)
  assert.match(terms, /Apple’s Standard Licensed Application End User License Agreement/)
  assert.doesNotMatch(privacy, /\bdependents?\b|\bteen\b|age 13/i)
  assert.doesNotMatch(terms, /\bdependents?\b|\bteen\b|age 13|under 13/i)
  assert.match(security, /does not claim that household content is end-to-end encrypted/)
  assert.match(security, /Report a suspected vulnerability/)
})

test('repository control docs lock the public release to adults only', async () => {
  for (const file of ['CLAUDE.md', 'PRODUCT.md']) {
    const source = await readFile(file, 'utf8')
    assert.match(source, /adults.only/i, file)
    assert.doesNotMatch(
      source,
      /\bdependents?\b|\bteenagers?\b|age 13/i,
      file,
    )
  }
})

test('App Review page clears the fragment and never renders or navigates with the token', async (t) => {
  const reviewToken = 'R'.repeat(43)
  const events = []
  const panel = {
    setAttribute(name, value) {
      events.push(`panel:${name}:${value}`)
    },
  }
  const message = { textContent: '' }
  const helpButton = {
    hidden: true,
    textContent: 'Open the app',
    addEventListener(name, callback) {
      events.push(`listener:${name}`)
      this.callback = callback
    },
  }
  const location = {
    hash: `#token=${reviewToken}`,
    pathname: '/family/app-review/',
    assign(destination) {
      throw new Error(`unexpected navigation to ${destination}`)
    },
  }

  globalThis.window = {
    location,
    history: {
      replaceState(_state, _title, path) {
        events.push(`history:${path}`)
        location.hash = ''
      },
    },
  }
  globalThis.document = {
    visibilityState: 'visible',
    querySelector(selector) {
      events.push(`query:${selector}`)
      return new Map([
        ['.join-panel', panel],
        ['#review-message', message],
        ['#open-family-app', helpButton],
      ]).get(selector)
    },
  }
  t.after(() => {
    delete globalThis.window
    delete globalThis.document
  })

  await import(`../family/app-review/app-review.js?browser-harness=${Date.now()}`)

  assert.equal(events[0], 'history:/family/app-review/')
  assert.equal(location.hash, '')
  assert.equal(helpButton.hidden, false)
  assert.doesNotMatch(message.textContent, new RegExp(reviewToken))

  helpButton.callback()
  assert.equal(helpButton.hidden, true)
  assert.doesNotMatch(message.textContent, new RegExp(reviewToken))
  assert.equal(events.some(event => event.startsWith('assign:')), false)
})
