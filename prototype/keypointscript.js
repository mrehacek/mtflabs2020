$ = document.getElementById.bind(document);

var ws = new WebSocket("ws://localhost:9001/");

ws.onopen = function() {
  $("connection").innerHTML = "connected";
};

/* when a message is received from Pd */
ws.onmessage = function(message) {
  // console.log("message", message, message.data);
  $("receiver").innerHTML += message.data + "\n";
  $("receiver").setAttribute("rows", $("receiver").innerHTML.split("\n").length - 1);
};

ws.onclose = function() {
  $("connection").innerHTML = "not connected";
};

/* when enter is pressed send the message to Pd */
$("sender").onkeydown = function(ev) {
  if (ev.keyCode == 13) {
    console.log($("sender").value);
    ws.send($("sender").value);
    $("sender").value = "";
  }
}
/*
posenet.load().then(function(net) {
  const pose = net.estimateSinglePose(imageElement, {
    flipHorizontal: true
  });
  return pose;
}).then(function(pose){
  console.log(pose);
});*/
let video;
let poseNet;
let poses = [];

function setup() {
let cnv = createCanvas(640, 480);
// positions canvas 50px to the right and 100px
// below upper left corner of the window
cnv.position(200, 90);
frameRate(15);
video = createCapture(VIDEO);
video.size(width, height);

// Create a new poseNet method with a single detection
poseNet = ml5.poseNet(video, modelReady);
// This sets up an event that fills the global variable "poses"
// with an array every time new poses are detected
poseNet.on('pose', function(results) {
poses = results;
});
// Hide the video element, and just show the canvas
video.hide();
setup();
}

function modelReady() {
//select('#status').html('Model Loaded');
}

function draw() {

image(video, 0, 0, width, height);
// We can call both functions to draw all keypoints and the skeletons
drawKeypoints();
drawSkeleton();
drawSketch();
}


// A function to draw ellipses over the detected keypoints
function drawKeypoints()  {

// Loop through all the poses detected
for (let i = 0; i < poses.length; i++) {
// For each pose detected, loop through all the keypoints
let pose = poses[i].pose;
for (let j = 0; j < pose.keypoints.length; j++) {
  // A keypoint is an object describing a body part (like rightArm or leftShoulder)
  let keypoint = pose.keypoints[j];
  // Only draw an ellipse is the pose probability is bigger than 0.2
  if(keypoint.part == "nose"){

  if (keypoint.score > 0.2) {
    fill(255, 0, 0);
    noStroke();
    ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
  }
}
}
}

}

// A function to draw the skeletons
function drawSkeleton() {

var esk1;
var esk2;

if (poses.length != 0) {
if (esk1 === undefined) {
  esk1 = "";
}
if (esk2 === undefined) {
  esk2 = "esqueleto 1 " + -1 + " " + -1;
}
esk1 = "esqueleto 0 " + poses[0].pose.keypoints[0].position.x, poses[0].pose.keypoints[0].position.y;
if (poses[1] != undefined) {
  esk2 = "esqueleto 1 " + poses[1].pose.keypoints[0].position.x, poses[0].pose.keypoints[0].position.y;
}
}
console.log(esk1);
console.log(esk2);
//console.log(poses[1].pose)

var _e = JSON.stringify(poses);
//console.log(_e);
//console.log(_e);
if (ws.readyState === WebSocket.OPEN) {
ws.send(esk1);
ws.send(esk2);
}
/*
// Loop through all the skeletons detected
for (let i = 0; i < poses.length; i++) {
let skeleton = poses[i].skeleton;
// For every skeleton, loop through all body connections
for (let j = 0; j < skeleton.length; j++) {
  let partA = skeleton[j][0];
  let partB = skeleton[j][1];
  stroke(255, 0, 0);
  line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
}
}*/
}

function drawSketch() {
    console.log(keypoints);
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