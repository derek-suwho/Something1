// Simple OrbitControls implementation for Three.js
THREE.OrbitControls = function (camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.enableDamping = true;
    this.dampingFactor = 0.05;
    this.maxDistance = 10;
    this.minDistance = 1;
    this.maxPolarAngle = Math.PI / 2.1;
    
    // Internal state
    this.spherical = {
        radius: 4,
        theta: 0,
        phi: Math.PI / 2.2
    };
    
    this.isMouseDown = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    
    // Mouse event handlers
    this.onMouseDown = (event) => {
        this.isMouseDown = true;
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
    };
    
    this.onMouseMove = (event) => {
        if (!this.isMouseDown) return;
        
        const deltaX = event.clientX - this.lastMouseX;
        const deltaY = event.clientY - this.lastMouseY;
        
        this.spherical.theta -= deltaX * 0.01;
        this.spherical.phi += deltaY * 0.01;
        
        // Clamp phi
        this.spherical.phi = Math.max(0.1, Math.min(this.maxPolarAngle, this.spherical.phi));
        
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
    };
    
    this.onMouseUp = () => {
        this.isMouseDown = false;
    };
    
    this.onWheel = (event) => {
        this.spherical.radius += event.deltaY * 0.01;
        this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this.spherical.radius));
    };
    
    // Add event listeners
    this.domElement.addEventListener('mousedown', this.onMouseDown);
    this.domElement.addEventListener('mousemove', this.onMouseMove);
    this.domElement.addEventListener('mouseup', this.onMouseUp);
    this.domElement.addEventListener('wheel', this.onWheel);
    
    // Update method
    this.update = () => {
        // Convert spherical to cartesian
        const x = this.spherical.radius * Math.sin(this.spherical.phi) * Math.cos(this.spherical.theta);
        const y = this.spherical.radius * Math.cos(this.spherical.phi);
        const z = this.spherical.radius * Math.sin(this.spherical.phi) * Math.sin(this.spherical.theta);
        
        this.camera.position.set(x, y, z);
        this.camera.lookAt(0, 1.7, 0); // Look at avatar head level
    };
    
    // Dispose method
    this.dispose = () => {
        this.domElement.removeEventListener('mousedown', this.onMouseDown);
        this.domElement.removeEventListener('mousemove', this.onMouseMove);
        this.domElement.removeEventListener('mouseup', this.onMouseUp);
        this.domElement.removeEventListener('wheel', this.onWheel);
    };
};