"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { toast, Toaster } from "react-hot-toast";
import {
    Clock, Calendar, MessageCircle, PhoneCall, Mail, FileText,
    CheckCircle, AlertCircle, Send, User, ArrowRight, RefreshCw,
    Building, CreditCard, Banknote, X
} from "lucide-react";
import {
    sendWhatsAppTemplate,
    getWhatsAppLogsByOrder,
    type WhatsAppLog,
} from "@/services/whatsappService";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api";

function authH() {
    const t = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    return { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}

// ─── Types ──────────────────────────────────────────────────────────────────
interface Order {
    id: string;
    debtorEntityName: string | null;
    creditDueDate: string | null;
    financialStatus: string;
    total: number;
    invoiceNumber?: string | null;
}

interface FollowUpLog {
    id: string;
    orderId: string;
    order?: Order;
    createdById: string;
    channel: string;
    outcome: string;
    note: string;
    nextFollowUpAt: string | null;
    attachmentUrl: string | null;
    createdAt: string;
}

// ─── WhatsApp Status Badge ───────────────────────────────────────────────────
const WA_STATUS_STYLES: Record<string, string> = {
    SENT: "bg-blue-100 text-blue-700",
    DELIVERED: "bg-indigo-100 text-indigo-700",
    READ: "bg-emerald-100 text-emerald-700",
    FAILED: "bg-red-100 text-red-700",
    SKIPPED: "bg-gray-100 text-gray-500",
    PENDING: "bg-amber-100 text-amber-700",
};

function WaBadge({ status }: { status: string }) {
    return (
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${WA_STATUS_STYLES[status] ?? "bg-gray-100 text-gray-500"}`}>
            {status}
        </span>
    );
}

// ─── Channel icon helper ─────────────────────────────────────────────────────
function ChannelIcon({ channel }: { channel: string }) {
    if (channel === "PHONE") return <PhoneCall className="w-4 h-4 text-blue-500" />;
    if (channel === "EMAIL") return <Mail className="w-4 h-4 text-orange-500" />;
    if (channel === "WHATSAPP") return <MessageCircle className="w-4 h-4 text-green-500" />;
    return <FileText className="w-4 h-4 text-gray-400" />;
}

// ─── WhatsApp 1-Click Panel ───────────────────────────────────────────────────
function WhatsAppPanel({ order, onClose }: { order: Order; onClose: () => void }) {
    const [phone, setPhone] = useState("");
    const [waLogs, setWaLogs] = useState<WhatsAppLog[]>([]);
    const [sending, setSending] = useState<string | null>(null);
    const [loadingLogs, setLoadingLogs] = useState(false);

    const loadLogs = useCallback(async () => {
        setLoadingLogs(true);
        try {
            const res = await getWhatsAppLogsByOrder(order.id);
            setWaLogs(res.data);
        } catch {
            /* silent */
        } finally {
            setLoadingLogs(false);
        }
    }, [order.id]);

    useEffect(() => { loadLogs(); }, [loadLogs]);

    async function dispatch(templateName: string, variables: (string | number)[]) {
        if (!phone.trim()) { toast.error("Introduza o número de telefone."); return; }
        setSending(templateName);
        try {
            const res = await sendWhatsAppTemplate(order.id, { phone, templateName, variables });
            if (res.skipped) toast("Mensagem já enviada recentemente (cooldown activo).", { icon: "⏱" });
            else if (res.ok) toast.success("WhatsApp enviado!");
            else toast.error("Falha ao enviar WhatsApp.");
            await loadLogs();
        } catch {
            toast.error("Erro de comunicação com o servidor.");
        } finally {
            setSending(null);
        }
    }

    const daysLate = order.creditDueDate
        ? Math.max(0, Math.floor((Date.now() - new Date(order.creditDueDate).getTime()) / 86400000))
        : 0;

    const templates = [
        {
            key: "puculuxa_bank_details_v1",
            label: "Enviar IBAN / Dados Bancários",
            icon: <Banknote className="w-4 h-4" />,
            color: "bg-indigo-600 hover:bg-indigo-700",
            vars: [
                order.debtorEntityName ?? "Entidade",
                "BAI",
                "AO06.0040.0000.6084.3134.1016.1",
                "5417123456",
                String(order.total),
                order.invoiceNumber ?? order.id.slice(-8).toUpperCase(),
                order.id.slice(-6).toUpperCase(),
            ],
        },
        {
            key: "puculuxa_gpo_pending_v1",
            label: "Lembrete Multicaixa (GPO)",
            icon: <CreditCard className="w-4 h-4" />,
            color: "bg-violet-600 hover:bg-violet-700",
            vars: [
                String(order.total),
                order.invoiceNumber ?? order.id.slice(-8).toUpperCase(),
            ],
        },
        {
            key: "puculuxa_credit_overdue_v1",
            label: "Crédito Vencido (Follow-up)",
            icon: <AlertCircle className="w-4 h-4" />,
            color: "bg-red-600 hover:bg-red-700",
            vars: [
                order.debtorEntityName ?? "Entidade",
                String(order.total),
                order.invoiceNumber ?? order.id.slice(-8).toUpperCase(),
                String(daysLate),
                phone,
            ],
        },
    ];

    return (
        <div className="bg-white rounded-2xl border border-green-200 shadow-lg flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-green-50 rounded-t-2xl">
                <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                    <span className="font-bold text-gray-900 text-sm">WhatsApp Operacional</span>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="p-4 space-y-4">
                {/* Phone input */}
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Telefone do Destinatário</label>
                    <input
                        type="tel"
                        title="Número de Telefone"
                        aria-label="Número de Telefone"
                        placeholder="923 123 456 ou 244923123456"
                        className="w-full text-sm rounded-lg border border-gray-200 py-2 px-3 focus:ring-2 focus:ring-green-400 focus:outline-none"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />
                </div>

                {/* Template buttons */}
                <div className="space-y-2">
                    {templates.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => dispatch(t.key, t.vars)}
                            disabled={sending !== null}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-all ${t.color} disabled:opacity-60 disabled:cursor-not-allowed`}
                        >
                            {sending === t.key
                                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : t.icon}
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* WhatsApp log history */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Histórico WhatsApp</span>
                        <button onClick={loadLogs} className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" /> Refresh
                        </button>
                    </div>
                    {loadingLogs ? (
                        <div className="text-xs text-gray-400 text-center py-3">A carregar…</div>
                    ) : waLogs.length === 0 ? (
                        <div className="text-xs text-gray-400 text-center py-3 bg-slate-50 rounded-xl">
                            Nenhuma mensagem enviada ainda.
                        </div>
                    ) : (
                        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                            {waLogs.map((log) => (
                                <div key={log.id} className="flex items-start justify-between gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-gray-800 truncate">{log.templateName.replace(/_/g, " ")}</p>
                                        <p className="text-[10px] text-gray-500 mt-0.5">
                                            {log.recipientPhone} · {format(new Date(log.createdAt), "dd/MM HH:mm")}
                                        </p>
                                        {log.errorMessage && (
                                            <p className="text-[10px] text-red-500 mt-0.5 truncate">{log.errorMessage}</p>
                                        )}
                                    </div>
                                    <WaBadge status={log.status} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function FollowUpsDashboard() {
    const [dueFollowUps, setDueFollowUps] = useState<FollowUpLog[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [historyLogs, setHistoryLogs] = useState<FollowUpLog[]>([]);
    const [isLoadingDue, setIsLoadingDue] = useState(true);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showWaPanel, setShowWaPanel] = useState(false);

    // Form State
    const [formChannel, setFormChannel] = useState("PHONE");
    const [formOutcome, setFormOutcome] = useState("OTHER");
    const [formNote, setFormNote] = useState("");
    const [formNextDate, setFormNextDate] = useState("");

    const fetchDueFollowUps = async () => {
        setIsLoadingDue(true);
        try {
            const res = await fetch(`${API}/followups/due/today`, { headers: authH() });
            setDueFollowUps(await res.json());
        } catch { toast.error("Erro ao carregar follow-ups agendados."); }
        finally { setIsLoadingDue(false); }
    };

    const fetchHistory = async (orderId: string) => {
        setIsLoadingHistory(true);
        try {
            const res = await fetch(`${API}/followups/${orderId}`, { headers: authH() });
            setHistoryLogs(await res.json());
        } catch { toast.error("Erro ao carregar histórico."); }
        finally { setIsLoadingHistory(false); }
    };

    const handleSelectFollowUp = (log: FollowUpLog) => {
        if (log.order) {
            setSelectedOrder(log.order);
            fetchHistory(log.orderId);
            setFormNote("");
            setShowWaPanel(false);
        }
    };

    const handleSubmitNewLog = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrder) return;
        if (!formNote.trim()) { toast.error("A nota do follow-up é obrigatória."); return; }
        setIsSubmitting(true);
        try {
            const res = await fetch(`${API}/followups/${selectedOrder.id}`, {
                method: "POST",
                headers: authH(),
                body: JSON.stringify({ channel: formChannel, outcome: formOutcome, note: formNote, nextFollowUpAt: formNextDate || undefined }),
            });
            if (!res.ok) throw new Error();
            toast.success("Follow-up registado!");
            setFormNote(""); setFormNextDate("");
            fetchHistory(selectedOrder.id);
            fetchDueFollowUps();
        } catch { toast.error("Falha ao submeter log."); }
        finally { setIsSubmitting(false); }
    };

    useEffect(() => { fetchDueFollowUps(); }, []);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Console de Follow-Ups Institucionais</h1>
                    <p className="text-sm text-gray-500 mt-1">Audite conversas B2B e agende recontactos com entidades devedoras.</p>
                </div>
                <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-medium text-sm border border-indigo-100 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {dueFollowUps.length} a contactar hoje
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* ── COL A: Pending list ─────────────────────── */}
                <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col h-[700px]">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-900">Agenda de Contactos</h2>
                        <button onClick={fetchDueFollowUps} className="text-indigo-600 text-xs hover:underline">Atualizar</button>
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-slate-50/50">
                        {isLoadingDue ? (
                            <div className="animate-pulse space-y-3">
                                {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-200 rounded-xl" />)}
                            </div>
                        ) : dueFollowUps.length === 0 ? (
                            <div className="text-center py-10">
                                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                                <p className="text-sm text-slate-500 font-medium">Nenhum contacto pendente para hoje.</p>
                            </div>
                        ) : (
                            dueFollowUps.map((log) => (
                                <div
                                    key={log.id}
                                    onClick={() => handleSelectFollowUp(log)}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${selectedOrder?.id === log.orderId
                                        ? "border-indigo-500 bg-indigo-50 shadow-sm"
                                        : "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm"}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-semibold text-gray-900 line-clamp-1">
                                            {log.order?.debtorEntityName || "Entidade Não Nomeada"}
                                        </span>
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${log.order?.financialStatus === "OVERDUE" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                                            {log.order?.financialStatus}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1.5 mb-2">
                                        <Calendar className="w-3.5 h-3.5" />
                                        Crédito: {log.order?.creditDueDate ? format(new Date(log.order.creditDueDate), "dd MMM yyyy", { locale: ptBR }) : "Não def."}
                                    </div>
                                    <div className="text-sm font-medium text-slate-700">
                                        Total: <span className="font-bold text-gray-900">AOA {(log.order?.total || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center text-xs text-indigo-600 font-medium">
                                        Abrir Histórico <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* ── COL B: History + WhatsApp panel ─────────── */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                    {!selectedOrder ? (
                        <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center h-[700px]">
                            <MessageCircle className="w-12 h-12 mb-4 text-slate-200" />
                            <p className="font-medium text-slate-500">Selecione uma entidade na lista para ver o histórico</p>
                        </div>
                    ) : (
                        <>
                            {/* Order header */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                                <div className="p-5 flex justify-between items-center bg-slate-50/50 rounded-t-2xl border-b border-slate-100">
                                    <div>
                                        <h2 className="font-bold text-xl text-gray-900 flex items-center gap-2">
                                            <Building className="w-5 h-5 text-slate-400" />
                                            {selectedOrder.debtorEntityName || "Empresa / Governo"}
                                        </h2>
                                        <p className="text-xs font-mono text-slate-500 mt-1">REF: {selectedOrder.id}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500">Pendência</p>
                                            <p className="font-bold text-lg text-gray-900">AOA {selectedOrder.total.toLocaleString()}</p>
                                        </div>
                                        <button
                                            onClick={() => setShowWaPanel((v) => !v)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${showWaPanel
                                                ? "bg-green-600 text-white border-green-600"
                                                : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"}`}
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            WhatsApp
                                        </button>
                                    </div>
                                </div>

                                {/* WhatsApp panel slide-in */}
                                {showWaPanel && (
                                    <div className="p-4 border-b border-slate-100">
                                        <WhatsAppPanel order={selectedOrder} onClose={() => setShowWaPanel(false)} />
                                    </div>
                                )}

                                {/* Follow-up timeline */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-80">
                                    {isLoadingHistory ? (
                                        <div className="text-center py-6 text-sm text-gray-400">A carregar histórico…</div>
                                    ) : historyLogs.length === 0 ? (
                                        <div className="text-center py-6 text-sm text-gray-500">
                                            Ainda sem registos de follow-up manual.
                                        </div>
                                    ) : (
                                        <div className="relative border-l-2 border-slate-100 ml-4 space-y-6">
                                            {historyLogs.map((log) => (
                                                <div key={log.id} className="relative pl-6">
                                                    <span className="absolute -left-[9px] top-1 bg-white border-2 border-slate-200 rounded-full p-1 shadow-sm">
                                                        <ChannelIcon channel={log.channel} />
                                                    </span>
                                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                                                                    {log.outcome.replace(/_/g, " ")}
                                                                </span>
                                                                <span className="text-xs font-medium text-indigo-600 flex items-center gap-1">
                                                                    <User className="w-3 h-3" /> ADMIN
                                                                </span>
                                                            </div>
                                                            <span className="text-xs text-gray-400">
                                                                {format(new Date(log.createdAt), "dd MMM HH:mm", { locale: ptBR })}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{log.note}</p>
                                                        {log.nextFollowUpAt && (
                                                            <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                                                                <AlertCircle className="w-3.5 h-3.5" />
                                                                Recontactar a {format(new Date(log.nextFollowUpAt), "dd/MM/yyyy")}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* New log form */}
                                <div className="p-5 border-t border-slate-100 bg-white rounded-b-2xl">
                                    <form onSubmit={handleSubmitNewLog} className="space-y-4">
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div className="col-span-1">
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Canal</label>
                                                <select
                                                    title="Canal de Contacto"
                                                    aria-label="Canal de Contacto"
                                                    className="w-full text-sm rounded-lg border border-gray-200 py-2 px-3 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                                                    value={formChannel}
                                                    onChange={(e) => setFormChannel(e.target.value)}
                                                >
                                                    <option value="PHONE">Chamada Telefónica</option>
                                                    <option value="EMAIL">Email</option>
                                                    <option value="WHATSAPP">WhatsApp</option>
                                                    <option value="IN_PERSON">Presencial</option>
                                                    <option value="DOCUMENT">Envio Carta</option>
                                                    <option value="OTHER">Outro</option>
                                                </select>
                                            </div>
                                            <div className="col-span-1">
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Resultado</label>
                                                <select
                                                    title="Resultado do Contacto"
                                                    aria-label="Resultado do Contacto"
                                                    className="w-full text-sm rounded-lg border border-gray-200 py-2 px-3 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                                                    value={formOutcome}
                                                    onChange={(e) => setFormOutcome(e.target.value)}
                                                >
                                                    <option value="OTHER">Em Processamento</option>
                                                    <option value="NO_RESPONSE">Sem Resposta</option>
                                                    <option value="PROMISED_PAYMENT">Promessa de Pagamento</option>
                                                    <option value="REQUESTED_DOCUMENTS">Pediram Mais Docs.</option>
                                                    <option value="SENT_TO_TREASURY">Enviado à Tesouraria</option>
                                                    <option value="ORDER_OF_WITHDRAWAL_PENDING">Aguarda Ordem Saque</option>
                                                    <option value="PAID_CONFIRMED">Confirmou Pagamento</option>
                                                </select>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Agendar Próximo Recontacto</label>
                                                <input
                                                    type="date"
                                                    title="Data do Próximo Recontacto"
                                                    aria-label="Data do Próximo Recontacto"
                                                    className="w-full text-sm rounded-lg border border-gray-200 py-2 px-3 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                                                    value={formNextDate}
                                                    onChange={(e) => setFormNextDate(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-4 items-end">
                                            <div className="flex-1">
                                                <textarea
                                                    rows={2}
                                                    required
                                                    placeholder="Detalhes da conversa (Ex: Sr. João disse que a requisição já está na sala 14)..."
                                                    className="w-full text-sm rounded-lg border border-gray-200 py-2 px-3 resize-none focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                                                    value={formNote}
                                                    onChange={(e) => setFormNote(e.target.value)}
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 h-12 rounded-lg font-medium text-sm flex items-center gap-2 shadow-sm transition-colors disabled:opacity-70"
                                            >
                                                {isSubmitting ? "A gravar…" : "Registar Log"}
                                                {!isSubmitting && <Send className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
