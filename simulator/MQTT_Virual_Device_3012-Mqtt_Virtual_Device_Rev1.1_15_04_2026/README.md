# MQTT Device Simulation Setup

## Local Development Setup

Follow these steps to set up the project on your local system:

1. **Clone the latest branch**
   ```bash
   git clone <repository-url>
   cd <MQTT_VIRUAL_DEVICE_3012>
2. **Install dependencies**
```bash
   npm i
   ```
3. **Add certificates folder**
Unzip the certificates folder (attached in mail) and place it in the project root:
```bash
MQTT_VIRUAL_DEVICE_3012/
└── certs/
```
4. **Replace VIN ,IMEI and tboxserialNumber in all the files**
create .env file and pass below values in that same as .env.example file
4. **Run specific MQTT device scripts**

Based on the device/folder you want to run
```bash
Device Join: node .\deviceJoin\deviceJoin.js
```
```bash
Vehicle Telemetry: node .\vehicleTelemetry\vehicleTelemetryFuelLevel.js
```
```bash
Events: node .\events\start_event.js
```
5. **Quick Start Example**

# For vehicle telemetry
```bash
npm i
```
# Add certs folder
```bash
node .\vehicleTelemetry\vehicleTelemetryFuelLevel.js
```
# Folder Structure
```bash
project-root/
├── certs/                 # Certificates folder (unzip and add)
├── deviceJoin/
│   └── devicejoin.js
├── vehicleTelemetry/
│   └── vehicleTelemetry.js
├── events/
│   └── start_event.js
├── package.json
└── README.md
```
# Note: 
Each folder corresponds to a specific MQTT device simulation. Run the respective script based on your testing needs.

# For only hex want to run to_txt_file

# example

for event
```bash
Run node .\events\start_event_to_txt_file.js 
```
so you will get hex data in the 

