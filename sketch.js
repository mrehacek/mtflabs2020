//p5.disableFriendlyErrors = true;

const circleGenerators = []
let time = 0;

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  time = millis();

  circleGenerators.push(new CircleGenerator(width / 3, height / 2));
  circleGenerators.push(new CircleGenerator((width / 3)*2, height / 2));

  sliderNoiseMax = createSlider(0, 10, 5, 0.1);
  sliderPhase = createSlider(0, 0.01, 0.005, 0.001);
  sliderNoiseZoff = createSlider(0, 0.01, 0.005, 0.001);
  sliderMaxCircles = createSlider(0, 500, 20, 1);
  sliderCircleGrowth = createSlider(-10, 10, 1, 0.1);
}

function draw() {
  background(40);

  push();
  textSize(10);
  fill(255);
  text(circleGenerators[0].getCircles().length, 20, 30);
  text(circleGenerators[1].getCircles().length, 80, 30);
  text("fps: " + frameRate(), 20, 70);
  pop();
  
  stroke(255);
  noFill();
  for (let i = 0; i < circleGenerators.length; i++) {
    const generator = circleGenerators[i];
    generator.update(sliderCircleGrowth.value());

    // collide
    for (let j = i + 1; j < circleGenerators.length; j++) {
      const generator2 = circleGenerators[j];

      for (const c of generator.getCircles()) {
        for (const c2 of generator2.getCircles()) {
          const hit = collideCircleCircle(c.centerX, c.centerY, c.rMax + 200, c2.centerX, c2.centerY, c2.rMax + 200);
          if (hit) {
            generator.handleCircleCollision(c);
            generator2.handleCircleCollision(c2);
          }
        }
      }
    }

    generator.draw();
  }

  if (millis() > time + random(700,1000))
  {
    for (let c of circleGenerators) {
      if (sliderMaxCircles.value() > c.getCircles().length) {
        c.generateNow();
      }
    }
    time = millis();

    // todo destroy circles when out of viewer space
  }

}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
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
    this.circles = this.circles.filter(c => c.color.levels[3] > 0.01);
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
    circle.setAlpha(circle.color.levels[3] - 5);
  }
}

class Circle {
  constructor(centerX, centerY) {
    this.centerX = centerX;
    this.centerY = centerY;
    
    this.rMin = 0;
    this.rMax = 100;

    this.phase = 0.01;
    this.noiseZoff = 0.1;
    this.noiseMax = 4;

    this.points = [];

    this.color = color(255, 255, 255);
  }

  // todo accept last render millis
  update(growthRatio) {
    this.regeneratePoints();

    this.noiseZoff += sliderNoiseZoff.value();
    this.phase += sliderPhase.value();
    this.noiseMax = sliderNoiseMax.value();

    this.rMin += growthRatio;
    this.rMax += growthRatio;
  }

  draw() {
    push();
    strokeWeight(2);
    stroke(this.color);
    beginShape();
    for (const p of this.points) {
      vertex(p[0], p[1]);
    }
    endShape(CLOSE);
    pop();
  }

  regeneratePoints() {
    this.points = []
    for (let a = 0; a < TWO_PI; a += 0.1) {
      let xoff = map(cos(a+this.phase), -1, 1, 0, this.noiseMax);
      let yoff = map(sin(a+this.phase), -1, 1, 0, this.noiseMax);
      let r = map(noise(xoff, yoff, this.noiseZoff), 0, 1, this.rMin, this.rMax);
      let x = r * cos(a);
      let y = r * sin(a);

      this.points.push([x + this.centerX, y + this.centerY]);
    }
  }

  setAlpha(alpha) {
    this.color.setAlpha(alpha);
  }

  getPoints() {
    return this.points;
  }
}
