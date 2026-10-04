// Shared, bounded dye advection for the pink lemonade pour. No idle animation loop.
(() => {
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const smooth = (low, high, value) => {
    const t = clamp((value - low) / (high - low), 0, 1);
    return t * t * (3 - 2 * t);
  };
  class DyeField {
    constructor(width, height, previous) {
      this.width = width; this.height = height;
      const count = width * height;
      for (const key of ['u', 'v', 'dye', 'nextU', 'nextV', 'nextDye', 'curl', 'pressure', 'nextPressure', 'divergence']) this[key] = new Float32Array(count);
      if (!previous) return;
      // Preserve the mixture if the viewport rotates or resizes during the pour.
      for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
        const i = y * width + x, ox = x / width * previous.width, oy = y / height * previous.height;
        this.dye[i] = previous.sample(previous.dye, ox, oy);
        this.u[i] = previous.sample(previous.u, ox, oy) * width / previous.width;
        this.v[i] = previous.sample(previous.v, ox, oy) * height / previous.height;
      }
    }
    sample(data, x, y) {
      x = clamp(x, .5, this.width - 1.5); y = clamp(y, .5, this.height - 1.5);
      const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, i = iy * this.width + ix;
      return (data[i] * (1 - fx) + data[i + 1] * fx) * (1 - fy)
        + (data[i + this.width] * (1 - fx) + data[i + this.width + 1] * fx) * fy;
    }
    advect(destination, source, dt, retention) {
      const w = this.width, h = this.height;
      destination.fill(0);
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        destination[i] = this.sample(source, x - this.u[i] * dt, y - this.v[i] * dt) * retention;
      }
    }
    project() {
      const w = this.width, h = this.height;
      this.pressure.fill(0); this.nextPressure.fill(0);
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        this.divergence[i] = -.5 * (this.u[i + 1] - this.u[i - 1] + this.v[i + w] - this.v[i - w]);
      }
      for (let pass = 0; pass < 12; pass++) {
        const p = this.pressure, next = this.nextPressure;
        for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
          const i = y * w + x;
          next[i] = (this.divergence[i] + p[i - 1] + p[i + 1] + p[i - w] + p[i + w]) * .25;
        }
        this.pressure = next; this.nextPressure = p;
      }
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        this.u[i] = clamp(this.u[i] - .5 * (this.pressure[i + 1] - this.pressure[i - 1]), -75, 75);
        this.v[i] = clamp(this.v[i] - .5 * (this.pressure[i + w] - this.pressure[i - w]), -75, 75);
      }
    }
    step(dt, time, sourceX, sourceY) {
      const w = this.width, h = this.height;
      this.advect(this.nextU, this.u, dt, Math.exp(-dt * .32));
      this.advect(this.nextV, this.v, dt, Math.exp(-dt * .32));
      [this.u, this.nextU] = [this.nextU, this.u];
      [this.v, this.nextV] = [this.nextV, this.v];
      const feed = smooth(.5, .85, time) * (1 - smooth(2.7, 3.45, time));
      const jetX = sourceX + Math.sin(time * 6.1) * .7;
      const jetY = clamp(sourceY + 1.7, 2, h - 4);
      // Dense syrup sinks; neighboring liquid is pulled back up by the pressure solve.
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        this.v[i] += Math.min(3, this.dye[i]) * dt * 8;
      }
      if (feed > 0) {
        for (let y = Math.max(1, Math.floor(jetY - 3)); y < Math.min(h - 1, jetY + 7); y++) {
          for (let x = Math.max(1, Math.floor(jetX - 5)); x < Math.min(w - 1, jetX + 5); x++) {
            const i = y * w + x, dx = (x - jetX) / 1.65, dy = (y - jetY) / 2.7;
            const weight = Math.exp(-(dx * dx + dy * dy) * .7) * feed;
            this.v[i] += weight * h * dt * 2.8;
            this.u[i] += weight * Math.sin(time * 5.8) * dt * 16;
            this.dye[i] = Math.min(4.5, this.dye[i] + weight * dt * 12);
          }
        }
      }
      // Small counter-rotating eddies shed from the entering jet, then drift away.
      for (let side = -1; side <= 1; side += 2) {
        const age = Math.max(0, time - .65), radius = 3.5 + Math.min(age, 4) * 2;
        const cx = sourceX + side * (3 + age * 2.4), cy = sourceY + 6 + age * h * .065;
        const strength = side * 15 * smooth(.55, 1.5, time) * (1 - smooth(3.5, 7, time));
        if (!strength) continue;
        for (let y = Math.max(1, Math.floor(cy - radius * 2)); y < Math.min(h - 1, cy + radius * 2); y++) {
          for (let x = Math.max(1, Math.floor(cx - radius * 2)); x < Math.min(w - 1, cx + radius * 2); x++) {
            const dx = (x - cx) / radius, dy = (y - cy) / radius;
            const force = Math.exp(-(dx * dx + dy * dy)) * strength * dt, i = y * w + x;
            this.u[i] -= dy * force; this.v[i] += dx * force;
          }
        }
      }
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        this.curl[i] = .5 * (this.v[i + 1] - this.v[i - 1] - this.u[i + w] + this.u[i - w]);
      }
      // Vorticity confinement keeps the fine curled edges from smearing into a blob.
      for (let y = 2; y < h - 2; y++) for (let x = 2; x < w - 2; x++) {
        const i = y * w + x;
        const dx = Math.abs(this.curl[i + 1]) - Math.abs(this.curl[i - 1]);
        const dy = Math.abs(this.curl[i + w]) - Math.abs(this.curl[i - w]);
        const force = this.curl[i] * dt * 3.2 / (Math.hypot(dx, dy) + .0001);
        this.u[i] += dy * force; this.v[i] -= dx * force;
      }
      this.project();
      this.advect(this.nextDye, this.dye, dt, Math.exp(-dt * .19));
      [this.dye, this.nextDye] = [this.nextDye, this.dye];
      // A tiny diffusion step softens the wisps while retaining concentrated filaments.
      const mix = dt * .38;
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        this.nextDye[i] = this.dye[i] * (1 - mix) + (this.dye[i - 1] + this.dye[i + 1] + this.dye[i - w] + this.dye[i + w]) * mix * .25;
      }
      [this.dye, this.nextDye] = [this.nextDye, this.dye];
    }
  }

  window.createLemonadePinkFluid = layer => {
    let canvas, context, buffer, ink, pixels, field, points;
    let started = 0, last = 0, accumulator = 0, width = 0, height = 0;
    const glass = layer.closest('.lemonade-glass');
    function resize(w, h) {
      width = Math.max(1, Math.round(w)); height = Math.max(1, Math.round(h));
      const resolution = width < 760 ? 144 : 192, ratio = resolution / Math.max(width, height);
      const nx = Math.max(40, Math.round(width * ratio)), ny = Math.max(40, Math.round(height * ratio));
      field = new DyeField(nx, ny, field);
      buffer.width = nx; buffer.height = ny;
      pixels = ink.createImageData(nx, ny);
      // The solver remains small; the browser smoothly resamples only the displayed result.
      canvas.width = width; canvas.height = height;
      context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high';
    }
    function stop() {
      glass.classList.remove('has-pink-fluid');
      if (canvas) canvas.remove();
      canvas = context = buffer = ink = pixels = field = points = null;
      started = last = accumulator = 0;
    }
    function start(wave) {
      stop();
      try {
        canvas = document.createElement('canvas'); buffer = document.createElement('canvas');
        context = canvas.getContext('2d', { alpha: true, desynchronized: true });
        ink = buffer.getContext('2d');
        if (!context || !ink) { stop(); return false; }
        canvas.className = 'pink-fluid'; canvas.setAttribute('aria-hidden', 'true');
        const length = wave.getTotalLength();
        points = Array.from({ length: 97 }, (_, i) => wave.getPointAtLength(length * i / 96));
        const rect = glass.getBoundingClientRect();
        resize(rect.width, rect.height);
        started = performance.now(); last = started;
        layer.prepend(canvas); glass.classList.add('has-pink-fluid');
        return true;
      } catch { stop(); return false; }
    }
    function stream(time, surface) {
      const reach = smooth(0, .57, time), tail = smooth(2.95, 3.55, time);
      if (time > 3.55 || surface < 1) return;
      const x = width * .72, bottom = -30 + (surface + 46) * reach, top = -30 + (surface + 46) * tail;
      if (bottom <= top) return;
      const radius = clamp(width * .0058, 5, 11) * (1 - tail * .58);
      const center = y => x + Math.sin(time * 9 - y * .022) * 1.6 + Math.sin(y * .015 + time * 4) * .8;
      const edge = (y, side) => center(y) + side * radius * (.83 + .13 * Math.sin(y * .026 - time * 11));
      const gradient = context.createLinearGradient(x - radius, 0, x + radius, 0);
      gradient.addColorStop(0, 'rgba(158,26,66,.76)'); gradient.addColorStop(.4, 'rgba(224,57,91,.88)');
      gradient.addColorStop(.61, 'rgba(255,143,159,.87)'); gradient.addColorStop(1, 'rgba(184,27,70,.76)');
      context.beginPath(); context.moveTo(edge(top, -1), top);
      for (let i = 1; i <= 32; i++) { const y = top + (bottom - top) * i / 32; context.lineTo(edge(y, -1), y); }
      for (let i = 32; i >= 0; i--) { const y = top + (bottom - top) * i / 32; context.lineTo(edge(y, 1), y); }
      context.closePath();
      // Feather just the contact zone into the dye; preserve the plume underneath.
      const blendStart = surface - 18, blendEnd = surface + 16;
      const left = x - radius - 4, span = radius * 2 + 8;
      context.save(); context.clip(); context.fillStyle = gradient;
      if (top < blendStart) context.fillRect(left, top, span, Math.max(0, Math.min(bottom, blendStart) - top));
      for (let y = Math.max(top, blendStart); y < bottom; y += 1) {
        const strip = Math.min(1, bottom - y);
        context.globalAlpha = 1 - smooth(blendStart, blendEnd, y + strip * .5);
        context.fillRect(left, y, span, strip);
      }
      context.restore();
    }
    function ripples(time, surface) {
      if (surface < 2) return;
      for (let i = 0; i < 5; i++) {
        const age = time - .53 - i * .43;
        if (age < 0 || age > 2.1) continue;
        const progress = age / 2.1, radius = 8 + 103 * (1 - (1 - progress) ** 2);
        context.beginPath();
        context.ellipse(width * .72, surface + 1 + Math.sin(time * 3) * .5, radius, 2 + radius * .095, 0, 0, Math.PI * 2);
        context.strokeStyle = `rgba(205,60,102,${.28 * Math.sin(Math.PI * progress) * (1 - progress)})`;
        context.lineWidth = 1.2; context.stroke();
      }
    }
    function frame(now, surface, matrix, rect) {
      if (!field || document.hidden) return;
      const time = (now - started) / 1000;
      if (time > 11.2) { stop(); return; }
      // 30 Hz and at most two small steps per frame bound catch-up work after a stall.
      if (now - last < 1000 / 30) return;
      if (Math.abs(rect.width - width) > 1 || Math.abs(rect.height - height) > 1) resize(rect.width, rect.height);
      accumulator = Math.min(accumulator + Math.min((now - last) / 1000, .067), .067);
      last = now;
      const sx = field.width * .72, sy = clamp(surface / height * field.height, 0, field.height - 5);
      while (accumulator >= 1 / 30) {
        field.step(1 / 30, time - accumulator + 1 / 30, sx, sy);
        accumulator -= 1 / 30;
      }
      const dissolve = 1 - smooth(6.8, 11.1, time), data = pixels.data;
      for (let i = 0; i < field.dye.length; i++) {
        const density = Math.max(0, field.dye[i]), concentrated = Math.min(1, density * .58), p = i * 4;
        data[p] = 250 - concentrated * 41; data[p + 1] = 132 - concentrated * 99; data[p + 2] = 175 - concentrated * 76;
        data[p + 3] = Math.round((1 - Math.exp(-density * 1.1)) * 195 * dissolve);
      }
      ink.putImageData(pixels, 0, 0);
      context.clearRect(0, 0, width, height);
      context.save(); context.beginPath();
      // Clip against the actual moving wave, not a horizontal rectangular boundary.
      points.forEach((point, i) => {
        const x = matrix.a * point.x + matrix.c * point.y + matrix.e - rect.left;
        const y = matrix.b * point.x + matrix.d * point.y + matrix.f - rect.top;
        if (i === 0) context.moveTo(x, y); else context.lineTo(x, y);
      });
      const first = points[0], end = points[points.length - 1];
      context.lineTo(matrix.a * end.x + matrix.e - rect.left, height + 2);
      context.lineTo(matrix.a * first.x + matrix.e - rect.left, height + 2);
      context.closePath(); context.clip();
      context.drawImage(buffer, 0, 0, width, height); context.restore();
      stream(time, surface); ripples(time, surface);
    }
    return { start, frame, stop };
  };
})();
