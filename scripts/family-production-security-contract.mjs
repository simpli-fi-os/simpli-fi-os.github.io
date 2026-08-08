import { isDeepStrictEqual } from 'node:util'

export const familyPageCSP =
  "default-src 'self'; base-uri 'self'; connect-src 'none'; frame-ancestors 'none'; img-src 'self'; object-src 'none'; script-src 'self'; style-src 'self'; form-action 'none'"

export const familyJoinCSP =
  "default-src 'self'; base-uri 'none'; connect-src 'none'; frame-ancestors 'none'; form-action 'none'; img-src 'self'; object-src 'none'; script-src 'self'; style-src 'self'"

export const familyPermissionsPolicy =
  'browsing-topics=(), camera=(), geolocation=(), microphone=(), payment=(), usb=()'

// This object is byte-compatible with EXPECTED_FAMILY_AASA in the native release
// verifier (scripts/familyos-release-readiness.mjs). Both are deep-equality
// checked against the live document, so the two must change together.
export const expectedFamilyAASA = Object.freeze({
  applinks: {
    details: [
      {
        appIDs: ['N8J5KA7B3N.com.simplifi.familyos'],
        components: [
          {
            '/': '/family/join/',
            '#': 'token=*',
            comment:
              'Opens a short-lived Simpli-FI Family adult-household invitation. The app validates the token before use.',
          },
          {
            '/': '/family/app-review/',
            '#': 'token=*',
            comment:
              'Opens purpose-bound, expiring synthetic App Review access. The fragment token is never sent to the web origin.',
          },
        ],
      },
    ],
  },
})

function headerValue(headers, name) {
  return (headers.get(name) ?? '').trim()
}

export function validateFamilyResponseHeaders(
  headers,
  { join = false, script = false } = {},
) {
  const findings = []
  const expectedCSP = join ? familyJoinCSP : familyPageCSP

  if (headerValue(headers, 'content-security-policy') !== expectedCSP) {
    findings.push('Content-Security-Policy does not exactly match the reviewed Family policy')
  }
  if (headerValue(headers, 'permissions-policy') !== familyPermissionsPolicy) {
    findings.push('Permissions-Policy does not exactly match the reviewed Family policy')
  }
  if (headerValue(headers, 'referrer-policy').toLowerCase() !== 'no-referrer') {
    findings.push('Referrer-Policy is not exactly no-referrer')
  }
  if (headerValue(headers, 'x-content-type-options').toLowerCase() !== 'nosniff') {
    findings.push('X-Content-Type-Options is not exactly nosniff')
  }
  if (headerValue(headers, 'x-frame-options').toUpperCase() !== 'DENY') {
    findings.push('X-Frame-Options is not exactly DENY')
  }

  if (join) {
    const cacheControl = headerValue(headers, 'cache-control').toLowerCase()
    for (const directive of ['private', 'no-store', 'max-age=0']) {
      if (!cacheControl.split(',').map(value => value.trim()).includes(directive)) {
        findings.push(`join response Cache-Control is missing ${directive}`)
      }
    }
  }

  if (script) {
    const contentType = headerValue(headers, 'content-type').toLowerCase()
    if (!/^(?:application|text)\/javascript\b/.test(contentType)) {
      findings.push('join.js is not served as JavaScript')
    }
  }

  return findings
}

export function validateAssociationResponseHeaders(headers) {
  const findings = []
  if (!headerValue(headers, 'content-type').toLowerCase().startsWith('application/json')) {
    findings.push('AASA is not served as application/json')
  }
  if (headerValue(headers, 'x-content-type-options').toLowerCase() !== 'nosniff') {
    findings.push('AASA X-Content-Type-Options is not exactly nosniff')
  }
  const cacheControl = headerValue(headers, 'cache-control').toLowerCase()
  for (const directive of ['public', 'max-age=300', 'must-revalidate']) {
    if (!cacheControl.split(',').map(value => value.trim()).includes(directive)) {
      findings.push(`AASA Cache-Control is missing ${directive}`)
    }
  }
  return findings
}

export function validateExactFamilyAASA(association) {
  return isDeepStrictEqual(association, expectedFamilyAASA)
    ? []
    : ['production AASA is not exactly the reviewed one-app, one-component contract']
}

export function validateJoinScriptSource(source) {
  const findings = []
  const clearIndex = source.indexOf('window.history.replaceState')
  const firstDOMRead = source.indexOf('document.querySelector')

  if (clearIndex < 0 || firstDOMRead < 0 || clearIndex > firstDOMRead) {
    findings.push('join.js does not clear the fragment before its first DOM read')
  }
  if (/simplififamily\s*:|window\.location\.assign|window\.location\.replace/i.test(source)) {
    findings.push('join.js contains a custom-scheme or scripted bearer navigation path')
  }
  if (/window\.location\.search|invitationTokenFromSearch/.test(source)) {
    findings.push('join.js reads query-string invitation material')
  }
  if (/localStorage|sessionStorage|document\.cookie|sendBeacon|fetch\s*\(|XMLHttpRequest|console\./.test(source)) {
    findings.push('join.js contains a prohibited storage, network, cookie, or logging sink')
  }
  if (/\.innerHTML|\.outerHTML|\.dataset/.test(source)) {
    findings.push('join.js contains a prohibited DOM token sink')
  }
  return findings
}
