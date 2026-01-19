# Prolink Bridge Server

Node.js sidecar application for connecting Pioneer DJ hardware to the Piko V3 web app.

## Setup

```bash
cd scripts/bridge
npm install
```

## Usage

```bash
npm run dev  # Development mode with watch
npm start    # Production mode
```

## Requirements

- Node.js 20+
- Connected to Pioneer Pro DJ Link network (Ethernet)
- Pioneer CDJ/DJM equipment on the same network

## How It Works

1. The bridge listens to UDP broadcasts from Pioneer equipment
2. Parses binary packets into JSON
3. Relays data to web clients via WebSocket (ws://localhost:8080)
4. Implements state diffing to reduce network traffic

## Web App Integration

The web app connects to `ws://localhost:8080` and receives real-time CDJ status updates.
