// src/app/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, MapPin, Clock, AlertTriangle, Search, 
  Download, ExternalLink, MessageSquare, CheckCircle, LogOut, X, Eye 
} from 'lucide-react';

interface AttendanceRecord {
  id: string;
  type: string;
  localDateTime: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  signatureUrl: string;
  photoUrl: string;
  comments: string | null;
  user: { fullName: string; email: string; };
}

export default function Dashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  // 🛡️ NUEVO: Utilidades de formateo a prueba de zonas horarias
  const formatDate = (dateStr: string) => 
    new Date(dateStr).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
  
  const formatTime = (dateStr: string) => 
    new Date(dateStr).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
  
  const formatFullDateTime = (dateStr: string) => 
    new Date(dateStr).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC' });

  useEffect(() => {
    const token = localStorage.getItem('admin_jwt_token');
    if (!token) {
      router.push('/login');
      return;
    }
    setIsAuthenticated(true);

    fetch('https://geoasistencia-api.onrender.com/attendance/admin/all', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Error al obtener datos');
        return res.json();
      })
      .then((data) => {
        setRecords(data);
        setIsLoadingData(false);
      })
      .catch((err) => {
        console.error("❌ Error API:", err.message);
        setIsLoadingData(false);
      });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('admin_jwt_token');
    router.push('/login');
  };

  const downloadWatermarkedImage = (record: AttendanceRecord) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = record.photoUrl;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const horizontalMargin = canvas.width * 0.02; 
      let currentFontSize = Math.max(14, Math.floor(canvas.height * 0.035));
      const minFontSize = 12; 

      // 🚀 Aplicamos el formateador seguro aquí también
      const dateStr = formatDate(record.localDateTime);
      const timeStr = new Date(record.localDateTime).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC' });
      const gpsStr = `GPS: ${record.latitude.toFixed(6)}, ${record.longitude.toFixed(6)} (±${record.accuracy.toFixed(1)}m)`;
      let metadataText = `${dateStr} ${timeStr} | ${record.type.toUpperCase()} | ${gpsStr}`;

      ctx.font = `bold ${currentFontSize}px ui-sans-serif, system-ui, sans-serif`;
      let textMetrics = ctx.measureText(metadataText);
      let textWidth = textMetrics.width;
      const maxAvailableWidth = canvas.width - (horizontalMargin * 2);

      if (textWidth > maxAvailableWidth) {
        while (textWidth > maxAvailableWidth && currentFontSize > minFontSize) {
          currentFontSize -= 1; 
          ctx.font = `bold ${currentFontSize}px ui-sans-serif, system-ui, sans-serif`; 
          textMetrics = ctx.measureText(metadataText);
          textWidth = textMetrics.width;
        }
      }

      if (textWidth > maxAvailableWidth) {
        const gpsIndex = metadataText.indexOf('| GPS:');
        if (gpsIndex !== -1) {
          metadataText = metadataText.substring(0, gpsIndex).trim();
          textMetrics = ctx.measureText(metadataText);
        }
      }

      const barHeight = currentFontSize * 1.8;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);

      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'middle';
      ctx.fillText(metadataText, horizontalMargin, canvas.height - (barHeight / 2)); 

      const link = document.createElement('a');
      const safeName = record.user.fullName.replace(/\s+/g, '_');
      link.download = `EVIDENCIA_${record.type.toUpperCase()}_${safeName}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
    };
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalMarcaciones = records.length;
  const totalEntradas = records.filter(r => r.type === 'entry').length;
  const totalSalidas = records.filter(r => r.type === 'exit').length;
  const conComentarios = records.filter(r => r.comments !== null).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-md shadow-blue-200">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">GeoAsistencia</h1>
              <p className="text-xs text-slate-500 font-medium">Panel Administrativo de Recursos Humanos</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Monitoreo en Vivo
            </span>
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold transition-all">
              <LogOut className="w-4 h-4" /> Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1"><p className="text-sm font-semibold text-slate-500">Total Marcaciones</p><h3 className="text-3xl font-bold text-slate-900">{totalMarcaciones}</h3></div>
            <div className="bg-blue-50 text-blue-600 p-3 rounded-xl"><Users className="w-6 h-6" /></div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1"><p className="text-sm font-semibold text-slate-500">Entradas Registradas</p><h3 className="text-3xl font-bold text-emerald-600">{totalEntradas}</h3></div>
            <div className="bg-green-50 text-green-600 p-3 rounded-xl"><CheckCircle className="w-6 h-6" /></div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1"><p className="text-sm font-semibold text-slate-500">Salidas Registradas</p><h3 className="text-3xl font-bold text-orange-600">{totalSalidas}</h3></div>
            <div className="bg-orange-50 text-orange-700 p-3 rounded-xl"><Clock className="w-6 h-6" /></div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1"><p className="text-sm font-semibold text-slate-500">Con Observaciones</p><h3 className="text-3xl font-bold text-amber-600">{conComentarios}</h3></div>
            <div className="bg-amber-50 text-amber-600 p-3 rounded-xl"><AlertTriangle className="w-6 h-6" /></div>
          </div>
        </section>

        <section className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
            <input type="text" placeholder="Buscar colaborador..." className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 focus:bg-white transition-all text-slate-900" />
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900">Registro de Marcaciones Recientes</h2>
            <p className="text-xs text-slate-500">Lista obtenida en tiempo real desde PostgreSQL</p>
          </div>
          {isLoadingData ? (
            <div className="p-12 flex justify-center"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
          ) : records.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-medium">No hay registros todavía.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-3.5">Colaborador</th>
                    <th className="px-6 py-3.5">Operación</th>
                    <th className="px-6 py-3.5">Fecha y Hora Local</th>
                    <th className="px-6 py-3.5">Precisión GPS</th>
                    <th className="px-6 py-3.5">Firma</th>
                    <th className="px-6 py-3.5 text-right">Evidencias</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button onClick={() => setSelectedRecord(record)} className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200 shadow-inner group/img hover:ring-2 hover:ring-blue-500 transition-all shrink-0">
                            <img src={record.photoUrl} alt={record.user.fullName} className="w-full h-full object-cover group-hover/img:scale-110 transition-transform" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white transition-opacity"><Eye className="w-4 h-4" /></div>
                          </button>
                          <div><p className="font-bold text-slate-900">{record.user.fullName}</p><p className="text-xs text-slate-400 font-medium">{record.user.email}</p></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${record.type === 'entry' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
                          {record.type === 'entry' ? 'ENTRADA' : 'SALIDA'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {/* 🚀 Usamos la función blindada aquí */}
                        <p className="font-semibold text-slate-700">{formatTime(record.localDateTime)}</p>
                        <p className="text-xs text-slate-400">{formatDate(record.localDateTime)}</p>
                      </td>
                      <td className="px-6 py-4"><span className="text-slate-600 font-medium">± {record.accuracy.toFixed(1)} m</span></td>
                      <td className="px-6 py-4"><img src={record.signatureUrl} alt="Firma" className="h-8 bg-slate-50 rounded px-1 border border-slate-100 object-contain" /></td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {record.comments && (
                            <div className="group/tooltip relative inline-block">
                              <button className="p-1.5 text-slate-400 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors"><MessageSquare className="w-4 h-4" /></button>
                              <div className="absolute right-0 bottom-8 hidden group-hover/tooltip:block bg-slate-900 text-white text-xs p-3 rounded-xl shadow-xl w-64 z-50 text-left border border-slate-800 leading-relaxed">{record.comments}</div>
                            </div>
                          )}
                          <button onClick={() => setSelectedRecord(record)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-blue-600 text-slate-600 hover:text-white rounded-lg text-xs font-bold transition-all shadow-sm">
                            Inspeccionar <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900">Evidencia de {selectedRecord.user.fullName}</h3>
                <p className="text-xs text-slate-500">Registro de {selectedRecord.type === 'entry' ? 'Entrada' : 'Salida'}</p>
              </div>
              <button onClick={() => setSelectedRecord(null)} className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 shadow-inner group">
                <img src={selectedRecord.photoUrl} alt="Foto" className="w-full h-full object-contain" />
                <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs text-white text-[10px] sm:text-xs px-4 py-2 flex items-center justify-between font-mono tracking-tight">
                  {/* 🚀 Usamos la función blindada en la miniatura del modal */}
                  <span>{formatFullDateTime(selectedRecord.localDateTime)}</span>
                  <span>GPS: {selectedRecord.latitude.toFixed(4)}, {selectedRecord.longitude.toFixed(4)}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="space-y-1.5"><p className="text-slate-400 font-semibold uppercase tracking-wider">Fecha y Hora</p>
                  {/* 🚀 Usamos la función blindada en los detalles del modal */}
                  <p className="text-sm font-bold text-slate-800">{formatFullDateTime(selectedRecord.localDateTime)}</p>
                </div>
                <div className="space-y-1.5"><p className="text-slate-400 font-semibold uppercase tracking-wider">Coordenadas</p>
                  <a href={`https://www.google.com/maps/search/?api=1&query=$${selectedRecord.latitude},${selectedRecord.longitude}`} target="_blank" className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
                    {selectedRecord.latitude.toFixed(6)}, {selectedRecord.longitude.toFixed(6)} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="space-y-1.5"><p className="text-slate-400 font-semibold uppercase tracking-wider">Margen</p><p className="text-sm font-bold text-slate-800">± {selectedRecord.accuracy.toFixed(1)} metros</p></div>
                <div className="space-y-1.5"><p className="text-slate-400 font-semibold uppercase tracking-wider">Firma</p><div className="bg-white p-1 rounded-lg border border-slate-200 inline-block"><img src={selectedRecord.signatureUrl} alt="Firma" className="h-10 object-contain" /></div></div>
              </div>
              {selectedRecord.comments && (
                <div className="p-4 bg-amber-50/60 border border-amber-100 rounded-2xl space-y-1">
                  <p className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> Observación</p>
                  <p className="text-sm text-slate-700 font-medium leading-relaxed italic">"{selectedRecord.comments}"</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-3 justify-end">
              <button onClick={() => setSelectedRecord(null)} className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-sm font-semibold text-slate-600 transition-colors">Cerrar</button>
              <button onClick={() => downloadWatermarkedImage(selectedRecord)} className="flex items-center justify-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 transition-all">
                <Download className="w-4 h-4" /> Descargar Impregnada
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}