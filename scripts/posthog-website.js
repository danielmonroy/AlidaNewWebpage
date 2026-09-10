/* Website PostHog: $pageview plus explicit events only.
   environment is production only on alida.health / www.
   Experiment keys are registered only when window.alidaExperiment is set
   before this file runs, and always cleared first so a prior landing
   does not tag the homepage. Session replay is on for production landings. */
(function () {
  var TOKEN = "phc_AycxJFviF6SDccscpKHqHQWipCxcqJRhVJU3EoXNssmj";
  var PROD_HOSTS = ["alida.health", "www.alida.health"];
  var EXPERIMENT_KEYS = [
    "landing",
    "experiment_id",
    "experiment_slug",
    "experiment_hypothesis"
  ];
  var isProd = PROD_HOSTS.indexOf(window.location.hostname) !== -1;
  var isLandingPage = window.location.pathname.indexOf("/landing-pages/") === 0;
  var experiment = window.alidaExperiment;

  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug getPageViewId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

  posthog.init(TOKEN, {
    api_host: "https://us.i.posthog.com",
    person_profiles: "identified_only",
    autocapture: false,
    capture_pageview: true,
    capture_pageleave: false,
    capture_dead_clicks: false,
    rageclick: false,
    disable_session_recording: !(isProd && isLandingPage),
    capture_performance: false,
    enable_heatmaps: false
  });

  EXPERIMENT_KEYS.forEach(function (key) {
    posthog.unregister(key);
  });

  posthog.register({
    site: "website",
    environment: isProd ? "production" : "preview"
  });

  if (experiment && experiment.slug) {
    var experimentProps = { landing: experiment.slug, experiment_slug: experiment.slug };
    if (experiment.id) experimentProps.experiment_id = experiment.id;
    if (experiment.hypothesis) experimentProps.experiment_hypothesis = experiment.hypothesis;
    posthog.register(experimentProps);
  }

  function findAppLink(e) {
    return e.target && e.target.closest && e.target.closest('a[href*="app.alidahealth.com"]');
  }

  function appendPosthogIds(link) {
    if (typeof posthog === "undefined" || !posthog.get_distinct_id) return;
    try {
      var url = new URL(link.href);
      var did = posthog.get_distinct_id();
      var sid = posthog.get_session_id && posthog.get_session_id();
      if (did && !url.searchParams.has("_ph_did")) url.searchParams.set("_ph_did", did);
      if (sid && !url.searchParams.has("_ph_sid")) url.searchParams.set("_ph_sid", sid);
      link.href = url.toString();
    } catch (err) {}
  }

  document.addEventListener("pointerdown", function (e) {
    var link = findAppLink(e);
    if (link) appendPosthogIds(link);
  });
  document.addEventListener("click", function (e) {
    var link = findAppLink(e);
    if (link) appendPosthogIds(link);
  });
})();
