(function (window) {
  const ChrisApp = window.ChrisApp || (window.ChrisApp = {});

  function createSlider(track, onComplete) {
    const thumb = track.querySelector("[data-slider-thumb]");
    const fill = track.querySelector("[data-slider-fill]");
    const completionRatio = 0.88;
    let pointerId = null;
    let startX = 0;
    let startLeft = 0;
    let isDragging = false;

    function getMaxLeft() {
      return Math.max(track.clientWidth - thumb.clientWidth, 0);
    }

    function update(left) {
      const maxLeft = getMaxLeft();
      const boundedLeft = Math.min(Math.max(left, 0), maxLeft);
      const ratio = maxLeft > 0 ? boundedLeft / maxLeft : 0;
      thumb.style.left = `${boundedLeft}px`;
      fill.style.width = `${ratio * 100}%`;
      return {
        left: boundedLeft,
        ratio
      };
    }

    function reset(animated) {
      track.classList.remove("is-complete");

      if (animated) {
        thumb.classList.add("is-animating");
        fill.classList.add("is-animating");
      }

      update(0);

      if (animated) {
        window.setTimeout(() => {
          thumb.classList.remove("is-animating");
          fill.classList.remove("is-animating");
        }, 260);
      }
    }

    function finish() {
      const maxLeft = getMaxLeft();
      track.classList.add("is-complete");
      update(maxLeft);

      window.setTimeout(() => {
        if (typeof onComplete === "function") {
          onComplete();
        }
      }, 70);
    }

    function handlePointerMove(event) {
      if (!isDragging || event.pointerId !== pointerId) {
        return;
      }

      const deltaX = event.clientX - startX;
      update(startLeft + deltaX);
    }

    function handlePointerEnd(event) {
      if (!isDragging || event.pointerId !== pointerId) {
        return;
      }

      const position = update(parseFloat(thumb.style.left) || 0);
      isDragging = false;
      pointerId = null;
      if (thumb.hasPointerCapture(event.pointerId)) {
        thumb.releasePointerCapture(event.pointerId);
      }

      if (position.ratio >= completionRatio) {
        finish();
      } else {
        reset(true);
      }
    }

    thumb.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      isDragging = true;
      pointerId = event.pointerId;
      startX = event.clientX;
      startLeft = parseFloat(thumb.style.left) || 0;
      thumb.setPointerCapture(pointerId);
      thumb.classList.remove("is-animating");
      fill.classList.remove("is-animating");
    });

    thumb.addEventListener("pointermove", handlePointerMove);
    thumb.addEventListener("pointerup", handlePointerEnd);
    thumb.addEventListener("pointercancel", handlePointerEnd);

    reset(false);

    return {
      reset() {
        reset(true);
      }
    };
  }

  ChrisApp.slider = {
    createSlider
  };
})(window);
