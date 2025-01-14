
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

   // Draw a blue rectangle                                       <- (3)
   ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'; // Set a blue color
   ctx.fillRect(0, 0, canvas.width, canvas.height);
   var v1 = new Vector3([2.25, 2.25, 0]);
   drawVector(ctx, v1, "red");
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

