function results = thermal_aging_iec60076(load_profile_pu, ambient_temp_C, time_hours, cooling_mode)
% THERMAL_AGING_IEC60076 Transformer Thermal & Insulation Aging Model
% EXACT PARITY PORT of src/components/thermal/TransformerThermalAgingModule.tsx
%
% Implements the identical steady-state formulation as the React/Web SCADA
% module (the web module performs no transient/lag integration):
%
%   delta_top_oil = dTheta_oil_rated * ((1 + R*K^2) / (1 + R))^x
%   top_oil       = ambient + delta_top_oil
%   bottom_oil    = max(ambient + 5, top_oil - oil_diff)
%   hot_spot      = top_oil + H * g_r * K^y
%   F_AA          = max(0.01, exp(15000/383.15 - 15000/(hot_spot + 273.15)))
%   daily_LOL_pct = F_AA * 24 / 180000 * 100
%   DP            = clamp(round(780 - (F_AA - 1) * 45), 200, 1200)
%
% Cooling-mode dependent constants (web defaults: coolingMode = 'ONAF',
% K = 1.08 p.u., ambient = 40 degC):
%   ONAN: dTheta_oil=45, x=0.8, y=1.6, g_r=22, oil_diff=18
%   ONAF: dTheta_oil=38, x=0.9, y=1.6, g_r=18, oil_diff=14
%   OFAF: dTheta_oil=32, x=1.0, y=2.0, g_r=14, oil_diff=10
%
% Hot-spot status thresholds: warning >= 105 degC, critical >= 120 degC.
%
% Inputs:
%   load_profile_pu - Vector of per-unit load K(t) = S(t)/S_rated (default 24-hr curve)
%   ambient_temp_C  - Ambient temperature vector or constant [deg C]
%   time_hours      - Time vector in hours (default: linspace(0, 24, 240))
%   cooling_mode    - 'ONAN' | 'ONAF' | 'OFAF' (default matches web default)
%
% Outputs:
%   results         - Struct with temps, aging factor, daily LOL %, DP and status.

if nargin < 4 || isempty(cooling_mode)
    params_early = substation_parameters();
    cooling_mode = params_early.thermal.default_cooling_mode;
end
if nargin < 3 || isempty(time_hours), time_hours = linspace(0, 24, 240); end
if nargin < 1 || isempty(load_profile_pu)
    % Typical 24-hour substation load curve (peak afternoon/evening)
    t_def = time_hours;
    load_profile_pu = 0.55 + 0.35 * sin(2*pi*(t_def - 6)/24).^2 + 0.15 * sin(2*pi*(t_def - 14)/12).^2;
end
if nargin < 2 || isempty(ambient_temp_C)
    % Diurnal ambient temperature curve (16 to 40 deg C envelope)
    t_def = time_hours;
    ambient_temp_C = 28 + 12 * sin(2*pi*(t_def - 9)/24);
end

params = substation_parameters();
cfg = params.thermal;
mode = cfg.modes.(upper(cooling_mode));

R = cfg.R_loss_ratio;                    % 5.2 (load loss / no-load loss ratio)
H = cfg.H_factor;                        % 1.3 hot-spot factor
dTheta_or = mode.dTheta_oil_rated_C;     % Rated top-oil rise [K]
x_exp = mode.exp_x;                      % Oil exponent
y_exp = mode.exp_y;                      % Winding exponent
g_r = mode.grad_rated_C;                 % Rated winding gradient [K]
oil_diff = mode.oil_diff_C;              % Top-oil to bottom-oil difference [K]

dt_hr = (time_hours(2) - time_hours(1));
N = length(time_hours);

%% Steady-State Evaluation at Every Load Point (no thermal lag, as in web)
top_oil  = zeros(1, N);
bottom_oil = zeros(1, N);
hot_spot = zeros(1, N);
V_aging  = zeros(1, N);      % Aging acceleration factor F_AA(t)
LOL_hr   = zeros(1, N);      % Cumulative equivalent normal-aging hours
daily_lol_pct = zeros(1, N); % Web daily Loss-of-Life percentage
dp_value = zeros(1, N);      % Estimated Degree of Polymerization

for k = 1:N
    K = load_profile_pu(k);
    Tamb = ambient_temp_C(k);

    % 1. Top-oil temperature rise over ambient (IEEE C57.91 / IEC 60076-7 form)
    delta_top_oil = dTheta_or * ((1 + R * K^2) / (1 + R))^x_exp;
    top_oil(k) = Tamb + delta_top_oil;

    % 2. Bottom-oil temperature (clamped, as in web)
    bottom_oil(k) = max(Tamb + 5, top_oil(k) - oil_diff);

    % 3. Hot-spot temperature: Theta_HS = Theta_TO + H * g_r * K^y
    hot_spot(k) = top_oil(k) + H * g_r * K^y_exp;

    % 4. Arrhenius aging acceleration factor relative to 110 degC reference
    V_aging(k) = max(0.01, exp(15000/383.15 - 15000/(hot_spot(k) + 273.15)));

    % 5. Daily loss-of-life percentage (identical web formula)
    daily_lol_pct(k) = ((V_aging(k) * 24) / cfg.design_life_hours) * 100;

    % 6. Paper insulation degree of polymerization estimate (identical web formula)
    dp_wear = (V_aging(k) - 1.0) * cfg.dp_wear_per_faa;
    dp_value(k) = round(cfg.dp_base - dp_wear);

    % Cumulative loss of life in equivalent hours
    if k == 1
        LOL_hr(k) = 0;
    else
        LOL_hr(k) = LOL_hr(k-1) + V_aging(k) * dt_hr;
    end
end
dp_value = max(cfg.dp_min, min(cfg.dp_max, dp_value));

hotspot_status = strings(1, N);
hotspot_status(hot_spot >= cfg.hs_critical_C) = "CRITICAL";
hotspot_status(hot_spot >= cfg.hs_warning_C & hot_spot < cfg.hs_critical_C) = "WARNING";
hotspot_status(hot_spot < cfg.hs_warning_C) = "NORMAL";

%% Store Results
results.time_hours = time_hours;
results.load_pu = load_profile_pu;
results.ambient_temp_C = ambient_temp_C;
results.cooling_mode = upper(cooling_mode);
results.top_oil_temp_C = top_oil;
results.bottom_oil_temp_C = bottom_oil;
results.hot_spot_temp_C = hot_spot;
results.aging_rate_V = V_aging;                 % F_AA per point
results.daily_lol_pct = daily_lol_pct;
results.daily_lol_pct_max = max(daily_lol_pct);
results.dp_value = dp_value;
results.dp_final = dp_value(end);
results.hotspot_status = hotspot_status;
results.cum_loss_of_life_hr = LOL_hr;
results.total_aging_hours_in_24h = LOL_hr(end); % Legacy field name kept
results.max_hot_spot_C = max(hot_spot);
results.max_top_oil_C = max(top_oil);

%% Engineering Visualization
figure('Name', 'IEC 60076-7 Transformer Thermal & Aging Model (Web Parity)', ...
    'Color', 'w', 'Position', [250, 80, 850, 760]);

% Subplot 1: Load and Ambient Temperature
subplot(4, 1, 1);
yyaxis left;
plot(time_hours, load_profile_pu, 'b-', 'LineWidth', 2.0);
ylabel('Load Factor K [p.u.]', 'FontWeight', 'bold');
ylim([0.3, 1.3]); grid on;
yyaxis right;
plot(time_hours, ambient_temp_C, 'm--', 'LineWidth', 1.8);
ylabel('Ambient \theta_a [^\circC]', 'FontWeight', 'bold');
title(sprintf('24-Hour Loading Profile & Ambient (%s Cooling, Web Parity Constants)', upper(cooling_mode)), ...
    'FontSize', 12, 'FontWeight', 'bold');

% Subplot 2: Oil & Hot-Spot Temperatures with web warning/critical thresholds
subplot(4, 1, 2);
hold on; grid on;
plot(time_hours, hot_spot, 'r-', 'LineWidth', 2.2, 'DisplayName', 'Hot-Spot \theta_{hs}');
plot(time_hours, top_oil, 'b-', 'LineWidth', 1.8, 'DisplayName', 'Top-Oil \theta_{TO}');
plot(time_hours, bottom_oil, 'c--', 'LineWidth', 1.4, 'DisplayName', 'Bottom-Oil');
yline(cfg.hs_warning_C, '--', 'Color', [0.96, 0.62, 0.04], 'Label', sprintf('Warning (%g\\circC)', cfg.hs_warning_C));
yline(cfg.hs_critical_C, '--', 'Color', [0.9, 0.2, 0.3], 'Label', sprintf('Critical (%g\\circC)', cfg.hs_critical_C));
ylabel('Temperature [^\circC]', 'FontWeight', 'bold');
title(sprintf('Thermal State (Max Hot-Spot = %.1f ^\\circC)', max(hot_spot)), 'FontSize', 12, 'FontWeight', 'bold');
legend('Location', 'northwest', 'FontSize', 8);

% Subplot 3: Aging Acceleration Factor and Daily Loss-of-Life %
subplot(4, 1, 3);
yyaxis left;
plot(time_hours, V_aging, 'k-', 'LineWidth', 2.0);
ylabel('F_{AA} Aging Factor [-]', 'FontWeight', 'bold');
grid on;
yyaxis right;
plot(time_hours, daily_lol_pct, 'g-', 'LineWidth', 2.0);
ylabel('Daily LOL [%]', 'FontWeight', 'bold');
title('Arrhenius Insulation Aging (F_{AA} = exp[15000/383.15 - 15000/(\theta_{hs}+273.15)])', ...
    'FontSize', 11, 'FontWeight', 'bold');

% Subplot 4: Degree of Polymerization Estimate
subplot(4, 1, 4);
hold on; grid on;
plot(time_hours, dp_value, 'b-', 'LineWidth', 2.0);
yline(cfg.dp_min, '--', 'Color', [0.9, 0.2, 0.3], 'Label', 'End-of-Life DP (200)');
ylim([cfg.dp_min - 30, cfg.dp_max]);
ylabel('Paper DP [-]', 'FontWeight', 'bold');
xlabel('Time [Hours]', 'FontSize', 11, 'FontWeight', 'bold');
title(sprintf('Kraft Paper Depolymerization (Final DP = %d)', dp_value(end)), ...
    'FontSize', 12, 'FontWeight', 'bold');

end
