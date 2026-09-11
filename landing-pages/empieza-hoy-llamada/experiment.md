# Experiment

## Status

Draft — contact-form landing. Same page body as Empieza hoy; the hero asks them to leave WhatsApp and email instead of hopping to self-serve signup. Not linked from the homepage. Do not replace `/landing-pages/empieza-hoy/`.

## Launch Date

—

## Hypothesis

Early-career ophthalmologists who bounce on a self-serve signup hop will leave a WhatsApp and email if the first action is “te contactamos,” and those conversations convert to clinics the lead provisions after we send them the signup link.

## Audience

Ophthalmologists in Mexico who are recently graduated, about to graduate, or early in private practice. Same as Empieza hoy. Meta: Mexico only.

## Problem

Starting to consult on their own feels unsupported. A hop to `/users/sign_up` from Instagram’s in-app browser is asking them to commit before they have talked to anyone.

## Why We Believe This

- Paid Empieza hoy traffic landed but did not click Empieza gratis. The suspected leak is first-screen / hop friction, not “they already have software.”
- The motion is: leave a name + WhatsApp and email → we contact them → we send them `signup_url` with `?landing=empieza-hoy-llamada`. They open that link. Staff must not.
- This is a different bet from Empieza hoy (self-serve free plan). Do not mix both CTAs on one URL.

## Value Proposition

Alida is the ally that lets them start today. We set the clinic up with them after they leave contact details.

## Primary CTA

One action: leave contact details so we can contact them (page copy: menos de 24 horas).

- Fields: name, WhatsApp, and email. All required.
- No Typeform. No signup hop. No WhatsApp click-to-chat as the test.
- Endpoint: `POST https://app.alidahealth.com/marketing/leads` (Cloudflare Turnstile).
- After contact: send the lead the `signup_url` from the Slack ping (referral + landing + UTMs from the lead row). Do **not** open that link as Alida staff. The lead POST also sends `referral_code` (default `ALIDAFREEPLAN`, or `?referral_code=` on this page).
- Signup aside (`signup.json`) is the same pack as Empieza hoy. The slug on the URL is what distinguishes the two.

## Traffic Source

Meta (Facebook + Instagram), Mexico only. Ads point at this URL. Do not link it from the homepage nav. Do not replace the live Empieza hoy URL.

Ad UTMs stay on `utm_*`. `landing=empieza-hoy-llamada` is which page.

## Success Metrics

Primary: `marketing_lead_created` (server event) from this landing.

Do not declare a winner against Empieza hoy on a blended “conversion rate.” Compare `marketing_lead_created` here to `cta_clicked` / `user_signed_up` there, then count clinics provisioned after contact (`user_signed_up` with `landing=empieza-hoy-llamada`).

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
