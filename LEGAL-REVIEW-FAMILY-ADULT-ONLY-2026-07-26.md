# Simpli-FI Family 1.0 adults-only public-surface legal review

Date: July 26, 2026  
Reviewer: Codex legal-review-counsel workflow (not a licensed attorney)  
Operator: Simpli-FI OS LLC, a Texas limited liability company  
Primary jurisdiction reviewed: United States; Texas governing-law and Denton
County venue clauses  
Source reviewed: local worktree
`codex/family-adult-only-public-20260726`, based on public commit
`117aaa3215cf8c5bb55c62180f4e56209f7f688a`

## Verdict

**READY AFTER FIXES — PRODUCTION HOLD.**

The local redline now describes the approved 1.0 product as adults only:
one primary adult, at most one second adult, distinct Sign in with Apple
identities, a comparison-code check, and explicit approval before membership.
The prior 13-to-17 and dependent-access contract has been removed from the
overview, Privacy Policy, Terms, Security, Support, invitation description, and
local release tests.

This review is issue-spotting and drafting support, not legal advice or a
substitute for review by a licensed attorney. Do not publish, synchronize the
native legal version, or submit the app until the High items below are cleared.

## Scope and assumptions

- Version 1.0 is distributed only in the United States.
- Every user must be 18 or older. No child, teen, dependent, or managed profile
  is offered in version 1.0.
- One household can have one primary adult and at most one second adult.
- Each adult can hold only one active household membership and cannot enter a
  new household while a join, leave, removal, or deletion operation is active.
- The second adult uses a distinct Apple identity and receives no household
  content until the primary adult approves the exact pending request.
- Any synthetic App Review account is fenced from real household creation,
  invitation claim, approval, and membership, and contains no real household
  data.
- The Service does not move money. Household money rewards are private ledger
  promises.
- There is no advertising, data sale, cross-app tracking, public profile, open
  chat, or generalized-model training on private Household Content.
- The product behavior, Firebase data model, App Store privacy answers, native
  consent copy, and account-deletion behavior will match the public text.

If any assumption is false, this verdict is void until the affected language is
reviewed again.

## Findings

### Critical

No Critical drafting defect was observed in the reviewed local redline.

### High

1. **The live site still publishes the superseded youth-access contract.**
   The adults-only redline is local-only. Publishing the native build before
   the matching policies creates a direct eligibility and consent
   contradiction.

   Required fix: licensed-counsel approval, owner-approved production deploy,
   exact live-body verification, and synchronization of the native Terms and
   Privacy receipt versions to `2026-07-26`.

2. **The public claims must match the final runtime and App Store disclosures.**
   App Check/App Attest is not yet registered and enforced for the iOS
   production cohort; the final adult-linking backend is not deployed; and the
   exact App Store privacy questionnaire has not been reconciled against the
   frozen candidate.

   Required fix: register and observe App Attest/App Check, deploy only the
   approved backend, complete a data-flow inventory against the exact archive,
   and make the App Store privacy answers match actual provider collection and
   retention.

3. **Licensed counsel must approve the consumer contract before launch.**
   Texas governing law and exclusive Denton County venue, the warranty
   disclaimer, the $100 liability floor, unilateral non-material changes, and
   the four-year legal-receipt retention period can be affected by
   non-waivable consumer law in a user’s state.

   Required fix: United States consumer-technology counsel must approve or
   redline the Terms and Privacy Policy for the planned launch footprint.
   Expansion outside the United States requires a new jurisdiction review.

4. **Consent evidence must be version-locked and operational.**
   The native click-through must present direct links to the exact live
   policies, record the exact effective versions and server acceptance time,
   and require renewed consent for a material change. A website date change
   alone is not adequate evidence.

   Required fix: verify the signed candidate records `2026-07-26` for both
   policies, rejects stale versions, and preserves the documented receipt
   without retaining invitation secrets.

5. **Review access must remain synthetic and segregated.** A review code is not
   an alternative identity for a household adult. The final backend must reject
   review or synthetic claims from every real-household admission command, and
   App Review notes must explain the separate synthetic experience without
   implying that it can join a real household.

### Medium

1. **Adults-only eligibility reduces but does not eliminate youth privacy
   exposure.** The Service needs a documented response for mistaken or
   misrepresented under-18 use, including suspension, investigation, deletion,
   and support escalation.

2. **Household exit and deletion language needs runtime proof.** Verify that a
   second adult can leave, a primary adult can remove the second adult, both
   paths revoke sessions and device state, and primary-owner deletion produces
   the stated household and account effects. Verify that retained shared task
   history removes or replaces the deleted adult’s account identifiers exactly
   as disclosed.

3. **Support and privacy mailboxes need operational evidence.** Confirm
   `ready@simpli-fi-os.com` accepts external mail, has an accountable owner,
   supports privacy appeals, and follows a documented response and retention
   procedure.

4. **Future monetization requires a new review.** Subscriptions, trials,
   auto-renewal, family purchases, promotions, or paid services are outside
   this text. Do not infer that the current Terms cover them.

### Low

1. Keep the interface term **second adult** or **household adult**. Do not expose
   the internal role name `spouse`, which could imply a relationship the
   Service does not verify.
2. Preserve the current invitation minimization: no contact upload, no email
   entry, fragment-only browser fallback, and no household data before
   approval.

## Paste-ready controlling clauses

These clauses are the controlling redlines and must remain materially
consistent across the public pages and native consent screen.

### Eligibility

> The first public release is available only to adults in the United States.
> You must be at least 18 years old to create an account, receive or accept an
> invitation, join a household, or otherwise use the Service. A parent,
> guardian, or other adult cannot waive this requirement for someone under 18.

### Household limit

> Each version 1.0 household may have one primary adult and at most one second
> adult. The primary adult represents that they are at least 18 and have
> authority to create and administer the household. The invited second adult
> separately represents that they are at least 18 and chooses whether to
> request and accept household access.

### Mutual admission

> Possessing or opening an invitation does not grant membership. The invited
> adult must authenticate, confirm adult eligibility and the current legal
> terms, and request to join. Both adults then compare the same short code, and
> the primary adult must approve that exact pending request before the second
> adult becomes an active household member. The comparison code is not a
> password or credential and is not entered to obtain access.

### Pre-approval privacy

> Before approval, an invited adult receives no household member list, task,
> reward, note, or history. After approval, both household adults can view
> membership and household task, timer, completion-review, and reward records.

### Under-18 response

> If we learn that information was submitted for, or an account was used by,
> someone under 18, we will suspend the relevant access, investigate, and
> delete the information as required. Contact us immediately if you believe an
> under-18 person received access.

## Release conditions

The legal lane changes from HOLD only when all of the following have dated,
reviewable evidence:

1. licensed counsel approves the final Terms and Privacy Policy;
2. the owner approves production publication;
3. the live pages and AASA exactly match the frozen public commit;
4. the native candidate records the same `2026-07-26` policy versions;
5. App Store privacy answers match the exact candidate and providers;
6. external mailbox delivery and privacy-request handling are verified; and
7. physical-device tests prove the adult admission, leave, removal, and
   deletion behaviors described above.
