function results = protection_ansi50_51(I_fault_A, curve_type, TMS, I_pickup_A)
% PROTECTION_ANSI50_51 Simulates ANSI 50/51 & 50N/51N Time-Overcurrent Protection
% and Time-Current Characteristic (TCC) Curves according to IEC 60255-151 & IEEE C37.112.
%
% Inputs:
%   I_fault_A   - Measured Fault Current [A] (e.g., 2500 A on 13.8 kV Feeder F-01)
%   curve_type  - 'IEC_STANDARD_INVERSE', 'IEC_VERY_INVERSE', 'IEC_EXTREMELY_INVERSE', 'IEEE_MODERATELY_INVERSE'
%   TMS         - Time Multiplier Setting / Time Dial (default: 0.15)
%   I_pickup_A  - Pickup Current Setting [A] (default: 400 A)
%
% Outputs:
%   results     - Struct with calculated trip time, operating state, and TCC curve coordinates.

if nargin < 1 || isempty(I_fault_A),   I_fault_A = 2450.0; end
if nargin < 2 || isempty(curve_type),  curve_type = 'IEC_STANDARD_INVERSE'; end
if nargin < 3 || isempty(TMS),         TMS = 0.15; end
if nargin < 4 || isempty(I_pickup_A),  I_pickup_A = 400.0; end

%% 1. IEC 60255-151 & IEEE C37.112 Curve Constants
% Formula: t(I) = TMS * [ alpha / ( (I / I_pickup)^beta - 1 ) + L ]
switch upper(curve_type)
    case 'IEC_STANDARD_INVERSE'
        alpha = 0.14; beta = 0.02; L = 0.0;
    case 'IEC_VERY_INVERSE'
        alpha = 13.5; beta = 1.00; L = 0.0;
    case 'IEC_EXTREMELY_INVERSE'
        alpha = 80.0; beta = 2.00; L = 0.0;
    case 'IEEE_MODERATELY_INVERSE'
        alpha = 0.0515; beta = 0.02; L = 0.114;
    otherwise
        alpha = 0.14; beta = 0.02; L = 0.0;
end

% Instantaneous High-Set Pickup (ANSI 50): 8.0 x I_pickup
I_inst_pickup_A = 8.0 * I_pickup_A; % 3200 A

%% 2. Calculate Tripping Time for Fault Current
M = I_fault_A / I_pickup_A; % Multiple of pickup current

if I_fault_A >= I_inst_pickup_A
    % ANSI 50 Instantaneous Definite Time Tripping
    trip_time_s = 0.016; % 16 ms sub-cycle
    operating_mode = 'ANSI 50 (Instantaneous High-Set Overcurrent)';
    trip_decision = true;
elseif M > 1.0
    % ANSI 51 Inverse Time Tripping
    trip_time_s = TMS * (alpha / (M^beta - 1) + L);
    operating_mode = sprintf('ANSI 51 (Time-Overcurrent Inverse: %s)', curve_type);
    trip_decision = true;
else
    % Below pickup threshold
    trip_time_s = Inf;
    operating_mode = 'NO TRIP (Normal Load Current)';
    trip_decision = false;
end

results.I_fault_A = I_fault_A;
results.I_pickup_A = I_pickup_A;
results.I_inst_pickup_A = I_inst_pickup_A;
results.curve_type = curve_type;
results.TMS = TMS;
results.trip_time_s = trip_time_s;
results.trip_time_ms = trip_time_s * 1000;
results.operating_mode = operating_mode;
results.trip_decision = trip_decision;

%% 3. Generate TCC Log-Log Characteristic Curve Plot
I_axis = logspace(log10(I_pickup_A * 1.05), log10(I_pickup_A * 25), 300);
M_axis = I_axis / I_pickup_A;

% Compute curves for all standard types
t_std_inv  = TMS * (0.14 ./ (M_axis.^0.02 - 1));
t_very_inv = TMS * (13.5 ./ (M_axis.^1.00 - 1));
t_ext_inv  = TMS * (80.0 ./ (M_axis.^2.00 - 1));

figure('Name', 'ANSI 50/51 Time-Current Characteristic (TCC) Curves', ...
    'Color', 'w', 'Position', [170, 110, 850, 650]);
hold on; grid on; box on;
set(gca, 'XScale', 'log', 'YScale', 'log');

% Plot standard TCC curves
plot(I_axis, t_std_inv,  'b-', 'LineWidth', 2.0, 'DisplayName', 'IEC Standard Inverse');
plot(I_axis, t_very_inv, 'm-', 'LineWidth', 2.0, 'DisplayName', 'IEC Very Inverse');
plot(I_axis, t_ext_inv,  'r-', 'LineWidth', 2.0, 'DisplayName', 'IEC Extremely Inverse');

% ANSI 50 Instantaneous Cutoff line
xline(I_inst_pickup_A, 'k--', 'LineWidth', 2.0, 'DisplayName', sprintf('ANSI 50 High-Set (%.0f A)', I_inst_pickup_A));
xline(I_pickup_A, 'g--', 'LineWidth', 1.8, 'DisplayName', sprintf('ANSI 51 Pickup (%.0f A)', I_pickup_A));

% Operating Point
if trip_decision
    plot(I_fault_A, trip_time_s, 'rpentagram', 'MarkerSize', 15, 'MarkerFaceColor', 'r', ...
        'DisplayName', sprintf('Fault Point: I=%.0f A, t=%.3f s (%s)', I_fault_A, trip_time_s, operating_mode));
end

xlabel('Primary Current [Amperes]', 'FontSize', 12, 'FontWeight', 'bold');
ylabel('Operating Time [Seconds]', 'FontSize', 12, 'FontWeight', 'bold');
title(sprintf('ANSI 50/51 Time-Overcurrent Coordination TCC (TMS = %.2f, I_{pickup} = %.0f A)', TMS, I_pickup_A), ...
    'FontSize', 13, 'FontWeight', 'bold');
legend('Location', 'northeast', 'FontSize', 9);
xlim([I_pickup_A * 0.8, I_pickup_A * 30]);
ylim([0.01, 100]);

end
