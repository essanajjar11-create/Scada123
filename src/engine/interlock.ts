import { SwitchgearItem, SubstationState } from '../types/substation';

export interface InterlockResult {
  allowed: boolean;
  reason?: string;
  code?: string;
  recommendedStep?: string;
}

/**
 * Validates whether an operation on a switchgear item is permitted under IEC 62271 interlocking rules.
 * Implements rigorous Substation Safety Interlocking:
 * - Anti-Close-onto-Earth Interlock (IEC 62271-100)
 * - Anti-Load Break/Make on Disconnectors (IEC 62271-102)
 * - Protective Trip Lockout 86 (ANSI/IEEE C37.2)
 * - SF6 Gas Density Trip/Close Lockout
 * - Voltage Presence Grounding Prevention
 */
export function validateInterlock(
  item: SwitchgearItem,
  targetState: 'OPEN' | 'CLOSED',
  state: SubstationState
): InterlockResult {
  const { switchgears, measurements, faultActive, faultType } = state;

  // =========================================================================
  // 1. CIRCUIT BREAKER SAFETY RULES (CB1 to CB6)
  // =========================================================================
  if (item.type === 'CB') {
    // A. SF6 Gas Density Monitor Lockout (IEC 62271-100)
    // Low SF6 pressure blocks BOTH Open and Close to prevent arc extinction chamber explosion
    if (item.sf6Status === 'BLOCK_OPERATION' || (item.sf6PressureBar && item.sf6PressureBar < 5.0)) {
      return {
        allowed: false,
        code: 'INTERLOCK_SF6_LOCKOUT',
        reason: `حظر تشغيلي ميكانيكي صارم (SF6 Gas Lockout): ضغط غاز سداسي فلوريد الكبريت SF6 في القاطع ${item.id} منخفض حرِجاً (${item.sf6PressureBar?.toFixed(2)} bar دون الحد الآمن 5.0 bar). المناورة محظورة لحماية غرفة إخماد القوس من التلف والانفجار!`,
        recommendedStep: 'قم بإصلاح تسريب الغاز وإعادة التعبئة إلى 6.0 bar قبل إجراء أي مناورة.'
      };
    }

    // B. Rules specifically for CLOSING the Circuit Breaker (targetState === 'CLOSED')
    if (targetState === 'CLOSED') {
      
      // B.1. Protective Trip Lockout 86 (Master Trip Relay Lockout)
      if (faultActive && faultType === '3PH_FAULT' && (item.id === 'CB1' || item.bayId === 'BAY_W1_1')) {
        return {
          allowed: false,
          code: 'INTERLOCK_PROTECTION_LOCKOUT_86',
          reason: `حظر أمان الحماية (ANSI 86 Master Trip Lockout): محظور إعادة وصل القاطع ${item.id} لوجود عطل قصر ثلاثي الأطوار نشط (3-Phase Fault 38.5 kA) وإشارة رحلة من ريليه SEL-487E!`,
          recommendedStep: 'اضغط على زر "تصفير الأعطال" في لوحة المحاكاة لإزالة سبب الرحلة قبل إعادة وصل القاطع.'
        };
      }

      // B.2. Anti-Close-onto-Earth Interlock (منع الوصل على التأريض)
      // Check all Earthing Switches associated with this Bay
      let blockingEarthSwitches: SwitchgearItem[] = [];

      if (item.id === 'CB1') {
        // Line W1' bay: ES1 (Line Earth) and ES2 (Bus Earth)
        if (switchgears['ES1']?.state === 'CLOSED') blockingEarthSwitches.push(switchgears['ES1']);
        if (switchgears['ES2']?.state === 'CLOSED') blockingEarthSwitches.push(switchgears['ES2']);
        if (switchgears['ES13']?.state === 'CLOSED' && switchgears['DS1']?.state === 'CLOSED') {
          blockingEarthSwitches.push(switchgears['ES13']);
        }
      } else if (item.id === 'CB2') {
        // Line W2 bay: ES3 (Line Earth) and ES4 (Bus Earth)
        if (switchgears['ES3']?.state === 'CLOSED') blockingEarthSwitches.push(switchgears['ES3']);
        if (switchgears['ES4']?.state === 'CLOSED') blockingEarthSwitches.push(switchgears['ES4']);
        if (switchgears['ES13']?.state === 'CLOSED' && switchgears['DS4']?.state === 'CLOSED') {
          blockingEarthSwitches.push(switchgears['ES13']);
        }
      } else if (item.id === 'CB3') {
        // Line W1'' bay: ES5 (Line Earth) and ES6 (Bus Earth)
        if (switchgears['ES5']?.state === 'CLOSED') blockingEarthSwitches.push(switchgears['ES5']);
        if (switchgears['ES6']?.state === 'CLOSED') blockingEarthSwitches.push(switchgears['ES6']);
      } else if (item.id === 'CB4') {
        // Bus Coupler: ES7 and ES8
        if (switchgears['ES7']?.state === 'CLOSED') blockingEarthSwitches.push(switchgears['ES7']);
        if (switchgears['ES8']?.state === 'CLOSED') blockingEarthSwitches.push(switchgears['ES8']);
        if (switchgears['ES13']?.state === 'CLOSED' && switchgears['DS7']?.state === 'CLOSED') {
          blockingEarthSwitches.push(switchgears['ES13']);
        }
      } else if (item.id === 'CB5') {
        // Transformer T1: ES9 (Phase Earth)
        if (switchgears['ES9']?.state === 'CLOSED') blockingEarthSwitches.push(switchgears['ES9']);
        if (switchgears['ES13']?.state === 'CLOSED' && switchgears['DS9']?.state === 'CLOSED') {
          blockingEarthSwitches.push(switchgears['ES13']);
        }
      } else if (item.id === 'CB6') {
        // Transformer T2: ES11 (Phase Earth)
        if (switchgears['ES11']?.state === 'CLOSED') blockingEarthSwitches.push(switchgears['ES11']);
      }

      if (blockingEarthSwitches.length > 0) {
        const esNames = blockingEarthSwitches.map(es => `${es.name} (${es.id})`).join(' و ');
        return {
          allowed: false,
          code: 'INTERLOCK_CLOSE_ONTO_EARTH',
          reason: `خطر كارثي وحظر أمان قطعي (IEC 62271-100 Close-onto-Earth Lockout): محظور غلق القاطع ${item.id} لأن سكين التأريض [${esNames}] مغلقة! غلق القاطع الآن يتسبب في قصر مباشر مع الأرض (Short Circuit 40 kA) وانفجار فوري في الساحة!`,
          recommendedStep: `افتح سكاكين التأريض (${blockingEarthSwitches.map(e => e.id).join(', ')}) وتأكد من زوال التأريض قبل وصل القاطع.`
        };
      }

      // B.3. Synchrocheck Interlock for Bus Coupler CB4
      if (item.id === 'CB4') {
        // If bus coupler disconnectors DS7 and DS8 are not closed:
        if (switchgears['DS7']?.state === 'OPEN' || switchgears['DS8']?.state === 'OPEN') {
          return {
            allowed: false,
            code: 'INTERLOCK_COUPLER_DISCONNECTORS_OPEN',
            reason: `إنترلوك رابط القضبان: يجب غلق فاصلي عزل الرابط DS7 و DS8 وتجهيز مسار الربط قبل وصل القاطع CB4.`,
            recommendedStep: 'أغلق الفاصل DS7 والفاصل DS8 أولاً.'
          };
        }
      }
    }
  }

  // =========================================================================
  // 2. DISCONNECTOR SAFETY RULES (DS1 to DS14 - IEC 62271-102)
  // =========================================================================
  if (item.type === 'DS') {
    let associatedCbId = '';
    const bayId = item.bayId;

    if (bayId === 'BAY_W1_1') associatedCbId = 'CB1';
    else if (bayId === 'BAY_W2') associatedCbId = 'CB2';
    else if (bayId === 'BAY_W1_2') associatedCbId = 'CB3';
    else if (bayId === 'BAY_COUPLER') associatedCbId = 'CB4';
    else if (bayId === 'BAY_T1') associatedCbId = 'CB5';
    else if (bayId === 'BAY_T2') associatedCbId = 'CB6';

    const cb = switchgears[associatedCbId];

    // Rule A: NO-LOAD OPERATION ONLY - Disconnector cannot operate if CB is CLOSED!
    if (cb && cb.state === 'CLOSED') {
      const bayMeas = measurements[bayId];
      const current = bayMeas ? bayMeas.currentL1_A.toFixed(1) : '0.0';
      return {
        allowed: false,
        code: 'INTERLOCK_CB_CLOSED_LOAD',
        reason: `إنترلوك أمان كهربائي دولي (IEC 62271-102 No-Load Operation Only): محظور ${targetState === 'OPEN' ? 'فتح' : 'غلق'} الفاصل ${item.name} (${item.id}) لأن القاطع التابع له ${cb.name} (${cb.id}) مغلق (${current} A). الفواصل غير مجهزة لقطع أو وصل تيارات الحمل!`,
        recommendedStep: `افتح القاطع ${cb.id} أولاً لقطع التيار وتفريغ الحمل، ثم قم بمناورة الفاصل.`
      };
    }

    // Rule B: Cannot CLOSE disconnector if adjacent Earthing Switch is CLOSED
    if (targetState === 'CLOSED') {
      let blockingES: SwitchgearItem | undefined = undefined;

      if (item.id === 'DS1') blockingES = switchgears['ES2']?.state === 'CLOSED' ? switchgears['ES2'] : (switchgears['ES13']?.state === 'CLOSED' ? switchgears['ES13'] : undefined);
      else if (item.id === 'DS2') blockingES = switchgears['ES1']?.state === 'CLOSED' ? switchgears['ES1'] : undefined;
      else if (item.id === 'DS4') blockingES = switchgears['ES4']?.state === 'CLOSED' ? switchgears['ES4'] : (switchgears['ES13']?.state === 'CLOSED' ? switchgears['ES13'] : undefined);
      else if (item.id === 'DS5') blockingES = switchgears['ES3']?.state === 'CLOSED' ? switchgears['ES3'] : undefined;
      else if (item.id === 'DS3') blockingES = switchgears['ES5']?.state === 'CLOSED' ? switchgears['ES5'] : undefined;
      else if (item.id === 'DS6') blockingES = switchgears['ES6']?.state === 'CLOSED' ? switchgears['ES6'] : undefined;
      else if (item.id === 'DS7') blockingES = switchgears['ES7']?.state === 'CLOSED' ? switchgears['ES7'] : undefined;
      else if (item.id === 'DS8') blockingES = switchgears['ES8']?.state === 'CLOSED' ? switchgears['ES8'] : undefined;
      else if (item.id === 'DS9') blockingES = switchgears['ES13']?.state === 'CLOSED' ? switchgears['ES13'] : undefined;
      else if (item.id === 'DS10') blockingES = switchgears['ES9']?.state === 'CLOSED' ? switchgears['ES9'] : undefined;
      else if (item.id === 'DS11') blockingES = undefined;
      else if (item.id === 'DS12') blockingES = switchgears['ES11']?.state === 'CLOSED' ? switchgears['ES11'] : undefined;

      if (blockingES) {
        return {
          allowed: false,
          code: 'INTERLOCK_EARTH_SWITCH_CLOSED',
          reason: `إنترلوك أمان: محظور وصل الفاصل ${item.name} (${item.id}) لوجود سكين تأريض مغلقة مجاورة (${blockingES.name} - ${blockingES.id}) تجنباً لعمل قصر مباشر مع الأرض!`,
          recommendedStep: `تأكد من فتح سكين التأريض ${blockingES.id} أولاً.`
        };
      }
    }
  }

  // =========================================================================
  // 3. EARTHING SWITCH SAFETY RULES (ES1 to ES13 - IEC 62271-102)
  // =========================================================================
  if (item.type === 'ES') {
    if (targetState === 'CLOSED') {
      // Rule A: Live Voltage Grounding Prevention (خطر الصعق والتأريض تحت الجهد)
      // Check voltage on the specific section
      const bayMeas = measurements[item.bayId];
      const voltage = bayMeas ? bayMeas.voltageLL_kV : 0;

      // Also check Bus voltage for bus earthing switches
      let effectiveV = voltage;
      if (item.id === 'ES13' || item.id === 'ES2' || item.id === 'ES4' || item.id === 'ES7') {
        if (state.bus1Energized) effectiveV = state.gridVoltageKV;
      } else if (item.id === 'ES6' || item.id === 'ES8') {
        if (state.bus2Energized) effectiveV = state.gridVoltageKV;
      }

      if (effectiveV > 1.0) {
        return {
          allowed: false,
          code: 'INTERLOCK_VOLTAGE_PRESENT',
          reason: `خطر صعق وتأريض تحت الجهد (IEC 62271-102 Live Grounding Danger): الجهد ما زال موجوداً (${effectiveV.toFixed(1)} kV) على القسم المراد تأريضه. التأريض تحت الجهد ممنوع قطعياً!`,
          recommendedStep: 'تأكد من عزل كافة الفواصل والقواطع المغذية وتفريغ الشحنات والتأكد من V = 0 kV قبل التأريض.'
        };
      }

      // Rule B: Associated Disconnectors must be OPEN
      let connectedDisconnectors: SwitchgearItem[] = [];
      if (item.id === 'ES1') {
        if (switchgears['DS2']?.state === 'CLOSED') connectedDisconnectors.push(switchgears['DS2']);
      } else if (item.id === 'ES2') {
        if (switchgears['DS1']?.state === 'CLOSED') connectedDisconnectors.push(switchgears['DS1']);
      } else if (item.id === 'ES3') {
        if (switchgears['DS5']?.state === 'CLOSED') connectedDisconnectors.push(switchgears['DS5']);
      } else if (item.id === 'ES4') {
        if (switchgears['DS4']?.state === 'CLOSED') connectedDisconnectors.push(switchgears['DS4']);
      } else if (item.id === 'ES5') {
        if (switchgears['DS3']?.state === 'CLOSED') connectedDisconnectors.push(switchgears['DS3']);
      } else if (item.id === 'ES6') {
        if (switchgears['DS6']?.state === 'CLOSED') connectedDisconnectors.push(switchgears['DS6']);
      } else if (item.id === 'ES7') {
        if (switchgears['DS7']?.state === 'CLOSED') connectedDisconnectors.push(switchgears['DS7']);
      } else if (item.id === 'ES8') {
        if (switchgears['DS8']?.state === 'CLOSED') connectedDisconnectors.push(switchgears['DS8']);
      } else if (item.id === 'ES9') {
        if (switchgears['DS10']?.state === 'CLOSED') connectedDisconnectors.push(switchgears['DS10']);
      } else if (item.id === 'ES11') {
        if (switchgears['DS12']?.state === 'CLOSED') connectedDisconnectors.push(switchgears['DS12']);
      } else if (item.id === 'ES13') {
        // Bus 1 Earth: all disconnectors on Bus 1 must be open!
        ['DS1', 'DS4', 'DS7', 'DS9', 'DS13'].forEach(dsId => {
          if (switchgears[dsId]?.state === 'CLOSED') connectedDisconnectors.push(switchgears[dsId]);
        });
      }

      if (connectedDisconnectors.length > 0) {
        return {
          allowed: false,
          code: 'INTERLOCK_DS_NOT_OPEN',
          reason: `إنترلوك تأريض: يجب فتح جميع الفواصل العازلة المتصلة (${connectedDisconnectors.map(d => d.id).join(', ')}) لتأمين العزل المرئي التام قبل غلق سكين التأريض ${item.id}.`,
          recommendedStep: `افتح الفواصل (${connectedDisconnectors.map(d => d.id).join(', ')}) أولاً.`
        };
      }
    }
  }

  return { allowed: true };
}
