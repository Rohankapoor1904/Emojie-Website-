// ClickSpark effect for any website (vanilla JS, global, anywhere on page)
(function() {
  function createClickSpark(options = {}) {
    const {
      sparkColor = "#fff",
      sparkSize = 10,
      sparkRadius = 15,
      sparkCount = 8,
      duration = 400,
      easing = "ease-out",
      extraScale = 1.0,
      target = document.body
    } = options;

    // Easing functions
    function easeFunc(t) {
      switch (easing) {
        case "linear": return t;
        case "ease-in": return t * t;
        case "ease-in-out": return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        default: return t * (2 - t);
      }
    }

    // Create a full-page canvas overlay
    const canvas = document.createElement("canvas");
    canvas.style.position = "fixed";
    canvas.style.top = 0;
    canvas.style.left = 0;
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = 9999;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);

    // Resize canvas on window resize
    window.addEventListener("resize", () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });

    const ctx = canvas.getContext("2d");
    let sparks = [];

    function draw(now) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      sparks = sparks.filter(spark => {
        const elapsed = now - spark.startTime;
        if (elapsed >= duration) return false;
        const progress = elapsed / duration;
        const eased = easeFunc(progress);
        const distance = eased * sparkRadius * extraScale;
        const lineLength = sparkSize * (1 - eased);

        const x1 = spark.x + distance * Math.cos(spark.angle);
        const y1 = spark.y + distance * Math.sin(spark.angle);
        const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
        const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

        ctx.strokeStyle = sparkColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        return true;
      });
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);

    // Click handler
    function handleClick(e) {
      // Only fire for left click
      if (e.button !== 0) return;
      const x = e.clientX;
      const y = e.clientY;
      const now = performance.now();
      for (let i = 0; i < sparkCount; i++) {
        sparks.push({
          x, y,
          angle: (2 * Math.PI * i) / sparkCount,
          startTime: now
        });
      }
    }

    // Attach to target (document.body for anywhere)
    target.addEventListener("click", handleClick);

    // Optional: return a cleanup function
    return () => {
      target.removeEventListener("click", handleClick);
      document.body.removeChild(canvas);
    };
  }

  // Expose globally
  window.createClickSpark = createClickSpark;
})(); 