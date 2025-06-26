const canvas = document.getElementById("drawing-board");
const toolbar = document.getElementById("toolbar");
const ctx = canvas.getContext("2d");
const bg = document.getElementById("bald-bg");
const container = document.getElementById("bald-container");

let isPainting = false;
let canPaint = true;
let startX;
let startY;
let currentColor = "#000000"; // Default color is black
let currentTool = "brush"; // Default tool is brush
let img = new Image();
let undoStack = []; // Stack to store canvas states for undo functionality

let currentImage = "images/bald.jpg";
img.src = currentImage;
img.onload = () => {
  resizeCanvas();
  // Save initial state after canvas is set up
  setTimeout(() => {
    saveCanvasState();
  }, 100);
  window.addEventListener("resize", resizeCanvas);
};

const resizeCanvas = () => {
  const aspectRatio = img.width / img.height;
  let width;
  let height;
  if (window.innerWidth / window.innerHeight > aspectRatio) {
    height = window.innerHeight - toolbar.offsetHeight;
    width = height * aspectRatio;
  } else {
    width = window.innerWidth;
    height = width / aspectRatio;
  }

  container.style.width = width + "px";
  container.style.height = height + "px";
  bg.style.width = width + "px";
  bg.style.height = height + "px";

  // Save current canvas state
  let tempImg = new Image();
  tempImg.src = canvas.toDataURL();
  tempImg.onload = () => {
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(tempImg, 0, 0, canvas.width, canvas.height);
    let imageToDraw = new Image();
    imageToDraw.onload = () => {
      ctx.drawImage(imageToDraw, 0, 0, canvas.width, canvas.height);
    };
  };

  container.style.marginTop = `${toolbar.offsetHeight}px`;
};

const shareCanvas = async () => {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      const file = new File([blob], "drawing.png", { type: "image/png" });
      const filesArray = [file];

      if (navigator.share) {
        navigator
          .share({
            title: "Bald Ben",
            text: "Check out this drawing of Bald Ben I made on https://benjaminperla.hair/ !",
            files: filesArray,
          })
          .then(resolve)
          .catch((error) => {
            console.error("Error sharing", error);
            reject(error);
          });
      } else {
        downloadCanvas();
        resolve();
      }
    });
  });
};

const clearCanvas = () => {
  saveCanvasState(); // Save state before clearing
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
};

// Save current canvas state to undo stack
const saveCanvasState = () => {
  undoStack.push(canvas.toDataURL());
  // Limit undo stack to 20 states to prevent memory issues
  if (undoStack.length > 20) {
    undoStack.shift();
  }
};

// Undo last action
const undoLastAction = () => {
  if (undoStack.length > 0) {
    const previousState = undoStack.pop();
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = previousState;
  }
};

// Flood fill algorithm
const floodFill = (x, y, targetColor, fillColor) => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const stack = [{ x: Math.floor(x), y: Math.floor(y) }];

  if (targetColor === fillColor) return;

  while (stack.length > 0) {
    const { x: currentX, y: currentY } = stack.pop();

    if (
      currentX < 0 ||
      currentX >= canvas.width ||
      currentY < 0 ||
      currentY >= canvas.height
    ) {
      continue;
    }

    const index = (currentY * canvas.width + currentX) * 4;
    const currentColor = [
      data[index],
      data[index + 1],
      data[index + 2],
      data[index + 3],
    ];

    if (
      currentColor[0] !== targetColor[0] ||
      currentColor[1] !== targetColor[1] ||
      currentColor[2] !== targetColor[2] ||
      currentColor[3] !== targetColor[3]
    ) {
      continue;
    }

    data[index] = fillColor[0];
    data[index + 1] = fillColor[1];
    data[index + 2] = fillColor[2];
    data[index + 3] = fillColor[3];

    stack.push({ x: currentX + 1, y: currentY });
    stack.push({ x: currentX - 1, y: currentY });
    stack.push({ x: currentX, y: currentY + 1 });
    stack.push({ x: currentX, y: currentY - 1 });
  }

  ctx.putImageData(imageData, 0, 0);
};

// Convert hex color to RGB array
const hexToRgb = (hex) => {
  // Handle named colors by creating a temporary element
  if (!hex.startsWith("#")) {
    const tempDiv = document.createElement("div");
    tempDiv.style.color = hex;
    document.body.appendChild(tempDiv);
    const computed = window.getComputedStyle(tempDiv).color;
    document.body.removeChild(tempDiv);

    const match = computed.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3]), 255];
    }
  }

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
        255,
      ]
    : null;
};

// Get pixel color at coordinates
const getPixelColor = (x, y) => {
  const imageData = ctx.getImageData(x, y, 1, 1);
  return [
    imageData.data[0],
    imageData.data[1],
    imageData.data[2],
    imageData.data[3],
  ];
};

toolbar.addEventListener("click", async (e) => {
  if (e.target.id === "clear") {
    clearCanvas();
    canPaint = true;
  } else if (e.target.id === "undo") {
    undoLastAction();
  } else if (e.target.id === "brush") {
    currentTool = "brush";
    // Remove active class from all tool buttons
    document
      .querySelectorAll(".tool-button")
      .forEach((btn) => btn.classList.remove("active"));
    e.target.classList.add("active");
  } else if (e.target.id === "fill") {
    currentTool = "fill";
    // Remove active class from all tool buttons
    document
      .querySelectorAll(".tool-button")
      .forEach((btn) => btn.classList.remove("active"));
    e.target.classList.add("active");
  } else if (e.target.id === "download") {
    var audio = new Audio("audio/wink.wav");
    audio.play();

    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempCtx.drawImage(canvas, 0, 0);

    img.src = "images/smile.jpg";
    currentImage.src = "images/smile.jpg";
    img.onload = async () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.drawImage(tempCanvas, 0, 0);

      await shareCanvas();
      canPaint = false;
    };
  }
});

const startPosition = (e) => {
  if (!canPaint) return;

  const x = (e.clientX || e.touches[0].clientX) - canvas.offsetLeft;
  const y = (e.clientY || e.touches[0].clientY) - canvas.offsetTop;

  if (currentTool === "fill") {
    saveCanvasState(); // Save state before fill
    const targetColor = getPixelColor(x, y);
    const fillColor = hexToRgb(currentColor);
    if (fillColor) {
      floodFill(x, y, targetColor, fillColor);
    }
    return;
  }

  // Brush tool
  saveCanvasState(); // Save state before drawing
  isPainting = true;
  startX = x;
  startY = y;
};

const finishedPosition = () => {
  isPainting = false;
  ctx.stroke();
  ctx.beginPath();
};

const draw = (e) => {
  if (!isPainting || currentTool !== "brush") return;
  if (!canPaint) {
    return;
  }

  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.strokeStyle = currentColor;

  ctx.lineTo(
    (e.clientX || e.touches[0].clientX) - canvas.offsetLeft,
    (e.clientY || e.touches[0].clientY) - canvas.offsetTop
  );
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(
    (e.clientX || e.touches[0].clientX) - canvas.offsetLeft,
    (e.clientY || e.touches[0].clientY) - canvas.offsetTop
  );
};

const downloadCanvas = () => {
  const link = document.createElement("a");
  link.download = "drawing.png";
  link.href = canvas.toDataURL();
  link.click();
};

canvas.addEventListener("mousedown", startPosition);
canvas.addEventListener("mouseup", finishedPosition);
canvas.addEventListener("mousemove", draw);

canvas.addEventListener("touchstart", startPosition);
canvas.addEventListener("touchend", finishedPosition);
canvas.addEventListener("touchmove", draw);

document.querySelectorAll(".color-button").forEach((button) => {
  button.addEventListener("click", (e) => {
    currentColor = e.target.style.backgroundColor;
  });
});

console.log(
  " ██████  ██ ████████ ██   ██ ██    ██ ██████\n██       ██    ██    ██   ██ ██    ██ ██   ██\n██   ███ ██    ██    ███████ ██    ██ ██████\n██    ██ ██    ██    ██   ██ ██    ██ ██   ██\n ██████  ██    ██    ██   ██  ██████  ██████\n"
);
console.log("https://github.com/BigGecko01/benperlahair");
