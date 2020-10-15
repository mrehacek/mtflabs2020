//p5.disableFriendlyErrors = true;

const circles = []

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  p5bezier.initBezier(canvas);

  for (let i = 0; i < 1; i++) {
    circles.push(new BezierCircle(windowWidth / 2, windowHeight / 2));
  }
}

function draw() {
  background(40);

  textSize(23);
  fill(0, 102, 153);
  text(circles.length, 10, 30);
  text("fps: " + frameRate(), 10, 70);

  for (let c of circles) {
    c.update();
    c.draw();
  }

  for (let i = 0; i < 10; i++) {
    //circles.push(new Circle(random(windowWidth), random(windowHeight), 10));
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

//

class BezierCircle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.points = [[0, 0]]
  }

  // todo millis
  update() {
    for (let r = 0; r < 360; r += 10) {
      let x = 100 * sin(r) + 10;
      let y = 100 * cos(r) + 10;
      this.points += [x,y];
    }

    this.bezier = p5bezier.newBezierObj(this.points, "CLOSE", 7);
  }

  draw() {
    this.bezier.draw();
    p5bezier.newBezier(pa.get(), 'OPEN', 9)
  }
}



//////////////////////////////////////////

let pa // a PointArray object

function setup() {
  let c = createCanvas(windowWidth, windowHeight)
  p5bezier.initBezier(c)
  noFill()

  pa = new PointArray()
  pa.add(100, 100)
  pa.add(400, 600)
  pa.add(500, 400)
  pa.add(600, 600)
  pa.add(900, 100)
}

function draw() {
  background(255)
  stroke(color('#FD5E53'))
  strokeWeight(3)
  // Draw an open Bezier curve with fidelity of 9 (highest)
  p5bezier.newBezier(pa.get(), 'OPEN', 9)
  pa.display()
}

function mouseDragged() {
  pa.update(mouseX, mouseY)
}

class PointArray {
  constructor() {
    this.pointArray = []
  }

  add(pX, pY) {
    this.pointArray.push(new Point(pX, pY))
  }

  display() {
    for (let point of this.pointArray) point.display()
  }

  update(mX, mY) {
    for (let point of this.pointArray) {
      if (dist(mX, mY, point.position[0], point.position[1]) < 60)
        point.update(mX, mY)
    }
  }

  get() {
    // Return an array of array
    // for p5bezier.newBezier function to use
    let positionArray = []
    // point is a Point object
    for (let point of this.pointArray) positionArray.push(point.position)
    return positionArray
  }
}

class Point {
  constructor(x, y) {
    this.position = [x, y]
    this.r = 10
  }

  display() {
    push()
    fill(255)
    stroke(0)
    strokeWeight(2)
    ellipse(this.position[0], this.position[1], 2 * this.r, 2 * this.r)
    fill(0)
    noStroke()
    text(
      '(' + this.position[0] + ', ' + this.position[1] + ')',
      this.position[0] + 10,
      this.position[1] - 10
    )
    pop()
  }

  update(mX, mY) {
    this.position = [mX, mY]
  }
}