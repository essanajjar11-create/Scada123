function response = matlab_scada_bridge(server_url, scenario)
% MATLAB_SCADA_BRIDGE Real-Time Co-Simulation Bridge between MATLAB / Simulink
% and the React / Node.js Web SCADA Digital Twin Platform.
%
% Inputs:
%   server_url - Target Web SCADA server URL (default: 'http://127.0.0.1:3000')
%   scenario   - 'NORMAL_RUN', 'SLG_FAULT_A', 'MICROGRID_STEP' (default: 'NORMAL_RUN')

if nargin < 1 || isempty(server_url)
    server_url = 'http://127.0.0.1:3000';
end
if nargin < 2 || isempty(scenario)
    scenario = 'NORMAL_RUN';
end

fprintf('========================================================================\n');
fprintf('   MATLAB <--> WEB SCADA REAL-TIME CO-SIMULATION BRIDGE                \n');
fprintf('   Target Server: %s | Active Scenario: %s\n', server_url, scenario);
fprintf('========================================================================\n\n');

% Ensure paths
cosim_dir = fileparts(mfilename('fullpath'));
matlab_root = fullfile(cosim_dir, '..');
addpath(genpath(matlab_root));

%% 1. Execute Simulink Transient Simulation
model_name = 'substation_132_13_8kv_digital_twin';
fprintf('[1/3] Executing Simulink Digital Twin Solver (ode23tb)...\n');
t_sim_start = tic;

out = sim(model_name, 'StopTime', '0.20');
t = out.tout;
V_132kV = out.sim_132kV_V;
V_13_8kV = out.sim_13_8kV_V;

sim_time_ms = toc(t_sim_start) * 1000;
fprintf('   * Solver completed: %d steps computed in %.1f ms.\n', length(t), sim_time_ms);

%% 2. Apply Scenario Transient Modifications
ansi87t_trip = 0;
ansi21_trip = 0;
ansi25_permissive = 1;
ansi50_51_trip = 0;
solar_MW = 4.85;
bess_power_MW = -4.5;
bess_SoC_pct = 72.4;
hvdc_MW = 20.0;

switch upper(scenario)
    case 'SLG_FAULT_A'
        % Inject Phase A Ground Fault at t >= 100 ms (0.10s)
        idx_fault = (t >= 0.10);
        V_132kV(idx_fault, 1) = V_132kV(idx_fault, 1) * 0.15; % 85% voltage sag on Phase A
        V_13_8kV(idx_fault, 1) = V_13_8kV(idx_fault, 1) * 0.20;
        ansi87t_trip = 1;
        ansi21_trip = 1;
        ansi50_51_trip = 1;
        fprintf('   * Scenario Applied: Single-Line-to-Ground Fault on Phase A (Relays TRIPPED)\n');
        
    case 'MICROGRID_STEP'
        bess_power_MW = -8.5; % Rapid discharge for peak shaving
        bess_SoC_pct = 68.2;
        hvdc_MW = 25.0;       % Max intertie import
        solar_MW = 5.0;
        fprintf('   * Scenario Applied: Microgrid Maximum Dispatch Step (HVDC: 25MW, BESS: -8.5MW)\n');
        
    otherwise
        fprintf('   * Scenario Applied: Normal Steady State (All systems nominal)\n');
end

%% 3. Downsample & Package High-Speed Waveforms
fprintf('[2/3] Extracting Waveforms & Formatting JSON Telemetry Payload...\n');
N_samples = length(t);
step_idx = max(1, floor(N_samples / 300));
indices = 1:step_idx:N_samples;

waveforms = cell(length(indices), 1);
for i = 1:length(indices)
    k = indices(i);
    waveforms{i} = struct( ...
        't_ms', round(t(k) * 1000, 2), ...
        'Va_132kV', round(V_132kV(k, 1) / 1000, 2), ...
        'Vb_132kV', round(V_132kV(k, 2) / 1000, 2), ...
        'Vc_132kV', round(V_132kV(k, 3) / 1000, 2), ...
        'Va_13_8kV', round(V_13_8kV(k, 1) / 1000, 2), ...
        'Vb_13_8kV', round(V_13_8kV(k, 2) / 1000, 2), ...
        'Vc_13_8kV', round(V_13_8kV(k, 3) / 1000, 2) ...
    );
end

payload = struct();
payload.status = 'ACTIVE_COSIM';
payload.engine = 'MATLAB R2023b / Simulink ode23tb';
payload.activeScenario = scenario;
payload.solverTimeMs = round(sim_time_ms, 1);
payload.timestamp = datestr(now, 'yyyy-mm-ddTHH:MM:SS.FFFZ');

payload.grid132kV = struct( ...
    'V_LL_kV', round(ternary_val(strcmp(scenario, 'SLG_FAULT_A'), 112.5, 132.0), 1), ...
    'freq_Hz', 50.0, ...
    'S_sc_MVA', 2500, ...
    'Va_kV', round(max(abs(V_132kV(:, 1))) / (sqrt(2)*1000), 2), ...
    'Vb_kV', round(max(abs(V_132kV(:, 2))) / (sqrt(2)*1000), 2), ...
    'Vc_kV', round(max(abs(V_132kV(:, 3))) / (sqrt(2)*1000), 2) ...
);

payload.tr1_13_8kV = struct( ...
    'V_LL_kV', round(ternary_val(strcmp(scenario, 'SLG_FAULT_A'), 11.8, 13.8), 1), ...
    'rated_MVA', 40.0, ...
    'tap_position', 9, ...
    'hot_spot_degC', ternary_val(strcmp(scenario, 'SLG_FAULT_A'), 125.8, 109.3), ...
    'top_oil_degC', 78.4, ...
    'Va_kV', round(max(abs(V_13_8kV(:, 1))) / (sqrt(2)*1000), 2), ...
    'Vb_kV', round(max(abs(V_13_8kV(:, 2))) / (sqrt(2)*1000), 2), ...
    'Vc_kV', round(max(abs(V_13_8kV(:, 3))) / (sqrt(2)*1000), 2) ...
);

payload.relays = struct( ...
    'ansi87t_trip', ansi87t_trip, ...
    'ansi21_trip', ansi21_trip, ...
    'ansi25_permissive', ansi25_permissive, ...
    'ansi50_51_trip', ansi50_51_trip ...
);

payload.microgrid = struct( ...
    'solar_MW', solar_MW, ...
    'bess_SoC_pct', bess_SoC_pct, ...
    'bess_power_MW', bess_power_MW, ...
    'h2_kg_hr', 40.0, ...
    'hvdc_MW', hvdc_MW ...
);

payload.waveforms = waveforms;

%% 4. Push Telemetry to Web SCADA Server via HTTP POST
fprintf('[3/3] Streaming Telemetry to Web SCADA Server...\n');
endpoint = [server_url, '/api/matlab/push-telemetry'];

options = weboptions( ...
    'MediaType', 'application/json', ...
    'Timeout', 5, ...
    'RequestMethod', 'post' ...
);

try
    response = webwrite(endpoint, payload, options);
    fprintf('   * Bridge Status: SUCCESS! Telemetry pushed to Web SCADA.\n');
    fprintf('   * Response from Server: %s\n\n', jsonencode(response));
catch ME
    fprintf('   * Note: Web SCADA server not reachable at %s (%s)\n', endpoint, ME.message);
    fprintf('   * [Local Mode]: Telemetry packaged and ready.\n\n');
    response = payload;
end

end

function v = ternary_val(cond, v_true, v_false)
if cond, v = v_true; else, v = v_false; end
end
