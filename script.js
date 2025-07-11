class AvatarChatRoom {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.avatar = null;
        this.room = {};
        this.openaiKey = window.CONFIG?.OPENAI_API_KEY || '';
        this.selectedModel = window.CONFIG?.DEFAULT_MODEL || 'gpt-3.5-turbo';
        this.isListening = false;
        this.isSpeaking = false;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        
        // Movement controls
        this.keys = {};
        this.moveSpeed = 0.1;
        
        // Security: Rate limiting
        this.lastMessageTime = 0;
        this.messageCount = 0;
        this.rateLimitWindow = 60000; // 1 minute
        this.maxMessagesPerWindow = 20;
        
        this.init();
        this.setupEventListeners();
        this.loadSettings();
    }

    init() {
        console.log('Initializing AvatarChatRoom...');
        try {
            this.setupThreeJS();
            console.log('Three.js setup complete');
            this.createRoom();
            console.log('Room created');
            this.createAvatar();
            console.log('Avatar created');
            this.animate();
            console.log('Animation started');
            if (this.openaiKey && this.openaiKey !== 'your_openai_api_key_here') {
                this.addMessage('system', 'Welcome! OpenAI API key loaded from config. Ready to chat!');
            } else {
                this.addMessage('system', 'Welcome! Set your OpenAI API key in config.js or use the input field.');
            }
        } catch (error) {
            console.error('Error during initialization:', error);
            this.addMessage('system', 'Error initializing 3D scene. Check console for details.');
        }
    }

    setupThreeJS() {
        const canvas = document.getElementById('three-canvas');
        if (!canvas) {
            throw new Error('Canvas element not found');
        }
        
        if (typeof THREE === 'undefined') {
            throw new Error('Three.js not loaded');
        }

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 1.7, 4);

        this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        if (typeof THREE.OrbitControls === 'undefined') {
            console.warn('OrbitControls not loaded, using basic camera controls');
            this.controls = null;
        } else {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.maxDistance = 10;
            this.controls.minDistance = 1;
            this.controls.maxPolarAngle = Math.PI / 2.1;
            // Fix inverted mouse movement
            this.controls.screenSpacePanning = false;
            this.controls.reverseOrbit = false;
        }

        window.addEventListener('resize', () => this.onWindowResize());
        
        // Add keyboard event listeners for WASD movement
        window.addEventListener('keydown', (event) => this.onKeyDown(event));
        window.addEventListener('keyup', (event) => this.onKeyUp(event));
    }

    createRoom() {
        const roomSize = 8;
        const wallHeight = 4;

        // Floor
        const floorGeometry = new THREE.PlaneGeometry(roomSize, roomSize);
        const floorMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x404040,
            transparent: true,
            opacity: 0.8
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);
        this.room.floor = floor;

        // Walls
        const wallMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x2d2d44,
            transparent: true,
            opacity: 0.9
        });

        // Back wall
        const backWallGeometry = new THREE.PlaneGeometry(roomSize, wallHeight);
        const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
        backWall.position.set(0, wallHeight / 2, -roomSize / 2);
        this.scene.add(backWall);

        // Left wall
        const leftWall = new THREE.Mesh(backWallGeometry, wallMaterial);
        leftWall.position.set(-roomSize / 2, wallHeight / 2, 0);
        leftWall.rotation.y = Math.PI / 2;
        this.scene.add(leftWall);

        // Right wall
        const rightWall = new THREE.Mesh(backWallGeometry, wallMaterial);
        rightWall.position.set(roomSize / 2, wallHeight / 2, 0);
        rightWall.rotation.y = -Math.PI / 2;
        this.scene.add(rightWall);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        // Point light for avatar
        const avatarLight = new THREE.PointLight(0x4a9eff, 1, 10);
        avatarLight.position.set(0, 2, 0);
        this.scene.add(avatarLight);
        this.room.avatarLight = avatarLight;

        // Add decorations
        this.createDecorations();
    }

    createDecorations() {
        // Create chairs
        this.createChair(-2.5, 0, 1.5, 0);
        this.createChair(2.5, 0, 1.5, Math.PI);
        this.createChair(-1, 0, 3, -Math.PI / 4);

        // Create plants
        this.createPlant(-3, 0, -3);
        this.createPlant(3, 0, -3);
        this.createPlant(-3, 0, 3);
        this.createPlant(2, 0, -2);
    }

    createChair(x, y, z, rotation) {
        const chairGroup = new THREE.Group();

        // Chair seat
        const seatGeometry = new THREE.BoxGeometry(0.8, 0.08, 0.8);
        const seatMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.set(0, 0.5, 0);
        seat.castShadow = true;
        seat.receiveShadow = true;
        chairGroup.add(seat);

        // Chair backrest
        const backGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.08);
        const backMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const backrest = new THREE.Mesh(backGeometry, backMaterial);
        backrest.position.set(0, 0.9, -0.36);
        backrest.castShadow = true;
        backrest.receiveShadow = true;
        chairGroup.add(backrest);

        // Chair legs
        const legGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.5);
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });

        const legPositions = [
            [-0.35, 0.25, -0.35],
            [0.35, 0.25, -0.35],
            [-0.35, 0.25, 0.35],
            [0.35, 0.25, 0.35]
        ];

        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(pos[0], pos[1], pos[2]);
            leg.castShadow = true;
            chairGroup.add(leg);
        });

        chairGroup.position.set(x, y, z);
        chairGroup.rotation.y = rotation;
        this.scene.add(chairGroup);
    }

    createPlant(x, y, z) {
        const plantGroup = new THREE.Group();

        // Plant pot
        const potGeometry = new THREE.CylinderGeometry(0.3, 0.25, 0.4, 8);
        const potMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const pot = new THREE.Mesh(potGeometry, potMaterial);
        pot.position.set(0, 0.2, 0);
        pot.castShadow = true;
        pot.receiveShadow = true;
        plantGroup.add(pot);

        // Plant stem
        const stemGeometry = new THREE.CylinderGeometry(0.02, 0.03, 0.8);
        const stemMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.set(0, 0.8, 0);
        stem.castShadow = true;
        plantGroup.add(stem);

        // Plant leaves
        const leafGeometry = new THREE.SphereGeometry(0.3, 8, 6);
        const leafMaterial = new THREE.MeshLambertMaterial({ color: 0x32CD32 });
        
        // Main leaf cluster
        const mainLeaves = new THREE.Mesh(leafGeometry, leafMaterial);
        mainLeaves.position.set(0, 1.2, 0);
        mainLeaves.scale.set(1, 0.6, 1);
        mainLeaves.castShadow = true;
        plantGroup.add(mainLeaves);

        // Additional leaf clusters
        const leaf1 = new THREE.Mesh(leafGeometry, leafMaterial);
        leaf1.position.set(0.15, 1.0, 0.1);
        leaf1.scale.set(0.7, 0.5, 0.7);
        leaf1.castShadow = true;
        plantGroup.add(leaf1);

        const leaf2 = new THREE.Mesh(leafGeometry, leafMaterial);
        leaf2.position.set(-0.12, 1.1, -0.08);
        leaf2.scale.set(0.6, 0.4, 0.6);
        leaf2.castShadow = true;
        plantGroup.add(leaf2);

        plantGroup.position.set(x, y, z);
        this.scene.add(plantGroup);
    }

    createAvatar() {
        const avatarGroup = new THREE.Group();

        // Head
        const headGeometry = new THREE.SphereGeometry(0.3, 32, 32);
        const headMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x4a9eff,
            shininess: 100,
            transparent: true,
            opacity: 0.9
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.7;
        head.castShadow = true;
        avatarGroup.add(head);

        // Body
        const bodyGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.2, 8);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x357abd,
            transparent: true,
            opacity: 0.8
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.8;
        body.castShadow = true;
        avatarGroup.add(body);

        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.05, 16, 16);
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.1, 1.8, 0.25);
        avatarGroup.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.1, 1.8, 0.25);
        avatarGroup.add(rightEye);

        // Glow effect
        const glowGeometry = new THREE.SphereGeometry(0.35, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x4a9eff,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.y = 1.7;
        avatarGroup.add(glow);

        avatarGroup.position.set(0, 0, -1);
        this.scene.add(avatarGroup);
        
        this.avatar = {
            group: avatarGroup,
            head: head,
            body: body,
            glow: glow,
            eyes: [leftEye, rightEye],
            baseY: 0,
            time: 0
        };
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.avatar.time += 0.02;
        
        // Floating animation
        this.avatar.group.position.y = this.avatar.baseY + Math.sin(this.avatar.time) * 0.1;
        
        // Head rotation
        this.avatar.head.rotation.y = Math.sin(this.avatar.time * 0.5) * 0.2;
        
        // Glow pulsing
        this.avatar.glow.scale.setScalar(1 + Math.sin(this.avatar.time * 2) * 0.1);
        
        // Speaking animation
        if (this.isSpeaking) {
            this.avatar.head.scale.setScalar(1 + Math.sin(this.avatar.time * 8) * 0.05);
            this.room.avatarLight.intensity = 1.5 + Math.sin(this.avatar.time * 10) * 0.5;
        } else {
            this.avatar.head.scale.setScalar(1);
            this.room.avatarLight.intensity = 1;
        }

        if (this.controls) {
            this.controls.update();
        }
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    setupEventListeners() {
        const chatInput = document.getElementById('chat-input');
        const sendButton = document.getElementById('send-button');
        const voiceButton = document.getElementById('voice-button');
        const toggleChat = document.getElementById('toggle-chat');
        const saveKeyButton = document.getElementById('save-key');
        const modelPicker = document.getElementById('model-picker');
        const chatInterface = document.getElementById('chat-interface');

        if (!chatInput || !sendButton || !voiceButton || !toggleChat || !saveKeyButton || !modelPicker || !chatInterface) {
            console.error('Some UI elements not found');
            return;
        }

        sendButton.addEventListener('click', () => this.sendMessage());
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        voiceButton.addEventListener('click', () => this.toggleVoiceRecognition());
        toggleChat.addEventListener('click', () => {
            chatInterface.classList.toggle('hidden');
        });

        saveKeyButton.addEventListener('click', () => this.saveApiKey());
        modelPicker.addEventListener('change', (e) => this.changeModel(e.target.value));

        this.setupSpeechRecognition();
    }


    setupSpeechRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                document.getElementById('chat-input').value = transcript;
                this.sendMessage();
            };

            this.recognition.onend = () => {
                this.isListening = false;
                document.getElementById('voice-button').classList.remove('recording');
                this.updateStatus('Ready');
            };
        }
    }

    toggleVoiceRecognition() {
        if (!this.recognition) {
            this.addMessage('system', 'Speech recognition not supported in this browser.');
            return;
        }

        if (this.isListening) {
            this.recognition.stop();
        } else {
            this.recognition.start();
            this.isListening = true;
            document.getElementById('voice-button').classList.add('recording');
            this.updateStatus('Listening...');
        }
    }

    // Security: Input sanitization
    sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        
        // Remove potential XSS vectors
        return input
            .replace(/[<>]/g, '') // Remove angle brackets
            .replace(/javascript:/gi, '') // Remove javascript: URLs
            .replace(/on\w+\s*=/gi, '') // Remove event handlers
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim()
            .substring(0, 500); // Limit length
    }

    // Security: Rate limiting check
    checkRateLimit() {
        const now = Date.now();
        
        // Reset counter if window has passed
        if (now - this.lastMessageTime > this.rateLimitWindow) {
            this.messageCount = 0;
        }
        
        // Check if rate limit exceeded
        if (this.messageCount >= this.maxMessagesPerWindow) {
            return false;
        }
        
        this.messageCount++;
        this.lastMessageTime = now;
        return true;
    }

    async sendMessage() {
        console.log('sendMessage called');
        const input = document.getElementById('chat-input');
        if (!input) {
            console.error('Chat input element not found');
            return;
        }
        const rawMessage = input.value.trim();
        console.log('Raw message:', rawMessage);
        
        if (!rawMessage) {
            console.log('No message to send');
            return;
        }
        
        // Security: Rate limiting
        if (!this.checkRateLimit()) {
            this.addMessage('system', 'Rate limit exceeded. Please wait a moment before sending another message.');
            return;
        }
        
        // Security: Input sanitization and validation
        const message = this.sanitizeInput(rawMessage);
        if (!message) {
            this.addMessage('system', 'Invalid message content.');
            return;
        }
        
        if (message.length > 500) {
            this.addMessage('system', 'Message too long. Please keep messages under 500 characters.');
            return;
        }
        
        if (!this.openaiKey || this.openaiKey === 'your_openai_api_key_here') {
            this.addMessage('system', 'Please set your OpenAI API key first.');
            return;
        }

        input.value = '';
        this.addMessage('user', message);
        this.updateStatus('Thinking...');

        try {
            const response = await this.callOpenAI(message);
            this.addMessage('avatar', response);
            this.speak(response);
            this.updateStatus('Ready');
        } catch (error) {
            // Security: Don't expose detailed error information
            console.error('API Error:', error);
            this.addMessage('system', 'Unable to process your request. Please try again.');
            this.updateStatus('Error');
        }
    }

    async callOpenAI(message) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.openaiKey}`
            },
            body: JSON.stringify({
                model: this.selectedModel,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a friendly AI avatar living in a 3D room. Keep responses conversational and engaging, but concise (2-3 sentences max). You can see and interact with visitors in your virtual space.'
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: window.CONFIG?.MAX_TOKENS || 150,
                temperature: window.CONFIG?.TEMPERATURE || 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    speak(text) {
        if (!this.synthesis) return;

        this.synthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        utterance.volume = 0.8;

        utterance.onstart = () => {
            this.isSpeaking = true;
            this.updateStatus('Speaking...');
        };

        utterance.onend = () => {
            this.isSpeaking = false;
            this.updateStatus('Ready');
        };

        this.synthesis.speak(utterance);
    }

    addMessage(type, content) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) {
            console.error('Messages container not found');
            return;
        }
        
        const messageDiv = document.createElement('div');
        
        // Security: Validate message type
        const validTypes = ['user', 'avatar', 'system'];
        const safeType = validTypes.includes(type) ? type : 'system';
        
        messageDiv.className = `message ${safeType}`;
        
        // Security: Use textContent to prevent XSS
        messageDiv.textContent = String(content).substring(0, 1000);
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Security: Limit message history to prevent memory issues
        const messages = messagesContainer.children;
        if (messages.length > 100) {
            messagesContainer.removeChild(messages[0]);
        }
    }

    updateStatus(status) {
        document.getElementById('status').textContent = status;
    }

    changeModel(modelValue) {
        this.selectedModel = modelValue;
        localStorage.setItem('selected-model', modelValue);
        this.addMessage('system', `AI model changed to ${modelValue}`);
    }

    saveApiKey() {
        const keyInput = document.getElementById('openai-key');
        this.openaiKey = keyInput.value.trim();
        
        if (this.openaiKey) {
            localStorage.setItem('openai-key', this.openaiKey);
            this.addMessage('system', 'API key saved! You can now chat with the avatar.');
            keyInput.type = 'password';
            keyInput.value = '••••••••••••••••';
        }
    }

    loadSettings() {
        const savedKey = localStorage.getItem('openai-key');
        if (savedKey) {
            this.openaiKey = savedKey;
            const keyInput = document.getElementById('openai-key');
            keyInput.type = 'password';
            keyInput.value = '••••••••••••••••';
            this.addMessage('system', 'API key loaded. Ready to chat!');
        }

        const savedModel = localStorage.getItem('selected-model');
        if (savedModel) {
            this.selectedModel = savedModel;
            document.getElementById('model-picker').value = savedModel;
        }
    }
}

// Initialize the application
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing AvatarChatRoom...');
    try {
        new AvatarChatRoom();
    } catch (error) {
        console.error('Failed to initialize AvatarChatRoom:', error);
        // Show error message to user
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'message system';
            errorDiv.textContent = 'Failed to initialize 3D scene. Check console for details.';
            messagesContainer.appendChild(errorDiv);
        }
    }
});