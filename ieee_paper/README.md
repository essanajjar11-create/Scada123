# IEEE Manuscript Package: Cyber-Physical Substation Digital Twin

This directory contains the complete, publication-ready research paper package prepared for submission to **IEEE Transactions on Smart Grid**, **IEEE Transactions on Industrial Informatics**, or **IEEE PES General Meeting**.

---

## 📁 Package Contents

```
ieee_paper/
├── main.tex                       # Complete IEEE double-column LaTeX manuscript
├── references.bib                 # BibTeX standard references database
├── figures/                       # Publication-grade vector (PDF) & high-res (PNG) figures
│   ├── fig1_rx_distance_ansi21.pdf / .png
│   ├── fig2_tcc_coordination_ansi50_51.pdf / .png
│   ├── fig3_differential_ansi87t.pdf / .png
│   ├── fig4_thermal_aging_iec60076.pdf / .png
│   └── fig5_cosim_latency_cyber_benchmark.pdf / .png
└── README.md                      # Compilation and submission guide
```

---

## 🚀 How to Compile & View

### Option A: Upload to Overleaf (Fastest & Easiest)
1. Compress the entire `ieee_paper` folder into a `.zip` file.
2. Go to [Overleaf.com](https://www.overleaf.com), click **New Project** -> **Upload Project**.
3. Select the `.zip` file. Overleaf will automatically detect `main.tex`, load the figures, and compile the final PDF.

### Option B: Compile Locally using TeX Live / MiKTeX
Run the following commands in this directory:

```bash
pdflatex main
bibtex main
pdflatex main
pdflatex main
```

---

## 📊 Figure Summary & Mathematical Reference

| Figure File | IEEE Technical Focus | Standards / Physics Equations |
|---|---|---|
| `fig1_rx_distance_ansi21` | ANSI 21 Distance Protection Multi-Zone Characteristics ($R-X$ Plane) | IEEE C37.113, Mho \& Quadrilateral Reach |
| `fig2_tcc_coordination_ansi50_51` | Time-Current Characteristic (TCC) Coordination Curves | IEC 60255, IEEE C37.112 Grading Margin |
| `fig3_differential_ansi87t` | ANSI 87T Dual-Slope & Harmonic Inrush Restraint Discrimination | Dual-Slope Piecewise Characteristic, 2nd Harmonic FFT |
| `fig4_thermal_aging_iec60076` | Transformer Top-Oil, Hot-Spot & Loss-of-Life Dynamic Response | IEC 60076-7, IEEE C57.91 Arrhenius Aging Factor |
| `fig5_cosim_latency_cyber_benchmark` | Co-Simulation Latency Distribution & FDIA Real-Time Detection | IEC 61850 GOOSE Type 1A, Extended Kalman Filter |
