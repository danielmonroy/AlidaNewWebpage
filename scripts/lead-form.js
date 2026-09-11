/* Marketing lead form: POST /marketing/leads. No PII to PostHog from the page. */
(function () {
  var LOCAL_HOSTS = ["localhost", "127.0.0.1"];
  var CAMPAIGN_KEYS = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "utm_id",
    "gclid",
    "fbclid",
    "msclkid"
  ];
  var TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  var turnstileReady = null;

  function leadsBase() {
    var host = window.location.hostname;
    if (LOCAL_HOSTS.indexOf(host) !== -1) return "http://localhost:3000/marketing/leads";
    return "https://app.alidahealth.com/marketing/leads";
  }

  function landingSlug() {
    return (window.alidaExperiment && window.alidaExperiment.slug) || "empieza-hoy-llamada";
  }

  function referralCode(form) {
    var fromQuery = new URLSearchParams(window.location.search).get("referral_code");
    if (fromQuery && fromQuery.trim()) return fromQuery.trim();
    if (form.elements.referral_code && form.elements.referral_code.value) {
      return form.elements.referral_code.value.trim();
    }
    return (window.alidaExperiment && window.alidaExperiment.referral_code) || "";
  }

  function loadTurnstile() {
    if (window.turnstile) return Promise.resolve();
    if (turnstileReady) return turnstileReady;

    turnstileReady = new Promise(function (resolve, reject) {
      var existing = document.querySelector("script[data-alida-turnstile]");
      if (existing) {
        existing.addEventListener("load", function () { resolve(); });
        existing.addEventListener("error", reject);
        return;
      }
      var script = document.createElement("script");
      script.src = TURNSTILE_SRC;
      script.async = true;
      script.defer = true;
      script.setAttribute("data-alida-turnstile", "1");
      script.addEventListener("load", function () { resolve(); });
      script.addEventListener("error", reject);
      document.head.appendChild(script);
    });
    return turnstileReady;
  }

  function mountCaptcha(form, siteKey) {
    var box = form.querySelector("[data-lead-captcha]");
    if (!box || !siteKey || !window.turnstile) return;

    box.innerHTML = "";
    var theme = form.getAttribute("data-lead-theme") === "light" ? "light" : "dark";
    form._alidaTurnstileId = window.turnstile.render(box, {
      sitekey: siteKey,
      theme: theme,
      size: "flexible",
      appearance: "always",
      language: "es"
    });
  }

  function resetCaptcha(form) {
    if (window.turnstile && form._alidaTurnstileId != null) {
      window.turnstile.reset(form._alidaTurnstileId);
    }
  }

  function captchaToken(form) {
    if (window.turnstile && form._alidaTurnstileId != null) {
      return window.turnstile.getResponse(form._alidaTurnstileId) || "";
    }
    return "";
  }

  function payloadFrom(form) {
    var data = {
      name: (form.elements.name && form.elements.name.value) || "",
      phone: (form.elements.phone && form.elements.phone.value) || "",
      email: (form.elements.email && form.elements.email.value) || "",
      landing: landingSlug(),
      referral_code: referralCode(form)
    };
    var token = captchaToken(form);
    if (token) data["cf-turnstile-response"] = token;

    var campaign = window.alidaFirstTouchCampaign || {};
    CAMPAIGN_KEYS.forEach(function (key) {
      if (campaign[key]) data[key] = campaign[key];
    });

    if (typeof posthog !== "undefined") {
      var did = posthog.get_distinct_id && posthog.get_distinct_id();
      var sid = posthog.get_session_id && posthog.get_session_id();
      if (did) data["_ph_did"] = did;
      if (sid) data["_ph_sid"] = sid;
    }
    return data;
  }

  function showError(form, message) {
    var el = form.querySelector("[data-lead-error]");
    if (!el) return;
    el.hidden = !message;
    el.textContent = message || "";
  }

  function showSuccess(form) {
    var wrap = form.closest("[data-lead-wrap]");
    if (wrap) {
      var success = wrap.querySelector("[data-lead-success]");
      form.hidden = true;
      if (success) success.hidden = false;
      return;
    }
    form.hidden = true;
  }

  function bindForm(form, siteKey) {
    if (siteKey) mountCaptcha(form, siteKey);

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      showError(form, "");

      var button = form.querySelector("[type='submit']");
      if (button) button.disabled = true;

      fetch(leadsBase(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadFrom(form))
      })
        .then(function (response) {
          return response.json().then(function (body) {
            return { ok: response.ok, body: body };
          }).catch(function () {
            return { ok: response.ok, body: {} };
          });
        })
        .then(function (result) {
          if (!result.ok) {
            showError(form, result.body.error || "No pudimos enviar tus datos. Intenta de nuevo.");
            resetCaptcha(form);
            if (button) button.disabled = false;
            return;
          }
          showSuccess(form);
        })
        .catch(function () {
          showError(form, "No pudimos enviar tus datos. Revisa tu conexión e intenta de nuevo.");
          resetCaptcha(form);
          if (button) button.disabled = false;
        });
    });
  }

  function init() {
    var forms = document.querySelectorAll("[data-lead-form]");
    if (!forms.length) return;

    fetch(leadsBase() + "/captcha")
      .then(function (response) { return response.json(); })
      .then(function (config) {
        var siteKey = config && config.enabled ? config.site_key : "";
        var ready = siteKey ? loadTurnstile() : Promise.resolve();
        return ready.then(function () {
          forms.forEach(function (form) { bindForm(form, siteKey); });
        });
      })
      .catch(function () {
        forms.forEach(function (form) { bindForm(form, ""); });
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
