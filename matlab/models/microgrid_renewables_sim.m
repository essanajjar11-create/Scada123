function results = microgrid_renewables_sim(time_hours)
% MICROGRID_RENEWABLES_SIM Simulates the integrated Substation Renewable Microgrid:
% 5 MW Solar PV, 10 MW/40 MWh BESS, 2 MW PEM Electrolyzer, and ±50 kV VSC-HVDC Link.
%
% Inputs:
%   time_hours - 24-hour time vector [hours]
%
% Outputs:
%   results    - Struct containing generation, storage, hydrogen, and HVDC power profiles.

if nargin < 1 || isempty(time_hours), time_hours = linspace(0, 24, 240); end

params = substation_parameters();
t = time_hours;
N = length(t);

%% 1. Solar PV Generation (5 MW Peak)
% Solar Irradiance Curve (G_irr in W/m2, Peak 1000 W/m2 at 12:00 PM)
G_irr = zeros(size(t));
day_idx = (t >= 6.0 & t <= 18.0);
G_irr(day_idx) = 1000 * sin(pi * (t(day_idx) - 6) / 12).^1.2;

% Solar PV Power Output [MW]
P_solar_MW = (G_irr / 1000) * params.solar.P_rated_MW * params.solar.inverter_eff;

%% 2. Substation Gross Demand Profile (Sum of 4 Feeders)
% Total Nominal Load = 8.5 + 6.2 + 7.8 + 5.5 = 28.0 MW
P_load_gross_MW = 18.0 + 10.0 * sin(2*pi*(t - 7)/24).^2 + 3.0 * sin(2*pi*(t - 16)/10).^2;

%% 3. BESS Peak Shaving & Energy Arbitrage (10 MW / 40 MWh)
% Strategy: Charge during solar peak (10:00 to 14:00) / low price, Discharge during evening peak (18:00 to 22:00)
P_bess_MW = zeros(size(t));
SoC = zeros(size(t));
SoC(1) = params.bess.SoC_initial; % 72%

dt_hr = t(2) - t(1);
Cap_MWh = params.bess.Capacity_MWh;

for k = 1:N
    hour = t(k);
    if hour >= 10.0 && hour <= 14.0
        % Charge from excess solar (negative power = charging)
        P_bess_MW(k) = -6.5; 
    elseif hour >= 18.0 && hour <= 22.0
        % Discharge during peak demand (positive power = discharging)
        P_bess_MW(k) = +7.5;
    else
        P_bess_MW(k) = 0.0; % Standby
    end
    
    % Update State of Charge (SoC)
    if k > 1
        % Coulomb Counting / Energy balance with round-trip efficiency
        if P_bess_MW(k) < 0 % Charging
            dSoC = (-P_bess_MW(k) * dt_hr * sqrt(params.bess.roundtrip_eff)) / Cap_MWh;
        else % Discharging
            dSoC = (-P_bess_MW(k) * dt_hr / sqrt(params.bess.roundtrip_eff)) / Cap_MWh;
        end
        SoC(k) = max(0.15, min(0.95, SoC(k-1) + dSoC));
    end
end

%% 4. Green Hydrogen PEM Electrolyzer (2 MW)
% Consumes 2 MW when solar is available (G_irr > 200 W/m2) or grid surplus
P_hydrogen_MW = zeros(size(t));
H2_prod_kg_per_hr = zeros(size(t));
cum_H2_kg = zeros(size(t));

for k = 1:N
    if G_irr(k) > 200
        P_hydrogen_MW(k) = min(2.0, P_solar_MW(k) * 0.4);
    else
        P_hydrogen_MW(k) = 0.2; % Minimum standby keep-warm power
    end
    
    % Hydrogen production rate = Power [kW] / 50 kWh/kg
    H2_prod_kg_per_hr(k) = (P_hydrogen_MW(k) * 1e3) / params.hydrogen.eff_kWh_per_kg;
    if k == 1
        cum_H2_kg(k) = H2_prod_kg_per_hr(k) * dt_hr;
    else
        cum_H2_kg(k) = cum_H2_kg(k-1) + H2_prod_kg_per_hr(k) * dt_hr;
    end
end

%% 5. VSC-HVDC Link Power Dispatch (±50 kV DC)
% HVDC imports/exports to stabilize MV bus and exchange power with regional grid
P_hvdc_MW = 12.0 + 4.0 * sin(2*pi*(t - 12)/24); % Scheduled Power Import
Q_hvdc_MVAR = 3.5 * cos(2*pi*t/24);             % Dynamic Reactive Power Support

%% 6. Net Substation Grid Import
P_net_grid_MW = P_load_gross_MW - P_solar_MW - P_bess_MW + P_hydrogen_MW - P_hvdc_MW;

results.time_hours = t;
results.P_solar_MW = P_solar_MW;
results.P_load_gross_MW = P_load_gross_MW;
results.P_bess_MW = P_bess_MW;
results.bess_SoC = SoC * 100; % [%]
results.P_hydrogen_MW = P_hydrogen_MW;
results.H2_prod_kg_hr = H2_prod_kg_per_hr;
results.cum_H2_kg = cum_H2_kg;
results.P_hvdc_MW = P_hvdc_MW;
results.Q_hvdc_MVAR = Q_hvdc_MVAR;
results.P_net_grid_MW = P_net_grid_MW;

%% 7. Engineering Subplot Visualization
figure('Name', 'Substation Microgrid & Renewable Dispatch', 'Color', 'w', 'Position', [180, 80, 900, 750]);

% Subplot 1: Power Balance Overview
subplot(3, 1, 1); hold on; grid on;
plot(t, P_load_gross_MW, 'k--', 'LineWidth', 2.0, 'DisplayName', 'Gross Demand (Feeders)');
plot(t, P_solar_MW, 'Color', [0.9 0.6 0.0], 'LineWidth', 2.2, 'DisplayName', '5 MW Solar PV');
plot(t, P_bess_MW, 'b-', 'LineWidth', 2.0, 'DisplayName', '10 MW BESS (\pmDischarge/Charge)');
plot(t, P_hvdc_MW, 'm-', 'LineWidth', 1.8, 'DisplayName', '\pm50kV VSC-HVDC Import');
plot(t, P_net_grid_MW, 'r-', 'LineWidth', 2.5, 'DisplayName', 'Net 132kV Grid Infeed');
ylabel('Power [MW]', 'FontWeight', 'bold');
title('24-Hour Substation Power Balance & Dispatch', 'FontSize', 12, 'FontWeight', 'bold');
legend('Location', 'northwest', 'FontSize', 8);
xlim([0, 24]);

% Subplot 2: BESS Energy Storage & State of Charge (SoC)
subplot(3, 1, 2);
yyaxis left;
plot(t, P_bess_MW, 'b-', 'LineWidth', 2.0);
ylabel('BESS Power [MW]', 'FontWeight', 'bold');
yline(0, 'k:'); grid on;
yyaxis right;
plot(t, SoC * 100, 'g-', 'LineWidth', 2.2);
ylabel('BESS SoC [%]', 'FontWeight', 'bold');
ylim([0, 100]);
title('10 MW / 40 MWh BESS Dynamic State of Charge & Cycling', 'FontSize', 12, 'FontWeight', 'bold');
xlim([0, 24]);

% Subplot 3: Green Hydrogen PEM Production
subplot(3, 1, 3);
yyaxis left;
plot(t, H2_prod_kg_per_hr, 'Color', [0.1, 0.7, 0.4], 'LineWidth', 2.0);
ylabel('H_2 Rate [kg/h]', 'FontWeight', 'bold');
grid on;
yyaxis right;
plot(t, cum_H2_kg, 'Color', [0.8, 0.2, 0.6], 'LineWidth', 2.2);
ylabel('Cumulative H_2 [kg]', 'FontWeight', 'bold');
xlabel('Time of Day [Hours]', 'FontSize', 11, 'FontWeight', 'bold');
title(sprintf('2 MW PEM Electrolyzer Green Hydrogen Yield (Total: %.1f kg H_2 / Day)', cum_H2_kg(end)), 'FontSize', 12, 'FontWeight', 'bold');
xlim([0, 24]);

end
