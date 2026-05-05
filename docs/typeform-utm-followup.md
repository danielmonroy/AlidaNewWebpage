# Follow-up: capture UTM parameters on Typeform responses

**Status:** Open follow-up
**Owner:** Web team
**Trigger:** Before rolling the popup embed into prod, OR earlier if marketing asks for lead attribution
**Estimated effort:** ~5 minutes in Typeform admin, no code changes

---

## Background

The marketing site already forwards UTM query parameters to outbound links via `initUTMForwarding()` in `AlidaNewWebpage/scripts/main.js`. A visitor who arrives at:

```
alida.health/?utm_source=facebook&utm_campaign=mx_q2
```

…and clicks any Typeform CTA hits:

```
https://bnho4mjq36p.typeform.com/to/V2Njuf39?utm_source=facebook&utm_campaign=mx_q2
```

The query params **reach Typeform**. But Typeform only records query params on a response when matching hidden fields are declared in the form definition. As of this writing, no such fields are declared on form `V2Njuf39`, so the params are silently dropped.

Confirmed by codebase audit: there is **no Typeform webhook, API client, or downstream consumer of Typeform responses** anywhere in the `Alida` Rails app. UTM data on Typeform leads is therefore not flowing into PostHog, the database, or any other system today.

This isn't currently a regression — it's a gap that exists today and will persist after the popup embed rollout unless we close it.

## What to do

In Typeform admin, on form `V2Njuf39`:

1. Open the form editor → **Hidden fields** section.
2. Add the following fields (lowercase, exact spelling — Typeform is case-sensitive on field names):

   | Field | Why |
   |---|---|
   | `utm_source` | Standard Google Analytics / ad-platform attribution |
   | `utm_medium` | |
   | `utm_campaign` | |
   | `utm_term` | Paid search keyword |
   | `utm_content` | A/B variant or ad creative ID |

3. *Optional but recommended* — also add the three click IDs that `Alida/app/controllers/concerns/posthog_utm_capture.rb` already captures for app signups:

   | Field | Source |
   |---|---|
   | `gclid` | Google Ads |
   | `fbclid` | Meta / Facebook |
   | `msclkid` | Microsoft Ads |

   Adding these keeps Typeform responses dimensionally comparable to PostHog's UTM model, so attribution joins work cleanly if we ever build a unified funnel report.

4. **Publish** the form. Hidden fields don't take effect until you publish.

**No code changes required on the website.** The plumbing already sends these params:

- Today (prod redirect flow): `initUTMForwarding()` in `scripts/main.js` appends them to all outbound `<a href>` clicks.
- After embed rollout: `data-tf-transitive-search-params` (set on every `data-tf-popup` button in `contact-test.html`, and later in `index.html`) does the equivalent for popup embeds.

## Verification

Open this URL in any browser:

```
https://bnho4mjq36p.typeform.com/to/V2Njuf39?utm_source=test&utm_campaign=verify
```

Submit a dummy response. In Typeform admin → **Results → Responses** → click the response → expand details. Confirm `utm_source = test` and `utm_campaign = verify` are listed alongside the question answers. If they are, capture is live and any production traffic carrying UTMs will be recorded going forward.

## When to do this

Two reasonable triggers:

1. **Before deploying the popup embed to prod** (`index.html`). Cheap to add and preserves attribution from day one of the new flow.
2. **Or whenever marketing actually needs UTM attribution on Typeform leads.** If no one is currently asking "which campaign produced this contact-form lead?" and no dashboard depends on it, this can wait.

If we wait until after prod rollout, the only cost is "lost" UTM data on responses received between rollout and field declaration. Past responses can't be retroactively backfilled by Typeform, but going forward is fully recoverable by just publishing the fields whenever.

## Out of scope (explicitly)

- **Webhook / sync of Typeform responses into the Rails app.** That's a separate, larger project (CRM-style ingestion, deduplication, identity stitching). This follow-up is *only* about capturing UTM data on the Typeform side so that data exists *somewhere* — Typeform's own admin / CSV exports — when we want it.
- **Backfill of historical responses.** Not possible via Typeform. If marketing needs it, it'd have to be reconstructed from PostHog `$pageview` correlation, and even then only approximately.

## Related

- [`typeform-embed-proposal.md`](./typeform-embed-proposal.md) — main proposal this is a follow-up to.
- `Alida/app/controllers/concerns/posthog_utm_capture.rb` — equivalent capture for app signups; reference for which fields are already canonical in our analytics model.
- `AlidaNewWebpage/contact-test.html` — test page that exercises the popup-embed UTM forwarding via `data-tf-transitive-search-params`.
