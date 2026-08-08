# Simpli-FI Family public-route release gate

Status: **HOLD — transport contract proven live; adults-only 1.0 policy is local-only**

Last updated: July 26, 2026

The files in this repository establish the public Family pages and the Apple App Site Association content. They do not prove that the live origin serves the routes, redirects, MIME types, caching, or security headers Apple and the invitation flow require.

Read-only production verification on July 26, 2026 proved that all six
canonical routes return direct HTML responses, slashless aliases redirect
canonically, the AASA file is the reviewed one-app and one-component fragment
contract, response headers match the security contract, and live `join.js`
exactly matches the reviewed fragment-only source. That evidence applies to
public commit `117aaa3215cf8c5bb55c62180f4e56209f7f688a`, not to this adults-only
redline.

Production still publishes superseded 13-to-17 and dependent-access language.
Version 1.0 is now locked to adults age 18 or older, one primary adult, and at
most one second adult admitted through distinct Sign in with Apple identities,
a shared comparison code, and explicit primary-adult approval. The public
legal, support, security, overview, and AASA description changes in this
worktree are not deployed, licensed-counsel approved, or synchronized to a
signed native candidate. No production deployment is authorized until those
gates are satisfied.

## Required production contract

- `https://simpli-fi-os.com/family/`, `/family/support/`,
  `/family/privacy/`, `/family/security/`, `/family/terms/`, and
  `/family/join/` return direct `200 text/html` responses.
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
- Public overview, Privacy Policy, Terms, Security, Support, and invitation
  copy must state that version 1.0 is adults only. Possession of an invitation
  never grants membership; both adults authenticate separately, compare the
  same short code, and the primary adult approves the exact pending request.
- The public policy effective dates and native legal-receipt versions must be
  identical for the signed release candidate.

## Hosting decision

Vercel is the sole intended production host. GitHub Actions verifies the source
but does not deploy it, and the former GitHub Pages custom-domain path has been
removed locally. The checked-in Vercel configuration rewrites Apple’s required
extensionless URL to the canonical JSON source and adds release security
headers. The direct response passed on July 26, 2026 for the previously
reviewed source. The verifier must pass again after the adults-only change is
approved and deployed.

Before live approval, obtain qualified counsel approval for the adults-only
legal disclosures and consumer terms, freeze and verify the exact source
commit, synchronize the native policy versions, deploy it through the approved
Vercel production path, and rerun the fail-closed production verifier. Keep the
canonical paths and AASA content unchanged unless the app entitlement and
release verifier are updated in the same reviewed change.

## Proof commands

Local, dependency-free contract:

```bash
npm test
npm run build
```

Local interface review on July 26, 2026 covered all six routes at 320, 390,
640, 768, and 1,440 CSS pixels (30 route/viewport combinations). It found no
horizontal overflow, including the 640-pixel 200%-zoom equivalent, and no
sub-44-by-44-pixel targets among buttons, brand navigation, site navigation,
side navigation, help links, or footer navigation after remediation. The
synthetic join-fragment check also proved that `#token=` is removed before the
invitation state renders. This is local browser evidence, not deployed
production evidence.

Approved deployment only. The verifier uses the token-free canonical join route; the local contract proves the exact synthetic fragment shape:

```bash
npm run verify:family:production -- https://simpli-fi-os.com
```

Live associated-domains mechanics are proven for the prior source, but release
approval remains blocked until the adults-only source is approved, deployed,
and the production command exits successfully again with every required page
contract and response header present. Do not use a real invitation token for
release verification.
