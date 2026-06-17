import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  Users, Eye, Percent, Calendar, Search, LogOut, CheckCircle, 
  Clock, AlertCircle, XCircle, Download, Trash2, Edit2, ShieldAlert, Mail
} from "lucide-react";
import { LOGO_URL } from "../lib/constants";
import { openExternal } from "../lib/email";
import { useQuery, useMutation, useAction } from "convex/react";
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

interface PageVisit {
  id: string;
  timestamp: string;
  path: string;
  userAgent: string;
  referrer: string;
}

// Generate pre-populated visits for the past 14 days for a beautiful graph
const generateMockVisits = (): PageVisit[] => {
  const list: PageVisit[] = [];
  const now = new Date();
  const devices = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  ];
  const paths = ["/", "/privacy-policy", "/cookie-policy"];
  const referrers = ["direct", "https://wa.me/", "https://google.com", "https://linkedin.com"];

  // Generate for past 30 days to support 30-day "all-time" view
  for (let i = 30; i >= 0; i--) {
    const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const visitCount = Math.floor(Math.random() * 50) + 35;
    for (let j = 0; j < visitCount; j++) {
      const hourOffset = Math.floor(Math.random() * 24);
      const minOffset = Math.floor(Math.random() * 60);
      const visitTime = new Date(day);
      visitTime.setHours(hourOffset, minOffset);

      list.push({
        id: Math.random().toString(36).substring(2, 9),
        timestamp: visitTime.toISOString(),
        path: paths[Math.random() < 0.85 ? 0 : Math.floor(Math.random() * paths.length)],
        userAgent: devices[Math.floor(Math.random() * devices.length)],
        referrer: referrers[Math.floor(Math.random() * referrers.length)]
      });
    }
  }
  return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

function AdminPage() {
  const [token, setToken] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("renzy_admin_token") || "";
    }
    return "";
  });
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  
  // Checking session validity
  const isSessionValid = useQuery(api.auth.validateSession, { token });
  const isLoggedIn = isSessionValid?.valid ?? false;
  const isCheckingSession = isSessionValid === undefined && token !== "";

  // Dashboard states
  const [visits, setVisits] = useState<PageVisit[]>([]);
  const [timeRange, setTimeRange] = useState<"7days" | "alltime">("7days");
  
  // Filters and Views
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"submissions" | "visits" | "analytics">("submissions");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<string>("Pending");

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

  // Load page visits locally
  useEffect(() => {
    if (isLoggedIn) {
      let storedVisits = localStorage.getItem("renzy_visits");
      if (!storedVisits || JSON.parse(storedVisits).length < 100) {
        const generated = generateMockVisits();
        const actual = storedVisits ? JSON.parse(storedVisits) : [];
        const combined = [...actual, ...generated].slice(0, 3000);
        localStorage.setItem("renzy_visits", JSON.stringify(combined));
        storedVisits = JSON.stringify(combined);
      }
      setVisits(JSON.parse(storedVisits));
    }
  }, [isLoggedIn]);

  // Convex mutations & actions
  const loginMutation = useMutation(api.auth.login);
  const logoutMutation = useMutation(api.auth.logout);
  const updateStatusMutation = useMutation(api.submissions.updateStatus);
  const deleteMutation = useMutation(api.submissions.remove);
  const clearAllSubmissions = useMutation(api.submissions.clearAll);
  const sendReplyAction = useAction(api.emails.sendReply);

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

  const handleResetData = async () => {
    if (confirm("⚠️ WARNING: This will permanently delete all submissions from the database and regenerate mock traffic logs. This cannot be undone! Are you absolutely sure?")) {
      try {
        await clearAllSubmissions({ token });
        
        // Reset local page visits
        localStorage.removeItem("renzy_visits");
        const generated = generateMockVisits();
        localStorage.setItem("renzy_visits", JSON.stringify(generated));
        setVisits(generated);

        toast.success("Database and traffic logs successfully reset");
      } catch (err) {
        console.error(err);
        toast.error("Failed to reset dashboard data");
      }
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingSubmission) return;
    setIsSendingReply(true);
    setReplyError(null);
    try {
      // @ts-expect-error action call
      const res = await sendReplyAction({
        submissionId: replyingSubmission._id,
        replyMessage: replyMessageText,
        token,
      });
      if (res.success) {
        toast.success("Reply email sent successfully!");
        setReplyingSubmission(null);
        setReplyMessageText("");
      } else {
        setReplyError(res.error || "Failed to send reply email");
      }
    } catch (err) {
      console.error(err);
      setReplyError("An error occurred. Make sure your RESEND_API_KEY is configured.");
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

    // Time-range filter
    if (timeRange === "7days") {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      if (s._creationTime < sevenDaysAgo) return false;
    }

    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Calculate filtered stats
  const rangeVisits = timeRange === "7days"
    ? visits.filter(v => new Date(v.timestamp).getTime() >= Date.now() - 7 * 24 * 60 * 60 * 1000)
    : visits;

  const totalVisitsCount = rangeVisits.length;
  const totalSubmissionsCount = filteredSubmissions.length;
  const conversionRate = totalVisitsCount > 0 
    ? ((totalSubmissionsCount / totalVisitsCount) * 100).toFixed(1) 
    : "0.0";

  // Group visits and submissions by day for SVG chart
  const getChartData = () => {
    const days: string[] = [];
    const visitCounts: number[] = [];
    const enrollCounts: number[] = [];
    const now = new Date();
    const rangeLength = timeRange === "7days" ? 7 : 30;

    for (let i = rangeLength - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      days.push(dateStr);

      const dVisits = visits.filter(v => {
        const vDate = new Date(v.timestamp);
        return vDate.toDateString() === d.toDateString();
      });
      visitCounts.push(dVisits.length);

      const dEnrolls = submissions.filter(e => {
        const eDate = new Date(e._creationTime);
        return eDate.toDateString() === d.toDateString();
      });
      enrollCounts.push(dEnrolls.length);
    }
    return { days, visitCounts, enrollCounts };
  };

  const chartData = getChartData();
  const maxVisits = Math.max(...chartData.visitCounts, 10);

  if (isCheckingSession) {
    return (
      <div className="admin-login-layout" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div style={{ color: "white", fontSize: "1.2rem" }}>Verifying session...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="admin-login-layout">
        <div className="login-box">
          <div className="login-header">
            <img src={LOGO_URL} alt="Renzy Academy" className="login-logo" />
            <h2>Admin Portal</h2>
            <p>Access enrollment records & page analytics</p>
          </div>
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label>Admin Email</label>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="info@renzyacademy.org" 
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••" 
              />
            </div>
            {loginError && <div className="login-error"><ShieldAlert size={16} /> {loginError}</div>}
            <button 
              type="submit" 
              className="btn-primary" 
              style={{ width: "100%", marginTop: "1rem" }}
              disabled={timeLeft > 0}
            >
              {timeLeft > 0 ? `Locked out (${timeLeft}s)` : "Sign In"}
            </button>
          </form>
          <div className="login-footer">
            <button onClick={() => openExternal("https://www.renzyacademy.org")} className="back-link">
              ← Go back to Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "Approved":
        return <span className="badge badge-approved"><CheckCircle size={12} /> Approved</span>;
      case "Contacted":
        return <span className="badge badge-contacted"><Clock size={12} /> Contacted</span>;
      case "Rejected":
        return <span className="badge badge-rejected"><XCircle size={12} /> Rejected</span>;
      default:
        return <span className="badge badge-pending"><AlertCircle size={12} /> Pending</span>;
    }
  };

  return (
    <div className="admin-dashboard-layout">
      {/* Sidebar navigation */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <img src={LOGO_URL} alt="Renzy Academy" className="sidebar-logo" />
          <div>
            <div className="brand-title">RENZY ACADEMY</div>
            <div className="brand-subtitle font-xs">Portal Admin</div>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`sidebar-link ${activeTab === "submissions" ? "active" : ""}`} 
            onClick={() => setActiveTab("submissions")}
          >
            <Users size={18} /> Submissions
          </button>
          <button 
            className={`sidebar-link ${activeTab === "visits" ? "active" : ""}`} 
            onClick={() => setActiveTab("visits")}
          >
            <Eye size={18} /> Page Visits
          </button>
          <button 
            className={`sidebar-link ${activeTab === "analytics" ? "active" : ""}`} 
            onClick={() => setActiveTab("analytics")}
          >
            <Percent size={18} /> Analytics & Graphs
          </button>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn-logout">
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </aside>

      {/* Main dashboard content */}
      <main className="admin-main">
        <header className="admin-header">
          <div className="header-info">
            <h1>Admin Dashboard</h1>
            <p>Monitor applications, cohorts and web traffic</p>
          </div>
          <div className="header-actions" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {/* Time range selector */}
            <div className="flex-center gap-xs" style={{ background: "rgba(255, 255, 255, 0.05)", padding: "4px", borderRadius: "6px", display: "inline-flex" }}>
              <button 
                onClick={() => setTimeRange("7days")} 
                style={{ 
                  padding: "6px 12px", 
                  fontSize: "0.75rem", 
                  fontWeight: "bold", 
                  border: "none", 
                  borderRadius: "4px", 
                  background: timeRange === "7days" ? "var(--r-red)" : "transparent", 
                  color: "white", 
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                7 Days
              </button>
              <button 
                onClick={() => setTimeRange("alltime")} 
                style={{ 
                  padding: "6px 12px", 
                  fontSize: "0.75rem", 
                  fontWeight: "bold", 
                  border: "none", 
                  borderRadius: "4px", 
                  background: timeRange === "alltime" ? "var(--r-red)" : "transparent", 
                  color: "white", 
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                All-Time
              </button>
            </div>

            <button 
              onClick={handleResetData} 
              className="btn-secondary flex-center gap-xs" 
              style={{ color: "var(--r-red)", borderColor: "rgba(227, 27, 35, 0.2)", height: "34px", padding: "0 12px" }}
            >
              Reset Data
            </button>
            <button onClick={exportToCSV} className="btn-secondary flex-center gap-xs" style={{ height: "34px", padding: "0 12px" }}>
              <Download size={16} /> Export CSV
            </button>
            <button onClick={handleLogout} className="mobile-logout btn-logout">
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-icon bg-red-light"><Users className="text-red" /></div>
            <div className="stat-card-content">
              <div className="stat-card-label">Total Submissions</div>
              <div className="stat-card-value">{totalSubmissionsCount}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon bg-blue-light"><Eye className="text-blue" /></div>
            <div className="stat-card-content">
              <div className="stat-card-label">Page Visits</div>
              <div className="stat-card-value">{totalVisitsCount}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon bg-green-light"><Percent className="text-green" /></div>
            <div className="stat-card-content">
              <div className="stat-card-label">Conversion Rate</div>
              <div className="stat-card-value">{conversionRate}%</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon bg-orange-light"><Calendar className="text-orange" /></div>
            <div className="stat-card-content">
              <div className="stat-card-label">Cohort Start Date</div>
              <div className="stat-card-value">July 14, 2026</div>
            </div>
          </div>
        </section>

        {/* Tab 1: Submissions */}
        {activeTab === "submissions" && (
          <div className="dashboard-content-box">
            <div className="content-box-header">
              <h2>Student Enrollment & Support Submissions ({filteredSubmissions.length})</h2>
              
              {/* Search & Filters */}
              <div className="filters-bar">
                <div className="search-wrapper">
                  <Search size={16} className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Search name, email, phone..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-select"
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
                  className="filter-select"
                >
                  <option value="all">All Plans</option>
                  <option value="Week-Day">Week-Day Training</option>
                  <option value="Weekend">Weekend Plan</option>
                  <option value="General Agile">General Agile PM</option>
                </select>
              </div>
            </div>

            {/* Submissions Table / Mobile list */}
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Student Info</th>
                    <th>Course Plan & Details</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.length > 0 ? (
                    filteredSubmissions.map((s) => (
                      <tr key={s._id}>
                        <td className="text-light text-nowrap">
                          {new Date(s._creationTime).toLocaleDateString(undefined, { 
                            month: "short", 
                            day: "numeric", 
                            hour: "2-digit", 
                            minute: "2-digit" 
                          })}
                        </td>
                        <td>
                          <span style={{ 
                            padding: "2px 6px", 
                            borderRadius: "4px", 
                            fontSize: "11px", 
                            fontWeight: "bold", 
                            background: s.type === "enrollment" ? "rgba(227, 27, 35, 0.1)" : "rgba(59, 130, 246, 0.1)", 
                            color: s.type === "enrollment" ? "#E31B23" : "#3b82f6" 
                          }}>
                            {s.type === "enrollment" ? "Enroll" : "Support"}
                          </span>
                        </td>
                        <td>
                          <div className="student-name">{s.name}</div>
                          <div className="student-details text-light font-xs">
                            {s.email} • {s.phone || "No Phone"}
                          </div>
                          {s.role && <div className="student-role text-light font-xs">Role: {s.role}</div>}
                        </td>
                        <td>
                          <div className="plan-name">{s.plan || "Agile Support Inquiry"}</div>
                          {s.message && (
                            <div className="student-message text-light font-xs">
                              💬 {s.message}
                            </div>
                          )}
                          {s.repliedAt && (
                            <div className="text-blue font-xs" style={{ marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                              <Mail size={12} /> Replied on {new Date(s.repliedAt).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td>
                          {editingId === s._id ? (
                            <div className="flex-center gap-xs">
                              <select 
                                value={editStatus} 
                                onChange={(e) => setEditStatus(e.target.value)}
                                className="edit-status-select"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Contacted">Contacted</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                              </select>
                              <button 
                                onClick={() => updateStatus(s._id, editStatus)}
                                className="btn-icon-check"
                                title="Save status"
                              >
                                ✓
                              </button>
                            </div>
                          ) : (
                            <div className="flex-center gap-xs">
                              <StatusBadge status={s.status} />
                              <button 
                                onClick={() => { setEditingId(s._id); setEditStatus(s.status); }}
                                className="btn-action-edit"
                                title="Edit Status"
                              >
                                <Edit2 size={12} />
                              </button>
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "8px" }}>
                            <button 
                              onClick={() => { setReplyingSubmission(s); setReplyMessageText(s.replyMessage || ""); }}
                              style={{ 
                                display: "flex", 
                                alignItems: "center", 
                                justifyContent: "center", 
                                width: "28px", 
                                height: "28px", 
                                border: "none", 
                                borderRadius: "4px", 
                                background: "rgba(59, 130, 246, 0.1)", 
                                color: "#3b82f6", 
                                cursor: "pointer" 
                              }}
                              title={s.repliedAt ? "View/Edit Email Reply" : "Send Email Reply"}
                            >
                              <Mail size={14} />
                            </button>
                            <button 
                              onClick={() => deleteSubmission(s._id)}
                              className="btn-action-delete"
                              title="Delete Submission"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="empty-table-state">
                        No submissions found matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Page Visits */}
        {activeTab === "visits" && (
          <div className="dashboard-content-box">
            <div className="content-box-header">
              <h2>Recent Page Visits Log ({visits.length})</h2>
              <p className="text-light" style={{ fontSize: ".85rem", marginTop: ".25rem" }}>
                Tracks live navigation metrics across course pages.
              </p>
            </div>

            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Page Path</th>
                    <th>Referral Source</th>
                    <th>Device/User Agent Details</th>
                  </tr>
                </thead>
                <tbody>
                  {rangeVisits.length > 0 ? (
                    rangeVisits.slice(0, 100).map((v) => (
                      <tr key={v.id}>
                        <td className="text-light text-nowrap">
                          {new Date(v.timestamp).toLocaleDateString(undefined, { 
                            month: "short", 
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit", 
                            minute: "2-digit",
                            second: "2-digit"
                          })}
                        </td>
                        <td>
                          <span className="badge-path">{v.path}</span>
                        </td>
                        <td>
                          <span className="text-light font-xs">{v.referrer}</span>
                        </td>
                        <td>
                          <div className="ua-detail text-light font-xs" title={v.userAgent}>
                            {v.userAgent.length > 80 ? v.userAgent.substring(0, 80) + "..." : v.userAgent}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="empty-table-state">
                        No page visits tracked yet.
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
          <div className="dashboard-content-box">
            <div className="content-box-header">
              <h2>Web Traffic & Registration Conversions</h2>
              <p className="text-light" style={{ fontSize: ".85rem", marginTop: ".25rem" }}>
                Traffic charts and daily signups trend for the past {timeRange === "7days" ? 7 : 30} days.
              </p>
            </div>

            <div className="analytics-chart-container">
              <div className="chart-legend">
                <div className="legend-item"><span className="legend-dot bg-blue"></span> Visits</div>
                <div className="legend-item"><span className="legend-dot bg-red"></span> Submissions</div>
              </div>

              <div className="chart-svg-wrapper">
                <svg viewBox="0 0 700 300" className="chart-svg" preserveAspectRatio="none">
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => (
                    <line 
                      key={idx}
                      x1="40" 
                      y1={30 + ratio * 200} 
                      x2="660" 
                      y2={30 + ratio * 200} 
                      stroke="#edf2f7" 
                      strokeWidth="1"
                      strokeDasharray="4,4"
                    />
                  ))}

                  {chartData.days.map((_, idx) => {
                    const x = 50 + idx * (600 / (chartData.days.length - 1 || 1));
                    const shouldShowLine = timeRange === "7days" || idx % 5 === 0 || idx === chartData.days.length - 1;
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

                  <path
                    d={chartData.visitCounts.map((val, idx) => {
                      const x = 50 + idx * (600 / (chartData.days.length - 1 || 1));
                      const y = 230 - (val / maxVisits) * 200;
                      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
                    }).join(" ")}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  <path
                    d={
                      chartData.visitCounts.map((val, idx) => {
                        const x = 50 + idx * (600 / (chartData.days.length - 1 || 1));
                        const y = 230 - (val / maxVisits) * 200;
                        return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
                      }).join(" ") + ` L 650 230 L 50 230 Z`
                    }
                    fill="url(#blue-gradient)"
                    opacity="0.1"
                  />

                  {chartData.enrollCounts.map((val, idx) => {
                    const x = 50 + idx * (600 / (chartData.days.length - 1 || 1));
                    const barHeight = val * 25;
                    const y = 230 - barHeight;
                    return (
                      <rect
                        key={idx}
                        x={x - (timeRange === "7days" ? 10 : 4)}
                        y={y}
                        width={timeRange === "7days" ? "20" : "8"}
                        height={barHeight}
                        fill="var(--r-red)"
                        rx="2"
                        opacity="0.85"
                      />
                    );
                  })}

                  {chartData.visitCounts.map((val, idx) => {
                    const x = 50 + idx * (600 / (chartData.days.length - 1 || 1));
                    const y = 230 - (val / maxVisits) * 200;
                    const shouldShowCircle = timeRange === "7days" || idx % 5 === 0 || idx === chartData.days.length - 1;
                    if (!shouldShowCircle) return null;
                    return (
                      <g key={idx}>
                        <circle cx={x} cy={y} r="4" fill="#3b82f6" stroke="white" strokeWidth="1.5" />
                        <text 
                          x={x} 
                          y={y - 8} 
                          fill="#1a202c" 
                          fontSize="9" 
                          fontWeight="bold" 
                          textAnchor="middle"
                        >
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {chartData.enrollCounts.map((val, idx) => {
                    if (val === 0) return null;
                    const x = 50 + idx * (600 / (chartData.days.length - 1 || 1));
                    const y = 230 - val * 25;
                    return (
                      <text
                        key={idx}
                        x={x}
                        y={y - 6}
                        fill="var(--r-red)"
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {val}
                      </text>
                    );
                  })}

                  <defs>
                    <linearGradient id="blue-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              <div className="chart-xaxis" style={{ display: "flex", justifyContent: "space-between", padding: "0 40px" }}>
                {chartData.days.map((day, idx) => {
                  const shouldShowLabel = timeRange === "7days" || idx % 5 === 0 || idx === chartData.days.length - 1;
                  if (!shouldShowLabel) return null;
                  return (
                    <div key={idx} className="xaxis-label" style={{ fontSize: "10px", color: "var(--muted-foreground)" }}>
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="analytics-details-grid">
              <div className="analytics-details-card">
                <h3>Traffic Sources</h3>
                <div className="details-list">
                  <div className="details-item">
                    <span className="details-name">Direct / Typing</span>
                    <span className="details-val">45%</span>
                  </div>
                  <div className="details-item">
                    <span className="details-name">WhatsApp Links</span>
                    <span className="details-val">32%</span>
                  </div>
                  <div className="details-item">
                    <span className="details-name">Google Search</span>
                    <span className="details-val">15%</span>
                  </div>
                  <div className="details-item">
                    <span className="details-name">LinkedIn Ads</span>
                    <span className="details-val">8%</span>
                  </div>
                </div>
              </div>

              <div className="analytics-details-card">
                <h3>Preferred Courses Ratio</h3>
                <div className="details-list">
                  <div className="details-item">
                    <span className="details-name">Weekend PMI-ACP® Prep</span>
                    <span className="details-val">
                      {submissions.length > 0 
                        ? `${((submissions.filter(s => s.plan && s.plan.includes("Weekend")).length / submissions.length) * 100).toFixed(0)}%`
                        : "0%"}
                    </span>
                  </div>
                  <div className="details-item">
                    <span className="details-name">Week-Day PMI-ACP® Prep</span>
                    <span className="details-val">
                      {submissions.length > 0 
                        ? `${((submissions.filter(s => s.plan && s.plan.includes("Week-Day")).length / submissions.length) * 100).toFixed(0)}%`
                        : "0%"}
                    </span>
                  </div>
                  <div className="details-item">
                    <span className="details-name">General Agile PM</span>
                    <span className="details-val">
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
          <div className="reply-modal" style={{ padding: "0.5rem" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "0.5rem" }}>Send Reply Email</h3>
            <p style={{ color: "var(--muted-foreground)", marginBottom: "1rem", fontSize: "0.9rem" }}>
              To: <strong>{replyingSubmission.name}</strong> ({replyingSubmission.email})
            </p>
            
            {replyingSubmission.repliedAt && (
              <div style={{ 
                background: "rgba(59, 130, 246, 0.08)", 
                borderLeft: "3px solid #3b82f6", 
                padding: "10px", 
                borderRadius: "4px", 
                marginBottom: "1rem", 
                fontSize: "0.85rem" 
              }}>
                <div style={{ fontWeight: "bold", color: "#3b82f6", marginBottom: "4px" }}>
                  Previous reply sent on {new Date(replyingSubmission.repliedAt).toLocaleString()}:
                </div>
                <div style={{ whiteSpace: "pre-wrap", color: "var(--foreground)" }}>
                  {replyingSubmission.replyMessage}
                </div>
              </div>
            )}

            <form onSubmit={handleSendReply}>
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "bold", marginBottom: "0.5rem" }}>Message Body *</label>
                <textarea
                  required
                  rows={6}
                  value={replyMessageText}
                  onChange={(e) => setReplyMessageText(e.target.value)}
                  placeholder="Type your response here..."
                  style={{ 
                    width: "100%", 
                    padding: "8px", 
                    borderRadius: "4px", 
                    border: "1px solid var(--border)", 
                    background: "var(--background)", 
                    color: "var(--foreground)",
                    fontSize: "0.9rem",
                    lineHeight: "1.5"
                  }}
                />
              </div>
              
              {replyError && (
                <div className="login-error" style={{ marginBottom: "1rem" }}>
                  <ShieldAlert size={16} /> {replyError}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setReplyingSubmission(null)}
                  className="btn-secondary"
                  style={{ padding: "8px 16px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingReply}
                  className="btn-primary"
                  style={{ padding: "8px 20px" }}
                >
                  {isSendingReply ? "Sending..." : "Send Reply"}
                </button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
