function results = power_quality_thd(time_sec, v_waveform_kV, i_waveform_A)
% POWER_QUALITY_THD Computes IEEE 519 / IEC 61000-4-30 Power Quality Harmonics
% and Total Harmonic Distortion (THD_V, THD_I) using Fast Fourier Transform (FFT).
%
% Inputs:
%   time_sec      - Time sample vector [s] (e.g., 5 cycles at 60 Hz)
%   v_waveform_kV - Measured voltage waveform [kV]
%   i_waveform_A  - Measured current waveform [A]
%
% Outputs:
%   results       - Struct with harmonic orders, magnitudes, THD_V, THD_I, and compliance status.

f_fund = 50.0;
if nargin < 1 || isempty(time_sec)
    % 10 cycles at 60 Hz sampled at 7680 Hz (128 samples/cycle)
    Fs = 7680;
    N_cycles = 10;
    time_sec = (0:(Fs*N_cycles/f_fund - 1)) / Fs;
end

if nargin < 2 || isempty(v_waveform_kV)
    % Synthesize non-linear voltage waveform with 5th (3.2%), 7th (2.1%), 11th (1.4%) harmonics
    t = time_sec;
    V1_pk = 13.8 * sqrt(2) / sqrt(3); % Line-to-neutral peak kV
    v_waveform_kV = V1_pk * sin(2*pi*f_fund*t) ...
        + 0.032 * V1_pk * sin(2*pi*5*f_fund*t + deg2rad(45)) ...
        + 0.021 * V1_pk * sin(2*pi*7*f_fund*t - deg2rad(30)) ...
        + 0.014 * V1_pk * sin(2*pi*11*f_fund*t + deg2rad(15));
end

if nargin < 3 || isempty(i_waveform_A)
    % Synthesize 6-pulse converter non-linear current waveform
    t = time_sec;
    I1_pk = 650 * sqrt(2);
    i_waveform_A = I1_pk * sin(2*pi*f_fund*t - deg2rad(25)) ...
        + (I1_pk / 5) * 0.70 * sin(2*pi*5*f_fund*t + deg2rad(120)) ...
        + (I1_pk / 7) * 0.65 * sin(2*pi*7*f_fund*t - deg2rad(80)) ...
        + (I1_pk / 11) * 0.50 * sin(2*pi*11*f_fund*t + deg2rad(40));
end

%% 1. FFT Harmonic Analysis
N = length(time_sec);
Fs = 1 / (time_sec(2) - time_sec(1));

% Voltage FFT
Y_v = fft(v_waveform_kV) / N;
f_axis = (0:(N/2)) * (Fs / N);
mag_v = 2 * abs(Y_v(1:N/2+1));

% Current FFT
Y_i = fft(i_waveform_A) / N;
mag_i = 2 * abs(Y_i(1:N/2+1));

% Extract Harmonic Orders h = 1 to 25
harm_orders = 1:25;
harm_freqs = harm_orders * f_fund;
V_harm_kV = zeros(size(harm_orders));
I_harm_A = zeros(size(harm_orders));

for h = 1:length(harm_orders)
    [~, idx] = min(abs(f_axis - harm_freqs(h)));
    V_harm_kV(h) = mag_v(idx) / sqrt(2); % RMS kV
    I_harm_A(h)  = mag_i(idx) / sqrt(2); % RMS A
end

%% 2. Total Harmonic Distortion (THD) Calculation
V1_rms = V_harm_kV(1);
I1_rms = I_harm_A(1);

THD_V_pct = (sqrt(sum(V_harm_kV(2:end).^2)) / V1_rms) * 100;
THD_I_pct = (sqrt(sum(I_harm_A(2:end).^2)) / I1_rms) * 100;

% IEEE 519 Standard Limits
limit_THD_V = 5.0; % Max 5.0% for 1kV to 69kV
limit_individual_V = 3.0; % Max 3.0% individual
is_compliant = (THD_V_pct <= limit_THD_V) && all(V_harm_kV(2:end)/V1_rms * 100 <= limit_individual_V);

results.harm_orders = harm_orders;
results.V_harm_kV = V_harm_kV;
results.I_harm_A = I_harm_A;
results.THD_V_pct = THD_V_pct;
results.THD_I_pct = THD_I_pct;
results.is_compliant = is_compliant;

%% 3. Engineering Visualization
figure('Name', 'IEEE 519 Power Quality & Harmonics Analyzer', 'Color', 'w', 'Position', [280, 100, 850, 680]);

% Subplot 1: Instantaneous Waveforms
subplot(2, 2, [1, 2]);
yyaxis left;
plot(time_sec(1:min(length(time_sec), 256))*1000, v_waveform_kV(1:min(length(time_sec), 256)), 'b-', 'LineWidth', 2.0);
ylabel('Voltage v(t) [kV]', 'FontWeight', 'bold');
grid on;
yyaxis right;
plot(time_sec(1:min(length(time_sec), 256))*1000, i_waveform_A(1:min(length(time_sec), 256)), 'r-', 'LineWidth', 1.8);
ylabel('Current i(t) [A]', 'FontWeight', 'bold');
xlabel('Time [milliseconds]', 'FontWeight', 'bold');
title(sprintf('Distorted Voltage & Current Waveforms (THD_V = %.2f%%, THD_I = %.2f%%)', THD_V_pct, THD_I_pct), 'FontSize', 12, 'FontWeight', 'bold');

% Subplot 2: Voltage Harmonic Spectrum (Bar Chart)
subplot(2, 2, 3);
V_pct_fund = (V_harm_kV / V1_rms) * 100;
b1 = bar(harm_orders(1:15), V_pct_fund(1:15), 'FaceColor', [0.2, 0.5, 0.8]);
hold on; grid on;
yline(limit_individual_V, 'r--', 'LineWidth', 1.8, 'DisplayName', 'IEEE 519 Limit (3.0%)');
xlabel('Harmonic Order (h)', 'FontWeight', 'bold');
ylabel('Magnitude [% of Fundamental]', 'FontWeight', 'bold');
title('Voltage Harmonic Spectrum', 'FontSize', 11, 'FontWeight', 'bold');
legend('Harmonics', 'IEEE 519 Limit', 'Location', 'northeast');

% Subplot 3: Current Harmonic Spectrum
subplot(2, 2, 4);
I_pct_fund = (I_harm_A / I1_rms) * 100;
b2 = bar(harm_orders(1:15), I_pct_fund(1:15), 'FaceColor', [0.8, 0.3, 0.2]);
grid on;
xlabel('Harmonic Order (h)', 'FontWeight', 'bold');
ylabel('Magnitude [% of Fundamental]', 'FontWeight', 'bold');
title('Current Harmonic Spectrum', 'FontSize', 11, 'FontWeight', 'bold');

end
