function results = protection_ansi87t(I_prim_A, I_sec_A, fault_type, sec_angle_deg)
% PROTECTION_ANSI87T Transformer Differential Protection (ANSI 87T)
% EXACT PARITY PORT of src/components/protection/DifferentialProtectionModule.tsx
%
% Implements the identical algorithm as the React/Web SCADA module:
%   - Dual-slope characteristic with flat dead-band below Is1:
%       Idiff_thresh(Ibias) =
%         Is1                                    for Ibias <= Is1
%         Is1 + K1 * (Ibias - Is1)               for Is1 < Ibias <= Is2
%         Is1 + K1 * (Is2 - Is1) + K2*(Ibias-Is2) for Ibias > Is2
%   - Instantaneous unrestrained trip at Idiff >= 8.0 p.u. (highest priority)
%   - Harmonic cross-blocking (>= comparisons):
%       2nd harmonic inrush block  : harm2 >= 15%
%       5th harmonic overflux block: harm5 >= 30%
%   - Relay state priority (identical to web):
%       INST_TRIP > TRIP/BLOCKED_INRUSH/BLOCKED_OVERFLUX > RESTRAINED
%
% Inputs:
%   I_prim_A      - 3-phase primary current magnitude vector [A] (132 kV side)
%   I_sec_A       - 3-phase secondary current magnitude vector [A] (13.8 kV side)
%   fault_type    - String: 'NORMAL', 'EXTERNAL_FAULT', 'CT_SATURATION',
%                   'INTERNAL_SLG', 'INTERNAL_FAULT', 'INRUSH', 'OVEREXCITE'
%                   (harmonic ratios injected per web module preset values)
%   sec_angle_deg - LV-side phasor angle [deg] (default 180 deg =
%                   through-load opposition, matching web default I2 = 1<180deg)
%
% Outputs:
%   results       - Struct with Id/Ib per phase, threshold, harmonic ratios,
%                   blocking flags, per-phase trips and overall relay state.

if nargin < 3 || isempty(fault_type), fault_type = 'INTERNAL_SLG'; end
if nargin < 1 || isempty(I_prim_A), I_prim_A = [3850, 175, 175]; end
if nargin < 2 || isempty(I_sec_A),  I_sec_A  = [200, 1670, 1670]; end
if nargin < 4 || isempty(sec_angle_deg), sec_angle_deg = 180; end

params = substation_parameters();
cfg = params.ansi87t;

%% 1. Convert to Common Per-Unit Base (rated currents, as in web p.u. sliders)
I_prim_pu = reshape(abs(I_prim_A(:)).' / params.transformer.I_prim_nom, 1, []);
I_sec_pu  = reshape(abs(I_sec_A(:)).'  / params.transformer.I_sec_nom,  1, []);
n_ph = max(length(I_prim_pu), length(I_sec_pu));
I_prim_pu = padarray_to(I_prim_pu, n_ph);
I_sec_pu  = padarray_to(I_sec_pu,  n_ph);

%% 2. Phasor Differential Element (identical vector math to web)
% I1 = I1_mag < 0deg ; I2 = I2_mag < sec_angle_deg
sec_rad = deg2rad(sec_angle_deg);
i1_re = I_prim_pu .* cos(0);
i1_im = I_prim_pu .* sin(0);
i2_re = I_sec_pu .* cos(sec_rad);
i2_im = I_sec_pu .* sin(sec_rad);

% Idiff = |I1 + I2| ; Ibias = (|I1| + |I2|) / 2
Id = sqrt((i1_re + i2_re).^2 + (i1_im + i2_im).^2);
Ir = (abs(I_prim_pu) + abs(I_sec_pu)) / 2;

%% 3. Dual-Slope Threshold With Dead-Band (exact port of calcIdiffThreshold)
Id_trip_limit = arrayfun(@(ib) diff_threshold(ib, cfg), Ir);

%% 4. Harmonic Restraint Injection (web preset scenario values)
switch upper(fault_type)
    case 'INRUSH'
        harm2_ratio = 0.24; % Web 'inrush' preset: 24% 2nd harmonic
        harm5_ratio = 0.02;
    case {'OVEREXCITE', 'OVERFLUX'}
        harm2_ratio = 0.03;
        harm5_ratio = 0.36; % Web 'overflux' preset: 36% 5th harmonic
    case 'CT_SATURATION'
        harm2_ratio = 0.03;
        harm5_ratio = 0.02;
    case 'EXTERNAL_FAULT'
        harm2_ratio = 0.01;
        harm5_ratio = 0.01;
    case {'INTERNAL_SLG', 'INTERNAL_FAULT'}
        harm2_ratio = 0.04;
        harm5_ratio = 0.01;
    otherwise % NORMAL
        harm2_ratio = 0.02; % Web 'normal load' preset background
        harm5_ratio = 0.01;
end

is_harm2_blocked = (harm2_ratio >= cfg.harm2_restraint); % >= comparison as in web
is_harm5_blocked = (harm5_ratio >= cfg.harm5_restraint);
is_harmonic_blocked = is_harm2_blocked || is_harm5_blocked;

%% 5. Trip Logic With Web Priority Chain
is_inst_per_phase   = Id >= cfg.i_inst_pickup_pu;         % INST: Idiff >= 8.0 pu
is_over_per_phase   = Id > Id_trip_limit;                 % Strictly greater, as in web

if any(is_inst_per_phase)
    relay_state = 'INST_TRIP';
    trip_decision = true;
elseif any(is_over_per_phase)
    if is_harm2_blocked
        relay_state = 'BLOCKED_INRUSH';
    elseif is_harm5_blocked
        relay_state = 'BLOCKED_OVERFLUX';
    else
        relay_state = 'TRIP';
    end
    trip_decision = ~is_harmonic_blocked;
else
    relay_state = 'RESTRAINED';
    trip_decision = false;
end
trip_phases = trip_decision & (is_inst_per_phase | is_over_per_phase);

%% 6. Store Results
[max_Id, max_idx] = max(Id);
max_Ir = Ir(max_idx);

results.fault_type = fault_type;
results.Id_pu = Id;
results.Ir_pu = Ir;
results.max_Id_pu = max_Id;
results.max_Ir_pu = max_Ir;
results.Id_trip_limit_pu = Id_trip_limit;
results.harm2_ratio = harm2_ratio;
results.harm5_ratio = harm5_ratio;
results.is_harm2_blocked = is_harm2_blocked;
results.is_harm5_blocked = is_harm5_blocked;
% Legacy field aliases (kept for existing callers)
results.is_harm2_restrained = is_harm2_blocked;
results.is_harm5_restrained = is_harm5_blocked;
results.relay_state = relay_state;
results.trip_phases = trip_phases;
results.trip_decision = trip_decision;
results.operating_time_ms = double(trip_decision) * 20.0; % 20 ms instantaneous, consistent with ANSI 21 Zone 1

%% 7. Plot Differential Characteristic (dead-band curve + INST line, as in web SVG)
Ir_axis = linspace(0, 10, 500);
Id_thresh_curve = arrayfun(@(ib) diff_threshold(ib, cfg), Ir_axis);

figure('Name', sprintf('ANSI 87T Differential Relay - %s', fault_type), 'Color', 'w', 'Position', [100, 100, 750, 550]);
hold on; grid on; box on;

fill([0, Ir_axis, fliplr(Ir_axis)], ...
     [0, Id_thresh_curve, zeros(size(Id_thresh_curve))], ...
     [0.85, 0.95, 0.85], 'EdgeColor', 'none', 'FaceAlpha', 0.6, 'DisplayName', 'Restraint Zone (Stable)');
fill([Ir_axis, fliplr(Ir_axis)], ...
     [Id_thresh_curve, 10 * ones(size(Id_thresh_curve))], ...
     [1.0, 0.85, 0.85], 'EdgeColor', 'none', 'FaceAlpha', 0.6, 'DisplayName', 'Trip Zone');

plot(Ir_axis, Id_thresh_curve, 'r-', 'LineWidth', 2.5, 'DisplayName', 'Dual-Slope Characteristic');
yline(cfg.i_inst_pickup_pu, 'k--', 'LineWidth', 1.5, 'DisplayName', sprintf('Instantaneous (Id \\geq %.1f pu)', cfg.i_inst_pickup_pu));
xline(cfg.I_breakpoint_pu, 'k:', 'LineWidth', 1.5, 'DisplayName', sprintf('Is2 Breakpoint (%.1f pu)', cfg.I_breakpoint_pu));

if trip_decision
    plot(max_Ir, max_Id, 'rpentagram', 'MarkerSize', 14, 'MarkerFaceColor', 'r', ...
        'DisplayName', sprintf('%s (Id=%.2f, Ir=%.2f)', relay_state, max_Id, max_Ir));
elseif strcmp(relay_state, 'BLOCKED_INRUSH')
    plot(max_Ir, max_Id, 'bsquare', 'MarkerSize', 12, 'MarkerFaceColor', 'c', ...
        'DisplayName', sprintf('Inrush Restrained (2nd Harm=%.1f%%)', harm2_ratio * 100));
elseif strcmp(relay_state, 'BLOCKED_OVERFLUX')
    plot(max_Ir, max_Id, 'mdiamond', 'MarkerSize', 12, 'MarkerFaceColor', 'm', ...
        'DisplayName', sprintf('Overflux Restrained (5th Harm=%.1f%%)', harm5_ratio * 100));
else
    plot(max_Ir, max_Id, 'go', 'MarkerSize', 10, 'MarkerFaceColor', 'g', ...
        'DisplayName', sprintf('Normal / External Fault (Id=%.2f, Ir=%.2f)', max_Id, max_Ir));
end

xlabel('Bias Current I_{bias} [p.u.]', 'FontSize', 12, 'FontWeight', 'bold');
ylabel('Differential Current I_{diff} [p.u.]', 'FontSize', 12, 'FontWeight', 'bold');
title(sprintf('ANSI 87T Differential Protection - %s [%s]', strrep(fault_type, '_', ' '), relay_state), ...
    'FontSize', 13, 'FontWeight', 'bold');
legend('Location', 'northwest', 'FontSize', 10);
xlim([0, 10]);
ylim([0, 10]);

end

%% ---- Local Functions ----

function t = diff_threshold(ib, cfg)
% Exact port of TS calcIdiffThreshold():
%   ib <= Is1                -> Is1
%   Is1 < ib <= Is2          -> Is1 + K1*(ib - Is1)
%   ib > Is2                 -> [Is1 + K1*(Is2 - Is1)] + K2*(ib - Is2)
if ib <= cfg.I_pickup_pu
    t = cfg.I_pickup_pu;
elseif ib <= cfg.I_breakpoint_pu
    t = cfg.I_pickup_pu + cfg.slope1 * (ib - cfg.I_pickup_pu);
else
    at_break = cfg.I_pickup_pu + cfg.slope1 * (cfg.I_breakpoint_pu - cfg.I_pickup_pu);
    t = at_break + cfg.slope2 * (ib - cfg.I_breakpoint_pu);
end
end

function v = padarray_to(v, n)
% Zero-pad (or truncate) vector to length n
if length(v) < n
    v = [v, zeros(1, n - length(v))];
else
    v = v(1:n);
end
end
