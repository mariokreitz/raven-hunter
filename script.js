const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d");

// Set canvas dimensions to match window size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const colisionCanvas = document.getElementById("colisionCanvas");
const collisionCtx = colisionCanvas.getContext("2d", { willReadFrequently: true });

// Set collision canvas dimensions to match window size
colisionCanvas.width = window.innerWidth;
colisionCanvas.height = window.innerHeight;

let score = 0; // Initialize score
let gameOver = false; // Flag to check if game is over
ctx.font = "50px Impact"; // Set font for score display

let ravenInterval = 500; // Time interval for spawning ravens
let timeToNextRaven = 0; // Time tracker for next raven
let lastTime = 0; // Timestamp of last frame

let particles = []; // Array to store particle effects
let ravens = []; // Array to store ravens
let explosions = []; // Array to store explosions

class Sprite {
  constructor(imageSrc, spriteWidth, spriteHeight, frame = 0, x = 0, y = 0) {
    this.image = new Image(); // Image element for sprite
    this.image.src = imageSrc; // Source of the image
    this.spriteWidth = spriteWidth; // Width of the sprite
    this.spriteHeight = spriteHeight; // Height of the sprite
    this.x = x; // X-coordinate of sprite
    this.y = y; // Y-coordinate of sprite
    this.markedForDeletion = false; // Flag to mark sprite for deletion
    this.frame = frame; // Current frame of the sprite
  }
}

class Enemy extends Sprite {
  constructor(imageSrc, spriteWidth, spriteHeight, frame) {
    super(imageSrc, spriteWidth, spriteHeight, frame);
    this.sizeModifier = Math.random() * 0.6 + 0.4; // Random size modifier
    this.width = this.spriteWidth * this.sizeModifier; // Calculate width with modifier
    this.height = this.spriteHeight * this.sizeModifier; // Calculate height with modifier
    this.x = canvas.width; // Start position on the right
    this.y = Math.random() * (canvas.height - this.height); // Random Y start position
    this.directionX = Math.random() * 5 + 3; // Random horizontal speed
    this.directionY = Math.random() * 5 - 2.5; // Random vertical speed
    this.randomColor = [
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
    ]; // Random color for collision detection
    this.color = `rgb(${this.randomColor[0]}, ${this.randomColor[1]}, ${this.randomColor[2]})`; // Color string
    this.hasTrail = Math.random() > 0.5; // Random flag for trail effect
  }
}

class Raven extends Enemy {
  constructor() {
    super("raven.png", 271, 194, 0);
    this.maxFrame = 4; // Maximum frame for animation
    this.timeSinceFlap = 0; // Time since last flap
    this.flapInterval = Math.random() * 50 + 50; // Random flap interval
  }
  update(deltaTime) {
    if (this.y < 0 || this.y > canvas.height - this.height) this.directionY = this.directionY * -1; // Reverse direction if out of bounds
    this.x -= this.directionX; // Move left
    this.y += this.directionY; // Move vertically

    if (this.x < 0 - this.width) this.markedForDeletion = true; // Mark for deletion if off screen
    this.timeSinceFlap += deltaTime; // Increment time since last flap

    if (this.timeSinceFlap > this.flapInterval) {
      // Handle flapping
      if (this.frame > this.maxFrame) this.frame = 0;
      else this.frame++;

      this.timeSinceFlap = 0;
      if (this.hasTrail) {
        // Create trail particles if applicable
        for (let i = 0; i < 5; i++) {
          particles.push(new Particle(this.x, this.y, this.width, this.color));
        }
      }
    }

    if (this.x < 0 - this.width) gameOver = true; // End game if raven reaches left edge
  }
  draw() {
    collisionCtx.fillStyle = this.color; // Set fill color for collision detection
    collisionCtx.fillRect(this.x, this.y, this.width, this.height); // Draw collision box
    ctx.drawImage(
      this.image,
      this.frame * this.spriteWidth, // Source X position
      0, // Source Y position
      this.spriteWidth, // Source width
      this.spriteHeight, // Source height
      this.x, // Destination X position
      this.y, // Destination Y position
      this.width, // Destination width
      this.height // Destination height
    );
  }
}

class Explosions extends Sprite {
  constructor(x, y, size) {
    super("boom.png", 200, 179, 0, x, y);
    this.size = size; // Size of explosion
    this.frame = 0; // Current frame of explosion
    this.sound = new Audio(); // Sound for explosion
    this.sound.src = "boom.wav"; // Source of explosion sound
    this.sound.volume = 0.1; // Volume of sound
    this.timeSinceLastFrame = 0; // Time since last frame update
    this.frameInterval = 200; // Interval between frames
    this.markedForDeletion = false; // Flag to mark explosion for deletion
  }
  update(deltaTime) {
    if (this.frame === 0) this.sound.play(); // Play sound on first frame
    this.timeSinceLastFrame += deltaTime; // Increment time since last frame
    if (this.timeSinceLastFrame > this.frameInterval) {
      // Handle frame update
      this.frame++;
      this.timeSinceLastFrame = 0;
      if (this.frame > 5) this.markedForDeletion = true; // Mark for deletion if animation complete
    }
  }
  draw() {
    ctx.drawImage(
      this.image,
      this.frame * this.spriteWidth, // Source X position
      0, // Source Y position
      this.spriteWidth, // Source width
      this.spriteHeight, // Source height
      this.x, // Destination X position
      this.y - this.size / 4, // Destination Y position with offset
      this.size, // Destination width
      this.size // Destination height
    );
  }
}

class Particle {
  constructor(x, y, size, color) {
    this.size = size; // Size of particle
    this.x = x + this.size / 2 + Math.random() * 50 - 25; // X position with random offset
    this.y = y + this.size / 3 + Math.random() * 50 - 25; // Y position with random offset
    this.radius = (Math.random() * this.size) / 10; // Initial radius
    this.maxRadius = Math.random() * 20 + 35; // Maximum radius
    this.markedForDeletion = false; // Flag to mark particle for deletion
    this.speedX = Math.random() * 1 + 0.5; // Horizontal speed
    this.color = color; // Color of particle
  }

  update() {
    this.x += this.speedX; // Move particle horizontally
    this.radius += 0.5; // Increment radius
    if (this.radius > this.maxRadius - 5) this.markedForDeletion = true; // Mark for deletion if radius exceeds limit
  }
  draw() {
    ctx.save(); // Save current state
    ctx.globalAlpha = 1 - this.radius / this.maxRadius; // Set transparency based on radius
    ctx.beginPath(); // Start a new path
    ctx.fillStyle = this.color; // Set fill color
    ctx.arc(this.x, this.y, this.radius, Math.PI * 2, false); // Draw circle
    ctx.fill(); // Fill the circle
    ctx.restore(); // Restore previous state
  }
}

function drawScore() {
  ctx.fillStyle = "black"; // Set fill color for shadow
  ctx.fillText("Score: " + score, 50, 75); // Draw shadow text

  ctx.fillStyle = "white"; // Set fill color for text
  ctx.fillText("Score: " + score, 55, 80); // Draw main text
}

function drawGameOver() {
  ctx.textAlign = "center"; // Center align text
  ctx.fillStyle = "black"; // Set fill color for shadow
  ctx.fillText(`GAME OVER, your score is ${score}`, canvas.width / 2, canvas.height / 2); // Draw shadow text
  ctx.fillStyle = "white"; // Set fill color for text
  ctx.fillText(`GAME OVER, your score is ${score}`, canvas.width / 2, canvas.height / 2 + 5); // Draw main text
}

window.addEventListener("click", function (e) {
  const detectedPixelColor = collisionCtx.getImageData(e.x, e.y, 1, 1); // Get pixel data from collision canvas
  const pc = detectedPixelColor.data; // Extract color data
  ravens.forEach((object) => {
    if (object.randomColor[0] === pc[0] && object.randomColor[1] === pc[1] && object.randomColor[2] === pc[2]) {
      // Check if colors match
      object.markedForDeletion = true; // Mark raven for deletion
      score++; // Increment score
      explosions.push(new Explosions(object.x, object.y, object.width)); // Create new explosion
    }
  });
});

function animate(timestamp) {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear main canvas
  collisionCtx.clearRect(0, 0, canvas.width, canvas.height); // Clear collision canvas

  const deltaTime = timestamp - lastTime; // Calculate time difference from last frame

  lastTime = timestamp; // Update last frame time
  timeToNextRaven += deltaTime; // Increment time to next raven

  if (timeToNextRaven > ravenInterval) {
    // Check if it's time to spawn a new raven
    ravens.push(new Raven()); // Add new raven
    timeToNextRaven = 0; // Reset time to next raven
    ravenInterval = Math.max(ravenInterval * 0.99, 100); // Decrease time until next raven
    ravens.forEach((raven) => (raven.directionX *= 1.01)); // Increase speed of all ravens
    ravens.sort((a, b) => a.width - b.width); // Sort ravens by width
  }

  drawScore(); // Draw current score

  [...particles, ...ravens, ...explosions].forEach((object) => object.update(deltaTime)); // Update all game objects
  [...particles, ...ravens, ...explosions].forEach((object) => object.draw()); // Draw all game objects
  ravens = ravens.filter((object) => !object.markedForDeletion); // Remove marked ravens
  explosions = explosions.filter((object) => !object.markedForDeletion); // Remove marked explosions
  particles = particles.filter((object) => !object.markedForDeletion); // Remove marked particles

  if (!gameOver) requestAnimationFrame(animate); // Continue animation if game is not over
  else drawGameOver(); // Draw game over screen if game is over
}

animate(0); // Start the animation
