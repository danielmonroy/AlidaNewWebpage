(function () {
  var mq = window.matchMedia("(max-width: 900px)");

  function bind(list, nav, perPage) {
    if (!list || !nav) return;

    var prev = nav.querySelector("[data-carousel-prev]");
    var next = nav.querySelector("[data-carousel-next]");

    function maxScroll() {
      return Math.max(0, list.scrollWidth - list.clientWidth);
    }

    function targets() {
      var points = [];
      var limit = maxScroll();
      for (var i = 0; i < list.children.length; i += perPage) {
        var left = Math.min(list.children[i].offsetLeft, limit);
        if (!points.length || Math.abs(points[points.length - 1] - left) > 8) points.push(left);
      }
      if (!points.length) points.push(0);
      return points;
    }

    function currentPage() {
      var left = list.scrollLeft;
      var points = targets();
      var page = 0;
      var best = Infinity;
      for (var i = 0; i < points.length; i++) {
        var dist = Math.abs(points[i] - left);
        if (dist < best) {
          best = dist;
          page = i;
        }
      }
      return page;
    }

    function update() {
      if (!mq.matches) list.scrollLeft = 0;
    }

    function go(delta) {
      if (!mq.matches) return;
      var points = targets();
      var page = currentPage() + delta;
      page = ((page % points.length) + points.length) % points.length;
      list.scrollTo({ left: points[page], behavior: "smooth" });
    }

    prev.addEventListener("click", function () { go(-1); });
    next.addEventListener("click", function () { go(1); });

    var frame = 0;
    list.addEventListener("scroll", function () {
      if (frame) return;
      frame = requestAnimationFrame(function () {
        update();
        frame = 0;
      });
    }, { passive: true });

    window.addEventListener("resize", update);
    if (mq.addEventListener) mq.addEventListener("change", update);
    update();
  }

  bind(document.querySelector(".lp-demo-points"), document.querySelector(".lp-points-nav"), 1);
  bind(document.querySelector(".lp-quotes"), document.querySelector(".lp-quotes-nav"), 1);
})();
