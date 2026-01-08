document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.route-tab');
  const loopInfos = document.querySelectorAll('.loop-info');
  const loopPaths = document.querySelectorAll('.path-loop');
  const runner = document.getElementById('route-runner');

  // State to track animation handler for cleanup
  let currentAnimationHandler = null;
  let currentLoopId = 'small'; // Default

  function getPathIdForLoop(loopId) {
    return `path-loop-${loopId}`;
  }

  function startAnimation(loopId) {
    // Cleanup previous listener if any to prevent stacked callbacks
    if (currentAnimationHandler) {
      runner.removeEventListener('animationend', currentAnimationHandler);
      currentAnimationHandler = null;
    }

    // Reset classes and force reflow
    runner.classList.remove('running-approach', 'running-loop');
    void runner.offsetWidth;

    // ALways start with Approach
    runner.style.offsetPath = `path('${document.getElementById('path-approach').getAttribute('d')}')`;
    runner.classList.add('running-approach');

    // Define handler for when approach finishes
    currentAnimationHandler = () => {
      startLoopAnimation(loopId);
      currentAnimationHandler = null;
    };

    runner.addEventListener('animationend', currentAnimationHandler, { once: true });
  }

  function startLoopAnimation(loopId) {
    runner.classList.remove('running-approach');
    runner.classList.remove('running-loop');
    void runner.offsetWidth; // Force reflow

    const loopPath = document.getElementById(getPathIdForLoop(loopId));
    if (loopPath) {
      runner.style.offsetPath = `path('${loopPath.getAttribute('d')}')`;
      runner.classList.add('running-loop');
    }
  }

  function setActiveLoop(loopId) {
    currentLoopId = loopId;

    // 1. Update Tabs
    tabs.forEach(tab => {
      const isActive = tab.dataset.loop === loopId;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive);
    });

    // 2. Update Info Text
    loopInfos.forEach(info => {
      const isActive = info.classList.contains(`loop-info-${loopId}`);
      info.classList.toggle('active', isActive);
    });

    // 3. Update SVG Paths (Visuals)
    loopPaths.forEach(path => {
      const isActive = path.id === getPathIdForLoop(loopId);
      path.classList.toggle('active', isActive);
    });

    // 4. Update Runner
    // If we switch tabs, we generally want to jump straight to the loop if we've already seen the approach
    // But if it's the first load, we do approach first.
    // The startAnimation logic handles this check.
    startAnimation(loopId);
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const loopId = tab.dataset.loop;
      // If switching loop, we don't need to re-run approach if it's already done
      setActiveLoop(loopId);
    });
  });

  // Initial Start
  // Wait a moment for layout
  setTimeout(() => {
    // Find the initially active tab or default to small
    const initialLoop = document.querySelector('.route-tab.active')?.dataset.loop || 'small';
    setActiveLoop(initialLoop);
  }, 500);
});
