import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  expectedFamilyAASA,
  familyJoinCSP,
  familyPageCSP,
  familyPermissionsPolicy,
  validateAssociationResponseHeaders,
  validateExactFamilyAASA,
  validateFamilyResponseHeaders,
  validateJoinScriptSource,
} from '../scripts/family-production-security-contract.mjs'

import aasa from '../api/aasa.mjs'

function headers(values) {
  return new Headers(values)
}

const baseHeaders = {
  'content-security-policy': familyPageCSP,
  'permissions-policy': familyPermissionsPolicy,
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
}

test('Family response security headers fail on every reviewed-field drift', () => {
  assert.deepEqual(validateFamilyResponseHeaders(headers(baseHeaders)), [])

  for (const name of Object.keys(baseHeaders)) {
    const drifted = { ...baseHeaders, [name]: 'unsafe' }
    assert.notDeepEqual(
      validateFamilyResponseHeaders(headers(drifted)),
      [],
      name,
    )
  }

  assert.deepEqual(validateFamilyResponseHeaders(headers({
    ...baseHeaders,
    'content-security-policy': familyJoinCSP,
    'cache-control': 'private, no-store, max-age=0',
    'content-type': 'application/javascript; charset=utf-8',
  }), { join: true, script: true }), [])

  for (const cacheControl of [
    'no-store, max-age=0',
    'private, max-age=0',
    'private, no-store',
  ]) {
    assert.notDeepEqual(validateFamilyResponseHeaders(headers({
      ...baseHeaders,
      'content-security-policy': familyJoinCSP,
      'cache-control': cacheControl,
      'content-type': 'application/javascript',
    }), { join: true, script: true }), [])
  }
})

test('AASA validation requires the exact one-app and one-component contract', () => {
  assert.deepEqual(validateExactFamilyAASA(expectedFamilyAASA), [])

  const mutations = [
    {},
    { ...structuredClone(expectedFamilyAASA), webcredentials: { apps: [] } },
    {
      applinks: {
        details: [
          ...structuredClone(expectedFamilyAASA).applinks.details,
          { appIDs: ['ATTACKER.app'], components: [{ '/': '*' }] },
        ],
      },
    },
    {
      applinks: {
        details: [{
          ...structuredClone(expectedFamilyAASA).applinks.details[0],
          components: [
            ...structuredClone(expectedFamilyAASA).applinks.details[0].components,
            { '/': '*' },
          ],
        }],
      },
    },
  ]

  for (const mutation of mutations) {
    assert.notDeepEqual(validateExactFamilyAASA(mutation), [])
  }

  assert.deepEqual(validateAssociationResponseHeaders(headers({
    'content-type': 'application/json; charset=utf-8',
    'x-content-type-options': 'nosniff',
    'cache-control': 'public, max-age=300, must-revalidate',
  })), [])
  assert.notDeepEqual(validateAssociationResponseHeaders(headers({
    'content-type': 'application/json',
    'x-content-type-options': 'nosniff',
    'cache-control': 'public, max-age=300',
  })), [])
})

test('AASA endpoint sets the exact public response contract', () => {
  const responseHeaders = new Map()
  let status
  let body
  const response = {
    setHeader(name, value) {
      responseHeaders.set(name.toLowerCase(), value)
    },
    status(value) {
      status = value
      return this
    },
    send(value) {
      body = value
    },
  }

  aasa({}, response)

  assert.equal(status, 200)
  assert.equal(responseHeaders.get('cache-control'), 'public, max-age=300, must-revalidate')
  assert.equal(responseHeaders.get('content-type'), 'application/json; charset=utf-8')
  assert.equal(responseHeaders.get('x-content-type-options'), 'nosniff')
  assert.deepEqual(JSON.parse(body), expectedFamilyAASA)
})

test('join.js validation rejects bearer downgrade and disclosure sinks', () => {
  const safe = `
    const fragment = window.location.hash
    window.history.replaceState(null, '', '/family/join/')
    document.querySelector('#join-message').textContent = fragment ? 'Ready' : 'Missing'
  `
  assert.deepEqual(validateJoinScriptSource(safe), [])

  for (const unsafe of [
    safe.replace(
      "document.querySelector('#join-message')",
      "window.location.assign('simplififamily://join?token=x'); document.querySelector('#join-message')",
    ),
    safe.replace('const fragment', 'fetch("/leak"); const fragment'),
    safe.replace('const fragment', 'localStorage.token = "x"; const fragment'),
    safe.replace('.textContent', '.innerHTML'),
    safe.replace(
      "window.history.replaceState(null, '', '/family/join/')\n    document.querySelector",
      "document.querySelector",
    ),
  ]) {
    assert.notDeepEqual(validateJoinScriptSource(unsafe), [])
  }
})

test('Vercel source headers exactly implement the reviewed Family contracts', async () => {
  const config = JSON.parse(await readFile('vercel.json', 'utf8'))
  const headersFor = source => new Map(
    config.headers
      .find(rule => rule.source === source)
      ?.headers.map(header => [header.key.toLowerCase(), header.value]) ?? [],
  )
  const family = headersFor('/family/(.*)')
  const join = headersFor('/family/join/(.*)')
  const association = headersFor('/.well-known/apple-app-site-association')

  assert.equal(family.get('content-security-policy'), familyPageCSP)
  assert.equal(family.get('permissions-policy'), familyPermissionsPolicy)
  assert.equal(family.get('referrer-policy'), 'no-referrer')
  assert.equal(family.get('x-content-type-options'), 'nosniff')
  assert.equal(family.get('x-frame-options'), 'DENY')

  assert.equal(join.get('content-security-policy'), familyJoinCSP)
  assert.equal(join.get('cache-control'), 'private, no-store, max-age=0')

  assert.equal(
    association.get('content-type'),
    'application/json; charset=utf-8',
  )
  assert.equal(association.get('x-content-type-options'), 'nosniff')
  assert.equal(
    association.get('cache-control'),
    'public, max-age=300, must-revalidate',
  )
})
