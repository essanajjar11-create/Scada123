function params = substation_parameters()
% SUBSTATION_PARAMETERS Returns all engineering parameters for the 132/13.8 kV
% SCADA & Substation Automation System (SAS) Digital Twin.
%
% Standards Compliance:
% - IEC 61850 / IEC 60076-7 / IEEE C37.118 / IEEE 1584 / IEEE 738

%% 1. Grid Infeed (132 kV Transmission System)
params.grid.V_nom_kV = 132;             % Nominal Line-to-Line Voltage [kV]
params.grid.freq_Hz = 50.0;             % Nominal Grid Frequency [Hz]
params.grid.omega = 2 * pi * params.grid.freq_Hz;
params.grid.S_sc_MVA = 2500;            % Short-Circuit Capacity [MVA]
params.grid.XR_ratio = 12;              % Grid X/R ratio
params.grid.Z_sc = (params.grid.V_nom_kV^2) / params.grid.S_sc_MVA; % Short circuit impedance [Ohm]
params.grid.R_sc = params.grid.Z_sc / sqrt(1 + params.grid.XR_ratio^2);
params.grid.X_sc = params.grid.R_sc * params.grid.XR_ratio;

%% 2. 132 kV Double Busbar Configuration
params.busbar132.V_nom_kV = 132;
params.busbar132.bus_names = {'Busbar A', 'Busbar B'};
params.busbar132.coupler_id = '52-0';   % Bus Coupler Circuit Breaker

%% 3. Power Transformers (TR-1 & TR-2)
% Two identical 40 MVA ONAN/ONAF, Dyn11 132/13.8 kV Transformers
params.transformer.MVA_rated = 40.0;    % Rated Apparent Power [MVA]
params.transformer.V_prim_kV = 132.0;   % Primary Voltage [kV]
params.transformer.V_sec_kV = 13.8;     % Secondary Voltage [kV]
params.transformer.vector_group = 'Dyn11'; % Delta Primary (HV), Wye Secondary with Neutral (LV)
params.transformer.phase_shift_deg = 30;   % Dyn11 secondary leads primary by 30 deg
params.transformer.Z_pct = 12.5;        % Percent Impedance [%]
params.transformer.XR_ratio = 18.0;     % Transformer X/R ratio
params.transformer.P_noload_kW = 28.0;  % Core / Iron Losses [kW]
params.transformer.P_load_kW = 165.0;   % Copper / Load Losses at 40 MVA [kW]
params.transformer.I_prim_nom = (params.transformer.MVA_rated * 1e3) / (sqrt(3) * params.transformer.V_prim_kV); % ~174.95 A
params.transformer.I_sec_nom = (params.transformer.MVA_rated * 1e3) / (sqrt(3) * params.transformer.V_sec_kV);   % ~1673.48 A

% On-Load Tap Changer (OLTC)
params.oltc.taps = 17;                  % 17 Tap Positions (Tap 1 to 17, Nominal at Tap 9)
params.oltc.step_pct = 1.25;            % 1.25% per tap step
params.oltc.nominal_tap = 9;

%% 4. Instrument Transformers (CTs & VTs)
% HV Side (132 kV)
params.ct.hv_ratio = 300 / 1;           % 300:1 A
params.vt.hv_ratio = 132000 / 110;      % 132kV / 110V

% LV Side (13.8 kV)
params.ct.lv_ratio = 2000 / 1;          % 2000:1 A
params.vt.lv_ratio = 13800 / 110;       % 13.8kV / 110V

%% 5. 13.8 kV Medium Voltage System (MV Bus 1 & 2)
params.busbar13_8.V_nom_kV = 13.8;
params.busbar13_8.sectionalizer_id = '52-6'; % MV Bus Sectionalizer
params.feeders(1) = struct('id', 'F-01', 'name', 'Industrial Park Feeder', 'P_MW', 8.5,  'Q_MVAR', 2.8, 'breaker_id', '52-1');
params.feeders(2) = struct('id', 'F-02', 'name', 'Commercial District',   'P_MW', 6.2,  'Q_MVAR', 1.9, 'breaker_id', '52-2');
params.feeders(3) = struct('id', 'F-03', 'name', 'Residential Zone 1',    'P_MW', 7.8,  'Q_MVAR', 2.4, 'breaker_id', '52-3');
params.feeders(4) = struct('id', 'F-04', 'name', 'Water Treatment Plant',  'P_MW', 5.5,  'Q_MVAR', 1.6, 'breaker_id', '52-4');

%% 6. Microgrid & Renewable Integration
% Solar PV Farm
params.solar.P_rated_MW = 5.0;          % 5 MW Peak DC
params.solar.V_out_kV = 13.8;           % Connected to MV Bus via step-up
params.solar.inverter_eff = 0.985;      % 98.5% Inverter efficiency

% Battery Energy Storage System (BESS)
params.bess.P_rated_MW = 10.0;          % 10 MW Maximum Charge/Discharge
params.bess.Capacity_MWh = 40.0;        % 40 MWh Energy Capacity (4-hour storage)
params.bess.SoC_initial = 0.72;         % 72% Initial State of Charge
params.bess.roundtrip_eff = 0.92;       % 92% Round-trip efficiency

% Green Hydrogen PEM Electrolyzer Plant
params.hydrogen.P_rated_MW = 2.0;       % 2 MW Proton Exchange Membrane (PEM)
params.hydrogen.eff_kWh_per_kg = 50.0;  % 50 kWh consumed per 1 kg H2 produced
params.hydrogen.V_stack_V = 400;

% VSC-HVDC Transmission Intertie
% Mirrors src/context/ScadaContext.tsx hvdcState defaults exactly:
% "VSC-MMC ±320kV Intertie Link" (640 kV pole-to-pole DC link)
params.hvdc.V_dc_pole_kV = 320.0;       % ±320 kV DC per pole
params.hvdc.V_dc_link_kV = 640.0;       % 640 kV total pole-to-pole link
params.hvdc.V_dc_nom_kV = params.hvdc.V_dc_pole_kV; % kept for legacy callers
params.hvdc.MVA_nominal = 220.0;        % 220 MVA Converter Nominal Rating
params.hvdc.V_ac_nom_kV = 132.0;        % AC Side Connection Voltage [kV]
params.hvdc.P_max_MW = 200.0;           % ±200 MW Power Transfer Range
params.hvdc.P_ref_default_MW = 120.0;   % Default Active Power Setpoint [MW]
params.hvdc.Q_max_MVAR = 100.0;         % ±100 MVAR Independent Reactive Support
params.hvdc.Q_ref_default_MVAR = 25.0;  % Default Reactive Power Setpoint [MVAR]
params.hvdc.line_length_km = 150.0;     % 150 km DC Link Cable Length
params.hvdc.total_submodules = 1200;    % MMC Submodules per Arm Total
params.hvdc.synthetic_inertia_H_s = 4.5;% Synthetic Inertia Constant [s]
params.hvdc.freq_droop_gain_pct = 4.0;  % Frequency Droop Gain [%]

%% 7. Thermal Aging Parameters (IEC 60076-7 / IEEE C57.91)
% Mirrors src/components/thermal/TransformerThermalAgingModule.tsx exactly
params.thermal.R_loss_ratio = 5.2;      % R = Load Loss / No-Load Loss ratio
params.thermal.H_factor = 1.3;          % Hot-Spot Factor H
params.thermal.design_life_hours = 180000; % Normal Insulation Design Life [h] (~20.5 yr)
params.thermal.hs_warning_C = 105.0;    % Hot-Spot Warning Threshold [deg C]
params.thermal.hs_critical_C = 120.0;   % Hot-Spot Critical Threshold [deg C]
params.thermal.dp_base = 780;           % Current Paper DP Operating Baseline
params.thermal.dp_wear_per_faa = 45;    % DP Wear Units per F_AA unit above 1.0
params.thermal.dp_min = 200;            % End-of-Life DP (Critical)
params.thermal.dp_max = 1200;           % Fresh Paper DP

% Cooling-mode dependent constants (web module defaults: coolingMode='ONAF')
params.thermal.modes.ONAN.dTheta_oil_rated_C = 45;
params.thermal.modes.ONAN.exp_x = 0.8;
params.thermal.modes.ONAN.exp_y = 1.6;
params.thermal.modes.ONAN.grad_rated_C = 22;
params.thermal.modes.ONAN.oil_diff_C = 18;

params.thermal.modes.ONAF.dTheta_oil_rated_C = 38;
params.thermal.modes.ONAF.exp_x = 0.9;
params.thermal.modes.ONAF.exp_y = 1.6;
params.thermal.modes.ONAF.grad_rated_C = 18;
params.thermal.modes.ONAF.oil_diff_C = 14;

params.thermal.modes.OFAF.dTheta_oil_rated_C = 32;
params.thermal.modes.OFAF.exp_x = 1.0;
params.thermal.modes.OFAF.exp_y = 2.0;
params.thermal.modes.OFAF.grad_rated_C = 14;
params.thermal.modes.OFAF.oil_diff_C = 10;

params.thermal.default_cooling_mode = 'ONAF';
params.thermal.default_load_pu = 1.08;  % Web slider default: 108% load
params.thermal.default_ambient_C = 40.0;% Web slider default: 40 degC ambient

%% 8. Protection Relay Thresholds
% ANSI 87T (Differential Relay)
% Mirrors DifferentialProtectionModule.tsx defaults exactly
params.ansi87t.I_pickup_pu = 0.30;      % Is1 Pickup (0.30 p.u., web default)
params.ansi87t.slope1 = 0.25;           % Slope 1 K1 (25%)
params.ansi87t.slope2 = 0.60;           % Slope 2 K2 (60%, web default)
params.ansi87t.I_breakpoint_pu = 2.0;   % Is2 Breakpoint between slopes
params.ansi87t.i_inst_pickup_pu = 8.0;  % Instantaneous Unrestrained Trip [p.u.]
params.ansi87t.harm2_restraint = 0.15;  % 15% 2nd Harmonic Inrush Restraint
params.ansi87t.harm5_restraint = 0.30;  % 30% 5th Harmonic Overexcitation Restraint

% ANSI 21 (Distance Protection)
% Mirrors DistanceProtectionModule.tsx defaults exactly (PRIMARY ohms, no VT/CT scaling)
params.ansi21.line_length_km = 60.0;    % 60 km 132 kV Transmission Line
params.ansi21.r_per_km = 0.08;          % Line Resistance [Ohm/km]
params.ansi21.x_per_km = 0.42;          % Line Reactance [Ohm/km]
params.ansi21.z1_pct = 80;              % Zone 1 Reach (80%, t=20 ms instantaneous)
params.ansi21.z2_pct = 120;             % Zone 2 Reach (120%, t=350 ms)
params.ansi21.z3_pct = 180;             % Zone 3 Reach (180%, t=800 ms)
params.ansi21.z4_rev_pct = 25;          % Zone 4 Reverse Reach (25%, t=1200 ms backup)
params.ansi21.t_zone1_ms = 20;          % Zone 1 Operating Time [ms]
params.ansi21.t_zone2_ms = 350;         % Zone 2 Operating Time [ms]
params.ansi21.t_zone3_ms = 800;         % Zone 3 Operating Time [ms]
params.ansi21.t_zone4rev_ms = 1200;     % Zone 4 Reverse Backup Time [ms]
params.ansi21.quad_R_reach = [12, 18, 28];      % Quad blinder resistive reach Z1/Z2/Z3 [Ohm]
params.ansi21.quad_R_left_extend = [-2, -4, -6];% Quad reverse-R tolerance Z1/Z2/Z3 [Ohm]
params.ansi21.char_default = 'quad';    % Default characteristic (web default)
params.ansi21.load_encroach_enabled = true;
params.ansi21.load_encroach_R_ohm = 20; % Load Encroachment Blinder R Reach [Ohm]
params.ansi21.load_encroach_angle_deg = 30; % Load Encroachment Angle [deg]
params.ansi21.fault_dist_default_pct = 65;  % Default fault location [% of line]
params.ansi21.rf_default_ohm = 2.5;     % Default arc/tower footing resistance [Ohm]

% ANSI 50/51 (Time-Overcurrent TCC Coordination)
% Mirrors TccCurvesModule.tsx defaults exactly (IEC Standard Inverse only)
params.ansi50_51.alpha = 0.14;          % IEC SI Curve Constant
params.ansi50_51.beta = 0.02;           % IEC SI Curve Exponent
params.ansi50_51.feeder_Ip_A = 300;     % Feeder Relay 52-7 Pickup [A]
params.ansi50_51.feeder_TMS = 0.15;     % Feeder Relay 52-7 Time Multiplier
params.ansi50_51.incomer_Ip_A = 800;    % MV Incomer Relay 52-2 Pickup [A]
params.ansi50_51.incomer_TMS = 0.35;    % MV Incomer Relay 52-2 Time Multiplier
params.ansi50_51.primary_Ip_A = 1200;   % HV Primary Relay 52-1 Pickup [A]
params.ansi50_51.primary_TMS = 0.60;    % HV Primary Relay 52-1 Time Multiplier
params.ansi50_51.test_fault_A = 3500;   % Grading Check Fault Current [A]
params.ansi50_51.min_margin_s = 0.30;   % Required CTI Grading Margin [s]
params.ansi50_51.t_min_s = 0.02;        % Minimum Reported Operating Time [s]
params.ansi50_51.no_trip_time_s = 999;  % Sentinel for I <= Ip (No Trip)

% ANSI 25 (Synchrocheck)
params.ansi25.max_angle_diff_deg = 10.0;% Max Phase Angle Difference [deg]
params.ansi25.max_volt_diff_pct = 5.0;  % Max Voltage Magnitude Difference [%]
params.ansi25.max_freq_diff_Hz = 0.10;  % Max Slip Frequency Difference [Hz]

end
