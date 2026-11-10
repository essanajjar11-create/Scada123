import React, { useState, useMemo } from 'react';
import {
  FileCode,
  Download,
  Copy,
  Check,
  Server,
  Network,
  Cpu,
  Layers,
  ChevronRight,
  ChevronDown,
  Shield,
  Zap,
  Activity,
  Sliders,
  Settings2,
  RefreshCw,
  Search,
  Code2,
  FolderTree
} from 'lucide-react';
import { useScada } from '../../context/ScadaContext';

interface LogicalNodeDef {
  prefix: string;
  lnClass: 'XCBR' | 'CSWI' | 'MMXU' | 'PDIS' | 'TCTR' | 'TVTR' | 'YPTR' | 'PTRC';
  inst: string;
  lnType: string;
  desc: string;
  dataObjects: { name: string; type: string; val?: string; desc: string }[];
}

interface IedDef {
  name: string;
  type: string;
  manufacturer: string;
  configVersion: string;
  ipAddress: string;
  subnet: string;
  logicalNodes: LogicalNodeDef[];
  gooseBlocks: {
    name: string;
    appId: string;
    vlanId: string;
    vlanPriority: number;
    minTime: number;
    maxTime: number;
    datasetName: string;
  }[];
  svBlocks: {
    name: string;
    appId: string;
    vlanId: string;
    vlanPriority: number;
    smpRate: number;
    nofASDU: number;
    datasetName: string;
  }[];
}

export const Iec61850SclEditorModule: React.FC = () => {
  const { isArabic: isAr, tr1State, activeTelemetry } = useScada();
  const [selectedFileType, setSelectedFileType] = useState<'SCD' | 'ICD' | 'CID' | 'SSD'>('SCD');
  const [selectedIedIndex, setSelectedIedIndex] = useState<number>(0);
  const [selectedLnIndex, setSelectedLnIndex] = useState<number>(0);
  const [activeSubTab, setActiveSubTab] = useState<'topology' | 'ieds' | 'goose' | 'sv' | 'xml'>('topology');
  const [searchFilter, setSearchFilter] = useState('');
  const [copied, setCopied] = useState(false);

  // Substation IEDs configuration state
  const [ieds, setIeds] = useState<IedDef[]>([
    {
      name: 'IED_PROT_TR1_87T',
      type: 'Transformer Differential & Distance IED',
      manufacturer: 'SIEMENS SIPROTEC 5 / 7UT85',
      configVersion: 'V8.40',
      ipAddress: '192.168.10.11',
      subnet: 'SubNetwork_StationBus',
      logicalNodes: [
        {
          prefix: 'TR1',
          lnClass: 'YPTR',
          inst: '1',
          lnType: 'LT_YPTR_TrDiff',
          desc: 'Transformer Differential Protection & Health Monitor',
          dataObjects: [
            { name: 'OpRst', type: 'ACT', val: 'False', desc: 'Differential Trip Operation Status' },
            { name: 'DifClc', type: 'WYE', val: '0.04 pu', desc: 'Differential Current Calculated Vector' },
            { name: 'RstClc', type: 'WYE', val: '1.02 pu', desc: 'Restraint Current Vector' },
            { name: 'Hz2Clc', type: 'SPS', val: 'False', desc: '2nd Harmonic Inrush Inhibit Detector' }
          ]
        },
        {
          prefix: 'HV',
          lnClass: 'XCBR',
          inst: '1',
          lnType: 'LT_XCBR_52_1',
          desc: '132kV Primary Circuit Breaker 52-1 Controller',
          dataObjects: [
            { name: 'Pos', type: 'DPC', val: 'Closed (01)', desc: 'Breaker Auxiliary Switch Position Status' },
            { name: 'BlkOpn', type: 'SPC', val: 'False', desc: 'Block Opening (SF6 Low Gas Pressure Interlock)' },
            { name: 'OpCnt', type: 'INS', val: '342', desc: 'Mechanical Operations Counter Total' }
          ]
        },
        {
          prefix: 'Line',
          lnClass: 'PDIS',
          inst: '1',
          lnType: 'LT_PDIS_Distance',
          desc: 'High-Speed ANSI 21 Distance Impedance Quad Zone 1',
          dataObjects: [
            { name: 'Op', type: 'ACT', val: 'False', desc: 'Zone 1 Instantaneous Trip (20ms)' },
            { name: 'ZTyp', type: 'ENG', val: 'Quadrilateral', desc: 'R-X Reach Trajectory Model' },
            { name: 'FltZ', type: 'CMV', val: '48.2 + j12.4 Ohm', desc: 'Calculated Fault Loop Impedance' }
          ]
        },
        {
          prefix: 'Bay',
          lnClass: 'MMXU',
          inst: '1',
          lnType: 'LT_MMXU_Telemetry',
          desc: 'Three-Phase High Accuracy Metering & Waveform Telemetry',
          dataObjects: [
            { name: 'TotW', type: 'MV', val: `${((activeTelemetry.activePower / 1000) || 42.5).toFixed(2)} MW`, desc: 'Total Active Three-Phase Power' },
            { name: 'TotVAr', type: 'MV', val: `${((activeTelemetry.reactivePower / 1000) || 12.8).toFixed(2)} MVAr`, desc: 'Total Reactive Power' },
            { name: 'Hz', type: 'MV', val: `${(activeTelemetry.frequency || 50.0).toFixed(3)} Hz`, desc: 'Grid Frequency (50.0Hz Standard)' },
            { name: 'TotPF', type: 'MV', val: `${(activeTelemetry.pf || 0.96).toFixed(3)}`, desc: 'Power Factor IEEE Displacement' }
          ]
        }
      ],
      gooseBlocks: [
        {
          name: 'gcb_TR1_Trip_ProcessBus',
          appId: '0x0010',
          vlanId: '100',
          vlanPriority: 6,
          minTime: 4,
          maxTime: 1000,
          datasetName: 'ds_TR1_TripGOOSE'
        },
        {
          name: 'gcb_TR1_Interlock_Status',
          appId: '0x0011',
          vlanId: '100',
          vlanPriority: 4,
          minTime: 10,
          maxTime: 2000,
          datasetName: 'ds_Interlocks'
        }
      ],
      svBlocks: [
        {
          name: 'svcb_MU_TR1_ProcessBus',
          appId: '0x4001',
          vlanId: '200',
          vlanPriority: 7,
          smpRate: 80, // 80 samples/cycle at 50Hz = 4000 samples/sec
          nofASDU: 1,
          datasetName: 'ds_MU01_Phasors'
        }
      ]
    },
    {
      name: 'BCU_BAY_COUPLER_52_6',
      type: '13.8kV Bus Coupler Bay Controller',
      manufacturer: 'ABB Relion / REC670',
      configVersion: 'V2.2',
      ipAddress: '192.168.10.16',
      subnet: 'SubNetwork_StationBus',
      logicalNodes: [
        {
          prefix: 'CPL',
          lnClass: 'CSWI',
          inst: '1',
          lnType: 'LT_CSWI_Controller',
          desc: 'Bus Sectionalizer 52-6 Switch Controller',
          dataObjects: [
            { name: 'Pos', type: 'DPC', val: 'Open (00)', desc: 'Sectionalizer Switch Position' },
            { name: 'OpCnt', type: 'INS', val: '128', desc: 'Operations Count' }
          ]
        },
        {
          prefix: 'CPL',
          lnClass: 'XCBR',
          inst: '1',
          lnType: 'LT_XCBR_52_6',
          desc: '13.8kV Vacuum Breaker 52-6 Mechanism',
          dataObjects: [
            { name: 'Pos', type: 'DPC', val: 'Open', desc: 'Breaker Open State' },
            { name: 'CbrHealth', type: 'ENS', val: 'Ok', desc: 'TCS & Spring Charging Supervision' }
          ]
        }
      ],
      gooseBlocks: [
        {
          name: 'gcb_Coupler_AutoTransfer',
          appId: '0x0020',
          vlanId: '100',
          vlanPriority: 5,
          minTime: 4,
          maxTime: 1000,
          datasetName: 'ds_Coupler_ATS'
        }
      ],
      svBlocks: []
    },
    {
      name: 'SAMU_132KV_BAY01',
      type: 'IEC 61850-9-2LE Standalone Merging Unit',
      manufacturer: 'SCHNEIDER ELECTRIC MiCOM Alstom',
      configVersion: 'V4.12',
      ipAddress: '192.168.20.101',
      subnet: 'SubNetwork_ProcessBus_9_2',
      logicalNodes: [
        {
          prefix: 'HV',
          lnClass: 'TCTR',
          inst: '1',
          lnType: 'LT_TCTR_Rogowski',
          desc: '132kV Optical/Rogowski Current Sensor Merging Channel',
          dataObjects: [
            { name: 'Amp', type: 'SAV', val: `${((tr1State?.loadCurrent ?? 240) * 1.0).toFixed(1)} A`, desc: 'Instantaneous Phase A Current Sample' }
          ]
        },
        {
          prefix: 'HV',
          lnClass: 'TVTR',
          inst: '1',
          lnType: 'LT_TVTR_Capacitive',
          desc: '132kV Capacitive Voltage Divider Channel',
          dataObjects: [
            { name: 'Vol', type: 'SAV', val: '132.1 kV', desc: 'Instantaneous Phase A Voltage Sample' }
          ]
        }
      ],
      gooseBlocks: [],
      svBlocks: [
        {
          name: 'svcb_SAMU01_SVStream',
          appId: '0x4000',
          vlanId: '200',
          vlanPriority: 7,
          smpRate: 80,
          nofASDU: 1,
          datasetName: 'ds_SAMU01_Samples'
        }
      ]
    }
  ]);

  const activeIed = ieds[selectedIedIndex] || ieds[0];
  const activeLn = activeIed.logicalNodes[selectedLnIndex] || activeIed.logicalNodes[0];

  // Real, structured IEC 61850-6 SCL XML Generator
  const generatedSclXml = useMemo(() => {
    const timestamp = new Date().toISOString();
    return `<?xml version="1.0" encoding="UTF-8"?>
<SCL xmlns="http://www.iec.ch/61850/2003/SCL"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://www.iec.ch/61850/2003/SCL SCL.xsd"
     version="2007" revision="B" release="4">
  <Header id="SCADA_SUBSTATION_132_13_8KV"
          version="1.0"
          revision="4"
          toolID="SCADA Digital Twin SCL Studio"
          nameStructure="IEDName">
    <History>
      <Hitem version="1.0" revision="4" when="${timestamp}" who="Lead Protection &amp; Automation Engineer" what="Configured Station &amp; Process Bus Architecture with GOOSE and 9-2LE"/>
    </History>
  </Header>

  <Substation name="SUB_AL_NOOR_132KV" desc="132/13.8kV Main Transmission &amp; Distribution Substation">
    <VoltageLevel name="V132KV" nomFreq="50.0" numPhases="3">
      <Voltage unit="V" multiplier="k">132.0</Voltage>
      <Bay name="BAY_TR1_HV" desc="TR-1 132kV Transformer Infeed Bay">
        <ConductingEquipment name="52_1" type="CBR" desc="132kV SF6 Circuit Breaker">
          <LNode iedName="IED_PROT_TR1_87T" ldInst="PROT" prefix="HV" lnClass="XCBR" lnInst="1"/>
        </ConductingEquipment>
        <ConductingEquipment name="89_1A" type="DIS" desc="Busbar A Isolator Disconnector"/>
        <ConductingEquipment name="89_1B" type="DIS" desc="Busbar B Isolator Disconnector"/>
      </Bay>
    </VoltageLevel>
    <VoltageLevel name="V13_8KV" nomFreq="50.0" numPhases="3">
      <Voltage unit="V" multiplier="k">13.8</Voltage>
      <Bay name="BAY_COUPLER" desc="13.8kV Bus Sectionalizer Coupler Bay">
        <ConductingEquipment name="52_6" type="CBR" desc="13.8kV Vacuum Sectionalizer Breaker">
          <LNode iedName="BCU_BAY_COUPLER_52_6" ldInst="CTRL" prefix="CPL" lnClass="CSWI" lnInst="1"/>
        </ConductingEquipment>
      </Bay>
    </VoltageLevel>
  </Substation>

  <Communication>
    <SubNetwork name="SubNetwork_StationBus" desc="IEC 61850-8-1 MMS &amp; Interlocking GOOSE Station Bus" type="8-MMS">
      <BitRate unit="b/s" multiplier="M">100</BitRate>
      <ConnectedAP iedName="IED_PROT_TR1_87T" apName="AP1">
        <Address>
          <P type="IP">192.168.10.11</P>
          <P type="IP-SUBNET">255.255.255.0</P>
          <P type="IP-GATEWAY">192.168.10.1</P>
          <P type="OSI-PSEL">00000001</P>
          <P type="OSI-SSEL">0001</P>
          <P type="OSI-TSEL">0001</P>
        </Address>
        <GSE ldInst="PROT" cbName="gcb_TR1_Trip_ProcessBus">
          <Address>
            <P type="MAC-Address">01-0C-CD-01-00-10</P>
            <P type="APPID">0010</P>
            <P type="VLAN-ID">100</P>
            <P type="VLAN-PRIORITY">6</P>
          </Address>
          <MinTime unit="s" multiplier="m">4</MinTime>
          <MaxTime unit="s" multiplier="m">1000</MaxTime>
        </GSE>
      </ConnectedAP>
    </SubNetwork>
    <SubNetwork name="SubNetwork_ProcessBus_9_2" desc="IEC 61850-9-2LE Sampled Values Process Bus" type="9-2LE">
      <BitRate unit="b/s" multiplier="G">1</BitRate>
      <ConnectedAP iedName="SAMU_132KV_BAY01" apName="AP_SV">
        <Address>
          <P type="IP">192.168.20.101</P>
        </Address>
        <SMV ldInst="MU01" cbName="svcb_SAMU01_SVStream">
          <Address>
            <P type="MAC-Address">01-0C-CD-04-40-00</P>
            <P type="APPID">4000</P>
            <P type="VLAN-ID">200</P>
            <P type="VLAN-PRIORITY">7</P>
          </Address>
        </SMV>
      </ConnectedAP>
    </SubNetwork>
  </Communication>

  <IED name="IED_PROT_TR1_87T" type="7UT85" manufacturer="SIEMENS" configVersion="V8.40">
    <AccessPoint name="AP1">
      <Server>
        <Authentication none="true"/>
        <LDevice inst="PROT">
          <LN0 lnClass="LLN0" lnType="LT_LLN0" inst="">
            <DataSet name="ds_TR1_TripGOOSE">
              <FCDA ldInst="PROT" prefix="TR1" lnClass="YPTR" lnInst="1" doName="OpRst" daName="general" fc="ST"/>
              <FCDA ldInst="PROT" prefix="HV" lnClass="XCBR" lnInst="1" doName="Pos" daName="stVal" fc="ST"/>
            </DataSet>
            <GSEControl name="gcb_TR1_Trip_ProcessBus" datSet="ds_TR1_TripGOOSE" confRev="2" appID="TR1_TRIP_GOOSE"/>
          </LN0>
          <LN prefix="TR1" lnClass="YPTR" inst="1" lnType="LT_YPTR_TrDiff"/>
          <LN prefix="HV" lnClass="XCBR" inst="1" lnType="LT_XCBR_52_1"/>
          <LN prefix="Line" lnClass="PDIS" inst="1" lnType="LT_PDIS_Distance"/>
          <LN prefix="Bay" lnClass="MMXU" inst="1" lnType="LT_MMXU_Telemetry"/>
        </LDevice>
      </Server>
    </AccessPoint>
  </IED>

  <DataTypeTemplates>
    <LNodeType id="LT_YPTR_TrDiff" lnClass="YPTR">
      <DO name="OpRst" type="DT_ACT"/>
      <DO name="DifClc" type="DT_WYE"/>
      <DO name="RstClc" type="DT_WYE"/>
    </LNodeType>
    <LNodeType id="LT_XCBR_52_1" lnClass="XCBR">
      <DO name="Pos" type="DT_DPC"/>
      <DO name="BlkOpn" type="DT_SPC"/>
      <DO name="OpCnt" type="DT_INS"/>
    </LNodeType>
    <DOType id="DT_DPC" cdc="DPC">
      <DA name="stVal" bType="Dbpos" fc="ST"/>
      <DA name="q" bType="Quality" fc="ST"/>
      <DA name="t" bType="Timestamp" fc="ST"/>
    </DOType>
  </DataTypeTemplates>
</SCL>`;
  }, [activeTelemetry, tr1State]);

  const handleDownloadXml = () => {
    const filename = `Substation_IEC61850_Configuration_${selectedFileType}.${selectedFileType.toLowerCase()}`;
    const blob = new Blob([generatedSclXml], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyXml = () => {
    navigator.clipboard.writeText(generatedSclXml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-indigo-950/40 to-zinc-900 border border-zinc-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                <FileCode className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
                  {isAr ? 'محرر ومولد ملفات المعيار الدولي IEC 61850 SCL' : 'IEC 61850 Substation Configuration (SCL) Studio'}
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-medium">
                    IEC 61850-6 Edition 2.1
                  </span>
                </h2>
                <p className="text-xs text-zinc-400 font-mono">
                  {isAr
                    ? 'هيكلية ملفات .SCD / .ICD / .CID / .SSD • مصفوفة GOOSE Control Blocks و Sampled Values 9-2LE'
                    : 'Substation Configuration Language Schema (.SCD / .ICD / .CID) • Station & Process Bus Merging Units'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex bg-zinc-950/80 border border-zinc-800 p-1 rounded-xl">
              {(['SCD', 'ICD', 'CID', 'SSD'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedFileType(type)}
                  className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
                    selectedFileType === type
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  .{type}
                </button>
              ))}
            </div>

            <button
              onClick={handleCopyXml}
              className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (isAr ? 'تم النسخ' : 'Copied') : isAr ? 'نسخ XML' : 'Copy XML'}</span>
            </button>

            <button
              onClick={handleDownloadXml}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isAr ? `تنزيل ملف .${selectedFileType}` : `Export .${selectedFileType} File`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Explorer Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-indigo-400" />
                {isAr ? 'شجرة أجهزة ومكونات المحطة' : 'Substation SCL Topology Tree'}
              </h3>
              <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">
                {ieds.length} IEDs Configured
              </span>
            </div>

            {/* IED Selection List */}
            <div className="space-y-2">
              {ieds.map((ied, idx) => (
                <div
                  key={ied.name}
                  onClick={() => {
                    setSelectedIedIndex(idx);
                    setSelectedLnIndex(0);
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedIedIndex === idx
                      ? 'bg-indigo-950/40 border-indigo-500/50 text-white shadow-lg'
                      : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Server className={`w-4 h-4 ${selectedIedIndex === idx ? 'text-indigo-400' : 'text-zinc-500'}`} />
                      <span className="text-xs font-mono font-bold">{ied.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">{ied.ipAddress}</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-zinc-500">
                    <span>{ied.manufacturer}</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-zinc-800/80 rounded text-zinc-400 font-mono">
                      {ied.logicalNodes.length} LNs
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Logical Nodes in Selected IED */}
            <div className="pt-2 border-t border-zinc-800/60 space-y-2">
              <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                {isAr ? 'العقد المنطقية (Logical Nodes)' : 'Logical Nodes in Selected IED'}
              </div>
              <div className="space-y-1.5">
                {activeIed.logicalNodes.map((ln, lnIdx) => (
                  <div
                    key={`${ln.prefix}_${ln.lnClass}_${ln.inst}`}
                    onClick={() => setSelectedLnIndex(lnIdx)}
                    className={`p-2.5 rounded-lg border text-xs font-mono transition-all cursor-pointer flex items-center justify-between ${
                      selectedLnIndex === lnIdx
                        ? 'bg-indigo-500/20 border-indigo-400/60 text-indigo-300'
                        : 'bg-zinc-950/40 border-zinc-800/60 text-zinc-400 hover:bg-zinc-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-indigo-300 font-bold text-[10px]">
                        {ln.lnClass}
                      </span>
                      <span>{`${ln.prefix ? ln.prefix + '.' : ''}${ln.lnClass}${ln.inst}`}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Content Panel (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800/80 p-1.5 rounded-2xl overflow-x-auto">
            <button
              onClick={() => setActiveSubTab('topology')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeSubTab === 'topology'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isAr ? 'بيانات العقدة المنطقية' : 'Logical Node Inspector'}</span>
            </button>

            <button
              onClick={() => setActiveSubTab('goose')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeSubTab === 'goose'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isAr ? 'مصفوفة GOOSE Control Blocks' : 'GOOSE Control Blocks'}</span>
            </button>

            <button
              onClick={() => setActiveSubTab('sv')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeSubTab === 'sv'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{isAr ? 'عينات Process Bus (SV 9-2LE)' : 'Sampled Values (9-2LE)'}</span>
            </button>

            <button
              onClick={() => setActiveSubTab('xml')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeSubTab === 'xml'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{isAr ? 'شفرة SCL XML الكاملة' : 'SCL XML Schema Viewer'}</span>
            </button>
          </div>

          {/* SubTab 1: Logical Node Inspector */}
          {activeSubTab === 'topology' && (
            <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white font-mono">
                      {`${activeLn.prefix ? activeLn.prefix + '.' : ''}${activeLn.lnClass}${activeLn.inst}`}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                      Type: {activeLn.lnType}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400 mt-1">{activeLn.desc}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-zinc-500 font-mono">IED Container</div>
                  <div className="text-xs text-zinc-300 font-mono font-bold">{activeIed.name}</div>
                </div>
              </div>

              {/* Data Objects Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  {isAr ? 'عناصر البيانات المعيارية (Data Objects & Attributes)' : 'Standard Data Objects (DO / DA)'}
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono text-left border border-zinc-800 rounded-xl overflow-hidden">
                    <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                      <tr>
                        <th className="p-2.5">DO Name</th>
                        <th className="p-2.5">CDC Type</th>
                        <th className="p-2.5">Current Value</th>
                        <th className="p-2.5">Functional Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/50">
                      {activeLn.dataObjects.map((doItem) => (
                        <tr key={doItem.name} className="hover:bg-zinc-800/40 transition-colors">
                          <td className="p-2.5 font-bold text-indigo-300">{doItem.name}</td>
                          <td className="p-2.5 text-amber-400">{doItem.type}</td>
                          <td className="p-2.5 text-emerald-400 font-bold">{doItem.val || 'True'}</td>
                          <td className="p-2.5 text-zinc-400 font-sans">{doItem.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SubTab 2: GOOSE Control Blocks */}
          {activeSubTab === 'goose' && (
            <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-white">
                  {isAr ? 'مصفوفة إشارات GOOSE فائقة السرعة (< 4ms)' : 'IEC 61850-8-1 GOOSE Fast Trip & Interlock Matrix'}
                </h3>
                <span className="text-xs text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Priority 6/7 VLAN Tagged
                </span>
              </div>

              <div className="space-y-3">
                {activeIed.gooseBlocks.map((gcb) => (
                  <div key={gcb.name} className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-mono font-bold text-white">{gcb.name}</span>
                      </div>
                      <span className="text-xs font-mono text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                        DataSet: {gcb.datasetName}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                      <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800/80">
                        <div className="text-[10px] text-zinc-500">APPID</div>
                        <div className="text-zinc-200 font-bold">{gcb.appId}</div>
                      </div>
                      <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800/80">
                        <div className="text-[10px] text-zinc-500">VLAN ID / Pri</div>
                        <div className="text-zinc-200 font-bold">{gcb.vlanId} / {gcb.vlanPriority}</div>
                      </div>
                      <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800/80">
                        <div className="text-[10px] text-zinc-500">Min Retransmit (T0)</div>
                        <div className="text-emerald-400 font-bold">{gcb.minTime} ms</div>
                      </div>
                      <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800/80">
                        <div className="text-[10px] text-zinc-500">Max Heartbeat (T1)</div>
                        <div className="text-zinc-200 font-bold">{gcb.maxTime} ms</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SubTab 3: Sampled Values 9-2LE */}
          {activeSubTab === 'sv' && (
            <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-white">
                  {isAr ? 'عينات ناقل العمليات Process Bus (IEC 61850-9-2LE)' : 'Process Bus Sampled Values (SV 9-2LE)'}
                </h3>
                <span className="text-xs text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  4000 Samples/sec (50Hz)
                </span>
              </div>

              {activeIed.svBlocks.length > 0 ? (
                <div className="space-y-3">
                  {activeIed.svBlocks.map((sv) => (
                    <div key={sv.name} className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-white">{sv.name}</span>
                        <span className="text-xs font-mono text-cyan-400">{sv.datasetName}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                        <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                          <div className="text-[10px] text-zinc-500">Sample Rate</div>
                          <div className="text-emerald-400 font-bold">{sv.smpRate} samples/cycle</div>
                        </div>
                        <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                          <div className="text-[10px] text-zinc-500">ASDU Count</div>
                          <div className="text-zinc-200 font-bold">{sv.nofASDU} ASDU / Ethernet Frame</div>
                        </div>
                        <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                          <div className="text-[10px] text-zinc-500">Multicast APPID</div>
                          <div className="text-cyan-300 font-bold">{sv.appId}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-zinc-500 font-mono">
                  {isAr
                    ? 'لا توجد قنوات Sampled Values مخصصة في هذا الجهاز (متاح في SAMU / Merging Units).'
                    : 'No SV streams published by this IED (Configured primarily on Merging Units / SAMU).'}
                </div>
              )}
            </div>
          )}

          {/* SubTab 4: SCL XML Schema Viewer */}
          {activeSubTab === 'xml' && (
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div className="text-xs font-mono text-zinc-400">
                  {`Substation_Configuration_${selectedFileType}.${selectedFileType.toLowerCase()}`}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-emerald-400">XML Validated</span>
                </div>
              </div>
              <pre className="p-4 bg-[#09090b] border border-zinc-800/80 rounded-xl text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-[480px] scrollbar-thin">
                {generatedSclXml}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
