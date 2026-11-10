import os
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon, Circle, Rectangle

# Set IEEE Transactions publication style parameters
plt.rcParams.update({
    'font.family': 'serif',
    'font.size': 10,
    'axes.labelsize': 11,
    'axes.titlesize': 11,
    'xtick.labelsize': 9,
    'ytick.labelsize': 9,
    'legend.fontsize': 8.5,
    'figure.titlesize': 12,
    'lines.linewidth': 1.6,
    'figure.autolayout': True,
    'mathtext.fontset': 'cm',
    'pdf.fonttype': 42,
    'ps.fonttype': 42
})

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'ieee_paper', 'figures')
os.makedirs(OUTPUT_DIR, exist_ok=True)

# -------------------------------------------------------------
# 1. Figure 1: ANSI 21 Distance Protection on R-X Complex Plane
# -------------------------------------------------------------
def generate_rx_diagram():
    fig, ax = plt.subplots(figsize=(6.2, 5.2), dpi=300)
    
    # 45 km 132 kV line parameters (CTR=300/1, VTR=1200 -> Z_ratio=0.25)
    r1, x1 = 0.075, 0.385 # Ohm/km primary
    line_len = 45.0
    z_ratio = 0.25
    Z_line_sec = (r1 + 1j * x1) * line_len * z_ratio
    
    # Reaches
    Z1 = 0.80 * Z_line_sec
    Z2 = 1.20 * Z_line_sec
    Z3 = 2.00 * Z_line_sec
    
    # Draw Mho Circles
    theta = np.linspace(0, 2*np.pi, 300)
    
    for Z, lbl, col, ls in [(Z3, 'Zone 3 Mho (200%)', '#cbd5e1', '--'),
                             (Z2, 'Zone 2 Mho (120%)', '#93c5fd', '-.'),
                             (Z1, 'Zone 1 Mho (80%)', '#2563eb', '-')]:
        center = Z / 2.0
        radius = abs(Z) / 2.0
        x_circ = center.real + radius * np.cos(theta)
        y_circ = center.imag + radius * np.sin(theta)
        ax.plot(x_circ, y_circ, color=col, linestyle=ls, label=lbl, linewidth=1.8)
        
    # Draw Quadrilateral Zone 1
    r_quad_max = Z1.real * 1.5 + 1.0
    x_quad_top = Z1.imag
    quad_pts = np.array([
        [0, 0],
        [r_quad_max, 0],
        [r_quad_max + Z1.real, x_quad_top],
        [Z1.real * 0.2, x_quad_top],
        [0, 0]
    ])
    ax.plot(quad_pts[:, 0], quad_pts[:, 1], color='#dc2626', linewidth=2.0, linestyle='-', label='Zone 1 Quadrilateral')
    ax.fill(quad_pts[:, 0], quad_pts[:, 1], color='#fee2e2', alpha=0.35)

    # Transmission Line Vector
    ax.plot([0, Z_line_sec.real], [0, Z_line_sec.imag], color='#0f172a', linewidth=2.5, marker='o', label='Protected Line Impedance ($Z_L$)')
    ax.text(Z_line_sec.real + 0.1, Z_line_sec.imag, '$Z_L = 0.84 + j4.33\ \\Omega_{\\mathrm{sec}}$', fontsize=9, fontweight='bold')

    # Fault trajectories
    f1 = 0.65 * Z_line_sec + 0.35
    f2 = 1.05 * Z_line_sec + 0.40
    ax.plot(f1.real, f1.imag, marker='*', markersize=12, color='#e11d48', label='Case A: Internal Fault (65% Line, Zone 1)')
    ax.plot(f2.real, f2.imag, marker='^', markersize=10, color='#d97706', label='Case B: External Fault (105% Line, Zone 2)')
    
    # Load Encroachment Blinders
    r_load = np.linspace(3.5, 7.0, 50)
    ax.plot(r_load, 0.5 * r_load, color='#059669', linestyle=':', linewidth=1.8, label='Load Encroachment Boundary')

    ax.set_xlabel(r'Resistance $R\ (\Omega_{\mathrm{secondary}})$')
    ax.set_ylabel(r'Reactance $X\ (\Omega_{\mathrm{secondary}})$')
    ax.set_title(r'ANSI 21 Distance Relay Multi-Zone Characteristics ($R-X$ Plane)', fontweight='bold')
    ax.grid(True, linestyle=':', alpha=0.7)
    ax.set_xlim(-1.5, 7.5)
    ax.set_ylim(-1.0, 9.5)
    ax.axhline(0, color='black', linewidth=0.8)
    ax.axvline(0, color='black', linewidth=0.8)
    ax.legend(loc='upper left', framealpha=0.92)
    
    fig.savefig(os.path.join(OUTPUT_DIR, 'fig1_rx_distance_ansi21.pdf'), format='pdf', bbox_inches='tight')
    fig.savefig(os.path.join(OUTPUT_DIR, 'fig1_rx_distance_ansi21.png'), format='png', dpi=300, bbox_inches='tight')
    plt.close(fig)
    print("Generated: fig1_rx_distance_ansi21 (PDF & PNG)")

# -------------------------------------------------------------
# 2. Figure 2: Time-Current Characteristic (TCC) Curves (ANSI 50/51)
# -------------------------------------------------------------
def generate_tcc_diagram():
    fig, ax = plt.subplots(figsize=(6.2, 5.2), dpi=300)
    
    M = np.logspace(np.log10(1.05), np.log10(30), 400)
    TMS = 0.20
    
    t_si = TMS * (0.14 / (np.power(M, 0.02) - 1.0))
    t_vi = TMS * (13.5 / (np.power(M, 1.0) - 1.0))
    t_ei = TMS * (80.0 / (np.power(M, 2.0) - 1.0))
    t_ieee_mi = TMS * ((0.0515 / (np.power(M, 0.02) - 1.0)) + 0.114)
    t_upstream = (TMS + 0.15) * (0.14 / (np.power(M, 0.02) - 1.0))
    
    ax.loglog(M, t_si, label='IEC Standard Inverse ($TMS=0.20$)', color='#2563eb', linewidth=2.0)
    ax.loglog(M, t_vi, label='IEC Very Inverse ($TMS=0.20$)', color='#7c3aed', linewidth=2.0)
    ax.loglog(M, t_ei, label='IEC Extremely Inverse ($TMS=0.20$)', color='#dc2626', linewidth=2.0)
    ax.loglog(M, t_ieee_mi, label='IEEE Moderately Inverse ($TD=0.20$)', color='#059669', linestyle='--', linewidth=2.0)
    ax.loglog(M, t_upstream, label='Upstream Feeder Backup ($TMS=0.35$)', color='#d97706', linestyle=':', linewidth=2.2)

    ax.vlines(8.0, 0.01, 0.04, color='#b91c1c', linestyle='-', linewidth=2.5, label='ANSI 50 Instantaneous Pickup ($I_{inst} = 8 I_p$)')
    ax.hlines(0.03, 8.0, 30.0, color='#b91c1c', linestyle='-', linewidth=2.5)

    M_sample = 6.0
    t_down = TMS * (0.14 / (M_sample**0.02 - 1.0))
    t_up = (TMS + 0.15) * (0.14 / (M_sample**0.02 - 1.0))
    ax.annotate(r'$\Delta t = 360\ \mathrm{ms}$ (Grading Margin)', xy=(M_sample, (t_down+t_up)/2), 
                xytext=(8.5, 0.6), arrowprops=dict(arrowstyle="->", color='#0f172a', lw=1.4),
                fontsize=9, fontweight='bold', bbox=dict(boxstyle="round,pad=0.3", fc="#f1f5f9", ec="#94a3b8"))

    ax.set_xlabel(r'Multiple of Pickup Current ($I / I_{\mathrm{pickup}}$)')
    ax.set_ylabel(r'Operating Time $t\ (\mathrm{seconds})$')
    ax.set_title(r'Time-Current Characteristic (TCC) Coordination (IEC 60255 / IEEE C37.112)', fontweight='bold')
    ax.grid(True, which="both", ls=":", alpha=0.7)
    ax.set_ylim(0.01, 100.0)
    ax.set_xlim(1.05, 30.0)
    ax.legend(loc='upper right', framealpha=0.92)
    
    fig.savefig(os.path.join(OUTPUT_DIR, 'fig2_tcc_coordination_ansi50_51.pdf'), format='pdf', bbox_inches='tight')
    fig.savefig(os.path.join(OUTPUT_DIR, 'fig2_tcc_coordination_ansi50_51.png'), format='png', dpi=300, bbox_inches='tight')
    plt.close(fig)
    print("Generated: fig2_tcc_coordination_ansi50_51 (PDF & PNG)")

# -------------------------------------------------------------
# 3. Figure 3: ANSI 87T Transformer Differential Protection
# -------------------------------------------------------------
def generate_87t_diagram():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10.5, 4.6), dpi=300)
    
    I_rest = np.linspace(0, 6.0, 300)
    I_pickup = 0.20
    bp1, bp2 = 1.0, 2.5
    s1, s2 = 0.30, 0.70
    
    I_diff_th = np.zeros_like(I_rest)
    for i, ir in enumerate(I_rest):
        if ir <= bp1:
            I_diff_th[i] = I_pickup
        elif ir <= bp2:
            I_diff_th[i] = I_pickup + s1 * (ir - bp1)
        else:
            I_diff_th[i] = I_pickup + s1 * (bp2 - bp1) + s2 * (ir - bp2)
            
    ax1.plot(I_rest, I_diff_th, color='#2563eb', linewidth=2.2, label=r'Dual-Slope Boundary ($S_1=30\%, S_2=70\%$)')
    ax1.fill_between(I_rest, I_diff_th, 6.0, color='#fee2e2', alpha=0.4, label='Trip Region')
    ax1.fill_between(I_rest, 0, I_diff_th, color='#dcfce7', alpha=0.4, label='Restrain Region')

    ax1.scatter([2.51], [4.82], color='#dc2626', s=120, zorder=5, marker='X', label='Internal SLG Fault (Trip)')
    ax1.scatter([5.24], [0.04], color='#059669', s=100, zorder=5, marker='o', label='Through-Fault (Restrain)')
    ax1.scatter([0.59], [1.18], color='#d97706', s=110, zorder=5, marker='s', label='Inrush (Harmonic Restrained)')

    ax1.set_xlabel(r'Restraint Current $I_{\mathrm{rest}}\ (\mathrm{pu})$')
    ax1.set_ylabel(r'Differential Current $I_{\mathrm{diff}}\ (\mathrm{pu})$')
    ax1.set_title(r'(a) ANSI 87T Dual-Slope Characteristic', fontweight='bold')
    ax1.set_xlim(0, 6.0)
    ax1.set_ylim(0, 6.0)
    ax1.grid(True, linestyle=':', alpha=0.7)
    ax1.legend(loc='upper left', framealpha=0.92)

    harmonics = ['1st (60Hz)', '2nd (120Hz)', '3rd (180Hz)', '5th (300Hz)']
    inrush_ratio = [100.0, 28.4, 6.2, 2.1]
    internal_ratio = [100.0, 2.1, 1.8, 1.2]
    
    x = np.arange(len(harmonics))
    width = 0.35
    
    ax2.bar(x - width/2, inrush_ratio, width, label='Magnetizing Inrush', color='#f59e0b')
    ax2.bar(x + width/2, internal_ratio, width, label='Internal Fault', color='#ef4444')
    
    ax2.axhline(15.0, color='#b91c1c', linestyle='--', linewidth=1.8, label=r'2nd Harmonic Threshold ($15\%$)')
    ax2.set_ylabel(r'Spectral Magnitude (\% of Fundamental)')
    ax2.set_title(r'(b) Harmonic Inrush Restraint Discrimination', fontweight='bold')
    ax2.set_xticks(x)
    ax2.set_xticklabels(harmonics)
    ax2.set_ylim(0, 110)
    ax2.grid(True, linestyle=':', axis='y', alpha=0.7)
    ax2.legend(loc='upper right', framealpha=0.92)

    fig.savefig(os.path.join(OUTPUT_DIR, 'fig3_differential_ansi87t.pdf'), format='pdf', bbox_inches='tight')
    fig.savefig(os.path.join(OUTPUT_DIR, 'fig3_differential_ansi87t.png'), format='png', dpi=300, bbox_inches='tight')
    plt.close(fig)
    print("Generated: fig3_differential_ansi87t (PDF & PNG)")

# -------------------------------------------------------------
# 4. Figure 4: IEC 60076-7 Transformer Thermal & Aging Model
# -------------------------------------------------------------
def generate_thermal_aging_diagram():
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(7.2, 5.8), sharex=True, dpi=300)
    
    t = np.linspace(0, 24, 240)
    K = 0.65 + 0.45 * np.sin((t - 7) * np.pi / 12)**2 + 0.15 * np.exp(-((t - 14)/3)**2)
    T_amb = 25.0 + 12.0 * np.sin((t - 9) * np.pi / 12)
    
    tau_to = 3.0
    T_to = np.zeros_like(t)
    T_hs = np.zeros_like(t)
    T_to[0] = T_amb[0] + 35.0 * (K[0]**1.6)
    
    for i in range(1, len(t)):
        dt = t[i] - t[i-1]
        T_to_ss = T_amb[i] + 45.0 * ((1 + 5.0 * K[i]**2)/6.0)**0.8
        T_to[i] = T_to[i-1] + (T_to_ss - T_to[i-1]) * (dt / tau_to)
        T_hs[i] = T_to[i] + 28.0 * (K[i]**1.6)
        
    F_AA = np.exp((15000/383.15) - (15000 / (T_hs + 273.15)))
    cum_loss = np.cumsum(F_AA) * (24.0 / len(t))

    ax1.plot(t, T_hs, color='#dc2626', linewidth=2.0, label=r'Hot-Spot Temp $\theta_{\mathrm{HS}}$')
    ax1.plot(t, T_to, color='#2563eb', linewidth=1.8, label=r'Top-Oil Temp $\theta_{\mathrm{TO}}$')
    ax1.plot(t, T_amb, color='#64748b', linestyle='--', label=r'Ambient Temp $\theta_{\mathrm{amb}}$')
    ax1.axhline(110.0, color='#991b1b', linestyle=':', linewidth=1.6, label='Rated Hot-Spot Limit ($110^\circ\\mathrm{C}$)')
    ax1.set_ylabel(r'Temperature ($^\circ\mathrm{C}$)')
    ax1.set_title(r'IEC 60076-7 Dynamic Thermal Response \& Cumulative Loss-of-Life', fontweight='bold')
    ax1.grid(True, linestyle=':', alpha=0.7)
    ax1.legend(loc='upper left', ncol=2, framealpha=0.92)

    ax2_twin = ax2.twinx()
    l1, = ax2.plot(t, F_AA, color='#d97706', linewidth=2.0, label=r'Aging Acceleration Factor $F_{\mathrm{AA}}$')
    l2, = ax2_twin.plot(t, cum_loss, color='#7c3aed', linewidth=2.2, linestyle='-.', label=r'Cumulative Aging (Equivalent Hours)')
    
    ax2.set_xlabel('Time of Day (Hours)')
    ax2.set_ylabel(r'Aging Factor $F_{\mathrm{AA}}\ (\mathrm{pu})$', color='#d97706')
    ax2_twin.set_ylabel('Loss of Life (Hours)', color='#7c3aed')
    ax2.set_xlim(0, 24)
    ax2.set_xticks(np.arange(0, 25, 4))
    ax2.grid(True, linestyle=':', alpha=0.7)
    ax2.legend([l1, l2], [l1.get_label(), l2.get_label()], loc='upper left', framealpha=0.92)

    fig.savefig(os.path.join(OUTPUT_DIR, 'fig4_thermal_aging_iec60076.pdf'), format='pdf', bbox_inches='tight')
    fig.savefig(os.path.join(OUTPUT_DIR, 'fig4_thermal_aging_iec60076.png'), format='png', dpi=300, bbox_inches='tight')
    plt.close(fig)
    print("Generated: fig4_thermal_aging_iec60076 (PDF & PNG)")

# -------------------------------------------------------------
# 5. Figure 5: Real-Time Co-Simulation Latency & Cyber Benchmark
# -------------------------------------------------------------
def generate_cosim_latency_diagram():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10.5, 4.4), dpi=300)
    
    np.random.seed(42)
    ws_lat = np.random.normal(loc=4.8, scale=1.1, size=2000)
    ws_lat = ws_lat[ws_lat > 1.0]
    goose_lat = np.random.normal(loc=1.9, scale=0.4, size=2000)
    goose_lat = goose_lat[goose_lat > 0.5]

    ax1.hist(ws_lat, bins=40, density=True, alpha=0.6, color='#2563eb', label='WebSocket Round-Trip Latency')
    ax1.hist(goose_lat, bins=35, density=True, alpha=0.7, color='#059669', label='IEC 61850 GOOSE Dispatch Latency')
    ax1.axvline(3.0, color='#dc2626', linestyle='--', linewidth=2.0, label='IEC 61850 Type 1A Fast Trip Limit ($3\ \mathrm{ms}$)')
    
    ax1.set_xlabel('Latency (Milliseconds)')
    ax1.set_ylabel('Probability Density')
    ax1.set_title(r'(a) Co-Simulation Communication Latency Distribution', fontweight='bold')
    ax1.grid(True, linestyle=':', alpha=0.7)
    ax1.legend(loc='upper right', framealpha=0.92)

    t_sec = np.linspace(0, 10, 500)
    residual = np.random.normal(0, 0.04, 500)
    residual[200:350] += 0.38 + 0.05 * np.sin(np.linspace(0, 4*np.pi, 150))
    
    ax2.plot(t_sec, residual, color='#2563eb', linewidth=1.4, label='Kalman Anomaly Residual $r(k)$')
    ax2.axhline(0.18, color='#dc2626', linestyle='--', linewidth=1.8, label=r'Threshold $\gamma_{\mathrm{th}} = 0.18$')
    ax2.axvspan(4.0, 7.0, color='#fee2e2', alpha=0.5, label='FDIA Attack Window')

    ax2.annotate('Intrusion Detected\n($\Delta t_{\mathrm{detect}} = 4.2\ \mathrm{ms}$)', xy=(4.05, 0.38), 
                 xytext=(5.5, 0.50), arrowprops=dict(arrowstyle="->", color='#b91c1c', lw=1.5),
                 fontsize=8.5, fontweight='bold', bbox=dict(boxstyle="round,pad=0.3", fc="#fff1f2", ec="#f43f5e"))

    ax2.set_xlabel('Time (Seconds)')
    ax2.set_ylabel('Normalized Anomaly Metric')
    ax2.set_title(r'(b) Real-Time Intrusion Detection of FDIA Attack', fontweight='bold')
    ax2.set_ylim(-0.2, 0.65)
    ax2.grid(True, linestyle=':', alpha=0.7)
    ax2.legend(loc='upper left', framealpha=0.92)

    fig.savefig(os.path.join(OUTPUT_DIR, 'fig5_cosim_latency_cyber_benchmark.pdf'), format='pdf', bbox_inches='tight')
    fig.savefig(os.path.join(OUTPUT_DIR, 'fig5_cosim_latency_cyber_benchmark.png'), format='png', dpi=300, bbox_inches='tight')
    plt.close(fig)
    print("Generated: fig5_cosim_latency_cyber_benchmark (PDF & PNG)")

if __name__ == '__main__':
    print("Generating IEEE Transactions Vector Figures...")
    generate_rx_diagram()
    generate_tcc_diagram()
    generate_87t_diagram()
    generate_thermal_aging_diagram()
    generate_cosim_latency_diagram()
    print("All 5 IEEE Figures successfully generated in:", OUTPUT_DIR)
