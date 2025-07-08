class AvatarChatRoom {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.avatar = null;
        this.room = {};
        this.openaiKey = '';
        this.isListening = false;
        this.isSpeaking = false;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        
        this.init();
        this.setupEventListeners();
        this.loadSettings();
    }

    init() {
        this.setupThreeJS();
        this.createRoom();
        this.createAvatar();
        this.animate();
        this.addMessage('system', 'Welcome! Set your OpenAI API key and start chatting with the avatar.');
    }

    setupThreeJS() {
        const canvas = document.getElementById('three-canvas');
        
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 1.6, 3);

        this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxDistance = 10;
        this.controls.minDistance = 1;
        this.controls.maxPolarAngle = Math.PI / 2.1;

        window.addEventListener('resize', () => this.onWindowResize());
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
        const bodyGeometry = new THREE.CapsuleGeometry(0.2, 1.2, 4, 8);
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

        this.controls.update();
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
        const chatInterface = document.getElementById('chat-interface');

        sendButton.addEventListener('click', () => this.sendMessage());
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        voiceButton.addEventListener('click', () => this.toggleVoiceRecognition());
        toggleChat.addEventListener('click', () => {
            chatInterface.classList.toggle('hidden');
        });

        saveKeyButton.addEventListener('click', () => this.saveApiKey());

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

    async sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (!message) return;
        if (!this.openaiKey) {
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
            console.error('OpenAI API Error:', error);
            this.addMessage('system', 'Sorry, I encountered an error. Please check your API key and try again.');
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
                model: 'gpt-3.5-turbo',
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
                max_tokens: 150,
                temperature: 0.7
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
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = content;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    updateStatus(status) {
        document.getElementById('status').textContent = status;
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
    }
}

// Initialize the application
window.addEventListener('DOMContentLoaded', () => {
    new AvatarChatRoom();
});