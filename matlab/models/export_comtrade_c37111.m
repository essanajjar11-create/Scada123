function [cfg_file, dat_file] = export_comtrade_c37111(filename_base, output_dir)
% EXPORT_COMTRADE_C37111 Generates standard IEEE Std C37.111-2013 / IEC 60255-24
% COMTRADE (.CFG and .DAT) transient fault recording files for the substation digital twin.
%
% Inputs:
%   filename_base - Base name for the exported files (default: 'Substation_Fault_Event_01')
%   output_dir    - Directory to save files (default: current or matlab/data)

if nargin < 1 || isempty(filename_base), filename_base = 'Substation_Fault_Record_87T'; end
if nargin < 2 || isempty(output_dir)
    output_dir = fullfile(fileparts(mfilename('fullpath')), '..', 'data');
end
if ~exist(output_dir, 'dir'), mkdir(output_dir); end

%% 1. Synthesize Transient Fault Event Waveforms (Pre-fault, Fault, Post-fault)
Fs = 4800;              % 4800 Hz sampling rate (80 samples/cycle at 60 Hz)
f0 = 50.0;
t_pre = 0.05;           % 50 ms pre-fault
t_fault = 0.06;         % 60 ms fault duration before breaker opens
t_post = 0.09;          % 90 ms post-fault
t_total = t_pre + t_fault + t_post; % 200 ms total recording

t = (0:(1/Fs):t_total).';
N_samples = length(t);

% Normal steady-state 132 kV voltages (peak Line-to-Neutral)
V_pk = (132 / sqrt(3)) * sqrt(2) * 1e3; % ~107.78 kV peak
I_norm_pk = 175 * sqrt(2);              % ~247.5 A peak
I_fault_pk = 3850 * sqrt(2);            % ~5445 A fault peak (Phase A SLG Fault)

Va = zeros(N_samples, 1);
Vb = zeros(N_samples, 1);
Vc = zeros(N_samples, 1);
Ia = zeros(N_samples, 1);
Ib = zeros(N_samples, 1);
Ic = zeros(N_samples, 1);
Trip_87T = zeros(N_samples, 1);
Trip_52_1 = zeros(N_samples, 1);

for k = 1:N_samples
    tk = t(k);
    if tk < t_pre
        % Pre-fault normal operation
        Va(k) = V_pk * sin(2*pi*f0*tk);
        Vb(k) = V_pk * sin(2*pi*f0*tk - 2*pi/3);
        Vc(k) = V_pk * sin(2*pi*f0*tk + 2*pi/3);
        Ia(k) = I_norm_pk * sin(2*pi*f0*tk - deg2rad(20));
        Ib(k) = I_norm_pk * sin(2*pi*f0*tk - 2*pi/3 - deg2rad(20));
        Ic(k) = I_norm_pk * sin(2*pi*f0*tk + 2*pi/3 - deg2rad(20));
    elseif tk < (t_pre + t_fault)
        % Fault Inception: Phase-A to Ground Severe Fault
        Va(k) = 0.15 * V_pk * sin(2*pi*f0*tk); % Voltage sag on Phase A
        Vb(k) = 1.05 * V_pk * sin(2*pi*f0*tk - 2*pi/3);
        Vc(k) = 1.05 * V_pk * sin(2*pi*f0*tk + 2*pi/3);
        
        % High Fault Current with DC Offset decay
        tau_dc = 0.035; % 35 ms DC decay time constant
        Ia(k) = I_fault_pk * sin(2*pi*f0*tk - deg2rad(85)) + I_fault_pk * exp(-(tk - t_pre)/tau_dc);
        Ib(k) = I_norm_pk * sin(2*pi*f0*tk - 2*pi/3 - deg2rad(20));
        Ic(k) = I_norm_pk * sin(2*pi*f0*tk + 2*pi/3 - deg2rad(20));
        
        if tk >= (t_pre + 0.018) % 18 ms relay trip time
            Trip_87T(k) = 1;
        end
        if tk >= (t_pre + 0.050) % 50 ms breaker 52-1 opens
            Trip_52_1(k) = 1;
        end
    else
        % Post-fault: Phase A cleared (Breaker 52-1 opened)
        Va(k) = 0;
        Vb(k) = V_pk * sin(2*pi*f0*tk - 2*pi/3);
        Vc(k) = V_pk * sin(2*pi*f0*tk + 2*pi/3);
        Ia(k) = 0;
        Ib(k) = 0.8 * I_norm_pk * sin(2*pi*f0*tk - 2*pi/3 - deg2rad(20));
        Ic(k) = 0.8 * I_norm_pk * sin(2*pi*f0*tk + 2*pi/3 - deg2rad(20));
        Trip_87T(k) = 1;
        Trip_52_1(k) = 1;
    end
end

%% 2. Write IEEE C37.111 COMTRADE Configuration File (.CFG)
cfg_file = fullfile(output_dir, [filename_base, '.cfg']);
fid_cfg = fopen(cfg_file, 'w');

fprintf(fid_cfg, 'SUBSTATION_132_13_8KV,TR1_PROTECTION_IED,2013\r\n');
fprintf(fid_cfg, '8,6A,2D\r\n'); % 8 Total channels: 6 Analog, 2 Digital

% Analog Channel Definitions
% format: n,name,ph,ccbm,uu,a,b,skew,min,max,primary,secondary,p_or_s
fprintf(fid_cfg, '1,BUS_A_VA,A,132kV_BUS,V,1.0,0.0,0,-150000,150000,132000,110,P\r\n');
fprintf(fid_cfg, '2,BUS_A_VB,B,132kV_BUS,V,1.0,0.0,0,-150000,150000,132000,110,P\r\n');
fprintf(fid_cfg, '3,BUS_A_VC,C,132kV_BUS,V,1.0,0.0,0,-150000,150000,132000,110,P\r\n');
fprintf(fid_cfg, '4,TR1_PRIM_IA,A,BAY_01,A,1.0,0.0,0,-10000,10000,300,1,P\r\n');
fprintf(fid_cfg, '5,TR1_PRIM_IB,B,BAY_01,A,1.0,0.0,0,-10000,10000,300,1,P\r\n');
fprintf(fid_cfg, '6,TR1_PRIM_IC,C,BAY_01,A,1.0,0.0,0,-10000,10000,300,1,P\r\n');

% Digital Status Channel Definitions
% format: n,name,ph,ccbm,normal_state
fprintf(fid_cfg, '1,ANSI_87T_TRIP,,,0\r\n');
fprintf(fid_cfg, '2,CB_52_1_STATUS,,,0\r\n');

% Nominal Frequency & Sample Rate Information
fprintf(fid_cfg, '50.0\r\n');
fprintf(fid_cfg, '1\r\n'); % 1 sampling rate
fprintf(fid_cfg, '%.0f,%d\r\n', Fs, N_samples);

% Timestamps
fprintf(fid_cfg, '19/08/2026,22:15:00.000000\r\n');
fprintf(fid_cfg, '19/08/2026,22:15:00.200000\r\n');
fprintf(fid_cfg, 'ASCII\r\n');
fprintf(fid_cfg, '1.0\r\n');
fclose(fid_cfg);

%% 3. Write IEEE C37.111 COMTRADE Sample Data File (.DAT)
dat_file = fullfile(output_dir, [filename_base, '.dat']);
fid_dat = fopen(dat_file, 'w');

for n = 1:N_samples
    time_us = round(t(n) * 1e6);
    fprintf(fid_dat, '%d,%d,%.1f,%.1f,%.1f,%.2f,%.2f,%.2f,%d,%d\r\n', ...
        n, time_us, Va(n), Vb(n), Vc(n), Ia(n), Ib(n), Ic(n), Trip_87T(n), Trip_52_1(n));
end
fclose(fid_dat);

fprintf('COMTRADE files successfully generated:\n  [CFG] %s\n  [DAT] %s\n', cfg_file, dat_file);

end
