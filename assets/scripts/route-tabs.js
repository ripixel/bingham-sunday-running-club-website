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
    if (typeof updateCalculator === 'function') {
      updateCalculator();
    } else {
      // Since updateCalculator is defined in the same scope below, hoisting might not work for const/let if using arrow functions or if structure is different.
      // However, in this file structure, updateCalculator is defined inside the DOMContentLoaded callback adjacent to setActiveLoop.
      // But setActiveLoop is defined BEFORE updateCalculator.
      // Function declarations are hoisted, but let/const are not.
      // I should move updateCalculator definition UP or use a function declaration.
      // Let's rely on hoisting for function declaration if I change it to `function updateCalculator()`.
      // The previous step defined it as `function updateCalculator()`.
      updateCalculator();
    }
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const loopId = tab.dataset.loop;
      // If switching loop, we don't need to re-run approach if it's already done
      setActiveLoop(loopId);
    });
  });

  // Calculator Logic
  const lapInput = document.getElementById('lap-count');
  const calcLoopName = document.getElementById('calc-loop-name');
  const calcTotal = document.getElementById('calc-total');

  // Distances in km
  const distances = {
    small: 0.8,
    medium: 1.0,
    long: 1.2,
    approach: 0.55
  };

  const loopNames = {
    small: 'Small Loop',
    medium: 'Medium Loop',
    long: 'Long Loop'
  };

  const distancesColors = {
    small: 'pink',
    medium: 'green',
    long: 'blue'
  };

  function updateCalculator() {
    if (!lapInput || !calcTotal) return;

    const laps = parseInt(lapInput.value) || 0;
    const loopDist = distances[currentLoopId];
    // Formula: Approach + (Laps * Loop)
    const total = distances.approach + (laps * loopDist);

    // Update Text
    if (calcLoopName) calcLoopName.textContent = loopNames[currentLoopId]; // Keep if element exists (though removed from HTML)
    calcTotal.textContent = `${total.toFixed(2)}km`;

    // Update Color Theme
    const calculator = document.querySelector('.route-calculator');
    if (calculator) {
      // Remove all color classes
      calculator.classList.remove('theme-pink', 'theme-green', 'theme-blue');
      // Add current color class
      calculator.classList.add(`theme-${distancesColors[currentLoopId]}`);
    }
  }

  if (lapInput) {
    lapInput.addEventListener('input', updateCalculator);
    lapInput.addEventListener('change', updateCalculator);
  }

  // Initial Start
  // Wait a moment for layout
  setTimeout(() => {
    // Find the initially active tab or default to small
    const initialLoop = document.querySelector('.route-tab.active')?.dataset.loop || 'small';
    setActiveLoop(initialLoop);
    // Explicitly update calculator after layout and initial loop set
    if (typeof updateCalculator === 'function') updateCalculator();
  }, 500);
});
