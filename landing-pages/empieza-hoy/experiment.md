# Experiment

## Status

Draft — first campaign landing. Copy matches the “Publicidad Plan Gratuito” flyers. Not linked from the homepage. Not launched.

## Launch Date

—

## Hypothesis

Early-career ophthalmologists (just graduated, about to graduate, or little time in practice) convert better when the ad, this page, and signup tell the same ally + start-today + free-plan story than when the page leads with expediente or with generic “Alida is free” homepage copy.

## Audience

Ophthalmologists in Mexico who are recently graduated, about to graduate, or early in private practice. Not only “opening a first consultorio.”

## Problem

Starting to consult on their own feels unsupported. They need a professional setup without paying for a full clinic stack while volume is still low.

## Why We Believe This

- The flyers already in market sell *Tu práctica empieza hoy. Alida está contigo* plus Plan Gratuito (20 consultas, 1 médico + 2 asistentes). Message match requires the same H1 and offer here and on `/users/sign_up?landing=empieza-hoy`.
- “Free” on the homepage is a different bet (generic trial). This page tests the flyer story, not price as the H1.
- Testimonials are from practicing ophthalmologists. Do not invent recent-grad quotes.

## Value Proposition

Alida is the ally that lets them start today: plan gratuito, 20 consultas al mes, 1 médico + 2 asistentes, so they can focus on patients.

## Primary CTA

One action: create an account on the free plan.

- URL: `https://app.alidahealth.com/users/sign_up?referral_code=ALIDAFREEPLAN&landing=empieza-hoy`
- Button copy: “Activa tu plan gratuito”
- Note under the button: Hasta 20 consultas al mes, sin costo. Tarjeta de crédito no requerida.
- No Typeform, no WhatsApp, no demo link (those stay on the printed flyer / stories)

## Traffic Source

Meta (Facebook + Instagram). Ads point at this URL. Do not link it from the homepage nav.

Ad UTMs stay on `utm_*` (which creative). `landing=empieza-hoy` is which page. `referral_code=ALIDAFREEPLAN` is the plan.

## Success Metrics

Define the numeric bar before spending. Until then, measure in PostHog with `landing = empieza-hoy`:

- `$pageview` where `site = website` (this path)
- `cta_clicked` (PostHog) / `CTAClicked` (Meta custom). Props: `placement` (`nav` \| `hero` \| `footer`), `label`, `landing`, `referral_code`. Not InitiateCheckout.
- `$pageview` where `site = app` (signup)
- `user_signed_up`
- First `appointment_created` (activation)

## Outcome

—

## Learnings

—

## Next Experiment

If this page does not pull, test expediente/receta as a **separate** landing (do not add it here). That was the previous H1 and would mix two bets.

## Open gaps

- Consult-flow video (~30s, muted): placeholder until the file exists. Do not invent a product clip.
- Testimonials are not from recent graduates. Frame them as doctors who already consult in Alida.
- Continue / iterate / abandon numbers get filled in before we buy traffic.
