# CLAUDE.md

This file provides guidance to Claude Code when working with the 3D Avatar Chat Room codebase.

## Project Overview

This is a 3D web application featuring an interactive avatar chat room powered by OpenAI's API. The application combines Three.js for 3D graphics with modern web technologies to create an immersive conversational experience.

## Technology Stack

- **3D Graphics**: Three.js (r128) with WebGL renderer
- **Camera Controls**: OrbitControls for smooth user interaction
- **AI Integration**: OpenAI API (GPT-3.5-turbo, GPT-4, GPT-4o variants)
- **Audio**: Web Speech API for voice recognition and synthesis
- **Storage**: localStorage for API keys and settings
- **Security**: Content Security Policy, input sanitization, rate limiting

## Architecture

### Core Components

1. **AvatarChatRoom Class** (`script.js`) - Main application controller
2. **3D Scene Setup** - Camera, renderer, lighting, and controls
3. **Room Environment** - Floor, walls, and decorative elements
4. **Avatar System** - Animated 3D character with speaking animations
5. **Chat Interface** - UI for text and voice interactions
6. **Security Layer** - Input validation and rate limiting

### File Structure

```11
/
├── index.html          # Main HTML structure with security headers
├── script.js          # Core application logic and 3D implementation
├── style.css          # UI styling and responsive design
├── config.js          # Configuration settings (optional)
└── CLAUDE.md          # Development guidance (this file)
```

## Development Guidelines

### 3D Scene Management

- **Scene Hierarchy**: Use THREE.Group for complex objects (chairs, plants, avatar)
- **Lighting**: Ambient light + directional light + point lights for depth
- **Shadows**: Enable shadow mapping for realistic lighting effects
- **Materials**: Use MeshLambertMaterial for performance, MeshPhongMaterial for shininess
- **Performance**: Limit geometry complexity, use instancing for repeated objects

### Code Organization

- **Modular Methods**: Each major feature has its own method (createRoom, createAvatar, createDecorations)
- **Event Handling**: Centralized in setupEventListeners()
- **Animation Loop**: Single requestAnimationFrame loop for all animations
- **Error Handling**: Graceful fallbacks and user-friendly error messages

### Security Best Practices

- **Input Sanitization**: All user inputs are sanitized before processing
- **Rate Limiting**: Prevent API abuse with configurable limits
- **CSP Headers**: Restrict resource loading to trusted sources
- **XSS Prevention**: Use textContent instead of innerHTML
- **API Key Protection**: Store securely, never expose in client code

### Adding New 3D Objects

When adding new decorative elements:

1. **Create a dedicated method** (e.g., `createTable()`, `createBookshelf()`)
2. **Use THREE.Group** for multi-part objects
3. **Enable shadows** with `castShadow` and `receiveShadow`
4. **Position strategically** to avoid blocking user interaction
5. **Call from createDecorations()** method

Example pattern:
```javascript
createNewObject(x, y, z, rotation = 0) {
    const objectGroup = new THREE.Group();
    
    // Create geometry and materials
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const mesh = new THREE.Mesh(geometry, material);
    
    // Configure shadows
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Position and add to group
    objectGroup.add(mesh);
    objectGroup.position.set(x, y, z);
    objectGroup.rotation.y = rotation;
    
    // Add to scene
    this.scene.add(objectGroup);
}
```

### Animation Guidelines

- **Smooth Transitions**: Use sine waves for natural movement
- **Performance**: Minimize calculations in animation loop
- **State Management**: Check speaking/listening states for dynamic behavior
- **Timing**: Use consistent time increments for synchronized animations

### UI/UX Considerations

- **Responsive Design**: Interface adapts to different screen sizes
- **Accessibility**: Keyboard navigation and screen reader support
- **Visual Feedback**: Clear status indicators and button states
- **Error Messages**: User-friendly messages without technical details

## Configuration

### API Settings

Configure in `config.js`:
```javascript
window.CONFIG = {
    OPENAI_API_KEY: 'your_key_here',
    DEFAULT_MODEL: 'gpt-3.5-turbo',
    MAX_TOKENS: 150,
    TEMPERATURE: 0.7
};
```

### Security Settings

Rate limiting and validation can be adjusted in the constructor:
```javascript
this.rateLimitWindow = 60000; // 1 minute
this.maxMessagesPerWindow = 20;
```

## Testing

- **Browser Compatibility**: Test in Chrome, Firefox, Safari, Edge
- **Mobile Responsiveness**: Verify touch controls and layout
- **Performance**: Monitor frame rates and memory usage
- **Security**: Test input validation and rate limiting
- **API Integration**: Verify all supported models work correctly

## Troubleshooting

### Common Issues

1. **Three.js Loading**: Check CDN availability and CORS headers
2. **API Errors**: Verify API key and model availability
3. **Speech Recognition**: Chrome/Edge required for voice features
4. **WebGL Issues**: Ensure GPU acceleration is enabled
5. **Memory Leaks**: Monitor scene object disposal

### Performance Optimization

- Use `geometry.dispose()` and `material.dispose()` when removing objects
- Implement object pooling for frequently created/destroyed elements
- Use `renderer.info` to monitor draw calls and memory usage
- Consider Level of Detail (LOD) for complex scenes

## Future Enhancements

- **Multi-user Support**: WebRTC for shared 3D spaces
- **Advanced Animations**: Facial expressions and gestures
- **Environmental Effects**: Weather, time of day, particles
- **Customization**: Avatar appearance and room themes
- **Mobile Optimization**: Touch-friendly controls and UI