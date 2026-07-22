# Simpli-FI Family public-route release gate

Status: **HOLD — local contract proven; production contradicts the release contract**

Last updated: July 19, 2026

The files in this repository establish the public Family pages and the Apple App Site Association content. They do not prove that the live origin serves the routes, redirects, MIME types, caching, or security headers Apple and the invitation flow require.

The read-only production verifier was run on July 19, 2026. It failed because
the live Family pages still contain superseded invite-only, location, finance,
and connected-email disclosures; the live association file is not the exact
reviewed one-app, one-component fragment contract; and its response does not
advertise the reviewed `X-Content-Type-Options: nosniff` and
`Cache-Control: max-age=300` headers. The deployed `join.js` also differs from
the reviewed source, reads query-string invitation material, and attempts the
superseded custom-scheme bearer handoff. No deployment is authorized while
those contradictions remain.

## Required production contract

- `https://simpli-fi-os.com/family/`, `/family/support/`, `/family/privacy/`, and `/family/join/` return direct `200 text/html` responses.
- Slashless aliases redirect only to the corresponding trailing-slash URL. Generated invitation links use the canonical `/family/join/#token=<synthetic-probe>` shape so the capability never enters an HTTP request.
- `https://simpli-fi-os.com/.well-known/apple-app-site-association` returns a direct `200` with no redirect, `Content-Type: application/json`, and an uncompressed body smaller than 128 KB.
- The AASA detail binds only `N8J5KA7B3N.com.simplifi.familyos` to `/family/join/` with the exact fragment rule `"token=*"`.
- The invitation response advertises the exact reviewed CSP,
  `Referrer-Policy: no-referrer`, `Cache-Control: no-store, max-age=0`,
  `X-Content-Type-Options: nosniff`, and the reviewed permissions policy.
- Live `join.js` must exactly match the reviewed source bytes. It clears the
  URL fragment before rendering and does not read query parameters, store,
  log, transmit, inject into the DOM, or navigate with the invitation bearer.
- The Store Release app receives invitation capabilities only through the
  associated HTTPS link. A raw-token paste path and custom-scheme bearer
  fallback are prohibited.

## Hosting decision

Vercel is the sole intended production host. GitHub Actions verifies the source
but does not deploy it, and the former GitHub Pages custom-domain path has been
removed locally. The checked-in Vercel configuration rewrites Apple’s required
extensionless URL to the canonical JSON source and adds release security
headers. This still must not be labeled production-AASA-ready until the direct
public response passes the production verifier.

Before live approval, obtain qualified counsel approval for the legal and
minors-data disclosures, freeze and verify the exact source commit, deploy it
through the approved Vercel production path, and rerun the fail-closed
production verifier. Keep the canonical paths and AASA content unchanged unless
the app entitlement and release verifier are updated in the same reviewed
change.

## Proof commands

Local, dependency-free contract:

```bash
npm test
npm run build
```

Approved deployment only. The verifier uses the token-free canonical join route; the local contract proves the exact synthetic fragment shape:

```bash
npm run verify:family:production -- https://simpli-fi-os.com
```

Live associated-domains approval remains blocked until the production command exits successfully with every required response header present. Do not use a real invitation token for release verification.
