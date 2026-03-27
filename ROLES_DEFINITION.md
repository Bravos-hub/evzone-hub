# EMSP and CPO Role Definitions

This document provides a formal definition of the roles of e-Mobility Service Providers (EMSP) and Charge Point Operators (CPO) within the EVzone platform, aligned with international standards (ISO 15118, IEC 63110) and industry protocols (OCPI, OCPP).

## 1. e-Mobility Service Provider (eMSP / MSP)

The **e-Mobility Service Provider** is the service-oriented actor that manages the relationship with the EV driver. Their primary goal is to provide a seamless charging experience across multiple networks.

### Core Responsibilities
- **User Management**: Authentication and authorization of EV drivers.
- **Payment & Invoicing**: Handling financial transactions, subscriptions, and billing for end-users.
- **Roaming**: Establishing interoperability with various CPO networks via **OCPI**.
- **Customer Interface**: Providing mobile apps, RFID cards, and map services for charger discovery.
- **Contract Management**: Issuing digital certificates for **ISO 15118** (Plug & Charge).

---

## 2. Charge Point Operator (CPO)

The **Charge Point Operator** is the infrastructure-oriented actor responsible for the physical operation and maintenance of charging stations.

### Core Responsibilities
- **Asset Management**: Installation, hardware maintenance, and technical uptime.
- **Station Control**: Managing hardware communication via **OCPP**.
- **Energy Management**: Implementing Smart Charging, load balancing, and grid integration (V1G/V2G).
- **Session Tracking**: Recording energy consumption and meter values for B2B settlement.
- **Integration**: Providing real-time status and session data to EMSPs via **OCPI**.
- **Security**: Managing **ISO 15118** SECC certificates for secure vehicle-to-grid communication.

---

## 3. Technical Ecosystem

| Protocol/Standard | Primary Actor(s) | Function |
| :--- | :--- | :--- |
| **OCPP** | CPO | Hardware-to-Backend communication. |
| **OCPI** | EMSP & CPO | Roaming and B2B data exchange. |
| **ISO 15118** | EMSP, CPO, EV | Secure V2G and Plug & Charge communication. |
| **IEC 63110** | CPO, EMSP | Higher-level management of charging infrastructure. |
| **IEC 61851** | CPO | Basic electrical and safety signaling. |
