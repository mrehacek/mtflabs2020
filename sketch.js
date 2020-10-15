p5.disableFriendlyErrors = true;

const circles = []
let time = 0;

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  time = millis();

  for (let i = 0; i < 1; i++) {
    circles.push(new Circle(width / 2, height / 2));
  }

  sliderNoiseMax = createSlider(0, 10, 5, 0.1);
  sliderPhase = createSlider(0, 0.01, 0.005, 0.001);
  sliderNoiseZoff = createSlider(0, 0.01, 0.005, 0.001);
  sliderMaxCircles = createSlider(0, 500, 20, 1);
  sliderCircleGrowth = createSlider(-10, 10, 1, 0.1);
}


function draw() {
  background(40);

  textSize(23);
  fill(0, 102, 153);
  text(circles.length, 10, 30);
  text("fps: " + frameRate(), 10, 70);
  
  stroke(255);
  noFill();
  for (let c of circles) {
    c.update(sliderCircleGrowth.value());
    c.draw();
  }

  if (millis() > time + 1000)
  {
    if (sliderMaxCircles.value() > circles.length) {
      circles.push(new Circle(windowWidth / 2, windowHeight / 2));
    }
    time = millis();

    // todo destroy circles when out of viewer space
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

//

class Circle {
  constructor(centerX, centerY) {
    this.centerX = centerX;
    this.centerY = centerY;
    
    this.rMin = 0;
    this.rMax = 40;

    this.phase = 0.01;
    this.noiseZoff = 0.1;
    this.noiseMax = 5;
  }

  // todo millis
  update(growthRatio) {
    // for (let r = 0; r < 360; r += 10) {
    //   let x = 100 * sin(r) + 10;
    //   let y = 100 * cos(r) + 10;
    //   this.points += [x,y];
    // }

    this.noiseZoff += sliderNoiseZoff.value();
    this.phase += sliderPhase.value();
    this.noiseMax = sliderNoiseMax.value();

    this.rMin += growthRatio;
    this.rMax += growthRatio;
  }

  draw() {
    push();
    translate(this.centerX, this.centerY);

    beginShape();
    for (let a = 0; a < TWO_PI; a+=0.1) {
      let xoff = map(cos(a+this.phase), -1, 1, 0, this.noiseMax);
      let yoff = map(sin(a+this.phase), -1, 1, 0, this.noiseMax);
      let r = map(noise(xoff, yoff, this.noiseZoff), 0, 1, this.rMin, this.rMax);
      let x = r * cos(a);
      let y = r * sin(a);
      vertex(x, y);
    }
    endShape(CLOSE);
    
    pop();
  }
}
