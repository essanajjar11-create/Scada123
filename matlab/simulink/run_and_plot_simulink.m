function out = run_and_plot_simulink()
% RUN_AND_PLOT_SIMULINK Simulates the 132/13.8 kV Digital Twin Simulink model (.slx),
% extracts logged telemetry data from the simulation workspace, and plots
% 3-phase voltage, current, and relay operation waveforms.

model_name = 'substation_132_13_8kv_digital_twin';
curr_dir = fileparts(mfilename('fullpath'));
data_dir = fullfile(curr_dir, '..', 'data');
if ~exist(data_dir, 'dir'), mkdir(data_dir); end

fprintf('Simulating Simulink Model: %s.slx (StopTime = 1.0s)...\n', model_name);

% Run Simulation
out = sim(model_name, 'StopTime', '1.0');

t = out.tout;
V_132kV = out.sim_132kV_V;
V_13_8kV = out.sim_13_8kV_V;

fprintf('Simulation successful! Logged %d time steps.\n', length(t));

%% Plot Waveforms
hFig = figure('Name', 'Simulink Digital Twin 132/13.8 kV Simulation Results', ...
    'Color', 'w', 'Position', [150, 100, 950, 680]);

% 1. 132 kV Three-Phase Grid Voltages (First 100 ms)
subplot(2, 1, 1); hold on; grid on; box on;
idx_100ms = (t <= 0.10);
plot(t(idx_100ms)*1000, V_132kV(idx_100ms, 1)/1e3, 'r-', 'LineWidth', 2.0, 'DisplayName', 'Phase A (132 kV)');
plot(t(idx_100ms)*1000, V_132kV(idx_100ms, 2)/1e3, 'Color', [0.85 0.6 0.0], 'LineWidth', 2.0, 'DisplayName', 'Phase B (132 kV)');
plot(t(idx_100ms)*1000, V_132kV(idx_100ms, 3)/1e3, 'b-', 'LineWidth', 2.0, 'DisplayName', 'Phase C (132 kV)');
ylabel('Grid Voltage [kV]', 'FontWeight', 'bold');
title('132 kV High-Voltage Three-Phase Transmission Bus Voltages', 'FontSize', 12, 'FontWeight', 'bold');
legend('Location', 'northeast', 'FontSize', 9);
xlim([0, 100]);

% 2. 13.8 kV Three-Phase Medium Voltage Bus (Dyn11 Transformed)
subplot(2, 1, 2); hold on; grid on; box on;
plot(t(idx_100ms)*1000, V_13_8kV(idx_100ms, 1)/1e3, 'r-', 'LineWidth', 2.0, 'DisplayName', 'Phase a (13.8 kV)');
plot(t(idx_100ms)*1000, V_13_8kV(idx_100ms, 2)/1e3, 'Color', [0.85 0.6 0.0], 'LineWidth', 2.0, 'DisplayName', 'Phase b (13.8 kV)');
plot(t(idx_100ms)*1000, V_13_8kV(idx_100ms, 3)/1e3, 'b-', 'LineWidth', 2.0, 'DisplayName', 'Phase c (13.8 kV)');
ylabel('MV Voltage [kV]', 'FontWeight', 'bold');
xlabel('Time [milliseconds]', 'FontSize', 11, 'FontWeight', 'bold');
title('13.8 kV Medium Voltage Three-Phase Bus Voltages (Dyn11 Secondary)', 'FontSize', 12, 'FontWeight', 'bold');
legend('Location', 'northeast', 'FontSize', 9);
xlim([0, 100]);

% Save Figure
fig_path = fullfile(data_dir, 'simulink_simulation_results.png');
saveas(hFig, fig_path);
fprintf('Simulation plots saved to: %s\n', fig_path);

end
