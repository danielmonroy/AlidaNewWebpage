(function () {
  var PLAY_ICON =
    '<span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></span>';

  var selectedTopic = "";

  function fold(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function haystack(video) {
    var faq = (video.faq || []).map(function (item) {
      return item.q + " " + item.a;
    }).join(" ");
    return fold([video.title, video.summary, video.category, faq].join(" "));
  }

  function accentTitle(title) {
    var parts = String(title).trim().split(" ");
    if (parts.length === 1) {
      return '<span class="text-light">' + escapeHtml(parts[0]) + "</span>";
    }
    var last = parts.pop();
    return escapeHtml(parts.join(" ")) + ' <span class="text-light">' + escapeHtml(last) + "</span>";
  }

  function cardHtml(video) {
    return (
      '<a class="ayuda-card" href="video.html?slug=' + encodeURIComponent(video.slug) + '" data-slug="' + escapeHtml(video.slug) + '">' +
        '<div class="ayuda-card-thumb">' +
          '<img src="https://i.ytimg.com/vi/' + encodeURIComponent(video.youtubeId) + '/hqdefault.jpg" alt="">' +
          '<div class="ayuda-card-play">' + PLAY_ICON + "</div>" +
        "</div>" +
        '<div class="ayuda-card-body">' +
          "<h2>" + escapeHtml(video.title) + "</h2>" +
          "<p>" + escapeHtml(video.summary) + "</p>" +
        "</div>" +
      "</a>"
    );
  }

  function fillGrid(id, videos) {
    var grid = document.getElementById(id);
    if (!grid) return;
    grid.innerHTML = videos.map(cardHtml).join("");
  }

  function videosForTopic(videos, topic) {
    if (!topic) return videos;
    return videos.filter(function (video) { return video.category === topic; });
  }

  function initIndex(videos, topics) {
    var searchInput = document.getElementById("ayudaSearch");
    var browse = document.getElementById("aprendeBrowse");
    var results = document.getElementById("aprendeResults");
    var empty = document.getElementById("ayudaEmpty");
    var chips = document.getElementById("aprendeTopics");

    fillGrid("aprendePopular", videos);
    fillGrid("aprendeSearchGrid", videos);

    if (chips) {
      chips.innerHTML = (topics || []).map(function (topic) {
        return '<button type="button" class="ayuda-topic" data-topic="' + escapeHtml(topic) + '">' + escapeHtml(topic) + "</button>";
      }).join("");

      chips.addEventListener("click", function (event) {
        var button = event.target.closest(".ayuda-topic");
        if (!button) return;
        var topic = button.getAttribute("data-topic");
        selectedTopic = selectedTopic === topic ? "" : topic;
        Array.prototype.forEach.call(chips.querySelectorAll(".ayuda-topic"), function (chip) {
          chip.classList.toggle("is-active", chip.getAttribute("data-topic") === selectedTopic);
        });
        var topicGrid = document.getElementById("aprendeTopicGrid");
        if (selectedTopic) {
          var filtered = videosForTopic(videos, selectedTopic);
          fillGrid("aprendeTopicGrid", filtered);
          if (topicGrid) topicGrid.hidden = filtered.length === 0;
        } else if (topicGrid) {
          topicGrid.hidden = true;
          topicGrid.innerHTML = "";
        }
        if (searchInput) searchInput.value = "";
        browse.hidden = false;
        results.hidden = true;
      });
    }

    if (!searchInput) return;

    searchInput.addEventListener("input", function () {
      var query = fold(searchInput.value.trim());
      if (!query) {
        browse.hidden = false;
        results.hidden = true;
        return;
      }

      browse.hidden = true;
      results.hidden = false;
      var visible = 0;
      Array.prototype.forEach.call(document.querySelectorAll("#aprendeSearchGrid .ayuda-card"), function (card) {
        var video = videos.find(function (item) { return item.slug === card.dataset.slug; });
        var match = haystack(video).indexOf(query) !== -1;
        card.hidden = !match;
        if (match) visible += 1;
      });
      if (empty) empty.classList.toggle("is-visible", visible === 0);
    });
  }

  function renderRelated(current, videos) {
    var root = document.getElementById("ayudaRelated");
    if (!root || !videos || videos.length < 2) return;

    var idx = videos.findIndex(function (item) { return item.slug === current.slug; });
    var next = [];
    for (var i = 1; i < videos.length && next.length < 3; i++) {
      next.push(videos[(idx + i) % videos.length]);
    }

    root.hidden = false;
    root.innerHTML =
      "<h2>Sigue aprendiendo</h2>" +
      '<div class="ayuda-grid">' + next.map(cardHtml).join("") + "</div>";
  }

  function renderArticle(video, videos) {
    var title = document.getElementById("ayudaArticleTitle");
    var summary = document.getElementById("ayudaArticleSummary");
    var player = document.getElementById("ayudaPlayer");
    var faq = document.getElementById("ayudaFaq");
    var meta = document.querySelector('meta[name="description"]');

    document.title = video.title + " | Aprende a usar Alida | Alida Health";
    if (meta) meta.setAttribute("content", video.summary);
    if (title) title.innerHTML = accentTitle(video.title);
    if (summary) summary.textContent = video.summary;
    if (player) {
      player.hidden = false;
      player.innerHTML =
        '<iframe src="https://www.youtube.com/embed/' + encodeURIComponent(video.youtubeId) + '"' +
        ' title="' + escapeHtml(video.title) + '"' +
        ' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"' +
        " allowfullscreen></iframe>";
    }
    if (faq) {
      var items = (video.faq || []).map(function (item) {
        return (
          "<details>" +
            "<summary>" + escapeHtml(item.q) + "</summary>" +
            "<p>" + escapeHtml(item.a) + "</p>" +
          "</details>"
        );
      }).join("");
      faq.innerHTML = items ? "<h2>Dudas frecuentes</h2>" + items : "";
    }
    renderRelated(video, videos);
  }

  window.AlidaAprende = {
    initIndex: initIndex,
    renderArticle: renderArticle
  };
})();
