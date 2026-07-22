# Simpli-FI OS public site

This repository is the source for `https://simpli-fi-os.com`. Vercel is the
only intended production host. GitHub Actions verifies source and must not
deploy GitHub Pages or claim the custom domain.

## Family release contract

- Preserve the approved Simpli-FI Family icon and the black, white, and
  `#9EDD36` visual system.
- Public dependent invitations use
  `https://simpli-fi-os.com/family/join/#token=<short-lived-token>`. The bearer
  token must never enter an HTTP query, the DOM, browser storage, logs,
  analytics, or a link attribute.
- The AASA document must bind only
  `N8J5KA7B3N.com.simplifi.familyos` to `/family/join/` with the exact
  `token=*` fragment component.
- Treat legal copy, minors disclosures, operator identity, support contacts,
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
