// const protobuf = require("protobufjs");
// const fs = require("fs");
// const net = require("net");

// function loadIgnitionStateFromFile(filePath) {
//   try {
//     const data = fs.readFileSync(filePath, 'utf8').trim().toUpperCase();
    
//     let ignitionValue;
//     if (data === "START") {
//       ignitionValue = 1; // Assuming START = 1 based on IgnitionPropertyType
//     } else if (data === "STOP") {
//       ignitionValue = 0; // Assuming STOP = 0
//     } else {
//       throw new Error("Invalid state: use START or STOP");
//     }
    
//     console.log("IGNITION STATE:", data, "(value:", ignitionValue, ")");
//     return ignitionValue;
//   } catch (err) {
//     console.log("File error:", err.message);
//     return 1; // default START
//   }
// }

// function getSystemTimestamp() {
//   const now = new Date();
//   const seconds = Math.floor(now.getTime() / 1000);
//   const nanos = (now.getTime() % 1000) * 1000000;
//   return { seconds: seconds, nanos: nanos };
// }

// class TcpSender {
//   constructor(host, port) {
//     this.host = host;
//     this.port = port;
//     this.client = null;
//     this.reconnectInterval = 2000;
//     this.connecting = false;
//   }

//   async connect() {
//     if (this.connecting || this.client) return;
    
//     this.connecting = true;
//     console.log(`Connecting to ${this.host}:${this.port}...`);
    
//     const connectWithRetry = () => {
//       this.client = net.createConnection({ 
//         host: this.host, 
//         port: this.port, 
//         timeout: 5000 
//       }, () => {
//         console.log("TCP CONNECTED");
//         this.connecting = false;
//       });

//       this.client.setTimeout(10000);
      
//       this.client.on('data', (data) => {
//         console.log("RECEIVED:", data.length, "bytes:", data.toString('hex').slice(0, 50) + "...");
//       });
      
//       this.client.on('close', () => {
//         console.log("TCP DISCONNECTED");
//         this.client = null;
//         this.connecting = false;
//         setTimeout(() => this.connect(), this.reconnectInterval);
//       });
      
//       this.client.on('error', (err) => {
//         console.log("TCP ERROR:", err.message);
//         this.client = null;
//         this.connecting = false;
//         setTimeout(() => this.connect(), this.reconnectInterval);
//       });

//       this.client.on('timeout', () => {
//         console.log("TCP TIMEOUT");
//         this.client.destroy();
//       });
//     };

//     connectWithRetry();
//   }

//   send(buffer) {
//     if (!this.client || !this.client.writable) {
//       console.log("NO TCP CONNECTION - queuing...");
//       setTimeout(() => this.connect(), 100);
//       return false;
//     }

//     const success = this.client.write(buffer);
//     if (success) {
//       console.log("SENT SUCCESS (" + buffer.length + " bytes)");
//     } else {
//       console.log("BUFFER FULL - waiting for drain...");
//       this.client.once('drain', () => {
//         console.log("DRAIN COMPLETE - data sent");
//       });
//     }
//     return success;
//   }
// }

// async function main() {
//   console.log("Loading Event protobufs...");
  
//   const root = await protobuf.load([
//     "proto/jeep_event_message.proto",
//     "proto/jeep_event.proto", 
//     "proto/jeep_common.proto",
//     "proto/timestamp.proto"
//   ]);

//   const EventMessage = root.lookupType("stla.cvip.jeep.EventMessage");
//   const eTboxApplicationState = root.lookupEnum("stla.cvip.jeep.eTboxApplicationState");
//   const eTboxeSimState = root.lookupEnum("stla.cvip.jeep.eTboxeSimState");
//   const IgnitionPropertyType = root.lookupEnum("stla.cvip.jeep.IgnitionPropertyType");

//   console.log("IgnitionPropertyType values:", Object.keys(IgnitionPropertyType.values));
  
//   const tcpSender = new TcpSender('192.168.68.112', 8080); // Same host/port as your example
//   tcpSender.connect();

//   const IGNITION_STATE_FILE = "./two_byte.txt";

//   // Initial file check
//   if (!fs.existsSync(IGNITION_STATE_FILE)) {
//     fs.writeFileSync(IGNITION_STATE_FILE, "START");
//     console.log("Created default ignition_state.txt with 'START'");
//   }

//   console.log("Watching ignition_state.txt (Ctrl+C to stop)");
  
//   fs.watchFile(IGNITION_STATE_FILE, { interval: 100 }, async () => {
//     console.log("\n=== FILE CHANGED ===");
    
//     const ignitionStateValue = loadIgnitionStateFromFile(IGNITION_STATE_FILE);
//     const systemTime = getSystemTimestamp();

//     const FULL_OBJ = {
//       message_id: "dd52bab1-c64a-431b-a945-1602f26e9f4e",
//       e_Tbox_application_state: eTboxApplicationState.values.customer,
//       Tbox_esim_state: eTboxeSimState.values.normal_sim,
//       version: "1.0.0",
//       time_stamp: systemTime,
//       eventPayload: {
//         EventsData: [{
//           time_stamp: systemTime,
//           IgnitionStatus: {
//             IgnitionState: ignitionStateValue  // Dynamic from file
//           }
//         }]
//       }
//     };

//     console.log("SYSTEM TIME:", systemTime.seconds + "." + Math.floor(systemTime.nanos/1000000));
//     console.log("IGNITION:", ignitionStateValue === 1 ? "START" : "IGN_LK");

//     const msg = EventMessage.create(FULL_OBJ);
//     console.log("msg",msg);
    
//     const buffer = EventMessage.encode(msg).finish();
    
//     console.log("SIZE:", buffer.length, "bytes");
//     console.log("HEX:  ", buffer.toString('hex'));
//     console.log("SENDING...", tcpSender.send(buffer) ? "✅" : "⏳");
//     console.log("====================\n");
//   });

//   console.log("READY!");
//   console.log("Test commands:");
//   console.log("  echo START > ignition_state.txt");
//   console.log("  echo STOP > ignition_state.txt");
// }

// main().catch(console.error);



const protobuf = require("protobufjs");
const fs = require("fs");
const net = require("net");

function loadIgnitionStateFromFile(filePath, IgnitionPropertyType) {
  try {
    const data = fs.readFileSync(filePath, 'utf8').trim().toUpperCase();
    
    let ignitionValue;
    if (data === "START") {
      ignitionValue = IgnitionPropertyType.values.START; // 5
    } else if (data === "STOP") {
      ignitionValue = IgnitionPropertyType.values.IGN_LK; // 1
    } else {
      throw new Error("Invalid state: use START or STOP");
    }
    
    console.log("IGNITION STATE:", data, "(value:", ignitionValue, ")");
    return ignitionValue;
  } catch (err) {
    console.log("File error:", err.message);
    return IgnitionPropertyType.values.START;
  }
}

function getSystemTimestamp() {
  const now = new Date();
  const seconds = Math.floor(now.getTime() / 1000);
  const nanos = (now.getTime() % 1000) * 1000000;
  return { seconds: seconds, nanos: nanos };
}

// ✅ SINGLE OBJECT TEMPLATE - Used 3x
function createEventMessage(ignitionStateValue, systemTime, enums) {
  return {
    messageId: "dd52bab1-c64a-431b-a945-1602f26e9f4e",
    eTboxApplicationState: enums.eTboxApplicationState.values.customer,
    tboxEsimState: enums.eTboxeSimState.values.normal_sim,
    version: "1.0.0",
   // timeStamp: systemTime,
    eventPayload: {
      EventsData: [{
        timeStamp: systemTime,
        IgnitionStatus: {
          IgnitionState: ignitionStateValue
        }
      }]
    }
  };
}

class TcpSender {
  constructor(host, port) {
    this.host = host;
    this.port = port;
    this.client = null;
    this.reconnectInterval = 2000;
    this.connecting = false;
  }

  async connect() {
    if (this.connecting || this.client) return;
    
    this.connecting = true;
    console.log(`Connecting to ${this.host}:${this.port}...`);
    
    const connectWithRetry = () => {
      this.client = net.createConnection({ 
        host: this.host, 
        port: this.port, 
        timeout: 5000 
      }, () => {
        console.log("TCP CONNECTED");
        this.connecting = false;
      });

      this.client.setTimeout(10000);
      
      this.client.on('data', (data) => {
        console.log("RECEIVED:", data.length, "bytes:", data.toString('hex').slice(0, 50) + "...");
      });
      
      this.client.on('close', () => {
        console.log("TCP DISCONNECTED");
        this.client = null;
        this.connecting = false;
        setTimeout(() => this.connect(), this.reconnectInterval);
      });
      
      this.client.on('error', (err) => {
        console.log("TCP ERROR:", err.message);
        this.client = null;
        this.connecting = false;
        setTimeout(() => this.connect(), this.reconnectInterval);
      });

      this.client.on('timeout', () => {
        console.log("TCP TIMEOUT");
        this.client.destroy();
      });
    };

    connectWithRetry();
  }

  send(buffer) {
    if (!this.client || !this.client.writable) {
      console.log("NO TCP CONNECTION - queuing...");
      setTimeout(() => this.connect(), 100);
      return false;
    }

    const success = this.client.write(buffer);
    if (success) {
      console.log("SENT SUCCESS (" + buffer.length + " bytes)");
    } else {
      console.log("BUFFER FULL - waiting for drain...");
      this.client.once('drain', () => {
        console.log("DRAIN COMPLETE - data sent");
      });
    }
    return success;
  }
}

async function main() {
  console.log("Loading Event protobufs...");
  
  const root = await protobuf.load([
    "Jeep_proto/jeep_event_message.proto",
    "Jeep_proto/jeep_event.proto", 
    "Jeep_proto/jeep_common.proto",
    "Jeep_proto/timestamp.proto"
  ]);

  const EventMessage = root.lookupType("stla.cvip.jeep.EventMessage");
  const eTboxApplicationState = root.lookupEnum("stla.cvip.jeep.eTboxApplicationState");
  const eTboxeSimState = root.lookupEnum("stla.cvip.jeep.eTboxeSimState");
  const IgnitionPropertyType = root.lookupEnum("stla.cvip.jeep.IgnitionPropertyType");

  console.log("IgnitionPropertyType values:", Object.keys(IgnitionPropertyType.values));
  console.log("START =", IgnitionPropertyType.values.START);  // 5
  console.log("IGN_LK =", IgnitionPropertyType.values.IGN_LK); // 1
  
  const enums = { eTboxApplicationState, eTboxeSimState }; // ✅ Shared enums
  
  // *** PRINT ALL HEX BEFORE TCP CONNECTION ***
  console.log("\n=== PRE-TCP HEX DEBUG (START STATE) ===");
  
  const IGNITION_STATE_FILE = "./two_byte.txt";

  if (!fs.existsSync(IGNITION_STATE_FILE)) {
    fs.writeFileSync(IGNITION_STATE_FILE, "START");
    console.log("Created default two_byte.txt with 'START'");
  }

  const ignitionStateValue = loadIgnitionStateFromFile(IGNITION_STATE_FILE, IgnitionPropertyType);
  const systemTime = getSystemTimestamp();

  // ✅ SINGLE TEMPLATE - START
  const FULL_OBJ_START = createEventMessage(ignitionStateValue, systemTime, enums);
  console.log("FULL_OBJ_START JSON:");
  console.log(JSON.stringify(FULL_OBJ_START, null, 2));

  const msg_start = EventMessage.create(FULL_OBJ_START);
  const buffer_start = EventMessage.encode(msg_start).finish();
  
  console.log("\nSTART STATE - SIZE:", buffer_start.length, "bytes");
  console.log("START STATE - HEX:  ", buffer_start.toString('hex'));
  console.log("START STATE - PRETTY:", "<Buffer " + buffer_start.toString('hex').match(/.{1,4}/g).join(" ") + ">");
  console.log("====================\n");

  // ✅ SINGLE TEMPLATE - STOP  
  console.log("=== PRE-TCP HEX DEBUG (STOP STATE) ===");
  const FULL_OBJ_STOP = createEventMessage(IgnitionPropertyType.values.IGN_LK, systemTime, enums);
  console.log("FULL_OBJ_STOP JSON:");
  console.log(JSON.stringify(FULL_OBJ_STOP, null, 2));

  const msg_stop = EventMessage.create(FULL_OBJ_STOP);
  const buffer_stop = EventMessage.encode(msg_stop).finish();
  
  console.log("\nSTOP STATE - SIZE:", buffer_stop.length, "bytes");
  console.log("STOP STATE - HEX:  ", buffer_stop.toString('hex'));
  console.log("STOP STATE - PRETTY:", "<Buffer " + buffer_stop.toString('hex').match(/.{1,4}/g).join(" ") + ">");
  console.log("====================\n");

  // *** NOW START TCP ***
  const tcpSender = new TcpSender('192.168.68.123', 8080);
  tcpSender.connect();

  console.log("Watching two_byte.txt (Ctrl+C to stop)");
  
  fs.watchFile(IGNITION_STATE_FILE, { interval: 100 }, async () => {
    console.log("\n=== FILE CHANGED ===");
    
    const ignitionStateValue = loadIgnitionStateFromFile(IGNITION_STATE_FILE, IgnitionPropertyType);
    const systemTime = getSystemTimestamp();

    // ✅ SINGLE TEMPLATE - File watcher
    const FULL_OBJ = createEventMessage(ignitionStateValue, systemTime, enums);

    console.log("SYSTEM TIME:", systemTime.seconds + "." + Math.floor(systemTime.nanos/1000000));
    console.log("IGNITION:", ignitionStateValue === IgnitionPropertyType.values.START ? "START" : "IGN_LK");

    const msg = EventMessage.create(FULL_OBJ);
    console.log("msg:", JSON.stringify(msg, null, 2));
    
    const buffer = EventMessage.encode(msg).finish();
    
    console.log("SIZE:", buffer.length, "bytes");
    console.log("HEX:  ", buffer.toString('hex'));
    console.log("SENDING...", tcpSender.send(buffer) ? "✅" : "⏳");
    console.log("====================\n");
  });

  console.log("READY!");
  console.log("Test commands:");
  console.log("  echo START > two_byte.txt");
  console.log("  echo STOP > two_byte.txt");
}

main().catch(console.error);

