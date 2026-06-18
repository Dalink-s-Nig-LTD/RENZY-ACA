import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  Users, Percent, Calendar, Search, LogOut, CheckCircle, 
  Clock, AlertCircle, XCircle, Download, Trash2, Edit2, ShieldAlert, Mail, Menu, X, Eye, EyeOff, Phone, MessageCircle
} from "lucide-react";
import { LOGO_URL } from "../lib/constants";
import { openExternal } from "../lib/email";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { ModalOverlay } from "../components/ModalOverlay";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Portal | Renzy Academy" },
      { name: "description", content: "Renzy Academy Admin Portal" },
    ],
  }),
  component: AdminPageWrapper,
});

function AdminPageWrapper() {
  return <AdminPage />;
}

interface Registration {
  _id: string;
  _creationTime: number;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  plan?: string;
  message?: string;
  type: string; // "enrollment" | "live_chat"
  status: string; // "Pending" | "Contacted" | "Approved" | "Rejected"
  repliedAt?: number;
  replyMessage?: string;
}

function AdminPage() {
  const [token, setToken] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("renzy_admin_token") || "";
    }
    return "";
  });
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  
  // Checking session validity
  const isSessionValid = useQuery(api.auth.validateSession, { token });
  const isLoggedIn = isSessionValid?.valid ?? false;
  const isCheckingSession = isSessionValid === undefined && token !== "";

  // Filters and Views
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"submissions" | "analytics">("submissions");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<string>("Pending");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Reply modal states
  const [replyingSubmission, setReplyingSubmission] = useState<Registration | null>(null);
  const [replyMessageText, setReplyMessageText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  // Rate limiting states
  const [failedAttempts, setFailedAttempts] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("login_failed_attempts");
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });
  const [lockoutTime, setLockoutTime] = useState<number | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("login_lockout_time");
      return saved ? parseInt(saved, 10) : null;
    }
    return null;
  });
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (lockoutTime) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((lockoutTime - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining === 0) {
          setLockoutTime(null);
          setFailedAttempts(0);
          localStorage.removeItem("login_lockout_time");
          localStorage.removeItem("login_failed_attempts");
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutTime]);

  // Load submissions from Convex
  const submissionsData = useQuery(api.submissions.list, { token });
  const submissions: Registration[] = submissionsData || [];

  // Convex mutations & actions
  const loginMutation = useMutation(api.auth.login);
  const logoutMutation = useMutation(api.auth.logout);
  const updateStatusMutation = useMutation(api.submissions.updateStatus);
  const deleteMutation = useMutation(api.submissions.remove);
  const markRepliedMutation = useMutation(api.submissions.markReplied);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTime && Date.now() < lockoutTime) {
      return;
    }

    setLoginError("");
    try {
      const res = await loginMutation({ email, password });
      if (res.success && res.token) {
        localStorage.setItem("renzy_admin_token", res.token);
        setToken(res.token);
        setFailedAttempts(0);
        localStorage.removeItem("login_failed_attempts");
        localStorage.removeItem("login_lockout_time");
      } else {
        const newFailed = failedAttempts + 1;
        setFailedAttempts(newFailed);
        localStorage.setItem("login_failed_attempts", newFailed.toString());

        if (newFailed >= 3) {
          const lockUntil = Date.now() + 30000; // 30s lockout
          setLockoutTime(lockUntil);
          localStorage.setItem("login_lockout_time", lockUntil.toString());
          setLoginError("Too many failed attempts. Try again in 30 seconds.");
        } else {
          setLoginError(res.error || "Invalid email or password");
        }
      }
    } catch (err) {
      console.error(err);
      setLoginError("An error occurred during login.");
    }
  };

  const handleLogout = async () => {
    try {
      await logoutMutation({ token });
    } catch (e) {
      console.warn("Logout failed", e);
    }
    localStorage.removeItem("renzy_admin_token");
    setToken("");
    setEmail("");
    setPassword("");
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      // @ts-expect-error type matches
      await updateStatusMutation({ id, status: newStatus, token });
      toast.success("Status updated");
      setEditingId(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  const deleteSubmission = async (id: string) => {
    if (confirm("Are you sure you want to delete this submission?")) {
      try {
        // @ts-expect-error type matches
        await deleteMutation({ id, token });
        toast.success("Submission deleted");
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete submission");
      }
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingSubmission) return;
    setIsSendingReply(true);
    setReplyError(null);
    try {
      await markRepliedMutation({
        id: replyingSubmission._id as any,
        replyMessage: replyMessageText || "Replied via email client.",
        token,
      });
      toast.success("Marked as replied!");
      setReplyingSubmission(null);
      setReplyMessageText("");
    } catch (err) {
      console.error(err);
      setReplyError("An error occurred while marking as replied.");
    } finally {
      setIsSendingReply(false);
    }
  };

  const exportToCSV = () => {
    const headers = ["Date", "Type", "Name", "Email", "Phone", "Current Role", "Course Plan", "Message", "Status", "Replied At", "Reply Message"];
    const rows = submissions.map((s) => [
      new Date(s._creationTime).toLocaleDateString(),
      s.type,
      s.name,
      s.email,
      s.phone || "",
      s.role || "",
      s.plan || "",
      (s.message || "").replace(/,/g, " "),
      s.status,
      s.repliedAt ? new Date(s.repliedAt).toLocaleDateString() : "",
      (s.replyMessage || "").replace(/,/g, " ")
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `renzy_academy_submissions_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter submissions based on range and options
  const filteredSubmissions = submissions.filter((s) => {
    const matchesSearch = 
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.phone && s.phone.includes(search)) ||
      (s.role && s.role.toLowerCase().includes(search.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    const matchesPlan = planFilter === "all" || (s.plan && s.plan.toLowerCase().includes(planFilter.toLowerCase()));

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const totalSubmissionsCount = filteredSubmissions.length;

  // Group submissions by day for SVG chart (Last 30 days)
  const getChartData = () => {
    const days: string[] = [];
    const enrollCounts: number[] = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      days.push(dateStr);

      const dEnrolls = submissions.filter(e => {
        const eDate = new Date(e._creationTime);
        return eDate.toDateString() === d.toDateString();
      });
      enrollCounts.push(dEnrolls.length);
    }
    return { days, enrollCounts };
  };

  const chartData = getChartData();
  const maxEnrolls = Math.max(...chartData.enrollCounts, 10);

  if (isCheckingSession) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-gray-600 text-lg font-medium">Verifying session...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-red-600 p-8 text-center">
            <img src={LOGO_URL} alt="Renzy Academy" className="h-16 w-auto mx-auto mb-4 bg-white rounded-full p-2" />
            <h2 className="text-2xl font-bold text-white mb-1">Admin Portal</h2>
            <p className="text-red-100 text-sm">Access enrollment records & analytics</p>
          </div>
          <form onSubmit={handleLogin} className="p-8">
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Admin Email</label>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="Enter your email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Enter your password" 
                  autoComplete="current-password"
                  className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {loginError && (
              <div className="flex items-center gap-2 bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                <ShieldAlert size={16} /> {loginError}
              </div>
            )}
            <button 
              type="submit" 
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              disabled={timeLeft > 0}
            >
              {timeLeft > 0 ? `Locked out (${timeLeft}s)` : "Sign In"}
            </button>
          </form>
          <div className="p-4 border-t border-gray-100 text-center bg-gray-50">
            <button onClick={() => openExternal("https://www.renzyacademy.org")} className="text-sm text-gray-500 hover:text-red-600 transition-colors">
              &larr; Go back to Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "Approved":
        return <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-md"><CheckCircle size={12} /> Approved</span>;
      case "Contacted":
        return <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-md"><Clock size={12} /> Contacted</span>;
      case "Rejected":
        return <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-md"><XCircle size={12} /> Rejected</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-md"><AlertCircle size={12} /> Pending</span>;
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 font-sans text-gray-900">
      
      {/* Mobile Header (visible only on md and below) */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-gray-200 p-4 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <img src={LOGO_URL} alt="Renzy" className="h-8 w-8" />
          <span className="font-bold text-gray-900">Admin</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-600 bg-gray-100 rounded-md">
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar navigation */}
      <aside className={`${mobileMenuOpen ? "block" : "hidden"} md:flex flex-col w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-200 sticky top-[65px] md:top-0 md:h-screen z-10`}>
        <div className="hidden md:flex items-center gap-3 p-6 border-b border-gray-100">
          <img src={LOGO_URL} alt="Renzy Academy" className="h-10 w-10 bg-gray-50 p-1 rounded" />
          <div>
            <div className="font-bold text-gray-900 leading-tight">RENZY ACADEMY</div>
            <div className="text-xs text-gray-500 font-medium">Portal Admin</div>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
          <button 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === "submissions" ? "bg-red-50 text-red-600" : "text-gray-600 hover:bg-gray-100"}`} 
            onClick={() => { setActiveTab("submissions"); setMobileMenuOpen(false); }}
          >
            <Users size={18} /> Submissions
          </button>
          <button 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === "analytics" ? "bg-red-50 text-red-600" : "text-gray-600 hover:bg-gray-100"}`} 
            onClick={() => { setActiveTab("analytics"); setMobileMenuOpen(false); }}
          >
            <Percent size={18} /> Analytics & Graphs
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </aside>

      {/* Main dashboard content */}
      <main className="flex-1 p-4 md:p-8 w-full max-w-full overflow-x-hidden">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm">Monitor applications and enrollment metrics</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={exportToCSV} className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-sm">
              <Download size={16} /> Export CSV
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100 text-red-600"><Users size={24} /></div>
            <div>
              <div className="text-sm font-semibold text-gray-500">Total Submissions</div>
              <div className="text-2xl font-bold text-gray-900">{totalSubmissionsCount}</div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-100 text-green-600"><Percent size={24} /></div>
            <div>
              <div className="text-sm font-semibold text-gray-500">Total Approved</div>
              <div className="text-2xl font-bold text-gray-900">{submissions.filter(s => s.status === "Approved").length}</div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 text-orange-600"><Calendar size={24} /></div>
            <div>
              <div className="text-sm font-semibold text-gray-500">Cohort Start Date</div>
              <div className="text-2xl font-bold text-gray-900">July 14, 2026</div>
            </div>
          </div>
        </section>

        {/* Tab 1: Submissions */}
        {activeTab === "submissions" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
            <div className="p-5 md:p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Student Enrollment & Support Submissions ({filteredSubmissions.length})</h2>
              
              {/* Search & Filters */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search name, email, phone..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
                
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-red-500 outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>

                <select 
                  value={planFilter} 
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-red-500 outline-none"
                >
                  <option value="all">All Plans</option>
                  <option value="Week-Day">Week-Day Training</option>
                  <option value="Weekend">Weekend Plan</option>
                  <option value="General Agile">General Agile PM</option>
                </select>
              </div>
            </div>

            {/* Submissions Table / Mobile list */}
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student Info</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Course Plan & Details</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSubmissions.length > 0 ? (
                    filteredSubmissions.map((s) => (
                      <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {new Date(s._creationTime).toLocaleDateString(undefined, { 
                            month: "short", 
                            day: "numeric", 
                            hour: "2-digit", 
                            minute: "2-digit" 
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 rounded text-[11px] font-bold ${s.type === "enrollment" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                            {s.type === "enrollment" ? "Enroll" : "Support"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-900">{s.name}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {s.email} • {s.phone || "No Phone"}
                          </div>
                          {s.role && <div className="text-xs text-gray-500 mt-1">Role: {s.role}</div>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-800">{s.plan || "Agile Support Inquiry"}</div>
                          {s.message && (
                            <div className="text-xs text-gray-600 mt-1.5 p-2 bg-gray-50 rounded border border-gray-100">
                              💬 {s.message}
                            </div>
                          )}
                          {s.repliedAt && (
                            <div className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                              <Mail size={12} /> Replied on {new Date(s.repliedAt).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {editingId === s._id ? (
                            <div className="flex items-center gap-2">
                              <select 
                                value={editStatus} 
                                onChange={(e) => setEditStatus(e.target.value)}
                                className="text-xs border border-gray-300 rounded px-2 py-1 outline-none"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Contacted">Contacted</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                              </select>
                              <button 
                                onClick={() => updateStatus(s._id, editStatus)}
                                className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                title="Save status"
                              >
                                <CheckCircle size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <StatusBadge status={s.status} />
                              <button 
                                onClick={() => { setEditingId(s._id); setEditStatus(s.status); }}
                                className="p-1 text-gray-400 hover:text-gray-700 transition-colors"
                                title="Edit Status"
                              >
                                <Edit2 size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => { setReplyingSubmission(s); setReplyMessageText(s.replyMessage || ""); }}
                              className="p-1.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                              title={s.repliedAt ? "View/Edit Email Reply" : "Send Email Reply"}
                            >
                              <Mail size={16} />
                            </button>
                            {s.phone && (
                              <a 
                                href={`https://wa.me/${s.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                                title={`WhatsApp ${s.name}`}
                              >
                                <MessageCircle size={16} />
                              </a>
                            )}
                            {s.phone && (
                              <a 
                                href={`tel:${s.phone}`}
                                className="p-1.5 rounded bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
                                title={`Call ${s.name}`}
                              >
                                <Phone size={16} />
                              </a>
                            )}
                            <button 
                              onClick={() => deleteSubmission(s._id)}
                              className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete Submission"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">
                        No submissions found matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Analytics Graphs */}
        {activeTab === "analytics" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
            <div className="p-5 md:p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Registration Conversions</h2>
              <p className="text-sm text-gray-500">
                Daily signups trend for the past 30 days.
              </p>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <span className="w-3 h-3 rounded-full bg-red-600 inline-block"></span> Submissions
                </div>
              </div>

              <div className="w-full overflow-x-auto pb-4">
                <svg viewBox="0 0 700 300" className="w-full min-w-[600px] h-[300px]" preserveAspectRatio="none">
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => (
                    <line 
                      key={idx}
                      x1="40" 
                      y1={30 + ratio * 200} 
                      x2="660" 
                      y2={30 + ratio * 200} 
                      stroke="#f1f5f9" 
                      strokeWidth="1"
                      strokeDasharray="4,4"
                    />
                  ))}

                  {chartData.days.map((_, idx) => {
                    const x = 50 + idx * (600 / (chartData.days.length - 1 || 1));
                    const shouldShowLine = idx % 5 === 0 || idx === chartData.days.length - 1;
                    if (!shouldShowLine) return null;
                    return (
                      <line
                        key={idx}
                        x1={x}
                        y1="230"
                        x2={x}
                        y2="240"
                        stroke="#e2e8f0"
                        strokeWidth="1.5"
                      />
                    );
                  })}

                  {chartData.enrollCounts.map((val, idx) => {
                    const x = 50 + idx * (600 / (chartData.days.length - 1 || 1));
                    const barHeight = val * (maxEnrolls > 0 ? (200 / maxEnrolls) : 0);
                    const y = 230 - barHeight;
                    return (
                      <rect
                        key={idx}
                        x={x - 4}
                        y={y}
                        width="8"
                        height={barHeight}
                        fill="#dc2626"
                        rx="2"
                        opacity="0.85"
                      />
                    );
                  })}

                  {chartData.enrollCounts.map((val, idx) => {
                    if (val === 0) return null;
                    const x = 50 + idx * (600 / (chartData.days.length - 1 || 1));
                    const y = 230 - val * (maxEnrolls > 0 ? (200 / maxEnrolls) : 0);
                    return (
                      <text
                        key={idx}
                        x={x}
                        y={y - 6}
                        fill="#dc2626"
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {val}
                      </text>
                    );
                  })}
                </svg>
              </div>

              <div className="flex justify-between px-10 border-t border-gray-100 pt-3">
                {chartData.days.map((day, idx) => {
                  const shouldShowLabel = idx % 5 === 0 || idx === chartData.days.length - 1;
                  if (!shouldShowLabel) return null;
                  return (
                    <div key={idx} className="text-[10px] text-gray-500 font-medium">
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t border-gray-200">
              <div className="p-6 border-b md:border-b-0 md:border-r border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">Preferred Courses Ratio</h3>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 font-medium">Weekend PMI-ACP® Prep</span>
                    <span className="font-bold text-gray-900">
                      {submissions.length > 0 
                        ? `${((submissions.filter(s => s.plan && s.plan.includes("Weekend")).length / submissions.length) * 100).toFixed(0)}%`
                        : "0%"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 font-medium">Week-Day PMI-ACP® Prep</span>
                    <span className="font-bold text-gray-900">
                      {submissions.length > 0 
                        ? `${((submissions.filter(s => s.plan && s.plan.includes("Week-Day")).length / submissions.length) * 100).toFixed(0)}%`
                        : "0%"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 font-medium">General Agile PM</span>
                    <span className="font-bold text-gray-900">
                      {submissions.length > 0 
                        ? `${((submissions.filter(s => s.plan && s.plan.includes("General")).length / submissions.length) * 100).toFixed(0)}%`
                        : "0%"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Reply Modal */}
      {replyingSubmission && (
        <ModalOverlay onClose={() => setReplyingSubmission(null)}>
          <div className="p-2 sm:p-4 max-w-lg w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Send Reply Email</h3>
            <p className="text-sm text-gray-500 mb-4">
              To: <strong className="text-gray-800">{replyingSubmission.name}</strong> ({replyingSubmission.email})
            </p>
            
            {replyingSubmission.repliedAt && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r-md mb-4 text-sm">
                <div className="font-bold text-blue-700 mb-1">
                  Previous reply sent on {new Date(replyingSubmission.repliedAt).toLocaleString()}:
                </div>
                <div className="whitespace-pre-wrap text-gray-700">
                  {replyingSubmission.replyMessage}
                </div>
              </div>
            )}

            <div className="mb-6">
              <a 
                href={`mailto:${replyingSubmission.email}?subject=Re:%20Your%20Renzy%20Academy%20Inquiry`}
                className="w-full inline-flex justify-center items-center gap-2 px-6 py-3 bg-red-50 text-red-700 font-bold rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
                target="_blank"
                rel="noreferrer"
              >
                <Mail size={18} />
                Open Email App to Reply
              </a>
              <p className="text-xs text-gray-500 mt-2 text-center">
                This opens your native email client (Gmail, Outlook, etc.).
              </p>
            </div>

            <form onSubmit={handleSendReply}>
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">Internal Note (Optional)</label>
                <textarea
                  rows={4}
                  value={replyMessageText}
                  onChange={(e) => setReplyMessageText(e.target.value)}
                  placeholder="Record what was said for future reference..."
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
              
              {replyError && (
                <div className="flex items-center gap-2 bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                  <ShieldAlert size={16} /> {replyError}
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setReplyingSubmission(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingReply}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isSendingReply ? "Saving..." : "Mark as Replied"}
                </button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
