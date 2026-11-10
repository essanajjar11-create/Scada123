function substation_scada_dashboard()
% SUBSTATION_SCADA_DASHBOARD Interactive MATLAB Graphical User Interface (HMI)
% for the 132/13.8 kV Substation Automation System & Digital Twin.
%
% Features:
% - Interactive Single Line Diagram (SLD) status
% - Circuit Breaker (52-0, 52-1, 52-2, 52-6) switching controls
% - Fault injection simulator (SLG, Inrush, Overheating)
% - Real-time active telemetry gauges (Voltage, Current, Frequency, Power, Tap)
% - Live ISA-18.2 Alarm & SOE event log display

%% 1. Configure Path & Create Main GUI Figure
curr_dir = fileparts(mfilename('fullpath'));
addpath(genpath(fullfile(curr_dir, '..')));

hFig = figure('Name', 'SCADA & SAS 132/13.8 kV Digital Twin HMI Dashboard', ...
    'NumberTitle', 'off', 'Color', [0.08, 0.10, 0.14], ... % Dark theme #141a24
    'Position', [100, 80, 1100, 720], 'MenuBar', 'none', 'Resize', 'on');

params = substation_parameters();

%% 2. UI State Variables
state.tr1_kv = 132.0;
state.tr1_lv_kv = 13.82;
state.grid_freq = 50.00;
state.load_mw = 28.0;
state.bess_soc = 72.0;
state.solar_mw = 4.2;
state.tap_pos = 9;
state.cb_52_0 = 'CLOSED';
state.cb_52_1 = 'CLOSED';
state.cb_52_2 = 'CLOSED';
state.cb_52_6 = 'CLOSED';
state.active_alarm = 'SYSTEM NORMAL - ALL GATES ARMED';

%% 3. Header Banner
uicontrol(hFig, 'Style', 'text', 'String', '132/13.8 kV SUBSTATION SCADA & SAS DIGITAL TWIN DASHBOARD', ...
    'Units', 'normalized', 'Position', [0.02, 0.93, 0.96, 0.05], ...
    'BackgroundColor', [0.04, 0.06, 0.09], 'ForegroundColor', [0.0, 0.94, 1.0], ...
    'FontSize', 14, 'FontWeight', 'bold');

%% 4. Left Panel: Telemetry Gauges & Meters
hPanelTel = uipanel(hFig, 'Title', 'Live Telemetry & Meters', 'FontSize', 11, 'FontWeight', 'bold', ...
    'BackgroundColor', [0.12, 0.15, 0.20], 'ForegroundColor', [0.8, 0.9, 1.0], ...
    'Units', 'normalized', 'Position', [0.02, 0.40, 0.32, 0.51]);

hTxtV132 = uicontrol(hPanelTel, 'Style', 'text', 'String', sprintf('132 kV Bus Voltage:  %.2f kV', state.tr1_kv), ...
    'Units', 'normalized', 'Position', [0.05, 0.82, 0.90, 0.12], ...
    'BackgroundColor', [0.15, 0.18, 0.25], 'ForegroundColor', [1.0, 0.8, 0.2], 'FontSize', 11, 'FontWeight', 'bold');

hTxtV138 = uicontrol(hPanelTel, 'Style', 'text', 'String', sprintf('13.8 kV Bus Voltage: %.2f kV', state.tr1_lv_kv), ...
    'Units', 'normalized', 'Position', [0.05, 0.68, 0.90, 0.12], ...
    'BackgroundColor', [0.15, 0.18, 0.25], 'ForegroundColor', [0.2, 0.9, 0.4], 'FontSize', 11, 'FontWeight', 'bold');

hTxtFreq = uicontrol(hPanelTel, 'Style', 'text', 'String', sprintf('Grid Frequency:      %.2f Hz', state.grid_freq), ...
    'Units', 'normalized', 'Position', [0.05, 0.54, 0.90, 0.12], ...
    'BackgroundColor', [0.15, 0.18, 0.25], 'ForegroundColor', [0.0, 0.9, 1.0], 'FontSize', 11, 'FontWeight', 'bold');

hTxtPtot = uicontrol(hPanelTel, 'Style', 'text', 'String', sprintf('Substation Demand:   %.1f MW', state.load_mw), ...
    'Units', 'normalized', 'Position', [0.05, 0.40, 0.90, 0.12], ...
    'BackgroundColor', [0.15, 0.18, 0.25], 'ForegroundColor', [1.0, 0.9, 0.9], 'FontSize', 11, 'FontWeight', 'bold');

hTxtSolar = uicontrol(hPanelTel, 'Style', 'text', 'String', sprintf('Solar PV Generation: %.1f MW', state.solar_mw), ...
    'Units', 'normalized', 'Position', [0.05, 0.26, 0.90, 0.12], ...
    'BackgroundColor', [0.15, 0.18, 0.25], 'ForegroundColor', [1.0, 0.6, 0.0], 'FontSize', 11, 'FontWeight', 'bold');

hTxtBess = uicontrol(hPanelTel, 'Style', 'text', 'String', sprintf('BESS Energy (SoC):   %.1f%%', state.bess_soc), ...
    'Units', 'normalized', 'Position', [0.05, 0.12, 0.90, 0.12], ...
    'BackgroundColor', [0.15, 0.18, 0.25], 'ForegroundColor', [0.4, 0.8, 1.0], 'FontSize', 11, 'FontWeight', 'bold');

%% 5. Center Panel: Single Line Diagram Visualizer
hPanelSld = uipanel(hFig, 'Title', 'Interactive Single Line Diagram (SLD)', 'FontSize', 11, 'FontWeight', 'bold', ...
    'BackgroundColor', [0.12, 0.15, 0.20], 'ForegroundColor', [0.8, 0.9, 1.0], ...
    'Units', 'normalized', 'Position', [0.36, 0.40, 0.62, 0.51]);

hAxSld = axes('Parent', hPanelSld, 'Position', [0.05, 0.08, 0.90, 0.85], 'Color', [0.05, 0.07, 0.10]);
draw_sld_diagram(hAxSld, state);

%% 6. Lower-Left Panel: Breaker Controls & OLTC Tap
hPanelCtrl = uipanel(hFig, 'Title', 'Supervisory Switchgear & OLTC Controls', 'FontSize', 11, 'FontWeight', 'bold', ...
    'BackgroundColor', [0.12, 0.15, 0.20], 'ForegroundColor', [0.8, 0.9, 1.0], ...
    'Units', 'normalized', 'Position', [0.02, 0.03, 0.45, 0.35]);

uicontrol(hPanelCtrl, 'Style', 'pushbutton', 'String', 'Toggle Coupler 52-0', ...
    'Units', 'normalized', 'Position', [0.05, 0.68, 0.42, 0.25], ...
    'BackgroundColor', [0.2, 0.4, 0.6], 'ForegroundColor', 'w', 'FontWeight', 'bold', ...
    'Callback', @(~,~) toggle_cb('52-0'));

uicontrol(hPanelCtrl, 'Style', 'pushbutton', 'String', 'Toggle Incomer 52-1', ...
    'Units', 'normalized', 'Position', [0.52, 0.68, 0.42, 0.25], ...
    'BackgroundColor', [0.2, 0.4, 0.6], 'ForegroundColor', 'w', 'FontWeight', 'bold', ...
    'Callback', @(~,~) toggle_cb('52-1'));

uicontrol(hPanelCtrl, 'Style', 'pushbutton', 'String', 'Tap RAISE (OLTC +)', ...
    'Units', 'normalized', 'Position', [0.05, 0.36, 0.42, 0.25], ...
    'BackgroundColor', [0.2, 0.5, 0.3], 'ForegroundColor', 'w', 'FontWeight', 'bold', ...
    'Callback', @(~,~) change_tap(+1));

uicontrol(hPanelCtrl, 'Style', 'pushbutton', 'String', 'Tap LOWER (OLTC -)', ...
    'Units', 'normalized', 'Position', [0.52, 0.36, 0.42, 0.25], ...
    'BackgroundColor', [0.5, 0.3, 0.2], 'ForegroundColor', 'w', 'FontWeight', 'bold', ...
    'Callback', @(~,~) change_tap(-1));

uicontrol(hPanelCtrl, 'Style', 'pushbutton', 'String', 'Run Master Simulation Suite', ...
    'Units', 'normalized', 'Position', [0.05, 0.06, 0.89, 0.24], ...
    'BackgroundColor', [0.0, 0.6, 0.8], 'ForegroundColor', 'w', 'FontSize', 11, 'FontWeight', 'bold', ...
    'Callback', @(~,~) main_substation_simulation());

%% 7. Lower-Right Panel: Fault Injection & Alarm Log
hPanelFault = uipanel(hFig, 'Title', 'Fault Injector & ISA-18.2 Alarm Banner', 'FontSize', 11, 'FontWeight', 'bold', ...
    'BackgroundColor', [0.12, 0.15, 0.20], 'ForegroundColor', [0.8, 0.9, 1.0], ...
    'Units', 'normalized', 'Position', [0.49, 0.03, 0.49, 0.35]);

uicontrol(hPanelFault, 'Style', 'text', 'String', 'Inject Substation Disturbance:', ...
    'Units', 'normalized', 'Position', [0.05, 0.78, 0.45, 0.15], ...
    'BackgroundColor', [0.12, 0.15, 0.20], 'ForegroundColor', 'w', 'FontWeight', 'bold');

hPopup = uicontrol(hPanelFault, 'Style', 'popupmenu', ...
    'String', {'None (Normal)', '132kV SLG Phase-A Fault', 'TR-1 Magnetizing Inrush', 'DGA Thermal T2 Overheating'}, ...
    'Units', 'normalized', 'Position', [0.52, 0.76, 0.43, 0.18], ...
    'Callback', @on_fault_select);

hAlarmBox = uicontrol(hPanelFault, 'Style', 'edit', 'Max', 4, 'Min', 0, ...
    'String', {'[22:15:00] ISA-18.2: SYSTEM ONLINE - SUBSTATION 132/13.8kV ARMED', ...
               '[22:15:01] ANSI 87T, 21, 25 RELAYS: READY', ...
               '[22:15:02] TELEMETRY SYNC: NORMAL (0.0 ms LATENCY)'}, ...
    'Units', 'normalized', 'Position', [0.05, 0.08, 0.90, 0.62], ...
    'BackgroundColor', [0.06, 0.08, 0.10], 'ForegroundColor', [0.0, 1.0, 0.6], ...
    'FontName', 'Courier', 'FontSize', 9, 'HorizontalAlignment', 'left');

%% Nested Callback Functions
    function toggle_cb(cb_id)
        switch cb_id
            case '52-0'
                if strcmp(state.cb_52_0, 'CLOSED'), state.cb_52_0 = 'OPEN'; else, state.cb_52_0 = 'CLOSED'; end
            case '52-1'
                if strcmp(state.cb_52_1, 'CLOSED'), state.cb_52_1 = 'OPEN'; else, state.cb_52_1 = 'CLOSED'; end
        end
        add_log(sprintf('Operator toggled Breaker %s -> %s', cb_id, eval(['state.cb_' strrep(cb_id, '-', '_')])));
        draw_sld_diagram(hAxSld, state);
    end

    function change_tap(dir)
        state.tap_pos = max(1, min(17, state.tap_pos + dir));
        state.tr1_lv_kv = 13.8 * (1 + (state.tap_pos - 9) * 0.0125);
        set(hTxtV138, 'String', sprintf('13.8 kV Bus Voltage: %.2f kV (Tap %d)', state.tr1_lv_kv, state.tap_pos));
        add_log(sprintf('OLTC Tap Step changed to %d (LV Voltage = %.2f kV)', state.tap_pos, state.tr1_lv_kv));
    end

    function on_fault_select(src, ~)
        val = src.Value;
        switch val
            case 2 % SLG
                add_log('[ALARM CRITICAL] Phase-A Ground Fault Injected on 132kV Bus! ANSI 87T Trip Signal Active');
                state.cb_52_1 = 'OPEN';
                draw_sld_diagram(hAxSld, state);
                protection_ansi87t([3850, 175, 175], [200, 1670, 1670], 'INTERNAL_SLG');
            case 3 % Inrush
                add_log('[EVENT INFO] Transformer Energization Inrush Detected (2nd Harmonic Restraint OK)');
                protection_ansi87t([950, 175, 175], [0, 0, 0], 'INRUSH');
            case 4 % DGA
                add_log('[ALARM MAJOR] Dissolved Gas Overheating Detected: CH4=145, C2H4=260, C2H2=18 ppm');
                dga_duval_triangle(145, 260, 18);
        end
    end

    function add_log(msg)
        curr_str = get(hAlarmBox, 'String');
        if ischar(curr_str), curr_str = {curr_str}; end
        new_str = [curr_str; {sprintf('[%s] %s', datestr(now, 'HH:MM:SS'), msg)}];
        if length(new_str) > 8, new_str = new_str(end-7:end); end
        set(hAlarmBox, 'String', new_str);
    end

end

function draw_sld_diagram(ax, state)
% Draws Single Line Diagram inside axes
cla(ax); hold(ax, 'on'); box(ax, 'on');
ax.Color = [0.05, 0.07, 0.10];
ax.XColor = [0.4, 0.5, 0.6]; ax.YColor = [0.4, 0.5, 0.6];
xlim(ax, [0, 10]); ylim(ax, [0, 10]);

% 132 kV Bus A (Top Amber Line)
plot(ax, [1, 9], [8.5, 8.5], 'Color', [1.0, 0.75, 0.1], 'LineWidth', 4);
text(ax, 1.2, 8.8, '132 kV Busbar A', 'Color', [1.0, 0.85, 0.3], 'FontWeight', 'bold', 'FontSize', 10);

% 132 kV Bus B (Cyan Line)
plot(ax, [1, 9], [7.2, 7.2], 'Color', [0.0, 0.85, 1.0], 'LineWidth', 4);
text(ax, 1.2, 7.5, '132 kV Busbar B', 'Color', [0.2, 0.9, 1.0], 'FontWeight', 'bold', 'FontSize', 10);

% Bus Coupler 52-0
plot(ax, [8.0, 8.0], [7.2, 8.5], 'k--', 'LineWidth', 2);
draw_cb_symbol(ax, 8.0, 7.85, state.cb_52_0, '52-0');

% Transformer 1 (TR-1 40 MVA)
plot(ax, [3.5, 3.5], [7.2, 4.5], 'Color', [0.8, 0.8, 0.8], 'LineWidth', 2.5);
draw_cb_symbol(ax, 3.5, 6.2, state.cb_52_1, '52-1');
% Transformer dual circle symbol
theta = linspace(0, 2*pi, 40);
plot(ax, 3.5 + 0.4*cos(theta), 4.8 + 0.4*sin(theta), 'y-', 'LineWidth', 2);
plot(ax, 3.5 + 0.4*cos(theta), 4.3 + 0.4*sin(theta), 'g-', 'LineWidth', 2);
text(ax, 4.1, 4.55, 'TR-1 (40 MVA)', 'Color', 'w', 'FontWeight', 'bold', 'FontSize', 9);

% 13.8 kV MV Busbar 1 (Green Line)
plot(ax, [1, 9], [3.0, 3.0], 'Color', [0.1, 0.9, 0.4], 'LineWidth', 4);
text(ax, 1.2, 3.3, '13.8 kV Medium Voltage Bus 1', 'Color', [0.3, 1.0, 0.5], 'FontWeight', 'bold', 'FontSize', 10);

% Feeders
feeders = {'F-01 (Ind)', 'F-02 (Comm)', 'Solar (5MW)', 'BESS (10MW)'};
fx = [2.0, 4.0, 6.0, 8.0];
for i = 1:4
    plot(ax, [fx(i), fx(i)], [3.0, 1.5], 'Color', [0.8, 0.8, 0.8], 'LineWidth', 2);
    draw_cb_symbol(ax, fx(i), 2.2, 'CLOSED', sprintf('52-%d', i));
    text(ax, fx(i)-0.4, 1.1, feeders{i}, 'Color', [0.8, 0.9, 1.0], 'FontSize', 8, 'FontWeight', 'bold');
end

title(ax, 'Substation 132/13.8 kV Single Line Diagram & Topological Path Tracing', 'Color', 'w', 'FontSize', 11);
end

function draw_cb_symbol(ax, x, y, status, lbl)
if strcmp(status, 'CLOSED')
    face_col = [0.85, 0.1, 0.1]; % Red = Energized / Closed
    st_txt = 'CLOSED';
else
    face_col = [0.1, 0.8, 0.3]; % Green = Safe / Open
    st_txt = 'OPEN';
end
rectangle(ax, 'Position', [x-0.25, y-0.2, 0.5, 0.4], 'FaceColor', face_col, 'EdgeColor', 'w', 'LineWidth', 1.5);
text(ax, x+0.35, y, sprintf('%s (%s)', lbl, st_txt), 'Color', 'w', 'FontSize', 8, 'FontWeight', 'bold');
end
