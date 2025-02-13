// Cube.js – Single‐Buffer Version

class Cube {
   //One‐time static initialization of the cube’s geometry buffer.  
  static initCubeBuffer() {
    // If already initted, skip.
    if (Cube.initted) return;

    // Interleaved positions (x,y,z) and UV (u,v).
    // For each face we have 6 vertices (two triangles).
    // Layout:  x,  y,  z,   u,  v
    // Ordered: Front, Back, Left, Right, Top, Bottom.
    // Each face has 6 vertices => 6*6 = 36 vertices total.
    // 36 * 5 = 180 float entries.
    const VERTICES = new Float32Array([
      // FRONT FACE (z=0)
      0,0,0,   0,0,
      1,1,0,   1,1,
      1,0,0,   1,0,

      0,0,0,   0,0,
      0,1,0,   0,1,
      1,1,0,   1,1,

      // BACK FACE (z=1)
      0,0,1,   0,0,
      1,0,1,   1,0,
      1,1,1,   1,1,

      0,0,1,   0,0,
      1,1,1,   1,1,
      0,1,1,   0,1,

      // LEFT FACE (x=0)
      0,0,0,   0,0,
      0,0,1,   1,0,
      0,1,1,   1,1,

      0,0,0,   0,0,
      0,1,1,   1,1,
      0,1,0,   0,1,

      // RIGHT FACE (x=1)
      1,0,0,   0,0,
      1,1,0,   0,1,
      1,1,1,   1,1,

      1,0,0,   0,0,
      1,1,1,   1,1,
      1,0,1,   1,0,

      // TOP FACE (y=1)
      0,1,0,   0,0,
      0,1,1,   0,1,
      1,1,1,   1,1,

      0,1,0,   0,0,
      1,1,1,   1,1,
      1,1,0,   1,0,

      // BOTTOM FACE (y=0)
      0,0,0,   0,0,
      1,0,0,   1,0,
      1,0,1,   1,1,

      0,0,0,   0,0,
      1,0,1,   1,1,
      0,0,1,   0,1,
    ]);

    // Create one buffer for all cube vertices.
    Cube.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, Cube.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, VERTICES, gl.STATIC_DRAW);

    //36 vertices total.
    Cube.numVertices = 36;

    // Each vertex has 5 floats: [x, y, z, u, v].
    Cube.FSIZE = VERTICES.BYTES_PER_ELEMENT;
    Cube.STRIDE = 5 * Cube.FSIZE;

    // Face offsets: each face is 6 vertices.
    // We'll do sub‐draw calls if we want a different color per face:
    Cube.faceVertexCount = 6;

    // Mark it initted.
    Cube.initted = true;
  }

  constructor(textureNum) {
    this.type = 'cube';
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
    this.textureNum = textureNum;
    this.isSky = false;  
  }

  render() {
    // Make sure the buffer is initted & bound
    if (!Cube.initted) {
      console.error('Cube.initCubeBuffer() was never called.');
      return;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, Cube.buffer);

    // Tell GL how to interpret the buffer for position
    gl.vertexAttribPointer(
      a_Position,
      3,              // x,y,z
      gl.FLOAT,
      false,
      Cube.STRIDE,
      0
    );
    gl.enableVertexAttribArray(a_Position);

    // Tell GL how to interpret the buffer for UV
    // (the UV starts at float offset 3 => 3*FSIZE)
    gl.vertexAttribPointer(
      a_UV,
      2, 
      gl.FLOAT,
      false,
      Cube.STRIDE,
      3 * Cube.FSIZE
    );
    gl.enableVertexAttribArray(a_UV);

    // Pass the cube's model matrix as uniform
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    // Pass the texture number
    gl.uniform1i(u_whichTexture, this.textureNum);

    // The face order in the buffer is: front, back, left, right, top, bottom.
    const rgba = this.color;

    if (this.isSky) {
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
      gl.drawArrays(gl.TRIANGLES, 0, Cube.numVertices);

    } else {
      // NON‐SKY => shading each face differently
      // Face 0: front
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      // Face 1: back
      gl.uniform4f(u_FragColor, 0.9*rgba[0], 0.9*rgba[1], 0.9*rgba[2], rgba[3]);
      gl.drawArrays(gl.TRIANGLES, 6, 6);

      // Face 2: left
      gl.uniform4f(u_FragColor, 0.8*rgba[0], 0.8*rgba[1], 0.8*rgba[2], rgba[3]);
      gl.drawArrays(gl.TRIANGLES, 12, 6);

      // Face 3: right
      gl.uniform4f(u_FragColor, 0.7*rgba[0], 0.7*rgba[1], 0.7*rgba[2], rgba[3]);
      gl.drawArrays(gl.TRIANGLES, 18, 6);

      // Face 4: top
      gl.uniform4f(u_FragColor, 0.6*rgba[0], 0.6*rgba[1], 0.6*rgba[2], rgba[3]);
      gl.drawArrays(gl.TRIANGLES, 24, 6);

      // Face 5: bottom
      gl.uniform4f(u_FragColor, 0.5*rgba[0], 0.5*rgba[1], 0.5*rgba[2], rgba[3]);
      gl.drawArrays(gl.TRIANGLES, 30, 6);
    }
  }
}
// Flag to track static init
Cube.initted = false;