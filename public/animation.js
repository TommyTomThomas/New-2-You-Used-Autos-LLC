const canvas = document.getElementById('smokeCanvas');
const ctx = canvas.getContext('2d');
let W, H;
function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = document.getElementById('hero').clientHeight;
}
resize();
window.addEventListener('resize', resize);

const car = new Image();
car.src = '/car.png';

const particles = [];
const TEXT = 'New 2 You Used Autos LLC';
const fontSize = 48;
let textPoints = [];

function getTextPoints() {
  const off = document.createElement('canvas');
  const octx = off.getContext('2d');
  off.width = W; off.height = H;
  octx.clearRect(0,0,W,H);
  octx.fillStyle = '#fff';
  octx.font = `bold ${fontSize}px system-ui`;
  const metrics = octx.measureText(TEXT);
  const x = (W - metrics.width) / 2;
  const y = H * 0.35;
  octx.fillText(TEXT, x, y);
  const data = octx.getImageData(0,0,W,H).data;
  const pts = [];
  const step = 6;
  for (let j = 0; j < H; j += step) {
    for (let i = 0; i < W; i += step) {
      const idx = (j*W + i)*4 + 3;
      if (data[idx] > 128) pts.push({x:i, y:j});
    }
  }
  return pts;
}

let carX = -400;
let carY = H*0.55;
let carVX = 3.0;
let driftAngle = 0;

function spawnSmoke(x, y) {
  for (let i=0;i<3;i++) {
    particles.push({
      x, y,
      vx: (Math.random()*-1.5 - 0.5) + (Math.random()*0.4),
      vy: (Math.random()*-0.6 - 0.3),
      life: 160 + Math.random()*60,
      size: 8 + Math.random()*10,
      target: textPoints.length ? textPoints[Math.floor(Math.random()*textPoints.length)] : null
    });
  }
}

function draw() {
  ctx.clearRect(0,0,W,H);

  // Car motion
  carY = H*0.58 + Math.sin(Date.now()/500)*2;
  carX += carVX;
  if (carX > W*0.65) carVX = 1.2;
  driftAngle = Math.min(0.15, driftAngle + 0.0015);

  // smoke spawn behind car
  spawnSmoke(carX + 60, carY + 40);

  // Particles update
  for (let p of particles) {
    if (p.target) {
      const dx = p.target.x - p.x;
      const dy = p.target.y - p.y;
      p.vx += dx * 0.0008;
      p.vy += dy * 0.0008;
      p.vx *= 0.98; p.vy *= 0.98;
    }
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 1;
  }
  // draw particles
  ctx.save();
  for (let p of particles) {
    const alpha = Math.max(0, Math.min(1, p.life/180));
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size*(1-alpha*0.7), 0, Math.PI*2);
    ctx.fillStyle = 'rgba(200,200,200,1)';
    ctx.fill();
  }
  ctx.restore();

  // draw car
  ctx.save();
  ctx.translate(carX, carY);
  ctx.rotate(-driftAngle);
  const w = 260, h = 150;
  ctx.drawImage(car, -w/2, -h/2, w, h);
  ctx.restore();

  // cull
  for (let i=particles.length-1; i>=0; i--) {
    if (particles[i].life <= 0) particles.splice(i,1);
  }

  requestAnimationFrame(draw);
}

car.onload = () => {
  textPoints = getTextPoints();
  draw();
};
