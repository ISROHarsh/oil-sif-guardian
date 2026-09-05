# OIL-SIF Guardian — Safety Ontology & Taxonomies

## 1. Safety Ontology Dimensions

The platform defines 8 core interconnected safety dimensions:

```text
[ACTIVITY] ──involves──> [HAZARD] ──releases──> [HAZARDOUS ENERGY]
                              │
                              ├──exposes──> [WORKER EXPOSURE]
                              │
                              ├──mitigated by──> [CRITICAL CONTROL]
                              │                       │
                              │                  [CONTROL FAILURE]
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

## 2. Taxonomy Definitions

### 2.1 Hazardous Energy Categories
- **Pressure Energy**: Pressurized hydrocarbons, pneumatic lines, hydraulic kick, casing/tubing pressure, mud line blowouts.
- **Mechanical Energy**: Rotating drill pipes, winches, belts, couplings, centrifuges, vibrating pumps, moving heavy machinery.
- **Gravity / Suspended Load**: Drill collars, casing pipes hoisted on rig mast, crane loads, working at height (>1.8m), dropped objects.
- **Chemical / Toxic Energy**: Hydrogen Sulfide (H2S), toxic gas pockets, caustic drilling mud additives, volatile crude condensate.
- **Electrical Energy**: High-voltage generator connections, switchgear, electrical submersible pumps (ESP), temporary wiring.
- **Thermal Energy**: Flare lines, hot exhaust, steam boilers, welding sparks in hazardous zone 1/2.
- **Vehicle / Kinetic Energy**: Heavy crude tankers, crew transport vehicles on unpaved lease roads, forklifts.

### 2.2 Worker Exposure States
- **Direct**: Worker is physically within the direct trajectory or danger zone (e.g. inside tank, under suspended tubulars).
- **Nearby**: Worker is within blast radius, flash area, or projectile hazard zone without barriers.
- **Potential**: Worker was scheduled or likely to enter the hazard zone had timing aligned.
- **None / Isolated**: Worker was fully isolated behind engineered barriers or outside zone.

### 2.3 Critical Control States
- **Present & Effective**: Barrier in place, verified, and functioning (e.g. tested blind flange, double block and bleed).
- **Bypassed / Defeated**: Safety interlock or relief valve intentionally overridden or defeated without authorization.
- **Failed / Inadequate**: Control was initiated but failed mechanically or operationally (e.g. gasket rupture during hydro-test).
- **Absent / Missing**: Mandatory control was completely omitted (e.g. no gas testing prior to vessel entry).
- **Unknown / Unspecified**: Narrative does not specify control status.

### 2.4 Credible Severe Consequence
- **Fatality**: High probability of fatal outcome without fortunate circumstance.
- **Permanent Impairment**: Amputation, severe crushed limb, blindness, irreversible toxic lung damage.
- **Serious Injury / Lost Time**: Fractures, extensive second/third-degree burns, hospitalization > 48 hours.
- **Minor / First Aid**: Superficial cuts, bruises, minor sprains.
- **No Harm**: Near miss with zero physical injury sustained.

---

## 3. The 9 IOGP Life-Saving Rules (Version Locked)

1. **Bypassing Safety Controls**: Obtain authorization before overriding or disabling safety-critical equipment or controls.
2. **Confined Space**: Obtain authorization before entering a confined space; verify atmosphere testing and assign continuous attendant.
3. **Driving**: Follow journey management rules, wear seatbelts, obey speed limits, and never use mobile devices while driving.
4. **Energy Isolation**: Verify isolation and zero energy state (LOTO - Lockout/Tagout) before beginning work on pressurized or energized equipment.
5. **Hot Work**: Identify and control ignition sources, conduct atmospheric monitoring, and obtain hot work permits in classified zones.
6. **Line of Fire**: Keep yourself and others out of the path of moving vehicles, suspended loads, high-pressure releases, and coiled springs.
7. **Safe Mechanical Lifting**: Plan lifts, inspect rigging, establish exclusion zones, and never walk under a suspended load.
8. **Work Authorization**: Confirm that valid permits, hazard assessments (JSA/JHA), and toolbox talks are completed before starting work.
9. **Working at Height**: Protect yourself against falls when working at height (>1.8m) using certified full-body harness and 100% tie-off.
