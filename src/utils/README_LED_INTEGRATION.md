# LED Blink Integration Setup

## Quick Setup

To enable LED blink integration with external hardware libraries in your InnoIDE application, follow these steps:

### Step 1: Import the Integration Module

Add the following import to your main application entry point (e.g., `src/App.jsx` or `src/index.js`):

```javascript
// Import LED blink integration
import './utils/ledBlinkIntegration';
```

This will automatically register all event listeners for LED blink operations.

### Step 2: Use in Editor

The LED blink functionality is now available in the `/editor` route:

1. Navigate to `/editor`
2. Select `arduino` or `esp32` from the language dropdown
3. The editor will load with a pre-configured LED blink template
4. Click the Flash button in the toolbar to open the Flash panel
5. Use the LED Blink Control section to test blinking

### Step 3: Customize for Your Hardware

Edit `src/utils/ledBlinkIntegration.js` to implement your specific hardware library:

```javascript
// Replace the placeholder functions with your actual hardware library
const initializeHardware = async () => {
  // Initialize your serial port, USB device, or network connection
  // Example: Web Serial API, node-serialport, johnny-five, etc.
};

const sendToHardware = async (command) => {
  // Send commands to your hardware
  // Format: { action, pin, state, delay, count }
};
```

## Supported Hardware Libraries

### Web Serial API (Browser)
```javascript
const port = await navigator.serial.requestPort();
await port.open({ baudRate: 115200 });
```

### Node SerialPort (Electron/Node.js)
```javascript
const SerialPort = require('serialport');
const port = new SerialPort('/dev/ttyUSB0', { baudRate: 115200 });
```

### Johnny-Five (Arduino/Node.js)
```javascript
const { Board, Led } = require('johnny-five');
const board = new Board();
board.on('ready', () => {
  const led = new Led(13);
  led.blink(1000);
});
```

### ESP-IDF (ESP32 Native)
For ESP32 native applications, integrate with your ESP-IDF build system.

## Event Reference

### innoide:led-blink-start
Triggered when blinking starts
```javascript
window.addEventListener('innoide:led-blink-start', (event) => {
  const { pin, delay } = event.detail;
  // Initialize blinking with pin and delay
});
```

### innoide:led-blink
Triggered on each state change
```javascript
window.addEventListener('innoide:led-blink', (event) => {
  const { pin, state, delay, count } = event.detail;
  // Update LED state (true = HIGH, false = LOW)
});
```

### innoide:led-blink-stop
Triggered when blinking stops
```javascript
window.addEventListener('innoide:led-blink-stop', (event) => {
  const { pin, totalBlinks } = event.detail;
  // Clean up and turn off LED
});
```

## Testing Without Hardware

The integration module includes console logging, so you can test the functionality without connecting actual hardware:

1. Open browser DevTools console
2. Navigate to `/editor`
3. Select `arduino` or `esp32` language
4. Open Flash panel
5. Start LED blinking
6. Watch console for event logs

Example console output:
```
[LED Blink] Event listeners registered
[LED Blink] Starting blink on GPIO 2 with 1000ms delay
[LED Blink] Sent to hardware: LED:2:HIGH
[LED Blink] Sent to hardware: LED:2:LOW
[LED Blink] GPIO 2 blinked 5 times
[LED Blink] Stopped blink on GPIO 2. Total blinks: 10
```

## Advanced Usage

### Custom Blink Patterns

You can implement custom blink patterns by listening to the events and adding your own logic:

```javascript
let blinkPattern = [100, 200, 300, 200]; // ms delays
let patternIndex = 0;

window.addEventListener('innoide:led-blink', (event) => {
  const { pin, state } = event.detail;
  const customDelay = blinkPattern[patternIndex % blinkPattern.length];
  patternIndex++;
  
  // Apply custom delay pattern
  yourHardwareLibrary.setDelay(customDelay);
  yourHardwareLibrary.digitalWrite(pin, state ? 'HIGH' : 'LOW');
});
```

### Multiple LEDs

Control multiple LEDs simultaneously:

```javascript
const activeLEDs = new Set();

window.addEventListener('innoide:led-blink-start', (event) => {
  activeLEDs.add(event.detail.pin);
  // Start blinking all active LEDs
  activeLEDs.forEach(pin => {
    yourHardwareLibrary.startBlink(pin);
  });
});

window.addEventListener('innoide:led-blink-stop', (event) => {
  activeLEDs.delete(event.detail.pin);
});
```

## Troubleshooting

### Issue: Events not firing
**Solution**: Make sure you've imported the integration module in your app entry point

### Issue: Hardware not responding
**Solution**: Check your hardware connection and verify the `sendToHardware` function is correctly implemented

### Issue: Wrong pin selected
**Solution**: Update the pin selection in the Flash panel or modify the default pin in `Flash.jsx`

## Next Steps

1. Implement your hardware library integration in `ledBlinkIntegration.js`
2. Test with your actual hardware
3. Customize the Flash panel UI as needed
4. Add additional GPIO pins to the pin selector
5. Implement advanced features like PWM, analog output, etc.

For more details, see the main [LED_BLINK_INTEGRATION.md](../../LED_BLINK_INTEGRATION.md) guide.
