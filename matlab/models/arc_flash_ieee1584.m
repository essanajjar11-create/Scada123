function results = arc_flash_ieee1584(V_kV, I_sc_kA, clearing_time_s, working_dist_mm)
% ARC_FLASH_IEEE1584 Calculates Arc Flash Incident Energy (E) and Arc Flash
% Protection Boundary (AFPB) according to IEEE Std 1584-2018 and NFPA 70E.
%
% Inputs:
%   V_kV            - System Voltage [kV] (e.g. 13.8 kV MV Switchgear)
%   I_sc_kA         - Prospective Bolted Short Circuit Current [kA] (e.g. 25.0 kA)
%   clearing_time_s - Total Fault Clearing Time including relay & breaker [s] (e.g. 0.080 s)
%   working_dist_mm - Working Distance from arc source [mm] (default: 610 mm / 24 in)
%
% Outputs:
%   results         - Struct containing Arcing Current, Incident Energy [cal/cm^2],
%                     Flash Boundary [mm], and Required PPE Category.

if nargin < 1 || isempty(V_kV),            V_kV = 13.8; end
if nargin < 2 || isempty(I_sc_kA),         I_sc_kA = 20.0; end
if nargin < 3 || isempty(clearing_time_s), clearing_time_s = 0.065; end % 65 ms fast clearing
if nargin < 4 || isempty(working_dist_mm), working_dist_mm = 610.0; end % 24 inches

%% 1. IEEE 1584-2018 Intermediate Voltage Range Equations (0.6 kV < V <= 15 kV)
% Electrode Configuration: VCB (Vertical Conductors in Metal Box / Switchgear)
% Conductor Gap G = 152 mm for 13.8 kV switchgear
G_mm = 152.0;

% Arcing Current Estimation (I_arc):
% lg(I_arc) = k1 + k2*lg(I_bf) + k3*lg(G) + ...
lg_Ibf = log10(I_sc_kA);
I_arc_kA = 10^(0.00402 + 0.983 * lg_Ibf); % ~17.8 kA arcing current

%% 2. Incident Energy Calculation (E in cal/cm^2)
% E = (4.184 / 4.184) * Cf * En * (t / 0.2) * (610^x / D^x)
x_exp = 1.473; % Distance exponent for MV switchgear

% Base Incident energy for 0.2s duration at 610 mm
E_base_cal_cm2 = 10^(-0.792 + 0.811 * log10(I_arc_kA) + 0.0004 * G_mm);
% Scaled for actual clearing time and working distance
E_cal_cm2 = E_base_cal_cm2 * (clearing_time_s / 0.2) * ((610 / working_dist_mm)^x_exp);

%% 3. Arc Flash Protection Boundary (AFPB in mm)
% Distance where Incident Energy drops to 1.2 cal/cm^2 (Threshold of 2nd degree burn)
AFPB_mm = 610 * ((E_base_cal_cm2 * (clearing_time_s / 0.2)) / 1.2)^(1 / x_exp);

%% 4. NFPA 70E PPE Category Classification
if E_cal_cm2 <= 1.2
    ppe_category = 'Category 0 / Non-Arc Rated (General Cotton)';
elseif E_cal_cm2 <= 4.0
    ppe_category = 'Category 1 (Minimum 4 cal/cm^2 Arc-Rated Clothing)';
elseif E_cal_cm2 <= 8.0
    ppe_category = 'Category 2 (Minimum 8 cal/cm^2 Arc-Rated Shield & Suit)';
elseif E_cal_cm2 <= 25.0
    ppe_category = 'Category 3 (Minimum 25 cal/cm^2 Flash Suit & Hood)';
elseif E_cal_cm2 <= 40.0
    ppe_category = 'Category 4 (Minimum 40 cal/cm^2 Heavy Flash Suit)';
else
    ppe_category = 'DANGEROUS / NO PPE EXISTS (E > 40 cal/cm^2 - De-energize Only)';
end

results.V_kV = V_kV;
results.I_sc_kA = I_sc_kA;
results.I_arc_kA = I_arc_kA;
results.clearing_time_s = clearing_time_s;
results.working_dist_mm = working_dist_mm;
results.E_cal_cm2 = E_cal_cm2;
results.AFPB_mm = AFPB_mm;
results.ppe_category = ppe_category;

%% 5. Plot Arc Flash Energy vs Distance Profile
figure('Name', 'IEEE Std 1584 Arc Flash Incident Energy Profile', ...
    'Color', 'w', 'Position', [180, 120, 800, 600]);
hold on; grid on; box on;

d_axis_mm = linspace(300, 3000, 300);
E_curve = E_base_cal_cm2 * (clearing_time_s / 0.2) * ((610 ./ d_axis_mm).^x_exp);

% Fill Hazardous Region (E >= 1.2 cal/cm2)
idx_haz = (E_curve >= 1.2);
fill([d_axis_mm(idx_haz), fliplr(d_axis_mm(idx_haz))], ...
    [E_curve(idx_haz), 1.2 * ones(sum(idx_haz), 1).'], ...
    [1.0, 0.85, 0.85], 'EdgeColor', 'none', 'FaceAlpha', 0.6, 'DisplayName', 'Burn Hazard Zone (E >= 1.2 cal/cm^2)');

plot(d_axis_mm, E_curve, 'b-', 'LineWidth', 2.5, 'DisplayName', 'Incident Energy E(D)');
yline(1.2, 'r--', 'LineWidth', 2.0, 'DisplayName', '2nd Degree Burn Limit (1.2 cal/cm^2)');
yline(8.0, 'm--', 'LineWidth', 1.5, 'DisplayName', 'PPE Category 2 Limit (8.0 cal/cm^2)');
xline(AFPB_mm, 'k--', 'LineWidth', 2.0, 'DisplayName', sprintf('Flash Boundary AFPB = %.0f mm', AFPB_mm));

% Working Distance Operating Point
plot(working_dist_mm, E_cal_cm2, 'rp', 'MarkerSize', 15, 'MarkerFaceColor', 'r', ...
    'DisplayName', sprintf('Worker Position: %.0f mm -> E = %.2f cal/cm^2', working_dist_mm, E_cal_cm2));

xlabel('Distance from Arc Source [mm]', 'FontSize', 12, 'FontWeight', 'bold');
ylabel('Incident Energy E [cal/cm^2]', 'FontSize', 12, 'FontWeight', 'bold');
title(sprintf('IEEE 1584 Arc Flash Hazard (13.8 kV, I_{sc}=%.1f kA, t=%.0f ms) -> %s', ...
    I_sc_kA, clearing_time_s*1000, ppe_category), 'FontSize', 12, 'FontWeight', 'bold');
legend('Location', 'northeast', 'FontSize', 9);
xlim([300, 2500]);
ylim([0, max(E_curve(d_axis_mm >= 400))*1.1]);

end
