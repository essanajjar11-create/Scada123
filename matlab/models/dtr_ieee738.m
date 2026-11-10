function results = dtr_ieee738(wind_speed_m_s, ambient_temp_C, solar_rad_W_m2, wind_angle_deg)
% DTR_IEEE738 Calculates Dynamic Thermal Rating (DTR) for 132 kV Overhead Transmission
% Lines based on the IEEE Std 738 / CIGRE TB 299 Heat Balance Equation.
%
% Inputs:
%   wind_speed_m_s  - Wind speed perpendicular/incident to conductor [m/s]
%   ambient_temp_C  - Ambient Air Temperature [deg C]
%   solar_rad_W_m2  - Total Solar Irradiance [W/m^2]
%   wind_angle_deg  - Wind approach angle (0 to 90 deg, default 90 deg perpendicular)
%
% Outputs:
%   results         - Struct with dynamic ampacity [A], static ampacity [A], and capacity gain [%].

if nargin < 1 || isempty(wind_speed_m_s),  wind_speed_m_s = linspace(0.5, 12.0, 100); end
if nargin < 2 || isempty(ambient_temp_C),  ambient_temp_C = 35.0; end
if nargin < 3 || isempty(solar_rad_W_m2),  solar_rad_W_m2 = 950.0; end
if nargin < 4 || isempty(wind_angle_deg),  wind_angle_deg = 90.0; end

%% 1. Conductor Physical Characteristics (ACSR Drake 795 kcmil, 28.1 mm dia)
D_m = 0.02814;          % Conductor outside diameter [m] (28.14 mm)
T_max_C = 75.0;         % Maximum allowable continuous conductor operating temp [deg C]
alpha_absorptivity = 0.80; % Solar absorptivity of aged conductor
emissivity = 0.80;      % Emissivity
sigma_SB = 5.67e-8;     % Stefan-Boltzmann constant [W/(m^2 K^4)]
R_25_Ohm_per_m = 0.0728 / 1000; % 72.8 mOhm/km at 25 deg C
alpha_R = 0.00393;      % Temperature coefficient of resistance [1/deg C]

% AC Resistance at T_max = 75 deg C
R_Tmax = R_25_Ohm_per_m * (1 + alpha_R * (T_max_C - 25)); % [Ohm/m]

%% 2. Solar Heat Gain (q_s) [W/m]
% q_s = alpha * Q_se * sin(theta) * A'
q_s = alpha_absorptivity * solar_rad_W_m2 * D_m; % [W/m]

%% 3. Radiated Heat Loss (q_r) [W/m]
% q_r = 17.8 * D * epsilon * [ ((T_c + 273)/100)^4 - ((T_a + 273)/100)^4 ]
T_c_K = T_max_C + 273.15;
T_a_K = ambient_temp_C + 273.15;
q_r = pi * D_m * emissivity * sigma_SB * (T_c_K^4 - T_a_K^4); % [W/m]

%% 4. Convective Heat Loss (q_c) [W/m] as a function of Wind Speed
% IEEE 738 forced convection equations:
% Film temperature T_film = (T_c + T_a) / 2
T_film_C = (T_max_C + ambient_temp_C) / 2;
mu_air = (1.458e-6 * (T_film_C + 273.15)^1.5) / (T_film_C + 383.4); % Dynamic viscosity
rho_air = (1.293 - 1.525e-4 * 100 + 6.379e-9 * 100^2) / (1 + 0.00367 * T_film_C); % Air density
k_air = 2.424e-2 + 7.477e-5 * T_film_C - 4.407e-9 * T_film_C^2; % Thermal conductivity

N_w = length(wind_speed_m_s);
I_dynamic_A = zeros(size(wind_speed_m_s));

for i = 1:N_w
    V_w = wind_speed_m_s(i);
    N_Re = (D_m * rho_air * V_w) / mu_air; % Reynolds number
    
    % Low wind forced convection
    q_c1 = (1.01 + 0.0372 * N_Re^0.52) * k_air * (T_max_C - ambient_temp_C);
    % High wind forced convection
    q_c2 = (0.1695 * N_Re^0.60) * k_air * (T_max_C - ambient_temp_C);
    
    % Wind direction factor K_angle
    phi_rad = deg2rad(wind_angle_deg);
    K_angle = 1.194 - cos(phi_rad) + 0.194 * cos(2*phi_rad) + 0.368 * sin(2*phi_rad);
    
    q_c = max(q_c1, q_c2) * K_angle;
    
    % Heat Balance Equation: q_c + q_r = q_s + I^2 * R(T_max)
    % Ampacity I = sqrt( (q_c + q_r - q_s) / R(T_max) )
    net_cooling = q_c + q_r - q_s;
    if net_cooling > 0
        I_dynamic_A(i) = sqrt(net_cooling / R_Tmax);
    else
        I_dynamic_A(i) = 0;
    end
end

% Static Conservative Rating (Assumption: V_w = 0.6 m/s, Tamb = 40 deg C, Solar = 1000 W/m2)
I_static_nominal_A = 645.0; % Fixed nameplate rating

results.wind_speed_m_s = wind_speed_m_s;
results.I_dynamic_A = I_dynamic_A;
results.I_static_nominal_A = I_static_nominal_A;
results.capacity_gain_pct = ((I_dynamic_A - I_static_nominal_A) / I_static_nominal_A) * 100;

%% 5. Plot Dynamic Thermal Rating (DTR) Curves
figure('Name', 'IEEE 738 Dynamic Thermal Rating (DTR)', 'Color', 'w', 'Position', [220, 120, 800, 580]);
hold on; grid on; box on;

% Fill capacity headroom area
fill([wind_speed_m_s, fliplr(wind_speed_m_s)], ...
    [I_dynamic_A, I_static_nominal_A * ones(size(I_dynamic_A))], ...
    [0.85, 0.95, 0.85], 'EdgeColor', 'none', 'FaceAlpha', 0.7, 'DisplayName', 'DTR Dynamic Capacity Headroom (+20% to +65%)');

plot(wind_speed_m_s, I_dynamic_A, 'b-', 'LineWidth', 2.5, 'DisplayName', 'DTR Dynamic Line Ampacity I_{max}(V_w)');
yline(I_static_nominal_A, 'r--', 'LineWidth', 2.0, 'DisplayName', sprintf('Static Book Rating (I_{static} = %.0f A)', I_static_nominal_A));

xlabel('Wind Speed V_w [m/s]', 'FontSize', 12, 'FontWeight', 'bold');
ylabel('Continuous Current Ampacity [A]', 'FontSize', 12, 'FontWeight', 'bold');
title(sprintf('IEEE Std 738 Dynamic Thermal Rating - 132 kV Line (T_{amb}=%.0f ^\\circC, T_{max}=%.0f ^\\circC)', ambient_temp_C, T_max_C), ...
    'FontSize', 13, 'FontWeight', 'bold');
legend('Location', 'northwest', 'FontSize', 10);
xlim([0, max(wind_speed_m_s)]);
ylim([500, max(I_dynamic_A)*1.1]);

end
