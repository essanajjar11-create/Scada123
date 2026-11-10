function results = dga_duval_triangle(ch4_ppm, c2h4_ppm, c2h2_ppm)
% DGA_DUVAL_TRIANGLE Implements Duval Triangle 1 for Dissolved Gas Analysis (DGA)
% according to IEC 60599 and IEEE C57.104.
%
% Inputs:
%   ch4_ppm   - Methane concentration in transformer oil [ppm]
%   c2h4_ppm  - Ethylene concentration [ppm]
%   c2h2_ppm  - Acetylene concentration [ppm]
%
% Outputs:
%   results   - Struct with gas percentages, fault diagnosis code, and fault description.

if nargin < 1 || isempty(ch4_ppm),  ch4_ppm = 120; end
if nargin < 2 || isempty(c2h4_ppm), c2h4_ppm = 240; end
if nargin < 3 || isempty(c2h2_ppm), c2h2_ppm = 15; end

%% 1. Calculate Triangular Gas Percentages
total_gas = ch4_ppm + c2h4_ppm + c2h2_ppm;
if total_gas == 0
    pct_ch4 = 33.33; pct_c2h4 = 33.33; pct_c2h2 = 33.33;
else
    pct_ch4  = (ch4_ppm / total_gas) * 100;
    pct_c2h4 = (c2h4_ppm / total_gas) * 100;
    pct_c2h2 = (c2h2_ppm / total_gas) * 100;
end

%% 2. Duval Triangle 1 Fault Diagnosis Decision Tree
% Zones defined by IEC 60599:
% PD: Partial Discharge
% T1: Thermal fault T < 300 deg C
% T2: Thermal fault 300 < T < 700 deg C
% T3: Thermal fault T > 700 deg C
% D1: Low energy discharge (sparking)
% D2: High energy discharge (arcing)
% DT: Thermal + electrical mixture

if pct_ch4 >= 98
    fault_code = 'PD';
    fault_name = 'Partial Discharge (Corona / Cavity breakdown)';
    severity = 'WARNING';
elseif pct_c2h2 < 4 && pct_c2h4 < 20 && pct_ch4 >= 76
    fault_code = 'T1';
    fault_name = 'Thermal Fault T < 300 ^\circC (Overheating in leads/core)';
    severity = 'MONITOR';
elseif pct_c2h2 < 4 && pct_c2h4 >= 20 && pct_c2h4 < 50
    fault_code = 'T2';
    fault_name = 'Thermal Fault 300 < T < 700 ^\circC (Local overheating of paper/metal)';
    severity = 'MAJOR';
elseif pct_c2h2 < 15 && pct_c2h4 >= 50
    fault_code = 'T3';
    fault_name = 'Thermal Fault T > 700 ^\circC (Severe overheating / Hot-spots)';
    severity = 'CRITICAL';
elseif pct_c2h2 >= 4 && pct_c2h2 < 13 && pct_c2h4 < 23
    fault_code = 'D1';
    fault_name = 'Low Energy Discharge (Sparking / Pin-hole breakdown)';
    severity = 'MAJOR';
elseif pct_c2h2 >= 29 || (pct_c2h2 >= 13 && pct_c2h4 < 23)
    fault_code = 'D2';
    fault_name = 'High Energy Discharge (Continuous Arcing / Flashover)';
    severity = 'EMERGENCY';
else
    fault_code = 'DT';
    fault_name = 'Mixed Thermal and Electrical Discharges (DT)';
    severity = 'CRITICAL';
end

results.ch4_ppm = ch4_ppm;
results.c2h4_ppm = c2h4_ppm;
results.c2h2_ppm = c2h2_ppm;
results.pct_ch4 = pct_ch4;
results.pct_c2h4 = pct_c2h4;
results.pct_c2h2 = pct_c2h2;
results.fault_code = fault_code;
results.fault_name = fault_name;
results.severity = severity;

%% 3. Convert Ternary (%CH4, %C2H4, %C2H2) to 2D Cartesian Coordinates
% Top vertex (0, 1): %C2H2 = 100%
% Bottom-Left vertex (-1/sqrt(3), -0.5): %CH4 = 100%
% Bottom-Right vertex (1/sqrt(3), -0.5): %C2H4 = 100%
% x = 0.5 * (2*pct_c2h4 + pct_c2h2) / 100
% y = (sqrt(3)/2) * pct_c2h2 / 100
x_pt = (pct_c2h4 + 0.5 * pct_c2h2) / 100;
y_pt = (sqrt(3)/2 * pct_c2h2) / 100;

%% 4. Plot Duval Triangle 1 Diagram
figure('Name', 'DGA Duval Triangle 1 Diagnosis (IEC 60599)', 'Color', 'w', 'Position', [300, 150, 750, 650]);
hold on; grid on; box on;

% Triangle Vertices
% A (CH4=100%): (0, 0), B (C2H4=100%): (1, 0), C (C2H2=100%): (0.5, sqrt(3)/2)
plot([0, 1, 0.5, 0], [0, 0, sqrt(3)/2, 0], 'k-', 'LineWidth', 2.5);

% Zone Polygons
% T1 Zone
fill([0, 0.20, 0.22, 0.02, 0], [0, 0, sqrt(3)/2*0.04, sqrt(3)/2*0.04, 0], [0.95 0.95 0.70], 'DisplayName', 'T1: Thermal < 300^\circC');
% T2 Zone
fill([0.20, 0.50, 0.52, 0.22, 0.20], [0, 0, sqrt(3)/2*0.04, sqrt(3)/2*0.04, 0], [1.0 0.85 0.60], 'DisplayName', 'T2: Thermal 300-700^\circC');
% T3 Zone
fill([0.50, 1.0, 0.5 + 0.5*0.85, 0.52, 0.50], [0, 0, sqrt(3)/2*0.15, sqrt(3)/2*0.04, 0], [1.0 0.65 0.55], 'DisplayName', 'T3: Thermal > 700^\circC');
% D1 Zone
fill([0.02, 0.22, 0.27, 0.07, 0.02], [sqrt(3)/2*0.04, sqrt(3)/2*0.04, sqrt(3)/2*0.13, sqrt(3)/2*0.13, sqrt(3)/2*0.04], [0.80 0.85 1.0], 'DisplayName', 'D1: Low Energy Discharge');
% D2 Zone
fill([0.07, 0.5+0.5*0.71, 0.5, 0.07], [sqrt(3)/2*0.29, sqrt(3)/2*0.29, sqrt(3)/2, sqrt(3)/2*0.29], [1.0 0.50 0.50], 'DisplayName', 'D2: High Energy Arcing');
% DT Zone
fill([0.22, 0.52, 0.5+0.5*0.71, 0.07, 0.27, 0.22], [sqrt(3)/2*0.04, sqrt(3)/2*0.04, sqrt(3)/2*0.29, sqrt(3)/2*0.29, sqrt(3)/2*0.13, sqrt(3)/2*0.04], [0.90 0.70 0.95], 'DisplayName', 'DT: Mix Thermal/Electrical');

% Plot Diagnosis Point
plot(x_pt, y_pt, 'rp', 'MarkerSize', 16, 'MarkerFaceColor', 'r', 'DisplayName', sprintf('Sample Point: %s', fault_code));

% Vertex Labels
text(-0.04, -0.04, '100% CH_4 (Methane)', 'FontSize', 11, 'FontWeight', 'bold');
text(0.85, -0.04, '100% C_2H_4 (Ethylene)', 'FontSize', 11, 'FontWeight', 'bold');
text(0.42, sqrt(3)/2 + 0.05, '100% C_2H_2 (Acetylene)', 'FontSize', 11, 'FontWeight', 'bold');

% Telemetry Label Box
lbl_str = sprintf(['\\bfDGA DUVAL DIAGNOSIS (IEC 60599)\\rm\n', ...
    '\\bullet CH_4: %d ppm (%.1f%%)\n', ...
    '\\bullet C_2H_4: %d ppm (%.1f%%)\n', ...
    '\\bullet C_2H_2: %d ppm (%.1f%%)\n', ...
    '\\bfDIAGNOSIS: %s\\rm\n', ...
    '%s\n', ...
    '\\bfSEVERITY: %s\\rm'], ...
    ch4_ppm, pct_ch4, c2h4_ppm, pct_c2h4, c2h2_ppm, pct_c2h2, fault_code, fault_name, severity);

annotation('textbox', [0.15, 0.68, 0.35, 0.22], 'String', lbl_str, ...
    'BackgroundColor', [1 1 1 0.9], 'EdgeColor', 'k', 'LineWidth', 1.5, 'FontSize', 10);

title('Duval Triangle 1 - Dissolved Gas Analysis Diagnostic Chart', 'FontSize', 13, 'FontWeight', 'bold');
legend('Location', 'northeast', 'FontSize', 8);
xlim([-0.1, 1.1]); ylim([-0.1, 1.0]);
axis off;

end
