# Rule Engine Feature & Library Documentation

This document provides a detailed mapping of features within the Rule Engine application to the libraries that power them.

## 1. Core Technologies

| Library | Version | Purpose |
| :--- | :--- | :--- |
| **React** | `^18.3.1` | UI library for component-based architecture. |
| **Vite** | `^7.2.2` | Fast build tool and dev server. |
| **Chakra UI** | `^2.10.0` | Main component library for styling and layout. |
| **Redux Toolkit** | `^2.11.0` | State management for persisting application data. |
| **Lucide React** | `^0.447.0` | Modern, clean icon set used throughout the dashboard. |
| **React Icons** | `^5.4.0` | Supplemental icons (FontAwesome, etc.) for specialized components. |
| **Framer Motion** | `^11.18.2` | Advanced animations and transitions. |
| **Axios** | `^1.7.7` | HTTP client for potential API interactions. |

---

## 2. Feature-Specific Library Usage

### 📊 Rule Builder
Allows users to create, test, and save custom logic rules for vehicle behavior.
- **Libraries**: `Chakra UI` (Forms, Modals, Layout), `React Icons` (UI elements).
- **Key Component**: [RuleBuilder.jsx](file:///d:/Rule_Engine_updated/src/components/RuleEngine/RuleBuilder.jsx)

### 🏎️ Simulation Dashboard
The central hub for running vehicle simulations and monitoring state.
- **Libraries**: `Chakra UI` (Tabs, Grids, Toasts), `Lucide React` (Status icons), `Framer Motion` (UI transitions).
- **Key Component**: [RuleEngineDashboard.jsx](file:///d:/Rule_Engine_updated/src/components/RuleEngine/RuleEngineDashboard.jsx)

### 🛰️ CAN Signal Builder & Code Generator
Tool for defining CAN signals and generating MISRA-C compliant firmware code.
- **Libraries**: `Chakra UI` (Table, Modal, NumberInput), `React Icons` (Code icons).
- **Logic**: Custom string templates in `canCodeGenerator.js`.
- **Key Component**: [CANSignalBuilder.jsx](file:///d:/Rule_Engine_updated/src/components/RuleEngine/CANSignalBuilder.jsx)

### 📈 Data Visualizer
Real-time visualization of vehicle data history (e.g., Speed history).
- **Libraries**: `Chakra UI` (Stats, Cards), `Vanilla SVG` (Custom line charts).
- **Key Component**: [DataVisualizer.jsx](file:///d:/Rule_Engine_updated/src/components/RuleEngine/DataVisualizer.jsx)

### 🔄 Lifecycle & Trip Configuration
Fine-tunning device behavior across different lifecycle states and trip parameters.
- **Libraries**: `Chakra UI` (Switch, Select, Cards), `Lucide React` (Settings icons).
- **Key Components**: [LifecycleConfig.jsx](file:///d:/Rule_Engine_updated/src/components/RuleEngine/LifecycleConfig.jsx), [TripConfiguration.jsx](file:///d:/Rule_Engine_updated/src/components/RuleEngine/TripConfiguration.jsx)

### 🛠️ Hex Converter
A utility to convert raw CAN data into structured C-style arrays.
- **Libraries**: `Chakra UI` (Modal, Input), `React Icons`.
- **Key Component**: Integrated inside `CANSignalBuilder.jsx`.

### 📦 Payload Generation (Southbound)
Simulates communication with the server using specific JSON payloads.
- **Logic**: Custom utility functions in `SouthBoundPayloads.js`.
- **Primary Use**: Triggered via [RuleEngineDashboard.jsx](file:///d:/Rule_Engine_updated/src/components/RuleEngine/RuleEngineDashboard.jsx).

---

## 3. Storage & Persistence
- **useAutoPersist**: A custom hook using `localStorage` and `Redux` (logic-wise) to ensure simulation states survive page refreshes.
- **Redux Persist**: Configured to handle more complex state persistence if needed (referenced in `package.json`).
