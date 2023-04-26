const socket = io();
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const pushupCountElement = document.getElementById("pushupCount");

navigator.mediaDevices
  .getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
    video.addEventListener("loadeddata", estimatePoses);
  })
  .catch((err) => {
    console.error("Error accessing camera:", err);
  });

socket.on("pushupCount", (count) => {
  pushupCountElement.textContent = count;
});

async function estimatePoses() {
  const net = await posenet.load();
  const poseThreshold = 0.1;

  setInterval(async () => {
    const poses = await net.estimatePoses(video, {
      flipHorizontal: false,
      decodingMethod: "single-person",
    });

    drawPoses(poses);

    if (poses.length > 0 && isPushup(poses[0], poseThreshold)) {
      socket.emit("pose", poses[0]);
    }
  }, 100);
}

function drawPoses(poses) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(video, 0, 0, video.width, video.height);

  poses.forEach((pose) => {
    pose.keypoints.forEach((keypoint) => {
      if (keypoint.score > 0.2) {
        ctx.beginPath();
        ctx.arc(keypoint.position.x, keypoint.position.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = "red";
        ctx.fill();
      }
    });
  });
}

function isPushup(pose, threshold) {
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
