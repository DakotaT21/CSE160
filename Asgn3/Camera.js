class Camera {
    constructor() {
      // Initialize camera parameters.
      this.eye = new Vector3([0, 1, 3]);  // Camera position
      this.at  = new Vector3([0, 0, 0]);   // Look-at point
      this.up  = new Vector3([0, 1, 0]);   // Up vector
      this.fov = 60;                     // Field of view in degrees
    }
  
    // Moves the camera forward by "speed" units.
    moveForward(speed) {
      let f = new Vector3();
      f.set(this.at);   // f = at
      f.sub(this.eye);  // f = at - eye
      f.normalize();    // Normalize f
      f.mul(speed);     // Scale by speed
      this.eye.add(f);  // eye += f
      this.at.add(f);   // at += f
    }
  
    // Moves the camera backward by "speed" units.
    moveBackwards(speed) {
      let b = new Vector3();
      b.set(this.eye);  // b = eye
      b.sub(this.at);   // b = eye - at
      b.normalize();
      b.mul(speed);
      this.eye.add(b);
      this.at.add(b);
    }
  
    // Moves the camera to the left by "speed" units.
    moveLeft(speed) {
      let f = new Vector3();
      f.set(this.at);
      f.sub(this.eye);                // f = at - eye (forward vector)
      // Compute side vector s = up x f.
      let s = Vector3.cross(this.up, f);
      s.normalize();
      s.mul(speed);
      this.eye.add(s);
      this.at.add(s);
    }
  
    // Moves the camera to the right by "speed" units.
    moveRight(speed) {
      let f = new Vector3();
      f.set(this.at);
      f.sub(this.eye);                // f = at - eye (forward vector)
      // Compute side vector s = f x up.
      let s = Vector3.cross(f, this.up);
      s.normalize();
      s.mul(speed);
      this.eye.add(s);
      this.at.add(s);
    }
  
    // Pan left: rotate the forward vector around the up vector by alpha degrees.
    panLeft(alpha) {
      let f = new Vector3();
      f.set(this.at);
      f.sub(this.eye);    // f = at - eye
      let rot = new Matrix4();
      rot.setRotate(alpha, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
      let f_prime = rot.multiplyVector3(f);
      this.at.set(this.eye);
      this.at.add(f_prime); // at = eye + f_prime
    }
  
    // Pan right is just panLeft with a negative angle.
    panRight(alpha) {
      this.panLeft(-alpha);
    }
  
    // Pitch: rotate the forward vector around the right axis by "angle" degrees.
    pitch(angle) {
      let f = new Vector3();
      f.set(this.at);
      f.sub(this.eye); // f = at - eye
      // Compute right vector as the cross product of f and up.
      let right = Vector3.cross(f, this.up);
      right.normalize();
      let rot = new Matrix4();
      rot.setRotate(angle, right.elements[0], right.elements[1], right.elements[2]);
      let f_prime = rot.multiplyVector3(f);
      this.at.set(this.eye);
      this.at.add(f_prime); // at = eye + rotated forward vector
    }
  
    // Rotate the camera based on mouse movement.
    // dx (horizontal movement) affects yaw; dy (vertical movement) affects pitch.
    rotateMouse(dx, dy) {
      const sensitivity = 0.5; // Adjust this value for desired sensitivity.
      // Yaw: rotate around the up vector.
      this.panLeft(dx * sensitivity);
      // Pitch: rotate around the right vector.
      this.pitch(dy * sensitivity);
    }
  
    // Returns the view matrix based on the current eye, at, and up.
    updateViewMatrix() {
      let viewMat = new Matrix4();
      viewMat.setLookAt(
        this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
        this.at.elements[0],  this.at.elements[1],  this.at.elements[2],
        this.up.elements[0],  this.up.elements[1],  this.up.elements[2]
      );
      return viewMat;
    }
  
    // Returns the perspective projection matrix for the given canvas.
    updateProjectionMatrix(canvas) {
      let projMat = new Matrix4();
      projMat.setPerspective(this.fov, canvas.width / canvas.height, 0.1, 1415);
      return projMat;
    }
  }
  