function t_obj = run_continuous_bridge(server_url, period_sec)
% RUN_CONTINUOUS_BRIDGE Runs a non-blocking background timer in MATLAB that
% streams live Simulink co-simulation telemetry to the Web SCADA browser interface.
%
% Usage:
%   t = run_continuous_bridge()                  % Defaults to http://localhost:3000 every 1.5s
%   t = run_continuous_bridge('http://localhost:3000', 1.0)
%
% To Stop:
%   stop(t); delete(t);

if nargin < 1 || isempty(server_url), server_url = 'http://localhost:3000'; end
if nargin < 2 || isempty(period_sec), period_sec = 1.5; end

% Delete any existing bridge timers
existing_timers = timerfindall('Tag', 'MATLAB_SCADA_COSIM_TIMER');
if ~isempty(existing_timers)
    stop(existing_timers);
    delete(existing_timers);
    fprintf('[INFO] Stopped previous co-simulation timers.\n');
end

fprintf('========================================================================\n');
fprintf('   STARTING CONTINUOUS MATLAB <--> WEB SCADA CO-SIMULATION DAEMON       \n');
fprintf('   Target: %s | Streaming Rate: %.1fs (%.1f Hz)\n', server_url, period_sec, 1/period_sec);
fprintf('========================================================================\n\n');

% Create MATLAB Timer
t_obj = timer( ...
    'Tag', 'MATLAB_SCADA_COSIM_TIMER', ...
    'ExecutionMode', 'fixedRate', ...
    'Period', period_sec, ...
    'TimerFcn', @(~,~) bridge_tick(server_url) ...
);

start(t_obj);
fprintf('[OK] Continuous Co-Simulation Daemon is RUNNING in background.\n');
fprintf('     Command Window is FREE for other tasks.\n');
fprintf('     To stop streaming anytime: stop(timerfindall(''Tag'', ''MATLAB_SCADA_COSIM_TIMER''));\n\n');

end

function bridge_tick(server_url)
try
    matlab_scada_bridge(server_url);
catch ME
    % Suppress error if server momentarily unavailable
    fprintf('[Co-Sim Daemon]: Waiting for Web SCADA server at %s...\n', server_url);
end
end
