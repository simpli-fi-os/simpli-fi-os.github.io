import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  appInvitationURL,
  invitationTokenFromSearch,
} from '../family/join/join.js'

const validToken = 'A'.repeat(43)

test('accepts only one exact URL-safe invitation token', () => {
  assert.equal(invitationTokenFromSearch(`?token=${validToken}`), validToken)
  assert.equal(invitationTokenFromSearch(`token=${validToken}`), validToken)
  assert.equal(invitationTokenFromSearch(`?token=${'b'.repeat(32)}`), 'b'.repeat(32))
  assert.equal(invitationTokenFromSearch(`?token=${'c'.repeat(200)}`), 'c'.repeat(200))

  for (const search of [
    '',
    '?token=',
    '?token=short',
    `?token=${'d'.repeat(201)}`,
    `?token=${validToken}&source=email`,
    `?token=${validToken}&token=${validToken}`,
    `?Token=${validToken}`,
    `?token=${validToken}%2F`,
    `?token=${validToken}.`,
  ]) {
    assert.equal(invitationTokenFromSearch(search), null, search)
  }
})

test('builds only the exact app invitation URL shape', () => {
  assert.equal(
    appInvitationURL(validToken),
    `simplififamily://join?token=${validToken}`,
  )
  assert.equal(appInvitationURL('short'), null)
  assert.equal(appInvitationURL(`${validToken}/`), null)
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
    '?': { token: '*' },
    comment: 'Opens a short-lived Simpli-FI Family dependent-device invitation. The app validates the token before use.',
  })
})

test('every static HTML route declares its direct trailing-slash production URL', async () => {
  const routes = new Map([
    ['family/index.html', 'https://simpli-fi-os.com/family/'],
    ['family/support/index.html', 'https://simpli-fi-os.com/family/support/'],
    ['family/privacy/index.html', 'https://simpli-fi-os.com/family/privacy/'],
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
  assert.doesNotMatch(source, /localStorage|sessionStorage|document\.cookie|sendBeacon|fetch\(|XMLHttpRequest|console\./)
  assert.doesNotMatch(source, /\.innerHTML|\.outerHTML|\.dataset/)
})
