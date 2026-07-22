import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  invitationTokenFromFragment,
} from '../family/join/join.js'

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

test('AASA binds only the production app to the exact join path', async () => {
  const association = JSON.parse(
    await readFile('.well-known/apple-app-site-association', 'utf8'),
  )
  const details = association.applinks?.details
  assert.equal(Array.isArray(details), true)
  assert.equal(details.length, 1)
  assert.deepEqual(details[0].appIDs, ['N8J5KA7B3N.com.simplifi.familyos'])
  assert.equal(details[0].components.length, 1)
  assert.deepEqual(details[0].components[0], {
    '/': '/family/join/',
    '#': 'token=*',
    comment: 'Opens a short-lived Simpli-FI Family dependent-device invitation. The app validates the token before use.',
  })
})

test('every static HTML route declares its direct trailing-slash production URL', async () => {
  const routes = new Map([
    ['family/index.html', 'https://simpli-fi-os.com/family/'],
    ['family/support/index.html', 'https://simpli-fi-os.com/family/support/'],
    ['family/privacy/index.html', 'https://simpli-fi-os.com/family/privacy/'],
    ['family/security/index.html', 'https://simpli-fi-os.com/family/security/'],
    ['family/terms/index.html', 'https://simpli-fi-os.com/family/terms/'],
    ['family/join/index.html', 'https://simpli-fi-os.com/family/join/'],
  ])

  for (const [file, canonicalURL] of routes) {
    const html = await readFile(file, 'utf8')
    assert.match(html, new RegExp(`<link rel="canonical" href="${canonicalURL.replaceAll('.', '\\.')}">`))
  }
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
  assert.deepEqual(config.rewrites, [{
    source: '/.well-known/apple-app-site-association',
    destination: '/api/aasa',
  }])

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
  assert.match(terms, /Denton County, Texas/)
  assert.match(terms, /at least 13 years old/)
  assert.match(terms, /Apple’s Standard Licensed Application End User License Agreement/)
  assert.match(security, /does not claim that household content is end-to-end encrypted/)
  assert.match(security, /Report a suspected vulnerability/)
})
