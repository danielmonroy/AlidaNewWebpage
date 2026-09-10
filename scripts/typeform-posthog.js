/* Homepage Typeform popup → PostHog.
   The embed SDK posts objects ({ type: "form-ready" }), not the legacy
   "form-ready" string this page used to listen for. */
(function () {
  var FORM_ID = "V2Njuf39";
  var seen = {};

  function eventType(data) {
    if (data == null) return null;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch (err) {
        if (data.indexOf("form-ready") === 0) return "form-ready";
        if (data.indexOf("form-submit") === 0) return "form-submit";
        return null;
      }
    }
    if (typeof data !== "object") return null;
    var type = data.type || data.event;
    if (type === "form-ready" || type === "ready") return "form-ready";
    if (type === "form-submit" || type === "form-submitted" || type === "submit") {
      return "form-submit";
    }
    return null;
  }

  function formId(data) {
    if (!data || typeof data !== "object") return FORM_ID;
    return data.formId || data.form_id || FORM_ID;
  }

  function fromTypeform(origin) {
    return !origin || origin.indexOf("typeform.com") !== -1 || origin === window.location.origin;
  }

  function capture(name, id) {
    var key = name + ":" + id;
    if (seen[key]) return;
    seen[key] = true;
    if (typeof posthog === "undefined") return;
    var props = { form_id: id };
    var campaign = window.alidaFirstTouchCampaign || {};
    Object.keys(campaign).forEach(function (prop) {
      props[prop] = campaign[prop];
    });
    posthog.capture(name, props);
  }

  window.addEventListener("message", function (e) {
    if (!fromTypeform(e.origin)) return;
    var type = eventType(e.data);
    if (type === "form-ready") capture("typeform_opened", formId(e.data));
    if (type === "form-submit") capture("typeform_submitted", formId(e.data));
  });
})();
