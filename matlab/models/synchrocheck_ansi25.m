function results = synchrocheck_ansi25(V_busA_kV, V_busB_kV, freq_busA_Hz, freq_busB_Hz, phase_angle_diff_deg)
% SYNCHROCHECK_ANSI25 Simulates the ANSI 25 Synchrocheck & Synchroscope Relay
% for 132 kV Bus Coupler 52-0 closing interlock.
%
% Inputs:
%   V_busA_kV            - Busbar A Voltage Magnitude [kV] (Nominal: 132 kV)
%   V_busB_kV            - Busbar B Voltage Magnitude [kV] (Nominal: 132 kV)
%   freq_busA_Hz         - Busbar A Frequency [Hz] (Nominal: 50.00 Hz)
%   freq_busB_Hz         - Busbar B Frequency [Hz] (Nominal: 50.00 Hz)
%   phase_angle_diff_deg - Phase angle difference delta_theta [degrees]
%
% Outputs:
%   results              - Struct with delta_V, delta_f, delta_theta, and permissive closing status.

if nargin < 1 || isempty(V_busA_kV), V_busA_kV = 132.0; end
if nargin < 2 || isempty(V_busB_kV), V_busB_kV = 131.2; end
if nargin < 3 || isempty(freq_busA_Hz), freq_busA_Hz = 50.00; end
if nargin < 4 || isempty(freq_busB_Hz), freq_busB_Hz = 50.03; end
if nargin < 5 || isempty(phase_angle_diff_deg), phase_angle_diff_deg = 4.5; end

params = substation_parameters();
cfg = params.ansi25;

%% 1. Calculate Differential Quantities
delta_V_kV = abs(V_busA_kV - V_busB_kV);
delta_V_pct = (delta_V_kV / params.busbar132.V_nom_kV) * 100;
delta_f_Hz = abs(freq_busA_Hz - freq_busB_Hz);
delta_theta_deg = abs(phase_angle_diff_deg);

%% 2. Check Permissive Closing Criteria
cond_voltage = delta_V_pct <= cfg.max_volt_diff_pct;
cond_frequency = delta_f_Hz <= cfg.max_freq_diff_Hz;
cond_phase = delta_theta_deg <= cfg.max_angle_diff_deg;

permissive_close = cond_voltage && cond_frequency && cond_phase;

results.V_busA_kV = V_busA_kV;
results.V_busB_kV = V_busB_kV;
results.delta_V_pct = delta_V_pct;
results.delta_f_Hz = delta_f_Hz;
results.delta_theta_deg = delta_theta_deg;
results.cond_voltage = cond_voltage;
results.cond_frequency = cond_frequency;
results.cond_phase = cond_phase;
results.permissive_close = permissive_close;

%% 3. Plot Synchroscope Dial Visualization
figure('Name', 'ANSI 25 Synchroscope & Interlock HUD', 'Color', 'w', 'Position', [200, 200, 700, 600]);
hold on; grid on; axis equal;

% Draw Dial Circle
theta_dial = linspace(0, 2*pi, 400);
plot(cos(theta_dial), sin(theta_dial), 'k-', 'LineWidth', 3);
plot(1.1*cos(theta_dial), 1.1*sin(theta_dial), 'k-', 'LineWidth', 1);

% Permissive Zone (Top Arc ±10 deg)
arc_angle = deg2rad(cfg.max_angle_diff_deg);
theta_arc = linspace(pi/2 - arc_angle, pi/2 + arc_angle, 100);
fill([0, cos(theta_arc), 0], [0, sin(theta_arc), 0], [0.75, 0.95, 0.75], ...
    'EdgeColor', 'g', 'LineWidth', 2, 'FaceAlpha', 0.6, 'DisplayName', sprintf('Permissive Zone (\\pm%.0f^\\circ)', cfg.max_angle_diff_deg));

% Dial Labels (12 o clock = 0 deg In-Phase, Fast / Slow direction)
text(0, 1.2, '0^\circ (IN-PHASE)', 'FontSize', 12, 'FontWeight', 'bold', 'HorizontalAlignment', 'center');
text(1.2, 0, '+90^\circ (FAST)', 'FontSize', 11, 'Color', [0.8 0.2 0.2], 'HorizontalAlignment', 'left');
text(-1.2, 0, '-90^\circ (SLOW)', 'FontSize', 11, 'Color', [0.2 0.2 0.8], 'HorizontalAlignment', 'right');
text(0, -1.2, '180^\circ (ANTI-PHASE)', 'FontSize', 11, 'HorizontalAlignment', 'center');

% Draw Phasor Needle (Phase Angle Delta)
needle_rad = deg2rad(90 - phase_angle_diff_deg);
needle_x = cos(needle_rad);
needle_y = sin(needle_rad);

if permissive_close
    needle_color = [0.1, 0.75, 0.2]; % Green
    status_str = 'PERMISSIVE CLOSE GRANTED (52-0 ARMED)';
    status_box_col = [0.85, 1.0, 0.85];
else
    needle_color = [0.85, 0.1, 0.1]; % Red
    status_str = 'PERMISSIVE BLOCKED (OUT OF SYNC)';
    status_box_col = [1.0, 0.85, 0.85];
end

plot([0, needle_x], [0, needle_y], '-', 'Color', needle_color, 'LineWidth', 4, 'DisplayName', 'Phasor Needle');
plot(needle_x, needle_y, 'o', 'MarkerSize', 12, 'MarkerFaceColor', needle_color, 'MarkerEdgeColor', 'k');

% Telemetry Information Box
info_str = sprintf(['\\bfANSI 25 SYNCHROCHECK TELEMETRY\\rm\n', ...
    '\\bullet \\Delta\\theta: %.2f^\\circ  (Max: \\pm%.1f^\\circ) -> %s\n', ...
    '\\bullet \\Delta V: %.2f%% (%.1f vs %.1f kV) -> %s\n', ...
    '\\bullet \\Delta f: %.3f Hz (%.2f vs %.2f Hz) -> %s\n', ...
    '\\bfSTATUS: %s\\rm'], ...
    delta_theta_deg, cfg.max_angle_diff_deg, cond_str(cond_phase), ...
    delta_V_pct, V_busA_kV, V_busB_kV, cond_str(cond_voltage), ...
    delta_f_Hz, freq_busA_Hz, freq_busB_Hz, cond_str(cond_frequency), ...
    status_str);

annotation('textbox', [0.15, 0.05, 0.70, 0.18], 'String', info_str, ...
    'BackgroundColor', status_box_col, 'EdgeColor', 'k', 'LineWidth', 1.5, ...
    'FontSize', 11, 'FitBoxToText', 'on');

title('ANSI 25 Synchroscope - 132 kV Bus Coupler 52-0 Synchronization', 'FontSize', 13, 'FontWeight', 'bold');
xlim([-1.5, 1.5]); ylim([-1.5, 1.5]);
axis off;

end

function s = cond_str(c)
if c, s = 'OK [PASSED]'; else, s = 'FAILED'; end
end
