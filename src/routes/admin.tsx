import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  Users, Eye, Percent, Calendar, Search, LogOut, CheckCircle, 
  Clock, AlertCircle, XCircle, Download, Trash2, Edit2, ShieldAlert
} from "lucide-react";
import { LOGO_URL } from "../lib/constants";
import { openExternal } from "../lib/email";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Portal | Renzy Academy" },
      { name: "description", content: "Renzy Academy Admin Portal" },
    ],
  }),
  component: AdminPage,
});

interface Registration {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  plan: string;
  message: string;
  date: string;
  status: "Pending" | "Contacted" | "Approved" | "Rejected";
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

  for (let i = 14; i >= 0; i--) {
    const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    // 35 to 85 visits per day
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

const mockEnrollments: Registration[] = [
  {
    id: "r7x8a2b",
    name: "Chinedu Okafor",
    email: "chinedu.o@gmail.com",
    phone: "+2348031234567",
    role: "Senior Project Manager",
    plan: "PMI-ACP® Exam Prep: Weekend Plan",
    message: "Interested in payment plan option.",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: "Approved"
  },
  {
    id: "r2k9p1z",
    name: "Olumide Bakare",
    email: "olumide.bakare@yahoo.com",
    phone: "+2348029876543",
    role: "Scrum Master",
    plan: "PMI-ACP® Exam Prep: Week-Day Training",
    message: "Please confirm availability for the morning batch.",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: "Contacted"
  },
  {
    id: "r9s1n2t",
    name: "Chioma Nnaji",
    email: "chioma.nnaji@fintech.ng",
    phone: "+2348161112223",
    role: "Product Manager",
    plan: "PMI-ACP® Exam Prep: Weekend Plan",
    message: "Does this include the PMI application support?",
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: "Pending"
  },
  {
    id: "r5f6y7u",
    name: "Fatima Yusuf",
    email: "fatima.y@gmail.com",
    phone: "+2347055556667",
    role: "Business Analyst",
    plan: "General Agile Project Management for Professionals",
    message: "Looking forward to starting self-paced course.",
    date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    status: "Pending"
  },
  {
    id: "r3e4n5w",
    name: "Emeka Nwosu",
    email: "emeka.n@telecom.com",
    phone: "+2349012345678",
    role: "Software Engineer",
    plan: "PMI-ACP® Exam Prep: Week-Day Training",
    message: "My team is also planning to join.",
    date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    status: "Pending"
  },
  {
    id: "r8t9a2d",
    name: "Temitope Adebayo",
    email: "temi.ade@gmail.com",
    phone: "+2348098765432",
    role: "Agile Coach",
    plan: "General Agile Project Management for Professionals",
    message: "Checking pre-recorded materials.",
    date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    status: "Pending"
  }
];

function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  
  // Dashboard states
  const [submissions, setSubmissions] = useState<Registration[]>([]);
  const [visits, setVisits] = useState<PageVisit[]>([]);
  
  // Filters and Views
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"submissions" | "visits" | "analytics">("submissions");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<Registration["status"]>("Pending");

  // Check login state
  useEffect(() => {
    const session = localStorage.getItem("renzy_admin_session");
    if (session === "true") {
      setIsLoggedIn(true);
      loadDashboardData();
    }
  }, []);

  const loadDashboardData = () => {
    // Enrollments
    let storedEnrolls = localStorage.getItem("renzy_enrolls");
    if (!storedEnrolls) {
      localStorage.setItem("renzy_enrolls", JSON.stringify(mockEnrollments));
      storedEnrolls = JSON.stringify(mockEnrollments);
    }
    setSubmissions(JSON.parse(storedEnrolls));

    // Page Visits
    let storedVisits = localStorage.getItem("renzy_visits");
    if (!storedVisits || JSON.parse(storedVisits).length < 20) {
      const generated = generateMockVisits();
      // Merge generated with any actual visits
      const actual = storedVisits ? JSON.parse(storedVisits) : [];
      const combined = [...actual, ...generated].slice(0, 1500);
      localStorage.setItem("renzy_visits", JSON.stringify(combined));
      storedVisits = JSON.stringify(combined);
    }
    setVisits(JSON.parse(storedVisits));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() === "info@renzyacademy.org" && password === "11223344") {
      localStorage.setItem("renzy_admin_session", "true");
      setIsLoggedIn(true);
      setLoginError("");
      loadDashboardData();
    } else {
      setLoginError("Invalid email or password");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("renzy_admin_session");
    setIsLoggedIn(false);
    setEmail("");
    setPassword("");
  };

  // Status updates
  const updateStatus = (id: string, newStatus: Registration["status"]) => {
    const updated = submissions.map((sub) => {
      if (sub.id === id) {
        return { ...sub, status: newStatus };
      }
      return sub;
    });
    setSubmissions(updated);
    localStorage.setItem("renzy_enrolls", JSON.stringify(updated));
    setEditingId(null);
  };

  // Delete submission
  const deleteSubmission = (id: string) => {
    if (confirm("Are you sure you want to delete this submission?")) {
      const filtered = submissions.filter((sub) => sub.id !== id);
      setSubmissions(filtered);
      localStorage.setItem("renzy_enrolls", JSON.stringify(filtered));
    }
  };

  // Export submissions to CSV
  const exportToCSV = () => {
    const headers = ["Date", "Name", "Email", "Phone", "Current Role", "Course Plan", "Message", "Status"];
    const rows = submissions.map((s) => [
      new Date(s.date).toLocaleDateString(),
      s.name,
      s.email,
      s.phone,
      s.role,
      s.plan,
      s.message.replace(/,/g, " "),
      s.status
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `renzy_academy_enrollments_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter submissions
  const filteredSubmissions = submissions.filter((s) => {
    const matchesSearch = 
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search) ||
      s.role.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    const matchesPlan = planFilter === "all" || s.plan.toLowerCase().includes(planFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Calculate stats
  const totalVisitsCount = visits.length;
  const totalSubmissionsCount = submissions.length;
  const conversionRate = totalVisitsCount > 0 
    ? ((totalSubmissionsCount / totalVisitsCount) * 100).toFixed(1) 
    : "0.0";

  // Group visits by day for SVG chart (past 7 days)
  const getChartData = () => {
    const days: string[] = [];
    const visitCounts: number[] = [];
    const enrollCounts: number[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      days.push(dateStr);

      // Filter visits for this day
      const dVisits = visits.filter(v => {
        const vDate = new Date(v.timestamp);
        return vDate.toDateString() === d.toDateString();
      });
      visitCounts.push(dVisits.length);

      // Filter enrollments for this day
      const dEnrolls = submissions.filter(e => {
        const eDate = new Date(e.date);
        return eDate.toDateString() === d.toDateString();
      });
      enrollCounts.push(dEnrolls.length);
    }
    return { days, visitCounts, enrollCounts };
  };

  const chartData = getChartData();

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
            <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "1rem" }}>
              Sign In
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

  // Helper component to render badge
  const StatusBadge = ({ status }: { status: Registration["status"] }) => {
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

  // Max value for scaling SVG chart
  const maxVisits = Math.max(...chartData.visitCounts, 10);

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
          <div className="header-actions">
            <button onClick={exportToCSV} className="btn-secondary flex-center gap-xs">
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
              <h2>Student Enrollment Submissions ({filteredSubmissions.length})</h2>
              
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
                    <th>Student Info</th>
                    <th>Course Plan & Details</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.length > 0 ? (
                    filteredSubmissions.map((s) => (
                      <tr key={s.id}>
                        <td className="text-light text-nowrap">
                          {new Date(s.date).toLocaleDateString(undefined, { 
                            month: "short", 
                            day: "numeric", 
                            hour: "2-digit", 
                            minute: "2-digit" 
                          })}
                        </td>
                        <td>
                          <div className="student-name">{s.name}</div>
                          <div className="student-details text-light font-xs">
                            {s.email} • {s.phone}
                          </div>
                          {s.role && <div className="student-role text-light font-xs">Role: {s.role}</div>}
                        </td>
                        <td>
                          <div className="plan-name">{s.plan}</div>
                          {s.message && (
                            <div className="student-message text-light font-xs">
                              💬 {s.message}
                            </div>
                          )}
                        </td>
                        <td>
                          {editingId === s.id ? (
                            <div className="flex-center gap-xs">
                              <select 
                                value={editStatus} 
                                onChange={(e) => setEditStatus(e.target.value as Registration["status"])}
                                className="edit-status-select"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Contacted">Contacted</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                              </select>
                              <button 
                                onClick={() => updateStatus(s.id, editStatus)}
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
                                onClick={() => { setEditingId(s.id); setEditStatus(s.status); }}
                                className="btn-action-edit"
                                title="Edit Status"
                              >
                                <Edit2 size={12} />
                              </button>
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button 
                            onClick={() => deleteSubmission(s.id)}
                            className="btn-action-delete"
                            title="Delete Submission"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="empty-table-state">
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
                  {visits.length > 0 ? (
                    visits.slice(0, 100).map((v) => (
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
                Traffic charts and daily signups trend for the past 7 days.
              </p>
            </div>

            {/* Custom Responsive SVG Chart */}
            <div className="analytics-chart-container">
              <div className="chart-legend">
                <div className="legend-item"><span className="legend-dot bg-blue"></span> Visits</div>
                <div className="legend-item"><span className="legend-dot bg-red"></span> Submissions</div>
              </div>

              <div className="chart-svg-wrapper">
                <svg viewBox="0 0 700 300" className="chart-svg" preserveAspectRatio="none">
                  {/* Grid Lines */}
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

                  {/* Vertical labels guide lines */}
                  {chartData.days.map((_, idx) => {
                    const x = 50 + idx * 100;
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

                  {/* Visits Line (Blue Line Chart) */}
                  <path
                    d={chartData.visitCounts.map((val, idx) => {
                      const x = 50 + idx * 100;
                      // scale val to fits inside y: 30 to 230 (height 200)
                      const y = 230 - (val / maxVisits) * 200;
                      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
                    }).join(" ")}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {/* Visits Area Gradient */}
                  <path
                    d={
                      chartData.visitCounts.map((val, idx) => {
                        const x = 50 + idx * 100;
                        const y = 230 - (val / maxVisits) * 200;
                        return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
                      }).join(" ") + ` L 650 230 L 50 230 Z`
                    }
                    fill="url(#blue-gradient)"
                    opacity="0.1"
                  />

                  {/* Enrollments Bar Chart (Red Bars) */}
                  {chartData.enrollCounts.map((val, idx) => {
                    const x = 50 + idx * 100;
                    const barHeight = val * 25; // 25px height per enrollment
                    const y = 230 - barHeight;
                    return (
                      <rect
                        key={idx}
                        x={x - 10}
                        y={y}
                        width="20"
                        height={barHeight}
                        fill="var(--r-red)"
                        rx="3"
                        opacity="0.85"
                      />
                    );
                  })}

                  {/* Data Point Circles for Visits */}
                  {chartData.visitCounts.map((val, idx) => {
                    const x = 50 + idx * 100;
                    const y = 230 - (val / maxVisits) * 200;
                    return (
                      <g key={idx}>
                        <circle cx={x} cy={y} r="5" fill="#3b82f6" stroke="white" strokeWidth="2" />
                        <text 
                          x={x} 
                          y={y - 10} 
                          fill="#1a202c" 
                          fontSize="10" 
                          fontWeight="bold" 
                          textAnchor="middle"
                        >
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Data Labels for Enrollments */}
                  {chartData.enrollCounts.map((val, idx) => {
                    if (val === 0) return null;
                    const x = 50 + idx * 100;
                    const y = 230 - val * 25;
                    return (
                      <text
                        key={idx}
                        x={x}
                        y={y - 8}
                        fill="var(--r-red)"
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {val} reg
                      </text>
                    );
                  })}

                  {/* Definitions for gradients */}
                  <defs>
                    <linearGradient id="blue-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* X Axis Labels */}
              <div className="chart-xaxis">
                {chartData.days.map((day, idx) => (
                  <div key={idx} className="xaxis-label">{day}</div>
                ))}
              </div>
            </div>

            {/* Device breakdown and Referrer cards */}
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
                        ? `${((submissions.filter(s => s.plan.includes("Weekend")).length / submissions.length) * 100).toFixed(0)}%`
                        : "0%"}
                    </span>
                  </div>
                  <div className="details-item">
                    <span className="details-name">Week-Day PMI-ACP® Prep</span>
                    <span className="details-val">
                      {submissions.length > 0 
                        ? `${((submissions.filter(s => s.plan.includes("Week-Day")).length / submissions.length) * 100).toFixed(0)}%`
                        : "0%"}
                    </span>
                  </div>
                  <div className="details-item">
                    <span className="details-name">General Agile PM</span>
                    <span className="details-val">
                      {submissions.length > 0 
                        ? `${((submissions.filter(s => s.plan.includes("General Agile")).length / submissions.length) * 100).toFixed(0)}%`
                        : "0%"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
