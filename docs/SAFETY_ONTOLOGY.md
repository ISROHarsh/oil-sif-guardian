# OIL-SIF Guardian — Safety Ontology & Taxonomies

## 1. Safety Ontology Dimensions

The platform defines 8 core interconnected safety dimensions:

```text
[ACTIVITY] ──involves──> [HAZARD] ──releases──> [HAZARDOUS ENERGY]
                              │
                              ├──exposes──> [WORKER EXPOSURE]
                              │
                              ├──mitigated by──> [CRITICAL BARRIER]
                              │                       │
                              │                  [BARRIER DEGRADATION / FAILURE]
                              │                       │
                              ▼                       ▼
                    [CREDIBLE CONSEQUENCE] <──────────┘
                              │
                              ▼
                      [PSIF POTENTIAL]
                              │
                              ▼
                  [IOGP LIFE-SAVING RULES]
```

---

## 2. The SIF Exposure Fingerprint

To prevent superficial keyword matching and enable true organizational recurrence detection, every incident is codified into a standardized **5-tuple SIF Exposure Fingerprint**:

$$\text{SIF Fingerprint} = [\text{ACTIVITY}] \mid [\text{HAZARDOUS ENERGY}] \mid [\text{HAZARD}] \mid [\text{BARRIER FAILURE}] \mid [\text{IOGP RULE}]$$

### Example Representations:
- `VESSEL_MAINTENANCE|CHEMICAL|CONFINED_SPACE_TOXIC_GAS|ATMOSPHERIC_TEST_OMITTED|CONFINED_SPACE`
- `WELLHEAD_REPAIR|PRESSURE|HIGH_PRESSURE_GAS_RELEASE|LOTO_ISOLATION_FAILED|ENERGY_ISOLATION`
- `DRILL_COLLAR_LIFTING|GRAVITY|SUSPENDED_TUBULAR_LOAD|WORKER_IN_DROP_ZONE|SAFE_MECHANICAL_LIFTING`
- `TANK_BATTERY_WELDING|THERMAL|HYDROCARBON_FLAMMABLE_VAPOR|FIRE_WATCH_ABSENT|HOT_WORK`
- `MAST_INSPECTION|GRAVITY|ELEVATED_DERRICK_FALL|100_PERCENT_TIE_OFF_FAILED|WORKING_AT_HEIGHT`

---

## 3. Hierarchical Barrier Taxonomy (Swiss Cheese Model)

Barriers are categorized into three fundamental tiers:

### 3.1 Hardware / Engineered Barriers
Physical devices and engineering controls that prevent or mitigate energy release:
- **Primary Containment**: Well casing, production tubing, certified pressure vessels, ANSI/API flanges.
- **Secondary Containment**: Blowout Preventer (BOP) stack (pipe rams, blind rams, annular preventer), Emergency Shutdown (ESD) valves, Pressure Safety Valves (PSV), rupture discs, check valves, flame arrestors.
- **Detection & Physical Mitigation**: Fire & Gas (F&G) detectors, fixed and personal H2S gas monitors, deluge water systems, blast barriers, whip checks on high-pressure hoses, crown-o-matic rig crown saver.

### 3.2 Administrative / Procedural Barriers
Management systems, authorizations, and verification procedures:
- **Work Authorization**: Permit to Work (PTW - Hot Work, Cold Work, Confined Space Entry) compliant with **OISD-STD-105**.
- **Risk Assessment**: Job Safety Analysis (JSA/JHA), Daily Toolbox Talks (TBT), SIMOPS matrix coordination.
- **Energy Isolation (LOTO)**: Lockout / Tagout procedures, Double Block and Bleed (DBB) isolation, Blind/Spade installation certificate, Zero energy physical verification.
- **Procedural Controls**: Journey Management Plan (JMP), Management of Change (MOC), Rig Move Checklist.

### 3.3 Human Action / Behavioral Barriers
Critical operational behaviors and dedicated safety personnel:
- **Dedicated Watchers**: Certified Standby Attendant (Hole Watch) for confined spaces under DGMS-OMR-2017 Rule 72, continuous Fire Watch for hot work, dedicated Banksman / Signalman for crane lifts.
- **Critical Behaviors**: 100% Tie-Off using full-body harness above 1.8m, staying out of the Line of Fire and active drop zones, maintaining speed limits and wearing 3-point seatbelts on lease roads.

### 3.4 Barrier Degradation & Failure States
Every barrier identified in an event narrative is evaluated against 5 standardized health states:
1. **`EFFECTIVE`**: Barrier was in place, verified, and functioning properly.
2. **`DEGRADED`**: Barrier was present but partially degraded, leaking, or nearing mechanical fatigue.
3. **`FAILED`**: Barrier physically ruptured, fractured, or failed under operational pressure or load.
4. **`BYPASSED`**: Barrier was intentionally disabled, overridden, jumpered, gagged, or silenced without authorized MOC.
5. **`ABSENT`**: Mandatory barrier required by safety standards was completely omitted or missing.

---

## 4. Oil India Limited (OIL) Operational Asset Taxonomy

The ontology defines domain knowledge specific to OIL Northeast India upstream operations:

### 4.1 Upstream Operating Facilities
- **Drilling Rigs**: OIL-45, OIL-78, OIL-12, Heavy Drilling Rigs (1500HP / 2000HP).
- **Workover Units (WOU)**: WOU-12, WOU-24, WOU-08 (Rig servicing and artificial lift maintenance).
- **Early Production Systems (EPS)**: EPS-1, EPS-2, Wellhead Separator Packages.
- **Oil Collecting Stations (OCS)**: OCS-1 Naharkatia, OCS-4 Moran, OCS-8 Digboi, Gathering Manifolds.
- **Gas Compressor Plants (GCP)**: GCP-Duliajan, GCP-Kusijan (High-pressure gas lift and pipeline injection).
- **Central Tank Farm (CTF)**: CTF-Duliajan (Crude storage and dispatch).
- **Pipelines**: NH-37 Crude Pipeline Corridor, Trunk Gas Pipelines, Wellhead Flowlines.

### 4.2 Operating Fields
- Duliajan, Naharkatia (NHK), Moran, Digboi, Tengakhat, Kusijan, Jorajan, Barekuri, Baghjan, Shalmari.

### 4.3 Regulatory Mandates (Indian Oil & Gas Sector)
- **OISD-STD-105**: Work Permit System for Petroleum & Petrochemical Plants.
- **OISD-STD-141**: Electrical Submersible Pump (ESP) design and electrical isolation standards.
- **DGMS Oil Mines Regulations 2017 (OMR)**: Statutory hazardous atmosphere gas testing (Rules 72 & 73) and machinery safeguarding.
- **PNGRB T4S**: Technical Standards and Specifications including Safety Standards for pipelines and installations.

---

## 5. The 9 IOGP Life-Saving Rules (Version Locked)

1. **Bypassing Safety Controls**: Obtain authorization before overriding or disabling safety-critical equipment or controls.
2. **Confined Space**: Obtain authorization before entering a confined space; verify atmosphere testing and assign continuous attendant.
3. **Driving**: Follow journey management rules, wear seatbelts, obey speed limits, and never use mobile devices while driving.
4. **Energy Isolation**: Verify isolation and zero energy state (LOTO) before beginning work on pressurized or energized equipment.
5. **Hot Work**: Identify and control ignition sources, conduct atmospheric monitoring, and obtain hot work permits in classified zones.
6. **Line of Fire**: Keep yourself and others out of the path of moving vehicles, suspended loads, high-pressure releases, and coiled springs.
7. **Safe Mechanical Lifting**: Plan lifts, inspect rigging, establish exclusion zones, and never walk under a suspended load.
8. **Work Authorization**: Confirm that valid permits, hazard assessments (JSA/JHA), and toolbox talks are completed before starting work.
9. **Working at Height**: Protect yourself against falls when working at height (>1.8m) using certified full-body harness and 100% tie-off.
