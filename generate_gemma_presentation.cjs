const fs = require('fs');
const path = require('path');
const PptxGenJS = require('pptxgenjs');

async function buildGemmaPresentation() {
  const pptx = new PptxGenJS();
  
  // 16:9 Widescreen Layout (13.33 x 7.5 inches)
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = 'SCADA & SAS Digital Twin 132/13.8 kV Platform';
  pptx.author = 'Eng. Haedara Deeb & Eng. Essa Najjar';
  pptx.company = 'Tishreen University - Faculty of Mechanical & Electrical Engineering';

  const BG_DARK = '0B0F19';
  const CARD_BG = '111827';
  const CARD_BORDER = '334155';
  const ACCENT_BLUE = '4285F4';
  const ACCENT_CYAN = '38BDF8';
  const ACCENT_GREEN = '10B981';
  const ACCENT_AMBER = 'F59E0B';
  const ACCENT_PURPLE = '818CF8';
  const ACCENT_ROSE = 'F43F5E';
  const TEXT_WHITE = 'FFFFFF';
  const TEXT_MUTED = '94A3B8';
  const TEXT_SUBTLE = '64748B';

  const imagesDir = path.join(__dirname, 'doc_images');

  function addHeader(slide, categoryTag, titleAr, subtitleEn, accentColor = ACCENT_CYAN) {
    // Top category badge pill
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.8,
      y: 0.4,
      w: 3.8,
      h: 0.32,
      rectRadius: 0.16,
      fill: { color: '1E293B' },
      line: { color: accentColor, width: 1 }
    });
    slide.addText(categoryTag, {
      x: 0.8,
      y: 0.4,
      w: 3.8,
      h: 0.32,
      fontSize: 10,
      fontFace: 'Arial',
      color: accentColor,
      bold: true,
      align: 'center',
      valign: 'middle'
    });

    // Main Title (Arabic)
    slide.addText(titleAr, {
      x: 0.8,
      y: 0.78,
      w: 11.7,
      h: 0.55,
      fontSize: 19,
      fontFace: 'Arial',
      color: TEXT_WHITE,
      bold: true,
      align: 'left',
      valign: 'middle'
    });

    // Subtitle (English)
    slide.addText(subtitleEn, {
      x: 0.8,
      y: 1.33,
      w: 11.7,
      h: 0.35,
      fontSize: 11.5,
      fontFace: 'Calibri',
      color: TEXT_MUTED,
      italic: true,
      align: 'left',
      valign: 'top'
    });
  }

  function addFooter(slide, slideNum, totalSlides = 20) {
    slide.addShape(pptx.shapes.LINE, {
      x: 0.8,
      y: 7.0,
      w: 11.73,
      h: 0,
      line: { color: '1E293B', width: 1 }
    });
    slide.addText('⚡ SCADA & SAS Digital Twin 132/13.8 kV • Industrial OT Automation & Cybersecurity Testbed', {
      x: 0.8,
      y: 7.05,
      w: 8.5,
      h: 0.3,
      fontSize: 9,
      fontFace: 'Calibri',
      color: TEXT_SUBTLE
    });
    slide.addText(`Slide ${slideNum} of ${totalSlides}`, {
      x: 10.0,
      y: 7.05,
      w: 2.5,
      h: 0.3,
      fontSize: 9,
      fontFace: 'Calibri',
      color: TEXT_SUBTLE,
      align: 'right'
    });
  }

  function addImageFrame(slide, imgPath, x = 6.8, y = 1.8, w = 5.7, h = 4.9) {
    if (fs.existsSync(imgPath)) {
      // Outer card background with border
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: x - 0.08,
        y: y - 0.08,
        w: w + 0.16,
        h: h + 0.16,
        rectRadius: 0.12,
        fill: { color: CARD_BG },
        line: { color: CARD_BORDER, width: 1.5 },
        shadow: { type: 'outer', color: '000000', blur: 10, offset: 4, angle: 90, opacity: 0.5 }
      });
      // Image itself
      slide.addImage({
        path: imgPath,
        x: x,
        y: y,
        w: w,
        h: h,
        rounding: true
      });
    }
  }

  function addBulletCard(slide, x, y, w, h, iconText, title, desc, tagColor = ACCENT_CYAN) {
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: x,
      y: y,
      w: w,
      h: h,
      rectRadius: 0.1,
      fill: { color: CARD_BG },
      line: { color: CARD_BORDER, width: 1 }
    });

    slide.addText(iconText, {
      x: x + 0.15,
      y: y + 0.12,
      w: 0.4,
      h: 0.35,
      fontSize: 14,
      align: 'center',
      valign: 'middle'
    });

    slide.addText(title, {
      x: x + 0.6,
      y: y + 0.1,
      w: w - 0.75,
      h: 0.35,
      fontSize: 12,
      fontFace: 'Arial',
      color: tagColor,
      bold: true,
      valign: 'middle'
    });

    slide.addText(desc, {
      x: x + 0.2,
      y: y + 0.48,
      w: w - 0.4,
      h: h - 0.55,
      fontSize: 10.5,
      fontFace: 'Calibri',
      color: TEXT_MUTED,
      valign: 'top'
    });
  }

  console.log('Building Google Gemma-Style Slide Deck (20 Slides)...');

  // =========================================================================
  // SLIDE 1: HERO TITLE SLIDE (Google DeepMind / Gemma Style)
  // =========================================================================
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_DARK };

    // Ambient glow shape
    slide.addShape(pptx.shapes.OVAL, {
      x: 8.5,
      y: -1.0,
      w: 6.0,
      h: 6.0,
      fill: { color: '1E3A8A' },
      line: { color: '1E3A8A', width: 0 }
    });

    // Category Pill
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 1.0,
      y: 0.9,
      w: 4.8,
      h: 0.38,
      rectRadius: 0.19,
      fill: { color: '1E293B' },
      line: { color: ACCENT_BLUE, width: 1.5 }
    });
    slide.addText('⚡ GRADUATION THESIS • RESEARCH & DEVELOPMENT 2026', {
      x: 1.0,
      y: 0.9,
      w: 4.8,
      h: 0.38,
      fontSize: 10.5,
      fontFace: 'Arial',
      color: ACCENT_CYAN,
      bold: true,
      align: 'center',
      valign: 'middle'
    });

    // Hero Title
    slide.addText('منظومة التوأم الرقمي للتحكم الإشرافي وأتمتة محطات التحويل (132/13.8 ك.ف)', {
      x: 1.0,
      y: 1.45,
      w: 11.3,
      h: 1.1,
      fontSize: 26,
      fontFace: 'Arial',
      color: TEXT_WHITE,
      bold: true,
      align: 'left'
    });

    // English Subtitle
    slide.addText('SCADA & Substation Automation System (SAS) Digital Twin Platform with Multi-Dimensional 3D Spatial Modeling, Physics Solvers & OT Cybersecurity Range', {
      x: 1.0,
      y: 2.6,
      w: 11.3,
      h: 0.7,
      fontSize: 14,
      fontFace: 'Calibri',
      color: ACCENT_CYAN,
      italic: true
    });

    // Metadata 3-Card Box Grid
    const cards = [
      { title: 'إعداد المهندسين (Authors)', text: '• م. حيدرة ديب (SAS Architect)\n• م. عيسى نجار (Cyber & Control)', color: ACCENT_CYAN },
      { title: 'الإشراف الأكاديمي (Supervisor)', text: '• الدكتورة المهندسة: د.م. بشرى\n• كلية الهندسة الميكانيكية والكهربائية', color: ACCENT_GREEN },
      { title: 'الجامعة والعام الأكاديمي', text: '• جامعة تشرين — قسم القوى والتحكم\n• العام الجامعي: 2025 - 2026 م', color: ACCENT_PURPLE }
    ];

    cards.forEach((c, idx) => {
      const cx = 1.0 + idx * 3.85;
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: cx,
        y: 3.6,
        w: 3.6,
        h: 1.6,
        rectRadius: 0.12,
        fill: { color: CARD_BG },
        line: { color: CARD_BORDER, width: 1.2 }
      });
      slide.addText(c.title, {
        x: cx + 0.2,
        y: 3.75,
        w: 3.2,
        h: 0.35,
        fontSize: 11.5,
        fontFace: 'Arial',
        color: c.color,
        bold: true
      });
      slide.addText(c.text, {
        x: cx + 0.2,
        y: 4.15,
        w: 3.2,
        h: 0.9,
        fontSize: 10.5,
        fontFace: 'Calibri',
        color: TEXT_MUTED
      });
    });

    // Bottom KPI Highlights bar
    const kpis = [
      { label: 'Voltage Levels', val: '132 / 13.8 kV' },
      { label: 'Transformers', val: '2 × 40 MVA' },
      { label: 'Smart Hubs', val: '5 Hubs / 28 Mod' },
      { label: 'Standard Bus', val: 'IEC 61850' },
      { label: 'Sync Latency', val: '< 12 ms' }
    ];

    kpis.forEach((k, idx) => {
      const kx = 1.0 + idx * 2.32;
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: kx,
        y: 5.5,
        w: 2.15,
        h: 0.95,
        rectRadius: 0.1,
        fill: { color: '1E293B' },
        line: { color: '334155', width: 1 }
      });
      slide.addText(k.val, {
        x: kx,
        y: 5.6,
        w: 2.15,
        h: 0.45,
        fontSize: 14,
        fontFace: 'Arial',
        color: ACCENT_BLUE,
        bold: true,
        align: 'center'
      });
      slide.addText(k.label, {
        x: kx,
        y: 6.05,
        w: 2.15,
        h: 0.3,
        fontSize: 9,
        fontFace: 'Calibri',
        color: TEXT_MUTED,
        align: 'center'
      });
    });

    addFooter(slide, 1);
  }

  // =========================================================================
  // SLIDE 2: THE DIGITAL REVOLUTION & PROBLEM CONTEXT
  // =========================================================================
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_DARK };
    addHeader(slide, '01 • STRATEGIC CONTEXT', 'التحول الاستراتيجي نحو المحطات الرقمية الذكية', 'Next-Generation Digital Substations: Overcoming Traditional SCADA Limitations');

    addBulletCard(slide, 0.8, 1.8, 5.7, 1.5, '⚡', 'الرؤية المكانية والتوأم ثلاثي الأبعاد (3D Spatial Context)', 'تجاوز شاشات المراقبة الثنائية الجامدة بتمثيل فراغي ثلاثي الأبعاد يحاكي ساحة المفاتيح 132 ك.ف وتوزع الحرارة اللحظي بدقة متناهية.', ACCENT_CYAN);
    addBulletCard(slide, 0.8, 3.45, 5.7, 1.5, '🛡️', 'الدمج بين المراقبة والنماذج الحمايتية المعيارية', 'محاكاة تفاعلية لسلوك المرحلات الرقمية (ANSI 87T, 21, TCC) واختبار قرارات الفصل التلقائي قبل حدوث الأعطال الميدانية.', ACCENT_GREEN);
    addBulletCard(slide, 0.8, 5.1, 5.7, 1.5, '🚨', 'حقل اختبارات للأمن السيبراني الصناعي (OT Cyber Range)', 'حماية بنية التحكم التحتية وفق معايير NERC-CIP وإطار MITRE ATT&CK for ICS مع الكشف الآلي عن هجمات حقن الأوامر و DoS.', ACCENT_ROSE);

    addImageFrame(slide, path.join(imagesDir, '01_overview.png'), 6.8, 1.8, 5.7, 4.8);
    addFooter(slide, 2);
  }

  // =========================================================================
  // SLIDE 3: SMART 5-HUB ARCHITECTURE (ISA-101)
  // =========================================================================
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_DARK };
    addHeader(slide, '02 • SYSTEM ARCHITECTURE', 'هيكلية الـ 5 محاور الذكية (Smart 5-Hub Grouping)', 'ISA-101 High-Performance Human-Machine Interface & Omni-Search Navigation');

    const hubCards = [
      { num: 'Hub 1', title: 'العمليات الميدانية والتحكم SAS', desc: 'المخطط الأحادي SLD، التوأم 3D، محاكي RTS، موازين القدرة، تقادم العزل، ومراقبة SF6.', color: ACCENT_CYAN, icon: '⚡' },
      { num: 'Hub 2', title: 'الحمايات والبروتوكولات المعيارية', desc: 'الحماية التفاضلية 87T، حماية المسافة 21، منحنيات TCC، محاكي IEC 104، COMTRADE، ومحرر SCL.', color: ACCENT_GREEN, icon: '🛡️' },
      { num: 'Hub 3', title: 'الطاقات المتجددة والتقنيات الخضراء', desc: 'الطاقة الشمسية 5MW، بطاريات BESS 10MW/40MWh، الشبكة الإقليمية، جودة القدرة، الهيدروجين PEM، و HVDC.', color: ACCENT_AMBER, icon: '☀️' },
      { num: 'Hub 4', title: 'الطوارئ والسلامة والأمن السيبراني', desc: 'نظام الإنذارات ISA-18.2، الإعادة بعد الإظلام Black Start، تصاريح LOTO PTW، محاكي OTS، وحقل Cyber Range.', color: ACCENT_ROSE, icon: '🚨' },
      { num: 'Hub 5', title: 'التحليلات المتقدمة والتوأم الرقمي', desc: 'التقارير PPTX، مؤشر صحة الأصول AHI، مثلث دوفال DGA، التكلفة TCO، سجل Blockchain، ومحدد أعطال TDR.', color: ACCENT_PURPLE, icon: '📊' }
    ];

    hubCards.forEach((h, idx) => {
      const hy = 1.8 + idx * 0.98;
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: 0.8,
        y: hy,
        w: 11.73,
        h: 0.88,
        rectRadius: 0.1,
        fill: { color: CARD_BG },
        line: { color: h.color, width: 1 }
      });
      slide.addText(h.icon, { x: 1.0, y: hy + 0.15, w: 0.6, h: 0.55, fontSize: 18, align: 'center' });
      slide.addText(h.num + ' • ' + h.title, { x: 1.7, y: hy + 0.12, w: 4.5, h: 0.35, fontSize: 13, fontFace: 'Arial', color: h.color, bold: true });
      slide.addText(h.desc, { x: 1.7, y: hy + 0.45, w: 10.6, h: 0.35, fontSize: 10.5, fontFace: 'Calibri', color: TEXT_MUTED });
    });

    addFooter(slide, 3);
  }

  // =========================================================================
  // SLIDE 4: SUBSTATION TOPOLOGY & SINGLE LINE DIAGRAM (SLD)
  // =========================================================================
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_DARK };
    addHeader(slide, '03 • SUBSTATION TOPOLOGY', 'طوبولوجيا ساحة المفاتيح 132/13.8 ك.ف والمخطط الأحادي التفاعلي', 'Double Busbar Scheme 132 kV, 2x 40 MVA Dyn11 Transformers & Dynamic SLD Tracing');

    addBulletCard(slide, 0.8, 1.8, 5.7, 1.5, '⚡', 'نظام القضبان المزدوجة (Double Busbar 132 kV)', 'قضبان رئيسية Bus A واحتياطية Bus B مع قاطع ربط 52-0 ومرحل التحقق التزامني ANSI 25 لمنع الإغلاق في حالة تعارض الزوايا الطورية.', ACCENT_CYAN);
    addBulletCard(slide, 0.8, 3.45, 5.7, 1.5, '🔄', 'خلايا المحولات الرئيسية (2 × 40 MVA Transformers)', 'محولات 132/13.8 ك.ف بتوصيل Dyn11 وتبريد ONAN/ONAF مع مفاتيح تأريض ومغيرات تفريع تحت الحمل (OLTC).', ACCENT_GREEN);
    addBulletCard(slide, 0.8, 5.1, 5.7, 1.5, '🎨', 'التلوين التبولوجي اللحظي (Topological Path Tracing)', 'تتبع مسارات التغذية وتغيير ألوان الخطوط والقضبان ديناميكياً مع فتح أو إغلاق أي قاطع أو فاصل عزل في الساحة.', ACCENT_PURPLE);

    addImageFrame(slide, path.join(imagesDir, '02_sld.png'), 6.8, 1.8, 5.7, 4.8);
    addFooter(slide, 4);
  }

  // =========================================================================
  // SLIDE 5: 6 ENGINEERING DIAGNOSTIC MODALS
  // =========================================================================
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_DARK };
    addHeader(slide, '04 • DIAGNOSTIC MODALS', 'النوافذ الهندسية التخصصية الست في المخطط الأحادي', 'Six Advanced Engineering Physics Modals Embedded in Single Line Diagram');

    const modals = [
      { title: '1. مرحل التحقق التزامني (ANSI 25)', desc: 'مراقبة فرق الزاوية الطورية (Δθ < 10°)، فرق الجهد (ΔV < 5%)، والتردد (Δf < 0.1 Hz) مع Synchroscope حي.', color: ACCENT_CYAN },
      { title: '2. مخاطر الوميض القوسي (IEEE 1584)', desc: 'حساب طاقة الانفجار القوسي (cal/cm²)، ومسافات حدود الأمان، وتحديد فئة معدات الوقاية الشخصية PPE Category.', color: ACCENT_ROSE },
      { title: '3. القطع عند نقطة الموجة المثالية (PoW)', desc: 'ضبط زاوية إغلاق القواطع عند نقطة الصفر أو القمة الموجية لتصفير تيار الإشباع المفاجئ (Inrush < 1.1 pu).', color: ACCENT_GREEN },
      { title: '4. محدد موقع الأعطال المعاوقي (Takagi)', desc: 'حساب المسافة الدقيقة للأعطال بالكيلومترات وتحديد البرج المصاب بالتعويض عن تيار التغذية المعاكس وفق IEEE C37.114.', color: ACCENT_AMBER },
      { title: '5. التفريغ الجزئي والتصوير الحراري (PD/IR)', desc: 'تحليل أنماط PRPD ومراقبة درجات حرارة عوازل البوشينغ والموصلات للتنبؤ المبكر بانهيار العزل الداخلي.', color: ACCENT_PURPLE },
      { title: '6. نقطة الركبة وإشباع محولات القياس (CT)', desc: 'رسم منحنيات الإثارة لمحولات التيار وحساب جهد نقطة الركبة للتأكد من عدم دخول محول الحماية في مرحلة الإشباع.', color: ACCENT_BLUE }
    ];

    modals.forEach((m, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const mx = 0.8 + col * 5.95;
      const my = 1.8 + row * 1.65;
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: mx,
        y: my,
        w: 5.75,
        h: 1.5,
        rectRadius: 0.1,
        fill: { color: CARD_BG },
        line: { color: m.color, width: 1.2 }
      });
      slide.addText(m.title, { x: mx + 0.2, y: my + 0.15, w: 5.35, h: 0.35, fontSize: 12, fontFace: 'Arial', color: m.color, bold: true });
      slide.addText(m.desc, { x: mx + 0.2, y: my + 0.5, w: 5.35, h: 0.9, fontSize: 10.5, fontFace: 'Calibri', color: TEXT_MUTED });
    });

    addFooter(slide, 5);
  }

  // =========================================================================
  // SLIDE 6: 3D SPATIAL DIGITAL TWIN (THREE.JS WEBGL)
  // =========================================================================
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_DARK };
    addHeader(slide, '05 • 3D DIGITAL TWIN', 'التوأم الرقمي الفراغي ثلاثي الأبعاد (WebGL / Three.js)', 'High-Fidelity 3D Switchyard Spatial Modeling & Real-Time Thermal Heatmap Shading');

    addBulletCard(slide, 0.8, 1.8, 5.7, 1.5, '🌐', 'نمذجة مكانية واقعية 100% داخل المتصفح', 'محاكاة كاملة لأبراج التوصيل 132 ك.ف، قواطع الـ SF6، محولات التيار والجهد، ومحولات القدرة 40 MVA مع خزانات التمدد ومراوح التبريد.', ACCENT_CYAN);
    addBulletCard(slide, 0.8, 3.45, 5.7, 1.5, '🔥', 'التظليل الحراري التفاعلي (Thermal Heatmaps)', 'طبقة Shaders ثلاثية الأبعاد تعكس درجات حرارة الزيت والملفات المسجلة في الحساسات الحقيقية عبر تدرجات لونية ديناميكية.', ACCENT_AMBER);
    addBulletCard(slide, 0.8, 5.1, 5.7, 1.5, '🕹️', 'تجربة تحليق تفاعلية للمشغل (Orbit Controls)', 'إمكانية الدوران والتكبير وفحص أي خلية أو قاطع بشكل موضعي مع استعراض القياسات اللحظية المرفقة بكل عنصر.', ACCENT_GREEN);

    addImageFrame(slide, path.join(imagesDir, '03_threed_twin.png'), 6.8, 1.8, 5.7, 4.8);
    addFooter(slide, 6);
  }

  // =========================================================================
  // SLIDE 7: DIGITAL PROTECTION I — DIFFERENTIAL 87T
  // =========================================================================
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_DARK };
    addHeader(slide, '06 • DIGITAL PROTECTION', 'الحماية التفاضلية لمحولات القدرة 40 MVA (ANSI 87T)', 'Dual-Slope Percentage Restraint & 2nd/5th Harmonic Inrush/Overexcitation Inhibits');

    addBulletCard(slide, 0.8, 1.8, 5.7, 1.5, '📐', 'المنحنى التفاضلي ثنائي الانحدار (Dual-Slope)', 'مقارنة التيارات الداخلة والخارجة بعد تصحيح طور Dyn11 مع انحدار أولي K1=25% وتفادي أخطاء إشباع محولات التيار بانحدار K2=60%.', ACCENT_GREEN);
    addBulletCard(slide, 0.8, 3.45, 5.7, 1.5, '🔒', 'كبح تيار الإشباع المغناطيسي (2nd Harmonic Inrush)', 'كبح الفصل التلقائي عند وصل المحول إذا تجاوزت نسبة التوافقية الثانية (I_2nd / I_fund > 15%) لمنع الفصل الخاطئ.', ACCENT_AMBER);
    addBulletCard(slide, 0.8, 5.1, 5.7, 1.5, '⚡', 'كبح فرط الإثارة المغناطيسية (5th Harmonic)', 'كبح الفصل أثناء ارتفاع الجهد الشديد عند تجاوز التوافقية الخامسة نسبة 35% وفق المعايير الدولية.', ACCENT_CYAN);

    addImageFrame(slide, path.join(imagesDir, '10_differential_87t.png'), 6.8, 1.8, 5.7, 4.8);
    addFooter(slide, 7);
  }

  // =========================================================================
  // SLIDE 8: DIGITAL PROTECTION II — DISTANCE 21 & TCC
  // =========================================================================
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_DARK };
    addHeader(slide, '07 • DISTANCE & TCC PROTECTION', 'حماية المسافة الرقمية (ANSI 21) ومنحنيات التنسيق TCC', 'Impedance Mho/Quad Characteristics, 3-Zone Reach & IEEE/IEC Inverse Time Curves');

    addBulletCard(slide, 0.8, 1.8, 5.7, 1.5, '🧭', 'المناطق الحمايتية الثلاث (3-Zone Distance)', 'المنطقة الأولى Zone 1 (80% فوري T1=0ms)، المنطقة الثانية Zone 2 (120% T2=350ms)، والمنطقة الثالثة Zone 3 (احتياطية T3=1000ms).', ACCENT_BLUE);
    addBulletCard(slide, 0.8, 3.45, 5.7, 1.5, '📊', 'منحنيات التنسيق الزمني-التياري (TCC Curves)', 'تنسيق قواطع الجهد المتوسط مع حمايات المحول والمغذيات وفق معادلات المنحنيات العكسية الشديدة (Extremely Inverse).', ACCENT_GREEN);
    addBulletCard(slide, 0.8, 5.1, 5.7, 1.5, '🎯', 'المعاوقة الظاهرية ومعامل التعويض الصفري', 'حساب Z_apparent = V / (I + k0 * I0) مع التعويض عن مقاومة القوس العطل والخطوط المجاورة.', ACCENT_PURPLE);

    addImageFrame(slide, path.join(imagesDir, '09_distance_protection_21.png'), 6.8, 1.8, 5.7, 4.8);
    addFooter(slide, 8);
  }

  // =========================================================================
  // SLIDE 9: THERMAL AGING & SF6 WATCHDOG
  // =========================================================================
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_DARK };
    addHeader(slide, '08 • ASSET INTEGRITY', 'التقادم الحراري للمحولات (IEC 60076-7) ومراقبة غاز SF6', 'Dynamic Hot-Spot Thermal Model, Cellulose DP Loss & SF6 Density Watchdog IEC 62271-4');

    addBulletCard(slide, 0.8, 1.8, 5.7, 1.5, '🌡️', 'نموذج النقطة الساخنة ومعادلة أرهينيوس', 'حساب حرارة النقطة الأكثر سخونة θ_h ومعدل تسارع تقادم العزل الورقي V = 2^((θ_h - 98)/6) لحساب فقدان العمر الفعلي.', ACCENT_ROSE);
    addBulletCard(slide, 0.8, 3.45, 5.7, 1.5, '🧪', 'تدهور بلمرة السليلوز (Degree of Polymerization DP)', 'مراقبة مؤشر الـ DP للورق العازل من الحالة الجديدة (1000) وصولاً إلى نهاية العمر الافتراضي الحرج (< 200).', ACCENT_AMBER);
    addBulletCard(slide, 0.8, 5.1, 5.7, 1.5, '💨', 'مراقبة غاز سداسي فلوريد الكبريت SF6 Watchdog', 'تعويض الحرارة لحساب الكثافة اللحظية للغاز والتنبؤ المبكر بمعدل التسرب السنوي لحماية قواطع الساحة.', ACCENT_CYAN);

    addImageFrame(slide, path.join(imagesDir, '07_transformer_thermal.png'), 6.8, 1.8, 5.7, 4.8);
    addFooter(slide, 9);
  }

  // =========================================================================
  // SLIDE 10: INDUSTRIAL PROTOCOLS & SCL / COMTRADE
  // =========================================================================
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_DARK };
    addHeader(slide, '09 • PROTOCOLS & STANDARDS', 'المحطات الرقمية IEC 61850 ومحرر الـ SCL ومسجلات COMTRADE', 'IEC 61850 Station/Process Bus, GOOSE/SV, SCL/SCD Editor & IEEE C37.111 COMTRADE');

    addBulletCard(slide, 0.8, 1.8, 5.7, 1.5, '⚡', 'ناقل المحطة والعمليات (Station & Process Bus)', 'نقل رسائل GOOSE السريعة لأوامر الفصل (< 4 ms)، وحزم القيم المأخوذة كعينات (Sampled Values SV @ 4800 Hz) لمحولات القياس الضوئية.', ACCENT_CYAN);
    addBulletCard(slide, 0.8, 3.45, 5.7, 1.5, '📝', 'محرر ومولد لغة توصيف المحطات (SCL/SCD Editor)', 'تحرير وتصدير واستيراد ملفات توصيف تكوين المحطة الرقمية (SSD, ICD, SCD, CID) المتوافقة مع كافة الشركات العالمية.', ACCENT_GREEN);
    addBulletCard(slide, 0.8, 5.1, 5.7, 1.5, '📈', 'مسجلات الأعطال العابرة COMTRADE Generator', 'توليد وتصدير ملفات تسجيل الموجات العابرة للأعطال (.cfg و .dat) وفق معيار IEEE C37.111 لتحليلها في برامج الحماية.', ACCENT_PURPLE);

    addImageFrame(slide, path.join(imagesDir, '15_iec61850_scl_editor.png'), 6.8, 1.8, 5.7, 4.8);
    addFooter(slide, 10);
  }

  // =========================================================================
  // SLIDE 11: WIDE AREA MONITORING (WAMS) & PMU
  // =========================================================================
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_DARK };
    addHeader(slide, '10 • WAMS & PMU PHASORS', 'منظومة مراقبة المساحات الواسعة ووحدات قياس الطور PMU', 'Synchrophasor Streaming, Phase Angle Dynamics & Frequency Stability IEEE C37.118');

    addBulletCard(slide, 0.8, 1.8, 5.7, 1.5, '⏱️', 'قياسات المتجهات الطورية التزامنية بالـ GPS', 'بث متجهات الجهد والتيار اللحظية بمعدل 50 إطاراً في الثانية بدقة زمنية بالميكروثانية متزامنة مع الأقمار الصناعية.', ACCENT_CYAN);
    addBulletCard(slide, 0.8, 3.45, 5.7, 1.5, '📈', 'مراقبة معدل تغير التردد (ROCOF Dynamics)', 'حساب تسارع هبوط التردد (df/dt) لحظياً لتفعيل خطط فصل الأحمال التلقائي (UFLS) ومنع الانهيار الترددي للشبكة.', ACCENT_AMBER);
    addBulletCard(slide, 0.8, 5.1, 5.7, 1.5, '🔄', 'رصد التذبذبات البينية للشبكة (Inter-Area Oscillations)', 'تحليل زوايا الطور بين محطات التوليد الإقليمية لكشف التذبذبات منخفضة التردد (0.1 - 2 Hz) وحقن إشارات التخميد PSS.', ACCENT_GREEN);

    addImageFrame(slide, path.join(imagesDir, '14_wams_pmu_phasors.png'), 6.8, 1.8, 5.7, 4.8);
    addFooter(slide, 11);
  }

  // =========================================================================
  // SLIDE 12: RENEWABLE ENERGY — SOLAR PV & BESS
  // =========================================================================
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_DARK };
    addHeader(slide, '11 • RENEWABLES & STORAGE', 'دمج الطاقات المتجددة: الطاقة الشمسية 5 MW وبطاريات BESS', 'Solar PV Smart Inverters (Volt-VAR) & 10 MW / 40 MWh BESS Peak Shaving & Frequency Response');

    addBulletCard(slide, 0.8, 1.8, 5.7, 1.5, '☀️', 'حقل الطاقة الشمسية 5 MW مع العاكس الذكي', 'منحنيات التحكم في الجهد والتردد (Volt-VAR & Frequency-Watt) لتثبيت جهد قضبان 13.8 ك.ف أثناء تقلبات الإشعاع الشمسي.', ACCENT_AMBER);
    addBulletCard(slide, 0.8, 3.45, 5.7, 1.5, '🔋', 'منظومة تخزين البطاريات BESS 10 MW / 40 MWh', 'إدارة ذروة الأحمال (Peak Shaving)، وتوفير احتياطي الاستجابة السريعة للتردد FFR، وموازنة شحن الخلايا LFP.', ACCENT_GREEN);
    addBulletCard(slide, 0.8, 5.1, 5.7, 1.5, '📊', 'تتبع حالة الشحن والصحة (SoC & SoH Tracking)', 'حساب لحظي لحالة الشحن SoC بنظرية Coulomb Counting مع تقدير تدهور السعة SoH وفق درجات حرارة الحزم.', ACCENT_CYAN);

    addImageFrame(slide, path.join(imagesDir, '16_solar_pv_microgrid.png'), 6.8, 1.8, 5.7, 4.8);
    addFooter(slide, 12);
  }

  // =========================================================================
  // SLIDE 13: GREEN HYDROGEN & VSC-HVDC INTERTIE
  // =========================================================================
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_DARK };
    addHeader(slide, '12 • HYDROGEN & HVDC', 'مصنع الهيدروجين الأخضر PEM ورابط النقل VSC-HVDC', '2 MW PEM Electrolyzer Microgrid & ±50 kV Voltage Source Converter HVDC Smart Intertie');

    addBulletCard(slide, 0.8, 1.8, 5.7, 1.5, '💧', 'كهرلة الماء الغشائية (2 MW PEM Electrolyzer)', 'تحويل فائض الطاقة المتجددة إلى هيدروجين أخضر عالي النقاوة مع نمذجة تدفق الغاز وفق قانون فاراداي وضغط الخزانات.', ACCENT_GREEN);
    addBulletCard(slide, 0.8, 3.45, 5.7, 1.5, '🌐', 'رابط التيار المستمر الذكي (±50 kV VSC-HVDC)', 'نقل القدرة الكهربائية لمسافات طويلة مع تحكم مستقل في القدرة الفعالة (P) وغير الفعالة (Q) في الأرباع الأربعة.', ACCENT_PURPLE);
    addBulletCard(slide, 0.8, 5.1, 5.7, 1.5, '🛡️', 'دعم استقرار الشبكة وعزل الأعطال (Black Start Capability)', 'قدرة محولات الـ VSC على البدء الذاتي وتغذية الشبكة المعزولة في حالات الطوارئ القصوى.', ACCENT_CYAN);

    addImageFrame(slide, path.join(imagesDir, '21_green_hydrogen_pem.png'), 6.8, 1.8, 5.7, 4.8);
    addFooter(slide, 13);
  }

  // =========================================================================
  // SLIDE 14: REGIONAL 5-BUS GRID & DTR / POWER QUALITY
  // =========================================================================
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_DARK };
    addHeader(slide, '13 • GRID DYNAMICS & DTR', 'الشبكة الإقليمية 5-Bus، التحميل الديناميكي DTR وجودة القدرة', 'Regional Power Flow Dynamics, CIGRE TB 299 Dynamic Thermal Rating & Harmonics THD');

    addBulletCard(slide, 0.8, 1.8, 5.7, 1.5, '🌐', 'محاكي تدفق الأحمال للشبكة الإقليمية 5-Bus', 'تحليل تدفق القدرة واستقرار الجهد عبر خطوط النقل بين محطات التوليد ومحطة الـ 132 ك.ف وفق معادلات Newton-Raphson.', ACCENT_CYAN);
    addBulletCard(slide, 0.8, 3.45, 5.7, 1.5, '🌡️', 'التقييم الحراري الديناميكي لخطوط النقل (DTR)', 'رفع سعة النقل بنسبة تصل إلى 20-30% بناء على سرعة الرياح والإشعاع وحرارة الجو وفق معايير CIGRE TB 299 / IEEE 738.', ACCENT_AMBER);
    addBulletCard(slide, 0.8, 5.1, 5.7, 1.5, '📉', 'مراقبة جودة القدرة والتوافقيات (IEC 61000-4-30)', 'قياس التشوه التوافقي الكلي (THD_V < 2.5% & THD_I < 5%) والتوافقيات الفردية حتى الرتبة 50 وفق معيار IEEE 519.', ACCENT_GREEN);

    addImageFrame(slide, path.join(imagesDir, '18_regional_grid_5bus.png'), 6.8, 1.8, 5.7, 4.8);
    addFooter(slide, 14);
  }

  // =========================================================================
  // SLIDE 15: INDUSTRIAL OT CYBERSECURITY RANGE
  // =========================================================================
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_DARK };
    addHeader(slide, '14 • OT CYBERSECURITY', 'حقل اختبارات الأمن السيبراني لشبكات التحكم الصناعي (OT)', 'NERC-CIP & MITRE ATT&CK for ICS Threat Modeling, Attack Injections & Automated Defense');

    addBulletCard(slide, 0.8, 1.8, 5.7, 1.5, '🚨', 'محاكاة الهجمات السيبرانية الواقعية (Attack Simulation)', 'حقن رسائل GOOSE خبيثة (Malicious Trip)، هجمات رجل في المنتصف MitM، هجمات حجب الخدمة DoS، وإعادة بث الحزم Replay.', ACCENT_ROSE);
    addBulletCard(slide, 0.8, 3.45, 5.7, 1.5, '🛡️', 'الدفاعات الآلية وفق معيار IEC 62351', 'التحقق من التواقيع الرقمية لحزم GOOSE/SV، وتشفير اتصالات الـ IEC-104 عبر بروتوكولات TLS/DTLS، وفلترة الحزم DPI.', ACCENT_GREEN);
    addBulletCard(slide, 0.8, 5.1, 5.7, 1.5, '🔐', 'العزل الآمن وسجل الحوادث (Containment & Forensics)', 'عزل المنافذ المصابة تلقائياً وتوثيق الهجمات في سجل البلوكشين المشفر للتحقيق الجنائي الرقمي.', ACCENT_AMBER);

    addImageFrame(slide, path.join(imagesDir, '27_cyber_attack_range.png'), 6.8, 1.8, 5.7, 4.8);
    addFooter(slide, 15);
  }

  // =========================================================================
  // SLIDE 16: OPERATOR TRAINING SIMULATOR (OTS) & SEQUENCES
  // =========================================================================
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_DARK };
    addHeader(slide, '15 • OPERATOR TRAINING', 'محاكي تدريب المشغلين OTS وتسلسلات المناورة الآلية', 'High-Fidelity OTS Scenario Evaluation, Trainee Scoring & Interlocked Switching Sequences');

    addBulletCard(slide, 0.8, 1.8, 5.7, 1.5, '🎓', 'محاكي غرف التحكم الوطنية التفاعلي (OTS)', 'سيناريوهات تدريبية متنوعة (عطل قضبان، فصل محول مفاجئ، فقدان التردد) مع تسجيل دقيق لسرعة استجابة المتدرب.', ACCENT_PURPLE);
    addBulletCard(slide, 0.8, 3.45, 5.7, 1.5, '📝', 'التقييم الآلي الفوري للأداء (Automated Grading)', 'تقييم رقمي فوري لقرارات المتدرب وسلامة المناورات وتوليد تقرير هندسي معتمد عند نهاية السيناريو.', ACCENT_CYAN);
    addBulletCard(slide, 0.8, 5.1, 5.7, 1.5, '🔒', 'تسلسلات المناورة الآلية وقفل التعشيق الصارم', 'تنفيذ مناورات نقل الأحمال وعزل القضبان بتسلسل آلي يمنع فتح الفواصم تحت الحمل أو إغلاق سكاكين التأريض بالخطأ.', ACCENT_GREEN);

    addImageFrame(slide, path.join(imagesDir, '26_ots_operator_training.png'), 6.8, 1.8, 5.7, 4.8);
    addFooter(slide, 16);
  }

  // =========================================================================
  // SLIDE 17: EMERGENCY & SAFETY — BLACK START & LOTO
  // =========================================================================
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_DARK };
    addHeader(slide, '16 • EMERGENCY & SAFETY', 'خطة الإعادة بعد الإظلام التام (Black Start) ونظام LOTO PTW', 'Substation Islanded Restoration Wizard & OSHA / NFPA 70E Digital Lockout/Tagout Safety');

    addBulletCard(slide, 0.8, 1.8, 5.7, 1.5, '🔄', 'معالج خطة الإعادة التلقائية (Black Start Wizard)', 'تسلسل آمن لإعادة تغذية خدمات المحطة الذاتية عبر بطاريات BESS ومولدات الطوارئ وإعادة كهربة القضبان والمغذيات تدريجياً.', ACCENT_CYAN);
    addBulletCard(slide, 0.8, 3.45, 5.7, 1.5, '🔏', 'تصاريح العمل الإلكترونية (Permit to Work PTW)', 'إدارة تصاريح الصيانة الميدانية وتطبيق إجراءات القفل والتحذير (LOTO) رقمياً مع توقيع إلكتروني للمسؤولين.', ACCENT_ROSE);
    addBulletCard(slide, 0.8, 5.1, 5.7, 1.5, '⚠️', 'إدارة الإنذارات وعقلنتها وفق ISA-18.2', 'تصنيف الإنذارات (حرجة، عالية، متوسطة، تحذيرية) ومنع طوفان الإنذارات (Alarm Flooding) أثناء الأعطال الكبرى.', ACCENT_AMBER);

    addImageFrame(slide, path.join(imagesDir, '24_black_start_wizard.png'), 6.8, 1.8, 5.7, 4.8);
    addFooter(slide, 17);
  }

  // =========================================================================
  // SLIDE 18: PREDICTIVE DIAGNOSTICS — AHI & DGA DUVAL
  // =========================================================================
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_DARK };
    addHeader(slide, '17 • PREDICTIVE ANALYTICS', 'مؤشر صحة الأصول AHI ومثلث دوفال لتحليل الغازات DGA', 'CIGRE TB 761 Asset Health Index, DGA Duval Triangle 1 & TDR Cable Fault Locator');

    addBulletCard(slide, 0.8, 1.8, 5.7, 1.5, '🔺', 'طريقة مثلث دوفال لتحليل غازات الزيت (DGA Duval 1)', 'حساب نسب الميثان (CH4)، الإيثيلين (C2H4)، والأسيتيلين (C2H2) لتشخيص نوع العطل الداخلي (قوس، تفريغ، عطل حراري).', ACCENT_GREEN);
    addBulletCard(slide, 0.8, 3.45, 5.7, 1.5, '🩺', 'مؤشر صحة الأصل المركب (Asset Health Index AHI)', 'دمج نتائج الـ DGA، حموضة الزيت، الرطوبة، جهد الانهيار العازل، والتقادم الحراري في مؤشر مئوي شامل وفق CIGRE TB 761.', ACCENT_CYAN);
    addBulletCard(slide, 0.8, 5.1, 5.7, 1.5, '📡', 'محدد أعطال الكابلات بانعكاس المجال الزمني TDR', 'إرسال نبضات عالية التردد وتحديد المسافة الدقيقة للأعطال ونوعها (قصر / قطع) في كابلات التوزيع الأرضية 13.8 ك.ف.', ACCENT_PURPLE);

    addImageFrame(slide, path.join(imagesDir, '30_ahi_asset_health.png'), 6.8, 1.8, 5.7, 4.8);
    addFooter(slide, 18);
  }

  // =========================================================================
  // SLIDE 19: SOFTWARE ENGINEERING & WEBSOCKET SYNC
  // =========================================================================
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_DARK };
    addHeader(slide, '18 • SOFTWARE ENGINEERING', 'البنية البرمجية المتقدمة والمزامنة اللحظية بالـ WebSockets', 'React 19, TypeScript, Three.js WebGL, Dual Transport WebSockets & Blockchain Ledger');

    addBulletCard(slide, 0.8, 1.8, 5.7, 1.5, '⚡', 'المزامنة اللحظية المزدوجة (Dual Transport Engine)', 'نقل الإشارات والعمليات عبر WebSockets عالية السرعة وسيرفر Express محلي مع BroadcastChannel للمزامنة الفورية بين النوافذ.', ACCENT_CYAN);
    addBulletCard(slide, 0.8, 3.45, 5.7, 1.5, '⛓️', 'سجل التدقيق المشفر (Blockchain Audit Ledger)', 'توثيق كافة عمليات الفصل والوصل والإنذارات في سلسلة كتل مشفرة بخوارزمية SHA-256 تمنع التلاعب بالسجلات.', ACCENT_GREEN);
    addBulletCard(slide, 0.8, 5.1, 5.7, 1.5, '🔐', 'إدارة الصلاحيات الصارمة (Role-Based Access Control)', 'فصل مستويات الصلاحيات بين المشغل الميداني (Operator)، مهندس النظم (Engineer)، ومدير المحطة (Manager).', ACCENT_PURPLE);

    addImageFrame(slide, path.join(imagesDir, '34_blockchain_ledger.png'), 6.8, 1.8, 5.7, 4.8);
    addFooter(slide, 19);
  }

  // =========================================================================
  // SLIDE 20: VALIDATION, ROADMAP & CONCLUSION
  // =========================================================================
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_DARK };
    addHeader(slide, '19 • VALIDATION & ROADMAP', 'نتائج التحقق التجريبي، الآفاق المستقبلية والخاتمة', 'Comprehensive System Validation Matrix, Research Outcomes & Future Roadmap');

    addBulletCard(slide, 0.8, 1.8, 5.7, 1.5, '✅', 'نتائج الاختبارات الوظيفية (Validation 100%)', 'نجاح اختبارات فصل العطل الأرضي SLG خلال 42 ms، كبح تيار الإشباع 87T، قفل عدم التزامن ANSI 25، وزمن مزامنة أجهزة < 12 ms.', ACCENT_GREEN);
    addBulletCard(slide, 0.8, 3.45, 5.7, 1.5, '🚀', 'الآفاق المستقبلية (Future Roadmap)', 'دمج نماذج الذكاء الاصطناعي التوليدي (AI Copilot)، وتوسيع التوأم للشبكة الوطنية، واستخدام نظارات الواقع الافتراضي VR/AR.', ACCENT_CYAN);
    addBulletCard(slide, 0.8, 5.1, 5.7, 1.5, '🏆', 'الخاتمة والأثر الهندسي (Conclusion)', 'تقديم منصة توأم رقمي صناعية متكاملة ومطابقة لأعلى المعايير العالمية ترفع موثوقية وأمان شبكات الطاقة الكهربائية الحديثة.', ACCENT_AMBER);

    // Right Side: Thank You & Q&A Box
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 6.8,
      y: 1.8,
      w: 5.7,
      h: 4.8,
      rectRadius: 0.15,
      fill: { color: '1E293B' },
      line: { color: ACCENT_BLUE, width: 2 }
    });

    slide.addText('شكراً لحسن استماعكم\nThank You for Your Attention', {
      x: 7.0,
      y: 2.3,
      w: 5.3,
      h: 1.2,
      fontSize: 22,
      fontFace: 'Arial',
      color: TEXT_WHITE,
      bold: true,
      align: 'center'
    });

    slide.addText('⚡ SCADA & SAS Digital Twin Platform\n132 / 13.8 kV Substation Automation & Cybersecurity', {
      x: 7.0,
      y: 3.6,
      w: 5.3,
      h: 0.8,
      fontSize: 13,
      fontFace: 'Calibri',
      color: ACCENT_CYAN,
      italic: true,
      align: 'center'
    });

    slide.addText('نرحب بأسئلتكم واستفساراتكم\nQuestions & Discussion are Welcomed', {
      x: 7.0,
      y: 4.6,
      w: 5.3,
      h: 0.9,
      fontSize: 14,
      fontFace: 'Arial',
      color: ACCENT_GREEN,
      bold: true,
      align: 'center'
    });

    addFooter(slide, 20);
  }

  const outDesktop = '/home/essanj/Desktop/عرض_مشروع_سكادا_والتوأم_الرقمي_SCADA_Digital_Twin.pptx';
  const outLocal = '/home/essanj/Desktop/scada f/عرض_مشروع_سكادا_والتوأم_الرقمي_SCADA_Digital_Twin.pptx';

  await pptx.writeFile({ fileName: outDesktop });
  await pptx.writeFile({ fileName: outLocal });

  console.log(`Presentation successfully created at:\n  -> ${outDesktop}\n  -> ${outLocal}`);
}

buildGemmaPresentation().catch(err => {
  console.error('Error generating presentation:', err);
  process.exit(1);
});
