import React, { useState } from 'react';
import { useScada } from '../../context/ScadaContext';
import { UserRole } from '../../types/scada';
import { Shield, Key, CheckCircle, AlertTriangle, X } from 'lucide-react';

interface RbacModalProps {
  onClose: () => void;
}

export const RbacModal: React.FC<RbacModalProps> = ({ onClose }) => {
  const { currentUserRole, rbacLogin } = useScada();
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentUserRole);
  const [passcode, setPasscode] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const success = rbacLogin(selectedRole, passcode);
    if (success) {
      onClose();
    } else {
      setErrorMsg('Invalid Security Passcode for ' + selectedRole.toUpperCase());
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5 border-b border-slate-800 pb-3">
          <div className="p-2.5 bg-cyan-950 border border-cyan-700/50 rounded-lg text-cyan-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-mono font-bold text-slate-100 uppercase">Role-Based Access Control</h2>
            <p className="text-xs text-slate-400 font-mono">SCADA Station Access Authorization Portal</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 font-mono text-sm">
          <div>
            <label className="block text-xs text-slate-400 mb-2 uppercase font-semibold">Select Target Access Level:</label>
            <div className="grid grid-cols-3 gap-2">
              {(['operator', 'engineer', 'manager'] as UserRole[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => {
                    setSelectedRole(role);
                    setPasscode(role === 'engineer' ? 'engineer123' : role === 'manager' ? 'manager123' : '');
                    setErrorMsg('');
                  }}
                  className={`p-3 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                    selectedRole === role
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="capitalize text-xs font-bold">{role}</span>
                  <span className="text-[10px] text-slate-500 mt-1">
                    {role === 'operator' ? 'Read-Only' : role === 'engineer' ? 'Control/Ops' : 'Admin/Safety'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {selectedRole !== 'operator' && (
            <div>
              <label className="block text-xs text-slate-300 mb-1 flex items-center justify-between">
                <span>Security Passcode:</span>
                <span className="text-[10px] text-cyan-400 font-mono">
                  (Demo: {selectedRole === 'engineer' ? 'engineer123' : 'manager123'})
                </span>
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter passcode..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                  autoFocus
                />
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-2.5 bg-rose-950/80 border border-rose-700/60 rounded-lg text-rose-300 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg text-xs space-y-1 text-slate-400">
            <p className="font-semibold text-slate-300 uppercase text-[11px] border-b border-slate-800 pb-1 mb-1">
              Active Role Permissions:
            </p>
            {selectedRole === 'operator' && (
              <p className="text-slate-400">✅ Telemetry & Alarm Monitoring<br />❌ Switchgear Control & Overrides</p>
            )}
            {selectedRole === 'engineer' && (
              <p className="text-slate-300">✅ Telemetry & Alarms<br />✅ Breakers, Disconnectors & Tap Changer<br />✅ Manual Overrides & Fault Injector</p>
            )}
            {selectedRole === 'manager' && (
              <p className="text-purple-300">✅ Full Substation Administration<br />✅ Safety Threshold Modifications<br />✅ Accumulator Registers Reset</p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-mono text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg font-mono text-xs shadow-lg shadow-cyan-900/50 flex items-center space-x-1.5 transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Authorize Access</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
