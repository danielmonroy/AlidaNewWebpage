# Replacing the Typeform redirect with an in-page embed

**Status:** Proposal
**Author:** Web team
**Audience:** Engineering / CTO review
**Estimated effort:** < 1 hour of dev work + ~5 min of Typeform configuration

---

## 1. Context

Today the marketing site (`alida.health`) has three CTAs that send the visitor off-domain to a Typeform form to capture contact info:

| Location in `index.html` | CTA copy | Current target |
|---|---|---|
| Hero (line 170) | "Ponte en contacto con nosotros" | `https://bnho4mjq36p.typeform.com/to/V2Njuf39` |
| Pricing → Empresa Plus (line 710) | "Hablar con Ventas" | same |
| Final CTA section (line 786) | "Solicitar Demo" | same |

Clicking any of them performs a top-level navigation to `*.typeform.com`. The URL bar flips, our branding disappears, and any front-end tracking we did on `alida.health` ends at the click.

The original question was: **can we put a record on our DNS and proxy `alida.health/contact` (or similar) at the Typeform URL so the user never sees `typeform.com`?**

## 2. Why a pure DNS / proxy approach is a bad idea

### 2.1 DNS alone (CNAME) doesn't work

A `CNAME` like `form.alida.health → bnho4mjq36p.typeform.com` will fail for two independent reasons:

1. **TLS mismatch.** Typeform serves `*.typeform.com` certificates. The browser will reject the connection on `form.alida.health` with a certificate error.
2. **Host-based routing.** Typeform's edge inspects the `Host` header to decide which workspace's form to render. It has no knowledge of `form.alida.health`, so even with TLS solved we'd hit a 404 / generic page.

DNS can only point at a hostname or IP — it can't terminate TLS for our domain or rewrite request headers.

### 2.2 Reverse-proxying through Cloudflare Workers / Vercel / nginx

Technically possible, but in practice this means:

- **Maintenance burden.** Typeform loads dozens of subresources from `*.typeform.com`, `*.typeformusercontent.com`, fonts, websockets, analytics. We'd need to either selectively rewrite every URL on the way through or proxy all of those too. Both approaches break whenever Typeform ships changes.
- **Functionality risk.** Form submissions, file uploads, partial-save, and Typeform's own analytics frequently break under naive proxies. Diagnosing those is on us.
- **Terms-of-service risk.** Typeform's ToS prohibit framing/scraping/proxying their UI without permission. We become the party responsible if it's challenged.
- **No real upside.** It does what option 4 below does, only worse and at the cost of running infrastructure.

**Recommendation: don't do this.**

### 2.3 Typeform's official custom-subdomain feature

Typeform offers a supported custom-subdomain feature on Business / Enterprise plans. They provide a `CNAME` target, handle TLS, and the URL bar shows `forms.alida.health` (or whatever we choose) end-to-end through submission.

This is the *only* turnkey way to keep the URL bar on our domain. It costs money and requires a plan upgrade. Worth weighing against option 4 below; for most marketing sites option 4 is the better trade.

## 3. Recommended path: embed the form in-page (option 4)

Typeform ships an official [embed SDK](https://www.typeform.com/developers/embed/) with several modes — inline, popup, slider, popover, side-tab. For our case **popup** is the right fit:

- Our CTAs are scattered across the page (hero, pricing card, final CTA). Popup lets every existing button stay exactly where it is — only the click behavior changes.
- The user never leaves `alida.health`. Form, validation, and "thank you" all happen in an overlay.
- No layout rebalancing needed (an inline embed would eat large vertical chunks of the hero, pricing card, and CTA section).
- The Typeform SDK is officially supported and the embed snippet is what their docs recommend.

### 3.1 What the change looks like

#### a) Add the embed script + stylesheet to `index.html` `<head>`

```html
<script src="//embed.typeform.com/next/embed.js" async></script>
<link rel="stylesheet" href="//embed.typeform.com/next/css/popup.css" />
```

#### b) Convert each of the three Typeform `<a>` tags into a `<button>` with `data-tf-popup`

Today (e.g. line 170):

```html
<a href="https://bnho4mjq36p.typeform.com/to/V2Njuf39"
   class="btn btn-outline-light btn-lg">
  Ponte en contacto con nosotros
</a>
```

Becomes:

```html
<button type="button"
        data-tf-popup="V2Njuf39"
        data-tf-opacity="100"
        data-tf-size="80"
        data-tf-iframe-props="title=Contacto Alida Health"
        data-tf-transitive-search-params
        data-tf-hidden="source=hero_cta"
        data-tf-medium="snippet"
        class="btn btn-outline-light btn-lg">
  Ponte en contacto con nosotros
</button>
```

Notes on the data attributes:

- `data-tf-popup="V2Njuf39"` — the form ID (extracted from the existing URL).
- `data-tf-transitive-search-params` — auto-forwards `utm_*` query params from the current URL into the form as hidden fields. This replaces what `initUTMForwarding()` does for these specific links today.
- `data-tf-hidden="source=hero_cta"` — static hidden field so we can tell in the Typeform inbox which CTA fired the form (`hero_cta`, `pricing_empresa`, `final_cta`).
- We swap `<a>` → `<button>` because the element no longer navigates. Existing `.btn` classes target both, so styling is unaffected, but it deserves a smoke test.

#### c) Wire form events into PostHog

Currently when a user clicks the CTA, PostHog logs them leaving `alida.health` and the journey ends there. With a popup there's no navigation, so without this step we lose the conversion signal entirely.

Add to `scripts/main.js` (or a new `scripts/typeform.js`):

```js
window.addEventListener('message', function (e) {
  if (typeof e.data !== 'string') return;
  if (typeof posthog === 'undefined') return;

  if (e.data.indexOf('form-ready') === 0) {
    posthog.capture('typeform_opened', { form_id: 'V2Njuf39' });
  }
  if (e.data.indexOf('form-submit') === 0) {
    posthog.capture('typeform_submitted', { form_id: 'V2Njuf39' });
  }
});
```

This gives us a clean PostHog funnel: `$pageview` → `typeform_opened` → `typeform_submitted`, with the `source` hidden field optionally pulled in as a property if we want to attribute conversions to a specific CTA position.

### 3.2 Compatibility with the existing tracking pipeline

`index.html` and `scripts/main.js` already run two pieces of cross-domain tracking that need to be sanity-checked:

1. **`initUTMForwarding()` in `scripts/main.js`** (lines 291–322) walks every `<a>` and copies `utm_*` params from the current URL onto outbound links. After the change, the Typeform CTAs are `<button>`s with no `href`, so this loop silently no-ops on them — exactly what we want, since `data-tf-transitive-search-params` now handles UTM forwarding for the form. The remaining outbound links (`app.alidahealth.com` sign-up flows) keep working unchanged.
2. **The cross-domain PostHog identity handler in `index.html`** (lines 64–78) only mutates `app.alidahealth.com` links. Untouched, no change needed.

### 3.3 Optional: pre-fill PostHog identity into the form

If we want every form submission attributable back to the same PostHog person (handy for marketing → form conversion analysis in a single dashboard), we can pass `distinct_id` as a hidden field. Either statically via `data-tf-hidden` rendered server-side, or via the imperative SDK at click time:

```js
const popup = window.tf.createPopup('V2Njuf39', {
  hidden: {
    posthog_distinct_id: posthog.get_distinct_id?.() || '',
    page: window.location.pathname,
  },
});
```

For this to actually capture, the Typeform form definition must declare `posthog_distinct_id` as a hidden field — Typeform silently drops unknown ones.

## 4. Tradeoffs and risks

| Concern | Assessment |
|---|---|
| **Page weight** | `embed.js` is ~50–80 KB. Loaded `async` so it doesn't block render. If we want to push further, we can lazy-load it on first CTA hover/interaction. |
| **Direct Typeform link sharing** | The existing URL `bnho4mjq36p.typeform.com/to/V2Njuf39` keeps working — Typeform doesn't disable it when embedded. Any ads or emails currently pointing at it stay valid. |
| **Mobile** | iOS Safari has historically been the flakiest target for `embed.js`. Needs a smoke test on a real device, but it's been stable for years. |
| **Typeform analytics** | Unaffected — start rate, completion rate, drop-off all keep working in the Typeform admin. |
| **Reversibility** | High. The change is contained to `index.html` (head + 3 CTAs) and one event listener in `main.js`. Reverting is a one-commit revert. |
| **Vendor risk** | We remain on Typeform either way. The embed swap doesn't increase lock-in — it actually makes future migration easier, since the form is referenced by ID in three well-known places rather than by URL across links and emails. |

## 5. Effort estimate

| Task | Time |
|---|---|
| HTML edits (script tag + 3 CTA conversions) | ~15 min |
| `main.js` PostHog event listener | ~10 min |
| Typeform admin: declare hidden fields (`utm_source`, `utm_campaign`, `source`, optionally `posthog_distinct_id`) | ~5 min |
| QA: desktop + mobile, verify submission lands in Typeform inbox, verify PostHog events fire | ~20 min |
| **Total** | **< 1 hour** |

## 6. Comparison summary

| Option | URL bar stays on alida.health | Effort | Cost | ToS risk | Recommended |
|---|---|---|---|---|---|
| 1. Plain DNS CNAME | n/a — doesn't work | — | — | — | No |
| 2. HTTP redirect from `form.alida.health` | Briefly, then flips | 5 min | Free | None | If we just want a brandable link |
| 3. Reverse proxy (Workers / nginx) | Yes | High + ongoing | Infra cost | High | No |
| 4. **Typeform embed (popup)** | **Yes** | **< 1 hr** | **Free** | **None** | **Yes — recommended** |
| 5. Typeform paid custom subdomain | Yes (incl. URL through submission) | ~30 min DNS work | Plan upgrade $$$ | None | Only if URL fidelity is worth the plan cost |

## 7. Recommendation

Adopt **option 4 (popup embed)**. It's the only path that gives us "user never leaves alida.health" without ongoing infrastructure or plan-tier costs, fits the existing CTA layout with no design rework, and integrates cleanly with our PostHog/UTM pipeline.

If after rolling this out the URL-bar fidelity through submission becomes a brand priority, option 5 (Typeform's paid custom subdomain) is a non-disruptive future upgrade — it doesn't conflict with the embed.

## 8. Open questions for review

1. Are we OK adding `embed.js` to the marketing site's critical path, or do we want it lazy-loaded behind first interaction?
2. Do we want to pass `posthog_distinct_id` into Typeform submissions (section 3.3)? This crosses our PII boundary into Typeform — worth a privacy review.
3. Is there appetite to also evaluate option 5 (paid custom subdomain) for the URL-bar fidelity, or is option 4 enough?
