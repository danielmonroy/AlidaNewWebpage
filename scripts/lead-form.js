/* Marketing lead form: POST /marketing/leads. No PII to PostHog from the page.
   lead_form_started fires once, on first field focus, a tap to #lead-form, or opening the homepage dialog.
   The bot check loads with an inline form, and on the homepage only when the dialog opens. */
(function () {
  var LOCAL_HOSTS = ["localhost", "127.0.0.1"];
  var formStarted = false;
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
  var TURNSTILE_ONLOAD = "__alidaTurnstileOnload";
  var TURNSTILE_SRC =
    "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=" +
    TURNSTILE_ONLOAD;
  var turnstileReady = null;

  function leadsBase() {
    var host = window.location.hostname;
    if (LOCAL_HOSTS.indexOf(host) !== -1) return "http://localhost:3000/marketing/leads";
    return "https://app.alidahealth.com/marketing/leads";
  }

  function landingSlug(form) {
    var fromForm = form && form.getAttribute("data-lead-landing");
    if (fromForm && fromForm.trim()) return fromForm.trim();
    return (window.alidaExperiment && window.alidaExperiment.slug) || "empieza-hoy-llamada";
  }

  function captureFormStarted(form) {
    if (formStarted) return;
    formStarted = true;
    if (typeof posthog === "undefined") return;
    var props = { landing: landingSlug(form) };
    var source = form && form._alidaSource;
    if (source) props.source = source;
    posthog.capture("lead_form_started", props);
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
      window[TURNSTILE_ONLOAD] = function () {
        delete window[TURNSTILE_ONLOAD];
        resolve();
      };

      var script = document.createElement("script");
      script.src = TURNSTILE_SRC;
      script.async = true;
      script.setAttribute("data-alida-turnstile", "1");
      script.addEventListener("error", reject);
      document.head.appendChild(script);
    });
    return turnstileReady;
  }

  function mountCaptcha(form, siteKey) {
    var box = form.querySelector("[data-lead-captcha]");
    if (!box || !siteKey || !window.turnstile) return false;

    box.innerHTML = "";
    form._alidaTurnstileToken = "";
    var theme = form.getAttribute("data-lead-theme") === "light" ? "light" : "dark";
    try {
      form._alidaTurnstileId = window.turnstile.render(box, {
        sitekey: siteKey,
        theme: theme,
        size: "flexible",
        appearance: "interaction-only",
        language: "es",
        callback: function (token) {
          form._alidaTurnstileToken = token || "";
          if (form._alidaTurnstileWait) {
            form._alidaTurnstileWait(form._alidaTurnstileToken);
            form._alidaTurnstileWait = null;
          }
        },
        "expired-callback": function () {
          form._alidaTurnstileToken = "";
        },
        "error-callback": function () {
          form._alidaTurnstileToken = "";
        }
      });
      return form._alidaTurnstileId != null;
    } catch (error) {
      return false;
    }
  }

  function resetCaptcha(form) {
    form._alidaTurnstileToken = "";
    if (window.turnstile && form._alidaTurnstileId != null) {
      window.turnstile.reset(form._alidaTurnstileId);
    }
  }

  function captchaToken(form) {
    if (form._alidaTurnstileToken) return form._alidaTurnstileToken;
    if (window.turnstile && form._alidaTurnstileId != null) {
      return window.turnstile.getResponse(form._alidaTurnstileId) || "";
    }
    return "";
  }

  function waitForCaptchaToken(form) {
    var existing = captchaToken(form);
    if (existing) return Promise.resolve(existing);

    return new Promise(function (resolve) {
      var timer = setTimeout(function () {
        form._alidaTurnstileWait = null;
        resolve(captchaToken(form));
      }, 8000);

      form._alidaTurnstileWait = function (token) {
        clearTimeout(timer);
        resolve(token || "");
      };
    });
  }

  function payloadFrom(form) {
    var data = {
      name: (form.elements.name && form.elements.name.value) || "",
      phone: (form.elements.phone && form.elements.phone.value) || "",
      email: (form.elements.email && form.elements.email.value) || "",
      landing: landingSlug(form),
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

  function postLead(form, button) {
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
  }

  function showError(form, message) {
    var el = form.querySelector("[data-lead-error]");
    if (!el) return;
    el.hidden = !message;
    el.textContent = message || "";
  }

  function showSuccessOnForm(form) {
    var wrap = form.closest("[data-lead-wrap]");
    var fields = form.querySelector("[data-lead-fields]");
    if (fields) {
      fields.hidden = true;
    } else {
      form.hidden = true;
    }
    if (wrap) {
      wrap.classList.add("is-sent");
      var lead = wrap.querySelector(".lp-form-lead");
      if (lead) lead.hidden = true;
    }
    var dialog = form.closest("dialog");
    if (dialog) {
      dialog.querySelectorAll("[data-lead-intro]").forEach(function (el) {
        el.hidden = true;
      });
      closeDialogLater(dialog);
    }
    var success = (wrap || form).querySelector("[data-lead-success]");
    if (success) success.hidden = false;
    var button = form.querySelector("[type='submit']");
    if (button) button.disabled = true;
  }

  function markCtasSent() {
    document.querySelectorAll("[data-lead-cta]").forEach(function (cta) {
      cta.classList.add("is-sent");
      cta.textContent = "Te contactaremos";
    });
  }

  function showSuccess() {
    document.querySelectorAll("[data-lead-form]").forEach(showSuccessOnForm);
    markCtasSent();
  }

  function fetchCaptchaConfig() {
    return fetch(leadsBase() + "/captcha").then(function (response) {
      if (!response.ok) throw new Error("captcha");
      return response.json();
    });
  }

  function fetchCaptchaConfigWithRetry() {
    return fetchCaptchaConfig().catch(function () {
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          fetchCaptchaConfig().then(resolve).catch(reject);
        }, 500);
      });
    });
  }

  var captchaConfigPromise = null;

  function captchaConfig() {
    if (!captchaConfigPromise) captchaConfigPromise = fetchCaptchaConfigWithRetry();
    return captchaConfigPromise;
  }

  function armForms(forms) {
    var pending = [];
    var waits = [];
    forms.forEach(function (form) {
      if (form._alidaCaptchaReady) {
        waits.push(form._alidaCaptchaReady);
        return;
      }
      pending.push(form);
    });
    if (!pending.length) return Promise.all(waits);

    var job = captchaConfig()
      .then(function (config) {
        var siteKey = config && config.enabled ? config.site_key : "";
        var ready = siteKey ? loadTurnstile() : Promise.resolve();
        return ready.then(function () {
          pending.forEach(function (form) {
            form._alidaSiteKey = siteKey;
            if (siteKey && !mountCaptcha(form, siteKey)) {
              showError(form, "No se pudo cargar la verificación. Recarga la página.");
            }
          });
        });
      })
      .catch(function () {
        pending.forEach(function (form) {
          form._alidaSiteKey = "";
          showError(form, "No se pudo cargar la verificación. Recarga la página.");
        });
      });

    pending.forEach(function (form) {
      form._alidaCaptchaReady = job;
    });
    waits.push(job);
    return Promise.all(waits);
  }

  function bindForm(form) {
    form.addEventListener("focusin", function (event) {
      var tag = event.target && event.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        captureFormStarted(form);
      }
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      showError(form, "");

      var button = form.querySelector("[type='submit']");
      if (button) button.disabled = true;

      armForms([form]).then(function () {
        var siteKey = form._alidaSiteKey || "";
        var ready = siteKey ? waitForCaptchaToken(form) : Promise.resolve("");
        ready.then(function (token) {
          if (siteKey && !token) {
            showError(form, "Completa la verificación para continuar.");
            if (button) button.disabled = false;
            return;
          }
          postLead(form, button);
        });
      });
    });
  }

  function formInClosedDialog(form) {
    var dialog = form.closest("dialog");
    return dialog && !dialog.open;
  }

  var SUCCESS_CLOSE_MS = 5000;

  function closeDialogLater(dialog) {
    if (dialog._alidaCloseTimer) clearTimeout(dialog._alidaCloseTimer);
    dialog._alidaCloseTimer = setTimeout(function () {
      dialog._alidaCloseTimer = null;
      if (dialog.open) dialog.close();
    }, SUCCESS_CLOSE_MS);
  }

  function successIsVisible(dialog) {
    var success = dialog.querySelector("[data-lead-success]");
    return success && !success.hidden;
  }

  function openLeadDialog(button) {
    var dialog = document.getElementById("contact-modal");
    if (!dialog || typeof dialog.showModal !== "function") return;
    var form = dialog.querySelector("[data-lead-form]");
    if (form) {
      form._alidaSource = button.getAttribute("data-lead-open") || "";
      captureFormStarted(form);
      armForms([form]);
    }
    if (!dialog.open) dialog.showModal();
    if (successIsVisible(dialog)) closeDialogLater(dialog);
    var name = form && form.querySelector("input[name='name']");
    var fields = form && form.querySelector("[data-lead-fields]");
    if (name && fields && !fields.hidden) name.focus();
  }

  function bindDialog(dialog) {
    dialog.addEventListener("close", function () {
      if (dialog._alidaCloseTimer) {
        clearTimeout(dialog._alidaCloseTimer);
        dialog._alidaCloseTimer = null;
      }
    });
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) dialog.close();
    });
    dialog.querySelectorAll("[data-contact-close]").forEach(function (closer) {
      closer.addEventListener("click", function () {
        dialog.close();
      });
    });
  }

  function init() {
    var forms = document.querySelectorAll("[data-lead-form]");
    var immediate = [];
    forms.forEach(function (form) {
      bindForm(form);
      if (!formInClosedDialog(form)) immediate.push(form);
    });
    if (immediate.length) armForms(immediate);

    var dialog = document.getElementById("contact-modal");
    if (dialog) bindDialog(dialog);

    document.querySelectorAll("[data-lead-open]").forEach(function (button) {
      button.addEventListener("click", function () {
        openLeadDialog(button);
      });
    });

    previewLeadSuccess();
  }

  function previewLeadSuccess() {
    var preview = false;
    try {
      preview = new URLSearchParams(location.search).get("lead-success") === "1";
    } catch (e) {
      preview = false;
    }
    if (!preview) return;
    var dialog = document.getElementById("contact-modal");
    if (!dialog || typeof dialog.showModal !== "function") return;
    showSuccess();
    if (!dialog.open) dialog.showModal();
  }

  function aimLeadForm() {
    var wrap = document.getElementById("lead-form");
    if (!wrap || wrap.classList.contains("is-sent")) return;
    captureFormStarted(wrap.querySelector("[data-lead-form]"));

    wrap.classList.add("is-aimed");
    var name = wrap.querySelector("input[name='name']");
    if (name) {
      setTimeout(function () {
        name.focus({ preventScroll: true });
      }, 400);
    }
    setTimeout(function () {
      wrap.classList.remove("is-aimed");
    }, 2400);
  }

  document.addEventListener("click", function (event) {
    var link = event.target.closest("a[href='#lead-form']");
    if (!link) return;
    aimLeadForm();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
