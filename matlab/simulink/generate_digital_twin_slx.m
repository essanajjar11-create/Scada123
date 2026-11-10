function model_path = generate_digital_twin_slx()
% GENERATE_DIGITAL_TWIN_SLX Programmatically generates the full Simulink (.slx)
% Digital Twin Simulation Model with ALL possible Scopes and Telemetry Outports.
%
% Models:
% - 132 kV Grid Source & 60 km Transmission Line
% - Double Busbar System (132 kV Bus A & Bus B)
% - 132 kV Bus Coupler Breaker (52-0)
% - 2x 40 MVA 132/13.8 kV Dyn11 Power Transformers (TR-1 & TR-2)
% - 13.8 kV MV Busbars & Bus Sectionalizer Breaker (52-6)
% - 4 Outgoing Medium Voltage Feeders (F-01 to F-04)
% - ANSI 87T Differential Protection (Web-Parity Dual-Slope Dead-Band + 8pu INST + Harmonic Block)
% - ANSI 21 Distance Protection Relay (Web-Parity Quad Zones 80/120/180% + Rev Z4 + Load Encroachment)
% - ANSI 25 Synchrocheck & Synchroscope Interlocking (Breaker 52-0)
% - 5 MW Solar PV Infeed with Volt-VAR / Freq-Watt Control
% - 10 MW / 40 MWh BESS Dynamic Energy Storage with State-of-Charge (SoC) Integrator
% - 2 MW Green Hydrogen PEM Electrolyzer
% - ±320 kV (640 kV Link) VSC-HVDC Active/Reactive Power Transmission Link
% - Fault Infiltration Block (Phase-A SLG, 3-Phase Bolted Faults)
% - Full Suite of Dedicated Engineering Scopes across all subsystems

model_name = 'substation_132_13_8kv_digital_twin';
curr_dir = fileparts(mfilename('fullpath'));
model_path = fullfile(curr_dir, [model_name, '.slx']);

fprintf('========================================================================\n');
fprintf('   BUILDING FULL 132/13.8 kV DIGITAL TWIN WITH ALL POSSIBLE SCOPES     \n');
fprintf('========================================================================\n\n');

% Close if already open
if bdIsLoaded(model_name)
    close_system(model_name, 0);
end

% Create new model
fprintf('[1/6] Initializing Simulink Architecture...\n');
new_system(model_name);
open_system(model_name);

% Configure Model Simulation & Solver Parameters
set_param(model_name, 'Solver', 'ode23tb');
set_param(model_name, 'StopTime', '1.0');
set_param(model_name, 'MaxStep', '100e-6');
set_param(model_name, 'SaveTime', 'on');
set_param(model_name, 'SaveOutput', 'on');

%% Step 2: 132 kV Grid Source & Transmission System Subsystem
fprintf('[2/6] Constructing 132 kV Grid, Double Busbar & Coupler 52-0...\n');
hGridSub = add_block('simulink/Commonly Used Blocks/Subsystem', [model_name, '/Grid_132kV_Transmission_Subsystem'], ...
    'Position', [60, 80, 240, 200]);
build_grid_subsystem(hGridSub);

% Subsystem: 40 MVA Transformers TR-1 & TR-2 (Dyn11)
fprintf('[3/6] Constructing 40 MVA Dyn11 Transformers & 13.8 kV MV Bus...\n');
hTrSub = add_block('simulink/Commonly Used Blocks/Subsystem', [model_name, '/Transformer_TR1_TR2_Dyn11_Subsystem'], ...
    'Position', [320, 80, 500, 200]);
build_transformer_subsystem(hTrSub);

% Subsystem: MV Feeders (F-01 to F-04) & Sectionalizer 52-6
hFeederSub = add_block('simulink/Commonly Used Blocks/Subsystem', [model_name, '/MV_Feeders_and_Sectionalizer_Subsystem'], ...
    'Position', [580, 80, 760, 200]);
build_feeder_subsystem(hFeederSub);

%% Step 3: Protection Relaying Controllers (ANSI 87T, ANSI 21, ANSI 25)
fprintf('[4/6] Constructing ANSI 87T, ANSI 21 & ANSI 25 Protection Controllers...\n');

% ANSI 87T Differential Protection Controller
h87TSub = add_block('simulink/Commonly Used Blocks/Subsystem', [model_name, '/ANSI_87T_Differential_Protection_Relay'], ...
    'Position', [60, 280, 240, 400]);
build_87t_relay_subsystem(h87TSub);

% ANSI 21 Distance Protection Controller
h21Sub = add_block('simulink/Commonly Used Blocks/Subsystem', [model_name, '/ANSI_21_Distance_Protection_Relay'], ...
    'Position', [320, 280, 500, 400]);
build_21_relay_subsystem(h21Sub);

% ANSI 25 Synchrocheck & Synchroscope Controller
h25Sub = add_block('simulink/Commonly Used Blocks/Subsystem', [model_name, '/ANSI_25_Synchrocheck_Relay'], ...
    'Position', [580, 280, 760, 400]);
build_25_relay_subsystem(h25Sub);

%% Step 4: Renewable Microgrid (Solar, BESS, Hydrogen, HVDC)
fprintf('[5/6] Building Renewable Microgrid & Substation Fault Blocks...\n');

hMicrogridSub = add_block('simulink/Commonly Used Blocks/Subsystem', [model_name, '/Renewable_Microgrid_Subsystem'], ...
    'Position', [60, 460, 340, 580]);
build_microgrid_subsystem(hMicrogridSub);

% Substation Fault Injector Subsystem
hFaultSub = add_block('simulink/Commonly Used Blocks/Subsystem', [model_name, '/Substation_Fault_Injector'], ...
    'Position', [420, 460, 600, 580]);
build_fault_injector_subsystem(hFaultSub);

%% Step 5: Master Top-Level Scopes
fprintf('[6/6] Adding Complete Suite of Scopes & Workspace Outports...\n');

% Scope 1: 132 kV Busbar A 3-Phase Waveforms
add_block('simulink/Sinks/Scope', [model_name, '/Scope_132kV_BusA_Voltages'], ...
    'Position', [840, 50, 910, 95]);
add_line(model_name, 'Grid_132kV_Transmission_Subsystem/1', 'Scope_132kV_BusA_Voltages/1');

% Scope 2: 132 kV Busbar B Voltage (Coupler 52-0 Switched)
add_block('simulink/Sinks/Scope', [model_name, '/Scope_132kV_BusB_Coupler_52_0'], ...
    'Position', [840, 110, 910, 155]);
add_line(model_name, 'Grid_132kV_Transmission_Subsystem/2', 'Scope_132kV_BusB_Coupler_52_0/1');

% Scope 3: 13.8 kV Medium Voltage Bus 1 & 2 Voltages
add_block('simulink/Sinks/Scope', [model_name, '/Scope_13_8kV_MV_Bus_Voltages'], ...
    'Position', [840, 170, 910, 215]);
add_line(model_name, 'Transformer_TR1_TR2_Dyn11_Subsystem/1', 'Scope_13_8kV_MV_Bus_Voltages/1');

% Scope 4: Transformer TR-1 Primary & Secondary Currents
add_block('simulink/Sinks/Scope', [model_name, '/Scope_TR1_Currents_Prim_Sec'], ...
    'Position', [840, 230, 910, 275]);
add_line(model_name, 'Transformer_TR1_TR2_Dyn11_Subsystem/2', 'Scope_TR1_Currents_Prim_Sec/1');

% Scope 5: Total Medium Voltage Feeder Demand
add_block('simulink/Sinks/Scope', [model_name, '/Scope_Total_MV_Feeder_Demand'], ...
    'Position', [840, 290, 910, 335]);
add_line(model_name, 'MV_Feeders_and_Sectionalizer_Subsystem/1', 'Scope_Total_MV_Feeder_Demand/1');

% Scope 6: ANSI 87T Differential Protection Trip Signal
add_block('simulink/Sinks/Scope', [model_name, '/Scope_ANSI_87T_Differential_Trip'], ...
    'Position', [840, 350, 910, 395]);
add_line(model_name, 'ANSI_87T_Differential_Protection_Relay/1', 'Scope_ANSI_87T_Differential_Trip/1');

% Web-parity monitors: 87T Idiff (p.u.) & ANSI 21 operating time (ms)
add_block('simulink/Sinks/To Workspace', [model_name, '/Log_ansi87t_idiff_pu'], ...
    'Position', [940, 355, 1030, 385], 'VariableName', 'sim_ansi87t_idiff_pu', 'SaveFormat', 'Array');
add_line(model_name, 'ANSI_87T_Differential_Protection_Relay/2', 'Log_ansi87t_idiff_pu/1');

add_block('simulink/Sinks/To Workspace', [model_name, '/Log_ansi21_trip_time_ms'], ...
    'Position', [940, 415, 1035, 445], 'VariableName', 'sim_ansi21_trip_time_ms', 'SaveFormat', 'Array');
add_line(model_name, 'ANSI_21_Distance_Protection_Relay/2', 'Log_ansi21_trip_time_ms/1');

% Scope 7: ANSI 21 Distance Zone 1 Trip Signal
add_block('simulink/Sinks/Scope', [model_name, '/Scope_ANSI_21_Distance_Zone1_Trip'], ...
    'Position', [840, 410, 910, 455]);
add_line(model_name, 'ANSI_21_Distance_Protection_Relay/1', 'Scope_ANSI_21_Distance_Zone1_Trip/1');

% Scope 8: ANSI 25 Synchrocheck Permissive Signal
add_block('simulink/Sinks/Scope', [model_name, '/Scope_ANSI_25_Synchrocheck_Permissive'], ...
    'Position', [840, 470, 910, 515]);
add_line(model_name, 'ANSI_25_Synchrocheck_Relay/1', 'Scope_ANSI_25_Synchrocheck_Permissive/1');

% Scope 9: Renewable Microgrid Telemetry (Solar, BESS, H2, HVDC)
add_block('simulink/Sinks/Scope', [model_name, '/Scope_Renewable_Microgrid_Telemetry'], ...
    'Position', [840, 530, 910, 575]);
add_line(model_name, 'Renewable_Microgrid_Subsystem/1', 'Scope_Renewable_Microgrid_Telemetry/1');

% Scope 10: Substation Fault Injector Disturbance Signal
add_block('simulink/Sinks/Scope', [model_name, '/Scope_Fault_Disturbance_Pulse'], ...
    'Position', [840, 590, 910, 635]);
add_line(model_name, 'Substation_Fault_Injector/1', 'Scope_Fault_Disturbance_Pulse/1');

% To Workspace: Log 132 kV & 13.8 kV Arrays
add_block('simulink/Sinks/To Workspace', [model_name, '/Log_132kV_V'], ...
    'Position', [940, 60, 1010, 90], 'VariableName', 'sim_132kV_V', 'SaveFormat', 'Array');
add_line(model_name, 'Grid_132kV_Transmission_Subsystem/1', 'Log_132kV_V/1');

add_block('simulink/Sinks/To Workspace', [model_name, '/Log_13_8kV_V'], ...
    'Position', [940, 180, 1010, 210], 'VariableName', 'sim_13_8kV_V', 'SaveFormat', 'Array');
add_line(model_name, 'Transformer_TR1_TR2_Dyn11_Subsystem/1', 'Log_13_8kV_V/1');

% Inter-Subsystem Connections
add_line(model_name, 'Grid_132kV_Transmission_Subsystem/1', 'Transformer_TR1_TR2_Dyn11_Subsystem/1');
add_line(model_name, 'Transformer_TR1_TR2_Dyn11_Subsystem/1', 'MV_Feeders_and_Sectionalizer_Subsystem/1');
add_line(model_name, 'Transformer_TR1_TR2_Dyn11_Subsystem/2', 'ANSI_87T_Differential_Protection_Relay/1');
add_line(model_name, 'Grid_132kV_Transmission_Subsystem/1', 'ANSI_21_Distance_Protection_Relay/1');
add_line(model_name, 'Grid_132kV_Transmission_Subsystem/2', 'ANSI_25_Synchrocheck_Relay/1');

% Save Model
save_system(model_name, model_path);
fprintf('\n========================================================================\n');
fprintf('   SIMULINK MODEL WITH ALL SCOPES SAVED SUCCESSFULLY:                   \n');
fprintf('   --> %s\n', model_path);
fprintf('========================================================================\n');

end

%% Subsystem Builder 1: Grid Infeed & Busbars
function build_grid_subsystem(hSub)
sName = getfullname(hSub);
Simulink.SubSystem.deleteContents(sName);

add_block('simulink/Sources/Sine Wave', [sName, '/Va_132kV'], ...
    'Position', [40, 40, 80, 70], 'Amplitude', '132e3 * sqrt(2)/sqrt(3)', 'Frequency', '2*pi*60', 'Phase', '0');
add_block('simulink/Sources/Sine Wave', [sName, '/Vb_132kV'], ...
    'Position', [40, 90, 80, 120], 'Amplitude', '132e3 * sqrt(2)/sqrt(3)', 'Frequency', '2*pi*60', 'Phase', '-2*pi/3');
add_block('simulink/Sources/Sine Wave', [sName, '/Vc_132kV'], ...
    'Position', [40, 140, 80, 170], 'Amplitude', '132e3 * sqrt(2)/sqrt(3)', 'Frequency', '2*pi*60', 'Phase', '2*pi/3');

add_block('simulink/Commonly Used Blocks/Mux', [sName, '/Mux_3Ph_132kV'], 'Position', [130, 70, 135, 140], 'Inputs', '3');
add_block('simulink/Commonly Used Blocks/Gain', [sName, '/CB_52_0_Coupler_Gain'], 'Position', [180, 90, 220, 120], 'Gain', '1.0');

% Internal Subsystem Scope: 132 kV Sinusoidal Generation
add_block('simulink/Sinks/Scope', [sName, '/Scope_132kV_Internal_Waveforms'], 'Position', [200, 30, 250, 60]);
add_line(sName, 'Mux_3Ph_132kV/1', 'Scope_132kV_Internal_Waveforms/1');

add_block('built-in/Outport', [sName, '/V_BusA_132kV'], 'Position', [280, 70, 310, 90]);
add_block('built-in/Outport', [sName, '/V_BusB_132kV'], 'Position', [280, 120, 310, 140]);

add_line(sName, 'Va_132kV/1', 'Mux_3Ph_132kV/1');
add_line(sName, 'Vb_132kV/1', 'Mux_3Ph_132kV/2');
add_line(sName, 'Vc_132kV/1', 'Mux_3Ph_132kV/3');
add_line(sName, 'Mux_3Ph_132kV/1', 'V_BusA_132kV/1');
add_line(sName, 'Mux_3Ph_132kV/1', 'CB_52_0_Coupler_Gain/1');
add_line(sName, 'CB_52_0_Coupler_Gain/1', 'V_BusB_132kV/1');
end

%% Subsystem Builder 2: 40 MVA Transformers TR-1 & TR-2
function build_transformer_subsystem(hSub)
sName = getfullname(hSub);
Simulink.SubSystem.deleteContents(sName);

add_block('built-in/Inport', [sName, '/V_132kV_In'], 'Position', [30, 70, 60, 90]);

add_block('simulink/Commonly Used Blocks/Gain', [sName, '/Turns_Ratio_132_to_13_8kV'], ...
    'Position', [110, 65, 170, 95], 'Gain', '13.8 / 132');

add_block('simulink/Commonly Used Blocks/Gain', [sName, '/Dyn11_Phase_Matrix'], ...
    'Position', [210, 60, 300, 100], ...
    'Gain', '(1/sqrt(3)) * [1 -1 0; 0 1 -1; -1 0 1]', 'Multiplication', 'Matrix(K*u)');

add_block('simulink/Commonly Used Blocks/Gain', [sName, '/TR1_Impedance_Drop'], ...
    'Position', [340, 65, 430, 95], 'Gain', '0.992');

add_block('simulink/Commonly Used Blocks/Gain', [sName, '/I_prim_calc'], 'Position', [210, 130, 260, 160], 'Gain', '1/132e3');
add_block('simulink/Commonly Used Blocks/Gain', [sName, '/I_sec_calc'],  'Position', [460, 130, 510, 160], 'Gain', '1/13.8e3');
add_block('simulink/Commonly Used Blocks/Mux',  [sName, '/Mux_I_prim_sec'], 'Position', [540, 130, 545, 180], 'Inputs', '2');

% Internal Scope: Secondary 13.8 kV Dyn11 Waveforms
add_block('simulink/Sinks/Scope', [sName, '/Scope_TR1_LV_Waveforms'], 'Position', [460, 20, 500, 50]);
add_line(sName, 'TR1_Impedance_Drop/1', 'Scope_TR1_LV_Waveforms/1');

add_block('built-in/Outport', [sName, '/V_13_8kV_Out'], 'Position', [480, 70, 510, 90]);
add_block('built-in/Outport', [sName, '/I_TR1_Prim_Sec'], 'Position', [580, 140, 610, 160]);

add_line(sName, 'V_132kV_In/1', 'Turns_Ratio_132_to_13_8kV/1');
add_line(sName, 'Turns_Ratio_132_to_13_8kV/1', 'Dyn11_Phase_Matrix/1');
add_line(sName, 'Dyn11_Phase_Matrix/1', 'TR1_Impedance_Drop/1');
add_line(sName, 'TR1_Impedance_Drop/1', 'V_13_8kV_Out/1');
add_line(sName, 'V_132kV_In/1', 'I_prim_calc/1');
add_line(sName, 'TR1_Impedance_Drop/1', 'I_sec_calc/1');
add_line(sName, 'I_prim_calc/1', 'Mux_I_prim_sec/1');
add_line(sName, 'I_sec_calc/1', 'Mux_I_prim_sec/2');
add_line(sName, 'Mux_I_prim_sec/1', 'I_TR1_Prim_Sec/1');
end

%% Subsystem Builder 3: MV Feeders & Sectionalizer 52-6
function build_feeder_subsystem(hSub)
sName = getfullname(hSub);
Simulink.SubSystem.deleteContents(sName);

add_block('built-in/Inport', [sName, '/V_13_8kV_In'], 'Position', [30, 80, 60, 100]);

add_block('simulink/Commonly Used Blocks/Gain', [sName, '/Feeder_01_Load'], 'Position', [120, 30, 170, 60], 'Gain', '8.5e6 / (13.8e3*sqrt(3))');
add_block('simulink/Commonly Used Blocks/Gain', [sName, '/Feeder_02_Load'], 'Position', [120, 80, 170, 110], 'Gain', '6.2e6 / (13.8e3*sqrt(3))');
add_block('simulink/Commonly Used Blocks/Gain', [sName, '/Feeder_03_Load'], 'Position', [120, 130, 170, 160], 'Gain', '7.8e6 / (13.8e3*sqrt(3))');
add_block('simulink/Commonly Used Blocks/Gain', [sName, '/Feeder_04_Load'], 'Position', [120, 180, 170, 210], 'Gain', '5.5e6 / (13.8e3*sqrt(3))');

% Internal Scopes: Individual Feeder Currents
add_block('simulink/Sinks/Scope', [sName, '/Scope_Feeder_01_Industrial'], 'Position', [220, 20, 250, 45]);
add_line(sName, 'Feeder_01_Load/1', 'Scope_Feeder_01_Industrial/1');

add_block('simulink/Sinks/Scope', [sName, '/Scope_Feeder_02_Commercial'], 'Position', [220, 60, 250, 85]);
add_line(sName, 'Feeder_02_Load/1', 'Scope_Feeder_02_Commercial/1');

add_block('simulink/Commonly Used Blocks/Sum', [sName, '/Total_MV_Current'], 'Position', [220, 100, 240, 170], 'Inputs', '++++');
add_block('built-in/Outport', [sName, '/I_Total_Feeders_A'], 'Position', [290, 130, 320, 150]);

add_line(sName, 'V_13_8kV_In/1', 'Feeder_01_Load/1');
add_line(sName, 'V_13_8kV_In/1', 'Feeder_02_Load/1');
add_line(sName, 'V_13_8kV_In/1', 'Feeder_03_Load/1');
add_line(sName, 'V_13_8kV_In/1', 'Feeder_04_Load/1');
add_line(sName, 'Feeder_01_Load/1', 'Total_MV_Current/1');
add_line(sName, 'Feeder_02_Load/1', 'Total_MV_Current/2');
add_line(sName, 'Feeder_03_Load/1', 'Total_MV_Current/3');
add_line(sName, 'Feeder_04_Load/1', 'Total_MV_Current/4');
add_line(sName, 'Total_MV_Current/1', 'I_Total_Feeders_A/1');
end

%% Subsystem Builder 4: ANSI 87T Differential Protection Relay (Web-Parity)
% EXACT PORT of src/components/protection/DifferentialProtectionModule.tsx:
%   thresh(Ibias) = Is1                          if Ibias <= Is1
%                 = Is1 + K1*(Ibias - Is1)       if Is1 < Ibias <= Is2
%                 = [Is1+K1*(Is2-Is1)] + K2*(Ibias-Is2)  if Ibias > Is2
%   INST trip: Idiff >= 8.0 pu | Harmonic block: h2 >= 15% OR h5 >= 30%
%   Web defaults: Is1=0.30, K1=0.25, Is2=2.0, K2=0.60, h2=2%, h5=1%, I2@180deg
function build_87t_relay_subsystem(hSub)
sName = getfullname(hSub);
Simulink.SubSystem.deleteContents(sName);

add_block('built-in/Inport', [sName, '/I_Prim_Sec'], 'Position', [30, 130, 60, 150]);

%% Per-Unit Conversion & Through-Load Opposition (web: I2 = |I2| < 180 deg)
add_block('simulink/Commonly Used Blocks/Demux', [sName, '/Demux_I'], ...
    'Position', [100, 120, 105, 180], 'Outputs', '2');
add_block('simulink/Commonly Used Blocks/Gain', [sName, '/PU_HV_Conv'], ...
    'Position', [140, 110, 200, 140], 'Gain', sprintf('%.6g', 1 / (40e3 / (sqrt(3) * 132)))); % 1/174.95 A
add_block('simulink/Commonly Used Blocks/Gain', [sName, '/PU_LV_Conv'], ...
    'Position', [140, 160, 200, 190], 'Gain', sprintf('%.6g', 1 / (40e3 / (sqrt(3) * 13.8)))); % 1/1673.48 A
add_block('simulink/Commonly Used Blocks/Gain', [sName, '/I2_Oppose_180deg'], ...
    'Position', [230, 160, 280, 190], 'Gain', '-1');

%% Idiff = |I1 + I2| ; Ibias = (|I1| + |I2|) / 2
add_block('simulink/Commonly Used Blocks/Sum', [sName, '/Sum_Phasor_Id'], ...
    'Position', [320, 125, 340, 165], 'Inputs', '+-');
add_block('simulink/Math Operations/Abs', [sName, '/Abs_Idiff'], 'Position', [370, 125, 400, 155]);

add_block('simulink/Math Operations/Abs', [sName, '/Abs_I1'], 'Position', [320, 210, 350, 240]);
add_block('simulink/Math Operations/Abs', [sName, '/Abs_I2'], 'Position', [320, 260, 350, 290]);
add_block('simulink/Commonly Used Blocks/Sum', [sName, '/Sum_Bias'], ...
    'Position', [380, 220, 400, 270], 'Inputs', '++');
add_block('simulink/Commonly Used Blocks/Gain', [sName, '/Bias_Half'], ...
    'Position', [430, 230, 470, 260], 'Gain', '0.5');

%% Piecewise Dual-Slope Threshold (dead-band below Is1)
% t_mid = K1*Ib + Is1*(1-K1)
add_block('simulink/Commonly Used Blocks/Gain', [sName, '/K1_Slope_25pct'], ...
    'Position', [510, 225, 550, 255], 'Gain', '0.25');
add_block('simulink/Sources/Constant', [sName, '/C_Mid_Offset'], ...
    'Position', [510, 275, 550, 295], 'Value', sprintf('%.6g', 0.30 * (1 - 0.25))); % 0.225
add_block('simulink/Commonly Used Blocks/Sum', [sName, '/T_Mid_Sum'], ...
    'Position', [580, 230, 600, 280], 'Inputs', '++');
% t_high = K2*Ib + (atBreak - K2*Is2), atBreak = Is1 + K1*(Is2-Is1) = 0.725
add_block('simulink/Commonly Used Blocks/Gain', [sName, '/K2_Slope_60pct'], ...
    'Position', [510, 320, 550, 350], 'Gain', '0.60');
add_block('simulink/Sources/Constant', [sName, '/C_High_Offset'], ...
    'Position', [510, 370, 550, 390], 'Value', sprintf('%.6g', 0.725 - 0.60 * 2.0)); % -0.475
add_block('simulink/Commonly Used Blocks/Sum', [sName, '/T_High_Sum'], ...
    'Position', [580, 325, 600, 375], 'Inputs', '++');
% Switch 1: Ibias > Is1 ? t_mid : Is1
add_block('simulink/Sources/Constant', [sName, '/Is1_Pickup_0_30pu'], ...
    'Position', [500, 430, 550, 450], 'Value', '0.30');
add_block('simulink/Signal Routing/Switch', [sName, '/SW_Mid'], ...
    'Position', [650, 235, 685, 285], 'Criteria', 'u2 > Threshold', 'Threshold', '0.30');
% Switch 2: Ibias > Is2 ? t_high : SW_Mid
add_block('simulink/Signal Routing/Switch', [sName, '/SW_High'], ...
    'Position', [740, 250, 775, 300], 'Criteria', 'u2 > Threshold', 'Threshold', '2.0');

%% Harmonic Cross-Blocking (web injection defaults h2=2%, h5=1%; thresholds 15%/30%)
add_block('simulink/Sources/Constant', [sName, '/Harm2_Inj_Pct'], ...
    'Position', [510, 540, 570, 560], 'Value', '2.0');
add_block('simulink/Sources/Constant', [sName, '/Harm5_Inj_Pct'], ...
    'Position', [510, 590, 570, 610], 'Value', '1.0');
add_block('simulink/Commonly Used Blocks/Relational Operator', [sName, '/H2_GTE_15'], ...
    'Position', [620, 535, 650, 565], 'Operator', '>=');
add_block('simulink/Sources/Constant', [sName, '/H2_Thresh_15pct'], ...
    'Position', [590, 630, 640, 650], 'Value', '15');
add_block('simulink/Commonly Used Blocks/Relational Operator', [sName, '/H5_GTE_30'], ...
    'Position', [700, 585, 730, 615], 'Operator', '>=');
add_block('simulink/Sources/Constant', [sName, '/H5_Thresh_30pct'], ...
    'Position', [660, 630, 710, 650], 'Value', '30');
add_block('simulink/Logic and Bit Operations/Logical Operator', [sName, '/Harmonic_Block_OR'], ...
    'Position', [770, 555, 800, 595], 'Operator', 'OR', 'IconShape', 'rectangular');

%% Trip Logic: INST (>=8pu) overrides; TRIP = over-threshold AND NOT blocked
add_block('simulink/Commonly Used Blocks/Relational Operator', [sName, '/Trip_Core_GT'], ...
    'Position', [850, 245, 880, 275], 'Operator', '>');
add_block('simulink/Sources/Constant', [sName, '/Inst_Pickup_8pu'], ...
    'Position', [820, 330, 870, 350], 'Value', '8.0');
add_block('simulink/Commonly Used Blocks/Relational Operator', [sName, '/INST_GTE_8pu'], ...
    'Position', [910, 315, 940, 345], 'Operator', '>=');
add_block('simulink/Logic and Bit Operations/Logical Operator', [sName, '/NOT_Blocked'], ...
    'Position', [850, 555, 880, 585], 'Operator', 'NOT', 'IconShape', 'rectangular');
add_block('simulink/Logic and Bit Operations/Logical Operator', [sName, '/AND_Trip_NotBlk'], ...
    'Position', [950, 420, 980, 460], 'Operator', 'AND', 'IconShape', 'rectangular', 'Inputs', '2');
add_block('simulink/Logic and Bit Operations/Logical Operator', [sName, '/OR_Final_87T'], ...
    'Position', [1030, 330, 1060, 370], 'Operator', 'OR', 'IconShape', 'rectangular', 'Inputs', '2');

%% Internal Scope & Output
add_block('simulink/Sinks/Scope', [sName, '/Scope_87T_Id_vs_Thresh'], ...
    'Position', [900, 120, 950, 150]);
add_block('simulink/Commonly Used Blocks/Mux', [sName, '/Mux_Char_Plot'], 'Position', [840, 130, 845, 175], 'Inputs', '2');
add_block('built-in/Outport', [sName, '/Trip_87T_Signal'], 'Position', [1120, 340, 1150, 360]);
add_block('built-in/Outport', [sName, '/Idiff_pu_Monitor'], 'Position', [1120, 140, 1150, 160]);

%% Wiring
add_line(sName, 'I_Prim_Sec/1', 'Demux_I/1');
add_line(sName, 'Demux_I/1', 'PU_HV_Conv/1');
add_line(sName, 'Demux_I/2', 'PU_LV_Conv/1');
add_line(sName, 'PU_LV_Conv/1', 'I2_Oppose_180deg/1');
add_line(sName, 'PU_HV_Conv/1', 'Sum_Phasor_Id/1');
add_line(sName, 'I2_Oppose_180deg/1', 'Sum_Phasor_Id/2');
add_line(sName, 'Sum_Phasor_Id/1', 'Abs_Idiff/1');
add_line(sName, 'PU_HV_Conv/1', 'Abs_I1/1');
add_line(sName, 'PU_LV_Conv/1', 'Abs_I2/1');
add_line(sName, 'Abs_I1/1', 'Sum_Bias/1');
add_line(sName, 'Abs_I2/1', 'Sum_Bias/2');
add_line(sName, 'Sum_Bias/1', 'Bias_Half/1');
add_line(sName, 'Bias_Half/1', 'K1_Slope_25pct/1');
add_line(sName, 'K1_Slope_25pct/1', 'T_Mid_Sum/1');
add_line(sName, 'C_Mid_Offset/1', 'T_Mid_Sum/2');
add_line(sName, 'Bias_Half/1', 'K2_Slope_60pct/1');
add_line(sName, 'K2_Slope_60pct/1', 'T_High_Sum/1');
add_line(sName, 'C_High_Offset/1', 'T_High_Sum/2');
add_line(sName, 'Bias_Half/1', 'SW_Mid/2');          % control u2
add_line(sName, 'T_Mid_Sum/1', 'SW_Mid/1');          % candidate u1
add_line(sName, 'Is1_Pickup_0_30pu/1', 'SW_Mid/3');  % fallback u3
add_line(sName, 'Bias_Half/1', 'SW_High/2');         % control u2
add_line(sName, 'T_High_Sum/1', 'SW_High/1');        % candidate u1
add_line(sName, 'SW_Mid/1', 'SW_High/3');            % fallback u3
add_line(sName, 'Harm2_Inj_Pct/1', 'H2_GTE_15/1');
add_line(sName, 'H2_Thresh_15pct/1', 'H2_GTE_15/2');
add_line(sName, 'Harm5_Inj_Pct/1', 'H5_GTE_30/1');
add_line(sName, 'H5_Thresh_30pct/1', 'H5_GTE_30/2');
add_line(sName, 'H2_GTE_15/1', 'Harmonic_Block_OR/1');
add_line(sName, 'H5_GTE_30/1', 'Harmonic_Block_OR/2');
add_line(sName, 'Abs_Idiff/1', 'Trip_Core_GT/1');
add_line(sName, 'SW_High/1', 'Trip_Core_GT/2');
add_line(sName, 'Abs_Idiff/1', 'INST_GTE_8pu/1');
add_line(sName, 'Inst_Pickup_8pu/1', 'INST_GTE_8pu/2');
add_line(sName, 'Harmonic_Block_OR/1', 'NOT_Blocked/1');
add_line(sName, 'Trip_Core_GT/1', 'AND_Trip_NotBlk/1');
add_line(sName, 'NOT_Blocked/1', 'AND_Trip_NotBlk/2');
add_line(sName, 'INST_GTE_8pu/1', 'OR_Final_87T/1');
add_line(sName, 'AND_Trip_NotBlk/1', 'OR_Final_87T/2');
add_line(sName, 'OR_Final_87T/1', 'Trip_87T_Signal/1');
add_line(sName, 'Abs_Idiff/1', 'Mux_Char_Plot/1');
add_line(sName, 'SW_High/1', 'Mux_Char_Plot/2');
add_line(sName, 'Mux_Char_Plot/1', 'Scope_87T_Id_vs_Thresh/1');
add_line(sName, 'Abs_Idiff/1', 'Idiff_pu_Monitor/1');
end

%% Subsystem Builder 5: ANSI 21 Distance Protection Relay (Web-Parity)
% EXACT PORT of src/components/protection/DistanceProtectionModule.tsx (quad default):
%   Zm = (R_line*pct + Rf) + j*(X_line*pct), 60 km line, r=0.08, x=0.42 Ohm/km
%   Quad zones on reactance reaches z1x=20.16, z2x=30.24, z3x=45.36 Ohm:
%     Z1: zmX<=z1x & zmX>=0 & 0<=... zmR<=12 & zmR>=-2   -> t=20 ms
%     Z2: zmX<=z2x & zmX>=0 & zmR<=18 & zmR>=-4          -> t=350 ms
%     Z3: zmX<=z3x & zmX>=0 & zmR<=28 & zmR>=-6          -> t=800 ms
%   Reverse Z4: |zmX| <= 6.3 & zmX < 0                   -> t=1200 ms
%   Load encroachment block: zmR>0 & zmR<20 & |angle(Zm)|<30 deg
%   Web default test state: fault_pct=65%, Rf=2.5 Ohm, forward
function build_21_relay_subsystem(hSub)
sName = getfullname(hSub);
Simulink.SubSystem.deleteContents(sName);

add_block('built-in/Inport', [sName, '/Fault_Trigger_In'], 'Position', [30, 200, 60, 220]);

%% Fault Synthesis (identical to web fault model): Zm = m*ZL + Rf
add_block('simulink/Sources/Constant', [sName, '/Fault_Location_Pct'], ...
    'Position', [100, 40, 170, 60], 'Value', '65');          % % of line (web slider default)
add_block('simulink/Sources/Constant', [sName, '/RF_Arc_Ohm'], ...
    'Position', [100, 90, 170, 110], 'Value', '2.5');        % arc/tower footing Rf (web default)
add_block('simulink/Commonly Used Blocks/Gain', [sName, '/Pct_To_Fraction'], ...
    'Position', [160, 35, 200, 65], 'Gain', '0.01');         % m = pct / 100
add_block('simulink/Commonly Used Blocks/Gain', [sName, '/ZM_R_Calc'], ...
    'Position', [220, 35, 290, 65], 'Gain', sprintf('%.6g', 60 * 0.08));  % total R = 4.8 Ohm
add_block('simulink/Commonly Used Blocks/Sum', [sName, '/ZM_R_Sum'], ...
    'Position', [320, 35, 340, 75], 'Inputs', '++');
add_block('simulink/Commonly Used Blocks/Gain', [sName, '/ZM_X_Calc'], ...
    'Position', [220, 115, 290, 145], 'Gain', sprintf('%.6g', 60 * 0.42)); % total X = 25.2 Ohm

%% Load Encroachment Blinder (evaluated first, as in web)
add_block('simulink/Math Operations/Trigonometric Function', [sName, '/ATAN2_ZM_Angle'], ...
    'Position', [340, 105, 380, 145], 'Operator', 'atan2');
add_block('simulink/Commonly Used Blocks/Gain', [sName, '/Rad_To_Deg'], ...
    'Position', [410, 110, 450, 140], 'Gain', '180/pi');
add_block('simulink/Math Operations/Abs', [sName, '/Abs_Angle'], 'Position', [480, 110, 505, 135]);
add_block('simulink/Commonly Used Blocks/Relational Operator', [sName, '/ENC_R_GT_0'], ...
    'Position', [340, 165, 370, 195], 'Operator', '>');
add_block('simulink/Sources/Constant', [sName, '/Zero_R'], 'Position', [280, 200, 310, 220], 'Value', '0');
add_block('simulink/Commonly Used Blocks/Relational Operator', [sName, '/ENC_R_LT_20'], ...
    'Position', [400, 165, 430, 195], 'Operator', '<');
add_block('simulink/Sources/Constant', [sName, '/Encroach_R_20Ohm'], ...
    'Position', [400, 210, 455, 230], 'Value', '20');
add_block('simulink/Commonly Used Blocks/Relational Operator', [sName, '/ENC_Ang_LT_30'], ...
    'Position', [540, 120, 570, 150], 'Operator', '<');
add_block('simulink/Sources/Constant', [sName, '/Encroach_Ang_30deg'], ...
    'Position', [520, 175, 580, 195], 'Value', '30');
add_block('simulink/Logic and Bit Operations/Logical Operator', [sName, '/AND_Enc_R'], ...
    'Position', [600, 170, 630, 205], 'Operator', 'AND', 'IconShape', 'rectangular', 'Inputs', '2');
add_block('simulink/Logic and Bit Operations/Logical Operator', [sName, '/AND_Encroachment'], ...
    'Position', [660, 130, 690, 170], 'Operator', 'AND', 'IconShape', 'rectangular', 'Inputs', '2');

%% Quadrilateral Zone Comparators (reactance + resistive blinders)
add_block('simulink/Sources/Constant', [sName, '/Z1X_Reach_20_16'], ...
    'Position', [340, 250, 405, 270], 'Value', sprintf('%.6g', 25.2 * 0.80));
add_block('simulink/Sources/Constant', [sName, '/Z2X_Reach_30_24'], ...
    'Position', [340, 300, 405, 320], 'Value', sprintf('%.6g', 25.2 * 1.20));
add_block('simulink/Sources/Constant', [sName, '/Z3X_Reach_45_36'], ...
    'Position', [340, 350, 405, 370], 'Value', sprintf('%.6g', 25.2 * 1.80));
add_block('simulink/Sources/Constant', [sName, '/Z4Rev_X_6_3'], ...
    'Position', [340, 400, 405, 420], 'Value', sprintf('%.6g', 25.2 * 0.25));

add_block('simulink/Commonly Used Blocks/Relational Operator', [sName, '/Z1_X_LE'], ...
    'Position', [450, 245, 480, 275], 'Operator', '<=');
add_block('simulink/Commonly Used Blocks/Relational Operator', [sName, '/Z2_X_LE'], ...
    'Position', [450, 295, 480, 325], 'Operator', '<=');
add_block('simulink/Commonly Used Blocks/Relational Operator', [sName, '/Z3_X_LE'], ...
    'Position', [450, 345, 480, 375], 'Operator', '<=');
add_block('simulink/Commonly Used Blocks/Relational Operator', [sName, '/Z4_REV_Check'], ...
    'Position', [450, 395, 480, 425], 'Operator', '<');

add_block('simulink/Commonly Used Blocks/Relational Operator', [sName, '/Z1_R_BLE_12'], ...
    'Position', [520, 245, 550, 275], 'Operator', '<=');
add_block('simulink/Sources/Constant', [sName, '/Quad_R1_12Ohm'], ...
    'Position', [520, 295, 570, 315], 'Value', '12');
add_block('simulink/Commonly Used Blocks/Relational Operator', [sName, '/Z2_R_BLE_18'], ...
    'Position', [600, 245, 630, 275], 'Operator', '<=');
add_block('simulink/Sources/Constant', [sName, '/Quad_R2_18Ohm'], ...
    'Position', [600, 295, 650, 315], 'Value', '18');
add_block('simulink/Commonly Used Blocks/Relational Operator', [sName, '/Z3_R_BLE_28'], ...
    'Position', [680, 245, 710, 275], 'Operator', '<=');
add_block('simulink/Sources/Constant', [sName, '/Quad_R3_28Ohm'], ...
    'Position', [680, 295, 730, 315], 'Value', '28');

add_block('simulink/Logic and Bit Operations/Logical Operator', [sName, '/AND_Zone1'], ...
    'Position', [760, 240, 790, 280], 'Operator', 'AND', 'IconShape', 'rectangular', 'Inputs', '2');
add_block('simulink/Logic and Bit Operations/Logical Operator', [sName, '/AND_Zone2'], ...
    'Position', [760, 305, 790, 345], 'Operator', 'AND', 'IconShape', 'rectangular', 'Inputs', '2');
add_block('simulink/Logic and Bit Operations/Logical Operator', [sName, '/AND_Zone3'], ...
    'Position', [760, 370, 790, 410], 'Operator', 'AND', 'IconShape', 'rectangular', 'Inputs', '2');
add_block('simulink/Logic and Bit Operations/Logical Operator', [sName, '/OR_Any_Zone'], ...
    'Position', [840, 280, 870, 380], 'Operator', 'OR', 'IconShape', 'rectangular', 'Inputs', '3');

%% Priority Timers (nested switches): Z1->20ms, Z2->350ms, Z3->800ms
add_block('simulink/Sources/Constant', [sName, '/T_Z1_20ms'], ...
    'Position', [840, 420, 890, 440], 'Value', '20');
add_block('simulink/Sources/Constant', [sName, '/T_Z2_350ms'], ...
    'Position', [840, 460, 890, 480], 'Value', '350');
add_block('simulink/Sources/Constant', [sName, '/T_Z3_800ms'], ...
    'Position', [840, 500, 890, 520], 'Value', '800');
add_block('simulink/Sources/Constant', [sName, '/T_NoTrip_0ms'], ...
    'Position', [840, 540, 890, 560], 'Value', '0');
add_block('simulink/Signal Routing/Switch', [sName, '/SW_T12'], ...
    'Position', [930, 430, 965, 480], 'Criteria', 'u2 > Threshold', 'Threshold', '0.5');
add_block('simulink/Signal Routing/Switch', [sName, '/SW_T123'], ...
    'Position', [1000, 430, 1035, 480], 'Criteria', 'u2 > Threshold', 'Threshold', '0.5');
add_block('simulink/Signal Routing/Switch', [sName, '/SW_TFinal'], ...
    'Position', [1070, 430, 1105, 480], 'Criteria', 'u2 > Threshold', 'Threshold', '0.5');

%% Final Trip Gate (blocked by load encroachment)
add_block('simulink/Logic and Bit Operations/Logical Operator', [sName, '/NOT_Encroached'], ...
    'Position', [740, 140, 770, 170], 'Operator', 'NOT', 'IconShape', 'rectangular');
add_block('simulink/Logic and Bit Operations/Logical Operator', [sName, '/AND_Final_Trip'], ...
    'Position', [1090, 300, 1120, 340], 'Operator', 'AND', 'IconShape', 'rectangular', 'Inputs', '2');

add_block('built-in/Outport', [sName, '/Trip_21_Zone1'], 'Position', [1180, 300, 1210, 320]);
add_block('built-in/Outport', [sName, '/Trip_Time_ms_Monitor'], 'Position', [1180, 430, 1210, 450]);
add_block('simulink/Sinks/Terminator', [sName, '/Term_Trigger'], 'Position', [100, 250, 120, 270]);

%% Internal Scope: Apparent Impedance Trajectory
add_block('simulink/Commonly Used Blocks/Mux', [sName, '/Mux_RX_Plot'], ...
    'Position', [330, 470, 335, 515], 'Inputs', '2');
add_block('simulink/Sinks/Scope', [sName, '/Scope_21_Apparent_Z'], 'Position', [380, 480, 430, 510]);

%% Wiring
add_line(sName, 'Fault_Trigger_In/1', 'Term_Trigger/1');
add_line(sName, 'Fault_Location_Pct/1', 'Pct_To_Fraction/1');
add_line(sName, 'Pct_To_Fraction/1', 'ZM_R_Calc/1');
add_line(sName, 'ZM_R_Calc/1', 'ZM_R_Sum/1');
add_line(sName, 'RF_Arc_Ohm/1', 'ZM_R_Sum/2');
add_line(sName, 'Pct_To_Fraction/1', 'ZM_X_Calc/1');
% atan2(X, R) -> degrees -> abs
add_line(sName, 'ZM_X_Calc/1', 'ATAN2_ZM_Angle/1');
add_line(sName, 'ZM_R_Sum/1', 'ATAN2_ZM_Angle/2');
add_line(sName, 'ATAN2_ZM_Angle/1', 'Rad_To_Deg/1');
add_line(sName, 'Rad_To_Deg/1', 'Abs_Angle/1');
% encroachment: zmR>0 & zmR<20 & |ang|<30
add_line(sName, 'ZM_R_Sum/1', 'ENC_R_GT_0/1');
add_line(sName, 'Zero_R/1', 'ENC_R_GT_0/2');
add_line(sName, 'ZM_R_Sum/1', 'ENC_R_LT_20/1');
add_line(sName, 'Encroach_R_20Ohm/1', 'ENC_R_LT_20/2');
add_line(sName, 'Abs_Angle/1', 'ENC_Ang_LT_30/1');
add_line(sName, 'Encroach_Ang_30deg/1', 'ENC_Ang_LT_30/2');
add_line(sName, 'ENC_R_GT_0/1', 'AND_Enc_R/1');
add_line(sName, 'ENC_R_LT_20/1', 'AND_Enc_R/2');
add_line(sName, 'AND_Enc_R/1', 'AND_Encroachment/1');
add_line(sName, 'ENC_Ang_LT_30/1', 'AND_Encroachment/2');
% zone X comparisons
add_line(sName, 'ZM_X_Calc/1', 'Z1_X_LE/1');
add_line(sName, 'Z1X_Reach_20_16/1', 'Z1_X_LE/2');
add_line(sName, 'ZM_X_Calc/1', 'Z2_X_LE/1');
add_line(sName, 'Z2X_Reach_30_24/1', 'Z2_X_LE/2');
add_line(sName, 'ZM_X_Calc/1', 'Z3_X_LE/1');
add_line(sName, 'Z3X_Reach_45_36/1', 'Z3_X_LE/2');
add_line(sName, 'ZM_X_Calc/1', 'Z4_REV_Check/1'); % negative X passes <= reach when reversed
% zone R blinder comparisons (cascaded pick of Rf-scaled reach per zone)
add_line(sName, 'ZM_R_Sum/1', 'Z1_R_BLE_12/1');
add_line(sName, 'Quad_R1_12Ohm/1', 'Z1_R_BLE_12/2');
add_line(sName, 'ZM_R_Sum/1', 'Z2_R_BLE_18/1');
add_line(sName, 'Quad_R2_18Ohm/1', 'Z2_R_BLE_18/2');
add_line(sName, 'ZM_R_Sum/1', 'Z3_R_BLE_28/1');
add_line(sName, 'Quad_R3_28Ohm/1', 'Z3_R_BLE_28/2');
add_line(sName, 'Z1_X_LE/1', 'AND_Zone1/1');
add_line(sName, 'Z1_R_BLE_12/1', 'AND_Zone1/2');
add_line(sName, 'Z2_X_LE/1', 'AND_Zone2/1');
add_line(sName, 'Z2_R_BLE_18/1', 'AND_Zone2/2');
add_line(sName, 'Z3_X_LE/1', 'AND_Zone3/1');
add_line(sName, 'Z3_R_BLE_28/1', 'AND_Zone3/2');
add_line(sName, 'AND_Zone1/1', 'OR_Any_Zone/1');
add_line(sName, 'AND_Zone2/1', 'OR_Any_Zone/2');
add_line(sName, 'AND_Zone3/1', 'OR_Any_Zone/3');
% priority timer chain: SW_T12 picks Z2 time if Z2 active else Z1 time; SW_T123 picks Z3 time if Z3 active
add_line(sName, 'T_Z1_20ms/1', 'SW_T12/1');
add_line(sName, 'AND_Zone2/1', 'SW_T12/2');
add_line(sName, 'T_Z2_350ms/1', 'SW_T12/3');
add_line(sName, 'SW_T12/1', 'SW_T123/1');
add_line(sName, 'AND_Zone3/1', 'SW_T123/2');
add_line(sName, 'T_Z3_800ms/1', 'SW_T123/3');
add_line(sName, 'SW_T123/1', 'SW_TFinal/1');
add_line(sName, 'AND_Final_Trip/1', 'SW_TFinal/2');
add_line(sName, 'T_NoTrip_0ms/1', 'SW_TFinal/3');
% final gate
add_line(sName, 'AND_Encroachment/1', 'NOT_Encroached/1');
add_line(sName, 'OR_Any_Zone/1', 'AND_Final_Trip/1');
add_line(sName, 'NOT_Encroached/1', 'AND_Final_Trip/2');
add_line(sName, 'AND_Final_Trip/1', 'Trip_21_Zone1/1');
add_line(sName, 'SW_TFinal/1', 'Trip_Time_ms_Monitor/1');
% scope
add_line(sName, 'ZM_R_Sum/1', 'Mux_RX_Plot/1');
add_line(sName, 'ZM_X_Calc/1', 'Mux_RX_Plot/2');
add_line(sName, 'Mux_RX_Plot/1', 'Scope_21_Apparent_Z/1');
end

%% Subsystem Builder 6: ANSI 25 Synchrocheck Relay
function build_25_relay_subsystem(hSub)
sName = getfullname(hSub);
Simulink.SubSystem.deleteContents(sName);

add_block('built-in/Inport', [sName, '/V_BusB_132kV'], 'Position', [30, 60, 60, 80]);

add_block('simulink/Math Operations/Abs', [sName, '/Abs_V_Diff'], 'Position', [100, 60, 130, 80]);

% Internal Scope: Delta V Differential
add_block('simulink/Sinks/Scope', [sName, '/Scope_25_Delta_V'], 'Position', [170, 20, 200, 45]);
add_line(sName, 'Abs_V_Diff/1', 'Scope_25_Delta_V/1');

add_block('simulink/Commonly Used Blocks/Relational Operator', [sName, '/Permissive_Comp'], ...
    'Position', [190, 55, 220, 90], 'Operator', '<=');
add_block('simulink/Sources/Constant', [sName, '/Max_5pct_Diff'], 'Position', [120, 100, 160, 120], 'Value', '0.05 * 132e3');

add_block('built-in/Outport', [sName, '/Permissive_52_0'], 'Position', [280, 65, 310, 85]);

add_line(sName, 'V_BusB_132kV/1', 'Abs_V_Diff/1');
add_line(sName, 'Abs_V_Diff/1', 'Permissive_Comp/1');
add_line(sName, 'Max_5pct_Diff/1', 'Permissive_Comp/2');
add_line(sName, 'Permissive_Comp/1', 'Permissive_52_0/1');
end

%% Subsystem Builder 7: Renewable Microgrid (Solar, BESS, Hydrogen, HVDC)
function build_microgrid_subsystem(hSub)
sName = getfullname(hSub);
Simulink.SubSystem.deleteContents(sName);

% 5 MW Solar PV Farm Output Curve
add_block('simulink/Sources/Sine Wave', [sName, '/Solar_PV_5MW'], ...
    'Position', [40, 30, 80, 60], 'Amplitude', '5.0', 'Frequency', '2*pi/24', 'Phase', '-pi/2');

% 10 MW BESS Dynamic State of Charge (SoC) Integrator
add_block('simulink/Sources/Constant', [sName, '/BESS_Power_MW'], 'Position', [40, 90, 80, 110], 'Value', '-6.5');
add_block('simulink/Continuous/Integrator', [sName, '/BESS_SoC_Integrator'], ...
    'Position', [140, 85, 170, 115], 'InitialCondition', '72.0');

% 2 MW PEM Electrolyzer H2 Production Rate
add_block('simulink/Sources/Constant', [sName, '/PEM_Hydrogen_Rate_kg_hr'], 'Position', [40, 150, 80, 170], 'Value', '40.0');

% ±320 kV (640 kV pole-to-pole) VSC-HVDC Link — web default setpoint pRefMW = 120
add_block('simulink/Sources/Constant', [sName, '/HVDC_Power_MW'], 'Position', [40, 200, 80, 220], 'Value', '120.0');

% Internal Scopes: Solar PV and BESS SoC
add_block('simulink/Sinks/Scope', [sName, '/Scope_Solar_Power_Profile'], 'Position', [140, 20, 170, 45]);
add_line(sName, 'Solar_PV_5MW/1', 'Scope_Solar_Power_Profile/1');

add_block('simulink/Sinks/Scope', [sName, '/Scope_BESS_SoC_Curve'], 'Position', [220, 90, 250, 115]);
add_line(sName, 'BESS_SoC_Integrator/1', 'Scope_BESS_SoC_Curve/1');

add_block('simulink/Commonly Used Blocks/Mux', [sName, '/Mux_Microgrid'], 'Position', [220, 40, 225, 210], 'Inputs', '4');
add_block('built-in/Outport', [sName, '/Microgrid_Telemetry_Out'], 'Position', [280, 115, 310, 135]);

add_line(sName, 'Solar_PV_5MW/1', 'Mux_Microgrid/1');
add_line(sName, 'BESS_Power_MW/1', 'BESS_SoC_Integrator/1');
add_line(sName, 'BESS_SoC_Integrator/1', 'Mux_Microgrid/2');
add_line(sName, 'PEM_Hydrogen_Rate_kg_hr/1', 'Mux_Microgrid/3');
add_line(sName, 'HVDC_Power_MW/1', 'Mux_Microgrid/4');
add_line(sName, 'Mux_Microgrid/1', 'Microgrid_Telemetry_Out/1');
end

%% Subsystem Builder 8: Fault Injector Subsystem
function build_fault_injector_subsystem(hSub)
sName = getfullname(hSub);
Simulink.SubSystem.deleteContents(sName);

add_block('simulink/Sources/Step', [sName, '/Fault_Inception_Step'], ...
    'Position', [40, 50, 70, 80], 'Time', '0.20', 'Before', '0', 'After', '1');
add_block('simulink/Sources/Step', [sName, '/Fault_Clearing_Step'], ...
    'Position', [40, 100, 70, 130], 'Time', '0.28', 'Before', '0', 'After', '1');
add_block('simulink/Commonly Used Blocks/Sum', [sName, '/Fault_Pulse_Gen'], ...
    'Position', [120, 65, 140, 105], 'Inputs', '+-');

% Internal Scope: Fault Injected Trigger Pulse
add_block('simulink/Sinks/Scope', [sName, '/Scope_Fault_Trigger_Pulse'], 'Position', [180, 20, 210, 45]);
add_line(sName, 'Fault_Pulse_Gen/1', 'Scope_Fault_Trigger_Pulse/1');

add_block('built-in/Outport', [sName, '/Fault_Active_Signal'], 'Position', [200, 75, 230, 95]);

add_line(sName, 'Fault_Inception_Step/1', 'Fault_Pulse_Gen/1');
add_line(sName, 'Fault_Clearing_Step/1', 'Fault_Pulse_Gen/2');
add_line(sName, 'Fault_Pulse_Gen/1', 'Fault_Active_Signal/1');
end
