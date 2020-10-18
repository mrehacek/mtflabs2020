// this disables debug errors for better speed
p5.disableFriendlyErrors = true;

const circleGenerators = []
let timerMs = 0;
let isFullscreen = false;

// Initiate the FFT object
let fft;
let peakDetect;
//let audioIn;
let sound;

// manipulate these parameters 
let o_noiseMax, o_phase, o_noiseZoff, o_maxCircles, o_circleGrowth,
  o_collisionDistDiff = 300, // somehow effects how is collision detected, dont know how :D
  o_extraRandomDisplacement = 0, // the circles will be more noisy (use 0-100), use for example with dissonant/aggresive/loud sound
  o_fadeSpeed = 10, // 0-30 how quickly circles fades on collision
  o_collisionAmplifySize = 40
  ;

function preload(){
  sound = loadSound('Broken Together.mp3');
}

function mousePressed() {
  userStartAudio();
  sound.amp(0.2); 
  sound.loop();
}

function setup() {
  fft = new p5.FFT();
  peakDetect = new p5.PeakDetect();
  getAudioContext().suspend();

  //console.log(displayDensity());
  pixelDensity(1.0); // if 4k
  let canvas = createCanvas(windowWidth, windowHeight - 30);
  timerMs = millis();
  
  circleGenerators.push(new CircleGenerator(width / 2, height / 2));
  //circleGenerators.push(new CircleGenerator(width / 3, height / 2));
  //circleGenerators.push(new CircleGenerator((width / 3)*2, height / 2));
  
  sliderNoiseMax = createSlider(0, 10, 3, 0.1);
  sliderPhase = createSlider(0, 0.01, 0.005, 0.001);
  sliderNoiseZoff = createSlider(0, 0.01, 0.005, 0.001);
  sliderMaxCircles = createSlider(0, 200, 100, 1);
  sliderCircleGrowth = createSlider(-10, 10, 1, 0.1);
  sliders = [sliderNoiseMax, sliderPhase, sliderNoiseZoff, sliderMaxCircles, sliderCircleGrowth]
  
  //audioIn = new p5.AudioIn();
  //getAudioContext().resume();
  //audioIn.getSources(gotSources);
  background(0);
}

// function gotSources(deviceList) {
//   console.log("Device list: " + JSON.stringify(deviceList));
//   if (deviceList.length() > 0) {
//     //set the source to the first item in the deviceList array
//     audioIn.setSource(0);
//     audioIn.start();
//     let currentSource = deviceList[audioIn.currentSource];
//     text('set source to: ' + currentSource.deviceId, 5, 20, width);
//   }
// }

function triggerBeat(val) {
  background(255);
}

function draw() {
  let al_bass = 0, al_treble = 0, al_mid = 0, al_all = 0;

  if (sound.isPlaying()) {
    let spectrum = fft.analyze();
    // peakDetect.update(fft);
    // peakDetect.onPeak(triggerBeat);
    // noStroke();
    // fill(255, 0, 255);
    // for (let i = 0; i< spectrum.length; i++){
    //   let x = map(i, 0, spectrum.length, 0, width);
    //   let h = -height + map(spectrum[i], 0, 255, height, 0);
    //   rect(x, height, width / spectrum.length, h )
    // }
    al_bass    = fft.getEnergy( "bass" );
    al_treble  = fft.getEnergy( "treble" );
    al_mid     = fft.getEnergy( "mid" );
    al_all = fft.getEnergy(1, 20000);
  }

  background(0, 0, 0, 30);

  // print fps and circle counts
  if (!isFullscreen) {
    push();
    textSize(10);
    fill(255);
    text(circleGenerators[0].getCircles().length, 10, 20);
    //text(circleGenerators[1].getCircles().length, 40, 20);
    text("fps: " + frameRate(), 10, 40);
    text("press space to reset, F to toggle fullscreen", 10, 60);
    pop();
  }
  
  //circleGenerators[0].x = mouseX;
  //circleGenerators[0].y = mouseY;

  // update visualization parameters from sliders
  o_noiseMax = sliderNoiseMax.value();
  o_phase = sliderPhase.value();
  o_noiseZoff = sliderNoiseZoff.value();
  o_maxCircles = sliderMaxCircles.value();
  o_circleGrowth = sliderCircleGrowth.value();

  // update circle generators
  for (let i = 0; i < circleGenerators.length; i++) {
    const generator = circleGenerators[i];
    //o_noiseMax = map(al_mid, 0, 250, 0.01, 10); 
    o_phase = map(al_bass, 0, 250, 0.0005, 0.05);
    generator.update(map(al_all, 0, 255, 0.05, 50), map(al_bass, 0, 200, 0.001, 0.1));

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

  
  console.log("Levels: all=" + al_all + " bass/all= " + al_bass / al_all + " bass="+ al_bass + " " + al_mid + " " + al_treble);

  if ( al_bass / (al_all ** 2)< 2.5 ) {
    for (let c of circleGenerators) {
      if (sliderMaxCircles.value() > c.getCircles().length) {
        c.generateNow();
      }
    }
  }

  // generate new circles
  // todo: connect the generation of circles to heart beat
  // if (millis() > timerMs + random(700,1000))
  // {
  //   for (let c of circleGenerators) {
  //     if (sliderMaxCircles.value() > c.getCircles().length) {
  //       c.generateNow();
  //     }
  //   }
  //   timerMs = millis();
  // }

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
    sound.isPlaying() ? sound.stop() : sound.play();
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
  
  update(circleGrowthRatio, noiseZ) {
    for (let c of this.circles) {
      c.update(circleGrowthRatio, noiseZ);
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

  update(growthRatio, noiseZ) {
    this.regeneratePoints();

    this.noiseZoff += noiseZ;
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
    for (let a = 0; a < TWO_PI; a += 0.3) { // todo: change a+= if you have performance issues (0.1 min that seems to perform well, 1 is doing crappy circles)
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
