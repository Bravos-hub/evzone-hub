EVzone Sequence Diagrams (OCPP + OCPI + Portal)

Legend
- CPMS API: Core backend for tenants, stations, sessions, billing, and OCPI roles.
- OCPP Gateway: WebSocket server handling charger connectivity.
- OCPI Gateway: OCPI interfaces for CPO and eMSP roles.
- SSE Gateway: Real-time stream to portal and apps.

OCPP Boot + Status to Portal
```mermaid
sequenceDiagram
    autonumber
    participant Charger
    participant OCPP as OCPP Gateway
    participant CPMS as CPMS API
    participant Bus as Event Bus
    participant SSE as SSE Gateway
    participant Portal as EVzone Portal

    Charger->>OCPP: BootNotification
    OCPP-->>Charger: BootNotification.conf (Accepted, heartbeat interval)

    loop Periodic heartbeat
        Charger->>OCPP: Heartbeat
        OCPP-->>Charger: Heartbeat.conf
    end

    Charger->>OCPP: StatusNotification (EVSE/Connector)
    OCPP->>CPMS: Upsert charger + EVSE status
    CPMS-->>Bus: Publish StatusUpdated
    SSE-->>Bus: Consume StatusUpdated
    SSE-->>Portal: Push live status update
```

Local Charging Session + CDR Push to External eMSP
```mermaid
sequenceDiagram
    autonumber
    participant Driver as Driver App/Portal
    participant CPMS as CPMS API (CPO role)
    participant OCPP as OCPP Gateway
    participant Charger
    participant OCPI as OCPI Gateway (CPO)
    participant eMSP as External eMSP
    participant SSE as SSE Gateway

    Driver->>CPMS: Start session (site + connector)
    CPMS->>OCPP: RemoteStartTransaction
    OCPP->>Charger: RemoteStartTransaction.req
    Charger-->>OCPP: RemoteStartTransaction.conf (Accepted)
    Charger->>OCPP: StartTransaction / TransactionEvent
    OCPP->>CPMS: SessionStarted + meter baseline
    CPMS->>OCPI: PUT Session (ACTIVE)
    OCPI->>eMSP: PUT Session (ACTIVE)
    CPMS-->>SSE: SessionStarted event
    SSE-->>Driver: Live session view

    loop Meter values
        Charger->>OCPP: MeterValues / TransactionEvent
        OCPP->>CPMS: SessionUpdate (energy, duration)
    end

    Charger->>OCPP: StopTransaction / TransactionEvent
    OCPP->>CPMS: SessionEnded
    CPMS->>CPMS: Calculate costs + generate CDR
    CPMS->>OCPI: POST CDR
    OCPI->>eMSP: POST CDR
    CPMS-->>SSE: SessionCompleted + receipt
    SSE-->>Driver: Session summary + payment status
```

Inbound OCPI Command (External eMSP -> EVzone CPO -> OCPP)
```mermaid
sequenceDiagram
    autonumber
    participant eMSP as External eMSP
    participant OCPI as OCPI Gateway (CPO receiver)
    participant CPMS as CPMS API
    participant OCPP as OCPP Gateway
    participant Charger

    eMSP->>OCPI: POST /commands/START_SESSION (response_url)
    OCPI-->>eMSP: CommandResponse (ACCEPTED + timeout)
    OCPI->>CPMS: Validate location + token
    CPMS->>OCPP: RemoteStartTransaction
    OCPP->>Charger: RemoteStartTransaction.req
    Charger-->>OCPP: RemoteStartTransaction.conf
    Charger->>OCPP: StartTransaction / TransactionEvent
    OCPP->>CPMS: SessionStarted
    CPMS->>OCPI: POST response_url (CommandResult)
    OCPI->>eMSP: POST response_url (CommandResult)
    CPMS->>OCPI: PUT Session (ACTIVE)
    OCPI->>eMSP: PUT Session (ACTIVE)
```

Outbound OCPI Command (EVzone eMSP -> External CPO -> OCPP)
```mermaid
sequenceDiagram
    autonumber
    participant Driver as Driver App
    participant CPMS as CPMS API (eMSP role)
    participant OCPI as OCPI Gateway (eMSP sender)
    participant CPO as External CPO OCPI
    participant OCPP as External OCPP Gateway
    participant Charger

    Driver->>CPMS: Start session (roaming location)
    CPMS->>OCPI: POST /commands/START_SESSION (response_url)
    OCPI->>CPO: POST /commands/START_SESSION (response_url)
    CPO-->>OCPI: CommandResponse (ACCEPTED + timeout)
    OCPI-->>CPMS: CommandResponse (ACCEPTED + timeout)
    CPO->>OCPP: RemoteStartTransaction.req
    OCPP->>Charger: RemoteStartTransaction.req
    Charger-->>OCPP: RemoteStartTransaction.conf
    Charger->>OCPP: StartTransaction / TransactionEvent
    CPO->>OCPI: POST response_url (CommandResult)
    OCPI->>CPMS: POST response_url (CommandResult)
    CPO->>OCPI: PUT Session (ACTIVE)
    OCPI->>CPMS: PUT Session (ACTIVE)
```

Real-time Authorization (Token whitelist = NEVER)
```mermaid
sequenceDiagram
    autonumber
    participant Charger
    participant OCPP as OCPP Gateway
    participant CPMS as CPMS API (CPO role)
    participant OCPI as OCPI Gateway (CPO)
    participant eMSP as External eMSP

    Charger->>OCPP: Authorize.req (token)
    OCPP->>CPMS: Check token cache
    CPMS->>OCPI: POST /tokens/{token}/authorize
    OCPI->>eMSP: POST /tokens/{token}/authorize
    eMSP-->>OCPI: AuthorizationInfo (ALLOWED/BLOCKED)
    OCPI-->>CPMS: AuthorizationInfo
    CPMS-->>OCPP: Authorization decision
    OCPP-->>Charger: Authorize.conf (Accepted/Blocked)
```
