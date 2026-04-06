(function (window) {
  const ChrisApp = window.ChrisApp || (window.ChrisApp = {});
  const config = ChrisApp.config;

  function createNavigator(options) {
    const screenIds = options.screens.slice();
    let currentIndex = 0;
    let isTransitioning = false;

    function setActive(index) {
      screenIds.forEach((screenId, screenIndex) => {
        const element = document.getElementById(screenId);

        if (!element) {
          return;
        }

        const isActive = screenIndex === index;
        element.classList.toggle("is-active", isActive);
        element.setAttribute("aria-hidden", String(!isActive));
      });

      document.body.dataset.currentScreen = screenIds[index];
    }

    function activate(targetIndex, extra) {
      const currentId = screenIds[currentIndex];
      const nextId = screenIds[targetIndex];
      const optionsMap = extra || {};

      if (targetIndex < 0 || targetIndex >= screenIds.length) {
        return false;
      }

      if (isTransitioning && !optionsMap.force) {
        return false;
      }

      if (nextId === currentId && !optionsMap.force) {
        return true;
      }

      if (!optionsMap.skipBefore && typeof options.beforeChange === "function") {
        const allowTransition = options.beforeChange({
          currentId,
          nextId,
          currentIndex,
          nextIndex: targetIndex
        });

        if (allowTransition === false) {
          return false;
        }
      }

      currentIndex = targetIndex;
      isTransitioning = true;
      setActive(currentIndex);

      if (typeof options.afterChange === "function") {
        options.afterChange({
          currentId,
          nextId,
          currentIndex: targetIndex
        });
      }

      window.setTimeout(() => {
        isTransitioning = false;
      }, config.transitionMs);

      return true;
    }

    return {
      next() {
        if (currentIndex >= screenIds.length - 1) {
          return false;
        }

        return activate(currentIndex + 1);
      },
      previous() {
        if (currentIndex <= 0) {
          return false;
        }

        return activate(currentIndex - 1, {
          skipBefore: true
        });
      },
      goTo(screenId, extra) {
        const targetIndex = screenIds.indexOf(screenId);
        return activate(targetIndex, extra);
      },
      reset() {
        return activate(0, {
          force: true,
          skipBefore: true
        });
      },
      isTransitioning() {
        return isTransitioning;
      },
      getCurrentId() {
        return screenIds[currentIndex];
      },
      getCurrentIndex() {
        return currentIndex;
      },
      setInitial() {
        setActive(currentIndex);
      }
    };
  }

  ChrisApp.navigation = {
    createNavigator
  };
})(window);
