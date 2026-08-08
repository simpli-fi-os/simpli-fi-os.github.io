// Single source of truth for the published security.txt body.
//
// Vercel's `headers` rules in vercel.json are not applied to static files under
// `/.well-known/`, which is why the live document was served without
// `X-Content-Type-Options: nosniff`. The AASA document already works around this
// by being served from a serverless function that sets its own headers, so
// security.txt now uses the same proven path. The static file is retained as a
// fallback for any host that does honor the header rules, and a test asserts the
// two stay byte-identical.
export const familySecurityTxt = `Contact: mailto:ready@simpli-fi-os.com
Expires: 2027-07-16T04:59:59Z
Preferred-Languages: en
Canonical: https://simpli-fi-os.com/.well-known/security.txt
Policy: https://simpli-fi-os.com/family/security/
`
