"use client";

import { useState, useCallback } from "react";
import { toast, Toaster } from "react-hot-toast";
import {
    MessageCircle, Send, CheckCheck, Eye, XCircle, AlertTriangle,
    Clock, RefreshCw, ExternalLink, RotateCcw, Filter
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import {
    getWhatsAppAnalytics,
    retryWhatsAppLog,
    type WhatsAppAnalyticsData,
    type WhatsAppRecentLog,
} from "@/services/whatsappAnalyticsService";

// ─── Status visuals ───────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    SENT: { label: "Enviado", color: "bg-blue-100 text-blue-700", icon: <Send className="w-3 h-3" /> },
    DELIVERED: { label: "Entregue", color: "bg-indigo-100 text-indigo-700", icon: <CheckCheck className="w-3 h-3" /> },
    READ: { label: "Lido", color: "bg-emerald-100 text-emerald-700", icon: <Eye className="w-3 h-3" /> },
    FAILED: { label: "Falhou", color: "bg-red-100 text-red-700", icon: <XCircle className="w-3 h-3" /> },
    SKIPPED: { label: "Ignorado", color: "bg-amber-100 text-amber-700", icon: <AlertTriangle className="w-3 h-3" /> },
    PENDING: { label: "Pendente", color: "bg-gray-100 text-gray-600", icon: <Clock className="w-3 h-3" /> },
};

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${cfg.color}`}>
            {cfg.icon}{cfg.label}
        </span>
    );
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
    return (
        <div className={`rounded-2xl border p-5 bg-white shadow-sm flex items-center gap-4 ${color}`}>
            <div className="p-3 rounded-xl bg-current/10">
                {icon}
            </div>
            <div>
                <p className="text-2xl font-black text-gray-900">{value}</p>
                <p className="text-xs font-medium text-gray-500">{label}</p>
            </div>
        </div>
    );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function WhatsAppOpsDashboard() {
    const [data, setData] = useState<WhatsAppAnalyticsData | null>(null);
    const [loading, setLoading] = useState(false);
    const [retrying, setRetrying] = useState<string | null>(null);
    const [templateFilter, setTemplateFilter] = useState("ALL");

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getWhatsAppAnalytics();
            setData(res);
        } catch {
            toast.error("Erro ao carregar dados WhatsApp.");
        } finally {
            setLoading(false);
        }
    }, []);

    // Load on first render
    useState(() => { refresh(); });

    const handleRetry = async (logId: string) => {
        setRetrying(logId);
        try {
            const res = await retryWhatsAppLog(logId);
            if (res.ok && !res.error) {
                toast.success(res.skipped ? "Mensagem ainda em cooldown — ignorada." : "Reenvio disparado!");
                await refresh();
            } else {
                toast.error(res.error ?? "Falha no retry.");
            }
        } catch {
            toast.error("Erro de comunicação.");
        } finally {
            setRetrying(null);
        }
    };

    const allTemplates = data ? ["ALL", ...Array.from(new Set(data.recent.map((l) => l.templateName)))] : ["ALL"];
    const filteredLogs: WhatsAppRecentLog[] = data
        ? (templateFilter === "ALL" ? data.recent : data.recent.filter((l) => l.templateName === templateFilter))
        : [];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <Toaster position="top-right" />

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <MessageCircle className="w-6 h-6 text-green-600" /> WhatsApp Ops
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Monitorização de envios, entregas e falhas nas últimas 24h.</p>
                </div>
                <button
                    onClick={refresh}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-60 text-sm"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    {loading ? "A atualizar…" : "Atualizar"}
                </button>
            </div>

            {data ? (
                <>
                    {/* ── KPI Cards ──────────────────────────────────────── */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <KpiCard label="Enviados 24h" value={data.kpis.sent24h} color="border-blue-100" icon={<Send className="w-5 h-5 text-blue-600" />} />
                        <KpiCard label="Entregues 24h" value={data.kpis.delivered24h} color="border-indigo-100" icon={<CheckCheck className="w-5 h-5 text-indigo-600" />} />
                        <KpiCard label="Lidos 24h" value={data.kpis.read24h} color="border-emerald-100" icon={<Eye className="w-5 h-5 text-emerald-600" />} />
                        <KpiCard label="Falharam 24h" value={data.kpis.failed24h} color="border-red-100" icon={<XCircle className="w-5 h-5 text-red-600" />} />
                        <KpiCard label="Ignorados 24h" value={data.kpis.skipped24h} color="border-amber-100" icon={<AlertTriangle className="w-5 h-5 text-amber-600" />} />
                    </div>

                    {/* ── By Template ────────────────────────────────────── */}
                    {data.byTemplate24h.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                <h2 className="font-bold text-gray-900 text-sm">Breakdown por Template (24h)</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-xs text-gray-500 font-semibold border-b border-slate-100 bg-slate-50/30">
                                        <tr>
                                            <th className="px-6 py-3 text-left">Template</th>
                                            <th className="px-4 py-3 text-center text-blue-600">Env.</th>
                                            <th className="px-4 py-3 text-center text-indigo-600">Entreg.</th>
                                            <th className="px-4 py-3 text-center text-emerald-600">Lido</th>
                                            <th className="px-4 py-3 text-center text-red-600">Falhou</th>
                                            <th className="px-4 py-3 text-center text-amber-600">Ign.</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {data.byTemplate24h.map((t) => (
                                            <tr key={t.templateName} className="hover:bg-slate-50/50">
                                                <td className="px-6 py-3 font-mono text-xs font-semibold text-gray-700">{t.templateName}</td>
                                                <td className="px-4 py-3 text-center font-bold text-blue-700">{t.sent}</td>
                                                <td className="px-4 py-3 text-center font-bold text-indigo-700">{t.delivered}</td>
                                                <td className="px-4 py-3 text-center font-bold text-emerald-700">{t.read}</td>
                                                <td className="px-4 py-3 text-center font-bold text-red-700">{t.failed}</td>
                                                <td className="px-4 py-3 text-center font-bold text-amber-700">{t.skipped}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ── Recent Logs ────────────────────────────────────── */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <h2 className="font-bold text-gray-900 text-sm">Logs Recentes (últimos 30)</h2>
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-gray-400" />
                                <select
                                    title="Filtrar por template"
                                    aria-label="Filtrar por template"
                                    className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-green-400 focus:outline-none"
                                    value={templateFilter}
                                    onChange={(e) => setTemplateFilter(e.target.value)}
                                >
                                    {allTemplates.map((t) => (
                                        <option key={t} value={t}>{t === "ALL" ? "Todos os Templates" : t}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {filteredLogs.length === 0 ? (
                            <div className="p-10 text-center text-gray-400 text-sm">
                                <MessageCircle className="w-8 h-8 mx-auto mb-3 opacity-30" />
                                Sem logs para mostrar.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-xs text-gray-500 font-semibold border-b border-slate-100 bg-slate-50/30">
                                        <tr>
                                            <th className="px-6 py-3 text-left">Data</th>
                                            <th className="px-6 py-3 text-left">Template</th>
                                            <th className="px-6 py-3 text-left">Telefone</th>
                                            <th className="px-6 py-3 text-center">Status</th>
                                            <th className="px-6 py-3 text-left">Erro</th>
                                            <th className="px-6 py-3 text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredLogs.map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-3 text-xs text-gray-500 whitespace-nowrap">
                                                    {format(new Date(log.createdAt), "dd/MM HH:mm", { locale: ptBR })}
                                                </td>
                                                <td className="px-6 py-3 font-mono text-xs text-gray-700 max-w-[160px] truncate">
                                                    {log.templateName.replace(/_/g, " ")}
                                                </td>
                                                <td className="px-6 py-3 text-xs text-gray-700 font-medium">
                                                    +{log.recipientPhone}
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    <StatusBadge status={log.status} />
                                                </td>
                                                <td className="px-6 py-3 text-xs text-red-500 max-w-[180px] truncate">
                                                    {log.errorMessage ?? "—"}
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {log.orderId && (
                                                            <a
                                                                href={`/dashboard/finance/followups?orderId=${log.orderId}`}
                                                                className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                                                                title="Abrir order no painel de follow-ups"
                                                            >
                                                                <ExternalLink className="w-3.5 h-3.5" />
                                                            </a>
                                                        )}
                                                        {(log.status === "FAILED" || log.status === "SKIPPED") && (
                                                            <button
                                                                onClick={() => handleRetry(log.id)}
                                                                disabled={retrying === log.id}
                                                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
                                                                title="Tentar reenviar mensagem"
                                                            >
                                                                {retrying === log.id
                                                                    ? <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                                                    : <RotateCcw className="w-3.5 h-3.5" />}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            ) : loading ? (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 animate-pulse">
                    {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-24 bg-slate-100 rounded-2xl" />)}
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                    <MessageCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-gray-500">Clica em Atualizar para carregar métricas.</p>
                </div>
            )}
        </div>
    );
}
