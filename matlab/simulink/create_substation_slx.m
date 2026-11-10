function model_path = create_substation_slx()
% CREATE_SUBSTATION_SLX Programmatically constructs the complete Simscape Electrical
% / Simulink Digital Twin Model (.slx) matching the 132/13.8 kV SAS Substation.
%
% Architecture & Subsystems:
% 1. Powergui Block (Phasor / Discrete 50 us Solver)
% 2. 132 kV Grid Infeed (Three-Phase Source 132 kV rms, 60 Hz, 2500 MVA)
% 3. 132 kV Double Busbar (Bus A & Bus B) + Bus Coupler Breaker (52-0)
% 4. 40 MVA Dyn11 Transformer TR-1 (132/13.8 kV, Z=12.5%, X/R=18)
% 5. 40 MVA Dyn11 Transformer TR-2 (132/13.8 kV, Z=12.5%, X/R=18)
% 6. 13.8 kV Medium Voltage Busbars & Sectionalizer Breaker (52-6)
% 7. 4 Outgoing Feeders (F-01 Industrial, F-02 Commercial, F-03 Residential, F-04 Water)
% 8. ANSI 87T Transformer Differential Protection Controller Subsystem
% 9. ANSI 21 Line Distance Protection Relay Controller Subsystem
% 10. ANSI 25 Synchrocheck & Synchroscope Interlocking Subsystem
% 11. Renewable Microgrid Subsystems (5 MW Solar PV, 10 MW BESS, 2 MW H2 PEM, ±320 kV HVDC Link)
% 12. 3-Phase Fault Injection Block (SLG & 3-Phase Bolted Faults)
% 13. Telemetry Scopes & Workspace Logging Ports

model_name = 'substation_132_13_8kv_digital_twin';
curr_dir = fileparts(mfilename('fullpath'));
model_path = fullfile(curr_dir, [model_name, '.slx']);

fprintf('========================================================================\n');
fprintf('   GENERATING SIMULINK / SIMSCAPE ELECTRICAL SUBSTATION MODEL (.SLX)    \n');
fprintf('========================================================================\n\n');

% Close if already open
if bdIsLoaded(model_name)
    close_system(model_name, 0);
end

% Create new model
fprintf('[1/6] Initializing Simulink Architecture...\n');
new_system(model_name);
open_system(model_name);

% Configure Solver Parameters
set_param(model_name, 'Solver', 'ode23tb');
set_param(model_name, 'StopTime', '1.0');
set_param(model_name, 'MaxStep', '50e-6');
set_param(model_name, 'SaveTime', 'on');
set_param(model_name, 'SaveOutput', 'on');

%% Step 2: Add Core Simscape Electrical & Power System Blocks
fprintf('[2/6] Instantiating Power System & Switchgear Blocks...\n');

% Load libraries
load_system('powerlib');
load_system('simulink');

% 1. Powergui
add_block('powerlib/powergui', [model_name, '/Powergui'], ...
    'Position', [40, 30, 110, 70], ...
    'SimulationMode', 'Continuous');

% 2. 132 kV Grid Source
add_block('powerlib/Electrical Sources/Three-Phase Source', [model_name, '/Grid_132kV'], ...
    'Position', [60, 150, 150, 220], ...
    'Voltage', '132e3', ...
    'Frequency', '60', ...
    'BasePower', '2500e6', ...
    'XRratio', '12', ...
    'SpecifyRef', 'Internal', ...
    'SourceType', 'ideal');

% 3. 132 kV Bus A V-I Measurement
add_block('powerlib/Measurements/Three-Phase V-I Measurement', [model_name, '/VI_Meas_132kV_BusA'], ...
    'Position', [220, 150, 270, 220], ...
    'VoltageMeasurement', 'phase-to-ground', ...
    'CurrentMeasurement', 'yes');

% 4. 132 kV Bus Coupler Breaker (52-0)
add_block('powerlib/Elements/Three-Phase Breaker', [model_name, '/CB_52_0_Coupler'], ...
    'Position', [220, 280, 280, 340], ...
    'InitialState', '1', ...
    'SwitchA', '1', 'SwitchB', '1', 'SwitchC', '1');

% 5. 132 kV Incomer Breaker TR-1 (52-1)
add_block('powerlib/Elements/Three-Phase Breaker', [model_name, '/CB_52_1_Incomer'], ...
    'Position', [340, 150, 400, 210], ...
    'InitialState', '1', ...
    'SwitchA', '1', 'SwitchB', '1', 'SwitchC', '1');

% 6. Transformer TR-1 (40 MVA, 132/13.8 kV, Dyn11)
add_block('powerlib/Elements/Three-Phase Transformer (Two Windings)', [model_name, '/TR1_40MVA_Dyn11'], ...
    'Position', [460, 145, 550, 225], ...
    'Winding1Connection', 'Delta (D1)', ...
    'Winding2Connection', 'Yn', ...
    'NominalPower', '[40e6, 60]', ...
    'Winding1', '[132e3, 0.002, 0.06]', ...
    'Winding2', '[13.8e3, 0.002, 0.06]');

% 7. 13.8 kV MV Bus 1 V-I Measurement
add_block('powerlib/Measurements/Three-Phase V-I Measurement', [model_name, '/VI_Meas_13_8kV_Bus1'], ...
    'Position', [610, 150, 660, 220], ...
    'VoltageMeasurement', 'phase-to-ground', ...
    'CurrentMeasurement', 'yes');

% 8. 13.8 kV Bus Sectionalizer Breaker (52-6)
add_block('powerlib/Elements/Three-Phase Breaker', [model_name, '/CB_52_6_Sectionalizer'], ...
    'Position', [610, 280, 670, 340], ...
    'InitialState', '1', ...
    'SwitchA', '1', 'SwitchB', '1', 'SwitchC', '1');

% 9. Outgoing Feeders (F-01 Industrial & F-02 Commercial)
add_block('powerlib/Elements/Three-Phase Parallel RLC Load', [model_name, '/Feeder_01_Industrial_8_5MW'], ...
    'Position', [750, 110, 830, 160], ...
    'NominalPhaseToPhaseVoltage', '13.8e3', ...
    'NominalFrequency', '60', ...
    'ActivePower', '8.5e6', ...
    'InductiveReactivePower', '2.8e6');

add_block('powerlib/Elements/Three-Phase Parallel RLC Load', [model_name, '/Feeder_02_Commercial_6_2MW'], ...
    'Position', [750, 200, 830, 250], ...
    'NominalPhaseToPhaseVoltage', '13.8e3', ...
    'NominalFrequency', '60', ...
    'ActivePower', '6.2e6', ...
    'InductiveReactivePower', '1.9e6');

% 10. Fault Infiltration Block (SLG & 3-Phase Faults)
add_block('powerlib/Elements/Three-Phase Fault', [model_name, '/Substation_Fault_Injector'], ...
    'Position', [480, 280, 540, 340], ...
    'FaultResistance', '0.01', ...
    'GroundResistance', '0.01', ...
    'FaultTime', '[0.20, 0.28]', ... % Injected at 200 ms for 80 ms duration
    'FaultA', '1', 'FaultB', '0', 'FaultC', '0', 'Ground', '1');

%% Step 3: Add Microgrid Subsystems (Solar, BESS, Hydrogen, HVDC)
fprintf('[3/6] Building Renewable Microgrid Subsystems...\n');

% 5 MW Solar PV Farm Load/Inverter Block
add_block('powerlib/Elements/Three-Phase Parallel RLC Load', [model_name, '/Solar_PV_5MW_Infeed'], ...
    'Position', [750, 290, 830, 340], ...
    'NominalPhaseToPhaseVoltage', '13.8e3', ...
    'NominalFrequency', '60', ...
    'ActivePower', '-4.5e6', ... % Negative active power = Local Infeed Generation
    'InductiveReactivePower', '0.5e6');

% 10 MW BESS Battery Infeed Block
add_block('powerlib/Elements/Three-Phase Parallel RLC Load', [model_name, '/BESS_10MW_Storage'], ...
    'Position', [750, 380, 830, 430], ...
    'NominalPhaseToPhaseVoltage', '13.8e3', ...
    'NominalFrequency', '60', ...
    'ActivePower', '-6.0e6', ... % Discharge mode
    'InductiveReactivePower', '0.0');

% 2 MW Green Hydrogen PEM Electrolyzer
add_block('powerlib/Elements/Three-Phase Parallel RLC Load', [model_name, '/PEM_Hydrogen_2MW_Plant'], ...
    'Position', [750, 470, 830, 520], ...
    'NominalPhaseToPhaseVoltage', '13.8e3', ...
    'NominalFrequency', '60', ...
    'ActivePower', '2.0e6', ...
    'InductiveReactivePower', '0.3e6');

%% Step 4: Build Protection & SCADA Subsystems (ANSI 87T, ANSI 21, ANSI 25)
fprintf('[4/6] Constructing Protection Relay Control Blocks...\n');

% ANSI 87T Transformer Differential Relay Subsystem
hSub87T = add_block('simulink/Commonly Used Blocks/Subsystem', [model_name, '/ANSI_87T_Differential_Relay'], ...
    'Position', [340, 480, 460, 560]);
build_87t_subsystem(hSub87T);

% ANSI 21 Distance Protection Relay Subsystem
hSub21 = add_block('simulink/Commonly Used Blocks/Subsystem', [model_name, '/ANSI_21_Distance_Relay'], ...
    'Position', [180, 480, 300, 560]);
build_21_subsystem(hSub21);

% ANSI 25 Synchrocheck Relay Subsystem
hSub25 = add_block('simulink/Commonly Used Blocks/Subsystem', [model_name, '/ANSI_25_Synchrocheck'], ...
    'Position', [500, 480, 620, 560]);
build_25_subsystem(hSub25);

%% Step 5: Connect Three-Phase Lines & Control Signals
fprintf('[5/6] Wiring Three-Phase Buses & SCADA Telemetry...\n');

% Grid -> 132 kV Bus VI Meas
add_line(model_name, 'Grid_132kV/1', 'VI_Meas_132kV_BusA/1');
add_line(model_name, 'Grid_132kV/2', 'VI_Meas_132kV_BusA/2');
add_line(model_name, 'Grid_132kV/3', 'VI_Meas_132kV_BusA/3');

% 132 kV Bus -> Incomer Breaker 52-1
add_line(model_name, 'VI_Meas_132kV_BusA/1', 'CB_52_1_Incomer/1');
add_line(model_name, 'VI_Meas_132kV_BusA/2', 'CB_52_1_Incomer/2');
add_line(model_name, 'VI_Meas_132kV_BusA/3', 'CB_52_1_Incomer/3');

% Incomer Breaker 52-1 -> TR-1 Primary
add_line(model_name, 'CB_52_1_Incomer/1', 'TR1_40MVA_Dyn11/1');
add_line(model_name, 'CB_52_1_Incomer/2', 'TR1_40MVA_Dyn11/2');
add_line(model_name, 'CB_52_1_Incomer/3', 'TR1_40MVA_Dyn11/3');

% TR-1 Secondary -> 13.8 kV Bus VI Meas
add_line(model_name, 'TR1_40MVA_Dyn11/1', 'VI_Meas_13_8kV_Bus1/1');
add_line(model_name, 'TR1_40MVA_Dyn11/2', 'VI_Meas_13_8kV_Bus1/2');
add_line(model_name, 'TR1_40MVA_Dyn11/3', 'VI_Meas_13_8kV_Bus1/3');

% 13.8 kV Bus -> Feeders & Microgrid
add_line(model_name, 'VI_Meas_13_8kV_Bus1/1', 'Feeder_01_Industrial_8_5MW/1');
add_line(model_name, 'VI_Meas_13_8kV_Bus1/2', 'Feeder_01_Industrial_8_5MW/2');
add_line(model_name, 'VI_Meas_13_8kV_Bus1/3', 'Feeder_01_Industrial_8_5MW/3');

add_line(model_name, 'VI_Meas_13_8kV_Bus1/1', 'Feeder_02_Commercial_6_2MW/1');
add_line(model_name, 'VI_Meas_13_8kV_Bus1/2', 'Feeder_02_Commercial_6_2MW/2');
add_line(model_name, 'VI_Meas_13_8kV_Bus1/3', 'Feeder_02_Commercial_6_2MW/3');

add_line(model_name, 'VI_Meas_13_8kV_Bus1/1', 'Solar_PV_5MW_Infeed/1');
add_line(model_name, 'VI_Meas_13_8kV_Bus1/2', 'Solar_PV_5MW_Infeed/2');
add_line(model_name, 'VI_Meas_13_8kV_Bus1/3', 'Solar_PV_5MW_Infeed/3');

add_line(model_name, 'VI_Meas_13_8kV_Bus1/1', 'BESS_10MW_Storage/1');
add_line(model_name, 'VI_Meas_13_8kV_Bus1/2', 'BESS_10MW_Storage/2');
add_line(model_name, 'VI_Meas_13_8kV_Bus1/3', 'BESS_10MW_Storage/3');

add_line(model_name, 'VI_Meas_13_8kV_Bus1/1', 'PEM_Hydrogen_2MW_Plant/1');
add_line(model_name, 'VI_Meas_13_8kV_Bus1/2', 'PEM_Hydrogen_2MW_Plant/2');
add_line(model_name, 'VI_Meas_13_8kV_Bus1/3', 'PEM_Hydrogen_2MW_Plant/3');

% Fault Injector connection to TR-1 Primary
add_line(model_name, 'CB_52_1_Incomer/1', 'Substation_Fault_Injector/1');
add_line(model_name, 'CB_52_1_Incomer/2', 'Substation_Fault_Injector/2');
add_line(model_name, 'CB_52_1_Incomer/3', 'Substation_Fault_Injector/3');

%% Step 6: Add Telemetry Scopes & Outports
fprintf('[6/6] Adding Scopes & Exporting Model...\n');

add_block('simulink/Sinks/Scope', [model_name, '/Scope_132kV_Bus_Voltage'], ...
    'Position', [340, 50, 400, 90]);
add_line(model_name, 'VI_Meas_132kV_BusA/1', 'Scope_132kV_Bus_Voltage/1');

add_block('simulink/Sinks/Scope', [model_name, '/Scope_13_8kV_Bus_Voltage'], ...
    'Position', [750, 50, 810, 90]);
add_line(model_name, 'VI_Meas_13_8kV_Bus1/1', 'Scope_13_8kV_Bus_Voltage/1');

add_block('simulink/Sinks/To Workspace', [model_name, '/Log_132kV_Telemetry'], ...
    'Position', [340, 100, 420, 130], ...
    'VariableName', 'sim_132kV_telemetry', ...
    'SaveFormat', 'Array');
add_line(model_name, 'VI_Meas_132kV_BusA/1', 'Log_132kV_Telemetry/1');

add_block('simulink/Sinks/To Workspace', [model_name, '/Log_13_8kV_Telemetry'], ...
    'Position', [830, 50, 910, 80], ...
    'VariableName', 'sim_13_8kV_telemetry', ...
    'SaveFormat', 'Array');
add_line(model_name, 'VI_Meas_13_8kV_Bus1/1', 'Log_13_8kV_Telemetry/1');

% Save and close
save_system(model_name, model_path);
fprintf('\n========================================================================\n');
fprintf('   SIMULINK MODEL SAVED SUCCESSFULLY:\n');
fprintf('   --> %s\n', model_path);
fprintf('========================================================================\n');

end

%% Helper Subsystem Builders
function build_87t_subsystem(hSub)
% Builds internal logic for ANSI 87T Differential Protection
sub_name = getfullname(hSub);
% Clear default in/out
Simulink.SubSystem.deleteContents(sub_name);

% Add Inport (Primary & Secondary Currents)
add_block('simulink/Sources/Inport', [sub_name, '/I_prim_sec'], 'Position', [30, 50, 60, 70]);
% Add Web-Parity Pickup (Is1 = 0.30 p.u. — DifferentialProtectionModule.tsx default)
add_block('simulink/Commonly Used Blocks/Gain', [sub_name, '/Dyn11_Matrix_Comp'], 'Position', [100, 45, 160, 75], 'Gain', '1/sqrt(3)');
add_block('simulink/Commonly Used Blocks/Relational Operator', [sub_name, '/Trip_Comparator'], 'Position', [220, 47, 250, 78], 'Operator', '>');
add_block('simulink/Sources/Constant', [sub_name, '/Pickup_Is1_0_30pu'], 'Position', [150, 80, 190, 100], 'Value', '0.30');
add_block('simulink/Sinks/Outport', [sub_name, '/Trip_87T'], 'Position', [310, 55, 340, 75]);

add_line(sub_name, 'I_prim_sec/1', 'Dyn11_Matrix_Comp/1');
add_line(sub_name, 'Dyn11_Matrix_Comp/1', 'Trip_Comparator/1');
add_line(sub_name, 'Pickup_Is1_0_30pu/1', 'Trip_Comparator/2');
add_line(sub_name, 'Trip_Comparator/1', 'Trip_87T/1');
end

function build_21_subsystem(hSub)
% Builds internal logic for ANSI 21 Distance Protection
sub_name = getfullname(hSub);
Simulink.SubSystem.deleteContents(sub_name);

add_block('simulink/Sources/Inport', [sub_name, '/V_I_132kV'], 'Position', [30, 50, 60, 70]);
% Web parity: 60 km line @ 0.42 Ohm/km primary reactance (DistanceProtectionModule.tsx)
add_block('simulink/Commonly Used Blocks/Gain', [sub_name, '/Z_Impedance_Calc'], 'Position', [100, 45, 160, 75], 'Gain', '0.42');
add_block('simulink/Commonly Used Blocks/Relational Operator', [sub_name, '/Zone1_Mho_Comp'], 'Position', [220, 47, 250, 78], 'Operator', '<=');
add_block('simulink/Sources/Constant', [sub_name, '/Z1X_Reach_20_16Ohm'], 'Position', [150, 80, 190, 100], 'Value', sprintf('%.6g', 60 * 0.42 * 0.80));
add_block('simulink/Sinks/Outport', [sub_name, '/Trip_Z1_Instant'], 'Position', [310, 55, 340, 75]);

add_line(sub_name, 'V_I_132kV/1', 'Z_Impedance_Calc/1');
add_line(sub_name, 'Z_Impedance_Calc/1', 'Zone1_Mho_Comp/1');
add_line(sub_name, 'Z1X_Reach_20_16Ohm/1', 'Zone1_Mho_Comp/2');
add_line(sub_name, 'Zone1_Mho_Comp/1', 'Trip_Z1_Instant/1');
end

function build_25_subsystem(hSub)
% Builds internal logic for ANSI 25 Synchrocheck
sub_name = getfullname(hSub);
Simulink.SubSystem.deleteContents(sub_name);

add_block('simulink/Sources/Inport', [sub_name, '/V_BusA_BusB'], 'Position', [30, 50, 60, 70]);
add_block('simulink/Commonly Used Blocks/Sum', [sub_name, '/Delta_Theta_Diff'], 'Position', [110, 45, 140, 75], 'Inputs', '+-');
add_block('simulink/Commonly Used Blocks/Relational Operator', [sub_name, '/Sync_Angle_Check'], 'Position', [200, 47, 230, 78], 'Operator', '<=');
add_block('simulink/Sources/Constant', [sub_name, '/Max_10deg_Limit'], 'Position', [130, 80, 170, 100], 'Value', '10.0');
add_block('simulink/Sinks/Outport', [sub_name, '/Permissive_Close_52_0'], 'Position', [290, 55, 320, 75]);

add_line(sub_name, 'V_BusA_BusB/1', 'Delta_Theta_Diff/1');
add_line(sub_name, 'Delta_Theta_Diff/1', 'Sync_Angle_Check/1');
add_line(sub_name, 'Max_10deg_Limit/1', 'Sync_Angle_Check/2');
add_line(sub_name, 'Sync_Angle_Check/1', 'Permissive_Close_52_0/1');
end
