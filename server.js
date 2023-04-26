const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

let pushupCounter = 0;
let pushupInProgress = false;

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("pose", (data) => {
    if (isPushup(data)) {
      if (!pushupInProgress) {
        pushupInProgress = true;
        pushupCounter++;
        console.log(`Pushup count: ${pushupCounter}`);
        socket.emit("pushupCount", pushupCounter);
      }
    } else {
      pushupInProgress = false;
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

function isPushup(pose) {
  const leftWristY = pose.keypoints.find((kp) => kp.part === "leftWrist")
    .position.y;
  const rightWristY = pose.keypoints.find((kp) => kp.part === "rightWrist")
    .position.y;
  const leftElbowY = pose.keypoints.find((kp) => kp.part === "leftElbow")
    .position.y;
  const rightElbowY = pose.keypoints.find((kp) => kp.part === "rightElbow")
    .position.y;
  const leftShoulderY = pose.keypoints.find((kp) => kp.part === "leftShoulder")
    .position.y;
  const rightShoulderY = pose.keypoints.find(
    (kp) => kp.part === "rightShoulder"
  ).position.y;
  const leftHipY = pose.keypoints.find((kp) => kp.part === "leftHip").position
    .y;
  const rightHipY = pose.keypoints.find((kp) => kp.part === "rightHip").position
    .y;

  const wristsAboveElbows =
    leftWristY > leftElbowY && rightWristY > rightElbowY;
  const elbowsAboveShoulders =
    leftElbowY > leftShoulderY && rightElbowY > rightShoulderY;
  const shouldersAboveHips =
    leftShoulderY > leftHipY && rightShoulderY > rightHipY;

  return wristsAboveElbows && elbowsAboveShoulders && shouldersAboveHips;
}

http.listen(3000, () => {
  console.log("listening on *:3000");
});
