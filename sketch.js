// this disables debug errors for better speed
//p5.disableFriendlyErrors = true;

const circleGenerators = []
let timer_ms = 0;
let isFullscreen = false;

// manipulate these parameters 
let o_noiseMax, o_phase, o_noiseZoff, o_maxCircles, o_circleGrowth,
  o_collisionDistDiff = 300, // somehow effects how is collision detected, dont know how :D
  o_extraRandomDisplacement = 0, // the circles will be more noisy (use 0-100), use for example with dissonant/aggresive/loud sound
  o_fadeSpeed = 10, // 0-30 how quickly circles fades on collision
  o_collisionAmplifySize = 50
  ;

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight - 30);
  timer_ms = millis();
  
  circleGenerators.push(new CircleGenerator(width / 3, height / 2));
  circleGenerators.push(new CircleGenerator((width / 3)*2, height / 2));
  
  sliderNoiseMax = createSlider(0, 10, 3, 0.1);
  sliderPhase = createSlider(0, 0.01, 0.005, 0.001);
  sliderNoiseZoff = createSlider(0, 0.01, 0.005, 0.001);
  sliderMaxCircles = createSlider(0, 50, 30, 1);
  sliderCircleGrowth = createSlider(-10, 10, 1, 0.1);
  sliders = [sliderNoiseMax, sliderPhase, sliderNoiseZoff, sliderMaxCircles, sliderCircleGrowth]
  
  background(0);
}

function draw() {
  background(0, 0, 0, 30);

  // print fps and circle counts
  if (!isFullscreen) {
    push();
    textSize(10);
    fill(255);
    text(circleGenerators[0].getCircles().length, 10, 20);
    text(circleGenerators[1].getCircles().length, 40, 20);
    text("fps: " + frameRate(), 10, 40);
    text("press space to reset, F to toggle fullscreen", 10, 60);
    pop();
  }
  
  circleGenerators[0].x = mouseX;
  circleGenerators[0].y = mouseY;

  // update visualization parameters from sliders
  o_noiseMax = sliderNoiseMax.value();
  o_phase = sliderPhase.value();
  o_noiseZoff = sliderNoiseZoff.value();
  o_maxCircles = sliderMaxCircles.value();
  o_circleGrowth = sliderCircleGrowth.value();

  // update circle generators
  for (let i = 0; i < circleGenerators.length; i++) {
    const generator = circleGenerators[i];
    generator.update(sliderCircleGrowth.value());

    // collide
    for (let j = i + 1; j < circleGenerators.length; j++) {
      const generator2 = circleGenerators[j];

      for (const c of generator.getCircles()) {
        for (const c2 of generator2.getCircles()) {
          let hit = false;
          
          // todo: maybe just try movement of generators only on X axis with this condition
          //if (c.centerX + c.rMax > c2.centerX - c2.rMax) hit = true;

          // todo: working weird (probably because of how i constructed this loop)
          // todo: try to change the o_collisionDistDiff, add instead of subtract
          hit = collideCircleCircle(c.centerX, c.centerY, c.rMax + o_collisionDistDiff, c2.centerX, c2.centerY, c2.rMax - o_collisionDistDiff);

          if (hit) {
            generator.handleCircleCollision(c);
            generator2.handleCircleCollision(c2);
          }
        }
      }
    }

    generator.draw();
  }

  // generate new circles
  // todo: connect the generation of circles to heart beat
  if (millis() > timer_ms + random(700,1000))
  {
    for (let c of circleGenerators) {
      if (sliderMaxCircles.value() > c.getCircles().length) {
        c.generateNow();
      }
    }
    timer_ms = millis();
  }

}

function windowResized() {
  newHeight = windowHeight;
  if (!isFullscreen) newHeight -= 30; // toolbar on botom
  resizeCanvas(windowWidth, newHeight);
}

function keyPressed() {
  if (key === " ") {
    for (const g of circleGenerators) {
      g.circles = [];
    }
  } else if (key === "f") {
    isFullscreen = !fullscreen();
    fullscreen(isFullscreen);
    sliders.forEach(s => isFullscreen ? s.hide() : s.show());
  }
}

//
// Classes
//

class CircleGenerator {
  constructor(centerX, centerY) {
    this.circles = []
    this.x = centerX;
    this.y = centerY;
  }
  
  update(circleGrowthRatio) {
    for (let c of this.circles) {
      c.update(circleGrowthRatio);
    }

    this.circles = this.circles.filter(c => !c.shouldDispose());
  }

  draw() {
    for (let c of this.circles) {
      c.draw();
    }
  }

  generateNow() {
    this.circles.push(new Circle(this.x, this.y));
  }

  getCircles() {
    return this.circles;
  }

  handleCircleCollision(circle) {
    // create very random collision effect
    // YORO (you only render once)
    //circle.rMin = random(100);
    if (o_collisionAmplifySize != 0) {
      circle.rMax = random(circle.rMax, circle.rMax + o_collisionAmplifySize);
    }

    // fade out the circles
    circle.setAlpha(circle.color.levels[3] - o_fadeSpeed);
  }
}

class Circle {
  constructor(centerX, centerY) {
    this.centerX = centerX;
    this.centerY = centerY;
    
    // the circle will be drawn with random displacements, in area between circles with radius rMin and rMax
    this.rMin = 0;
    this.rMax = 100;

    this.phase = 0.01;
    this.noiseZoff = 0.1;
    this.noiseMax = 4;

    this.points = [];

    this.color = color(255, 255, 255);
  }

  update(growthRatio) {
    this.regeneratePoints();

    this.noiseZoff += o_noiseZoff;
    this.phase += o_phase;
    //this.noiseMax += o_noiseMax;

    this.rMin += growthRatio;
    this.rMax += growthRatio;
  }

  draw() {
    push();
    // todo: play with these parameters, mainly color, maybe use hsb
    blendMode(ADD);
    strokeWeight(2); // map(circleGenerators[0].getCircles().length + circleGenerators[1].getCircles().length, 1, 20, 1, 50)
    // todo: map the randomness to something
    stroke(color(40, 10, random(150, 255), 255));
    noFill();
    //fill(10, 0, 255, 20);
    beginShape();
    for (const p of this.points) {
      vertex(p[0], p[1]);
    }
    endShape(CLOSE);
    pop();
  }

  regeneratePoints() {
    this.points = []
    noiseSeed(random()); // so every generator creates other circles

    // generate a circle of points, which are then displaced using noise, randomness, or some other data like biosensors
    for (let a = 0; a < TWO_PI; a += 0.35) { // todo: change a+= if you have performance issues (0.1 min that seems to perform well, 1 is doing crappy circles)
      const xoff = map(cos(a+this.phase), -1, 1, 0, this.noiseMax);
      const yoff = map(sin(a+this.phase), -1, 1, 0, this.noiseMax);

      // todo: instead of perlin noise, try to connect to EMG (something that is also noisy but somewhat continuous)
      const r = map(noise(abs(this.centerX) + xoff, abs(this.centerY) + yoff, this.noiseZoff), 0, 1, this.rMin, this.rMax + random(o_extraRandomDisplacement)); // todo map this to sth / disturbing sound
      const x = r * cos(a);
      const y = r * sin(a);

      this.points.push([x + this.centerX, y + this.centerY]);
    }
  }

  setAlpha(alpha) {
    this.color.setAlpha(alpha);
  }

  getPoints() {
    return this.points;
  }

  /**
   * Call on every update from parent, to check if the circle became invisible so we can destroy it
   */
  shouldDispose() {
    return (this.color.levels[3] < 5) || (this.rMin > width / 2);
  }
}
