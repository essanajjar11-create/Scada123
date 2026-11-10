# SCADA & Substation Automation System (SAS) Digital Twin
### 132 kV / 13.8 kV High-Voltage Substation Bay & Power Transformer Management Platform

[![Live Demo](https://img.shields.io/badge/Live_Demo-GitHub_Pages-success?style=for-the-badge&logo=github)](https://essanajjar11-create.github.io/Scada123/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg?logo=react)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38bdf8.svg?logo=tailwindcss)](https://tailwindcss.com/)
[![Three.js](https://img.shields.io/badge/Three.js-3D_Twin-black.svg?logo=three.js)](https://threejs.org/)
[![IEC Standards](https://img.shields.io/badge/Compliance-IEC_61850_|_IEC_60076_|_IEC_60909_|_IEC_60255-success.svg)](#-المعايير-والأطر-الدولية-المعتمدة-standards-compliance)
[![IEEE Standards](https://img.shields.io/badge/Compliance-IEEE_C57_|_IEEE_C37_|_IEEE_1584_|_IEEE_519-orange.svg)](#-المعايير-والأطر-الدولية-المعتمدة-standards-compliance)
[![ISA-101 HMI](https://img.shields.io/badge/HMI_Standard-ISA--101_|_ISA--18.2-purple.svg)](#-المعايير-والأطر-الدولية-المعتمدة-standards-compliance)
[![Tests Passing](https://img.shields.io/badge/Vitest-62%2F62_Passed-brightgreen.svg)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🌐 الرابط المباشر للمنظومة (Live Deployment)

- **الرابط على GitHub Pages**: [https://essanajjar11-create.github.io/Scada123/](https://essanajjar11-create.github.io/Scada123/)
- **مستودع الأكواد (Repository)**: [https://github.com/essanajjar11-create/Scada123](https://github.com/essanajjar11-create/Scada123)

---

## ⚡ نظرة عامة (System Overview)

منظومة **التوأم الرقمي للتحكم الإشرافي وأتمتة محطات التحويل الكهربائية (SCADA & SAS Digital Twin)** لمحطة **132/13.8 ك.ف** هي منصة تشغيلية وهندسية متقدمة من الجيل الصناعي الرابع (Industry 4.0)، تجمع بين:

1. **المحاكاة الفيزيائية الرياضية الصارمة بالزمن الحقيقي (Real-Time Physics Solvers)** وفق أحدث معايير **IEC** و **IEEE** و **CIGRE**.
2. **محطة تحويل عالية الجهد متكاملة** بقضبان مزدوجة (Double Busbar 132kV) ومحولي قدرة رئيسيين (**TR-1** و **TR-2**) باستطاعة **40 MVA** لكل منهما بمجموعة توصيل **Dyn11** ومحولات تيار **300:5 A**.
3. **المخطط الأحادي التفاعلي المباشر (Single Line Diagram - SLD)** المزود بمحددات تدفق القدرة ($P + jQ$) ومؤشرات التحميل والأعطال وحواجب التعشيق البرمجية.
4. **التوأم الفراغي ثلاثي الأبعاد (3D Spatial Digital Twin)** المبني بمكتبة Three.js مع تظليل حراري فوري للساحة والمعدات.
5. **محرك مزامنة متعدد المستخدمين (Real-Time Multi-User Synchronization)** يعتمد انتخاب القائد الحتمي (Deterministic Leader Election) لضمان تطابق كامل في القراءات والأرقام بين جميع المتصفحات والأجهزة المتصلة.
6. **جسر المحاكاة المشتركة مع ماتلاب (MATLAB / Simulink Co-Simulation Bridge)** عبر خادم Node.js وبروتوكول WebSocket لتنفيذ سيناريوهات أعطال حقيقية على نموذج سيمولينك ode23tb.
7. **حقل اختبارات الأمن السيبراني للأنظمة الصناعية (OT Cyber Range & NERC-CIP)** لمحاكاة هجمات تزييف رسائل GOOSE واعتراض شبكة المحطة مع جدار ناري تفاعلي وسجل SIEM.

---

## 📊 البيانات الكهربائية الاسمية للمحطة (Rated Substation Parameters)

تمت معايرة جميع الحسابات الهندسية للمحطة بدقة فيزيائية متناهية:

| البارامتر الكهربائي | القيمة المعتمدة | الوحدة | الشرح الهندسي |
|---|---|---|---|
| **الجهد الاسمي الأولي ($V_{prim}$)** | **132.0** | $\text{kV}$ | جهد خط النقل وقضبان المحطة (Line-to-Line) |
| **جهد الطور الأولي ($V_{phase}$)** | **76.21** | $\text{kV}$ | $V_{LL} / \sqrt{3} = 132 / \sqrt{3}$ |
| **الجهد الاسمي الثانوي ($V_{sec}$)** | **13.8** | $\text{kV}$ | جهد قضبان التوزيع للمحطة |
| **الاستطاعة الاسمية للمحول ($S_{rated}$)** | **40.0** | $\text{MVA}$ | الاستطاعة المقننة لكل محول (ONAN/ONAF) |
| **مجموعة المتجهات (Vector Group)** | **Dyn11** | — | ابتدائي دلتا، ثانوي نجمي مؤرض مع إزاحة طورية $+30^\circ$ |
| **تيار المحول الاسمي الأولي ($I_{prim,rated}$)** | **174.95** | $\text{A}$ | $I = \frac{40,000}{\sqrt{3} \times 132}$ |
| **تيار المحول الاسمي الثانوي ($I_{sec,rated}$)** | **1673.5** | $\text{A}$ | $I = \frac{40,000}{\sqrt{3} \times 13.8}$ |
| **تيار التشغيل الاسمي للمحول TR-1** | **122.5** | $\text{A}$ | تحميل بنسبة ~70% ($28.0\text{ MVA}$ الظاهرية) |
| **تيار التشغيل الاسمي للمحول TR-2** | **105.0** | $\text{A}$ | تحميل بنسبة ~60% ($24.0\text{ MVA}$ الظاهرية) |
| **معامل القدرة الاسمي ($\cos\phi$)** | **0.85** | تأخري (Lag) | حثي (Inductive Load Profile) |
| **القدرة الفعالة لمحول TR-1 ($P$)** | **23.8** | $\text{MW}$ | $\sqrt{3} \times 132 \times 122.5 \times 0.85$ |
| **القدرة غير الفعالة لمحول TR-1 ($Q$)** | **14.75** | $\text{MVAR}$ | $\sqrt{3} \times 132 \times 122.5 \times \sin(\arccos(0.85))$ |
| **التيار الثانوي المحسوب بالجانب 13.8kV** | **1172** | $\text{A}$ | يتطابق بدقة مع نموذج MATLAB Simulink |
| **نسبة محولات التيار الأولية (CT Ratio)** | **300:5** | $\text{A}$ | تيار الدائرة الثانوية للمرحل = $122.5 / 60 = 2.04\text{ A}$ |
| **التردد الاسمي للشبكة ($f$)** | **50.0** | $\text{Hz}$ | التردد المرجعي للشبكة الإقليمية ($\omega = 314.16\text{ rad/s}$) |

---

## 🗂️ هيكلية المحاور التشغيلية الخمسة (Smart 5-Hub Grouping Architecture)

وفق معيار **ISA-101** لغرف التحكم الحديثة، تم تجميع الوحدات الوظيفية الـ 28 المدمجة في النظام داخل 5 محاور هندسية ذكية:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       SMART 5-HUB NAVIGATION ARCHITECTURE                                       │
├───────────────────┬───────────────────┬───────────────────┬───────────────────┬─────────────────────────────────┤
│ ⚡ المحور 1:        │ 🛡️ المحور 2:        │ ☀️ المحور 3:        │ 🚨 المحور 4:        │ 📊 المحور 5:                      │
│ العمليات الميدانية │ الحمايات          │ الطاقة المتجددة   │ الطوارئ والسلامة  │ التحليلات والتوأم                │
│ والتحكم المباشر   │ والبروتوكولات     │ والتقنيات الخضراء │ والأمن السيبراني  │ الرقمي المتقدم                  │
├───────────────────┼───────────────────┼───────────────────┼───────────────────┼─────────────────────────────────┤
│ 1. نظرة عامة      │ 9. حماية المسافة  │ 16. الطاقة الشمسية│ 23. الإنذارات     │ [الأجنحة التحليلية]              │
│ 2. المخطط الأحادي │ 10. الحماية       │ 17. بطاريات BESS  │ 24. الإعادة بعد   │ • التقارير والـ PPTX             │
│ 3. التوأم ثلاثي   │ التفاضلية 87T     │ 18. الشبكة        │ الإظلام التام     │ • مؤشر صحة الأصول AHI            │
│ 4. محاكي RTS      │ 11. منحنيات TCC   │ الإقليمية 5-Bus   │ 25. تصاريح LOTO   │ • الجدوى الاقتصادية TCO          │
│ 5. موازين القدرة  │ 12. محاكي         │ 19. جودة الطاقة   │ 26. محاكي تدريب   │ • الجناح المتقدم Advanced        │
│ 6. الاتجاهات      │ البروتوكولات 104  │ 20. التحميل       │ المشغلين OTS      │ • ضبط المحاكاة والأعطال          │
│ 7. تقادم العزل    │ 13. مسجلات        │ الديناميكي DTR    │ 27. حقل الأمن     │ • سجل البلوكشين Blockchain       │
│ 8. مراقبة الـ SF6 │ COMTRADE          │ 21. الهيدروجين    │ السيبراني NERC-CIP│ • محدد أعطال الكابلات TDR        │
│                   │ 14. قياسات WAMS   │ 22. وصلة VSC-HVDC │ 28. تسلسلات       │ • التوأم الاصطناعي PINN          │
│                   │ 15. ناقل IEC 61850│                   │ المناورة الآلية   │ • كاشف الأعطال الجغرافي GIS      │
└───────────────────┴───────────────────┴───────────────────┴───────────────────┴─────────────────────────────────┘
```

---

## 📐 دليل المعادلات الرياضية والفيزيائية المطبقة (Comprehensive Mathematical & Physics Reference)

تم تدقيق وبناء جميع الحسابات الهندسية في النظام لتطابق المعايير والمراجع الدولية:

### 1. تدفق الأحمال بطريقة نيوتن-رافسون القطبية (AC Newton-Raphson Power Flow)
- **مصفوفة القبولية ($Y_{bus}$)** بنموذج $\Pi$ لخطوط النقل مع شحن المكثفات:
  $$Y_{ii} = \sum_{k \in \Omega_i} \left(\frac{1}{R_{ik} + j X_{ik}} + j \frac{B_{ik}^{charging}}{2}\right), \quad Y_{ij} = -\frac{1}{R_{ij} + j X_{ij}}$$
- **معادلات القدرة المحسوبة في العقد**:
  $$P_i = V_i \sum_{j=1}^{n} V_j (G_{ij} \cos\theta_{ij} + B_{ij} \sin\theta_{ij})$$
  $$Q_i = V_i \sum_{j=1}^{n} V_j (G_{ij} \sin\theta_{ij} - B_{ij} \cos\theta_{ij})$$
  حيث $\theta_{ij} = \theta_i - \theta_j$.
- **مصفوفة الجاكوبي القطبية الكاملة (Polar Jacobian Matrix)**:
  $$J = \begin{bmatrix} H & N \\ J & L \end{bmatrix} = \begin{bmatrix} \frac{\partial P}{\partial \theta} & \frac{\partial P}{\partial V} \\ \frac{\partial Q}{\partial \theta} & \frac{\partial Q}{\partial V} \end{bmatrix}$$
  حيث العناصر خارج القطر ($j \neq i$):
  $$H_{ij} = V_i V_j (G_{ij} \sin\theta_{ij} - B_{ij} \cos\theta_{ij})$$
  $$N_{ij} = V_i (G_{ij} \cos\theta_{ij} + B_{ij} \sin\theta_{ij})$$
  $$J_{ij} = -V_i V_j (G_{ij} \cos\theta_{ij} + B_{ij} \sin\theta_{ij})$$
  $$L_{ij} = V_i (G_{ij} \sin\theta_{ij} - B_{ij} \cos\theta_{ij})$$
- تدعم الخوارزمية التبديل التلقائي لعقد المولدات $PV \to PQ$ عند تجاوز حدود القدرة غير الفعالة ($Q_{min}, Q_{max}$) ودراسات الحوادث الفردية ($N-1$ Contingency Ranking).

---

### 2. حسابات تيار القصر القياسية (IEC 60909-0 Short-Circuit Analysis)
- **معامل الجهد ($c$)**: $c_{max} = 1.10$ و $c_{min} = 1.00$ للجهود العالية والمتوسطة ($U_n > 1\text{ kV}$).
- **معاوقة المغذي الشبكي ($Z_Q$)**:
  $$|Z_Q| = \frac{c \cdot U_n^2}{S_k''}, \quad X_Q = \frac{|Z_Q|}{\sqrt{1 + (R/X)^{-2}}}, \quad R_Q = \frac{X_Q}{X/R}$$
- **معامل تصحيح معاوقة المحول ($K_T$)**:
  $$K_T = 0.95 \frac{c_{max}}{1 + 0.6 \cdot x_T}$$
- **تيارات القصر**:
  - تيار القصر المتناظر الأولي ثلاثي الطور: $I_k'' = \frac{c \cdot U_n}{\sqrt{3} |Z_1|}$
  - تيار القصر الأرضي أحادي الطور (SLG): $I_{k1}'' = \frac{\sqrt{3} c U_n}{|2 Z_1 + Z_0|}$
  - تيار الذروة لقصر الدائرة: $i_p = \kappa \sqrt{2} I_k''$ حيث $\kappa = 1.02 + 0.98 e^{-3 R / X}$
  - الثابت الزمني للتيار المستمر: $T_a = \frac{X}{\omega R}$

---

### 3. تحليل المركبات المتماثلة وتحويل فورتسكو (Fortescue Transformation)
- مشغل الإزاحة الطورية: $a = e^{j 120^\circ} = -0.5 + j \frac{\sqrt{3}}{2}$، و $a^2 = e^{j 240^\circ} = -0.5 - j \frac{\sqrt{3}}{2}$.
- **التحويل الأمامي (الأطوار إلى المركبات المتماثلة $0, 1, 2$)**:
  $$\begin{bmatrix} I_0 \\ I_1 \\ I_2 \end{bmatrix} = \frac{1}{3} \begin{bmatrix} 1 & 1 & 1 \\ 1 & a & a^2 \\ 1 & a^2 & a \end{bmatrix} \begin{bmatrix} I_a \\ I_b \\ I_c \end{bmatrix}$$
- **التحويل العكسي (المركبات المتماثلة إلى الأطوار)**:
  $$\begin{bmatrix} I_a \\ I_b \\ I_c \end{bmatrix} = \begin{bmatrix} 1 & 1 & 1 \\ 1 & a^2 & a \\ 1 & a & a^2 \end{bmatrix} \begin{bmatrix} I_0 \\ I_1 \\ I_2 \end{bmatrix}$$
- **شروط حدود الأعطال المركبة**:
  - عطل ثلاثي الأطوار (3PH): $I_1 = V / Z_1, \quad I_2 = 0, \quad I_0 = 0$
  - عطل طور إلى أرض (SLG): $I_1 = I_2 = I_0 = \frac{V}{Z_1 + Z_2 + Z_0}$
  - عطل طور مع طور (LL): $I_1 = \frac{V}{Z_1 + Z_2}, \quad I_2 = -I_1, \quad I_0 = 0$
  - عطل طورين مع الأرض (LLG): $I_1 = \frac{V}{Z_1 + (Z_2 \parallel Z_0)}, \quad I_2 = -I_1 \frac{Z_0}{Z_2 + Z_0}, \quad I_0 = -I_1 \frac{Z_2}{Z_2 + Z_0}$

---

### 4. معادلة التأرجح والاستقرار اللحظي (Swing Equation & Equal-Area Criterion)
- **معادلة التأرجح الميكانيكية-الكهربائية للآلة المتزامنة**:
  $$\frac{2H}{\omega_s} \frac{d^2\delta}{dt^2} = P_m - P_e - \frac{D}{\omega_s} \frac{d\delta}{dt}$$
  حيث $H$ ثابت القصور الذاتي بالثواني، $P_m$ القدرة الميكانيكية، $P_e = P_{max} \sin\delta$ القدرة الكهربائية المنقولة، $D$ معامل التخميد.
- يتم حل المعادلة عبر تكامل **Runge-Kutta من الدرجة الرابعة (RK4)** مع كشف لحظة الانزلاق القطبي (Pole Slip) ومقارنتها بزاوية الاستقرار الحرجة لمعيار المساحتين المتساويتين:
  $$\cos\delta_{cr} = -\cos\delta_0 + \frac{P_m}{P_{max}} (\pi - 2\delta_0)$$

---

### 5. النموذج الحراري وتقادم العزل (IEEE C57.91 / IEC 60076-7)
- **نسبة الفواقد الكلية ($K = I / I_{rated}$)**:
  $$\text{Loss Ratio} = \frac{1 + R \cdot K^2}{1 + R}, \quad R = \frac{P_k}{P_0} = \frac{180\text{ kW}}{42\text{ kW}} = 4.286$$
- **ارتفاع حرارة الزيت العلوي ($\Delta\Theta_{TO}$)**:
  $$\Delta\Theta_{TO} = \Delta\Theta_{TO,rated} \times \left(\frac{1 + R \cdot K^2}{1 + R}\right)^x$$
- **حرارة النقطة الساخنة لملفات المحول ($\Theta_H$)**:
  $$\Theta_H = \Theta_{TO} + H_{factor} \cdot g_r \cdot K^y$$
- **معامل تسارع التقادم الأرهينيوس (Arrhenius Aging Factor $F_{AA}$)**:
  $$F_{AA} = \exp\left(\frac{15000}{383.15} - \frac{15000}{\Theta_H + 273.15}\right)$$
- **فقدان العمر الافتراضي اليومي (% LOL)** على أساس عمر تصميمي مقداره 180,000 ساعة:
  $$\% \text{LOL}_{24h} = \frac{F_{AA} \times 24}{180,000} \times 100\%$$
- **تدهور درجة بلمرة ورق الكرافت (Degree of Polymerization - DP)**:
  $$\text{DP} = \max(200, \min(1200, \text{round}(780 - (F_{AA} - 1.0) \times 45)))$$

---

### 6. التنسيق الزماني-التياري لمنحنيات الحماية (IEC 60255-151)
- زمن تشغيل مرحل زيادة التيار:
  $$t = \text{TMS} \times \frac{A}{\left(\frac{I}{I_s}\right)^p - 1}$$
  - **Standard Inverse (SI)**: $A = 0.14, \quad p = 0.02$
  - **Very Inverse (VI)**: $A = 13.5, \quad p = 1.00$
  - **Extremely Inverse (EI)**: $A = 80.0, \quad p = 2.00$
  - **Long-Time Inverse (LTI)**: $A = 120.0, \quad p = 1.00$
- هامش التمييز الزمني (Grading Margin): $\Delta t = t_{upstream} - t_{downstream} \ge 0.30\text{ s}$.

---

### 7. الحماية التفاضلية الرقمية للمحولات (ANSI 87T Dual-Slope Curve)
- تيار التفاضل: $I_{diff} = |\vec{I}_1 + \vec{I}_2|$
- تيار الكبح (Bias / Restraint): $I_{bias} = \frac{|\vec{I}_1| + |\vec{I}_2|}{2}$
- حد الفصل المتغير:
  $$I_{diff,thresh}(I_{bias}) = \begin{cases} I_{s1} & I_{bias} \le I_{s1} \\ I_{s1} + K_1 (I_{bias} - I_{s1}) & I_{s1} < I_{bias} \le I_{s2} \\ I_{s1} + K_1 (I_{s2} - I_{s1}) + K_2 (I_{bias} - I_{s2}) & I_{bias} > I_{s2} \end{cases}$$
- كبح التوافقيات لمنع الفصل الخاطئ: التوافقية الثانية لتيار التمغنط المفاجئ ($I_{2nd} \ge 15\%$) والتوافقية الخامسة لفرط الإثارة المغناطيسية ($I_{5th} \ge 30\%$).

---

### 8. حماية المسافة الرقمية (ANSI 21 Distance Protection)
- المعاوقة المحسوبة المقاسة: $Z_m = R_m + j X_m = \frac{V_{relay}}{I_{relay}}$
- **منحنى Mho الدائري**: مركزه $(R_c, X_c) = (R_{reach}/2, X_{reach}/2)$ ونصف قطره $r = |Z_{reach}| / 2$.
  الوقوع داخل الدائرة: $(R_m - R_c)^2 + (X_m - X_c)^2 \le r^2$.
- **المنحنى الرباعي (Quadrilateral)**: حدود مفاعلة مستقلة ($X \le X_{reach}$) وحدود مقاومة مستقلة ($R \le R_{blinder}$) لمنع الفصل عند مقاومة القوس أو ملامسة الأشجار.
- **حاجب تداخل الأحمال (Load Encroachment Blinder)**: منع التعثر في منطقة الحمل الثقيل عندما يكون $R_m < R_{load}$ وزاوية المعاوقة $|\phi| < \phi_{load}$.

---

### 9. التوافقية وخفض قدرة المحولات (IEEE C57.110 K-Factor & Derating)
- **معامل التوافقيات K-Factor**:
  $$K = \frac{\sum_{h=1}^{h_{max}} I_h^2 \cdot h^2}{\sum_{h=1}^{h_{max}} I_h^2} = \frac{1 + \sum_{h > 1} \left(\frac{I_h}{I_1}\right)^2 h^2}{1 + \text{THD}_I^2}$$
- **نسبة خفض سعة المحول (Derating Factor)**:
  $$\text{Derating} = \sqrt{\frac{1 + P_{EC-R}}{1 + K \cdot P_{EC-R}}} \times 100\%$$
  حيث $P_{EC-R} \approx 0.15$ معامل الفواقد الدوامية للمحول الاسمي.

---

### 10. حسابات طاقة الوميض القوسي (IEEE 1584-2018 & NFPA 70E Arc Flash)
- تيار القوس الكهربائي: $I_{arc} \approx I_{bf} \times 0.92$ للجهد العالي 132kV.
- الطاقة الصادمة ($E$):
  $$E = \frac{4.184 \times C_f \times I_{arc}^{0.95} \times t \times \left(\frac{36}{D}\right)}{2.5} \quad [\text{cal/cm}^2]$$
- مسافة حدود الوميض القوسي (Arc Flash Boundary حيث $E = 1.2\text{ cal/cm}^2$):
  $$D_B = D \times \sqrt{\frac{E}{1.2}}$$

---

### 11. خوارزمية تاكاجي لتحديد موقع العطل (IEEE C37.114 Takagi Fault Locator)
- حساب المسافة النسبية للعطل ($d$) بإلغاء تأثير مقاومة العطل القوسي ($R_F$) عبر التراكب مع التيار التفاضلي المسبق:
  $$d = \frac{\text{Im}(V_s \cdot \Delta I_s^*)}{\text{Im}(Z_L \cdot I_s \cdot \Delta I_s^*)}$$

---

### 12. محطة الهيدروجين الأخضر وخلايا الوقود (PEM Electrolyzer & Fuel Cell)
- إنتاج الهيدروجين: $V_{H2} = \frac{P_{elec} \cdot \eta_{PEM}}{4.5\text{ kWh/Nm}^3}$ حيث كثافة الهيدروجين $\rho = 0.08988\text{ kg/Nm}^3$.
- استهلاك الماء النقي: $9.0\text{ Liters } \text{H}_2\text{O} / \text{kg } \text{H}_2$ (مطابق للتفاعل الكيميائي $2\text{H}_2\text{O} \to 2\text{H}_2 + \text{O}_2$).
- استهلاك خلايا الوقود: $\text{Rate (kg/h)} = \frac{P_{FC,kW}}{33.33 \times \eta_{FC}}$ حيث القيمة الحرارية الدنيا للهيدروجين $LHV = 33.33\text{ kWh/kg}$.

---

### 13. وصلة التيار المستمر عالي الجهد (VSC-HVDC / MMC Intertie)
- التحويل في إطار $d-q$ المتزامن:
  $$P = \frac{3}{2} (V_d I_d + V_q I_q) \implies I_d = \frac{P}{1.5 V_d}$$
  $$Q = \frac{3}{2} (V_q I_d - V_d I_q) \implies I_q = -\frac{Q}{1.5 V_d}$$
- معامل التضمين للمحولات الجهدية: $M_a = \frac{2\sqrt{2} V_{AC,LL}}{\sqrt{3} V_{DC}} \approx \frac{V_{AC} \sqrt{2} \times 1.1547}{V_{DC}}$
- الاستجابة الترددية بالقصور الذاتي الاصطناعي (Synthetic Inertia): $\Delta P = 2 H \frac{df}{dt} \cdot S_{base}$.

---

### 14. كاشف أعطال الكابلات بالموجات المنعكسة (TDR Cable Fault Locator)
- سرعة انتشار الموجة الكهرومغناطيسية داخل كابل الـ XLPE:
  $$v = \frac{c}{\sqrt{\varepsilon_r}} = \frac{299,792.458}{\sqrt{2.3}} \approx 197.68\text{ m/}\mu\text{s}$$
- معامل الانعكاس: $\Gamma = \frac{Z_L - Z_0}{Z_L + Z_0}$ (حيث $\Gamma = -1$ للقصر، و $+1$ للقطع).
- المسافة حتى العطل من زمن ارتداد النبضة: $d = \frac{v \cdot \Delta t}{2}$.

---

### 15. الصيانة التنبؤية بالتوأم الرقمي PINN وتوزيع وايبل (Weibull Reliability)
- متوسط الوقت بين الأعطال (MTTF) لتوزيع وايبل:
  $$\text{MTTF} = \eta \cdot \Gamma\left(1 + \frac{1}{\beta}\right)$$
  حيث $\eta = 185,000\text{ hours}$ معامل المقياس، $\beta = 2.4$ معامل الشكل (مرحلة الاهتراء Wear-out).

---

## 💻 التشغيل والإعداد المحلي (Local Installation & Setup)

### متطلبات النظام:
- **Node.js**: الإصدار 18 أو أحدث (موصى بـ v20 أو v22 LTS).
- **npm**: الإصدار 9 أو أحدث.
- **Git**.
- **نظام التشغيل**: Windows 10/11، أو Linux، أو macOS.

### خطوات التثبيت:

```bash
# 1. استنساخ المستودع
git clone https://github.com/essanajjar11-create/Scada123.git
cd Scada123

# 2. تثبيت الحزم والمكتبات
npm install

# 3. تشغيل وضع التطوير التفاعلي (Vite Dev Server)
npm run dev
# سيفتح التطبيق على: http://localhost:5173
```

### البناء والتشغيل للإنتاج وخادم الـ WebSocket المدمج:

```bash
# بناء حزمة الإنتاج للواجهة الأمامية والخادم
npm run build

# تشغيل خادم SCADA الخلفي مع جسر الـ WebSocket
node dist/server.cjs
# يعمل الخادم على: http://localhost:3000
```

### تشغيل الاختبارات الآلية وفحص الأنواع:

```bash
# فحص الأنواع الصارم عبر TypeScript
npm run lint

# تشغيل جميع الاختبارات الهندسية (62 اختباراً)
npm test
```

### المشغل المكتبي لنظام ويندوز (`SCADA_Digital_Twin.exe`):
المشروع يتضمن مشغلاً مدمجاً تم بناؤه بلغة C# عبر مترجم الدوت نت الأصلي، يقوم بتشغيل الخادم المحلي تلقائياً وفتح نافذة المتصفح بدون شريط أوامر:
```bash
# لإعادة تجميع المشغل:
npm run build:launcher
# تشغيل الملف التنفيذي مباشرة:
.\SCADA_Digital_Twin.exe
```

---

## 🛠️ حزمة التقنيات المستخدمة (Technology Stack)

| الطبقة الهندسية | التقنيات والمكتبات | الوظيفة البرمجية |
|---|---|---|
| **الواجهة الأمامية وهيكل التطبيق** | React 19, TypeScript 5.8 | بنية المكونات التفاعلية والتحقق من صحة الأنواع |
| **التصميم وأنماط العرض** | Tailwind CSS 4, Lucide React Icons | تصميم فائق الحداثة متوافق مع معيار ISA-101 |
| **المحرك ثلاثي الأبعاد** | Three.js (`@types/three`), WebGL Shaders | النمذجة المكانية والتظليل الحراري لساحة المحطة |
| **الرسوم البيانية والتحليل الطيفي** | Recharts, Chart.js, HTML5 Canvas 2D | رسم منحنيات R-X، ومخططات FFT، ودوائر Mho |
| **الخادم الخلفي والمزامنة اللحظية** | Node.js, Express, `ws` WebSockets, BroadcastChannel | خادم التزامن متعدد المستخدمين وجسر Co-Sim |
| **المحرك الصوتي الفيزيائي** | Web Audio API Multi-channel Oscillators | توليد أصوات طنين المحولات وقوس القواطع واقعياً |
| **محركات التصدير والتقارير** | PptxGenJS, Native Print CSS, CSV Engine | توليد عروض الباوربوينت والتقارير الهندسية |
| **بيئة الاختبار والتحقق** | Vitest, JSDOM | 62 اختبار وحدة وتكامل للمعادلات الهندسية |

---

## 📖 المعايير والأطر الدولية المعتمدة (Standards Compliance)

- **IEC 61850 (Parts 6, 7-2, 8-1, 9-2LE)**: هندسة بروتوكولات واتصالات المحطات الرقمية (SCL, GOOSE, Sampled Values, MMS).
- **IEC 60076 (Parts 1, 2, 5, 7)**: متطلبات محولات القدرة والتحميل الحراري وتقادم العزل ومقاومة قصر الدائرة.
- **IEC 60909-0:2016**: الحسابات المعيارية لتيارات القصر في شبكات التيار المتناوب ثلاثية الطور.
- **IEC 60255 (Parts 121, 149, 151)**: المعايير الدولية لمرحلات الحماية الرقمية ومنحنيات التنسيق الزمني.
- **IEEE C57.91-2011**: دليل تحميل محولات القدرة المغمورة بالزيت وحساب حرارة النقطة الساخنة وفقدان العمر.
- **IEEE C57.110**: المعيار المعتمد لتحديد قدرة المحولات على تحمل التيارات التوافقية ومعامل K-Factor.
- **IEEE C37.113 / C37.114**: أدلة حماية خطوط النقل وحساب مواقع الأعطال المعاوقية بخوارزمية تاكاجي.
- **IEEE C37.118 (1 & 2)**: معيار قياس وبث المتجهات المتزامنة في شبكات القياس الواسعة (WAMS / PMU).
- **IEEE 1584-2018 & NFPA 70E**: المعايير العالمية لحساب طاقة ومخاطر الوميض القوسي وتحديد معدات الوقاية الشخصية.
- **IEEE 519-2022**: المعيار القياسي لضبط التوافقيات وجودة القدرة الكهربائية في أنظمة الطاقة.
- **ISA-101**: معايير واجهات المشغل التفاعلية عالية الأداء في غرف التحكم والمراقبة الصناعية.
- **ISA-18.2 / IEC 62682**: المعايير الدولية لإدارة وترشيد الإنذارات ومنع طوفان التنبيهات.
- **CIGRE TB 761 / TB 445**: الدليل المرجعي لحساب مؤشر صحة الأصول (AHI) وتشخيص الغازات الذائبة (DGA).
- **NERC-CIP (CIP-002 through CIP-014)**: المعايير الإلزامية لحماية البنية التحتية الكهربائية الحيوية والأمن السيبراني الصناعي.

---

## 👥 فريق الإعداد والتطوير (Engineering Credits)

- **م. حيدرة ديب (Eng. Haedara Deeb)** — مهندس معماري لأنظمة الأتمتة والمراقبة والتحكم الإشرافي (SCADA, SAS & Real-Time Digital Twin Systems Architect)
- **م. عيسى نجار (Eng. Essa Najjar)** — خبير هندسة القوى الكهربائية وأنظمة الحماية المتقدمة (Power Systems, High Voltage & Numerical Protection Specialist)

---

## 📄 الترخيص (License)

هذا المشروع مرخص بموجب رخصة **MIT** - انظر ملف [LICENSE](LICENSE) لمزيد من التفاصيل.
