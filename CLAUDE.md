# Simpli-FI OS public site

This repository is the source for `https://simpli-fi-os.com`. Vercel is the
only intended production host. GitHub Actions verifies source and must not
deploy GitHub Pages or claim the custom domain.

## Family release contract

- Preserve the approved Simpli-FI Family icon and the black, white, and
  `#9EDD36` visual system.
- Public second-adult household invitations use
  `https://simpli-fi-os.com/family/join/#token=<short-lived-token>`. The bearer
  token must never enter an HTTP query, the DOM, browser storage, logs,
  analytics, or a link attribute.
- The AASA document must bind only `N8J5KA7B3N.com.simplifi.familyos`, and only
  to `/family/join/` and `/family/app-review/`, each with the exact `token=*`
  fragment component and in that order. `expectedFamilyAASA` here and
  `EXPECTED_FAMILY_AASA` in the native release verifier are both deep-equality
  checked against the live document, so the two must change together.
- `/family/app-review/` serves purpose-bound, expiring App Review access to a
  synthetic household. It is `noindex` and follows the same fragment-bearer
  contract as `/family/join/`.
- Static files under `/.well-known/` do not receive `vercel.json` header rules.
  The AASA and `security.txt` documents are therefore served from serverless
  functions that set their own headers; the static files are fallbacks only and
  are asserted byte-identical by tests.
- Version 1.0 is adults only: one primary adult and at most one second adult,
  both age 18 or older and authenticated with distinct Sign in with Apple
  identities. The link can start a request but never grants membership.
- Treat legal copy, adult-eligibility disclosures, operator identity, support contacts,
  and deletion language as release-controlled content.
- Never use a real household, identity, or invitation token in source, tests,
  screenshots, or verification.

## Required checks

Use Node `22.16.0`.

```bash
npm test
npm run build
```

After an approved deployment:

```bash
npm run verify:family:production -- https://simpli-fi-os.com
```

The live verifier must fail on any required header, MIME type, redirect,
content, canonical-route, or AASA mismatch. A local pass is not deployment or
App Review proof.
