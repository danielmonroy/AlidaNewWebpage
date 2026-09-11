# Experiment

## Status

Draft — call-form landing. Same page body as Empieza hoy; the hero asks for a call instead of self-serve signup. Not linked from the homepage. Do not replace `/landing-pages/empieza-hoy/`.

## Launch Date

—

## Hypothesis

Early-career ophthalmologists who bounce on a self-serve signup hop will leave a WhatsApp or email if the first action is “te llamamos,” and those conversations convert to clinics we provision after the call.

## Audience

Ophthalmologists in Mexico who are recently graduated, about to graduate, or early in private practice. Same as Empieza hoy. Meta: Mexico only.

## Problem

Starting to consult on their own feels unsupported. A hop to `/users/sign_up` from Instagram’s in-app browser is asking them to commit before they have talked to anyone.

## Why We Believe This

- Paid Empieza hoy traffic landed but did not click Empieza gratis. The suspected leak is first-screen / hop friction, not “they already have software.”
- The motion is: leave a name + WhatsApp or email → we call → we create the account with `?landing=empieza-hoy-llamada`.
- This is a different bet from Empieza hoy (self-serve free plan). Do not mix both CTAs on one URL.

## Value Proposition

Alida is the ally that lets them start today. We set it up with them on a call.

## Primary CTA

One action: leave contact details so we can call.

- Fields: name (required), WhatsApp first, then email. At least one of phone or email.
- No Typeform. No signup hop. No WhatsApp click-to-chat as the test.
- Endpoint: `POST https://app.alidahealth.com/marketing/leads` (Cloudflare Turnstile).
- After the call: send the lead the `signup_url` from the Slack ping (referral + landing + UTMs from the lead row). Do **not** open that link as Alida staff. The lead POST also sends `referral_code` (default `ALIDAFREEPLAN`, or `?referral_code=` on this page).

## Traffic Source

Meta (Facebook + Instagram), Mexico only. Ads point at this URL. Do not link it from the homepage nav. Do not replace the live Empieza hoy URL.

Ad UTMs stay on `utm_*`. `landing=empieza-hoy-llamada` is which page.

## Success Metrics

Primary: `marketing_lead_created` (server event) from this landing.

Do not declare a winner against Empieza hoy on a blended “conversion rate.” Compare `marketing_lead_created` here to `cta_clicked` / `user_signed_up` there, then count clinics provisioned after the call (`user_signed_up` with `landing=empieza-hoy-llamada`).

`environment` is `production` only on alida.health / www.

## Launch checklist (ops, not code)

1. Cloudflare Turnstile: add `alida.health` and `www.alida.health` to the existing signup widget hostname list (same site key). Until this is done, production submits fail closed.
2. PostHog destination is live: `marketing_lead_created` → `#alida-sales` (`https://us.posthog.com/project/378023/functions/01a091ad-7756-0000-ec81-cf2ac1aca230`).
3. Run the migration on the app (`marketing_leads`).
4. Point a Mexico-only ad set at `/landing-pages/empieza-hoy-llamada/`.

## Outcome

—

## Learnings

—

## Next Experiment

If leads appear and Empieza hoy self-serve stays at zero, the hop was the leak. If both stay empty, the problem is still first screen / audience / creative.
