function results = protection_ansi21(Z_apparent, fault_distance_km, opts)
% PROTECTION_ANSI21 Line Distance Protection (ANSI 21)
% EXACT PARITY PORT of src/components/protection/DistanceProtectionModule.tsx
%
% Implements the identical algorithm as the React/Web SCADA module:
%   - 60 km line, r = 0.08 Ohm/km, x = 0.42 Ohm/km (PRIMARY ohms; the web
%     module performs no CT/VT secondary scaling)
%   - Zone reaches: Z1 = 80% (20 ms), Z2 = 120% (350 ms), Z3 = 180% (800 ms),
%     Z4 reverse = 25% of X (1200 ms backup)
%   - Quadrilateral characteristic (web DEFAULT):
%       Z1: zmX <= z1X & zmX >= 0 & zmR <= 12 & zmR >= -2
%       Z2: zmX <= z2X & zmX >= 0 & zmR <= 18 & zmR >= -4
%       Z3: zmX <= z3X & zmX >= 0 & zmR <= 28 & zmR >= -6
%   - Mho characteristic (optional):
%       reachR = reachX / tan(line_angle); center = (reachR/2, reachX/2);
%       inside if dist(Zm, center) <= radius
%   - Load encroachment blinder (enabled by default):
%       blocked if zmR > 0 & zmR < 20 Ohm & |angle(Zm)| < 30 deg
%   - Reverse faults: |zmX| <= z4RevX & zmX < 0 -> Z4_REV @ 1200 ms
%
% Inputs:
%   Z_apparent        - Measured complex impedance Z = R + jX [Ohm PRIMARY].
%                       If empty it is synthesized from fault_distance_km.
%   fault_distance_km - Distance to fault along the 60 km line [km] (optional)
%   opts              - Optional struct:
%       .char_type    - 'quad' (default) or 'mho'
%       .reverse      - true/false reverse directional fault (default false)
%       .rf_ohm       - arc/tower footing resistance (default 2.5 Ohm)
%       .fault_pct    - fault location in % of line if distance not given (65%)
%
% Outputs:
%   results           - Struct with zone detection, trip signal and operating time.

params = substation_parameters();
cfg = params.ansi21;

if nargin < 3 || isempty(opts), opts = struct(); end
char_type = get_opt(opts, 'char_type', cfg.char_default);
is_reverse = get_opt(opts, 'reverse', false);
rf_ohm = get_opt(opts, 'rf_ohm', cfg.rf_default_ohm);

%% 1. 132 kV Transmission Line Impedance (primary ohms, identical to web)
line_len_km = cfg.line_length_km;
total_line_r = line_len_km * cfg.r_per_km; % 4.8 Ohm at defaults
total_line_x = line_len_km * cfg.x_per_km; % 25.2 Ohm at defaults
line_angle_deg = atan2d(total_line_x, total_line_r); % ~79.2 deg

%% 2. Synthesize Default Measured Impedance From Fault Location (web fault model)
fault_dir_sign = -double(is_reverse) + double(~is_reverse); % +1 fwd / -1 rev
if nargin < 2 || isempty(fault_distance_km), fault_distance_km = []; end
if nargin < 1 || isempty(Z_apparent)
    if ~isempty(fault_distance_km)
        fault_pct = (fault_distance_km / line_len_km) * 100;
    else
        fault_pct = get_opt(opts, 'fault_pct', cfg.fault_dist_default_pct);
        fault_distance_km = line_len_km * fault_pct / 100;
    end
    zm_r = (total_line_r * (fault_pct / 100) + rf_ohm) * fault_dir_sign;
    zm_x = total_line_x * (fault_pct / 100) * fault_dir_sign;
    Z_apparent = complex(zm_r, zm_x);
end

zm_r = real(Z_apparent);
zm_x = imag(Z_apparent);
zm_mag = hypot(zm_r, zm_x);
zm_angle_deg = atan2d(zm_x, zm_r);

%% 3. Zone Reactance Reaches (identical to web z1X..z4RevX)
z1x = total_line_x * (cfg.z1_pct / 100);
z2x = total_line_x * (cfg.z2_pct / 100);
z3x = total_line_x * (cfg.z3_pct / 100);
z4_rev_x = total_line_x * (cfg.z4_rev_pct / 100);

%% 4. Load Encroachment Blinder Check (evaluated first, as in web)
is_load_encroachment = cfg.load_encroach_enabled && ...
    zm_r > 0 && ...
    zm_r < cfg.load_encroach_R_ohm && ...
    abs(zm_angle_deg) < cfg.load_encroach_angle_deg;

%% 5. Zone Evaluation (exact web priority chain)
picked_up_zone = 'NONE';
trip_decision = false;
trip_time_ms = 0;

if is_load_encroachment
    picked_up_zone = 'BLOCKED_LOAD_ENCROACH'; % Blocked by load encroachment
elseif ~is_reverse
    if strcmpi(char_type, 'quad')
        if zm_x <= z1x && zm_x >= 0 && zm_r <= cfg.quad_R_reach(1) && zm_r >= cfg.quad_R_left_extend(1)
            picked_up_zone = 'ZONE_1'; trip_time_ms = cfg.t_zone1_ms;
        elseif zm_x <= z2x && zm_x >= 0 && zm_r <= cfg.quad_R_reach(2) && zm_r >= cfg.quad_R_left_extend(2)
            picked_up_zone = 'ZONE_2'; trip_time_ms = cfg.t_zone2_ms;
        elseif zm_x <= z3x && zm_x >= 0 && zm_r <= cfg.quad_R_reach(3) && zm_r >= cfg.quad_R_left_extend(3)
            picked_up_zone = 'ZONE_3'; trip_time_ms = cfg.t_zone3_ms;
        end
    else
        if test_mho(zm_r, zm_x, z1x, line_angle_deg)
            picked_up_zone = 'ZONE_1'; trip_time_ms = cfg.t_zone1_ms;
        elseif test_mho(zm_r, zm_x, z2x, line_angle_deg)
            picked_up_zone = 'ZONE_2'; trip_time_ms = cfg.t_zone2_ms;
        elseif test_mho(zm_r, zm_x, z3x, line_angle_deg)
            picked_up_zone = 'ZONE_3'; trip_time_ms = cfg.t_zone3_ms;
        end
    end
else
    % Reverse Fault (Zone 4 backup)
    if abs(zm_x) <= z4_rev_x && zm_x < 0
        picked_up_zone = 'Z4_REV'; trip_time_ms = cfg.t_zone4rev_ms;
    end
end

if ~strcmp(picked_up_zone, 'NONE') && ~strcmp(picked_up_zone, 'BLOCKED_LOAD_ENCROACH')
    trip_decision = true;
else
    trip_time_ms = Inf;
end

%% 6. Store Results
results.Z_apparent = Z_apparent;
results.fault_distance_km = fault_distance_km;
results.R_meas = zm_r;
results.X_meas = zm_x;
results.Z_magnitude = zm_mag;
results.Z_angle_deg = zm_angle_deg;
results.tripped_zone = picked_up_zone;
results.trip_decision = trip_decision;
results.trip_time_ms = trip_time_ms;
results.total_line_R_ohm = total_line_r;
results.total_line_X_ohm = total_line_x;
results.line_angle_deg = line_angle_deg;
results.is_load_encroachment_blocked = is_load_encroachment;
results.characteristic = lower(char_type);
% Legacy alias (now primary-ohm based to match web module)
results.Z_line_sec = complex(total_line_r, total_line_x);

%% 7. Plot R-X Complex Impedance Plane (quad polygons / mho circles as in web SVG)
figure('Name', 'ANSI 21 Distance Relay (R-X Plane)', 'Color', 'w', 'Position', [150, 150, 750, 600]);
hold on; grid on; box on;

if strcmpi(char_type, 'quad')
    draw_quad(z3x, cfg.quad_R_reach(3), cfg.quad_R_left_extend(3), [0.6, 0.35, 0.85], '--', 'Zone 3 (180%, 800ms)');
    draw_quad(z2x, cfg.quad_R_reach(2), cfg.quad_R_left_extend(2), [0.15, 0.45, 0.95], '-', 'Zone 2 (120%, 350ms)');
    draw_quad(z1x, cfg.quad_R_reach(1), cfg.quad_R_left_extend(1), [0.05, 0.75, 0.40], '-', 'Zone 1 (80%, Instant)');
else
    draw_mho(z3x, line_angle_deg, [0.6, 0.35, 0.85], '--', 'Zone 3 Mho (180%, 800ms)');
    draw_mho(z2x, line_angle_deg, [0.15, 0.45, 0.95], '-', 'Zone 2 Mho (120%, 350ms)');
    draw_mho(z1x, line_angle_deg, [0.05, 0.75, 0.40], '-', 'Zone 1 Mho (80%, Instant)');
end

if cfg.load_encroach_enabled
    la_rad = deg2rad(cfg.load_encroach_angle_deg);
    le_r_top = cfg.load_encroach_R_ohm * tan(la_rad);
    fill([0, cfg.load_encroach_R_ohm, cfg.load_encroach_R_ohm + 15, cfg.load_encroach_R_ohm + 15, cfg.load_encroach_R_ohm, 0], ...
         [0, le_r_top, le_r_top, -le_r_top, -le_r_top, 0], ...
         [1.0, 0.72, 0.0], 'EdgeColor', [0.96, 0.62, 0.04], 'LineStyle', '--', ...
         'LineWidth', 1.2, 'FaceAlpha', 0.25, 'DisplayName', 'Load Encroachment Blinder');
end

plot([0, total_line_r], [0, total_line_x], 'k-', 'LineWidth', 2.5, ...
    'DisplayName', sprintf('Protected Line (%.0f km)', line_len_km));
plot(total_line_r, total_line_x, 'ko', 'MarkerFaceColor', 'k', 'HandleVisibility', 'off');

if trip_decision
    plot(zm_r, zm_x, 'rpentagram', 'MarkerSize', 15, 'MarkerFaceColor', 'r', ...
        'DisplayName', sprintf('%s: R=%.2f\\Omega, X=%.2f\\Omega, t=%.0fms', picked_up_zone, zm_r, zm_x, trip_time_ms));
elseif is_load_encroachment
    plot(zm_r, zm_x, 's', 'MarkerSize', 12, 'MarkerFaceColor', [1.0, 0.72, 0.0], ...
        'DisplayName', 'BLOCKED BY LOAD ENCROACHMENT');
else
    plot(zm_r, zm_x, 'go', 'MarkerSize', 11, 'MarkerFaceColor', 'g', ...
        'DisplayName', sprintf('No Trip / Out of Reach (|Z|=%.2f \\Omega \\angle %.1f deg)', zm_mag, zm_angle_deg));
end

xlabel('Resistance R [\Omega primary]', 'FontSize', 12, 'FontWeight', 'bold');
ylabel('Reactance X [\Omega primary]', 'FontSize', 12, 'FontWeight', 'bold');
title(sprintf('ANSI 21 Distance Relay (%s Characteristic) - %s', upper(char_type), picked_up_zone), ...
    'FontSize', 14, 'FontWeight', 'bold');
legend('Location', 'northwest', 'FontSize', 9);
axis equal;
z3_reach_r = z3x / tan(deg2rad(line_angle_deg));
xlim([-8, max(z3_reach_r, total_line_r) + 12]);
ylim([-6, z3x + 6]);

end

%% ---- Local Functions ----

function inside = test_mho(zm_r, zm_x, reach_x, line_angle_deg)
% Exact port of TS testMho(): center = (reachR/2, reachX/2), radius = hypot(center)
reach_r = reach_x / tan(deg2rad(line_angle_deg));
cx = reach_r / 2;
cy = reach_x / 2;
radius = hypot(cx, cy);
inside = hypot(zm_r - cx, zm_x - cy) <= radius;
end

function draw_quad(reach_x, r_right, r_left, edge_color, line_style, label)
fill([r_left, r_left, r_right, r_right], [0, reach_x, reach_x, 0], ...
    edge_color, 'EdgeColor', edge_color, 'LineStyle', line_style, ...
    'LineWidth', 1.6, 'FaceAlpha', 0.22, 'DisplayName', label);
end

function draw_mho(reach_x, line_angle_deg, edge_color, line_style, label)
reach_r = reach_x / tan(deg2rad(line_angle_deg));
c = complex(reach_r, reach_x) / 2;
r = abs(c);
theta = linspace(0, 2 * pi, 300);
fill(real(c) + r * cos(theta), imag(c) + r * sin(theta), ...
    edge_color, 'EdgeColor', edge_color, 'LineStyle', line_style, ...
    'LineWidth', 1.6, 'FaceAlpha', 0.22, 'DisplayName', label);
end

function v = get_opt(s, name, default)
if isfield(s, name) && ~isempty(s.(name))
    v = s.(name);
else
    v = default;
end
end
