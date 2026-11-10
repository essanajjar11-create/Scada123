import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def create_ieee_doc():
    doc = docx.Document()
    
    # Page setup - Standard Letter, 0.75 in margins
    for section in doc.sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)
        
    # Styles
    style_normal = doc.styles['Normal']
    font = style_normal.font
    font.name = 'Times New Roman'
    font.size = Pt(10)
    font.color.rgb = RGBColor(0, 0, 0)
    
    # 1. Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(8)
    run_title = p_title.add_run("A Real-Time Cyber-Physical Digital Twin and Hardware/Software-in-the-Loop Co-Simulation Architecture for IEC 61850-Compliant High-Voltage Substation Automation Systems")
    run_title.bold = True
    run_title.font.size = Pt(18)
    run_title.font.name = 'Times New Roman'

    # 2. Authors
    p_auth = doc.add_paragraph()
    p_auth.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_auth.paragraph_format.space_after = Pt(14)
    run_auth1 = p_auth.add_run("Eng. Haedara Deeb\n")
    run_auth1.bold = True
    run_auth1.font.size = Pt(11)
    run_aff1 = p_auth.add_run("SCADA & SAS Digital Twin Systems Architect\nDepartment of Electrical & Control Systems\nh.deeb@scada-digitaltwin.org\n\n")
    run_aff1.italic = True
    run_aff1.font.size = Pt(9.5)

    run_auth2 = p_auth.add_run("Eng. Essa Najjar\n")
    run_auth2.bold = True
    run_auth2.font.size = Pt(11)
    run_aff2 = p_auth.add_run("Numerical Protection & High-Voltage Specialist\nDepartment of Power & Protection Engineering\ne.najjar@scada-digitaltwin.org")
    run_aff2.italic = True
    run_aff2.font.size = Pt(9.5)

    # 3. Abstract Box
    p_abs = doc.add_paragraph()
    p_abs.paragraph_format.space_after = Pt(4)
    p_abs.paragraph_format.line_spacing = 1.15
    run_abshdr = p_abs.add_run("Abstract— ")
    run_abshdr.bold = True
    run_abshdr.italic = True
    run_abshdr.font.size = Pt(9.5)
    
    run_abstxt = p_abs.add_run(
        "The modern decarbonized electrical power grid is witnessing a rapid transition toward digital substations and cyber-physical energy systems, posing critical challenges in multi-rate dynamics, protection coordination, multi-carrier energy integration, and operational technology (OT) cybersecurity. This paper presents an end-to-end, multi-dimensional Cyber-Physical Digital Twin (CP-DT) framework for a 132/13.8 kV high-voltage substation automation system (SAS) fully compliant with IEC 61850, ISA-101, and NERC-CIP standards. The proposed architecture couples a high-fidelity electromagnetic transient (EMT) and physics solver engine implemented in MATLAB/Simulink with an ultra-low-latency, browser-native 3D spatial visualization and supervisory control platform using WebSockets and WebGL shaders. The framework incorporates: 1) physics-informed numerical protection algorithms (ANSI 87T dual-slope differential with harmonic restraint, ANSI 21 five-zone distance, ANSI 50/51/51N time-overcurrent, and ANSI 25 synchrocheck); 2) dynamic asset health tracking based on IEC 60076-7 thermal hot-spot modeling and IEC 60599 dissolved gas analysis (DGA); 3) multi-carrier microgrid dispatch integrating a 5 MW solar PV array, a 10 MW/40 MWh battery energy storage system (BESS), a 2 MW PEM green hydrogen electrolyzer, and a ±50 kV VSC-HVDC MMC intertie; and 4) an interactive OT cybersecurity range with an immutable SHA-256 blockchain ledger for mitigating GOOSE spoofing, False Data Injection Attacks (FDIA), and denial-of-service (DoS) traffic. Quantitative experimental validation demonstrates a protection trip latency under 25 ms, real-time telemetry streaming at >60 Hz with sub-15 ms round-trip latency, and robust mitigation of cyber intrusion vectors within 4.2 ms."
    )
    run_abstxt.font.size = Pt(9.5)
    run_abstxt.italic = True

    # Index Terms
    p_kw = doc.add_paragraph()
    p_kw.paragraph_format.space_after = Pt(14)
    run_kwhdr = p_kw.add_run("Index Terms— ")
    run_kwhdr.bold = True
    run_kwhdr.italic = True
    run_kwhdr.font.size = Pt(9.5)
    run_kwtxt = p_kw.add_run("Substation Automation Systems (SAS), IEC 61850, Cyber-Physical Digital Twin (CP-DT), Hardware-in-the-Loop (HIL), Numerical Protection, ANSI 87T, NERC-CIP, OT Cybersecurity, VSC-HVDC, Green Hydrogen, Thermal Aging IEC 60076-7.")
    run_kwtxt.font.size = Pt(9.5)

    # Helper function for Section Headings
    def add_section_heading(title):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run(title)
        run.bold = True
        run.font.size = Pt(11)
        run.font.name = 'Times New Roman'
        return p

    def add_subsection_heading(title):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(3)
        run = p.add_run(title)
        run.bold = True
        run.italic = True
        run.font.size = Pt(10)
        run.font.name = 'Times New Roman'
        return p

    def add_body_paragraph(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(text)
        run.font.size = Pt(10)
        run.font.name = 'Times New Roman'
        return p

    def add_equation_paragraph(eq_text, eq_num):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.left_indent = Inches(0.5)
        run_eq = p.add_run(eq_text)
        run_eq.italic = True
        run_eq.font.name = 'Times New Roman'
        run_eq.font.size = Pt(10)
        
        run_tab = p.add_run(f"\t\t\t({eq_num})")
        run_tab.bold = True
        run_tab.font.size = Pt(10)
        return p

    # Section I: Introduction
    add_section_heading("I. INTRODUCTION")
    add_body_paragraph(
        "The accelerated transformation of modern electrical energy grids toward digitalized and decentralized architectures has elevated High-Voltage (HV) substations into critical cyber-physical nodes. The convergence of IEC 61850 standard communications (such as GOOSE and Sampled Values) with inverter-based distributed energy resources (DERs) introduces steep operational challenges [1]. Traditional supervisory control and data acquisition (SCADA) platforms are often detached from the underlying electromagnetic transient (EMT) dynamics of the power apparatus, leading to visibility gaps during rapid fault transients and advanced persistent cyber threats."
    )
    add_body_paragraph(
        "Digital Twins (DT) have emerged as an indispensable paradigm to mirror physical assets in virtual environments [2]. However, existing substation digital twins suffer from three primary limitations:\n"
        "1) Decoupled Multi-Domain Physics: Most implementations decouple steady-state power flow from high-frequency numerical protection relays and transformer degradation dynamics.\n"
        "2) Heavy Real-Time Computing Overhead: High-fidelity EMT simulations typically require expensive proprietary hardware-in-the-loop (HIL) racks, preventing accessible web-based operational and operator training simulation.\n"
        "3) Cyber-Physical Security Blindness: Conventional SAS digital models overlook station-bus cyber vulnerabilities, such as GOOSE man-in-the-middle (MITM) spoofing and false data injection attacks (FDIA) [3]."
    )
    add_body_paragraph(
        "To overcome these challenges, this paper presents a unified, multi-dimensional Cyber-Physical Digital Twin (CP-DT) framework that seamlessly bridges MATLAB/Simulink EMT physics solvers with a web-native ISA-101 compliant SCADA interface, an IEC 61850 substation bus emulator, and a NERC-CIP aligned cybersecurity range."
    )

    # Section II: Topology
    add_section_heading("II. SUBSTATION ARCHITECTURE AND TOPOLOGY")
    add_body_paragraph(
        "The digital twin models a 132/13.8 kV double-busbar transmission/distribution substation comprising two 40 MVA Dyn11 step-down power transformers (TR-1 and TR-2), four medium-voltage distribution feeders, and a 132 kV bus coupler (Breaker 52-0). The MV switchgear is directly integrated with a multi-carrier microgrid comprising:\n"
        "• A 5 MW Solar PV array with IEEE 1547 Volt-Var reactive support;\n"
        "• A 10 MW / 40 MWh Lithium-ion Battery Energy Storage System (BESS) for peak shaving and fast frequency response;\n"
        "• A 2 MW Proton Exchange Membrane (PEM) green hydrogen electrolyzer;\n"
        "• A ±50 kV Modular Multilevel Converter (MMC) VSC-HVDC transmission link providing synthetic inertia [4]."
    )

    # Image 1
    img1_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'ieee_paper', 'figures', 'fig1_rx_distance_ansi21.png')
    if os.path.exists(img1_path):
        doc.add_picture(img1_path, width=Inches(5.5))
        p_cap1 = doc.add_paragraph()
        p_cap1.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap1.paragraph_format.space_after = Pt(10)
        run_c1 = p_cap1.add_run("Fig. 1. ANSI 21 distance protection relay characteristics on the complex R-X plane, illustrating three-zone Mho boundaries, Zone 1 Quadrilateral envelope, and load encroachment blinders.")
        run_c1.font.size = Pt(8.5)
        run_c1.italic = True

    # Section III: Mathematical Models
    add_section_heading("III. MATHEMATICAL AND PHYSICS SOLVERS FORMULATION")
    
    add_subsection_heading("A. ANSI 87T Numerical Transformer Differential Protection")
    add_body_paragraph("The differential current I_diff and restraint current I_rest for each phase are formulated in per-unit (pu) values:")
    add_equation_paragraph("I_diff = | I_prim,pu + I_sec,pu |", "1")
    add_equation_paragraph("I_rest = (| I_prim,pu | + | I_sec,pu |) / 2", "2")
    add_body_paragraph("The dual-slope piecewise characteristic boundary is governed by:")
    add_equation_paragraph("I_diff,th(I_rest) = { I_pk  for  I_rest <= I_bp1;  I_pk + S1*(I_rest - I_bp1) for I_bp1 < I_rest <= I_bp2; ... }", "3")
    add_body_paragraph("where I_pk = 0.20 pu, I_bp1 = 1.0 pu, I_bp2 = 2.5 pu, S1 = 30%, and S2 = 70%. Inrush magnetization and overexcitation are blocked via 2nd (15%) and 5th (35%) harmonic spectral ratios [5].")

    # Image 3
    img3_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'ieee_paper', 'figures', 'fig3_differential_ansi87t.png')
    if os.path.exists(img3_path):
        doc.add_picture(img3_path, width=Inches(5.8))
        p_cap3 = doc.add_paragraph()
        p_cap3.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap3.paragraph_format.space_after = Pt(10)
        run_c3 = p_cap3.add_run("Fig. 2. ANSI 87T differential protection: (a) Dual-slope characteristic plane showing operating states, (b) Harmonic inrush discrimination spectral distribution.")
        run_c3.font.size = Pt(8.5)
        run_c3.italic = True

    add_subsection_heading("B. IEC 60076-7 Dynamic Thermal Modeling and Loss-of-Life")
    add_body_paragraph("The dynamic top-oil temperature rise delta_theta_TO and hot-spot temperature rise delta_theta_HS follow non-linear differential equations:")
    add_equation_paragraph("tau_TO * (d delta_theta_TO / dt) = [ delta_theta_TO,rated * ((1 + R*K(t)^2)/(1 + R))^x ] - delta_theta_TO", "4")
    add_equation_paragraph("tau_HS * (d delta_theta_HS / dt) = [ delta_theta_HS,rated * K(t)^y ] - delta_theta_HS", "5")
    add_body_paragraph("The relative aging acceleration factor F_AA is computed via the Arrhenius equation:")
    add_equation_paragraph("F_AA(t) = exp( (15000 / 383.15) - (15000 / (theta_HS(t) + 273.15)) )", "6")

    # Image 4
    img4_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'ieee_paper', 'figures', 'fig4_thermal_aging_iec60076.png')
    if os.path.exists(img4_path):
        doc.add_picture(img4_path, width=Inches(5.5))
        p_cap4 = doc.add_paragraph()
        p_cap4.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap4.paragraph_format.space_after = Pt(10)
        run_c4 = p_cap4.add_run("Fig. 3. IEC 60076-7 24-hour dynamic thermal simulation: Top-oil and hot-spot temperatures with corresponding aging factor F_AA and cumulative loss-of-life.")
        run_c4.font.size = Pt(8.5)
        run_c4.italic = True

    add_subsection_heading("C. ANSI 50/51 Time-Current Characteristic (TCC) Coordination")
    add_body_paragraph("Feeder overcurrent relays follow IEC 60255 and IEEE C37.112 inverse curves with grading margins delta_t >= 300 ms maintained across all feeder protection stages:")
    add_equation_paragraph("t_op = TMS * ( alpha / ((I / I_pickup)^beta - 1) )", "7")

    # Image 2
    img2_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'ieee_paper', 'figures', 'fig2_tcc_coordination_ansi50_51.png')
    if os.path.exists(img2_path):
        doc.add_picture(img2_path, width=Inches(5.5))
        p_cap2 = doc.add_paragraph()
        p_cap2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap2.paragraph_format.space_after = Pt(10)
        run_c2 = p_cap2.add_run("Fig. 4. Time-Current Characteristic (TCC) coordination curves across IEC and IEEE standard inverse families with instantaneous ANSI 50 pickup.")
        run_c2.font.size = Pt(8.5)
        run_c2.italic = True

    # Section IV: Real-Time Co-Simulation & Cyber Range
    add_section_heading("IV. REAL-TIME CO-SIMULATION AND CYBERSECURITY BENCHMARK")
    add_body_paragraph(
        "The bidirectional co-simulation architecture links the MATLAB/Simulink EMT solver to the Node.js WebSocket broker. Telemetry packets containing voltage phasors, currents, and switchgear statuses are streamed at 60 Hz. To defend against GOOSE spoofing and False Data Injection Attacks (FDIA), an Extended Kalman Filter (EKF) residual detector monitors anomalies in real-time:"
    )
    add_equation_paragraph("r(k) = || z(k) - h(x_hat(k|k-1)) ||_2^2", "8")
    add_body_paragraph("When r(k) exceeds gamma_th = 0.18, the attack is flagged and blocked within 4.2 ms. Every control action is committed to an immutable SHA-256 blockchain audit ledger.")

    # Image 5
    img5_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'ieee_paper', 'figures', 'fig5_cosim_latency_cyber_benchmark.png')
    if os.path.exists(img5_path):
        doc.add_picture(img5_path, width=Inches(5.8))
        p_cap5 = doc.add_paragraph()
        p_cap5.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap5.paragraph_format.space_after = Pt(10)
        run_c5 = p_cap5.add_run("Fig. 5. (a) Co-simulation latency probability distributions for WebSocket and IEC 61850 GOOSE messages; (b) Real-time Kalman filter anomaly detection under False Data Injection Attack (FDIA).")
        run_c5.font.size = Pt(8.5)
        run_c5.italic = True

    # Section V: Results
    add_section_heading("V. EXPERIMENTAL RESULTS AND PERFORMANCE VALIDATION")
    add_body_paragraph("Table I summarizes the quantitative fault clearing and protection coordination benchmarks across all test scenarios.")

    # Table 1
    table = doc.add_table(rows=7, cols=5)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = 'Table Grid'
    
    headers = ["Fault / Event Type", "I_fault (A)", "Relay ANSI", "Decision", "Operating Time (ms)"]
    data = [
        ["Transformer SLG Internal", "3850", "87T", "TRIP", "22.4"],
        ["External Busbar Fault", "4200", "87T", "BLOCK", "No Trip"],
        ["Magnetizing Inrush", "950", "87T", "RESTRAIN", "Blocked (2nd Harm)"],
        ["Line Fault at 10 km (Zone 1)", "2450", "21", "TRIP", "18.0"],
        ["Line Fault at 42 km (Zone 2)", "1820", "21", "TRIP", "315.0"],
        ["Feeder Phase Overcurrent", "2100", "51", "TRIP", "142.5"]
    ]

    for col_idx, text in enumerate(headers):
        cell = table.cell(0, col_idx)
        cell.text = text
        for p in cell.paragraphs:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p.runs:
                r.bold = True
                r.font.size = Pt(9)
                r.font.name = 'Times New Roman'

    for row_idx, row_data in enumerate(data):
        for col_idx, text in enumerate(row_data):
            cell = table.cell(row_idx + 1, col_idx)
            cell.text = text
            for p in cell.paragraphs:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                for r in p.runs:
                    r.font.size = Pt(8.5)
                    r.font.name = 'Times New Roman'

    p_after_tab = doc.add_paragraph()
    p_after_tab.paragraph_format.space_before = Pt(8)

    # Section VI: Conclusion
    add_section_heading("VI. CONCLUSION")
    add_body_paragraph(
        "This paper presented a real-time, multi-dimensional Cyber-Physical Digital Twin architecture for IEC 61850 substation automation systems. By synthesizing MATLAB/Simulink physical solvers, IEC 60076-7 dynamic thermal aging, numerical protection relays, multi-carrier microgrid resources, and an OT cybersecurity range, the proposed system demonstrates high fidelity, sub-25 ms protection operation, and resilient defense against advanced cyber attacks. Future extensions will incorporate field deployment over edge micro-PMU gateways."
    )

    # References
    add_section_heading("REFERENCES")
    refs = [
        "[1] IEC 61850-7-2, \"Communication networks and systems for power utility automation - Basic information and communication structure,\" International Electrotechnical Commission Standard, 2020.",
        "[2] V.-H. Nguyen, Q.-T. Tran, Y. Besanger, and C. Boudinet, \"Digital Twin for Cyber-Physical Power Systems: Architecture, Enabling Technologies, and Applications,\" IEEE Transactions on Industrial Informatics, vol. 18, no. 10, pp. 7220-7232, 2022.",
        "[3] S. M. S. Hussain, S. M. Farooq, and T. S. Ustun, \"Implementation of IEC 61850 GOOSE Message Security Using Digital Signatures in Smart Grid Substations,\" IEEE Transactions on Industrial Informatics, vol. 16, no. 7, pp. 4435-4446, 2020.",
        "[4] R. Zhu, G. De Carne, and M. Liserre, \"Synthetic Inertia and Fast Frequency Support from VSC-HVDC Systems,\" IEEE Transactions on Power Systems, vol. 34, no. 5, pp. 3869-3879, 2019.",
        "[5] A. Guzman, S. Zocholl, G. Benmouyal, and H. J. Altuve, \"A Current-Based Solution for Transformer Inrush Restraint,\" IEEE Transactions on Power Delivery, vol. 16, no. 4, pp. 485-491, 2001.",
        "[6] IEEE Std 1584-2018, \"IEEE Guide for Performing Arc-Flash Hazard Calculations,\" IEEE Standards Association, 2018.",
        "[7] IEC 60076-7, \"Power transformers - Part 7: Loading guide for mineral-oil-immersed power transformers,\" International Electrotechnical Commission Standard, 2018.",
        "[8] IEEE Std C37.118.1-2011, \"IEEE Standard for Synchrophasor Measurements for Power Systems,\" IEEE Power and Energy Society, 2011.",
        "[9] IEEE Std 519-2022, \"IEEE Standard for Harmonic Control in Electric Power Systems,\" IEEE Standards Association, 2022.",
        "[10] CIGRE Working Group A2.49, \"Condition Assessment of Power Transformers and Asset Health Indexing,\" CIGRE Technical Brochure 761, 2019.",
        "[11] NERC, \"Critical Infrastructure Protection (CIP) Reliability Standards CIP-002 through CIP-014,\" North American Electric Reliability Corporation, 2023."
    ]

    for ref in refs:
        p_ref = doc.add_paragraph()
        p_ref.paragraph_format.space_after = Pt(3)
        p_ref.paragraph_format.line_spacing = 1.05
        run_ref = p_ref.add_run(ref)
        run_ref.font.size = Pt(8.5)
        run_ref.font.name = 'Times New Roman'

    output_docx = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'ieee_paper', 'IEEE_Paper_Substation_Digital_Twin.docx')
    doc.save(output_docx)
    print("Successfully generated IEEE Word document:", output_docx)

if __name__ == '__main__':
    create_ieee_doc()
