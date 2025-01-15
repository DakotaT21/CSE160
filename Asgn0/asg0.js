
// DrawRectangle.js
// Dakota Tompkins
// drtompki@ucsc.edu


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

function handleDrawOperationEvent() {
    // Clear canvas
    clearCanvas();

    // Read input values for v1
    var v1x = parseFloat(document.getElementById('v1x').value) || 0;
    var v1y = parseFloat(document.getElementById('v1y').value) || 0;
    var v1 = new Vector3([v1x, v1y, 0]);

    // Read input values for v2
    var v2x = parseFloat(document.getElementById('v2x').value) || 0;
    var v2y = parseFloat(document.getElementById('v2y').value) || 0;
    var v2 = new Vector3([v2x, v2y, 0]);

    // Draw v1 and v2
    drawVector(window.ctx, v1, "red");
    drawVector(window.ctx, v2, "blue");    

    // Read operation
    var operation = document.getElementById('operation').value;
    var scalar = parseFloat(document.getElementById('scalar').value) || 1;

    // Perform operation
    let result;
    if (operation === "add") {
        result = new Vector3(v1.elements).add(v2);
    } else if (operation === "sub") {
        result = new Vector3(v1.elements).sub(v2);
    } else if (operation === "mul") {
        result = new Vector3(v1.elements).mul(scalar);
        drawVector(window.ctx, new Vector3(v2.elements).mul(scalar), "green");
    } else if (operation === "div") {
        result = new Vector3(v1.elements).div(scalar);
        drawVector(window.ctx, new Vector3(v2.elements).div(scalar), "green");
    } else if (operation === "magnitude") {
        // Print magnitudes to console
        console.log("Magnitude of v1:", v1.magnitude());
        console.log("Magnitude of v2:", v2.magnitude());
    } else if (operation === "normalize") {
        // Normalize and draw normalized vectors
        const normalizedV1 = new Vector3(v1.elements).normalize();
        const normalizedV2 = new Vector3(v2.elements).normalize();
        drawVector(window.ctx, normalizedV1, "green");
        drawVector(window.ctx, normalizedV2, "green");
    } else if (operation === "angle") {
        // Calculate and log the angle
        const angle = angleBetween(v1, v2);
        console.log(`Angle between v1 and v2: ${angle.toFixed(2)} degrees`);
    } else if (operation === "area") {
        // Calculate and log the triangle's area
        const area = areaTriangle(v1, v2);
        console.log(`Area of the triangle formed by v1 and v2: ${area.toFixed(2)}`);
    }

    // Draw the result in green
    if (result) {
        drawVector(window.ctx, result, "green");
    }
}

function angleBetween(v1, v2) {
    const dotProduct = Vector3.dot(v1, v2);
    const magnitudeV1 = v1.magnitude();
    const magnitudeV2 = v2.magnitude();

    if (magnitudeV1 === 0 || magnitudeV2 === 0) {
        console.warn("Cannot calculate angle with a zero-length vector.");
        return NaN; // Return NaN if one of the vectors has zero magnitude
    }

    // Calculate the angle in radians
    const cosTheta = dotProduct / (magnitudeV1 * magnitudeV2);

    // Convert radians to degrees
    const angleInRadians = Math.acos(cosTheta);
    const angleInDegrees = (angleInRadians * 180) / Math.PI;

    return angleInDegrees;
}

function areaTriangle(v1, v2) {
    // Calculate the cross product of v1 and v2
    const crossProduct = Vector3.cross(v1, v2);

    // Calculate the magnitude of the cross product
    const parallelogramArea = crossProduct.magnitude();

    // The triangle's area is half the parallelogram's area
    return parallelogramArea / 2;
}
