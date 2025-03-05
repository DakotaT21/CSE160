class Cube {
  static initCubeBuffer() {
    if (Cube.initted) return;

    // Each vertex has 8 floats: x,y,z, nx,ny,nz, u,v
    // For each of the 6 faces, we have 6 vertices (two triangles).
    // That’s 36 vertices total.
    const VERTICES = new Float32Array([
      // ========================
      //  front face (z=0) normal = (0,0,-1)
      //  positions range from (0,0,0) to (1,1,0)
      // ========================
      //  1st triangle
      0,0,0,   0,0,-1,   0,0,
      1,0,0,   0,0,-1,   1,0,
      1,1,0,   0,0,-1,   1,1,
      //  2nd triangle
      0,0,0,   0,0,-1,   0,0,
      1,1,0,   0,0,-1,   1,1,
      0,1,0,   0,0,-1,   0,1,

      // ========================
      //  back face (z=1) normal = (0,0,1)
      //  positions range from (0,0,1) to (1,1,1)
      // ========================
      0,0,1,   0,0,1,    0,0,
      1,0,1,   0,0,1,    1,0,
      1,1,1,   0,0,1,    1,1,
      0,0,1,   0,0,1,    0,0,
      1,1,1,   0,0,1,    1,1,
      0,1,1,   0,0,1,    0,1,

      // ========================
      //  left face (x=0) normal = (-1,0,0)
      //  from z=0..1, y=0..1 at x=0
      // ========================
      0,0,0,  -1,0,0,   0,0,
      0,0,1,  -1,0,0,   1,0,
      0,1,1,  -1,0,0,   1,1,
      0,0,0,  -1,0,0,   0,0,
      0,1,1,  -1,0,0,   1,1,
      0,1,0,  -1,0,0,   0,1,

      // ========================
      //  right face (x=1) normal = (1,0,0)
      //  from z=0..1, y=0..1 at x=1
      // ========================
      1,0,0,   1,0,0,   0,0,
      1,1,0,   1,0,0,   0,1,
      1,1,1,   1,0,0,   1,1,
      1,0,0,   1,0,0,   0,0,
      1,1,1,   1,0,0,   1,1,
      1,0,1,   1,0,0,   1,0,

      // ========================
      //  top face (y=1) normal = (0,1,0)
      //  from x=0..1, z=0..1 at y=1
      // ========================
      0,1,0,   0,1,0,   0,0,
      0,1,1,   0,1,0,   0,1,
      1,1,1,   0,1,0,   1,1,
      0,1,0,   0,1,0,   0,0,
      1,1,1,   0,1,0,   1,1,
      1,1,0,   0,1,0,   1,0,

      // ========================
      //  bottom face (y=0) normal = (0,-1,0)
      //  from x=0..1, z=0..1 at y=0
      // ========================
      0,0,0,   0,-1,0,  0,0,
      1,0,0,   0,-1,0,  1,0,
      1,0,1,   0,-1,0,  1,1,
      0,0,0,   0,-1,0,  0,0,
      1,0,1,   0,-1,0,  1,1,
      0,0,1,   0,-1,0,  0,1,
    ]);

    // Create a buffer for the above data
    Cube.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, Cube.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, VERTICES, gl.STATIC_DRAW);

    // We have 6 faces * 6 verts = 36 total
    Cube.numVertices = 36;

    // Each vertex has 8 floats: x,y,z, nx,ny,nz, u,v
    // so the stride is 8 * bytesPerFloat:
    Cube.FSIZE = VERTICES.BYTES_PER_ELEMENT;
    Cube.STRIDE = 8 * Cube.FSIZE; // 8 floats per vertex

    Cube.faceVertexCount = 6; // in case we want sub-draw calls
    Cube.initted = true;
  }

  constructor(textureNum) {
    this.type = 'cube';
    this.color = [1,1,1,1];
    this.matrix = new Matrix4();
    this.textureNum = textureNum;
    this.isSky = false;
  }

  render() {
    if (!Cube.initted) {
      console.error("Call Cube.initCubeBuffer() first!");
      return;
    }
    // Bind the buffer with vertex data
    gl.bindBuffer(gl.ARRAY_BUFFER, Cube.buffer);

    // Position = 3 floats from 0
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, Cube.STRIDE, 0);
    gl.enableVertexAttribArray(a_Position);

    // Normal = 3 floats, starts at offset 3
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, Cube.STRIDE, 3*Cube.FSIZE);
    gl.enableVertexAttribArray(a_Normal);

    // UV = 2 floats, starts at offset 6
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, Cube.STRIDE, 6*Cube.FSIZE);
    gl.enableVertexAttribArray(a_UV);

    // Send the model matrix
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    // Normal matrix = inverse-transpose of this.matrix
    let nm = new Matrix4(this.matrix);
    nm.invert(); nm.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix,false,nm.elements);

    // Choose which texture
    //gl.uniform1i(u_whichTexture, this.textureNum);
    if (g_normalViz) {
      gl.uniform1i(u_whichTexture, -3);
    } else {
      gl.uniform1i(u_whichTexture, this.textureNum);
    }

    gl.uniform4f(u_FragColor,
      this.color[0],
      this.color[1],
      this.color[2],
      this.color[3]);

    // If you want to color each face differently (not typical for textured cubes):
    const c = this.color;
    if (this.isSky) {
      gl.uniform4f(u_FragColor, c[0], c[1], c[2], c[3]);
      gl.drawArrays(gl.TRIANGLES, 0, Cube.numVertices);
    } else {
      // front
      gl.uniform4f(u_FragColor, c[0], c[1], c[2], c[3]);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      // back
      gl.uniform4f(u_FragColor, 0.9*c[0], 0.9*c[1], 0.9*c[2], c[3]);
      gl.drawArrays(gl.TRIANGLES, 6, 6);
      // left
      gl.uniform4f(u_FragColor, 0.8*c[0], 0.8*c[1], 0.8*c[2], c[3]);
      gl.drawArrays(gl.TRIANGLES, 12, 6);
      // right
      gl.uniform4f(u_FragColor, 0.7*c[0], 0.7*c[1], 0.7*c[2], c[3]);
      gl.drawArrays(gl.TRIANGLES, 18, 6);
      // top
      gl.uniform4f(u_FragColor, 0.6*c[0], 0.6*c[1], 0.6*c[2], c[3]);
      gl.drawArrays(gl.TRIANGLES, 24, 6);
      // bottom
      gl.uniform4f(u_FragColor, 0.5*c[0], 0.5*c[1], 0.5*c[2], c[3]);
      gl.drawArrays(gl.TRIANGLES, 30, 6);
    }
  }
}
Cube.initted = false;
