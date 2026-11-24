'use client';

import React from 'react';
import { GateLog, Vehicle, Driver } from '@/types';
import { X, Printer, CheckCircle, ShieldCheck, HardHat } from 'lucide-react';
import { PlateChip } from './PlateChip';

interface TicketModalProps {
  log: GateLog & { vehicle?: Vehicle; driver?: Driver };
  onClose: () => void;
}

export const TicketModal: React.FC<TicketModalProps> = ({ log, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Tiket Surat Jalan Pos Gerbang</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ticket Content (Thermal Slip Style) */}
        <div className="p-6 overflow-y-auto space-y-5 bg-slate-900 text-slate-200">
          <div className="border border-slate-700 bg-white text-slate-900 p-6 rounded-xl shadow font-mono text-xs space-y-4 print:p-0 print:border-none">
            {/* Header Slip */}
            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              <h3 className="font-extrabold text-sm tracking-wider uppercase">PT BORNEO INDOBARA MINING</h3>
              <p className="text-[11px] text-slate-600 font-sans">SISTEM MONITORING POS GERBANG (MINEGATE)</p>
              <p className="text-[10px] text-slate-500 font-sans">Pos Gerbang: {log.gate.replace(/_/g, ' ')}</p>
            </div>

            {/* Ticket ID & Barcode */}
            <div className="text-center py-1">
              <div className="text-base font-black tracking-widest text-slate-950">{log.log_id}</div>
              {/* Fake SVG Barcode */}
              <div className="flex justify-center items-center gap-0.5 my-2 h-9 overflow-hidden">
                {[4, 2, 6, 2, 8, 4, 2, 6, 4, 8, 2, 6, 2, 4, 8, 4, 2, 6, 2, 8, 4, 2, 6, 4].map(
                  (width, i) => (
                    <div
                      key={i}
                      style={{ width: `${width}px` }}
                      className="bg-black h-full"
                    />
                  )
                )}
              </div>
              <p className="text-[9px] text-slate-500">RESMI UNTUK OPERASIONAL TAMBANG</p>
            </div>

            {/* Details Table */}
            <div className="border-t border-b border-dashed border-slate-300 py-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">No. Lambung:</span>
                <span className="font-bold text-slate-950">{log.vehicle?.unit_code || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">No. Plat Polisi:</span>
                <span className="font-bold text-slate-950">{log.vehicle?.plate_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Tipe Armada:</span>
                <span>{log.vehicle?.type || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Nama Pengemudi:</span>
                <span className="font-bold text-slate-950">{log.driver?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Lisensi SIMPER:</span>
                <span>{log.driver?.license_type || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Perusahaan Pemilik:</span>
                <span className="text-right truncate max-w-[200px]">{log.vehicle?.owner_company || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Keperluan (Purpose):</span>
                <span className="font-bold text-slate-950">{log.purpose}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Lokasi / Pit Tujuan:</span>
                <span className="font-bold text-slate-950">{log.destination}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Waktu Masuk (IN):</span>
                <span>{new Date(log.time_in).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Waktu Keluar (OUT):</span>
                <span>{log.time_out ? new Date(log.time_out).toLocaleString('id-ID') : 'MASIH DI DALAM PIT'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Odometer Masuk:</span>
                <span>{log.odometer_in.toLocaleString('id-ID')} km</span>
              </div>
              {log.odometer_out && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Odometer Keluar:</span>
                  <span>{log.odometer_out.toLocaleString('id-ID')} km ({log.odometer_out - log.odometer_in} km)</span>
                </div>
              )}
            </div>

            {/* Safety & Sign Off */}
            <div className="pt-2 text-[10px] space-y-1 text-slate-600">
              <div className="flex items-center gap-1 font-bold text-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>K3 INSPECTION: LOLOS UJI VISUAL GERBANG</span>
              </div>
              <p>Sabuk Pengaman OK | Buggy Whip OK | Rotary Lamp OK | APD Lengkap</p>
              <p className="italic">Catatan: {log.notes}</p>
            </div>

            {/* Officer Signatures */}
            <div className="grid grid-cols-2 pt-6 text-center text-[10px] border-t border-slate-200">
              <div>
                <p className="text-slate-500 mb-8">Petugas Pos Gate</p>
                <p className="font-bold text-slate-900 border-t border-slate-300 pt-1 inline-block px-4">
                  ( {log.officer_id} )
                </p>
              </div>
              <div>
                <p className="text-slate-500 mb-8">Sopir / Driver</p>
                <p className="font-bold text-slate-900 border-t border-slate-300 pt-1 inline-block px-4">
                  ( {log.driver?.name || 'Pengemudi'} )
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 rounded-lg text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-2 shadow-lg shadow-amber-950/40 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Cetak Tiket / Surat Jalan
          </button>
        </div>
      </div>
    </div>
  );
};
