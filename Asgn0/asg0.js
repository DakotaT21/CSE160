
// DrawRectangle.js
function main() {
// Retrieve <canvas> element                                  <- (1)
     var canvas = document.getElementById('example');
     if (!canvas) {
       console.log('Failed to retrieve the <canvas> element');
       return;
     }

   // Get the rendering context for 2DCG                          <- (2)
   var ctx = canvas.getContext('2d');

    // Store the canvas and context globally
    window.canvas = canvas;
    window.ctx = ctx;

    // Set canvas background to black
    clearCanvas();
}

function clearCanvas() {
    window.ctx.fillStyle = 'black';
    window.ctx.fillRect(0, 0, window.canvas.width, window.canvas.height);
}

function handleDrawEvent() {
    // Clear canvas
    clearCanvas();

    // Read input values for v1
    var v1x = parseFloat(document.getElementById('v1x').value) || 0;
    var v1y = parseFloat(document.getElementById('v1y').value) || 0;

    // Create vector v1 and draw it
    var v1 = new Vector3([v1x, v1y, 0]);
    drawVector(window.ctx, v1, "red");

    // Read input values for v2
    var v2x = parseFloat(document.getElementById('v2x').value) || 0;
    var v2y = parseFloat(document.getElementById('v2y').value) || 0;

    // Create vector v2 and draw it
    var v2 = new Vector3([v2x, v2y, 0]);
    drawVector(window.ctx, v2, "blue");
}

function drawVector(ctx, v, color) {
    // Scale the vector by 20
    var scaledX = v.elements[0] * 20;
    var scaledY = v.elements[1] * 20;

    // Set the stroke style and width
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    // Draw the vector
    ctx.beginPath();
    ctx.moveTo(200, 200); // Start at the center of the canvas
    ctx.lineTo(200 + scaledX, 200 - scaledY); // Draw to the scaled endpoint
    ctx.stroke(); // Render the line
}

