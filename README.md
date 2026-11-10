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

| البارامتر الكهربائي | القيمة المعتمدة | الوحدة | الشرح الهندسي والحسابي |
|---|---|---|---|
| **الجهد الاسمي الأولي ($V_{prim}$)** | **132.0** | kV | جهد خط النقل وقضبان المحطة بين الأطوار (Line-to-Line) |
| **جهد الطور الأولي ($V_{phase}$)** | **76.21** | kV | $V_{LL} / \sqrt{3} = 132 / 1.73205 = 76.21\text{ kV}$ |
| **الجهد الاسمي الثانوي ($V_{sec}$)** | **13.8** | kV | جهد قضبان التوزيع للمحطة (Line-to-Line) |
| **الاستطاعة الاسمية للمحول ($S_{rated}$)** | **40.0** | MVA | الاستطاعة المقننة لكل محول (ONAN/ONAF) |
| **مجموعة المتجهات (Vector Group)** | **Dyn11** | — | ابتدائي دلتا، ثانوي نجمي مؤرض مع إزاحة طورية $+30^\circ$ |
| **تيار المحول الاسمي الأولي ($I_{prim,rated}$)** | **174.95** | A | $I = \frac{S}{\sqrt{3} \times V} = \frac{40,000}{1.732 \times 132} = 174.95\text{ A}$ |
| **تيار المحول الاسمي الثانوي ($I_{sec,rated}$)** | **1673.5** | A | $I = \frac{S}{\sqrt{3} \times V} = \frac{40,000}{1.732 \times 13.8} = 1673.5\text{ A}$ |
| **تيار التشغيل الاسمي للمحول TR-1** | **122.5** | A | تحميل بنسبة 70% من الاستطاعة الاسمية (28.0 MVA الظاهرية) |
| **تيار التشغيل الاسمي للمحول TR-2** | **105.0** | A | تحميل بنسبة 60% من الاستطاعة الاسمية (24.0 MVA الظاهرية) |
| **معامل القدرة الاسمي ($\cos\phi$)** | **0.85** | تأخري (Lag) | نمط حمل حثي صناعي وسكني (Inductive Load Profile) |
| **القدرة الفعالة لمحول TR-1 ($P$)** | **23.8** | MW | $P = \sqrt{3} \times 132 \times 122.5 \times 0.85 = 23.8\text{ MW}$ |
| **القدرة غير الفعالة لمحول TR-1 ($Q$)** | **14.75** | MVAR | $Q = \sqrt{3} \times 132 \times 122.5 \times \sin(\arccos(0.85)) = 14.75\text{ MVAR}$ |
| **التيار الثانوي المحسوب بالجانب 13.8kV** | **1172** | A | $I_{sec} = \frac{28,000}{\sqrt{3} \times 13.8} = 1171.4\text{ A} \approx 1172\text{ A}$ |
| **نسبة محولات التيار الأولية (CT Ratio)** | **300:5** | A | تيار الدائرة الثانوية للمرحل = $122.5 / (300/5) = 2.04\text{ A}$ |
| **التردد الاسمي للشبكة ($f$)** | **50.0** | Hz | التردد المرجعي للشبكة ($\omega = 2\pi f = 314.16\text{ rad/s}$) |

---

## 🗂️ هيكلية المحاور التشغيلية الخمسة (Smart 5-Hub Grouping Architecture)

وفق معيار **ISA-101** لغرف التحكم والمراقبة الصناعية الحديثة، تم تجميع الوحدات الوظيفية الـ 28 المدمجة في المنظومة داخل 5 محاور هندسية ذكية:

### 🧭 جدول الملاحة السريعة للمحاور الخمسة (Quick Navigation Matrix)

| ⚡ المحور 1: العمليات الميدانية والتحكم المباشر | 🛡️ المحور 2: الحمايات والبروتوكولات الرقمية | ☀️ المحور 3: الطاقة المتجددة والتقنيات الخضراء | 🚨 المحور 4: الطوارئ والسلامة والأمن السيبراني | 📊 المحور 5: التحليلات والتوأم الرقمي المتقدم |
|:---|:---|:---|:---|:---|
| **Field Operations & SCADA** | **Protection & Protocols** | **Renewables & Microgrid** | **Emergency & Cyber Range** | **Advanced Analytics & 3D Twin** |
| 1. نظرة عامة شاملة (Overview)<br>2. المخطط الأحادي التفاعلي (SLD)<br>3. التوأم الفراغي ثلاثي الأبعاد (3D)<br>4. محاكي الزمن الحقيقي (RTS)<br>5. موازين وتدفق القدرة (Power Flow)<br>6. سجل الاتجاهات المباشر (Trends)<br>7. مراقبة تقادم العزل (Aging)<br>8. كثافة وضغط غاز الـ SF6 | 9. حماية المسافة الرقمية (ANSI 21)<br>10. الحماية التفاضلية (ANSI 87T)<br>11. منحنيات التنسيق الزمني (TCC)<br>12. محاكي بروتوكول 104 (IEC 104)<br>13. مسجلات الاضطرابات (COMTRADE)<br>14. قياسات التزامن الواسع (WAMS)<br>15. ناقل المحطة الرقمي (IEC 61850) | 16. محطة الطاقة الشمسية (Solar PV)<br>17. بطاريات تخزين الطاقة (BESS)<br>18. الشبكة الإقليمية (5-Bus Grid)<br>19. جودة القدرة والتوافقيات (PQ)<br>20. التحميل الديناميكي للخطوط (DTR)<br>21. محطة الهيدروجين الأخضر (H2)<br>22. وصلة التيار المستمر (VSC-HVDC) | 23. إدارة وترشيد الإنذارات (Alarms)<br>24. الإعادة بعد الإظلام (Blackstart)<br>25. تصاريح العزل والسلامة (LOTO)<br>26. محاكي تدريب المشغلين (OTS)<br>27. حقل الأمن السيبراني (NERC-CIP)<br>28. تسلسلات المناورة الآلية (Sequences) | **[الأجنحة التحليلية والتنفيذية]**<br>• التقارير الهندسية والـ PPTX<br>• مؤشر صحة الأصول المحوسب (AHI)<br>• التحليل المالي وتكلفة الامتلاك (TCO)<br>• الجناح التحليلي المتقدم (Advanced)<br>• محرك سيناريوهات الأعطال<br>• سجل البلوكشين المنيع (Blockchain)<br>• كاشف أعطال الكابلات (TDR)<br>• التوأم الاصطناعي الفيزيائي (PINN)<br>• كاشف الأعطال الجغرافي (GIS) |

---

### 📋 التفصيل الوظيفي للمحاور التشغيلية (Detailed Functional Scope)

| المحور التشغيلي (ISA-101 Hub) | النطاق الوظيفي (Functional Scope) | الوحدات والأنظمة الفرعية المدمجة (Modules & Sub-systems) |
|---|---|---|
| **⚡ المحور 1: العمليات الميدانية والتحكم المباشر**<br>*(Field Operations & Direct SCADA)* | التحكم الميداني اللحظي، مراقبة القواطع والفواصِل، القياسات الفورية للطاقة وحرارة الزيت ومستويات غاز الـ SF6. | • **01.** نظرة عامة على المحطة (Substation Overview)<br>• **02.** المخطط الأحادي التفاعلي (Interactive SLD)<br>• **03.** التوأم الفراغي ثلاثي الأبعاد (3D Spatial Twin)<br>• **04.** محاكي الزمن الحقيقي (Real-Time Physics Simulator)<br>• **05.** موازين وتدفق القدرة (Bus Power Flow & Balancing)<br>• **06.** سجل الاتجاهات البيانية (Historical Trends)<br>• **07.** نموذج تقادم العزل الحراري (IEEE C57.91 Insulation Aging)<br>• **08.** نظام مراقبة وضغط غاز الـ SF6 (SF6 Gas Density Monitor) |
| **🛡️ المحور 2: الحمايات والبروتوكولات الرقمية**<br>*(Protection Relays & Telecontrol)* | المرحلات الرقمية متعددة الوظائف، كشف الأعطال اللحظية، محاكاة بروتوكولات الأتمتة والاتصالات الصناعية. | • **09.** حماية المسافة الرقمية خماسية المناطق (ANSI 21 Distance Protection)<br>• **10.** الحماية التفاضلية ثنائية الميل (ANSI 87T Transformer Differential)<br>• **11.** منحنيات التنسيق الزمني للتيار (IEC 60255 / ANSI 51 TCC Curves)<br>• **12.** محاكي بروتوكول الاتصالات عن بُعد (IEC 60870-5-104 Telecontrol Server)<br>• **13.** مسجلات الاضطرابات العابرة (IEEE C37.111 COMTRADE DFR)<br>• **14.** شبكة قياس المتجهات المتزامنة (IEEE C37.118 WAMS / PMU)<br>• **15.** ناقل العمليات والمحطة الرقمي (IEC 61850 Process Bus & GOOSE / SV) |
| **☀️ المحور 3: الطاقة المتجددة والتقنيات الخضراء**<br>*(Renewables, Microgrid & Green Tech)* | إدارة الشبكات الذكية المصغرة، مزارع التوليد الشمسي، بطاريات التخزين، محطات الهيدروجين، وخطوط التيار المستمر. | • **16.** محطة التوليد الكهروضوئي الشمسي (5 MW Solar PV Farm)<br>• **17.** منظومة بطاريات تخزين الطاقة (10 MW / 40 MWh BESS Storage)<br>• **18.** محاكي الشبكة الإقليمية (Regional 5-Bus AC Grid Load Flow)<br>• **19.** جودة القدرة والتحليل الطيفي للتوافقيات (IEEE 519 Power Quality & FFT)<br>• **20.** التحميل الديناميكي للخطوط الهوائية (IEEE 738 Dynamic Line Rating - DTR)<br>• **21.** محطة الهيدروجين الأخضر وخلايا الوقود (2 MW Green H2 PEM Electrolyzer)<br>• **22.** وصلة النقل بالتيار المستمر فائق الجهد (±320 kV VSC-MMC HVDC Intertie) |
| **🚨 المحور 4: الطوارئ والسلامة والأمن السيبراني**<br>*(Emergency, Safety & Cyber Range)* | الاستجابة للطوارئ، إعادة بناء الشبكة بعد الإظلام التام، إجراءات السلامة الصناعية، والتصدي للهجمات السيبرانية. | • **23.** إدارة وترشيد فيضان الإنذارات (ISA-18.2 / IEC 62682 Smart Alarms)<br>• **24.** خطة الإعادة التدريجية بعد الإظلام التام (Blackstart Grid Restoration)<br>• **25.** نظام تصاريح العزل والوسم الآمن (Lockout / Tagout - LOTO Permits)<br>• **26.** محاكي تدريب المشغلين والكوادر الهندسية (Operator Training Simulator - OTS)<br>• **27.** حقل اختبارات الأمن السيبراني للأنظمة الصناعية (NERC-CIP OT Cyber Range)<br>• **28.** تسلسلات المناورة الآلية المبرمجة (Automated Switching Sequences) |
| **📊 المحور 5: التحليلات والتوأم الرقمي المتقدم**<br>*(Advanced Analytics & Spatial Twin)* | الذكاء الاصطناعي الصناعي، الصيانة التنبؤية، التقارير التنفيذية، النمذجة الاقتصادية، وتحديد مواقع الأعطال. | • **الأجنحة التحليلية والتنفيذية:**<br>&nbsp;&nbsp;▫️ التقارير الهندسية التلقائية وعروض الباوربوينت التفاعلية (PPTX & PDF Reports)<br>&nbsp;&nbsp;▫️ حاسبة مؤشر صحة الأصول المحوسب (CIGRE TB 761 Asset Health Index - AHI)<br>&nbsp;&nbsp;▫️ نموذج التكلفة الإجمالية للامتلاك والجدوى الاقتصادية (Total Cost of Ownership - TCO)<br>&nbsp;&nbsp;▫️ الجناح التحليلي المتقدم لمحطة التحويل (Advanced Engineering Analytics Hub)<br>&nbsp;&nbsp;▫️ محرك حقن سيناريوهات الأعطال الحقيقية (Real-Time Fault Scenario Injection)<br>&nbsp;&nbsp;▫️ سجل البلوكشين المنيع للعمليات الحساسة (Immutable SHA-256 Blockchain SIEM)<br>&nbsp;&nbsp;▫️ كاشف أعطال الكابلات بالموجات المنعكسة (IEEE C37.114 TDR Cable Fault Locator)<br>&nbsp;&nbsp;▫️ التوأم الرقمي الاصطناعي الموجه بالفيزياء (Physics-Informed Neural Network - PINN)<br>&nbsp;&nbsp;▫️ كاشف الأعطال الجغرافي المكاني (Substation GIS Spatial Fault Locator) |

---

## 📐 دليل المعادلات الرياضية والفيزيائية المطبقة (Comprehensive Mathematical & Physics Reference)

تم تدقيق وبناء جميع الحسابات الهندسية في النظام لتطابق المعايير والمراجع الدولية:

### 1. تدفق الأحمال بطريقة نيوتن-رافسون القطبية (AC Newton-Raphson Power Flow)

**مصفوفة القبولية ($Y_{bus}$)** بنموذج $\Pi$ المكافئ لخطوط النقل مع شحن المكثفات:

$$
Y_{ii} = \sum_{k \in \Omega_i} \left(\frac{1}{R_{ik} + j X_{ik}} + j \frac{B_{ik}^{charging}}{2}\right), \quad Y_{ij} = -\frac{1}{R_{ij} + j X_{ij}}
$$

**معادلات حقن القدرة المحسوبة في العقد (Active & Reactive Power Injections)**:

$$
\begin{aligned}
P_i &= V_i \sum_{j=1}^{n} V_j \left(G_{ij} \cos\theta_{ij} + B_{ij} \sin\theta_{ij}\right) \\
Q_i &= V_i \sum_{j=1}^{n} V_j \left(G_{ij} \sin\theta_{ij} - B_{ij} \cos\theta_{ij}\right)
\end{aligned}
$$

حيث زاوية فرق الطور $\theta_{ij} = \theta_i - \theta_j$.

**مصفوفة الجاكوبي القطبية الكاملة (Polar Jacobian Matrix)**:

$$
J = \begin{bmatrix} H & N \\ J & L \end{bmatrix} = \begin{bmatrix} \frac{\partial P}{\partial \theta} & \frac{\partial P}{\partial V} \\ \frac{\partial Q}{\partial \theta} & \frac{\partial Q}{\partial V} \end{bmatrix}
$$

عناصر مصفوفة الجاكوبي خارج القطر الرئيسي ($j \neq i$):

$$
\begin{aligned}
H_{ij} &= \frac{\partial P_i}{\partial \theta_j} = V_i V_j \left(G_{ij} \sin\theta_{ij} - B_{ij} \cos\theta_{ij}\right) \\
N_{ij} &= V_j \frac{\partial P_i}{\partial V_j} = V_i V_j \left(G_{ij} \cos\theta_{ij} + B_{ij} \sin\theta_{ij}\right) \\
J_{ij} &= \frac{\partial Q_i}{\partial \theta_j} = -V_i V_j \left(G_{ij} \cos\theta_{ij} + B_{ij} \sin\theta_{ij}\right) \\
L_{ij} &= V_j \frac{\partial Q_i}{\partial V_j} = V_i V_j \left(G_{ij} \sin\theta_{ij} - B_{ij} \cos\theta_{ij}\right)
\end{aligned}
$$

عناصر مصفوفة الجاكوبي على القطر الرئيسي ($j = i$):

$$
\begin{aligned}
H_{ii} &= \frac{\partial P_i}{\partial \theta_i} = -Q_i - B_{ii} V_i^2 \\
N_{ii} &= V_i \frac{\partial P_i}{\partial V_i} = P_i + G_{ii} V_i^2 \\
J_{ii} &= \frac{\partial Q_i}{\partial \theta_i} = P_i - G_{ii} V_i^2 \\
L_{ii} &= V_i \frac{\partial Q_i}{\partial V_i} = Q_i - B_{ii} V_i^2
\end{aligned}
$$

تدعم الخوارزمية التبديل التلقائي لعقد المولدات $PV \to PQ$ عند تجاوز حدود القدرة غير الفعالة ($Q_{min}, Q_{max}$) ودراسات الحوادث الفردية ($N-1$ Contingency Ranking).

---

### 2. حسابات تيار القصر القياسية (IEC 60909-0 Short-Circuit Analysis)

**معامل الجهد ($c$)**: $c_{max} = 1.10$ و $c_{min} = 1.00$ للجهود العالية والمتوسطة ($U_n > 1\text{ kV}$).

**معاوقة المغذي الشبكي الأولي ($Z_Q$)**:

$$
|Z_Q| = \frac{c \cdot U_n^2}{S_k''}, \quad X_Q = \frac{|Z_Q|}{\sqrt{1 + (R/X)^{-2}}}, \quad R_Q = \frac{X_Q}{X/R}
$$

**معامل تصحيح معاوقة المحول ($K_T$) طبقاً للبند 3.3.3**:

$$
K_T = 0.95 \frac{c_{max}}{1 + 0.6 \cdot x_T}
$$

**تيارات القصر المتناظرة وغير المتناظرة**:

$$
\begin{aligned}
I_k'' &= \frac{c \cdot U_n}{\sqrt{3} |Z_1|} \quad &&\text{(تيار القصر المتناظر الأولي ثلاثي الأطوار)} \\
I_{k1}'' &= \frac{\sqrt{3} c \cdot U_n}{|2 Z_1 + Z_0|} \quad &&\text{(تيار القصر الأرضي أحادي الطور SLG)} \\
i_p &= \kappa \sqrt{2} I_k'' \quad &&\text{(تيار الذروة الأقصى للقصر)} \\
\kappa &= 1.02 + 0.98 e^{-3 R / X} \quad &&\text{(معامل الذروة الديناميكي)} \\
T_a &= \frac{X}{\omega R} \quad &&\text{(الثابت الزمني للتيار المستمر العابر)}
\end{aligned}
$$

---

### 3. تحليل المركبات المتماثلة وتحويل فورتسكو (Fortescue Transformation)

مشغل الإزاحة الطورية بزاوية $120^\circ$:

$$
a = e^{j 120^\circ} = -\frac{1}{2} + j \frac{\sqrt{3}}{2}, \quad a^2 = e^{j 240^\circ} = -\frac{1}{2} - j \frac{\sqrt{3}}{2}
$$

**التحويل الأمامي (الأطوار إلى المركبات المتماثلة الصفرية والموجبة والسالبة)**:

$$
\begin{bmatrix} I_0 \\ I_1 \\ I_2 \end{bmatrix} = \frac{1}{3} \begin{bmatrix} 1 & 1 & 1 \\ 1 & a & a^2 \\ 1 & a^2 & a \end{bmatrix} \begin{bmatrix} I_a \\ I_b \\ I_c \end{bmatrix}
$$

**التحويل العكسي (المركبات المتماثلة إلى تيارات الأطوار الثلاثة)**:

$$
\begin{bmatrix} I_a \\ I_b \\ I_c \end{bmatrix} = \begin{bmatrix} 1 & 1 & 1 \\ 1 & a^2 & a \\ 1 & a & a^2 \end{bmatrix} \begin{bmatrix} I_0 \\ I_1 \\ I_2 \end{bmatrix}
$$

**شروط حدود دارات الأعطال المركبة**:

$$
\begin{aligned}
\text{3-Phase (3PH):} \quad & I_1 = \frac{V_f}{Z_1}, \quad I_2 = 0, \quad I_0 = 0 \\
\text{Single Line-to-Ground (SLG):} \quad & I_1 = I_2 = I_0 = \frac{V_f}{Z_1 + Z_2 + Z_0} \\
\text{Line-to-Line (LL):} \quad & I_1 = \frac{V_f}{Z_1 + Z_2}, \quad I_2 = -I_1, \quad I_0 = 0 \\
\text{Double Line-to-Ground (LLG):} \quad & I_1 = \frac{V_f}{Z_1 + \frac{Z_2 \cdot Z_0}{Z_2 + Z_0}}, \quad I_2 = -I_1 \frac{Z_0}{Z_2 + Z_0}, \quad I_0 = -I_1 \frac{Z_2}{Z_2 + Z_0}
\end{aligned}
$$

---

### 4. معادلة التأرجح والاستقرار اللحظي (Swing Equation & Equal-Area Criterion)

**معادلة التأرجح الميكانيكية-الكهربائية للآلة المتزامنة**:

$$
\frac{2H}{\omega_s} \frac{d^2\delta}{dt^2} = P_m - P_e - \frac{D}{\omega_s} \frac{d\delta}{dt}
$$

حيث $H$ ثابت القصور الذاتي بالثواني، $P_m$ القدرة الميكانيكية، $P_e = P_{max} \sin\delta$ القدرة الكهربائية المنقولة، $D$ معامل التخميد، و $\omega_s = 2\pi f$.

يتم حل المعادلة عبر تكامل **Runge-Kutta من الدرجة الرابعة (RK4)** وحساب زاوية الاستقرار الحرجة لمعيار المساحتين المتساويتين:

$$
\cos\delta_{cr} = -\cos\delta_0 + \frac{P_m}{P_{max}} (\pi - 2\delta_0)
$$

حيث زاوية التشغيل المرجعية $\delta_0 = \arcsin(P_m / P_{max})$.

---

### 5. النموذج الحراري وتقادم العزل (IEEE C57.91 / IEC 60076-7)

**نسبة الفواقد الكلية ($K = I / I_{rated}$)**:

$$
\text{Loss Ratio} = \frac{1 + R \cdot K^2}{1 + R}, \quad R = \frac{P_k}{P_0} = \frac{180\text{ kW}}{42\text{ kW}} = 4.286
$$

**ارتفاع حرارة الزيت العلوي فوق الجو المحيط ($\Delta\Theta_{TO}$)**:

$$
\Delta\Theta_{TO} = \Delta\Theta_{TO,rated} \times \left(\frac{1 + R \cdot K^2}{1 + R}\right)^x
$$

**حرارة النقطة الساخنة لملفات المحول ($\Theta_H$)**:

$$
\Theta_H = \Theta_{TO} + H_{factor} \cdot g_r \cdot K^y
$$

حيث $g_r$ فرق الحرارة المقنن بين الملفات والزيت، و $x, y$ أسس التبريد لنظام ONAN/ONAF.

**معامل تسارع التقادم الحراري الأرهينيوس (Arrhenius Aging Factor $F_{AA}$)**:

$$
F_{AA} = \exp\left(\frac{15000}{383.15} - \frac{15000}{\Theta_H + 273.15}\right)
$$

**فقدان العمر الافتراضي اليومي للعازل (\% LOL)** على أساس عمر تصميمي مقداره 180,000 ساعة:

$$
\text{LOL}_{24h} (\%) = \frac{F_{AA} \times 24}{180,000} \times 100\%
$$

**تدهور درجة بلمرة ورق الكرافت العازل (Degree of Polymerization - DP)**:

$$
\text{DP} = \max\left(200, \min\left(1200, \text{round}(780 - (F_{AA} - 1.0) \times 45)\right)\right)
$$

---

### 6. التنسيق الزماني-التياري لمنحنيات الحماية (IEC 60255-151)

زمن تشغيل مرحل الحماية من زيادة التيار (IDMT Overcurrent Characteristic):

$$
t = \text{TMS} \times \frac{A}{\left(\frac{I}{I_s}\right)^p - 1}
$$

معاملات المنحنيات الدولية القياسية:
- **Standard Inverse (SI)**: $A = 0.14, \quad p = 0.02$
- **Very Inverse (VI)**: $A = 13.5, \quad p = 1.00$
- **Extremely Inverse (EI)**: $A = 80.0, \quad p = 2.00$
- **Long-Time Inverse (LTI)**: $A = 120.0, \quad p = 1.00$

هامش التمييز الزمني (Grading Margin): $\Delta t = t_{upstream} - t_{downstream} \ge 0.30\text{ s}$.

---

### 7. الحماية التفاضلية الرقمية للمحولات (ANSI 87T Dual-Slope Curve)

تيار التفاضل وتيار الكبح الاستقراري:

$$
I_{diff} = |\vec{I}_1 + \vec{I}_2|, \quad I_{bias} = \frac{|\vec{I}_1| + |\vec{I}_2|}{2}
$$

حد الفصل المتغير ثنائي الميل (Dual-Slope Trip Threshold):

$$
I_{diff,thresh}(I_{bias}) = \begin{cases} 
I_{s1} & \text{if } I_{bias} \le I_{s1} \\ 
I_{s1} + K_1 (I_{bias} - I_{s1}) & \text{if } I_{s1} < I_{bias} \le I_{s2} \\ 
I_{s1} + K_1 (I_{s2} - I_{s1}) + K_2 (I_{bias} - I_{s2}) & \text{if } I_{bias} > I_{s2} 
\end{cases}
$$

كبح التوافقيات لمنع الفصل الخاطئ: التوافقية الثانية لتيار التمغنط المفاجئ ($I_{2nd} \ge 15\%$) والتوافقية الخامسة لفرط الإثارة المغناطيسية ($I_{5th} \ge 30\%$).

---

### 8. حماية المسافة الرقمية (ANSI 21 Distance Protection)

المعاوقة المحسوبة المقاسة في المرحل:

$$
Z_m = R_m + j X_m = \frac{V_{relay}}{I_{relay}}
$$

**منحنى Mho الدائري الذاتي الاستقطاب**: مركزه $(R_c, X_c) = (R_{reach}/2, X_{reach}/2)$ ونصف قطره $r = |Z_{reach}| / 2$:

$$
(R_m - R_c)^2 + (X_m - X_c)^2 \le r^2
$$

**المنحنى الرباعي (Quadrilateral)**: حدود مفاعلة مستقلة ($X \le X_{reach}$) وحدود مقاومة مستقلة ($R \le R_{blinder}$) لمنع الفصل عند مقاومة القوس أو ملامسة الأشجار.

**حاجب تداخل الأحمال (Load Encroachment Blinder)**: منع التعثر في منطقة الحمل الثقيل عندما يكون $R_m < R_{load}$ وزاوية المعاوقة $|\phi| < \phi_{load}$.

---

### 9. التوافقية وخفض قدرة المحولات (IEEE C57.110 K-Factor & Derating)

**معامل التوافقيات K-Factor**:

$$
K = \frac{\sum_{h=1}^{h_{max}} I_h^2 \cdot h^2}{\sum_{h=1}^{h_{max}} I_h^2} = \frac{1 + \sum_{h > 1} \left(\frac{I_h}{I_1}\right)^2 h^2}{1 + \text{THD}_I^2}
$$

**نسبة خفض سعة المحول لتجنب فرط الإحماء (Derating Factor)**:

$$
\text{Derating} = \sqrt{\frac{1 + P_{EC-R}}{1 + K \cdot P_{EC-R}}} \times 100\%
$$

حيث $P_{EC-R} \approx 0.15$ معامل فواقد التيارات الدوامية النسبية للمحول الاسمي.

---

### 10. حسابات طاقة ومخاطر الوميض القوسي (IEEE 1584-2018 & NFPA 70E Arc Flash)

تيار القوس الكهربائي المتوقع: $I_{arc} \approx I_{bf} \times 0.92$ لقضبان الجهد العالي 132kV، و $I_{arc} \approx I_{bf} \times 0.85$ لقضبان الجهد المتوسط 13.8kV.

الطاقة الصادمة الصادرة عن القوس (Incident Energy $E$):

$$
E = \frac{4.184 \times C_f \times I_{arc}^{0.95} \times t}{2.5} \times \left(\frac{36}{D}\right) \quad [\text{cal/cm}^2]
$$

حيث $C_f = 1.4$ للجهد العالي 132kV و $1.1$ للجهد المتوسط 13.8kV، و $t$ زمن إطفاء القوس بالثواني، و $D$ مسافة العمل بالبوصة ($D \ge 12\text{ in}$).

مسافة حدود الوميض القوسي الآمنة (Arc Flash Boundary حيث $E = 1.2\text{ cal/cm}^2$):

$$
D_B = D \times \sqrt{\frac{E}{1.2}}
$$

---

### 11. خوارزمية تاكاجي لتحديد موقع العطل (IEEE C37.114 Takagi Fault Locator)

حساب المسافة النسبية للعطل ($d$) بإلغاء تأثير مقاومة العطل القوسي ($R_F$) عبر التراكب مع التيار التفاضلي المسبق $\Delta I_s^\ast$:

$$
d = \frac{\text{Im}\left(V_s \cdot \Delta I_s^\ast\right)}{\text{Im}\left(Z_L \cdot I_s \cdot \Delta I_s^\ast\right)}
$$

حيث $V_s$ جهد البداية، $I_s$ تيار العطل المقاس، $Z_L$ المعاوقة الكلية للخط، و $\Delta I_s^\ast$ المرافق العقدي لتيار التراكب ($\Delta I_s = I_{fault} - I_{prefault}$).

---

### 12. محطة الهيدروجين الأخضر وخلايا الوقود (PEM Electrolyzer & Fuel Cell)

معدل إنتاج الهيدروجين الأخضر:

$$
V_{H2} = \frac{P_{elec} \cdot \eta_{PEM}}{4.5\text{ kWh/Nm}^3}
$$

حيث كثافة الهيدروجين في الشروط المعيارية $\rho = 0.08988\text{ kg/Nm}^3$.

استهلاك الماء النقي: $9.0\text{ Liters } \text{H}_2\text{O} / \text{kg } \text{H}_2$ طبقاً للمعادلة الكيميائية الكهروكيميائية: $2\text{H}_2\text{O} \to 2\text{H}_2 + \text{O}_2$.

معدل استهلاك الهيدروجين في خلايا الوقود:

$$
\text{Rate (kg/h)} = \frac{P_{FC,kW}}{33.33 \times \eta_{FC}}
$$

حيث القيمة الحرارية الدنيا للهيدروجين $LHV = 33.33\text{ kWh/kg}$.

---

### 13. وصلة التيار المستمر عالي الجهد (VSC-HVDC / MMC Intertie)

التحويل في إطار $d-q$ المتزامن لضبط القدرة الفعالة والردية:

$$
\begin{aligned}
P &= \frac{3}{2} (V_d I_d + V_q I_q) \implies I_d = \frac{P}{1.5 V_d} \\
Q &= \frac{3}{2} (V_q I_d - V_d I_q) \implies I_q = -\frac{Q}{1.5 V_d}
\end{aligned}
$$

معامل التضمين للمحولات الجهدية متعددة المستويات:

$$
M_a = \frac{2\sqrt{2} V_{AC,LL}}{\sqrt{3} V_{DC}} \approx \frac{V_{AC} \sqrt{2} \times 1.1547}{V_{DC}}
$$

الاستجابة الترددية بالقصور الذاتي الاصطناعي (Synthetic Inertia Support):

$$
\Delta P = 2 H \frac{df}{dt} \cdot S_{base}
$$

---

### 14. كاشف أعطال الكابلات بالموجات المنعكسة (TDR Cable Fault Locator)

سرعة انتشار النبضة الكهرومغناطيسية داخل كابل الـ XLPE:

$$
v = \frac{c}{\sqrt{\varepsilon_r}} = \frac{299,792.458}{\sqrt{2.3}} \approx 197.68\text{ m/}\mu\text{s}
$$

معامل الانعكاس الموجي:

$$
\Gamma = \frac{Z_L - Z_0}{Z_L + Z_0} \quad (\Gamma = -1 \text{ في القصر، و } +1 \text{ في القطع})
$$

المسافة الدقيقة حتى نقطة العطل من زمن ارتداد النبضة $\Delta t$:

$$
d = \frac{v \cdot \Delta t}{2}
$$

---

### 15. الصيانة التنبؤية بالتوأم الرقمي PINN وتوزيع وايبل (Weibull Reliability)

متوسط الوقت بين الأعطال (Mean Time to Failure - MTTF) لتوزيع وايبل:

$$
\text{MTTF} = \eta \cdot \Gamma\left(1 + \frac{1}{\beta}\right)
$$

حيث $\eta = 185,000\text{ hours}$ معامل المقياس، $\beta = 2.4$ معامل الشكل (مرحلة الاهتراء والتقادم المتقدم Wear-out)، و $\Gamma(\cdot)$ دالة غاما الرياضية.

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

## 🏛️ بنية التوأم الفراغي ثلاثي الأبعاد والنمذجة الإجرائية (3D Procedural Digital Twin & CSG Architecture)

تمت ترقية وبناء محرك التوأم الفراغي ثلاثي الأبعاد وفق أرقى المعايير الهندسية والبرمجية المعتمدة في **Three.js** وعلوم التصميم بمساعدة الحاسوب (CAD/BIM WebGL Integration):

### 1. معايير الإحداثيات والتسلسل الشجري (Coordinate Standards & Hierarchy)
- **مقياس الرسم الفراغي المعياري**: اعتماد $1\text{ Unit} = 1\text{ Meter}$ كوحدة قياس فيزيائية حقيقية لكافة معدات الساحة (خلوص الأمان الأرضي $3.55\text{ m}$، ارتفاع الأعمدة الشبكية $10.5\text{ m}$، أبعاد حوض المحول $6.4\times 4.2\times 4.0\text{ m}$).
- **نظام الإحداثيات اليميني**: محور $Y$ للأعلى، محور $X$ لليمين، ومحور $Z$ باتجاه الكاميرا.
- **التنظيم الشجري للمجموعات (Hierarchical THREE.Group Nodes)**: تم فصل المكونات الفرعية لكل معدة في مجموعات عقد مستقلة تتيح التحريك الميكانيكي والانحناءات المفصلية بمحاور دوران موضعية دقيقة (`plinthGroup`, `tankGroup`, `coreAndWindingsGroup`, `conservatorGroup`, `radiatorGroup`, `oltcGroup`, `bushingGroup`).
- **محاذاة النقاط المحورية**: استخدام `geometry.center()` و `geometry.translate()` لضبط مراكز الثقل ومفاصل الدوران دون الحاجة لتشويه المقاييس بالمجموعات الأبوية.

### 2. النمذجة الإجرائية والمعلمية (Procedural & Parametric Geometries)
- **عوازل الخزف الدوارة (THREE.LatheGeometry)**:
  - استبدال النماذج التبسيطية بتوليد هندسي ثلاثي الأبعاد متماثل دورانياً لعوازل الاختراق وخلايا القواطع بناءً على مقطع ثنائي الأبعاد ($2\text{D Profile}$) مكوّن من نقاط `THREE.Vector2`.
  - تطبيق مظلات إيروديناميكية معيارية بموجب المواصفة **IEC 60815** مزودة بشفاه تقطير سفلية مانعة لتشكل المسارات المائية المستمرة تحت المطر والتلوث الملحي.
- **الجسور والقطاعات الفولاذية بالبثق ثنائي الأبعاد (THREE.ExtrudeGeometry & THREE.Shape)**:
  - توليد جسور السكك الحديدية والحوامل الهيكلية بدقة وفق قطاع **I-Beam (Universal Beams)** وقطاعات مجاري الفولاذ **C-Channel** مع شطف الحواف المعياري (`bevelEnabled: true`).
  - صفائح التثبيت الفولاذية المثقوبة لتمرير براغي التثبيت الخرسانية عبر مسارات مفرغة `THREE.Path` مطروحة من الشكل الرئيسي.
- **المعالجة الرياضية للمصفوفات المترابطة (Custom BufferGeometry)**:
  - حساب متجهات التعامد السطحي `computeVertexNormals()` وكرات الإحاطة المكانية `computeBoundingSphere()` لضمان الانعكاس الضوئي الصحيح.

### 3. العمليات البولينية ثلاثية الأبعاد (Constructive Solid Geometry - CSG)
- **المحرك البوليني**: دمج مكتبة `three-bvh-csg` لتطبيق عمليات الطرح البوليني المباشر في المتصفح باستخدام كائنات `Brush` ومُقيّم `Evaluator` بالعملية `SUBTRACTION`.
- **المقطع الهندسي التفصيلي (Technical Cutaway Visualization)**:
  - عند تفعيل وضع المقطع الهندسي `CUTAWAY`، يتم تفريغ الربع الأمامي لحوض المحول الفولاذي وغطائه العلوي بكامل الدقة.
  - **منع تداخل السطوح (Anti-Z-Fighting Epsilon)**: تمديد فرشاة القطع بمقدار إبسلون فيزيائي ($\epsilon = +0.005\text{ m}$) لضمان عدم تطابق الأوجه في مخزن العمق (Depth Buffer) وتلافي وميض الـ Z-fighting.
  - **الكشف عن الأجزاء الكهروميكانيكية الداخلية**:
    - **القلب المغناطيسي ثلاثي الأعمدة**: رقائق فولاذ السيليكون الموجّهة بلورياً (CRGO Silicon Steel) مع النير العلوي والسفلي وهياكل الشد الميكانيكية.
    - **الملفات متحدة المركز (Concentric Windings)**: ملفات الجهد المنخفض الداخلية، وقنوات تدوير زيت التبريد، وملفات الجهد العالي الخارجية من النحاس الإلكتروليتي مع أطواق العزل الورقية المضغوطة (Pressboard Spacers).
    - **قواطع مغير الجهد والوصلات النحاسية**: وصلات الجهد العالي الصاعدة لقواعد العوازل، ومجمع الجهد المنخفض، وقفص مغير الجهد تحت الحمل (OLTC).
    - **الزيت العازل**: كتلة الزيت المعدني بمظهر شبه شفاف مع معامل انكسار فيزيائي $n = 1.482$.
  - **فتحات التفتيش والمنافذ الميكانيكية**: حفر فتحات أغطية التفتيش (Inspection Manholes) عبر الطرح البوليني لأسطوانة التفريغ من طوق التثبيت.

### 4. الإكساء الفيزيائي والإضاءة الاحترافية (PBR Materials & Color Pipeline)
- **فصل خواص المواد العازلة والموصلة (Dielectrics vs. Conductors)**:
  - دهان حوض المحول ومجاري الكابلات: مواد عازلة للضوء بصلادة عاكسة (`metalness: 0.18`, `roughness: 0.48`, `clearcoat: 0.35`).
  - الخزف المزجج: إكساء عازل فائق اللمعان الزجاجي (`metalness: 0.04`, `roughness: 0.18`, `clearcoat: 0.9`).
  - النحاس والألمنيوم والفولاذ المجلفن: مواد فائقة الناقلية المعدنية (`metalness: 0.85 - 0.95`, `roughness: 0.22 - 0.38`).
- **إدارة الألوان ورسم النغمات الضوئية**:
  - `renderer.toneMapping = THREE.ACESFilmicToneMapping` لمحاكاة الاستجابة السينمائية للعين البشرية ومنع احتراق المناطق شديدة الإضاءة.
  - `renderer.outputColorSpace = THREE.SRGBColorSpace` لضمان التحويل اللوني الدقيق من الفضاء الخطي (Linear) إلى فضاء العرض (sRGB).
  - إضاءة محيطية مبنية على الصورة (IBL) مولدة عبر `PMREMGenerator` من قبة السماء لضمان عدم ظهور الأسطح المعدنية باللون الأسود الداكن تحت أي ظرف إضاءة.

### 5. إدارة الذاكرة وتخفيض نداءات الرسم (WebGL Memory Management & GPU Instancing)
- **تقنية الرسم بالنماذج المكررة (THREE.InstancedMesh)**:
  - زعانف التبريد في بنوك المشعات (Radiator Cooling Fins): دمج ما يزيد عن 120 زعنفة تبريد عبر `InstancedMesh` ليتم رسمها في **نداء رسم واحد فقط (Single Draw Call)** بدلاً من 120 نداء منفصل.
  - براغي التثبيت الهيكلية السداسية (Foundation Anchor Bolts): دمج كافة براغي التثبيت الموزعة على قواعد المحول والقواطع في نداء رسم واحد.
- **التفريغ الدوري الآمن (Explicit GPU Disposal)**:
  - التخلص الجذري من كافة الهندسيات (`geometry.dispose()`) والمواد وخرائط الإكساء (`texture.dispose()`) وقنوات الإضاءة ومخازن الرندر المؤقتة فور تفكيك المكون أو الانتقال بين أوضاع العرض لمنع أي تسريب لذاكرة البطاقة الرسومية (VRAM Leaks).

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
