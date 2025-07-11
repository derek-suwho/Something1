# 3D Avatar Chat Room

A interactive 3D environment where you can chat with an AI avatar powered by OpenAI's API.

## Features

- **3D Room Environment**: Navigate through a furnished room with chairs, plants, and ambient lighting
- **Animated Avatar**: Talk to a friendly AI avatar that responds with animations and voice
- **OpenAI Integration**: Choose from multiple AI models (GPT-3.5, GPT-4, GPT-4o, etc.)
- **Voice Features**: Speech-to-text input and text-to-speech responses
- **Modern UI**: Glassmorphism design with smooth animations

## Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/derek-suwho/Something1.git
   cd Something1
   ```

2. **Configure API Key**
   ```bash
   # Copy the example config file
   cp config.example.js config.js
   
   # Edit config.js and add your OpenAI API key
   # Replace 'your_openai_api_key_here' with your actual API key
   ```

3. **Run the application**
   - Open `index.html` in a modern web browser
   - Or use a local server (recommended):
     ```bash
     # Using Python
     python -m http.server 8000
     
     # Using Node.js
     npx http-server
     ```

## Usage

1. **Set API Key**: Edit your API key in `config.js` or use the input field in the app
2. **Choose Model**: Select your preferred OpenAI model from the dropdown
3. **Start Chatting**: Type messages or click the 🎤 button to speak
4. **Navigate**: Use mouse to orbit around the 3D room
5. **Toggle Chat**: Click 💬 to show/hide the chat interface

## File Structure

- `index.html` - Main application file
- `script.js` - Three.js 3D scene and OpenAI integration
- `style.css` - Modern UI styling
- `config.js` - API configuration (not tracked in git)
- `config.example.js` - Configuration template

## Security

This application implements comprehensive security measures:

### ✅ Implemented Security Features
- **Input Validation**: All user inputs sanitized to prevent XSS attacks
- **Rate Limiting**: Maximum 20 messages per minute per user
- **Content Security Policy**: Restrictive CSP headers prevent code injection
- **Subresource Integrity**: CDN scripts protected with integrity hashes
- **Secure Error Handling**: No sensitive information exposed in errors
- **Message Length Limits**: 500 character maximum per message
- **Memory Protection**: Limited message history to prevent memory exhaustion

### ⚠️ Security Considerations
- **API Key Exposure**: Keys are still visible in browser developer tools
- **Client-Side Limitations**: For production, implement backend proxy server
- **HTTPS Required**: Always serve over HTTPS in production environments

### 🔒 Best Practices
- API keys stored in `config.js` (excluded from version control)
- Never commit real API keys to the repository
- The `.gitignore` file protects sensitive configuration files

## Requirements

- Modern web browser with WebGL support
- OpenAI API key
- Internet connection for API calls

## Technologies Used

- **Three.js** - 3D graphics and animation
- **OpenAI API** - Conversational AI
- **Web Speech API** - Voice recognition and synthesis
- **Vanilla JavaScript** - No additional frameworks required