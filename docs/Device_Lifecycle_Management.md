# Device Lifecycle Management - Sequence Documentation

## Overview
This document describes the complete device lifecycle management process from factory initialization through customer activation. The device progresses through four distinct states: **FACTORY** → **PROVISIONED** → **AUTHORIZED** → **CUSTOMER**.

---

## Lifecycle States

### 1. FACTORY State
**Purpose**: Initial device manufacturing and registration  
**Duration**: During manufacturing process  
**Key Activities**:
- Device hardware assembly
- Firmware flashing
- Initial device registration
- Quality assurance testing

### 2. PROVISIONED State
**Purpose**: Device configuration for network connectivity  
**Duration**: During warehouse/inventory management  
**Key Activities**:
- Network configuration (APN settings)
- Server endpoint configuration
- Security certificate installation
- First connectivity test

### 3. AUTHORIZED State
**Purpose**: Device assignment to customer account  
**Duration**: During sales/distribution process  
**Key Activities**:
- Customer account linking
- Authorization token generation
- Customer-specific configuration
- Access control setup

### 4. CUSTOMER State
**Purpose**: Active device in customer's vehicle  
**Duration**: Operational lifetime  
**Key Activities**:
- Real-time telemetry transmission
- Trip monitoring and detection
- Alert generation and processing
- Continuous data streaming

---

## Detailed Sequence Flow

### Phase 1: Factory Initialization

```
┌────────┐         ┌────────────────┐         ┌─────────────┐
│ Device │         │ Factory System │         │ Backend API │
└───┬────┘         └───────┬────────┘         └──────┬──────┘
    │                      │                         │
    │  1. Power On         │                         │
    │─────────────────────>│                         │
    │                      │                         │
    │  2. Flash Firmware   │                         │
    │<─────────────────────│                         │
    │                      │                         │
    │  3. Configure Base   │                         │
    │<─────────────────────│                         │
    │                      │                         │
    │  4. Report ID & MAC  │                         │
    │─────────────────────>│                         │
    │                      │                         │
    │                      │  5. Register Device     │
    │                      │────────────────────────>│
    │                      │                         │
    │                      │  6. Registered (FACTORY)│
    │                      │<────────────────────────│
```

**Steps**:
1. **Power On**: Device boots for the first time
2. **Flash Firmware**: Factory system loads the base firmware
3. **Configure Base Settings**: Set factory defaults (baud rate, hardware config)
4. **Report Device ID & MAC**: Device sends unique identifiers
5. **Register Device**: Factory system registers device in backend
6. **Status Update**: Backend confirms registration with FACTORY status

**Data Exchanged**:
- Device ID (unique identifier)
- MAC Address
- Serial Number
- Hardware Version
- Firmware Version

---

### Phase 2: Provisioning

```
┌────────┐    ┌──────────────────────┐    ┌─────────────┐
│ Device │    │ Provisioning Service │    │ Backend API │
└───┬────┘    └──────────┬───────────┘    └──────┬──────┘
    │                    │                       │
    │                    │  1. Request Provision │
    │                    │──────────────────────>│
    │                    │                       │
    │  2. Send Provisioning Config              │
    │<──────────────────────────────────────────│
    │                    │                       │
    │  3. Acknowledge Config                    │
    │──────────────────────────────────────────>│
    │                    │                       │
    │  4. First Heartbeat                       │
    │──────────────────────────────────────────>│
    │                    │                       │
    │  5. Provisioning Complete (PROVISIONED)   │
    │<──────────────────────────────────────────│
```

**Steps**:
1. **Request Provisioning**: Provisioning service initiates device setup
2. **Send Config**: Backend sends network and server configuration
3. **Acknowledge**: Device confirms receipt of configuration
4. **First Heartbeat**: Device establishes connectivity
5. **Status Update**: Backend updates status to PROVISIONED

**Configuration Data**:
- APN Settings (for cellular connectivity)
- Server URLs (data endpoints)
- SSL/TLS Certificates
- Communication Protocol Settings
- Heartbeat Interval
- Data Upload Frequency

---

### Phase 3: Authorization

```
┌────────┐    ┌──────────────────────┐    ┌─────────────┐
│ Device │    │ Authorization Service│    │ Backend API │
└───┬────┘    └──────────┬───────────┘    └──────┬──────┘
    │                    │                       │
    │                    │  1. Authorize Device  │
    │                    │──────────────────────>│
    │                    │                       │
    │  2. Send Auth Token & Customer Config     │
    │<──────────────────────────────────────────│
    │                    │                       │
    │  3. Validate Authorization                │
    │──────────────────────────────────────────>│
    │                    │                       │
    │                    │  4. Auth Success      │
    │                    │<──────────────────────│
    │                    │                       │
    │  5. Update Status (AUTHORIZED)            │
    │<──────────────────────────────────────────│
```

**Steps**:
1. **Authorize Device**: Link device to customer account
2. **Send Auth Token**: Provide authentication credentials
3. **Validate**: Device validates authorization token
4. **Confirm Success**: Backend confirms authorization
5. **Status Update**: Device status changed to AUTHORIZED

**Authorization Data**:
- Customer ID
- Authorization Token (JWT or similar)
- Customer Configuration Profile
- Access Permissions
- Data Retention Policies

---

### Phase 4: Customer Activation

```
┌────────┐    ┌─────────────────┐    ┌─────────────┐
│ Device │    │ Customer Portal │    │ Backend API │
└───┬────┘    └────────┬────────┘    └──────┬──────┘
    │                  │                    │
    │                  │  1. Activate Device│
    │                  │───────────────────>│
    │                  │                    │
    │  2. Send Customer Settings (Rules)    │
    │<──────────────────────────────────────│
    │                  │                    │
    │  3. Start Trip Monitoring             │
    │──────────────────────────────────────>│
    │                  │                    │
    │  4. Send Telemetry Data               │
    │──────────────────────────────────────>│
    │                  │                    │
    │                  │  5. Device Active  │
    │                  │<───────────────────│
    │                  │                    │
    │                  │  6. Display Live   │
    │                  │────────────>       │
```

**Steps**:
1. **Activate Device**: Customer initiates device activation
2. **Send Settings**: Backend sends customer-specific rules and alerts
3. **Start Monitoring**: Device begins trip detection
4. **Send Telemetry**: Continuous data streaming begins
5. **Confirm Active**: Backend confirms CUSTOMER status
6. **Display Data**: Customer portal shows live vehicle data

**Customer Settings**:
- Trip Detection Rules (IGN_ON/IGN_OFF thresholds)
- Alert Configurations:
  - Speed Alerts (80 km/h, 120 km/h)
  - Harsh Acceleration/Braking
  - Tow-Away Alert
  - Engine Idling Alert
  - Parking Disturbance
  - Dongle Status Alert
- Geofence Definitions
- Reporting Intervals
- Data Privacy Settings

---

## State Transition Rules

### FACTORY → PROVISIONED
**Trigger**: Provisioning service request  
**Conditions**:
- Device must be in FACTORY state
- Device must have valid firmware
- Device must respond to provisioning commands

**Rollback**: If provisioning fails, device remains in FACTORY state

### PROVISIONED → AUTHORIZED
**Trigger**: Authorization service request  
**Conditions**:
- Device must be in PROVISIONED state
- Valid customer account must exist
- Device must establish secure connection

**Rollback**: If authorization fails, device remains in PROVISIONED state

### AUTHORIZED → CUSTOMER
**Trigger**: Customer activation request  
**Conditions**:
- Device must be in AUTHORIZED state
- Customer must complete activation process
- Device must be installed in vehicle (IGN signals detected)

**Rollback**: Device can be deactivated back to AUTHORIZED state

### CUSTOMER → AUTHORIZED (Deactivation)
**Trigger**: Customer deactivation or device transfer  
**Conditions**:
- Customer initiates deactivation
- Device is removed from vehicle
- All pending data is uploaded

---

## Trip State Machine Integration

When in **CUSTOMER** state, the device operates a trip state machine:

```
TRIP_IDLE ──(IGN_ON)──> TRIP_ACTIVE ──(IGN_OFF)──> TRIP_PAUSED
    ↑                                                    │
    └──────────(MAX_IGN_OFF_TIME exceeded)──────────────┘
```

**States**:
- **TRIP_IDLE**: No active trip, waiting for ignition
- **TRIP_ACTIVE**: Vehicle running, collecting telemetry
- **TRIP_PAUSED**: Ignition off, but trip not ended (short stop)

**Parameters**:
- `MIN_IGN_OFF_TIME`: Minimum time before trip can end (e.g., 5 minutes)
- `MAX_IGN_OFF_TIME`: Maximum pause duration before trip ends (e.g., 30 minutes)

---

## Error Handling & Edge Cases

### Communication Failures
- **During Provisioning**: Device retries with exponential backoff
- **During Authorization**: Device remains in PROVISIONED state, alerts backend
- **During Operation**: Device buffers data locally, uploads when connection restored

### Invalid State Transitions
- Attempts to skip states (e.g., FACTORY → CUSTOMER) are rejected
- Backend validates all state transition requests
- Audit log maintained for all state changes

### Device Reset
- Factory reset returns device to FACTORY state
- Soft reset maintains current lifecycle state
- Configuration reset maintains lifecycle but clears customer settings

### Lifecycle Rollback
- Devices can be rolled back to previous states for maintenance
- Rollback requires administrative approval
- All rollbacks are logged for compliance

---

## API Endpoints

### Device Registration (Factory)
```
POST /api/devices/register
Body: {
  "deviceId": "DEV-12345",
  "macAddress": "AA:BB:CC:DD:EE:FF",
  "serialNumber": "SN-2024-001",
  "hardwareVersion": "v2.1",
  "firmwareVersion": "v1.5.3"
}
Response: {
  "status": "FACTORY",
  "registeredAt": "2026-01-02T10:53:50Z"
}
```

### Device Provisioning
```
POST /api/devices/provision
Body: {
  "deviceId": "DEV-12345",
  "apnSettings": {...},
  "serverConfig": {...}
}
Response: {
  "status": "PROVISIONED",
  "provisionedAt": "2026-01-02T11:00:00Z"
}
```

### Device Authorization
```
POST /api/devices/authorize
Body: {
  "deviceId": "DEV-12345",
  "customerId": "CUST-789",
  "authToken": "eyJhbGc..."
}
Response: {
  "status": "AUTHORIZED",
  "authorizedAt": "2026-01-02T11:15:00Z"
}
```

### Device Activation
```
POST /api/devices/activate
Body: {
  "deviceId": "DEV-12345",
  "vehicleInfo": {...},
  "ruleConfig": {...}
}
Response: {
  "status": "CUSTOMER",
  "activatedAt": "2026-01-02T11:30:00Z"
}
```

---

## Security Considerations

### Factory Phase
- Secure boot enabled
- Firmware signed with manufacturer key
- Device ID cryptographically generated

### Provisioning Phase
- TLS 1.3 for all communications
- Certificate pinning
- Mutual authentication (device ↔ server)

### Authorization Phase
- JWT tokens with short expiration
- Token refresh mechanism
- Role-based access control (RBAC)

### Customer Phase
- End-to-end encryption for telemetry data
- Data anonymization options
- Compliance with GDPR/privacy regulations

---

## Monitoring & Observability

### Metrics to Track
- Time spent in each lifecycle state
- Provisioning success/failure rates
- Authorization success/failure rates
- Activation completion rates
- State transition errors

### Alerts
- Device stuck in FACTORY state > 7 days
- Provisioning failures > 3 attempts
- Authorization failures
- Unexpected state transitions
- Communication timeouts

### Logging
- All state transitions logged with timestamp
- User/service initiating each transition
- Configuration changes tracked
- Error conditions and recovery actions

---

## Compliance & Audit

### Audit Trail
Every lifecycle state change is logged with:
- Timestamp
- Previous state
- New state
- Initiating user/service
- Reason for change
- Associated configuration changes

### Retention
- Lifecycle logs retained for 7 years
- Configuration snapshots at each state transition
- Compliance reports generated monthly

---

## Related Documentation
- [Rule Engine Specification](./RuleEngine_Specification.md)
- [Trip Detection State Machine](./Trip_Detection.md)
- [Alert Definitions (TE-01)](./TE01_Alert_Definitions.md)
- [API Reference](./API_Reference.md)

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-02  
**Author**: Rule Engine Team
