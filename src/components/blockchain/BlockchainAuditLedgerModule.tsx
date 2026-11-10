import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Key,
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Download,
  Terminal,
  Activity,
  FileCheck,
  Zap,
  Layers,
  Sparkles
} from 'lucide-react';
import { useScada } from '../../context/ScadaContext';

interface Block {
  index: number;
  timestamp: string;
  operatorName: string;
  actionType: 'BREAKER_TOGGLE' | 'LOTO_ISOLATION' | 'FAULT_INJECTION' | 'RELAY_SETTING' | 'GENESIS';
  payload: string;
  previousHash: string;
  hash: string;
  nonce: number;
  isTampered?: boolean;
}

// Simple deterministic SHA-256 calculation for fast browser sync
async function calculateSha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const BlockchainAuditLedgerModule: React.FC = () => {
  const { isArabic: isAr, currentUserName, addSoeEvent, addToast } = useScada();

  const [chain, setChain] = useState<Block[]>([]);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    brokenIndex: number | null;
    verifiedAt: string;
  } | null>(null);

  // Initialize Genesis & historical blocks
  useEffect(() => {
    async function initChain() {
      const b0Payload = 'GENESIS BLOCK: SCADA Substation 132/13.8kV Immutable Audit Authority';
      const b0Prev = '0000000000000000000000000000000000000000000000000000000000000000';
      const b0Hash = await calculateSha256(`0_2026-08-19T00:00:00.000Z_SYSTEM_GENESIS_${b0Payload}_${b0Prev}_101`);

      const b1Payload = 'Circuit Breaker 52-1 Closed into Ring Busbar A (HV Infeed Energized)';
      const b1Hash = await calculateSha256(`1_2026-08-19T00:15:20.000Z_Eng. Aram Sam_BREAKER_TOGGLE_${b1Payload}_${b0Hash}_204`);

      const b2Payload = 'Lockout/Tagout (LOTO-2026-092) Authorized for TR-1 Bushing Maintenance';
      const b2Hash = await calculateSha256(`2_2026-08-19T00:45:10.000Z_Safety Chief Tariq_LOTO_ISOLATION_${b2Payload}_${b1Hash}_389`);

      const b3Payload = 'Overcurrent Relay 50/51 Pickup Threshold adjusted to 2.1x Inominal';
      const b3Hash = await calculateSha256(`3_2026-08-19T01:10:05.000Z_Lead Prot Eng_RELAY_SETTING_${b3Payload}_${b2Hash}_512`);

      setChain([
        {
          index: 0,
          timestamp: '2026-08-19T00:00:00.000Z',
          operatorName: 'SYSTEM / SAS CORE',
          actionType: 'GENESIS',
          payload: b0Payload,
          previousHash: b0Prev,
          hash: b0Hash,
          nonce: 101
        },
        {
          index: 1,
          timestamp: '2026-08-19T00:15:20.000Z',
          operatorName: 'Eng. Aram Sam',
          actionType: 'BREAKER_TOGGLE',
          payload: b1Payload,
          previousHash: b0Hash,
          hash: b1Hash,
          nonce: 204
        },
        {
          index: 2,
          timestamp: '2026-08-19T00:45:10.000Z',
          operatorName: 'Safety Chief Tariq',
          actionType: 'LOTO_ISOLATION',
          payload: b2Payload,
          previousHash: b1Hash,
          hash: b2Hash,
          nonce: 389
        },
        {
          index: 3,
          timestamp: '2026-08-19T01:10:05.000Z',
          operatorName: 'Lead Prot Eng',
          actionType: 'RELAY_SETTING',
          payload: b3Payload,
          previousHash: b2Hash,
          hash: b3Hash,
          nonce: 512
        }
      ]);
    }
    initChain();
  }, []);

  // Mine & append a new action block
  const handleAddNewAuditBlock = async (actionType: Block['actionType'], payload: string) => {
    if (chain.length === 0) return;
    const lastBlock = chain[chain.length - 1];
    const newIndex = lastBlock.index + 1;
    const timestamp = new Date().toISOString();
    const nonce = Math.floor(Math.random() * 10000) + 100;
    const prevHash = lastBlock.hash;

    const blockHash = await calculateSha256(
      `${newIndex}_${timestamp}_${currentUserName}_${actionType}_${payload}_${prevHash}_${nonce}`
    );

    const newBlock: Block = {
      index: newIndex,
      timestamp,
      operatorName: currentUserName || 'Current Operator',
      actionType,
      payload,
      previousHash: prevHash,
      hash: blockHash,
      nonce
    };

    setChain((prev) => [...prev, newBlock]);
    setVerificationResult(null); // Reset verification state

    addSoeEvent(
      `Block #${newIndex} Mined: ${actionType} - Hash ${blockHash.substring(0, 10)}...`,
      'Blockchain Ledger',
      'LEDGER',
      'INFO'
    );

    addToast(
      isAr
        ? `تم توثيق وتعدين الكتلة رقم #${newIndex} في سجل البلوكتشين بنجاح`
        : `Cryptographic Block #${newIndex} Appended & Mined Successfully`,
      'success'
    );
  };

  // Perform full cryptographic integrity verification
  const handleVerifyLedgerIntegrity = async () => {
    setIsVerifying(true);
    let isValid = true;
    let brokenIndex: number | null = null;

    for (let i = 0; i < chain.length; i++) {
      const block = chain[i];

      // 1. Check previousHash link
      if (i > 0) {
        if (block.previousHash !== chain[i - 1].hash) {
          isValid = false;
          brokenIndex = i;
          break;
        }
      }

      // 2. Re-calculate SHA-256 and check mismatch
      const expectedHash = await calculateSha256(
        `${block.index}_${block.timestamp}_${block.operatorName}_${block.actionType}_${block.payload}_${block.previousHash}_${block.nonce}`
      );

      if (block.hash !== expectedHash) {
        isValid = false;
        brokenIndex = i;
        break;
      }
    }

    setIsVerifying(false);
    setVerificationResult({
      isValid,
      brokenIndex,
      verifiedAt: new Date().toLocaleTimeString()
    });

    if (isValid) {
      addToast(
        isAr
          ? 'تم التحقق بنجاح: سجل البلوكتشين سليم 100% ومطابق لمعايير NERC-CIP-007'
          : 'Consensus Validated: 100% Cryptographic Chain Integrity Verified',
        'success'
      );
    } else {
      addToast(
        isAr
          ? `تحذير أمني: تم اكتشاف تلاعب في الكتلة رقم #${brokenIndex}!`
          : `Security Alert: Tampering Discovered at Block #${brokenIndex}!`,
        'error'
      );
    }
  };

  // Simulate a malicious cyber-tamper attack on Block #2
  const handleSimulateTamperAttack = () => {
    setChain((prev) =>
      prev.map((b) => {
        if (b.index === 2) {
          return {
            ...b,
            payload: 'TAMPERED: Unauthorized Bypass of TR-1 Differential Trip Interlock!',
            isTampered: true
          };
        }
        return b;
      })
    );

    setVerificationResult(null);

    addSoeEvent(
      'SECURITY INTRUSION: Record in Block #2 modified maliciously!',
      'Blockchain Ledger',
      'LEDGER',
      'CRITICAL'
    );

    addToast(
      isAr
        ? 'تمت محاكاة هجوم تلاعب بالسجل في الكتلة #2 - انقر على "التحقق من سلامة السلسلة" لرؤية الاستجابة'
        : 'Tampering Simulated on Block #2: Click "Verify Chain Integrity" to audit',
      'info'
    );
  };

  // Restore chain
  const handleRestoreChain = async () => {
    const b2Payload = 'Lockout/Tagout (LOTO-2026-092) Authorized for TR-1 Bushing Maintenance';
    const b1Hash = chain[1]?.hash || '';
    const b2Hash = await calculateSha256(`2_2026-08-19T00:45:10.000Z_Safety Chief Tariq_LOTO_ISOLATION_${b2Payload}_${b1Hash}_389`);

    setChain((prev) =>
      prev.map((b) => {
        if (b.index === 2) {
          return {
            ...b,
            payload: b2Payload,
            hash: b2Hash,
            isTampered: false
          };
        }
        return b;
      })
    );

    setVerificationResult(null);

    addToast(
      isAr ? 'تمت استعادة السلسلة من النسخ المطابقة (Consensus Nodes)' : 'Chain Repaired from Consensus Ledger',
      'success'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-950/40 via-zinc-900 to-indigo-950/40 border border-violet-500/20 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-violet-500/10 border border-violet-500/20 rounded-xl text-violet-400">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
                  {isAr ? 'سجل البلوكتشين المشفر لتوثيق المناورات (Immutable Audit Ledger)' : 'Cryptographic Immutable Audit Ledger'}
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 font-mono font-bold">
                    NERC-CIP-007 / IEC 62443
                  </span>
                </h2>
                <p className="text-xs text-zinc-400 font-mono">
                  {isAr
                    ? 'سلسلة تجزئة SHA-256 غير قابلة للتعديل لتوثيق مناورات القواطع وتصاريح LOTO والإنذارات الحرجة'
                    : 'SHA-256 Cryptographic Hash Chaining • Zero-Trust Substation Event Immutability & Tamper Detection'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleVerifyLedgerIntegrity}
              disabled={isVerifying}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-md shadow-violet-600/25 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isVerifying ? (isAr ? 'جاري التحقق...' : 'Auditing...') : isAr ? 'التحقق من سلامة السلسلة' : 'Verify Chain Integrity'}</span>
            </button>

            <button
              onClick={handleSimulateTamperAttack}
              className="px-3.5 py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>{isAr ? 'محاكاة تلاعب خبيث' : 'Simulate Tamper Attack'}</span>
            </button>

            <button
              onClick={handleRestoreChain}
              className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isAr ? 'إصلاح السجل' : 'Restore Consensus'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Verification Status Banner (if performed) */}
      {verificationResult && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
            verificationResult.isValid
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-3">
            {verificationResult.isValid ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
            )}
            <div>
              <div className="text-sm font-bold font-mono">
                {verificationResult.isValid
                  ? isAr
                    ? 'تم فحص وتأكيد سلامة جميع الكتل المشفرة بنجاح (100% Valid Hash Chain)'
                    : 'Cryptographic Audit Passed: 100% Chain Integrity Verified (Zero Tampering)'
                  : isAr
                  ? `فشل التدقيق: تم اكتشاف كسر في سلسلة التجزئة عند الكتلة رقم #${verificationResult.brokenIndex}!`
                  : `Integrity Breach Detected: SHA-256 Hash Chain broken at Block #${verificationResult.brokenIndex}!`}
              </div>
              <div className="text-xs opacity-80 font-mono">
                Audit Verified at {verificationResult.verifiedAt} • NERC-CIP-007 Standard Compliant
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Block Dispatcher */}
      <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs font-bold text-zinc-300 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-violet-400" />
          {isAr ? 'تسجيل عملية جديدة في البلوكتشين فوراً:' : 'Mine Operational Action to Immutable Ledger:'}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() =>
              handleAddNewAuditBlock('BREAKER_TOGGLE', 'Breaker 52-6 (Coupler) Closed for Load Balancing')
            }
            className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 hover:border-violet-500 text-zinc-300 text-xs font-mono rounded-lg transition-all cursor-pointer"
          >
            + Mine Breaker 52-6 Switch
          </button>
          <button
            onClick={() =>
              handleAddNewAuditBlock('LOTO_ISOLATION', 'LOTO Permit #2026-104 Issued: 13.8kV Feeder 02')
            }
            className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 hover:border-amber-500 text-zinc-300 text-xs font-mono rounded-lg transition-all cursor-pointer"
          >
            + Mine LOTO Permit
          </button>
          <button
            onClick={() =>
              handleAddNewAuditBlock('RELAY_SETTING', 'Differential 87T Slope 2 Characteristic updated to 60%')
            }
            className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 hover:border-cyan-500 text-zinc-300 text-xs font-mono rounded-lg transition-all cursor-pointer"
          >
            + Mine Relay Param Change
          </button>
        </div>
      </div>

      {/* Interactive Blockchain Chain Visualization */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-violet-400" />
          {isAr ? 'سلسلة الكتل الرقمية (Block Sequence)' : 'Active Substation Hash Chain'}
        </h3>

        <div className="space-y-3">
          {chain.map((block) => (
            <div
              key={block.index}
              className={`p-5 rounded-2xl border transition-all ${
                block.isTampered
                  ? 'bg-rose-950/40 border-rose-500/60 shadow-lg shadow-rose-950/40'
                  : 'bg-zinc-900/90 border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-violet-950/80 border border-violet-500/40 text-violet-300 font-mono font-bold text-xs">
                    BLOCK #{block.index}
                  </span>
                  <span className="text-xs font-mono font-bold text-zinc-300">
                    {block.actionType}
                  </span>
                  {block.isTampered && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono font-bold animate-pulse">
                      TAMPERED PAYLOAD DETECTED
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-mono text-zinc-500">
                  {block.timestamp} • Operator: <strong className="text-zinc-300">{block.operatorName}</strong>
                </div>
              </div>

              {/* Payload */}
              <div className="mt-3 text-xs font-mono text-zinc-200 bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/80">
                <span className="text-zinc-500 block text-[10px] mb-1">DATA PAYLOAD:</span>
                {block.payload}
              </div>

              {/* Hashes Row */}
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
                <div className="p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-800/60">
                  <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                    <Key className="w-3 h-3 text-zinc-400" />
                    PREVIOUS HASH:
                  </div>
                  <div className="text-zinc-400 truncate mt-0.5">{block.previousHash}</div>
                </div>

                <div className="p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-800/60">
                  <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-violet-400" />
                    SHA-256 BLOCK HASH (Nonce: {block.nonce}):
                  </div>
                  <div className={`truncate mt-0.5 font-bold ${block.isTampered ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {block.hash}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
