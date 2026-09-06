"""
Approved Safety Standards Corpus for Grounded RAG Assistant (Phase 21).
Authoritative document chunks from OISD, IOGP, OIL SOPs, and DGMS Regulations.
"""

from typing import List, Dict, Any

APPROVED_SAFETY_CHUNKS: List[Dict[str, Any]] = [
    {
        "id": "OISD-105-01",
        "standard": "OISD-STD-105",
        "title": "Work Permit System — General Principles",
        "section": "Section 4.1",
        "category": "WORK_AUTHORIZATION",
        "content": "No maintenance, inspection, repair, or demolition work shall be carried out in operating areas without a valid Work Permit issued by an authorized issuer. Cold Work Permits remain valid for a single shift of 8 hours and require re-authorization upon shift change. Cross-signing by both Operations and Maintenance supervisors is mandatory.",
        "mandatory_controls": ["Valid signed permit", "Daily shift re-validation", "Authorized issuer sign-off"],
        "citations": "OISD-STD-105 Cl. 4.1 (Work Permit System)"
    },
    {
        "id": "OISD-105-02",
        "standard": "OISD-STD-105",
        "title": "Work Permit System — Confined Space Entry",
        "section": "Section 4.2.3",
        "category": "CONFINED_SPACE",
        "content": "Entry into vessels, tanks, pits, or enclosed spaces with restricted ventilation requires a Confined Space Entry Permit. Atmospheric testing for oxygen (19.5% to 23.5%), flammable gases (< 1% LEL), and toxic gases (H2S < 10 ppm) must be conducted within 30 minutes prior to entry and continuously monitored. A dedicated stand-by attendant must remain outside at all times with continuous communication.",
        "mandatory_controls": ["Gas test within 30 min", "Oxygen 19.5-23.5%", "Flammables < 1% LEL", "H2S < 10 ppm", "Dedicated stand-by attendant"],
        "citations": "OISD-STD-105 Cl. 4.2.3 (Confined Space Entry)"
    },
    {
        "id": "OISD-105-03",
        "standard": "OISD-STD-105",
        "title": "Work Permit System — Hot Work in Hazardous Areas",
        "section": "Section 4.3.1",
        "category": "HOT_WORK",
        "content": "Hot work (welding, cutting, grinding, burning, or open flame) within Zone 1 and Zone 2 hazardous areas requires a Hot Work Permit. All sewers and drains within 15 meters must be covered and sealed. Continuous combustible gas detection is mandatory. Charged fire hoses and dry chemical extinguishers must be stationed at the site with an assigned fire watch.",
        "mandatory_controls": ["Continuous gas detector", "15m drain sealing", "Fire watch stationed", "Charged fire hose"],
        "citations": "OISD-STD-105 Cl. 4.3.1 (Hot Work Controls)"
    },
    {
        "id": "OISD-112-01",
        "standard": "OISD-STD-112",
        "title": "Safe Handling of Hydrocarbons — Positive Isolation",
        "section": "Section 5.2",
        "category": "ENERGY_ISOLATION",
        "content": "Prior to opening, bolting, or cutting any pipeline or vessel containing hydrocarbons or toxic fluids, positive mechanical isolation must be established using spectacle blinds, slip blinds, or physical spool disconnection. Single valve closure or control valve isolation is strictly prohibited for entry or line breaking. Pressure must be depressurized and drained to safe flare/vent.",
        "mandatory_controls": ["Positive mechanical blind/spool", "Depressurization to 0 psig", "Drain verification", "Double block and bleed"],
        "citations": "OISD-STD-112 Cl. 5.2 (Positive Isolation & Blinding)"
    },
    {
        "id": "IOGP-459-01",
        "standard": "IOGP Report 459",
        "title": "IOGP Life-Saving Rules — Energy Isolation",
        "section": "Rule 03",
        "category": "ENERGY_ISOLATION",
        "content": "Verify isolation and zero energy state before work begins. Apply Lockout/Tagout (LOTO) padlocks and tags at every energy isolation point. Test for residual electrical, pressure, chemical, or mechanical energy prior to commencing invasive work.",
        "mandatory_controls": ["Zero energy verification", "Individual LOTO padlock", "Residual energy release test"],
        "citations": "IOGP Report 459 (Energy Isolation)"
    },
    {
        "id": "IOGP-459-02",
        "standard": "IOGP Report 459",
        "title": "IOGP Life-Saving Rules — Confined Space",
        "section": "Rule 04",
        "category": "CONFINED_SPACE",
        "content": "Obtain authorization before entering a confined space. Confirm that the atmosphere has been tested and is safe. Confirm that energy sources are isolated. Verify that a stand-by person is stationed at the entrance and emergency response procedures are established.",
        "mandatory_controls": ["Pre-entry gas test", "Stand-by watcher", "Emergency retrieval equipment"],
        "citations": "IOGP Report 459 (Confined Space)"
    },
    {
        "id": "IOGP-459-03",
        "standard": "IOGP Report 459",
        "title": "IOGP Life-Saving Rules — Safe Mechanical Lifting",
        "section": "Rule 06",
        "category": "SAFE_MECHANICAL_LIFTING",
        "content": "Plan lifting operations and control the lift area. Never position yourself under a suspended load. Verify that the crane, rigging gear, and safety latches are inspected and certified. Ensure lift area is barricaded and only designated riggers/signal persons direct the load.",
        "mandatory_controls": ["Barricaded drop zone", "No person under suspended load", "Certified lifting tackle", "Competent signal person"],
        "citations": "IOGP Report 459 (Safe Mechanical Lifting)"
    },
    {
        "id": "OIL-SOP-04",
        "standard": "OIL HSSE SOP-04",
        "title": "Oil India Limited Confined Space Entry Standard Operating Procedure",
        "section": "SOP-04 Cl. 3.2",
        "category": "CONFINED_SPACE",
        "content": "Applicable across all Upper Assam Basin production installations (Duliajan, Digboi, Moran, Naharkatiya). Vessel degassing must be verified with four-gas monitor (O2, LEL, H2S, CO). If LEL exceeds 0%, no hot work or mechanical spark tools are permitted. Attendant must maintain written entry/exit log and never leave post under any circumstances during occupancy.",
        "mandatory_controls": ["Four-gas calibration check", "Entry/Exit personnel logbook", "Continuous attendant presence"],
        "citations": "OIL HSSE SOP-04 Cl. 3.2 (Vessel Degassing & Attendant Log)"
    },
    {
        "id": "OIL-SOP-09",
        "standard": "OIL HSSE SOP-09",
        "title": "Oil India Limited Lockout/Tagout (LOTO) Protocol",
        "section": "SOP-09 Cl. 4.0",
        "category": "ENERGY_ISOLATION",
        "content": "Electrical motor control centers (MCC) and pneumatic actuation valves must be locked with physical red safety locks by the executing electrical/mechanical engineer. The key must be secured in a group lock box. Danger tags must state worker name, contact number, permit number, and date.",
        "mandatory_controls": ["Physical red safety lock", "Group lock box", "Complete danger tag with permit number"],
        "citations": "OIL HSSE SOP-09 Cl. 4.0 (Lockout/Tagout Protocol)"
    },
    {
        "id": "DGMS-OMR-2017",
        "standard": "DGMS Oil Mines Regulations 2017",
        "title": "Statutory Safety Provisions for Drilling and Production Wells",
        "section": "Regulation 78 & 84",
        "category": "WELL_CONTROL",
        "content": "Blowout Preventer (BOP) stack must be pressure tested to rated working pressure prior to drilling out casing shoe and every 14 days thereafter. Accumulator unit must maintain minimum 3000 psi hydraulic pressure. Derrick escape line and secondary escape devices must be installed on all active drilling rigs.",
        "mandatory_controls": ["14-day BOP pressure test", "Accumulator 3000 psi pressure", "Rig derrick escape line"],
        "citations": "DGMS Oil Mines Regulations 2017 Reg. 78 & 84"
    }
]
