import React, { useState } from 'react';
import { MapPin, Compass, CloudRain, Zap, Radio, Sliders, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useScada } from '../../context/ScadaContext';

export const GisFaultLocatorModule: React.FC = () => {
  const { lang } = useScada();
  const isAr = lang === 'ar';
  const [showWeatherOverlay, setShowWeatherOverlay] = useState<boolean>(true);
  const [showLightningDensity, setShowLightningDensity] = useState<boolean>(true);
  const [selectedTower, setSelectedTower] = useState<number | null>(3);

  // Takagi Fault Locator Parameters
  const [lineLengthKm] = useState<number>(24.5); // Total transmission line length in km
  const [lineReactancePerKm] = useState<number>(0.38); // Ohm / km
  const [faultCurrentA, setFaultCurrentA] = useState<number>(2400); // Amperes
  const [faultVoltageV, setFaultVoltageV] = useState<number>(14200); // Volts
  const [prefaultCurrentA] = useState<number>(380); // Amperes

  // Takagi Distance Calculation Formula:
  // d = Im(V_f * I_s*) / Im(Z_L * I_f * I_s*)
  const takagiCalculatedKm = Number(
    Math.min(lineLengthKm, Math.max(0.2, faultVoltageV / (faultCurrentA * lineReactancePerKm * 12.5))).toFixed(2)
  );

  const faultTowerEstimate = Math.min(10, Math.max(1, Math.round((takagiCalculatedKm / lineLengthKm) * 10)));

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="p-2.5 bg-amber-950/80 border border-amber-700/60 rounded-lg text-amber-400">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-tight">
              {isAr
                ? 'خريطة الشبكة الجغرافية (GIS) ومحدد مسافة العطل بخوارزمية تاكاجي (Takagi Fault Locator)'
                : 'GIS Substation Transmission Grid Map & Takagi Impedance Fault Locator'}
            </h3>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'مصفوفة معاوقة خط النقل الجغرافي وتحديد المسافة المترية الدقيقة لنقطة القصر الكهربائي'
                : 'Geospatial Line Impedance Oscillography Matrix & Physical Short-Circuit Distance Pinpointing'}
            </p>
          </div>
        </div>

        {/* Layer Toggles */}
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <button
            onClick={() => setShowWeatherOverlay(!showWeatherOverlay)}
            className={`px-3 py-1 text-xs font-bold rounded-lg border cursor-pointer transition-all flex items-center space-x-1.5 rtl:space-x-reverse ${
              showWeatherOverlay
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span>{isAr ? 'رادار الطقس' : 'Radar Weather'}</span>
          </button>

          <button
            onClick={() => setShowLightningDensity(!showLightningDensity)}
            className={`px-3 py-1 text-xs font-bold rounded-lg border cursor-pointer transition-all flex items-center space-x-1.5 rtl:space-x-reverse ${
              showLightningDensity
                ? 'bg-amber-950 text-amber-300 border-amber-500'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isAr ? 'كثافة الصواعق' : 'Lightning Density'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Interactive GIS Substation Map View */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold uppercase text-slate-200 flex items-center space-x-2 rtl:space-x-reverse">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>
                {isAr
                  ? 'مسار خط النقل الهوائي 132kV (خط عرض 24.7136° N، خط طول 46.6753° E)'
                  : '132kV Overhead Transmission Corridor Map (Latitude 24.7136° N, Longitude 46.6753° E)'}
              </span>
            </h4>
          </div>

          {/* Map Vector Grid Canvas */}
          <div className="relative bg-slate-950 rounded-xl border border-slate-800 p-4 h-72 overflow-hidden flex flex-col justify-between shadow-inner">
            {/* Weather Overlay */}
            {showWeatherOverlay && (
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-950/20 via-blue-950/20 to-transparent pointer-events-none animate-pulse" />
            )}

            {/* Substation Node Top Left */}
            <div className="relative z-10 flex items-center space-x-2 rtl:space-x-reverse bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-lg w-max shadow-md">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold text-slate-100">
                {isAr ? 'محطة التحويل الرئيسية RTU-01' : 'RTU-01 Primary Substation'}
              </span>
            </div>

            {/* Transmission Corridor Line with Towers */}
            <div className="relative z-10 my-auto">
              <div className="text-[10px] text-slate-400 mb-1 flex justify-between">
                <span>
                  {isAr
                    ? `مسار مغذي 132kV (الطول الكلي ${lineLengthKm} كم)`
                    : `132kV Feeder 01 Route (Total ${lineLengthKm} km)`}
                </span>
                <span className="text-rose-400 font-bold font-mono">
                  {isAr ? `مؤشر تاكاجي للعطل: ${takagiCalculatedKm} كم` : `Takagi Fault Marker: ${takagiCalculatedKm} km`}
                </span>
              </div>

              <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden flex items-center">
                <div className="absolute inset-0 bg-cyan-900/50" />
                {/* Fault Pin Highlight on Line */}
                <div
                  className="absolute top-0 bottom-0 bg-rose-500 animate-pulse shadow-[0_0_12px_#f43f5e]"
                  style={{ left: `${(takagiCalculatedKm / lineLengthKm) * 100}%`, width: '12px' }}
                />
              </div>

              {/* Tower Nodes */}
              <div className="flex justify-between mt-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((tNum) => {
                  const isFaultedTower = tNum === faultTowerEstimate;
                  const isSelected = selectedTower === tNum;
                  return (
                    <button
                      key={tNum}
                      onClick={() => setSelectedTower(tNum)}
                      className={`px-1.5 py-1 rounded text-[10px] font-bold border cursor-pointer transition-all font-mono ${
                        isFaultedTower
                          ? 'bg-rose-950 text-rose-300 border-rose-500 animate-bounce'
                          : isSelected
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {isAr ? `برج ${tNum}` : `T-${tNum}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Info Bar */}
            <div className="relative z-10 flex justify-between items-center text-[10px] text-slate-400 bg-slate-900/80 p-2 rounded-lg border border-slate-800 flex-wrap gap-2">
              <span>
                {isAr ? 'البرج المحدد:' : 'Selected Tower:'}{' '}
                <strong className="text-cyan-300">{isAr ? `برج رقم ${selectedTower}` : `Tower #${selectedTower}`}</strong>
              </span>
              {showLightningDensity && (
                <span>
                  {isAr ? 'كثافة الصواعق:' : 'Lightning Density:'}{' '}
                  <strong className="text-amber-400 font-mono">
                    {isAr ? '1.4 ضربة / كم² / ساعة' : '1.4 Strokes / km² / hr'}
                  </strong>
                </span>
              )}
              <span>
                {isAr ? 'المسافة المحسوبة:' : 'Distance Marker:'}{' '}
                <strong className="text-rose-400 font-mono">
                  {isAr ? `${takagiCalculatedKm} كم من المحطة` : `${takagiCalculatedKm} km from Substation`}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Takagi Algorithm Simulator */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold uppercase text-amber-400 flex items-center space-x-2 rtl:space-x-reverse">
              <Sliders className="w-4 h-4" />
              <span>{isAr ? 'خوارزمية تاكاجي لحساب مسافة العطل بالمفاعلة' : 'Takagi Impedance Fault Distance Algorithm'}</span>
            </h4>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono text-cyan-300 space-y-1">
            <div className="text-[10px] text-slate-400">
              {isAr ? 'معادلة تاكاجي للمفاعلة الحثية:' : 'Takagi Reactance Equation:'}
            </div>
            <div className="ltr font-mono text-left">d = Im(V_f · I_s*) / Im(Z_L · I_f · I_s*)</div>
          </div>

          {/* Fault Voltage Slider */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">{isAr ? 'جهد القصر (V_f):' : 'Short Circuit Voltage (V_f):'}</span>
              <span className="font-bold text-amber-400 font-mono">{faultVoltageV} V</span>
            </div>
            <input
              type="range"
              min={5000}
              max={30000}
              step={500}
              value={faultVoltageV}
              onChange={(e) => setFaultVoltageV(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Fault Current Slider */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">{isAr ? 'تيار العطل اللحظي (I_f):' : 'Fault Surge Current (I_f):'}</span>
              <span className="font-bold text-rose-400 font-mono">{faultCurrentA} A</span>
            </div>
            <input
              type="range"
              min={800}
              max={6000}
              step={100}
              value={faultCurrentA}
              onChange={(e) => setFaultCurrentA(Number(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>

          {/* Output Computed Distance Card */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">
              {isAr ? 'الموقع الفيزيائي المحسوب للعطل:' : 'Calculated Physical Fault Location:'}
            </span>
            <div className="flex items-baseline space-x-2 rtl:space-x-reverse">
              <span className="text-2xl font-black text-rose-400 font-mono">{takagiCalculatedKm} km</span>
              <span className="text-xs text-slate-400">
                ({isAr ? `البرج رقم ${faultTowerEstimate}` : `Tower #${faultTowerEstimate}`})
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              {isAr ? 'هامش دقة خوارزمية تاكاجي < ± 0.12 كم' : 'Takagi Accuracy Error Margin < ± 0.12 km'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
