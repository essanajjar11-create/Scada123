# ⚡ 132/13.8 kV Substation Automation System (SAS) & Digital Twin MATLAB Suite

Comprehensive MATLAB & Simulink simulation platform for the **132/13.8 kV Substation Automation System (SAS)**, **Microgrid Integration**, **Protection Relaying**, and **Asset Health Analytics**.

---

## 📁 Repository & Directory Structure

```
matlab/
├── main_substation_simulation.m   # 🚀 Master 14-Step Simulation Engine
├── test_and_analyze_all.m         # 🧪 Master Automated Quality & Dynamic Test Harness
├── README.md                      # 📖 Engineering Documentation & User Guide
├── models/                        # 🧮 Mathematical & Physical Simulation Models
│   ├── substation_parameters.m    # Complete 132/13.8 kV Substation Engineering Dataset
│   ├── protection_ansi87t.m       # ANSI 87T Transformer Differential Protection (Dual-Slope & Harmonics)
│   ├── protection_ansi21.m        # ANSI 21 Distance Protection (4-Zone Mho & Quadrilateral on R-X Plane, Web-Parity)
│   ├── protection_ansi50_51.m     # ANSI 50/51 Time-Overcurrent & TCC Coordination (IEC/IEEE Curves)
│   ├── synchrocheck_ansi25.m      # ANSI 25 Synchrocheck & Synchroscope Interlocking (Breaker 52-0)
│   ├── arc_flash_ieee1584.m       # IEEE 1584 / NFPA 70E Arc Flash Incident Energy & Boundary Assessment
│   ├── thermal_aging_iec60076.m   # IEC 60076-7 Dynamic Thermal Hot-Spot & Insulation Aging
│   ├── dga_duval_triangle.m       # IEC 60599 / IEEE C57.104 DGA Duval Triangle 1 Fault Diagnosis
│   ├── microgrid_renewables_sim.m # Solar PV (5MW), BESS (10MW/40MWh), PEM H2 (2MW), VSC-HVDC (±320kV Link)
│   ├── hvdc_vsc_transmission.m    # ±320 kV VSC-MMC HVDC Decoupled d-q Vector Control & Fast DCCB Tripping
│   ├── dtr_ieee738.m              # IEEE 738 / CIGRE TB 299 Dynamic Thermal Line Rating (DTR)
│   ├── power_quality_thd.m        # IEEE 519 / IEC 61000-4-30 FFT Power Quality & Harmonics
│   └── export_comtrade_c37111.m   # IEEE C37.111 / IEC 60255-24 COMTRADE (.CFG/.DAT) Exporter
├── cosim/                         # 🔄 Real-Time Co-Simulation Bridge
│   └── matlab_scada_bridge.m      # Live WebSocket/REST Bridge to React/Node.js Web SCADA
├── gui/                           # 🖥️ Interactive Graphical User Interface (HMI)
│   └── substation_scada_dashboard.m # Live SCADA HMI Dashboard with SLD, Gauges, Controls & Fault Injector
├── simulink/                      # ⚡ Simscape Electrical Simulation Harness
│   ├── substation_132_13_8kv_digital_twin.slx # 156-Block Full Model with Web-Parity ANSI 87T/21 Relay Logic & 18 Scopes
│   ├── generate_digital_twin_slx.m # Programmatic Simulink Substation Model Generator
│   ├── check_slx_connections.m    # Automated Connectivity & Topological Auditor
│   └── run_and_plot_simulink.m    # Transient Waveform Runner & Exporter
└── data/                          # 📊 Exported COMTRADE Recordings & Output Data
```

---

## 🚀 Quick Start Guide

### 1. Run Master Digital Twin Simulation
Open MATLAB and execute:
```matlab
>> cd 'C:\Users\ASUS\Desktop\scada f\matlab'
>> main_substation_simulation
```
*This executes all 10 simulation modules sequentially, prints full diagnostic telemetry to the Command Window, and displays 8 engineering figures.*

### 2. Launch Interactive SCADA HMI Dashboard
```matlab
>> cd 'C:\Users\ASUS\Desktop\scada f\matlab\gui'
>> substation_scada_dashboard
```
*Provides real-time interactive breaker controls (`52-0`, `52-1`), OLTC tap stepping, fault injection dropdowns, and Single Line Diagram status.*

### 3. Open & Simulate the Simulink Model (.SLX)
```matlab
>> cd 'C:\Users\ASUS\Desktop\scada f\matlab\simulink'
>> open_system('substation_132_13_8kv_digital_twin.slx')
>> sim('substation_132_13_8kv_digital_twin')
```
*Or regenerate programmatically anytime via `generate_digital_twin_slx()`.*

---

## 🔬 Implemented Physical & Mathematical Models

### 1. ANSI 87T Transformer Differential Protection (`models/protection_ansi87t.m`)
* **Dual-Slope Restrained Characteristic with Dead-Band (web-parity):**
  $$I_{d,trip} = \begin{cases} I_{s1} & \text{for } I_r \le I_{s1} \\ I_{s1} + K_1 (I_r - I_{s1}) & \text{for } I_{s1} < I_r \le I_{s2} \\ I_{s1} + K_1 (I_{s2} - I_{s1}) + K_2 (I_r - I_{s2}) & \text{for } I_r > I_{s2} \end{cases}$$
  - Settings: $I_{s1} = 0.30$ p.u., $K_1 = 25\%$, $I_{s2} = 2.0$ p.u., $K_2 = 60\%$
* **Instantaneous Unrestrained Trip** at $I_{diff} \ge 8.0$ p.u. (highest priority)
* **Harmonic Inrush / Overexcitation Blocking (≥ comparisons):**
  - 2nd Harmonic Magnetizing Inrush Block ($I_{2f} \ge 15\%$)
  - 5th Harmonic Overexcitation Block ($I_{5f} \ge 30\%$)
* **Relay State Priority Chain:** `INST_TRIP → TRIP / BLOCKED_INRUSH / BLOCKED_OVERFLUX → RESTRAINED`

### 2. ANSI 21 Distance Protection (`models/protection_ansi21.m`)
* **4-Zone Mho & Quadrilateral Characteristics on R-X Complex Plane (60 km line, primary ohms):**
  - Zone 1: 80% reach, instantaneous ($t_1 = 20\text{ ms}$)
  - Zone 2: 120% reach, time delayed ($t_2 = 350\text{ ms}$)
  - Zone 3: 180% overreach, remote backup ($t_3 = 800\text{ ms}$)
  - Zone 4 Reverse: 25% reverse reach, bus backup ($t_4 = 1200\text{ ms}$)
* **Quadrilateral Blinders:** Resistive reach $R = 12/18/28\ \Omega$ with $-2/-4/-6\ \Omega$ reverse tolerance
* **Load Encroachment Blinder:** Blocks trips for $0 < R_m < 20\ \Omega$ at $|\angle Z_m| < 30^\circ$

### 3. ANSI 25 Synchrocheck & Synchroscope (`models/synchrocheck_ansi25.m`)
* **Permissive Interlock Conditions for Bus Coupler 52-0:**
  - $|\Delta \theta| \le 10.0^\circ$
  - $|\Delta V| \le 5.0\%$
  - $|\Delta f| \le 0.10\text{ Hz}$

### 4. IEC 60076-7 Transformer Thermal & Insulation Aging (`models/thermal_aging_iec60076.m`)
* **Top-Oil Temperature Rise (steady-state, web-parity formulation):**
  $$\Delta\theta_o = \Delta\theta_{or} \left( \frac{1 + R K^2}{1 + R} \right)^x$$
* **Hot-Spot Temperature:**
  $$\theta_{hs} = \theta_a + \Delta\theta_o + H \, g_r \, K^y$$
* **Arrhenius Relative Aging Factor & Daily Loss-of-Life %:**
  $$F_{AA} = \exp\left( \frac{15000}{383.15} - \frac{15000}{\theta_{hs} + 273.15} \right), \quad LOL\% = \frac{F_{AA} \cdot 24}{180000} \cdot 100$$
* **Paper DP Estimate:** $DP = \text{clamp}(780 - (F_{AA}-1)\cdot 45,\ 200,\ 1200)$
* **Cooling-Mode Constants (ONAN/ONAF/OFAF)** with warning (105°C) and critical (120°C) hot-spot thresholds

### 5. DGA Duval Triangle 1 (`models/dga_duval_triangle.m`)
* **Ternary Gas Percentages:** $\%CH_4, \%C_2H_4, \%C_2H_2$
* **IEC 60599 / IEEE C57.104 Fault Diagnoses:**
  - `PD`: Partial Discharge ($\%CH_4 \ge 98\%$)
  - `T1`: Thermal Fault $T < 300^\circ\text{C}$
  - `T2`: Thermal Fault $300^\circ\text{C} < T < 700^\circ\text{C}$
  - `T3`: Thermal Fault $T > 700^\circ\text{C}$
  - `D1`: Low Energy Discharge (Sparking)
  - `D2`: High Energy Discharge (Arcing)
  - `DT`: Mixed Thermal & Electrical Faults

### 6. Microgrid Renewable Energy & Storage (`models/microgrid_renewables_sim.m`)
* **5 MW Solar PV Farm:** Diurnal solar irradiance & MPPT output
* **10 MW / 40 MWh BESS:** Peak shaving & dynamic State of Charge (SoC)
* **2 MW PEM Electrolyzer:** Faraday's law of green hydrogen production ($\text{kg } H_2 / \text{hr}$)
* **±320 kV VSC-MMC HVDC Link (640 kV pole-to-pole, 150 km):** Decoupled active ($P$) and reactive ($Q$) power support

### 7. IEEE 738 Dynamic Thermal Rating (`models/dtr_ieee738.m`)
* **Steady-State Conductor Heat Balance:**
  $$q_c(V_w, \phi) + q_r(T_c, T_a) = q_s(Q_{se}) + I_{max}^2 R(T_c)$$
* Unlocks **+20% to +65% additional transmission ampacity** under active ambient wind cooling.

### 8. IEEE C37.111 COMTRADE Exporter (`models/export_comtrade_c37111.m`)
* Produces standard `.CFG` and `.DAT` transient fault recordings compatible with commercial relay analysis software (e.g. Omicron Test Universe, SIGRA, ASPEN).

---

## 📜 International Standards Compliance
* **IEC 61850 Series:** Substation Automation & Sampled Values (SV) / GOOSE
* **IEEE C37.111 / IEC 60255-24:** COMTRADE Transient Data Exchange
* **IEC 60076-7 / IEEE C57.91:** Transformer Thermal Loading & Aging
* **IEC 60599 / IEEE C57.104:** DGA Duval Triangle 1 Diagnostics
* **IEEE 738 / CIGRE TB 299:** Dynamic Thermal Line Rating (DTR)
* **IEEE 519 / IEC 61000-4-30:** Power Quality & Harmonics
* **IEEE 1584 / NFPA 70E:** Arc Flash & Electrical Safety
