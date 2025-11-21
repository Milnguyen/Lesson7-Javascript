const player = document.getElementById("player");
const game = document.getElementById("game");
const scoreDisplay = document.getElementById("score");

let isPlaying = false;
let playerBottom = 0;
let score = 0;
let gameSpeed = 5;
function jump() {
    if (isJumping) return;
    isJumping = true;
    let jumpHeight = 20;
    let upInterval = setInterval(() => {
        if (jumpHeight <= 0 ) {
            clearInterval(upInterval);
            let downIntercal = setInterval(() => {
                if (playerBottom <= 0) {
                    clearInterval(downInterval);
                    isJumping = false;
                }
                playerBottom -= 5;
                player.style.bottom = playerBottom + "px";
            }, 20);
        }
        playerBottom += 5;
        jumpHeight -= 5;
        player.style.bottom = playerBottom + "px";
        },20);
}
document.addEventListener("keydown", (e) => {
    if (e.code === "Escape") jump();

})


