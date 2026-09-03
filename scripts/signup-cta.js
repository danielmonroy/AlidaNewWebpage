/* Signup CTA clicks: PostHog `cta_clicked` + Meta custom `CTAClicked`.
   Required props: placement, label. landing when the page/link has a slug.
   referral_code from the destination when present. No PII, no UTMs. */
(function () {
  function compact(props) {
    var out = {};
    Object.keys(props).forEach(function (key) {
      if (props[key] != null && props[key] !== "") out[key] = props[key];
    });
    return out;
  }

  function destination(link) {
    try {
      return new URL(link.getAttribute("href") || link.href, window.location.href);
    } catch (err) {
      return null;
    }
  }

  function propsFromLink(link) {
    var dest = destination(link);
    var landing =
      link.getAttribute("data-landing") ||
      (window.alidaExperiment && window.alidaExperiment.slug) ||
      (dest && dest.searchParams.get("landing")) ||
      null;

    return compact({
      placement: link.getAttribute("data-cta-placement") || "unknown",
      label: (link.textContent || "").replace(/\s+/g, " ").trim(),
      landing: landing,
      referral_code: dest && dest.searchParams.get("referral_code")
    });
  }

  window.alidaTrackSignupCta = function (link) {
    if (!link || !link.href || link.href.indexOf("/users/sign_up") === -1) return;

    var props = propsFromLink(link);
    if (typeof posthog !== "undefined") posthog.capture("cta_clicked", props);
    if (typeof fbq === "function") fbq("trackCustom", "CTAClicked", props);
  };

  document.addEventListener("click", function (e) {
    var link = e.target && e.target.closest && e.target.closest('a[href*="app.alidahealth.com"]');
    if (link) window.alidaTrackSignupCta(link);
  });
})();
