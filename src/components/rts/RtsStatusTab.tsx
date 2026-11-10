import React from 'react';
import { useScada } from '../../context/ScadaContext';
import {
  Cpu,
  ShieldCheck,
  CheckCircle2,
  Wind,
  Droplet,
  BatteryCharging,
  Thermometer,
  Lock,
  Activity,
  Zap,
  Gauge,
  Radio
} from 'lucide-react';

export const RtsStatusTab: React.FC = () => {
  const { activeTelemetry, t, lang } = useScada();
  const isAr = lang === 'ar';

  const switches = activeTelemetry?.switches ?? {
    cb132: true,
    ds132_1: true,
    ds132_2: true,
    es132: false,
    cb13_8: true,
    ds13_8: true,
    es13_8: false,
  };

  return (
    <div className="space-y-4 font-mono text-slate-100">
      {/* 1. Switchgear Bay Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* HV Line Bay 01 (132 kV) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-cyan-400">
              <Zap className="w-5 h-5" />
              <h3 className="text-xs font-bold uppercase tracking-wider">{t('hv_line_bay_01')}</h3>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 font-bold">
              {t('healthy')}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-800">
              <span className="text-slate-300">{isAr ? 'قاطع الجهد العالي 52-1' : 'HV Breaker 52-1'}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${switches.hvBreaker52_1 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-900 text-slate-500'}`}>
                {switches.hvBreaker52_1 ? t('closed_live_tag') : t('open_tag')}
              </span>
            </div>

            <div className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-800">
              <span className="text-slate-300">{isAr ? 'فاصل القضبان أ 89-1A' : 'Bus-A Disconnect 89-1A'}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${switches.hvDisconnect89_1A ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-900 text-slate-500'}`}>
                {switches.hvDisconnect89_1A ? t('closed_tag') : t('open_tag')}
              </span>
            </div>

            <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">{t('sf6_gas_pressure')}</span>
                <span className="text-emerald-400 font-bold">6.20 bar ({t('nominal')})</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">{t('spring_motor')}</span>
                <span className="text-cyan-300 font-bold">{t('charged')}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">{t('trip_coils_supervision')}</span>
                <span className="text-emerald-400 font-bold">{t('tcs_healthy')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* MV Transformer Bay 02 (13.8 kV) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-cyan-400">
              <Cpu className="w-5 h-5" />
              <h3 className="text-xs font-bold uppercase tracking-wider">{t('mv_tr_bay_02')}</h3>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 font-bold">
              {t('healthy')}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-800">
              <span className="text-slate-300">{isAr ? 'قاطع الجهد المتوسط 52-2' : 'MV Breaker 52-2'}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${switches.mvBreaker52_2 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-900 text-slate-500'}`}>
                {switches.mvBreaker52_2 ? t('closed_live_tag') : t('open_tag')}
              </span>
            </div>

            <div className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-800">
              <span className="text-slate-300">{isAr ? 'فاصل الجهد المتوسط 89-2' : 'MV Disconnector 89-2'}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${switches.mvDisconnect89_2 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-900 text-slate-500'}`}>
                {switches.mvDisconnect89_2 ? t('closed_tag') : t('open_tag')}
              </span>
            </div>

            <div className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-800">
              <span className="text-slate-300">{isAr ? 'سكينة التأريض 84-1' : 'Earth Switch 84-1'}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${switches.earthSwitch84_1 ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'}`}>
                {switches.earthSwitch84_1 ? t('closed_grounded_tag') : t('open_safe_tag')}
              </span>
            </div>
          </div>
        </div>

        {/* Bus Tie & Tertiary Bay 03 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-purple-400">
              <Activity className="w-5 h-5" />
              <h3 className="text-xs font-bold uppercase tracking-wider">{t('bus_tie_tertiary_bay')}</h3>
            </div>
            <span className="text-[10px] text-slate-400">{isAr ? 'قاطع الربط بين القضبان' : 'Inter-bus Section'}</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-800">
              <span className="text-slate-300">{isAr ? 'رابط القضبان 132kV (52-0)' : '132kV Bus Coupler 52-0'}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${switches.busCoupler52_0 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-900 text-slate-500'}`}>
                {switches.busCoupler52_0 ? t('closed_tag') : t('open_tag')}
              </span>
            </div>

            <div className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-800">
              <span className="text-slate-300">{isAr ? 'مجزئ قضبان 13.8kV (52-6)' : '13.8kV Sectionalizer 52-6'}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${switches.busSectionalizer52_6 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-900 text-slate-500'}`}>
                {switches.busSectionalizer52_6 ? t('closed_tag') : t('open_tag')}
              </span>
            </div>

            <div className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-800">
              <span className="text-slate-300">{isAr ? 'مغذي المحطة الثالثي 52-3' : 'Tertiary Station Feeder 52-3'}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${switches.tertiaryBreaker ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-900 text-slate-500'}`}>
                {switches.tertiaryBreaker ? t('closed_tag') : t('open_tag')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Auxiliary Infrastructure & Substation Environmental Bay */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Auxiliary Substation Infrastructure */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-amber-400">
              <Wind className="w-5 h-5" />
              <h3 className="text-xs font-bold uppercase tracking-wider">{t('aux_infrastructure')}</h3>
            </div>
            <span className="text-[10px] text-slate-400">{isAr ? 'الأنظمة المساعدة' : 'Auxiliary Systems'}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] block">{isAr ? 'مجموعة مراوح التبريد 1' : 'Cooling Fan Group 1'}</span>
              <span className="text-emerald-400 font-bold block">1450 RPM ({isAr ? 'تعمل' : 'RUNNING'})</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] block">{isAr ? 'مضخة تدوير الزيت 1' : 'Oil Circulation Pump 1'}</span>
              <span className="text-cyan-300 font-bold block">450 L/min ({isAr ? 'طبيعي' : 'NORMAL'})</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] block">{isAr ? 'مرحلات بوخهولتز' : 'Buchholz Relays'}</span>
              <span className="text-emerald-400 font-bold block">0 cm³ Gas ({isAr ? 'خالٍ من الغاز' : 'CLEAR'})</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] block">{isAr ? 'متنفس حبيبات السيليكا' : 'Silica Gel Breather'}</span>
              <span className="text-cyan-300 font-bold block">85% Blue ({isAr ? 'جاف وسليم' : 'DRY'})</span>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-emerald-400">
              <BatteryCharging className="w-5 h-5" />
              <div>
                <span className="text-slate-200 font-bold block">
                  {isAr ? 'بنك بطاريات المحطة 110V DC' : '110V DC Station Battery Bank'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {isAr ? 'جهد الشحن العائم: 128.4 Vdc • تيار الشحن: 12.5 A' : 'Float Voltage: 128.4 Vdc • Current: 12.5 A'}
                </span>
              </div>
            </div>
            <span className="px-2 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
              100% {t('healthy')}
            </span>
          </div>
        </div>

        {/* Environmental & Security Bay */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="text-xs font-bold uppercase tracking-wider">{t('env_security')}</h3>
            </div>
            <span className="text-[10px] text-slate-400">{isAr ? 'أمان المحطة' : 'Station Safety'}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] block">{isAr ? 'حرارة غرفة التحكم' : 'Control Room Temp'}</span>
              <span className="text-slate-200 font-bold block">24.2 °C ({isAr ? 'تحكم مناخي' : 'Climate Ctrl'})</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] block">{isAr ? 'الرطوبة النسبية' : 'Relative Humidity'}</span>
              <span className="text-slate-200 font-bold block">48 % RH ({isAr ? 'مثالي' : 'Optimum'})</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] block">{isAr ? 'حساس تسريب غاز SF6' : 'SF6 Gas Leak Sensor'}</span>
              <span className="text-emerald-400 font-bold block">0 PPM ({isAr ? 'آمن' : 'SAFE'})</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] block">{isAr ? 'منسوب مياه خندق الكابلات' : 'Cable Trench Water'}</span>
              <span className="text-emerald-400 font-bold block">0 cm ({isAr ? 'جاف' : 'DRY'})</span>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-purple-400">
              <Lock className="w-5 h-5" />
              <div>
                <span className="text-slate-200 font-bold block">
                  {isAr ? 'إخماد الحريق والأمن المحيطي' : 'Fire Suppression & Perimeter'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {isAr ? 'نظام إغراق النيتروجين N2 متأهب • المحيط مؤمن' : 'N2 Deluge System ARMED • Perimeter Secured'}
                </span>
              </div>
            </div>
            <span className="px-2 py-1 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-bold">
              {isAr ? 'متأهب' : 'ARMED'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Instrument Transformers Diagnostics Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-cyan-400">
            <Gauge className="w-5 h-5" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              {t('inst_transformer_diag')}
            </h3>
          </div>
          <span className="text-[10px] text-slate-400">{isAr ? 'القياسات المترولوجية الدقيقة' : 'Precision Metrology'}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="p-2.5 border-b border-slate-800">{t('device_id')}</th>
                <th className="p-2.5 border-b border-slate-800">{t('trans_ratio')}</th>
                <th className="p-2.5 border-b border-slate-800">{t('accuracy_class')}</th>
                <th className="p-2.5 border-b border-slate-800">{t('secondary_val')}</th>
                <th className="p-2.5 border-b border-slate-800">{t('burden_va')}</th>
                <th className="p-2.5 border-b border-slate-800">{t('health_status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              <tr>
                <td className="p-2.5 font-bold text-cyan-400">HV Bus PT-1</td>
                <td className="p-2.5 font-mono">132kV / 0.11kV</td>
                <td className="p-2.5 text-amber-300 font-bold">Class 0.2</td>
                <td className="p-2.5">63.51 V L-N</td>
                <td className="p-2.5">12.5 VA</td>
                <td className="p-2.5 text-emerald-400 font-bold">● {isAr ? 'طبيعي' : 'NORMAL'}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-cyan-400">MV Bus PT-2</td>
                <td className="p-2.5 font-mono">13.8kV / 0.11kV</td>
                <td className="p-2.5 text-amber-300 font-bold">Class 0.5</td>
                <td className="p-2.5">63.51 V L-N</td>
                <td className="p-2.5">8.2 VA</td>
                <td className="p-2.5 text-emerald-400 font-bold">● {isAr ? 'طبيعي' : 'NORMAL'}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-emerald-400">HV Line CT-1</td>
                <td className="p-2.5 font-mono">{activeTelemetry?.primaryRatio ?? 600} / 5 A</td>
                <td className="p-2.5 text-emerald-300 font-bold">Class 0.2S</td>
                <td className="p-2.5">{(activeTelemetry?.ctSecA ?? 0).toFixed(3)} A</td>
                <td className="p-2.5">{(activeTelemetry?.ctBurdenVA ?? 0).toFixed(1)} VA</td>
                <td className="p-2.5 text-emerald-400 font-bold">● {isAr ? 'طبيعي' : 'NORMAL'}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-emerald-400">Neutral Ground CT-2</td>
                <td className="p-2.5 font-mono">200 / 5 A</td>
                <td className="p-2.5 text-purple-300 font-bold">{isAr ? 'فئة حماية 5P20' : 'Class 5P20 Protection'}</td>
                <td className="p-2.5">0.12 A ({isAr ? 'المتبقي' : 'Residual'})</td>
                <td className="p-2.5">2.1 VA</td>
                <td className="p-2.5 text-emerald-400 font-bold">● {isAr ? 'متزن' : 'BALANCED'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
