"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  FiSettings,
  FiBarChart2,
  FiZap,
  FiSearch,
  FiCheckCircle,
  FiShield,
  FiTrendingUp,
  FiAlertTriangle,
  FiAlertCircle,
  FiInfo,
  FiRefreshCw,
  FiUpload,
  FiPlus,
  FiClock,
  FiTarget,
  FiAward,
  FiThumbsUp,
  FiThumbsDown,
  FiMessageSquare,
  FiEdit3,
  FiSend,
  FiExternalLink,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiFileText,
  FiLayers,
  FiDatabase,
  FiActivity,
  FiHelpCircle,
  FiBook,
  FiTerminal,
  FiDownload,
  FiHome,
  FiPieChart,
  FiGrid
} from "react-icons/fi";
import {
  HiOutlineLightBulb,
  HiOutlineSparkles,
  HiOutlineDocumentText,
  HiOutlineClipboardCheck
} from "react-icons/hi";

type TabType = "setup" | "dashboard" | "recommendations" | "competitors" | "guide" | "validator" | "shield" | "insights" | "help";
type DashboardSubTab = "overview" | "performance" | "analytics";

// Set to true to enable personal features (comment suggestions)
// Set to false for open source distribution
const ENABLE_PERSONAL_FEATURES = true;

// Tab labels for breadcrumbs
const TAB_LABELS: Record<TabType, string> = {
  dashboard: "Dashboard",
  recommendations: "Recommendations",
  competitors: "Competitor Analysis",
  guide: "Community Guide",
  validator: "Pre-Post Checker",
  shield: "Reputation Shield",
  insights: "Removal Insights",
  setup: "Setup",
  help: "Help & Guide"
};

// Dashboard sub-tab configuration
const DASHBOARD_SUB_TABS: { key: DashboardSubTab; label: string; icon: React.ReactNode }[] = [
  { key: "overview", label: "Overview", icon: <FiGrid className="w-4 h-4" /> },
  { key: "performance", label: "Performance", icon: <FiTrendingUp className="w-4 h-4" /> },
  { key: "analytics", label: "Analytics", icon: <FiPieChart className="w-4 h-4" /> },
];

// Breadcrumb Component
function Breadcrumb({ items }: { items: { label: string; onClick?: () => void }[] }) {
  return (
    <div className="flex items-center gap-2 text-sm mb-6">
      <button
        onClick={() => window.location.hash = "dashboard"}
        className="flex items-center gap-1.5 text-gray-500 hover:text-orange-400 transition-colors"
      >
        <FiHome className="w-3.5 h-3.5" />
        <span>MyRedBuddy</span>
      </button>
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="text-gray-700">/</span>
          {item.onClick ? (
            <button
              onClick={item.onClick}
              className="text-gray-400 hover:text-orange-400 transition-colors"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-gray-200 font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </div>
  );
}

// Metric Card Component for SaaS-style dashboard
// Action Button Component
function ActionButton({
  label,
  icon,
  onClick,
  variant = "primary"
}: {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const variants = {
    primary: "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25",
    secondary: "bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700",
    ghost: "bg-transparent hover:bg-gray-800/50 text-gray-400 hover:text-gray-200"
  };

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${variants[variant]}`}
    >
      {icon}
      {label}
    </button>
  );
}

// Metric Card with Actions
function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = "orange",
  onClick,
  actions
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; label: string };
  icon: React.ReactNode;
  color?: "orange" | "emerald" | "blue" | "purple" | "red";
  onClick?: () => void;
  actions?: { label: string; icon?: React.ReactNode; onClick: () => void }[];
}) {
  const colors = {
    orange: "from-orange-500/20 to-orange-600/5 border-orange-500/30 text-orange-400",
    emerald: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/30 text-emerald-400",
    blue: "from-blue-500/20 to-blue-600/5 border-blue-500/30 text-blue-400",
    purple: "from-purple-500/20 to-purple-600/5 border-purple-500/30 text-purple-400",
    red: "from-red-500/20 to-red-600/5 border-red-500/30 text-red-400"
  };

  const actionColors = {
    orange: "bg-orange-500/20 hover:bg-orange-500/30 text-orange-400",
    emerald: "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400",
    blue: "bg-blue-500/20 hover:bg-blue-500/30 text-blue-400",
    purple: "bg-purple-500/20 hover:bg-purple-500/30 text-purple-400",
    red: "bg-red-500/20 hover:bg-red-500/30 text-red-400"
  };

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden bg-gradient-to-br ${colors[color]} border rounded-xl p-5 ${onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-100 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${trend.value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              <span>{trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
              <span className="text-gray-500">{trend.label}</span>
            </div>
          )}
          {/* Action Buttons */}
          {actions && actions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); action.onClick(); }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${actionColors[color]}`}
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-gray-900/50 ${colors[color].split(' ').pop()}`}>
          {icon}
        </div>
      </div>
      {/* Decorative gradient */}
      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl" />
    </div>
  );
}

const NAV_ITEMS: { key: TabType; label: string; icon: React.ReactNode; personal?: boolean }[] = [
  { key: "dashboard", label: "Dashboard", icon: <FiBarChart2 className="w-4 h-4" /> },
  { key: "recommendations", label: "Recommendations", icon: <HiOutlineLightBulb className="w-4 h-4" /> },
  { key: "competitors", label: "Competitor Analysis", icon: <FiSearch className="w-4 h-4" /> },
  { key: "guide", label: "Community Guide", icon: <FiBook className="w-4 h-4" /> },
  { key: "validator", label: "Pre-Post Checker", icon: <FiMessageSquare className="w-4 h-4" /> },
  { key: "shield", label: "Reputation Shield", icon: <FiShield className="w-4 h-4" /> },
  { key: "insights", label: "Removal Insights", icon: <FiTrendingUp className="w-4 h-4" /> },
  { key: "setup", label: "Setup", icon: <FiSettings className="w-4 h-4" /> },
  { key: "help", label: "Help & Guide", icon: <FiHelpCircle className="w-4 h-4" /> },
];

interface Item {
  type: string;
  subreddit: string;
  title?: string;
  content: string;
  ups: number;
  tones: string[];
  topics: string[];
}

interface StatEntry {
  total_ups: number;
  count: number;
  avg: number;
}

interface DashboardData {
  items: Item[];
  tone_stats: Record<string, StatEntry>;
  topic_stats: Record<string, StatEntry>;
  sub_stats: Record<string, StatEntry>;
}

interface PostIdea {
  title: string;
  subreddit: string;
  predicted_ups: string;
  confidence: string;
  why: string;
}

interface CommentStrategy {
  strategy: string;
  example_from_data: string;
  when_to_use: string;
  predicted_impact: string;
  key_ingredients: string;
}

interface AvoidPattern {
  pattern: string;
  example_from_data: string;
  why_fails: string;
  fix: string;
}

interface SubPlaybook {
  subreddit: string;
  hit_rate: string;
  avg_ups: number;
  winning_formula: string;
  recommended_frequency: string;
  ideal_tone: string[];
}

interface Recommendations {
  post_ideas: PostIdea[];
  comment_strategies: CommentStrategy[];
  avoid: AvoidPattern[];
  subreddit_playbook: SubPlaybook[];
  patterns_summary: {
    high_performing_comment_profile: Record<string, number>;
    low_performing_comment_profile: Record<string, number>;
    insight: string;
  };
}

interface GuideResult {
  subreddit: string;
  posts_analyzed: number;
  vibe: string[];
  what_gets_upvoted: string[];
  removal_risks: string[];
  unwritten_rules: string[];
  how_to_start: string[];
  karma_tip: string;
}

const TONE_COLORS: Record<string, string> = {
  personal_experience: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  data_driven: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  comparison: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  advisory: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  pain_point: "bg-red-500/20 text-red-400 border-red-500/30",
  question_engaging: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  positive_enthusiastic: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  practical_tip: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  neutral: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

// Reusable Spinner component
function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return <FiRefreshCw className={`${className} animate-spin`} />;
}

function Tag({ label, type }: { label: string; type?: "tone" | "topic" }) {
  const colors =
    type === "tone"
      ? TONE_COLORS[label] || TONE_COLORS.neutral
      : "bg-indigo-500/20 text-indigo-400 border-indigo-500/30";
  return (
    <span
      className={`inline-block text-[11px] px-2 py-0.5 rounded border ${colors} mr-1 mb-1`}
    >
      {label.replace(/_/g, " ")}
    </span>
  );
}

function StatBar({
  label,
  avg,
  count,
  maxAvg,
  color,
}: {
  label: string;
  avg: number;
  count: number;
  maxAvg: number;
  color: string;
}) {
  const pct = maxAvg > 0 ? (avg / maxAvg) * 100 : 0;
  return (
    <div className="mb-2">
      <div className="flex justify-between text-sm mb-0.5">
        <span className="text-gray-300">{label.replace(/_/g, " ")}</span>
        <span className="text-gray-500 text-xs">
          {avg} avg &middot; {count} items
        </span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full ${color}`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
    </div>
  );
}

function ScoreCircle({ score, max }: { score: number; max: number }) {
  const pct = max > 0 ? Math.min((score / max) * 100, 100) : 0;
  const color =
    pct >= 60 ? "text-emerald-400" : pct >= 30 ? "text-amber-400" : "text-red-400";
  return (
    <div
      className={`flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-lg ${color} border-current`}
    >
      {score}
    </div>
  );
}

const ITEMS_PER_PAGE = 10;

function Pagination({
  currentPage,
  totalItems,
  onPageChange,
  color = "orange"
}: {
  currentPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  color?: "orange" | "emerald" | "red";
}) {
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  if (totalPages <= 1) return null;

  const colorClasses = {
    orange: "bg-orange-500 hover:bg-orange-600",
    emerald: "bg-emerald-500 hover:bg-emerald-600",
    red: "bg-red-500 hover:bg-red-600",
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-700"
      >
        Prev
      </button>
      <span className="text-sm text-gray-500">
        {currentPage} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-3 py-1 text-sm text-white rounded disabled:opacity-30 disabled:cursor-not-allowed ${colorClasses[color]}`}
      >
        Next
      </button>
    </div>
  );
}

// Valid tabs for URL routing
const VALID_TABS: TabType[] = ["dashboard", "setup", "recommendations", "competitors", "guide", "validator", "shield", "insights", "help"];

function getTabFromHash(): TabType {
  if (typeof window === "undefined") return "dashboard";
  const hash = window.location.hash.replace("#", "");
  if (VALID_TABS.includes(hash as TabType)) {
    // Check if it's a personal feature that's disabled
    const navItem = NAV_ITEMS.find(item => item.key === hash);
    if (navItem?.personal && !ENABLE_PERSONAL_FEATURES) {
      return "dashboard";
    }
    return hash as TabType;
  }
  return "dashboard";
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [recs, setRecs] = useState<Recommendations | null>(null);
  const [recsLoading, setRecsLoading] = useState(false);
  const [recsFocusSub, setRecsFocusSub] = useState("");
  const [tab, setTab] = useState<TabType>("dashboard");
  const [dashboardSubTab, setDashboardSubTab] = useState<DashboardSubTab>("overview");
  const [isClient, setIsClient] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [filter, setFilter] = useState<{
    type: string;
    value: string;
  } | null>(null);
  const [draftText, setDraftText] = useState("");
  const [draftSub, setDraftSub] = useState("");
  const [originalPost, setOriginalPost] = useState("");
  const [validationResult, setValidationResult] = useState<{score: number; breakdown: string[]} | null>(null);
  const [competitorSub, setCompetitorSub] = useState("");
  const [competitorData, setCompetitorData] = useState<{posts: Item[]; tone_stats: Record<string, StatEntry>; topic_stats: Record<string, StatEntry>} | null>(null);
  const [competitorLoading, setCompetitorLoading] = useState(false);
  const [validationLoading, setValidationLoading] = useState(false);
  const [validationAnalysis, setValidationAnalysis] = useState("");
  const [validationShield, setValidationShield] = useState<{status: string; can_post: boolean; overall_score: number; summary: string; issues: {type: string; description: string; severity: string}[]; warnings: {type: string; description: string; severity: string}[]; suggestions: string[]} | null>(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestResult, setSuggestResult] = useState("");
  const [competitorAnalysis, setCompetitorAnalysis] = useState("");
  const [guideSub, setGuideSub] = useState("");
  const [guideLoading, setGuideLoading] = useState(false);
  const [guideResult, setGuideResult] = useState<GuideResult | null>(null);
  const [importUsername, setImportUsername] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{success: boolean; message: string} | null>(null);
  const [apiStatus, setApiStatus] = useState<{has_data: boolean; has_persona: boolean; data_stats: {posts: number; comments: number}; ai_mode?: string; ai_model?: string} | null>(null);
  const [subredditRules, setSubredditRules] = useState<{subreddits: string[]; rules: Record<string, {name: string; focus: string; rules: string[]; what_works: string[]; what_fails: string[]; tone: string; typical_audience: string}>} | null>(null);
  const [selectedRuleSub, setSelectedRuleSub] = useState<string>("");
  // Shield state
  const [shieldText, setShieldText] = useState("");
  const [shieldSub, setShieldSub] = useState("");
  const [shieldLoading, setShieldLoading] = useState(false);
  const [shieldResult, setShieldResult] = useState<{status: string; can_post: boolean; overall_score: number; summary: string; issues: {type: string; description: string; severity: string; match?: string}[]; warnings: {type: string; description: string; severity: string}[]; suggestions: string[]; insights_warnings?: {type: string; message: string}[]; removal_history?: {total_removals: number; high_risk_subreddits: string[]; checked: boolean}} | null>(null);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<{total_analyzed: number; risky_count: number; risky_items: {content_preview: string; ups: number; subreddit: string; risks: {type: string; reason: string}[]; recommendation: string}[]} | null>(null);
  const [opportunitySub, setOpportunitySub] = useState("");
  const [opportunityLoading, setOpportunityLoading] = useState(false);
  const [opportunities, setOpportunities] = useState<{title: string; ups: number; num_comments: number; opportunity_score: number; question_type: string; why_opportunity: string; permalink: string}[]>([]);
  const [worksPage, setWorksPage] = useState(1);
  const [doesntWorkPage, setDoesntWorkPage] = useState(1);
  const [refineComment, setRefineComment] = useState("");
  const [refineFeedback, setRefineFeedback] = useState("");
  const [refineFeedbackType, setRefineFeedbackType] = useState("ai_sounding");
  const [refineLoading, setRefineLoading] = useState(false);
  const [refineResult, setRefineResult] = useState("");
  const [parsedSuggestions, setParsedSuggestions] = useState<{id: number; text: string; isRefining?: boolean}[]>([]);
  const [activeRefineId, setActiveRefineId] = useState<number | null>(null);

  // Insights state
  const [insightsStats, setInsightsStats] = useState<{
    total_removals: number;
    last_updated: string | null;
    high_risk_subreddits: string[];
    high_risk_topics: string[];
    high_risk_tones: string[];
    common_reasons: Record<string, number>;
    by_subreddit: Record<string, number>;
    by_type: {post: number; comment: number};
    by_removal_type: Record<string, number>;
    recent_removals: {subreddit: string; content_preview: string; content_type: string; reason: string; removal_type: string; logged_at: string}[];
  } | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [logRemovalSub, setLogRemovalSub] = useState("");
  const [logRemovalContent, setLogRemovalContent] = useState("");
  const [logRemovalType, setLogRemovalType] = useState("comment");
  const [logRemovalReason, setLogRemovalReason] = useState("");
  const [logRemovalBy, setLogRemovalBy] = useState("mod");
  const [logRemovalLoading, setLogRemovalLoading] = useState(false);
  const [insightsAnalysis, setInsightsAnalysis] = useState<{
    total_analyzed: number;
    by_subreddit: Record<string, {count: number; total_ups: number; avg_ups: number}>;
    problem_subreddits: {subreddit: string; count: number; avg_ups: number; issue: string}[];
    problem_topics: {topic: string; count: number; avg_ups: number}[];
    tone_performance: Record<string, {count: number; avg_ups: number}>;
    insights: {type: string; title: string; description: string; action: string}[];
  } | null>(null);

  // Profile state
  const [profiles, setProfiles] = useState<{
    active_profile: string | null;
    profiles: {username: string; created_at: string; last_updated: string; stats: {posts: number; comments: number}; is_active: boolean}[];
    data_location: string;
    total_profiles: number;
  } | null>(null);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [confirmOwnAccount, setConfirmOwnAccount] = useState(true);
  const [showExportData, setShowExportData] = useState<{username: string; data: object} | null>(null);

  // Setup tab — persona & goals form
  const [setupGoal, setSetupGoal] = useState("");
  const [setupName, setSetupName] = useState("");
  const [setupRole, setSetupRole] = useState("");
  const [setupYears, setSetupYears] = useState(1);
  const [setupExpertise, setSetupExpertise] = useState<string[]>([]);
  const [setupExpertiseInput, setSetupExpertiseInput] = useState("");
  const [setupSubs, setSetupSubs] = useState<string[]>([]);
  const [setupSubInput, setSetupSubInput] = useState("");
  const [setupSaving, setSetupSaving] = useState(false);
  const [setupSaved, setSetupSaved] = useState(false);

  // URL hash routing - initialize tab from URL on mount
  useEffect(() => {
    setIsClient(true);
    const initialTab = getTabFromHash();
    setTab(initialTab);

    // Listen for browser back/forward
    const handleHashChange = () => {
      const newTab = getTabFromHash();
      setTab(newTab);
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Update URL hash when tab changes
  useEffect(() => {
    if (isClient && typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${tab}`);
    }
  }, [tab, isClient]);

  useEffect(() => {
    fetch("/data.json")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setIsInitialLoading(false));
    // Recommendations are never auto-loaded — always generated on-demand
    // per active profile to prevent stale data from other accounts showing.
    // Check API status
    fetch(`${API_BASE}/api/status`)
      .then((r) => r.json())
      .then(setApiStatus)
      .catch(() => setApiStatus(null));
    // Load subreddit rules
    fetch(`${API_BASE}/api/rules`)
      .then((r) => r.json())
      .then(setSubredditRules)
      .catch(() => setSubredditRules(null));
    // Load insights stats
    fetch(`${API_BASE}/api/insights/stats`)
      .then((r) => r.json())
      .then(setInsightsStats)
      .catch(() => setInsightsStats(null));
    // Load insights analysis
    fetch(`${API_BASE}/api/insights/analysis`)
      .then((r) => r.json())
      .then(setInsightsAnalysis)
      .catch(() => setInsightsAnalysis(null));
    // Load profiles
    fetch(`${API_BASE}/api/profiles`)
      .then((r) => r.json())
      .then(setProfiles)
      .catch(() => setProfiles(null));
  }, []);

  const API_BASE = "http://localhost:8000";
  const router = useRouter();
  // Prevent re-redirecting if we just came back from /onboarding
  const redirectedRef = useRef(false);

  // Clear recommendations whenever the active profile changes — prevents
  // stale recs from a different account bleeding into the current profile view.
  useEffect(() => {
    setRecs(null);
    setRecsFocusSub("");
  }, [profiles?.active_profile]);

  // Redirect to /onboarding when no active profile is linked.
  // If the user landed here with ?onboarded=1 (came back from onboarding
  // without importing), skip the redirect this session and clean the URL.
  useEffect(() => {
    if (!isInitialLoading && profiles !== null && !profiles?.active_profile) {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("onboarded") === "1") {
          // Clean URL, let them stay on the page
          window.history.replaceState({}, "", window.location.hash || "/");
          return;
        }
        // Pre-fill import username if onboarding passed one
        const importParam = params.get("import");
        if (importParam) {
          setImportUsername(decodeURIComponent(importParam));
          window.history.replaceState({}, "", window.location.hash || "/");
          setTab("setup");
          return;
        }
      }
      if (!redirectedRef.current) {
        redirectedRef.current = true;
        router.push("/onboarding");
      }
    }
  }, [isInitialLoading, profiles]);

  // Refresh profiles list
  const refreshProfiles = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/profiles`);
      const data = await res.json();
      setProfiles(data);
    } catch {
      // ignore
    }
  };

  // Switch active profile
  const switchProfile = async (username: string) => {
    setProfilesLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/profiles/active`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      if (res.ok) {
        await refreshProfiles();
        // Refresh data for new profile
        const statusRes = await fetch(`${API_BASE}/api/status`);
        setApiStatus(await statusRes.json());
        // Reload dashboard data
        const dataRes = await fetch("/data.json");
        setData(await dataRes.json());
      }
    } finally {
      setProfilesLoading(false);
    }
  };

  // Delete profile
  const deleteProfile = async (username: string) => {
    if (!confirm(`Remove profile "${username}" from the list? (Data files will be preserved)`)) return;
    const wasActive = profiles?.active_profile === username;
    try {
      await fetch(`${API_BASE}/api/profiles/${username}`, { method: "DELETE" });
      await refreshProfiles();
      if (wasActive) {
        setData(null);
        redirectedRef.current = false;
        router.push("/onboarding");
      }
    } catch {
      // ignore
    }
  };

  // Load existing persona into setup form when entering setup tab
  useEffect(() => {
    if (tab === "setup") {
      fetch(`${API_BASE}/api/persona`)
        .then((r) => r.json())
        .then((d) => {
          if (d.exists && d.persona) {
            const p = d.persona;
            setSetupName(p.name || "");
            setSetupRole(p.current_role || "");
            setSetupYears(p.experience_years || 1);
            setSetupExpertise(p.expertise?.main || []);
            setSetupSubs(p.domains || []);
            setSetupGoal(p.personality?.goal || "");
          }
        })
        .catch(() => {});
    }
  }, [tab]);

  // Save persona from setup tab
  const saveSetupPersona = async () => {
    setSetupSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/persona`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: setupName.trim() || profiles?.active_profile || "User",
          experience_years: setupYears,
          current_role: setupRole.trim() || "Not specified",
          expertise: setupExpertise.length > 0 ? setupExpertise : ["general"],
          domains: setupSubs,
          real_experiences: [],
          goal: setupGoal,
        }),
      });
      if (res.ok) {
        setSetupSaved(true);
        setTimeout(() => setSetupSaved(false), 3000);
        fetch(`${API_BASE}/api/status`).then((r) => r.json()).then(setApiStatus).catch(() => {});
      } else {
        alert("Failed to save. Make sure api.py is running.");
      }
    } catch {
      alert("Could not connect to API.");
    } finally {
      setSetupSaving(false);
    }
  };

  // Export profile data
  const exportProfile = async (username: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/profiles/export/${username}`);
      const data = await res.json();
      setShowExportData({ username, data });
    } catch {
      alert("Failed to export profile data");
    }
  };

  // Download export as JSON file
  const downloadExport = () => {
    if (!showExportData) return;
    const blob = new Blob([JSON.stringify(showExportData.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `myredbuddy-backup-${showExportData.username}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Refresh data for active profile (fetch latest from Reddit)
  const [refreshLoading, setRefreshLoading] = useState(false);
  const refreshProfileData = async () => {
    setRefreshLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const result = await res.json();
      if (res.ok) {
        // Refresh dashboard data
        fetch("/data.json").then((r) => r.json()).then(setData).catch(() => {});
        fetch(`${API_BASE}/api/status`).then((r) => r.json()).then(setApiStatus).catch(() => {});
        // Refresh insights stats if removals were detected
        if (result.removals_detected) {
          fetch(`${API_BASE}/api/insights/stats`).then((r) => r.json()).then(setInsightsStats).catch(() => {});
        }
        await refreshProfiles();
        let message = `Refreshed: ${result.new_posts} new posts, ${result.new_comments} new comments, ${result.updated_posts} updated, ${result.updated_comments} updated`;
        if (result.removals_detected > 0) {
          message += `\n\n⚠️ ${result.removals_detected} removed/deleted items detected and logged to Insights.`;
        }
        alert(message);
      } else {
        alert(result.detail || "Failed to refresh data");
      }
    } catch {
      alert("Could not connect to API. Make sure api.py is running.");
    } finally {
      setRefreshLoading(false);
    }
  };

  // Import data by username
  const importData = async () => {
    if (!importUsername.trim()) return;
    setImportLoading(true);
    setImportResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/import/username`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: importUsername, posts_limit: 50, comments_limit: 100 }),
      });
      const result = await res.json();
      if (res.ok) {
        setImportResult({ success: true, message: result.message || `Imported ${result.posts_imported} posts and ${result.comments_imported} comments` });
        // Refresh data and profiles
        fetch("/data.json").then((r) => r.json()).then(setData).catch(() => {});
        fetch(`${API_BASE}/api/status`).then((r) => r.json()).then(setApiStatus).catch(() => {});
        refreshProfiles();
      } else {
        setImportResult({ success: false, message: result.detail || "Import failed" });
      }
    } catch {
      setImportResult({ success: false, message: "Could not connect to API. Make sure api.py is running on port 8000." });
    }
    setImportLoading(false);
  };

  // Refresh recommendations with optional subreddit focus
  const refreshRecommendations = async (focusSub?: string) => {
    setRecsLoading(true);
    try {
      const url = focusSub
        ? `${API_BASE}/api/recommendations/refresh?subreddit=${encodeURIComponent(focusSub)}`
        : `${API_BASE}/api/recommendations/refresh`;
      const res = await fetch(url, { method: "POST" });
      const result = await res.json();
      if (res.ok && result.success) {
        setRecs(result.recommendations);
        alert(result.message);
      } else {
        alert(result.message || result.detail || "Failed to refresh recommendations");
      }
    } catch {
      alert("Could not connect to API. Make sure api.py is running.");
    } finally {
      setRecsLoading(false);
    }
  };

  // Show loading spinner during initial data fetch
  if (isInitialLoading) {
    return (
      <div className="flex min-h-screen bg-gray-950 items-center justify-center">
        <div className="text-center">
          <img src="/myredditbuddy-logo.png" alt="MyRedBuddy" className="h-12 w-auto mx-auto mb-4" />
          <FiRefreshCw className="w-6 h-6 text-orange-500 animate-spin mx-auto" />
        </div>
      </div>
    );
  }


  // Tabs that require an imported account to be useful
  const ACCOUNT_DEPENDENT_TABS: TabType[] = ["dashboard", "recommendations", "insights"];

  // Reusable sidebar (used in both no-account and no-data states below)
  const Sidebar = () => (
    <div className="w-56 bg-gray-900/80 border-r border-gray-800 p-4 flex-shrink-0">
      <div className="mb-6">
        <img src="/myredditbuddy-logo.png" alt="MyRedBuddy" className="h-8 w-auto" />
      </div>
      <nav className="space-y-1">
        {NAV_ITEMS.filter(item => !item.personal || ENABLE_PERSONAL_FEATURES).map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition ${
              tab === item.key
                ? "bg-orange-500/20 text-orange-400"
                : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );

  // No active profile — intercept account-dependent tabs
  if (!profiles?.active_profile && ACCOUNT_DEPENDENT_TABS.includes(tab)) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-xl mx-auto mt-12 space-y-4">

            {/* PRIMARY: Community Guide */}
            <div className="bg-gray-900/50 border-2 border-orange-500/50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-orange-500/15 border border-orange-500/30 flex-shrink-0">
                  <FiBook className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-100">Community Guide</h2>
                  <p className="text-xs text-gray-400">Understand any subreddit before you post — no account needed</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center flex-1 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden focus-within:border-orange-500">
                  <span className="pl-3 text-gray-500 text-sm select-none">r/</span>
                  <input
                    type="text"
                    placeholder="subreddit name"
                    value={guideSub}
                    onChange={(e) => setGuideSub(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { setTab("guide"); fetchCommunityGuide(guideSub); } }}
                    className="flex-1 px-2 py-2.5 bg-transparent text-gray-200 text-sm focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => { setTab("guide"); fetchCommunityGuide(guideSub); }}
                  disabled={!guideSub.trim()}
                  className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-40 whitespace-nowrap"
                >
                  Get Guide
                </button>
              </div>
            </div>

            {/* SECONDARY: Set up account */}
            <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gray-800 flex-shrink-0">
                  <FiUser className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-200">Want personalized insights?</p>
                  <p className="text-xs text-gray-500 mt-0.5">Link your Reddit account to see what's working for <em>you</em> — your top content, what to post next, and where to focus.</p>
                </div>
              </div>
              <button
                onClick={() => router.push("/onboarding")}
                className="w-full py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium rounded-lg transition-colors text-sm"
              >
                Set up my account →
              </button>
            </div>

            {/* TERTIARY: Other no-account tools */}
            <div>
              <p className="text-xs text-gray-600 mb-2 text-center">Other tools — no account needed</p>
              <div className="flex gap-2 justify-center flex-wrap">
                {[
                  { key: "competitors" as TabType, icon: <FiSearch className="w-3.5 h-3.5" />, label: "Competitor Analysis" },
                  { key: "validator" as TabType, icon: <FiMessageSquare className="w-3.5 h-3.5" />, label: "Pre-Post Checker" },
                  { key: "shield" as TabType, icon: <FiShield className="w-3.5 h-3.5" />, label: "Reputation Shield" },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setTab(item.key)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900/50 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 rounded-lg text-xs text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // No data at all (e.g. data.json missing) — catch-all for non-setup tabs
  if (!data && tab !== "setup") {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400 mb-4">No data loaded yet.</p>
            <button onClick={() => setTab("setup")} className="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600">
              Go to Setup
            </button>
          </div>
        </div>
      </div>
    );
  }

  const sortedTones = data ? Object.entries(data.tone_stats).sort(
    (a, b) => b[1].avg - a[1].avg
  ) : [];
  const sortedTopics = data ? Object.entries(data.topic_stats).sort(
    (a, b) => b[1].avg - a[1].avg
  ) : [];
  const sortedSubs = data ? Object.entries(data.sub_stats).sort(
    (a, b) => b[1].avg - a[1].avg
  ) : [];

  const maxToneAvg = sortedTones[0]?.[1].avg || 1;
  const maxTopicAvg = sortedTopics[0]?.[1].avg || 1;
  const maxSubAvg = sortedSubs[0]?.[1].avg || 1;

  // Filter items
  let filteredItems = data ? [...data.items] : [];
  if (filter && data) {
    if (filter.type === "tone") {
      filteredItems = filteredItems.filter((i) => i.tones.includes(filter.value));
    } else if (filter.type === "topic") {
      filteredItems = filteredItems.filter((i) =>
        i.topics.includes(filter.value)
      );
    } else if (filter.type === "subreddit") {
      filteredItems = filteredItems.filter(
        (i) => i.subreddit === filter.value
      );
    }
  }
  filteredItems.sort((a, b) => b.ups - a.ups);

  // Split into works vs doesn't work
  const works = filteredItems.filter((i) => i.ups >= 3);
  const doesntWork = filteredItems.filter((i) => i.ups < 3);

  // Paginated items
  const paginatedWorks = works.slice((worksPage - 1) * ITEMS_PER_PAGE, worksPage * ITEMS_PER_PAGE);
  const paginatedDoesntWork = doesntWork.slice((doesntWorkPage - 1) * ITEMS_PER_PAGE, doesntWorkPage * ITEMS_PER_PAGE);

  // Why analysis
  const worksTonesCount: Record<string, number> = {};
  const doesntTonesCount: Record<string, number> = {};
  works.forEach((i) =>
    i.tones.forEach((t) => (worksTonesCount[t] = (worksTonesCount[t] || 0) + 1))
  );
  doesntWork.forEach((i) =>
    i.tones.forEach(
      (t) => (doesntTonesCount[t] = (doesntTonesCount[t] || 0) + 1)
    )
  );

  // Validate draft using Claude via Python API
  const validateDraft = async () => {
    if (!draftText.trim()) return;
    setSuggestResult("");
    setParsedSuggestions([]);
    setActiveRefineId(null);
    setValidationShield(null);
    setValidationLoading(true);
    setValidationAnalysis("");
    try {
      const res = await fetch(`${API_BASE}/api/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: draftText, subreddit: draftSub || "general", original_post: originalPost }),
      });
      const data = await res.json();
      setValidationAnalysis(data.analysis);
      if (data.shield) setValidationShield(data.shield);
    } catch (e) {
      setValidationAnalysis("Error: Could not connect to API. Make sure api.py is running on port 8000.");
    }
    setValidationLoading(false);
  };

  // Parse suggestions markdown into individual comments
  const parseSuggestions = (markdown: string): {id: number; text: string}[] => {
    const comments: {id: number; text: string}[] = [];
    // Split by **Comment X:** pattern
    const parts = markdown.split(/\*\*Comment \d+:\*\*/i);
    parts.forEach((part, idx) => {
      if (idx === 0) return; // Skip content before first comment
      const text = part.trim();
      if (text) {
        comments.push({ id: idx, text });
      }
    });
    // If no pattern found, try splitting by numbered list or double newlines
    if (comments.length === 0) {
      const altParts = markdown.split(/\n\n+/).filter(p => p.trim().length > 20);
      altParts.forEach((part, idx) => {
        comments.push({ id: idx + 1, text: part.trim() });
      });
    }
    return comments;
  };

  // Suggest comments using Claude via Python API
  const suggestComments = async () => {
    if (!originalPost.trim() || !draftSub.trim()) return;
    setValidationAnalysis("");
    setValidationResult(null);
    setValidationShield(null);
    setSuggestLoading(true);
    setSuggestResult("");
    setParsedSuggestions([]);
    setActiveRefineId(null);
    try {
      const res = await fetch(`${API_BASE}/api/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_text: originalPost, subreddit: draftSub }),
      });
      const data = await res.json();
      setSuggestResult(data.suggestions);
      // Parse into individual comments
      const parsed = parseSuggestions(data.suggestions);
      setParsedSuggestions(parsed);
    } catch (e) {
      setSuggestResult("Error: Could not connect to API. Make sure api.py is running on port 8000.");
    }
    setSuggestLoading(false);
  };

  // Refine comment using Claude via Python API
  const refineCommentFn = async (updateSuggestionId?: number) => {
    if (!refineComment.trim()) return;
    setRefineLoading(true);
    setRefineResult("");

    // Mark the suggestion as refining if updating inline
    if (updateSuggestionId !== undefined) {
      setParsedSuggestions(prev => prev.map(s =>
        s.id === updateSuggestionId ? { ...s, isRefining: true } : s
      ));
    }

    try {
      const res = await fetch(`${API_BASE}/api/refine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: refineComment,
          feedback: refineFeedback,
          feedback_type: refineFeedbackType,
          subreddit: draftSub
        }),
      });
      const data = await res.json();

      // If we're updating a specific suggestion, update it in place
      if (updateSuggestionId !== undefined) {
        setParsedSuggestions(prev => prev.map(s =>
          s.id === updateSuggestionId ? { ...s, text: data.refined, isRefining: false } : s
        ));
        setRefineComment("");
        setRefineFeedback("");
        setActiveRefineId(null);
      } else {
        setRefineResult(data.refined);
      }
    } catch (e) {
      if (updateSuggestionId !== undefined) {
        setParsedSuggestions(prev => prev.map(s =>
          s.id === updateSuggestionId ? { ...s, isRefining: false } : s
        ));
      }
      setRefineResult("Error: Could not connect to API. Make sure api.py is running on port 8000.");
    }
    setRefineLoading(false);
  };

  // Select a suggestion to refine
  const selectSuggestionToRefine = (id: number, text: string) => {
    setActiveRefineId(id);
    setRefineComment(text);
    setRefineFeedback("");
    setRefineResult("");
    // Scroll to refine section
    document.getElementById("refine-section")?.scrollIntoView({ behavior: "smooth" });
  };

  // Shield: Pre-flight check
  const runShieldCheck = async () => {
    if (!shieldText.trim()) return;
    setShieldLoading(true);
    setShieldResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/shield/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: shieldText, subreddit: shieldSub }),
      });
      const data = await res.json();
      setShieldResult(data);
    } catch {
      setShieldResult(null);
    }
    setShieldLoading(false);
  };

  // Shield: History cleanup
  const runCleanupCheck = async () => {
    setCleanupLoading(true);
    setCleanupResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/shield/cleanup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threshold_ups: 0 }),
      });
      const data = await res.json();
      setCleanupResult(data);
    } catch {
      setCleanupResult(null);
    }
    setCleanupLoading(false);
  };

  // Shield: Find opportunities
  const findOpportunities = async () => {
    if (!opportunitySub.trim()) return;
    setOpportunityLoading(true);
    setOpportunities([]);
    try {
      const res = await fetch(`${API_BASE}/api/shield/opportunities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subreddit: opportunitySub, min_ups: 10, limit: 50 }),
      });
      const data = await res.json();
      setOpportunities(data.opportunities || []);
    } catch {
      setOpportunities([]);
    }
    setOpportunityLoading(false);
  };

  // Insights: Refresh stats
  const refreshInsightsStats = async () => {
    setInsightsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/insights/stats`);
      const data = await res.json();
      setInsightsStats(data);
    } catch {
      setInsightsStats(null);
    }
    setInsightsLoading(false);
  };

  // Insights: Log a removal
  const logRemoval = async () => {
    if (!logRemovalSub.trim() || !logRemovalContent.trim()) return;
    setLogRemovalLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/insights/removal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subreddit: logRemovalSub,
          content: logRemovalContent,
          content_type: logRemovalType,
          reason: logRemovalReason,
          removal_type: logRemovalBy,
        }),
      });
      if (res.ok) {
        // Clear form and refresh stats
        setLogRemovalSub("");
        setLogRemovalContent("");
        setLogRemovalReason("");
        await refreshInsightsStats();
      }
    } catch {
      // Silent fail
    }
    setLogRemovalLoading(false);
  };

  // Insights: Delete a removal
  const deleteRemoval = async (index: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/insights/removal/${index}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await refreshInsightsStats();
      }
    } catch {
      // Silent fail
    }
  };

  // Insights: Import from removed_data.json
  const importRemovalData = async () => {
    setImportLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/insights/import`, {
        method: "POST",
      });
      if (res.ok) {
        await refreshInsightsStats();
        await fetchInsightsAnalysis();
      }
    } catch {
      // Silent fail
    }
    setImportLoading(false);
  };

  // Insights: Fetch deep analysis
  const fetchInsightsAnalysis = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/insights/analysis`);
      const data = await res.json();
      setInsightsAnalysis(data);
    } catch {
      setInsightsAnalysis(null);
    }
  };

  // Fetch and analyze competitor using Claude via Python API
  const fetchCompetitor = async () => {
    if (!competitorSub) return;
    setCompetitorLoading(true);
    setCompetitorAnalysis("");
    try {
      const res = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subreddit: competitorSub, limit: 50 }),
      });
      const data = await res.json();

      const posts: Item[] = data.top_posts.map((p: {title: string; content: string; ups: number}) => ({
        type: "post",
        subreddit: competitorSub,
        title: p.title,
        content: p.content || "",
        ups: p.ups,
        tones: [],
        topics: [],
      }));

      setCompetitorData({ posts, tone_stats: {}, topic_stats: {} });
      setCompetitorAnalysis(data.analysis);
    } catch {
      setCompetitorData(null);
      setCompetitorAnalysis("Error: Could not connect to API. Make sure api.py is running on port 8000.");
    }
    setCompetitorLoading(false);
  };

  const fetchCommunityGuide = async (subredditOverride?: string) => {
    const sub = (subredditOverride ?? guideSub).trim().replace("r/", "").replace("/", "");
    if (!sub) return;
    setGuideLoading(true);
    setGuideResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/community/culture`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subreddit: sub, limit: 50 }),
      });
      const data = await res.json();
      if (res.ok) {
        setGuideResult(data);
        if (!guideSub) setGuideSub(sub);
      } else {
        setGuideResult(null);
      }
    } catch {
      setGuideResult(null);
    }
    setGuideLoading(false);
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-56 bg-gray-900/80 border-r border-gray-800 p-4 flex-shrink-0">
        <div className="mb-6">
          <img src="/myredditbuddy-logo.png" alt="MyRedBuddy" className="h-8 w-auto" />
        </div>
        <nav className="space-y-1">
          {NAV_ITEMS.filter(item => !item.personal || ENABLE_PERSONAL_FEATURES).map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition ${
                tab === item.key
                  ? "bg-orange-500/20 text-orange-400"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        {/* Status Footer */}
        <div className="mt-8 pt-4 border-t border-gray-800">
          {profiles?.active_profile && (
            <div className="flex items-center gap-2 p-2.5 bg-gray-800/50 rounded-lg mb-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
                {profiles.active_profile.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-300 truncate">u/{profiles.active_profile}</p>
                <p className="text-[10px] text-gray-500">
                  {data ? `${data.items.length} items` : "No data"}
                </p>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Active"></div>
            </div>
          )}
          {!profiles?.active_profile && (
            <div className="text-xs text-gray-600 p-2">
              No profile active
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">

      {/* Setup Tab */}
      {tab === "setup" && (
        <div className="space-y-6">
          <Breadcrumb items={[{ label: "Setup" }]} />

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-100">Setup MyRedBuddy</h1>
              <p className="text-gray-500 text-sm mt-1">Import your Reddit data to get started with personalized analytics</p>
            </div>
          </div>

          {/* API Status */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-4">Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`p-4 rounded-lg border ${apiStatus?.has_data ? "bg-emerald-950/30 border-emerald-900/50" : "bg-gray-800/50 border-gray-700"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={apiStatus?.has_data ? "text-emerald-400" : "text-gray-500"}>{apiStatus?.has_data ? "✓" : "○"}</span>
                  <span className="text-gray-300 font-medium">Data Imported</span>
                </div>
                {apiStatus?.has_data && apiStatus.data_stats && (
                  <p className="text-xs text-gray-500 ml-5">{apiStatus.data_stats.posts} posts, {apiStatus.data_stats.comments} comments</p>
                )}
              </div>
              <div className={`p-4 rounded-lg border ${apiStatus?.has_persona ? "bg-emerald-950/30 border-emerald-900/50" : "bg-gray-800/50 border-gray-700"}`}>
                <div className="flex items-center gap-2">
                  <span className={apiStatus?.has_persona ? "text-emerald-400" : "text-gray-500"}>{apiStatus?.has_persona ? "✓" : "○"}</span>
                  <span className="text-gray-300 font-medium">Persona Configured</span>
                </div>
              </div>
              <div className={`p-4 rounded-lg border ${apiStatus ? "bg-emerald-950/30 border-emerald-900/50" : "bg-red-950/30 border-red-900/50"}`}>
                <div className="flex items-center gap-2">
                  <span className={apiStatus ? "text-emerald-400" : "text-red-400"}>{apiStatus ? "✓" : "✗"}</span>
                  <span className="text-gray-300 font-medium">API Connected</span>
                </div>
                {!apiStatus && <p className="text-xs text-red-400 ml-5">Run: python api.py</p>}
              </div>
              {/* AI Mode Status */}
              <div className={`p-4 rounded-lg border ${apiStatus?.ai_mode === "api" ? "bg-purple-950/30 border-purple-900/50" : "bg-blue-950/30 border-blue-900/50"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={apiStatus?.ai_mode === "api" ? "text-purple-400" : "text-blue-400"}>
                    {apiStatus?.ai_mode === "api" ? <FiZap className="w-4 h-4" /> : <FiTerminal className="w-4 h-4" />}
                  </span>
                  <span className="text-gray-300 font-medium">AI Mode</span>
                </div>
                <p className="text-xs text-gray-500 ml-6">
                  {apiStatus?.ai_mode === "api" ? (
                    <span className="text-purple-400">API ({apiStatus?.ai_model})</span>
                  ) : apiStatus?.ai_mode === "cli" ? (
                    <span className="text-blue-400">CLI (Claude Code)</span>
                  ) : (
                    "Not connected"
                  )}
                </p>
              </div>
            </div>

            {/* AI Mode Info Banner */}
            {apiStatus && apiStatus.ai_mode === "cli" && (
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-blue-400">
                  <FiInfo className="w-3.5 h-3.5 inline mr-1" />
                  <strong>CLI Mode:</strong> Using Claude Code CLI for AI features. For production use, set <code className="bg-blue-500/20 px-1 rounded">ANTHROPIC_API_KEY</code> in your .env file.
                </p>
              </div>
            )}
            {apiStatus && apiStatus.ai_mode === "api" && (
              <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <p className="text-xs text-purple-400">
                  <FiCheckCircle className="w-3.5 h-3.5 inline mr-1" />
                  <strong>API Mode:</strong> Using Anthropic API with {apiStatus.ai_model}. Recommended for production.
                </p>
              </div>
            )}
          </div>

          {/* Profile Management */}
          {profiles && profiles.profiles && profiles.profiles.length > 0 && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-300 flex items-center gap-2">
                    <FiUser className="w-5 h-5" />
                    Your Profiles
                  </h3>
                  <p className="text-sm text-gray-500">Switch between Reddit accounts you&apos;ve imported</p>
                </div>
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                  {profiles.total_profiles} profile{profiles.total_profiles !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="space-y-2">
                {profiles.profiles.map((profile) => (
                  <div
                    key={profile.username}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      profile.is_active
                        ? "bg-orange-500/10 border-orange-500/30"
                        : "bg-gray-800/30 border-gray-700 hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${profile.is_active ? "bg-orange-500" : "bg-gray-600"}`} />
                      <div>
                        <span className="text-gray-200 font-medium">u/{profile.username}</span>
                        {profile.is_active && (
                          <span className="ml-2 text-xs text-orange-400">(Active)</span>
                        )}
                        <p className="text-xs text-gray-500">
                          {profile.stats.posts} posts, {profile.stats.comments} comments
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!profile.is_active && (
                        <button
                          onClick={() => switchProfile(profile.username)}
                          disabled={profilesLoading}
                          className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
                        >
                          Switch
                        </button>
                      )}
                      {profile.is_active && (
                        <button
                          onClick={refreshProfileData}
                          disabled={refreshLoading}
                          className="px-3 py-1 text-xs bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 flex items-center gap-1"
                          title="Refresh data from Reddit"
                        >
                          <FiRefreshCw className={`w-3.5 h-3.5 ${refreshLoading ? "animate-spin" : ""}`} />
                          {refreshLoading ? "Refreshing..." : "Refresh"}
                        </button>
                      )}
                      <a
                        href={`https://www.reveddit.com/y/${profile.username}/?all=true`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 text-xs bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 flex items-center gap-1"
                        title="View removed content on Reveddit"
                      >
                        <FiExternalLink className="w-3.5 h-3.5" />
                        Reveddit
                      </a>
                      <button
                        onClick={() => exportProfile(profile.username)}
                        className="px-3 py-1 text-xs bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30"
                        title="Export/Backup"
                      >
                        <FiDatabase className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteProfile(profile.username)}
                        className="px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                        title="Remove from list"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Data Location */}
              <div className="mt-4 p-3 bg-gray-800/30 rounded-lg">
                <p className="text-xs text-gray-400">
                  <FiInfo className="w-3.5 h-3.5 inline mr-1" />
                  Your data is stored locally at: <code className="text-blue-400">{profiles.data_location}</code>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Back up this folder to preserve all your profiles and data.
                </p>
              </div>
            </div>
          )}

          {/* Export Modal */}
          {showExportData && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-auto">
                <h3 className="text-lg font-semibold text-gray-200 mb-2">
                  Export Profile: {showExportData.username}
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Download this backup file to save all your data. You can import it later if needed.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={downloadExport}
                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600"
                  >
                    Download Backup
                  </button>
                  <button
                    onClick={() => setShowExportData(null)}
                    className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Import by Username */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Import My Data</h3>
            <p className="text-sm text-gray-500 mb-4">Fetch your public posts and comments from Reddit. No login required.</p>

            {/* Disclaimer */}
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-xs text-amber-400">
                <FiAlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                <strong>Self-Analysis Only:</strong> This tool is designed to analyze your own Reddit activity.
                Please only import data from accounts you own.
              </p>
            </div>

            <div className="flex gap-3 mb-4">
              <div className="flex-1 max-w-md">
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-700 bg-gray-800 text-gray-400 text-sm">u/</span>
                  <input
                    type="text"
                    value={importUsername}
                    onChange={(e) => setImportUsername(e.target.value)}
                    placeholder="your_username"
                    className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-r-lg text-gray-200 focus:outline-none focus:border-orange-500"
                    onKeyDown={(e) => e.key === "Enter" && confirmOwnAccount && importData()}
                  />
                </div>
              </div>
              <button
                onClick={importData}
                disabled={importLoading || !importUsername.trim() || !confirmOwnAccount}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50"
              >
                {importLoading ? <Spinner className="w-4 h-4" /> : "Import Data"}
              </button>
            </div>

            {/* Confirmation checkbox */}
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmOwnAccount}
                onChange={(e) => setConfirmOwnAccount(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-orange-500 focus:ring-orange-500 focus:ring-offset-gray-900"
              />
              <span className="text-sm text-gray-400">I confirm this is my own Reddit account</span>
            </label>

            {importResult && (
              <div className={`p-4 rounded-lg ${importResult.success ? "bg-emerald-950/30 border border-emerald-900/50" : "bg-red-950/30 border border-red-900/50"}`}>
                <p className={importResult.success ? "text-emerald-400" : "text-red-400"}>{importResult.message}</p>
                {importResult.success && (
                  <button onClick={() => setTab("dashboard")} className="mt-2 text-sm text-orange-400 hover:underline">
                    Go to Dashboard →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Alternative Methods */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-4">Alternative Import Methods</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-800/30 rounded-lg">
                <h4 className="text-gray-200 font-medium mb-2">GDPR Export (Complete History)</h4>
                <p className="text-xs text-gray-500 mb-2">Get ALL your data from Reddit&apos;s official export.</p>
                <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
                  <li>Go to reddit.com/settings/data-request</li>
                  <li>Request your data (takes 24-48 hours)</li>
                  <li>Download and convert to JSON</li>
                  <li>Use the paste endpoint</li>
                </ol>
              </div>
              <div className="p-4 bg-gray-800/30 rounded-lg">
                <h4 className="text-gray-200 font-medium mb-2">Paste JSON (Manual)</h4>
                <p className="text-xs text-gray-500 mb-2">Already have your data? Paste it directly.</p>
                <p className="text-xs text-gray-400">Use the API endpoint:</p>
                <code className="text-xs text-orange-400 block mt-1">POST /api/import/paste</code>
              </div>
            </div>
          </div>

          {/* Persona & Goals */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-300">Persona & Goals</h3>
              <p className="text-sm text-gray-500 mt-1">Tell MyRedBuddy about yourself so recommendations and validation are tailored to you — not generic advice.</p>
            </div>

            {/* Goal */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">What's your main goal on Reddit?</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { value: "share_expertise", label: "Share expertise & help others", desc: "Answer questions, contribute knowledge" },
                  { value: "build_authority", label: "Build authority in my niche", desc: "Establish credibility over time" },
                  { value: "promote_work", label: "Promote my work authentically", desc: "Drive awareness without spamming" },
                  { value: "explore", label: "Just explore and contribute", desc: "No specific agenda, see what works" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSetupGoal(opt.value)}
                    className={`text-left px-4 py-3 rounded-xl border transition-all ${
                      setupGoal === opt.value
                        ? "bg-orange-500/15 border-orange-500/50 text-gray-100"
                        : "bg-gray-800/40 border-gray-700 text-gray-300 hover:border-gray-600"
                    }`}
                  >
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* About you */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-xs text-gray-400 mb-1.5">Your name or handle</label>
                <input
                  type="text"
                  value={setupName}
                  onChange={(e) => setSetupName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-600 focus:outline-none focus:border-orange-500 text-sm"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs text-gray-400 mb-1.5">Current role or background</label>
                <input
                  type="text"
                  value={setupRole}
                  onChange={(e) => setSetupRole(e.target.value)}
                  placeholder="e.g. Senior Engineer, Indie founder"
                  className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-600 focus:outline-none focus:border-orange-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Years of experience</label>
                <select
                  value={setupYears}
                  onChange={(e) => setSetupYears(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-100 focus:outline-none focus:border-orange-500 text-sm"
                >
                  {[1, 2, 3, 5, 7, 10, 15, 20].map((y) => (
                    <option key={y} value={y}>{y}+ years</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Expertise tags */}
            <div>
              <label className="block text-xs text-gray-400 mb-2">
                What are you an expert in? <span className="text-gray-600">(press Enter or comma to add)</span>
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {setupExpertise.map((tag, i) => (
                  <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-xs">
                    {tag}
                    <button onClick={() => setSetupExpertise(setupExpertise.filter((_, idx) => idx !== i))} className="hover:text-white ml-0.5">×</button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={setupExpertiseInput}
                onChange={(e) => setSetupExpertiseInput(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === ",") && setupExpertiseInput.trim()) {
                    e.preventDefault();
                    const val = setupExpertiseInput.trim().replace(/,$/, "");
                    if (val && !setupExpertise.includes(val)) setSetupExpertise([...setupExpertise, val]);
                    setSetupExpertiseInput("");
                  }
                }}
                placeholder="e.g. TypeScript, SEO, finance..."
                className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-600 focus:outline-none focus:border-orange-500 text-sm"
              />
            </div>

            {/* Target subreddits */}
            <div>
              <label className="block text-xs text-gray-400 mb-2">
                Target subreddits <span className="text-gray-600">(where you want to contribute — press Enter or comma to add)</span>
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {setupSubs.map((sub, i) => (
                  <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs">
                    r/{sub}
                    <button onClick={() => setSetupSubs(setupSubs.filter((_, idx) => idx !== i))} className="hover:text-white ml-0.5">×</button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={setupSubInput}
                onChange={(e) => setSetupSubInput(e.target.value.replace(/^r\//, ""))}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === ",") && setupSubInput.trim()) {
                    e.preventDefault();
                    const val = setupSubInput.trim().replace(/^r\//, "").replace(/,$/, "");
                    if (val && !setupSubs.includes(val)) setSetupSubs([...setupSubs, val]);
                    setSetupSubInput("");
                  }
                }}
                placeholder="e.g. webdev, startups, personalfinance..."
                className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-600 focus:outline-none focus:border-orange-500 text-sm"
              />
            </div>

            {/* Save */}
            <div className="flex items-center gap-3 pt-2 border-t border-gray-800">
              <button
                onClick={saveSetupPersona}
                disabled={setupSaving}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm flex items-center gap-2"
              >
                {setupSaving ? <><FiRefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : "Save changes"}
              </button>
              {setupSaved && (
                <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                  <FiCheckCircle className="w-4 h-4" /> Saved
                </span>
              )}
            </div>
          </div>

          {/* Subreddit Rules Guide */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-300">Subreddit Rules Guide</h3>
                <p className="text-sm text-gray-500">Rules are used during validation and suggestion to match subreddit culture</p>
              </div>
              {subredditRules && subredditRules.subreddits && (
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">
                  {subredditRules.subreddits.length} subreddits configured
                </span>
              )}
            </div>

            {subredditRules && subredditRules.subreddits && subredditRules.subreddits.length > 0 ? (
              <div className="space-y-4">
                {/* Subreddit selector */}
                <div className="flex flex-wrap gap-2">
                  {subredditRules.subreddits.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => setSelectedRuleSub(selectedRuleSub === sub ? "" : sub)}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                        selectedRuleSub === sub
                          ? "bg-purple-500/20 border-purple-500/50 text-purple-400"
                          : "bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600"
                      }`}
                    >
                      r/{sub}
                    </button>
                  ))}
                </div>

                {/* Selected subreddit rules */}
                {selectedRuleSub && subredditRules.rules[selectedRuleSub] && (
                  <div className="bg-gray-800/30 rounded-xl p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-purple-400">{subredditRules.rules[selectedRuleSub].name}</span>
                      <span className="text-xs text-gray-500">|</span>
                      <span className="text-xs text-gray-400">{subredditRules.rules[selectedRuleSub].typical_audience}</span>
                    </div>

                    <p className="text-sm text-gray-300">{subredditRules.rules[selectedRuleSub].focus}</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Rules */}
                      <div className="bg-gray-900/50 rounded-lg p-3">
                        <h4 className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                          Rules
                        </h4>
                        <ul className="text-xs text-gray-400 space-y-1">
                          {subredditRules.rules[selectedRuleSub].rules?.slice(0, 4).map((rule, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-red-400/60">•</span>
                              {rule}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* What Works */}
                      <div className="bg-gray-900/50 rounded-lg p-3">
                        <h4 className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1">
                          <FiCheckCircle className="w-3.5 h-3.5" />
                          What Works
                        </h4>
                        <ul className="text-xs text-gray-400 space-y-1">
                          {subredditRules.rules[selectedRuleSub].what_works?.slice(0, 4).map((item, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-emerald-400/60">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* What Fails */}
                      <div className="bg-gray-900/50 rounded-lg p-3">
                        <h4 className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1">
                          <FiAlertCircle className="w-3.5 h-3.5" />
                          What Fails
                        </h4>
                        <ul className="text-xs text-gray-400 space-y-1">
                          {subredditRules.rules[selectedRuleSub].what_fails?.slice(0, 4).map((item, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-amber-400/60">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-2 border-t border-gray-700">
                      <span className="text-xs text-gray-500">Tone:</span>
                      <span className="text-xs text-blue-400">{subredditRules.rules[selectedRuleSub].tone}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm">No subreddit rules loaded</p>
                <p className="text-gray-600 text-xs mt-1">Make sure API is running and subreddit_rules.json exists</p>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-500">
                Add more subreddits by editing <code className="text-orange-400">subreddit_rules.json</code> or use <code className="text-orange-400">POST /api/rules</code>
              </p>
            </div>
          </div>

          {/* Quick Start Guide */}
          <div className="bg-gradient-to-br from-orange-500/10 to-purple-500/10 border border-orange-500/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <HiOutlineLightBulb className="w-5 h-5 text-orange-400" />
              Quick Start Guide
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Getting Started */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-orange-400">Getting Started</h4>
                <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
                  <li>Import your Reddit data above</li>
                  <li>View your analytics in <button onClick={() => setTab("dashboard")} className="text-blue-400 hover:underline">Dashboard</button></li>
                  <li>Get AI recommendations in <button onClick={() => setTab("recommendations")} className="text-blue-400 hover:underline">Recommendations</button></li>
                  <li>Check content before posting in <button onClick={() => setTab("shield")} className="text-blue-400 hover:underline">Shield</button></li>
                </ol>
              </div>

              {/* Multiple Accounts */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-purple-400">Multiple Accounts</h4>
                <ul className="text-sm text-gray-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">1.</span>
                    <span>Import first account - profile auto-created</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">2.</span>
                    <span>Import second account - new profile created</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">3.</span>
                    <span>Switch between profiles anytime above</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">4.</span>
                    <span>Each profile has isolated data</span>
                  </li>
                </ul>
              </div>

              {/* Key Features */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-emerald-400">Key Features</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li><strong className="text-gray-300">Dashboard:</strong> See what works & what doesn&apos;t</li>
                  <li><strong className="text-gray-300">Recommendations:</strong> AI-powered post ideas</li>
                  <li><strong className="text-gray-300">Competitor Analysis:</strong> Research any subreddit</li>
                  <li><strong className="text-gray-300">Shield:</strong> Pre-flight check before posting</li>
                  <li><strong className="text-gray-300">Removal Insights:</strong> Track & learn from removals</li>
                </ul>
              </div>

              {/* Data Safety */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-blue-400">Data Safety</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li><FiCheckCircle className="w-3.5 h-3.5 inline mr-1 text-emerald-400" /> All data stored locally on your machine</li>
                  <li><FiCheckCircle className="w-3.5 h-3.5 inline mr-1 text-emerald-400" /> Export/backup profiles anytime</li>
                  <li><FiCheckCircle className="w-3.5 h-3.5 inline mr-1 text-emerald-400" /> No data sent to external servers</li>
                  <li><FiCheckCircle className="w-3.5 h-3.5 inline mr-1 text-emerald-400" /> Delete profiles without losing files</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-700/50 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Full documentation available in <code className="text-orange-400">GUIDE.md</code>
              </p>
              <a
                href="https://github.com/AvinashDalvi89/myredbuddy-tool"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:underline flex items-center gap-1"
              >
                <FiExternalLink className="w-3 h-3" />
                GitHub
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Tab */}
      {tab === "recommendations" && (
        <div className="space-y-6">
          <Breadcrumb items={[{ label: "Recommendations" }]} />

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-100">AI Recommendations</h1>
              <p className="text-gray-500 text-sm mt-1">Personalized suggestions based on your Reddit performance data</p>
            </div>
            {/* Header refresh controls — only shown when recs are already loaded */}
            {recs && (
              <div className="flex items-center gap-2">
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-700 bg-gray-800 text-gray-500 text-sm">r/</span>
                  <input
                    type="text"
                    value={recsFocusSub}
                    onChange={(e) => setRecsFocusSub(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && refreshRecommendations(recsFocusSub || undefined)}
                    placeholder="optional: focus subreddit"
                    className="w-44 px-3 py-2 bg-gray-800 border border-gray-700 rounded-r-lg text-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <button
                  onClick={() => refreshRecommendations(recsFocusSub || undefined)}
                  disabled={recsLoading}
                  className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {recsLoading ? (
                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <FiRefreshCw className="w-4 h-4" />
                  )}
                  {recsLoading ? "Generating..." : "Refresh"}
                </button>
              </div>
            )}
          </div>

          {!recs ? (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 max-w-lg mx-auto">
              <HiOutlineLightBulb className="w-10 h-10 text-orange-400/60 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-100 text-center mb-1">Get AI recommendations</h3>
              <p className="text-gray-500 text-sm text-center mb-6">Based on your Reddit performance data. Optionally focus on a specific subreddit for targeted advice.</p>

              <div className="flex gap-2 mb-4">
                <div className="flex flex-1">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-700 bg-gray-800 text-gray-500 text-sm">r/</span>
                  <input
                    type="text"
                    value={recsFocusSub}
                    onChange={(e) => setRecsFocusSub(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && refreshRecommendations(recsFocusSub || undefined)}
                    placeholder="optional: focus subreddit"
                    className="flex-1 px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-r-lg text-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:border-orange-500"
                    autoFocus
                  />
                </div>
                <button
                  onClick={() => refreshRecommendations(recsFocusSub || undefined)}
                  disabled={recsLoading}
                  className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm flex items-center gap-2"
                >
                  {recsLoading ? <><FiRefreshCw className="w-4 h-4 animate-spin" /> Generating...</> : "Generate"}
                </button>
              </div>

              {/* Disclaimer */}
              <div className="flex items-start gap-2.5 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <FiInfo className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-300/80 leading-relaxed">
                  <span className="font-medium text-blue-300">Works best with real contribution history.</span>{" "}
                  Without a subreddit focus, recommendations cover all your top communities.
                  Add a subreddit to get targeted advice for that community specifically.
                </p>
              </div>
            </div>
          ) : (
            <>

          {/* Post Ideas */}
          <div>
            <h2 className="text-lg font-semibold text-orange-400 mb-4 flex items-center gap-2">
              <HiOutlineLightBulb className="w-5 h-5" />
              Post Ideas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recs.post_ideas.map((idea, idx) => (
                <div
                  key={idx}
                  className="bg-gray-900/50 border border-gray-800 rounded-xl p-5"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded">
                      r/{idea.subreddit}
                    </span>
                    <div className="text-right">
                      <span className="text-emerald-400 font-bold text-sm">
                        ~{idea.predicted_ups} ups
                      </span>
                      <span
                        className={`ml-2 text-xs px-2 py-0.5 rounded ${
                          idea.confidence === "high"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {idea.confidence}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-gray-200 font-medium mb-2">
                    {idea.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {idea.why}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Comment Strategies */}
          <div>
            <h2 className="text-xl font-semibold text-blue-400 mb-4">
              Comment Strategies That Work
            </h2>
            <div className="space-y-4">
              {recs.comment_strategies.map((strat, idx) => (
                <div
                  key={idx}
                  className="bg-gray-900/50 border border-gray-800 rounded-xl p-5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-gray-200 font-medium">
                      {strat.strategy}
                    </h3>
                    <span className="text-emerald-400 font-bold text-sm flex-shrink-0 ml-3">
                      {strat.predicted_impact}
                    </span>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3 mb-3 text-sm text-gray-400 italic">
                    &ldquo;{strat.example_from_data}&rdquo;
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-500">When to use:</span>
                      <p className="text-gray-300 mt-0.5">
                        {strat.when_to_use}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Key ingredients:</span>
                      <p className="text-gray-300 mt-0.5">
                        {strat.key_ingredients}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subreddit Playbook */}
          <div>
            <h2 className="text-xl font-semibold text-purple-400 mb-4">
              Subreddit Playbook
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recs.subreddit_playbook.map((sub, idx) => (
                <div
                  key={idx}
                  className="bg-gray-900/50 border border-gray-800 rounded-xl p-5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-gray-200 font-medium">
                      r/{sub.subreddit}
                    </h3>
                    <span
                      className={`text-sm font-bold ${
                        parseInt(sub.hit_rate) >= 50
                          ? "text-emerald-400"
                          : parseInt(sub.hit_rate) >= 25
                          ? "text-amber-400"
                          : "text-red-400"
                      }`}
                    >
                      {sub.hit_rate} hit rate
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    avg {sub.avg_ups} ups &middot; {sub.recommended_frequency}
                  </p>
                  <p className="text-sm text-gray-300 mb-3">
                    {sub.winning_formula}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {sub.ideal_tone.map((t) => (
                      <Tag key={t} label={t} type="tone" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* What to Avoid */}
          <div>
            <h2 className="text-xl font-semibold text-red-400 mb-4">
              Patterns to Avoid (from your 0-ups data)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recs.avoid.map((a, idx) => (
                <div
                  key={idx}
                  className="bg-red-950/20 border border-red-900/30 rounded-xl p-5"
                >
                  <h3 className="text-red-400 font-medium mb-2">
                    {a.pattern}
                  </h3>
                  <div className="bg-gray-900/50 rounded-lg p-3 mb-3 text-sm text-gray-500 italic">
                    &ldquo;{a.example_from_data}&rdquo;
                  </div>
                  <p className="text-xs text-red-400/70 mb-2">
                    {a.why_fails}
                  </p>
                  <p className="text-xs text-emerald-400/70">
                    Fix: {a.fix}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Pattern Insight */}
          {recs.patterns_summary && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-amber-400 mb-3">
              Key Insight from Data
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed">
              {recs.patterns_summary.insight}
            </p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {recs.patterns_summary.high_performing_comment_profile && (
              <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-lg p-3">
                <div className="text-xs text-emerald-400 font-medium mb-1">
                  High performers (3+ ups)
                </div>
                <div className="text-xs text-gray-400 space-y-0.5">
                  <p>
                    {recs.patterns_summary.high_performing_comment_profile.avg_words} avg words
                    &middot; {recs.patterns_summary.high_performing_comment_profile.avg_sentences} avg sentences
                  </p>
                  <p>
                    {recs.patterns_summary.high_performing_comment_profile.pct_personal}% personal
                    &middot; {recs.patterns_summary.high_performing_comment_profile.pct_contrast}% use contrast
                  </p>
                </div>
              </div>
              )}
              {recs.patterns_summary.low_performing_comment_profile && (
              <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-3">
                <div className="text-xs text-red-400 font-medium mb-1">
                  Low performers (0-1 ups)
                </div>
                <div className="text-xs text-gray-400 space-y-0.5">
                  <p>
                    {recs.patterns_summary.low_performing_comment_profile.avg_words} avg words
                    &middot; {recs.patterns_summary.low_performing_comment_profile.avg_sentences} avg sentences
                  </p>
                  <p>
                    {recs.patterns_summary.low_performing_comment_profile.pct_personal}% personal
                    &middot; {recs.patterns_summary.low_performing_comment_profile.pct_contrast}% use contrast
                  </p>
                </div>
              </div>
              )}
            </div>
          </div>
          )}
          </>
          )}
        </div>
      )}

      {/* Dashboard Tab */}
      {tab === "dashboard" && data && <>
        {/* Breadcrumb */}
        <Breadcrumb items={[
          { label: "Dashboard", onClick: () => setDashboardSubTab("overview") },
          { label: DASHBOARD_SUB_TABS.find(t => t.key === dashboardSubTab)?.label || "Overview" }
        ]} />

        {/* Dashboard Header with Sub-tabs */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Performance Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Analyze what works and optimize your Reddit engagement</p>
          </div>

          {/* Sub-tab Navigation */}
          <div className="flex items-center gap-1 p-1 bg-gray-900/80 border border-gray-800 rounded-xl">
            {DASHBOARD_SUB_TABS.map((subTab) => (
              <button
                key={subTab.key}
                onClick={() => setDashboardSubTab(subTab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  dashboardSubTab === subTab.key
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >
                {subTab.icon}
                <span>{subTab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Active filter badge */}
        {filter && (
          <div className="mb-6 flex items-center gap-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl">
            <FiTarget className="w-4 h-4 text-orange-400" />
            <span className="text-gray-300 text-sm">Filtering by</span>
            <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm font-medium">
              {filter.type}: {filter.value.replace(/_/g, " ")}
            </span>
            <button
              onClick={() => { setFilter(null); setWorksPage(1); setDoesntWorkPage(1); }}
              className="ml-auto text-gray-400 hover:text-white text-sm flex items-center gap-1"
            >
              <span>Clear filter</span>
              <span className="text-lg">×</span>
            </button>
          </div>
        )}

        {/* OVERVIEW SUB-TAB */}
        {dashboardSubTab === "overview" && (
          <>
            {/* Hero Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <MetricCard
                title="Total Content"
                value={data.items.length}
                subtitle={`${data.items.filter(i => i.type === 'post').length} posts · ${data.items.filter(i => i.type === 'comment').length} comments`}
                icon={<FiLayers className="w-5 h-5" />}
                color="orange"
                actions={[
                  { label: "Refresh", icon: <FiRefreshCw className="w-3 h-3" />, onClick: () => fetch("/data.json").then((r) => r.json()).then(setData).catch(() => {}) },
                  { label: "View All", icon: <FiChevronRight className="w-3 h-3" />, onClick: () => setDashboardSubTab("performance") }
                ]}
              />
              <MetricCard
                title="High Performers"
                value={data.items.filter(i => i.ups >= 3).length}
                subtitle="Content with 3+ upvotes"
                trend={{ value: Math.round((data.items.filter(i => i.ups >= 3).length / data.items.length) * 100), label: "success rate" }}
                icon={<FiTrendingUp className="w-5 h-5" />}
                color="emerald"
                actions={[
                  { label: "See Patterns", icon: <FiZap className="w-3 h-3" />, onClick: () => setDashboardSubTab("performance") },
                  { label: "Copy Style", icon: <FiEdit3 className="w-3 h-3" />, onClick: () => setTab("validator") }
                ]}
              />
              <MetricCard
                title="Best Tone"
                value={sortedTones[0]?.[0].replace(/_/g, " ") || "N/A"}
                subtitle={`avg ${sortedTones[0]?.[1].avg || 0} upvotes`}
                icon={<FiMessageSquare className="w-5 h-5" />}
                color="blue"
                actions={[
                  { label: "Use This Tone", icon: <FiEdit3 className="w-3 h-3" />, onClick: () => setTab("validator") },
                  { label: "View Examples", icon: <FiSearch className="w-3 h-3" />, onClick: () => { setFilter({ type: "tone", value: sortedTones[0]?.[0] }); setDashboardSubTab("performance"); } }
                ]}
              />
              <MetricCard
                title="Top Subreddit"
                value={sortedSubs[0] ? `r/${sortedSubs[0][0]}` : "N/A"}
                subtitle={`avg ${sortedSubs[0]?.[1].avg || 0} upvotes`}
                icon={<FiTarget className="w-5 h-5" />}
                color="purple"
                actions={[
                  { label: "Find Posts", icon: <FiSearch className="w-3 h-3" />, onClick: () => { setCompetitorSub(sortedSubs[0]?.[0] || ""); setTab("competitors"); } },
                  { label: "View Stats", icon: <FiBarChart2 className="w-3 h-3" />, onClick: () => { setFilter({ type: "subreddit", value: sortedSubs[0]?.[0] }); setDashboardSubTab("performance"); } }
                ]}
              />
            </div>

            {/* Quick Insights Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* What Works Summary */}
              <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <FiThumbsUp className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-emerald-400">What Works</h3>
                    <p className="text-xs text-gray-500">{works.length} high-performing items</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {Object.entries(worksTonesCount)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 4)
                    .map(([tone, count]) => (
                      <div key={tone} className="flex items-center justify-between py-1.5 border-b border-emerald-500/10 last:border-0">
                        <span className="text-sm text-gray-300 capitalize">{tone.replace(/_/g, " ")}</span>
                        <span className="text-sm font-medium text-emerald-400">{count}</span>
                      </div>
                    ))}
                </div>
                <button
                  onClick={() => setDashboardSubTab("performance")}
                  className="mt-4 text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  View all <FiChevronRight className="w-4 h-4" />
                </button>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
              </div>

              {/* What Doesn't Work Summary */}
              <div className="relative overflow-hidden bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <FiThumbsDown className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-400">What Doesn&apos;t Work</h3>
                    <p className="text-xs text-gray-500">{doesntWork.length} low-performing items</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {Object.entries(doesntTonesCount)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 4)
                    .map(([tone, count]) => (
                      <div key={tone} className="flex items-center justify-between py-1.5 border-b border-red-500/10 last:border-0">
                        <span className="text-sm text-gray-300 capitalize">{tone.replace(/_/g, " ")}</span>
                        <span className="text-sm font-medium text-red-400">{count}</span>
                      </div>
                    ))}
                </div>
                <button
                  onClick={() => setDashboardSubTab("performance")}
                  className="mt-4 text-sm text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  View all <FiChevronRight className="w-4 h-4" />
                </button>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-red-500/10 rounded-full blur-2xl" />
              </div>
            </div>

            {/* Pro Tips */}
            <div className="bg-gradient-to-r from-orange-500/10 via-purple-500/10 to-blue-500/10 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <HiOutlineSparkles className="w-5 h-5 text-orange-400" />
                <h3 className="text-lg font-semibold text-gray-200">Quick Insights</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-lg">
                  <div className="p-1.5 bg-emerald-500/20 rounded">
                    <FiCheckCircle className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">Personal stories with specific details get 2-3x more engagement</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-lg">
                  <div className="p-1.5 bg-blue-500/20 rounded">
                    <FiCheckCircle className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">Include numbers and data points to boost credibility</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-lg">
                  <div className="p-1.5 bg-purple-500/20 rounded">
                    <FiCheckCircle className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">Avoid generic agreement - add your unique perspective</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* PERFORMANCE SUB-TAB */}
        {dashboardSubTab === "performance" && (
          <>
            {/* Content Lists Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* What Works */}
              <div className="bg-gray-900/30 border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-800 bg-emerald-500/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FiThumbsUp className="w-5 h-5 text-emerald-400" />
                      <h2 className="text-lg font-semibold text-emerald-400">What Works</h2>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full">
                      {works.length} items
                    </span>
                  </div>
                </div>
                <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                  {paginatedWorks.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 rounded-lg p-4 transition-colors"
                    >
                      <div className="flex gap-3">
                        <ScoreCircle score={item.ups} max={52} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs font-medium text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                              r/{item.subreddit}
                            </span>
                            <span className="text-xs text-gray-600">{item.type}</span>
                          </div>
                          <p className="text-sm text-gray-200 line-clamp-2">
                            {item.title || item.content.slice(0, 150)}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {item.tones.map((t) => (
                              <Tag key={t} label={t} type="tone" />
                            ))}
                            {item.topics.slice(0, 2).map((t) => (
                              <Tag key={t} label={t} type="topic" />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-gray-800 bg-gray-900/50">
                  <Pagination
                    currentPage={worksPage}
                    totalItems={works.length}
                    onPageChange={setWorksPage}
                    color="emerald"
                  />
                </div>
              </div>

              {/* What Doesn't Work */}
              <div className="bg-gray-900/30 border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-800 bg-red-500/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FiThumbsDown className="w-5 h-5 text-red-400" />
                      <h2 className="text-lg font-semibold text-red-400">What Doesn&apos;t Work</h2>
                    </div>
                    <span className="px-2.5 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded-full">
                      {doesntWork.length} items
                    </span>
                  </div>
                </div>
                <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                  {paginatedDoesntWork.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700/30 rounded-lg p-4 transition-colors opacity-80"
                    >
                      <div className="flex gap-3">
                        <ScoreCircle score={item.ups} max={52} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs font-medium text-purple-400/70 bg-purple-500/5 px-2 py-0.5 rounded">
                              r/{item.subreddit}
                            </span>
                            <span className="text-xs text-gray-600">{item.type}</span>
                          </div>
                          <p className="text-sm text-gray-400 line-clamp-2">
                            {item.title || item.content.slice(0, 150)}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {item.tones.map((t) => (
                              <Tag key={t} label={t} type="tone" />
                            ))}
                            {item.topics.slice(0, 2).map((t) => (
                              <Tag key={t} label={t} type="topic" />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-gray-800 bg-gray-900/50">
                  <Pagination
                    currentPage={doesntWorkPage}
                    totalItems={doesntWork.length}
                    onPageChange={setDoesntWorkPage}
                    color="red"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* ANALYTICS SUB-TAB */}
        {dashboardSubTab === "analytics" && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Tone Analytics */}
              <div className="bg-gray-900/30 border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-800">
                  <div className="flex items-center gap-2">
                    <FiMessageSquare className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-lg font-semibold text-gray-200">Tone Performance</h2>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Click to filter content</p>
                </div>
                <div className="p-4 space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar-thin">
                  {sortedTones.map(([tone, stat]) => (
                    <button
                      key={tone}
                      className="w-full text-left hover:bg-gray-800/50 rounded-lg p-1 transition-colors"
                      onClick={() => { setFilter({ type: "tone", value: tone }); setWorksPage(1); setDoesntWorkPage(1); setDashboardSubTab("performance"); }}
                    >
                      <StatBar
                        label={tone}
                        avg={stat.avg}
                        count={stat.count}
                        maxAvg={maxToneAvg}
                        color="bg-emerald-500"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic Analytics */}
              <div className="bg-gray-900/30 border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-800">
                  <div className="flex items-center gap-2">
                    <FiFileText className="w-5 h-5 text-blue-400" />
                    <h2 className="text-lg font-semibold text-gray-200">Topic Performance</h2>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Click to filter content</p>
                </div>
                <div className="p-4 space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar-thin">
                  {sortedTopics.map(([topic, stat]) => (
                    <button
                      key={topic}
                      className="w-full text-left hover:bg-gray-800/50 rounded-lg p-1 transition-colors"
                      onClick={() => { setFilter({ type: "topic", value: topic }); setWorksPage(1); setDoesntWorkPage(1); setDashboardSubTab("performance"); }}
                    >
                      <StatBar
                        label={topic}
                        avg={stat.avg}
                        count={stat.count}
                        maxAvg={maxTopicAvg}
                        color="bg-blue-500"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Subreddit Analytics */}
              <div className="bg-gray-900/30 border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-800">
                  <div className="flex items-center gap-2">
                    <FiTarget className="w-5 h-5 text-purple-400" />
                    <h2 className="text-lg font-semibold text-gray-200">Subreddit Performance</h2>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Click to filter content</p>
                </div>
                <div className="p-4 space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar-thin">
                  {sortedSubs.map(([sub, stat]) => (
                    <button
                      key={sub}
                      className="w-full text-left hover:bg-gray-800/50 rounded-lg p-1 transition-colors"
                      onClick={() => { setFilter({ type: "subreddit", value: sub }); setWorksPage(1); setDoesntWorkPage(1); setDashboardSubTab("performance"); }}
                    >
                      <StatBar
                        label={`r/${sub}`}
                        avg={stat.avg}
                        count={stat.count}
                        maxAvg={maxSubAvg}
                        color="bg-purple-500"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            </>
          )}
      </>}

      {/* Competitors Tab */}
      {tab === "competitors" && (
        <div className="space-y-6">
          <Breadcrumb items={[{ label: "Competitor Analysis" }]} />

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-100">Competitor Analysis</h1>
              <p className="text-gray-500 text-sm mt-1">Research any subreddit to understand what content performs best</p>
            </div>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              placeholder="e.g. ClaudeCode"
              value={competitorSub}
              onChange={(e) => setCompetitorSub(e.target.value)}
              className="flex-1 max-w-xs px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-orange-500"
            />
            <button
              onClick={fetchCompetitor}
              disabled={competitorLoading}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50"
            >
              {competitorLoading ? "Loading..." : "Analyze"}
            </button>
          </div>

          {competitorLoading && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-center">
              <div className="text-orange-400 mb-2">Analyzing with Claude...</div>
              <div className="text-gray-500 text-sm">This may take 30-60 seconds</div>
            </div>
          )}

          {competitorAnalysis && !competitorLoading && (
            <div className="bg-gray-900/50 border border-orange-500/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-orange-400 mb-4">Claude Analysis</h3>
              <div className="prose prose-invert prose-sm max-w-none prose-headings:text-orange-400 prose-strong:text-emerald-400 prose-li:text-gray-300">
                <ReactMarkdown>{competitorAnalysis}</ReactMarkdown>
              </div>
            </div>
          )}

          {competitorData && !competitorLoading && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-300">
                Top {competitorData.posts.length} posts from r/{competitorSub}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {competitorData.posts.slice(0, 10).map((post, idx) => (
                  <div key={idx} className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 flex gap-3">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-emerald-500 flex items-center justify-center font-bold text-emerald-400 text-sm">
                      {post.ups}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-200 font-medium line-clamp-2">{post.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Community Guide Tab */}
      {tab === "guide" && (
        <div className="space-y-6">
          <Breadcrumb items={[{ label: "Community Guide" }]} />

          <div>
            <h1 className="text-2xl font-bold text-gray-100">Community Guide</h1>
            <p className="text-gray-500 text-sm mt-1">Understand any subreddit's culture before you post — no account needed</p>
          </div>

          {/* Subreddit input row */}
          <div className="flex gap-3">
            <div className="flex items-center flex-1 max-w-sm bg-gray-900 border border-gray-700 rounded-lg overflow-hidden focus-within:border-orange-500">
              <span className="pl-3 text-gray-500 text-sm select-none">r/</span>
              <input
                type="text"
                placeholder="subreddit name"
                value={guideSub}
                onChange={(e) => setGuideSub(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") fetchCommunityGuide(); }}
                className="flex-1 px-2 py-2 bg-transparent text-gray-200 focus:outline-none"
              />
            </div>
            <button
              onClick={() => fetchCommunityGuide()}
              disabled={guideLoading || !guideSub.trim()}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {guideLoading ? "Loading..." : "Get Culture Guide"}
            </button>
          </div>

          {/* Loading */}
          {guideLoading && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 text-center">
              <FiRefreshCw className="w-6 h-6 text-orange-400 animate-spin mx-auto mb-3" />
              <p className="text-orange-400 font-medium">Reading r/{guideSub} culture...</p>
              <p className="text-gray-500 text-sm mt-1">This may take 30–60 seconds</p>
            </div>
          )}

          {/* Empty state */}
          {!guideLoading && !guideResult && (
            <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center mx-auto mb-4">
                <FiBook className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-gray-200 font-semibold mb-2">Decode any community</h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
                Enter a subreddit name above to get a cultural briefing — what gets upvoted, unwritten rules, removal risks, and how to make your first post.
              </p>
            </div>
          )}

          {/* Results */}
          {!guideLoading && guideResult && (
            <div className="space-y-4">
              <p className="text-xs text-gray-600">Based on {guideResult.posts_analyzed} top posts from r/{guideResult.subreddit}</p>

              {/* Row 1: Vibe + Karma tip */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Community Vibe */}
                <div className="bg-gray-900/50 border border-purple-500/25 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2">
                    <FiActivity className="w-4 h-4" /> Community Vibe
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {guideResult.vibe.map((v, i) => (
                      <span key={i} className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-medium">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>

                {/* New Account Tip */}
                <div className="bg-gray-900/50 border border-blue-500/25 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
                    <FiInfo className="w-4 h-4" /> New Account Tip
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{guideResult.karma_tip}</p>
                </div>
              </div>

              {/* Row 2: What gets upvoted + Watch out for */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* What Gets Upvoted */}
                <div className="bg-gray-900/50 border border-emerald-500/25 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                    <FiThumbsUp className="w-4 h-4" /> What Gets Upvoted
                  </h3>
                  <ul className="space-y-2">
                    {guideResult.what_gets_upvoted.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="text-emerald-400 mt-0.5 flex-shrink-0">+</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Watch Out For */}
                <div className="bg-gray-900/50 border border-red-500/25 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                    <FiAlertTriangle className="w-4 h-4" /> Watch Out For
                  </h3>
                  <ul className="space-y-2">
                    {guideResult.removal_risks.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="text-red-400 mt-0.5 flex-shrink-0">!</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Row 3: Unwritten Rules (full width) */}
              <div className="bg-gray-900/50 border border-amber-500/25 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
                  <FiHelpCircle className="w-4 h-4" /> Unwritten Rules
                </h3>
                <ul className="space-y-2">
                  {guideResult.unwritten_rules.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="text-amber-400 mt-0.5 flex-shrink-0">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Row 4: How to Start (prominent, full width) */}
              <div className="bg-gradient-to-br from-orange-500/15 to-orange-600/5 border border-orange-500/30 rounded-xl p-6">
                <h3 className="text-base font-semibold text-orange-400 mb-4 flex items-center gap-2">
                  <FiZap className="w-4 h-4" /> How to Start
                </h3>
                <ol className="space-y-3">
                  {guideResult.how_to_start.map((idea, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500/30 text-orange-300 text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-gray-200 text-sm leading-relaxed">{idea}</span>
                    </li>
                  ))}
                </ol>
                <div className="mt-5 pt-4 border-t border-orange-500/20">
                  <p className="text-xs text-gray-500 mb-2">Ready to write your first post?</p>
                  <button
                    onClick={() => setTab("validator")}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <FiCheckCircle className="w-4 h-4" />
                    Check it with Pre-Post Checker →
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* Pre-Post Checker Tab */}
      {tab === "validator" && (
        <div className="space-y-6">
          <Breadcrumb items={[{ label: "Pre-Post Checker" }]} />

          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Pre-Post Checker</h1>
            <p className="text-gray-500 text-sm mt-1">Validate your draft and run a reputation shield check before posting</p>
          </div>

          {/* No-account warning */}
          {!profiles?.active_profile && (
            <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/25 rounded-xl">
              <FiAlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-amber-300 font-medium">Running on assumptions, not your data</p>
                <p className="text-xs text-amber-400/70 mt-0.5">
                  Since you haven't linked an account, validation can't reference your posting history or patterns.
                  Results are based on general subreddit rules only — they may not reflect what actually works for you.
                </p>
              </div>
              <button
                onClick={() => router.push("/onboarding")}
                className="flex-shrink-0 text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors whitespace-nowrap"
              >
                Set up account
              </button>
            </div>
          )}

          {/* Input Form Card */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Original Post (for comments) */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">1</span>
                  Original Post
                  <span className="text-xs text-gray-500 font-normal">(optional - for comment validation)</span>
                </label>
                <textarea
                  value={originalPost}
                  onChange={(e) => setOriginalPost(e.target.value)}
                  placeholder="Paste the Reddit post you want to comment on...&#10;&#10;Leave empty if you're validating a new post instead of a comment."
                  className="w-full h-36 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-200 resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 placeholder:text-gray-600"
                />
              </div>

              {/* Right: Your Draft */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${originalPost.trim() ? "bg-blue-500/20 text-blue-400" : "bg-orange-500/20 text-orange-400"}`}>2</span>
                  Your {originalPost.trim() ? "Comment" : "Post"} Draft
                </label>
                <textarea
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  placeholder={originalPost.trim() ? "Write your comment here..." : "Write your post here..."}
                  className={`w-full h-36 px-4 py-3 bg-gray-800/50 border rounded-xl text-gray-200 resize-none focus:outline-none focus:ring-1 ${originalPost.trim() ? "border-gray-700 focus:border-blue-500 focus:ring-blue-500/20" : "border-gray-700 focus:border-orange-500 focus:ring-orange-500/20"}`}
                />
              </div>
            </div>

            {/* Subreddit and Actions Row */}
            <div className="mt-6 flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px] max-w-xs">
                <label className="block text-sm font-medium text-gray-300 mb-2">Target Subreddit</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-700 bg-gray-800 text-gray-500 text-sm">r/</span>
                  <input
                    type="text"
                    value={draftSub}
                    onChange={(e) => setDraftSub(e.target.value)}
                    placeholder="programming"
                    className="flex-1 px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-r-lg text-gray-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={validateDraft}
                  disabled={validationLoading || !draftText.trim()}
                  className={`px-6 py-2.5 text-white rounded-xl font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all ${originalPost.trim() ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/20" : "bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 shadow-lg shadow-orange-500/20"}`}
                >
                  {validationLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      Analyzing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      Validate {originalPost.trim() ? "Comment" : "Post"}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Results Section */}
          {(validationLoading || validationAnalysis) && (
            <div className="space-y-4">
              {/* Validation Results */}
              {(validationLoading || validationAnalysis) && (
                <div className={`bg-gray-900/50 border rounded-xl overflow-hidden ${validationLoading ? "border-gray-700" : "border-emerald-500/30"}`}>
                  <div className={`px-6 py-3 border-b ${validationLoading ? "bg-gray-800/50 border-gray-700" : "bg-emerald-500/10 border-emerald-500/20"}`}>
                    <h3 className={`font-semibold flex items-center gap-2 ${validationLoading ? "text-gray-400" : "text-emerald-400"}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      Validation Feedback
                    </h3>
                  </div>
                  <div className="p-6">
                    {validationLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <svg className="animate-spin h-8 w-8 text-orange-400 mx-auto mb-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                          <p className="text-gray-400">Analyzing your draft...</p>
                          <p className="text-gray-600 text-sm mt-1">Checking against Reddit framework</p>
                        </div>
                      </div>
                    ) : (
                      <div className="prose prose-invert prose-sm max-w-none prose-headings:text-emerald-400 prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2 prose-strong:text-orange-400 prose-li:text-gray-300 prose-p:text-gray-300 prose-code:text-orange-300 prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded">
                        <ReactMarkdown>{validationAnalysis}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Shield Check Summary (shown after validation completes) */}
              {!validationLoading && validationShield && (
                <div className={`border rounded-xl overflow-hidden ${validationShield.can_post ? "bg-gray-900/50 border-emerald-700/40" : "bg-red-950/20 border-red-700/40"}`}>
                  <div className={`px-6 py-3 border-b flex items-center justify-between ${validationShield.can_post ? "bg-emerald-900/20 border-emerald-700/30" : "bg-red-900/20 border-red-700/30"}`}>
                    <h3 className={`font-semibold flex items-center gap-2 ${validationShield.can_post ? "text-emerald-400" : "text-red-400"}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                      Reputation Shield
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-medium px-3 py-1 rounded-full ${validationShield.can_post ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
                        {validationShield.can_post ? "Safe to post" : "Issues found"}
                      </span>
                      <span className="text-sm text-gray-400">Score: <span className={`font-bold ${validationShield.overall_score >= 70 ? "text-emerald-400" : validationShield.overall_score >= 40 ? "text-yellow-400" : "text-red-400"}`}>{validationShield.overall_score}/100</span></span>
                    </div>
                  </div>
                  <div className="px-6 py-4 space-y-3">
                    <p className="text-sm text-gray-300">{validationShield.summary}</p>
                    {validationShield.issues.length > 0 && (
                      <div className="space-y-1">
                        {validationShield.issues.map((issue, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-red-300">
                            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            <span>{issue.description}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {validationShield.warnings.length > 0 && (
                      <div className="space-y-1">
                        {validationShield.warnings.map((w, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-yellow-300">
                            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                            <span>{w.description}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {validationShield.suggestions.length > 0 && (
                      <div className="pt-1 border-t border-gray-800 space-y-1">
                        {validationShield.suggestions.map((s, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-gray-400">
                            <svg className="w-4 h-4 mt-0.5 shrink-0 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            <span>{s}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Empty State */}
          {!validationLoading && !validationAnalysis && (
            <div className="bg-gray-900/30 border border-dashed border-gray-700 rounded-xl p-12 text-center">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              </div>
              <h3 className="text-gray-400 font-medium mb-2">Ready to validate</h3>
              <p className="text-gray-600 text-sm max-w-md mx-auto">
                Write your draft above and click validate to get AI-powered feedback on your Reddit {originalPost.trim() ? "comment" : "post"}.
              </p>
            </div>
          )}

        </div>
      )}

      {/* Shield Tab */}
      {tab === "shield" && (
        <div className="space-y-6">
          <Breadcrumb items={[{ label: "Reputation Shield" }]} />

          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <FiShield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-100">Reputation Shield</h1>
              <p className="text-gray-500">Protect your Reddit account from bans and mod removals</p>
            </div>
          </div>

          {/* Pre-Flight Check */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <FiCheckCircle className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-300">Pre-Flight Check</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">Scan content for AI patterns, self-promotion, and mod red flags before posting</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <textarea
                  value={shieldText}
                  onChange={(e) => setShieldText(e.target.value)}
                  placeholder="Paste your comment or post here to check..."
                  className="w-full h-32 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-200 resize-none focus:outline-none focus:border-blue-500"
                />
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={shieldSub}
                    onChange={(e) => setShieldSub(e.target.value)}
                    placeholder="Subreddit (optional)"
                    className="flex-1 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={runShieldCheck}
                    disabled={shieldLoading || !shieldText.trim()}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-medium hover:from-blue-500 hover:to-blue-400 disabled:opacity-40"
                  >
                    {shieldLoading ? "Checking..." : "Run Check"}
                  </button>
                </div>
              </div>

              <div>
                {shieldLoading && (
                  <div className="h-full flex items-center justify-center">
                    <Spinner className="h-8 w-8 text-blue-400" />
                  </div>
                )}

                {shieldResult && !shieldLoading && (
                  <div className={`rounded-xl p-4 border ${shieldResult.can_post ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-lg font-bold ${shieldResult.can_post ? "text-emerald-400" : "text-red-400"}`}>
                        {shieldResult.can_post ? "✓ Safe to Post" : "✗ Issues Found"}
                      </span>
                      <span className={`text-2xl font-bold ${shieldResult.overall_score >= 70 ? "text-emerald-400" : shieldResult.overall_score >= 40 ? "text-amber-400" : "text-red-400"}`}>
                        {shieldResult.overall_score}/100
                      </span>
                    </div>

                    <p className="text-sm text-gray-400 mb-3">{shieldResult.summary}</p>

                    {shieldResult.issues && shieldResult.issues.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-xs font-semibold text-red-400 mb-2">Issues (must fix)</h4>
                        <ul className="space-y-1">
                          {shieldResult.issues.map((issue, i) => (
                            <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                              <span className="text-red-400">•</span>
                              {issue.description}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {shieldResult.warnings && shieldResult.warnings.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-xs font-semibold text-amber-400 mb-2">Warnings</h4>
                        <ul className="space-y-1">
                          {shieldResult.warnings.slice(0, 3).map((warning, i) => (
                            <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                              <span className="text-amber-400">•</span>
                              {warning.description}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {shieldResult.suggestions && shieldResult.suggestions.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-xs font-semibold text-blue-400 mb-2">Suggestions</h4>
                        <ul className="space-y-1">
                          {shieldResult.suggestions.map((sug, i) => (
                            <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                              <span className="text-blue-400">→</span>
                              {sug}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {shieldResult.insights_warnings && shieldResult.insights_warnings.length > 0 && (
                      <div className="mb-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3">
                        <h4 className="text-xs font-semibold text-indigo-400 mb-2 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                          Personal Insights
                        </h4>
                        <ul className="space-y-1">
                          {shieldResult.insights_warnings.map((warning, i) => (
                            <li key={i} className="text-xs text-indigo-300 flex items-start gap-2">
                              <span className="text-indigo-400">!</span>
                              {warning.message}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {shieldResult.removal_history && shieldResult.removal_history.checked && (
                      <div className="text-xs text-gray-600 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                        Checked against {shieldResult.removal_history.total_removals} logged removal{shieldResult.removal_history.total_removals !== 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                )}

                {!shieldLoading && !shieldResult && (
                  <div className="h-full flex items-center justify-center border border-dashed border-gray-700 rounded-xl p-6">
                    <p className="text-gray-500 text-sm text-center">Results will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* History Cleanup */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FiClock className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-semibold text-gray-300">History Sanitizer</h3>
              </div>
              <button
                onClick={runCleanupCheck}
                disabled={cleanupLoading}
                className="px-4 py-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-sm font-medium hover:bg-amber-500/30 disabled:opacity-40"
              >
                {cleanupLoading ? "Scanning..." : "Scan History"}
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Find low-performing or risky content in your history that could trigger mod scrutiny</p>

            {cleanupLoading && (
              <div className="flex items-center justify-center py-8">
                <Spinner className="h-8 w-8 text-amber-400" />
              </div>
            )}

            {cleanupResult && !cleanupLoading && (
              <div>
                <div className="flex items-center gap-4 mb-4 p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400 text-sm">Analyzed: {cleanupResult.total_analyzed}</span>
                  <span className={`text-sm ${cleanupResult.risky_count > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                    Risky items: {cleanupResult.risky_count}
                  </span>
                </div>

                {cleanupResult.risky_items && cleanupResult.risky_items.length > 0 ? (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {cleanupResult.risky_items.map((item, i) => (
                      <div key={i} className="bg-gray-800/30 border border-gray-700 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-500">r/{item.subreddit}</span>
                          <span className="text-xs text-gray-600">{item.ups} ups</span>
                        </div>
                        <p className="text-sm text-gray-300 mb-2">{item.content_preview}</p>
                        <div className="flex flex-wrap gap-2">
                          {item.risks.map((risk, j) => (
                            <span key={j} className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                              {risk.type}
                            </span>
                          ))}
                          <span className="text-xs text-amber-400">{item.recommendation}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <FiCheckCircle className="text-emerald-400 w-12 h-12 mx-auto" />
                    <p className="text-gray-400 mt-2">No risky items found!</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Opportunity Finder */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <FiZap className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-gray-300">Opportunity Finder</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">Find highly upvoted questions that need senior-level answers</p>

            <div className="flex gap-3 mb-4">
              <div className="flex flex-1 max-w-xs">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-700 bg-gray-800 text-gray-500 text-sm">r/</span>
                <input
                  type="text"
                  value={opportunitySub}
                  onChange={(e) => setOpportunitySub(e.target.value)}
                  placeholder="ExperiencedDevs"
                  className="flex-1 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-r-lg text-gray-200 focus:outline-none focus:border-purple-500"
                />
              </div>
              <button
                onClick={findOpportunities}
                disabled={opportunityLoading || !opportunitySub.trim()}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-medium hover:from-purple-500 hover:to-purple-400 disabled:opacity-40"
              >
                {opportunityLoading ? "Searching..." : "Find Opportunities"}
              </button>
            </div>

            {opportunityLoading && (
              <div className="flex items-center justify-center py-8">
                <svg className="animate-spin h-8 w-8 text-purple-400" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              </div>
            )}

            {opportunities.length > 0 && !opportunityLoading && (
              <div className="space-y-3">
                {opportunities.map((opp, i) => (
                  <div key={i} className="bg-gray-800/30 border border-purple-500/20 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        opp.question_type === "architecture" ? "bg-purple-500/20 text-purple-400" :
                        opp.question_type === "advice" ? "bg-blue-500/20 text-blue-400" :
                        opp.question_type === "troubleshooting" ? "bg-red-500/20 text-red-400" :
                        "bg-gray-500/20 text-gray-400"
                      }`}>
                        {opp.question_type}
                      </span>
                      <div className="text-right">
                        <span className="text-emerald-400 font-bold">{opp.ups} ups</span>
                        <span className="text-gray-600 mx-1">•</span>
                        <span className="text-gray-500">{opp.num_comments} comments</span>
                      </div>
                    </div>
                    <h4 className="text-gray-200 font-medium mb-2">{opp.title}</h4>
                    <p className="text-xs text-gray-500">{opp.why_opportunity}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-purple-400">Opportunity score: {opp.opportunity_score}</span>
                      {opp.permalink && (
                        <a
                          href={`https://reddit.com${opp.permalink}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:underline"
                        >
                          View post →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ REMOVAL INSIGHTS TAB ============ */}
      {tab === "insights" && (
        <div className="space-y-6">
          <Breadcrumb items={[{ label: "Removal Insights" }]} />

          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Removal Insights
                </h1>
                <p className="text-gray-400 mt-1">Track content removals and learn from patterns to improve future posts</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={importRemovalData}
                  disabled={importLoading}
                  className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors flex items-center gap-2"
                >
                  {importLoading ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                  )}
                  Import Data
                </button>
                <button
                  onClick={refreshInsightsStats}
                  disabled={insightsLoading}
                  className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-lg transition-colors flex items-center gap-2"
                >
                  {insightsLoading ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  )}
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stats Overview */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
                <FiBarChart2 className="w-5 h-5 text-indigo-400" />
                Stats Overview
              </h3>

              {insightsStats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-red-400">{insightsStats.total_removals}</div>
                      <div className="text-sm text-gray-500">Total Removals</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-amber-400">{insightsStats.high_risk_subreddits?.length || 0}</div>
                      <div className="text-sm text-gray-500">High-Risk Subs</div>
                    </div>
                  </div>

                  {insightsStats.by_type && (
                    <div className="flex gap-4">
                      <div className="flex-1 bg-gray-800/30 rounded-lg p-3 text-center">
                        <div className="text-xl font-semibold text-blue-400">{insightsStats.by_type.post || 0}</div>
                        <div className="text-xs text-gray-500">Posts Removed</div>
                      </div>
                      <div className="flex-1 bg-gray-800/30 rounded-lg p-3 text-center">
                        <div className="text-xl font-semibold text-purple-400">{insightsStats.by_type.comment || 0}</div>
                        <div className="text-xs text-gray-500">Comments Removed</div>
                      </div>
                    </div>
                  )}

                  {insightsStats.last_updated && (
                    <p className="text-xs text-gray-600 text-center">Last updated: {insightsStats.last_updated}</p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No removal data yet</p>
                  <p className="text-sm mt-1">Log your first removal to start tracking patterns</p>
                </div>
              )}
            </div>

            {/* High Risk Patterns */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
                <FiAlertTriangle className="w-5 h-5 text-red-400" />
                High Risk Patterns
              </h3>

              {insightsStats && (insightsStats.high_risk_subreddits?.length > 0 || insightsStats.high_risk_topics?.length > 0 || insightsStats.high_risk_tones?.length > 0) ? (
                <div className="space-y-4">
                  {insightsStats.high_risk_subreddits && insightsStats.high_risk_subreddits.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-400 mb-2">High-Risk Subreddits</div>
                      <div className="flex flex-wrap gap-2">
                        {insightsStats.high_risk_subreddits.map((sub, i) => (
                          <span key={i} className="px-2 py-1 bg-red-500/20 text-red-400 text-sm rounded">r/{sub}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {insightsStats.high_risk_topics && insightsStats.high_risk_topics.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-400 mb-2">High-Risk Topics</div>
                      <div className="flex flex-wrap gap-2">
                        {insightsStats.high_risk_topics.map((topic, i) => (
                          <span key={i} className="px-2 py-1 bg-amber-500/20 text-amber-400 text-sm rounded">{topic}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {insightsStats.high_risk_tones && insightsStats.high_risk_tones.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-400 mb-2">High-Risk Tones</div>
                      <div className="flex flex-wrap gap-2">
                        {insightsStats.high_risk_tones.map((tone, i) => (
                          <span key={i} className="px-2 py-1 bg-purple-500/20 text-purple-400 text-sm rounded">{tone}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No high-risk patterns detected yet</p>
                  <p className="text-sm mt-1">Patterns emerge after 2+ removals with similar characteristics</p>
                </div>
              )}
            </div>

            {/* Log a Removal */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
                <FiPlus className="w-5 h-5 text-amber-400" />
                Log a Removal
              </h3>
              <p className="text-sm text-gray-500 mb-4">When your content gets removed, log it here to track patterns</p>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex flex-1">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-700 bg-gray-800 text-gray-500 text-sm">r/</span>
                    <input
                      type="text"
                      value={logRemovalSub}
                      onChange={(e) => setLogRemovalSub(e.target.value)}
                      placeholder="subreddit"
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-r-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <select
                    value={logRemovalType}
                    onChange={(e) => setLogRemovalType(e.target.value)}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="comment">Comment</option>
                    <option value="post">Post</option>
                  </select>
                </div>

                <textarea
                  value={logRemovalContent}
                  onChange={(e) => setLogRemovalContent(e.target.value)}
                  placeholder="Paste the content that was removed..."
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-500 resize-none"
                />

                <div className="flex gap-3">
                  <input
                    type="text"
                    value={logRemovalReason}
                    onChange={(e) => setLogRemovalReason(e.target.value)}
                    placeholder="Removal reason (if known)"
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-500"
                  />
                  <select
                    value={logRemovalBy}
                    onChange={(e) => setLogRemovalBy(e.target.value)}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="mod">By Mod</option>
                    <option value="automod">AutoMod</option>
                    <option value="admin">Admin</option>
                    <option value="self">Self-deleted</option>
                  </select>
                </div>

                <button
                  onClick={logRemoval}
                  disabled={logRemovalLoading || !logRemovalSub.trim() || !logRemovalContent.trim()}
                  className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {logRemovalLoading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                      Logging...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                      Log Removal
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Common Reasons */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
                <FiFileText className="w-5 h-5 text-blue-400" />
                Common Reasons
              </h3>

              {insightsStats && insightsStats.common_reasons && Object.keys(insightsStats.common_reasons).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(insightsStats.common_reasons)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([reason, count], i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-800/30 rounded-lg p-3">
                        <span className="text-gray-300">{reason || "Unknown"}</span>
                        <span className="text-sm text-gray-500">{count as number}x</span>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No common reasons tracked yet</p>
                  <p className="text-sm mt-1">Add removal reasons when logging to see patterns</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Removals */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <FiClock className="w-5 h-5 text-gray-400" />
              Recent Removals
            </h3>

            {insightsStats && insightsStats.recent_removals && insightsStats.recent_removals.length > 0 ? (
              <div className="space-y-3">
                {insightsStats.recent_removals.map((removal, i) => (
                  <div key={i} className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">r/{removal.subreddit}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${removal.content_type === "post" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"}`}>
                          {removal.content_type}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          removal.removal_type === "mod" ? "bg-red-500/20 text-red-400" :
                          removal.removal_type === "automod" ? "bg-amber-500/20 text-amber-400" :
                          removal.removal_type === "admin" ? "bg-pink-500/20 text-pink-400" :
                          "bg-gray-500/20 text-gray-400"
                        }`}>
                          {removal.removal_type}
                        </span>
                      </div>
                      <span className="text-xs text-gray-600">{removal.logged_at}</span>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{removal.content_preview}</p>
                    {removal.reason && (
                      <p className="text-xs text-gray-500">Reason: {removal.reason}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No removals logged yet</p>
                <p className="text-sm mt-1">Start tracking to build your personal risk profile</p>
              </div>
            )}
          </div>

          {/* Deep Analysis */}
          {insightsAnalysis && insightsAnalysis.total_analyzed > 0 && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
                <HiOutlineLightBulb className="w-5 h-5 text-purple-400" />
                Deep Analysis ({insightsAnalysis.total_analyzed} items)
              </h3>

              {/* Actionable Insights */}
              {insightsAnalysis.insights && insightsAnalysis.insights.length > 0 && (
                <div className="mb-6 space-y-3">
                  {insightsAnalysis.insights.map((insight, i) => (
                    <div key={i} className={`p-4 rounded-lg border ${
                      insight.type === "subreddit_warning" ? "bg-red-500/10 border-red-500/20" :
                      insight.type === "length_warning" ? "bg-amber-500/10 border-amber-500/20" :
                      "bg-blue-500/10 border-blue-500/20"
                    }`}>
                      <h4 className={`font-semibold mb-1 ${
                        insight.type === "subreddit_warning" ? "text-red-400" :
                        insight.type === "length_warning" ? "text-amber-400" :
                        "text-blue-400"
                      }`}>{insight.title}</h4>
                      <p className="text-sm text-gray-300 mb-2">{insight.description}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                        {insight.action}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Subreddit Performance */}
              {insightsAnalysis.by_subreddit && Object.keys(insightsAnalysis.by_subreddit).length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-400 mb-3">Performance by Subreddit</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {Object.entries(insightsAnalysis.by_subreddit)
                      .sort(([, a], [, b]) => b.count - a.count)
                      .slice(0, 8)
                      .map(([sub, stats]) => (
                        <div key={sub} className="bg-gray-800/30 rounded-lg p-3">
                          <div className="text-sm text-gray-300 font-medium">r/{sub}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">{stats.count} items</span>
                            <span className={`text-xs ${stats.avg_ups >= 3 ? "text-emerald-400" : stats.avg_ups >= 1 ? "text-amber-400" : "text-red-400"}`}>
                              avg {stats.avg_ups} ups
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Tone Performance */}
              {insightsAnalysis.tone_performance && Object.keys(insightsAnalysis.tone_performance).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-3">Tone Performance</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(insightsAnalysis.tone_performance)
                      .sort(([, a], [, b]) => b.count - a.count)
                      .map(([tone, stats]) => (
                        <span key={tone} className={`px-3 py-1 rounded-full text-xs ${
                          stats.avg_ups >= 3 ? "bg-emerald-500/20 text-emerald-400" :
                          stats.avg_ups >= 1 ? "bg-amber-500/20 text-amber-400" :
                          "bg-red-500/20 text-red-400"
                        }`}>
                          {tone.replace(/_/g, " ")} ({stats.count}x, avg {stats.avg_ups})
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* How to Get Removal Data Guide */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <FiHelpCircle className="w-5 h-5 text-blue-400" />
              How to Find Your Removed Content
            </h3>
            <div className="space-y-4">
              <div className="bg-gray-800/30 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-purple-400 mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-xs">1</span>
                  Auto-Detection (Recommended)
                </h4>
                <p className="text-sm text-gray-400">
                  Use the <strong className="text-green-400">Refresh</strong> button in Setup → Your Profiles.
                  MyRedBuddy compares your saved data with Reddit and auto-detects removed content.
                </p>
              </div>

              <div className="bg-gray-800/30 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-purple-400 mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-xs">2</span>
                  Reveddit
                </h4>
                <p className="text-sm text-gray-400 mb-2">
                  Check your removed content history on Reveddit (uses archived data):
                </p>
                <a
                  href={profiles?.active_profile ? `https://www.reveddit.com/y/${profiles.active_profile}/?all=true` : "https://www.reveddit.com/"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 text-sm"
                >
                  <FiExternalLink className="w-4 h-4" />
                  Open Reveddit {profiles?.active_profile && `for u/${profiles.active_profile}`}
                </a>
              </div>

              <div className="bg-gray-800/30 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-purple-400 mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-xs">3</span>
                  Manual Logging
                </h4>
                <p className="text-sm text-gray-400">
                  When you notice content was removed, copy it from Reveddit or your notifications
                  and use the <strong className="text-amber-400">Log a Removal</strong> form above.
                </p>
              </div>

              <div className="bg-gray-800/30 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-purple-400 mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-xs">4</span>
                  Browser Extension
                </h4>
                <p className="text-sm text-gray-400">
                  Install the{" "}
                  <a
                    href="https://chromewebstore.google.com/detail/reveddit-real-time/ickfhlplfbipnfahjbeongebnmojbnhm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    Reveddit Real-Time extension
                  </a>
                  {" "}to get notified immediately when your content is removed.
                </p>
              </div>
            </div>
          </div>

          {/* Integration Note */}
          <div className="bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-indigo-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <div>
                <p className="text-sm text-gray-300">
                  <strong className="text-indigo-400">Shield Integration:</strong> Your removal patterns are automatically used by the Reputation Shield when checking content.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  If you post to a high-risk subreddit or use high-risk topics/tones, the Shield will warn you.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help & Guide Tab */}
      {tab === "help" && (
        <div className="flex gap-6 h-[calc(100vh-180px)]">
          {/* Fixed Left Sidebar Navigation */}
          <div className="w-56 flex-shrink-0 bg-gray-900/50 border border-gray-800 rounded-xl p-4 h-fit sticky top-0">
            <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <FiBook className="w-4 h-4 text-orange-400" />
              Quick Navigation
            </h3>
            <nav className="space-y-1">
              {[
                { id: "getting-started", label: "Getting Started", icon: <FiZap className="w-4 h-4" />, color: "text-orange-400" },
                { id: "multiple-accounts", label: "Multiple Accounts", icon: <FiUser className="w-4 h-4" />, color: "text-purple-400" },
                { id: "features", label: "Features Guide", icon: <FiBook className="w-4 h-4" />, color: "text-emerald-400" },
                { id: "data-safety", label: "Data Safety", icon: <FiDatabase className="w-4 h-4" />, color: "text-blue-400" },
                { id: "troubleshooting", label: "Troubleshooting", icon: <FiAlertCircle className="w-4 h-4" />, color: "text-red-400" },
                { id: "ethics", label: "Privacy & Ethics", icon: <FiAlertTriangle className="w-4 h-4" />, color: "text-amber-400" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    const element = document.getElementById(`help-${item.id}`);
                    if (element) {
                      element.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }}
                  className="w-full p-2 text-left rounded-lg hover:bg-gray-800/50 transition-colors flex items-center gap-2 group"
                >
                  <span className={`${item.color} group-hover:scale-110 transition-transform`}>{item.icon}</span>
                  <span className="text-sm text-gray-400 group-hover:text-gray-200">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Scrollable Right Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 border-l border-gray-800/50 pl-6 space-y-6">

            {/* Breadcrumb & Header */}
            <div>
              <Breadcrumb items={[{ label: "Help & Guide" }]} />
              <h1 className="text-2xl font-bold text-gray-100">Help & User Guide</h1>
              <p className="text-gray-500 text-sm mt-1">Everything you need to know about using MyRedBuddy</p>
            </div>

          {/* Getting Started */}
          <div id="help-getting-started" className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 scroll-mt-4">
            <h3 className="text-lg font-semibold text-orange-400 mb-4 flex items-center gap-2">
              <FiZap className="w-5 h-5" />
              Getting Started
            </h3>

            <div className="space-y-4">
              <div className="bg-gray-800/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-200 mb-2">1. Start the Services</h4>
                <div className="bg-gray-900 rounded p-3 font-mono text-xs text-gray-400">
                  <p className="text-gray-500"># Terminal 1 - Start API</p>
                  <p className="text-emerald-400">python api.py</p>
                  <p className="text-gray-600 mt-2"># API runs on http://localhost:8000</p>
                  <p className="text-gray-500 mt-3"># Terminal 2 - Start Dashboard</p>
                  <p className="text-emerald-400">cd dashboard && npm run dev</p>
                  <p className="text-gray-600"># Dashboard runs on http://localhost:3000</p>
                </div>
              </div>

              <div className="bg-gray-800/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-200 mb-2">2. Import Your Data</h4>
                <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
                  <li>Go to the <button onClick={() => setTab("setup")} className="text-orange-400 hover:underline">Setup</button> tab</li>
                  <li>Enter your Reddit username</li>
                  <li>Check the confirmation box</li>
                  <li>Click &quot;Import Data&quot;</li>
                </ol>
              </div>

              <div className="bg-gray-800/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-200 mb-2">3. Explore Your Analytics</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <button onClick={() => setTab("dashboard")} className="text-left p-2 rounded bg-gray-900/50 hover:bg-gray-900 text-gray-400">
                    <span className="text-blue-400">Dashboard</span> - View what works vs what doesn&apos;t
                  </button>
                  <button onClick={() => setTab("recommendations")} className="text-left p-2 rounded bg-gray-900/50 hover:bg-gray-900 text-gray-400">
                    <span className="text-purple-400">Recommendations</span> - Get AI-powered suggestions
                  </button>
                  <button onClick={() => setTab("shield")} className="text-left p-2 rounded bg-gray-900/50 hover:bg-gray-900 text-gray-400">
                    <span className="text-emerald-400">Shield</span> - Check content before posting
                  </button>
                  <button onClick={() => setTab("insights")} className="text-left p-2 rounded bg-gray-900/50 hover:bg-gray-900 text-gray-400">
                    <span className="text-red-400">Removal Insights</span> - Track content removals
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Multiple Accounts */}
          <div id="help-multiple-accounts" className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 scroll-mt-4">
            <h3 className="text-lg font-semibold text-purple-400 mb-4 flex items-center gap-2">
              <FiUser className="w-5 h-5" />
              Managing Multiple Reddit Accounts
            </h3>

            <div className="space-y-4">
              <p className="text-sm text-gray-400">
                MyRedBuddy supports analyzing multiple Reddit accounts with completely isolated data for each.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800/30 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-200 mb-3">Adding Accounts</h4>
                  <ol className="text-sm text-gray-400 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs flex-shrink-0">1</span>
                      <span>Import your first account in Setup - a profile is auto-created</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs flex-shrink-0">2</span>
                      <span>Import a second username - another profile is created</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs flex-shrink-0">3</span>
                      <span>Each profile stores its own data separately</span>
                    </li>
                  </ol>
                </div>

                <div className="bg-gray-800/30 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-200 mb-3">Switching Accounts</h4>
                  <ol className="text-sm text-gray-400 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs flex-shrink-0">1</span>
                      <span>Go to the <button onClick={() => setTab("setup")} className="text-orange-400 hover:underline">Setup</button> tab</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs flex-shrink-0">2</span>
                      <span>Find &quot;Your Profiles&quot; section</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs flex-shrink-0">3</span>
                      <span>Click &quot;Switch&quot; on the profile you want</span>
                    </li>
                  </ol>
                </div>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-purple-400 mb-2">Profile Data Storage</h4>
                <div className="font-mono text-xs text-gray-400 bg-gray-900 rounded p-3">
                  <p>/myredbuddy/profiles/</p>
                  <p className="ml-4">├── index.json <span className="text-gray-600"># Active profile & list</span></p>
                  <p className="ml-4">├── username1/</p>
                  <p className="ml-8">├── extracted_data.json</p>
                  <p className="ml-8">├── removal_history.json</p>
                  <p className="ml-8">└── persona.json</p>
                  <p className="ml-4">└── username2/</p>
                  <p className="ml-8">└── ...</p>
                </div>
              </div>
            </div>
          </div>

          {/* Features Guide */}
          <div id="help-features" className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 scroll-mt-4">
            <h3 className="text-lg font-semibold text-emerald-400 mb-4 flex items-center gap-2">
              <FiBook className="w-5 h-5" />
              Features Guide
            </h3>

            <div className="space-y-4">
              {/* Dashboard */}
              <div className="bg-gray-800/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FiBarChart2 className="w-4 h-4 text-blue-400" />
                  <h4 className="text-sm font-medium text-gray-200">Dashboard</h4>
                </div>
                <p className="text-sm text-gray-400 mb-2">Analyze your Reddit performance with detailed statistics.</p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• <strong className="text-gray-400">What Works:</strong> Content with 3+ upvotes - learn from success</li>
                  <li>• <strong className="text-gray-400">What Doesn&apos;t:</strong> Content with 0-2 upvotes - identify patterns to avoid</li>
                  <li>• <strong className="text-gray-400">Stats by Tone/Topic:</strong> See which communication styles perform best</li>
                  <li>• <strong className="text-gray-400">Subreddit Breakdown:</strong> Understand where you succeed</li>
                </ul>
              </div>

              {/* Recommendations */}
              <div className="bg-gray-800/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <HiOutlineLightBulb className="w-4 h-4 text-yellow-400" />
                  <h4 className="text-sm font-medium text-gray-200">Recommendations</h4>
                </div>
                <p className="text-sm text-gray-400 mb-2">AI-powered suggestions based on your historical data.</p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• <strong className="text-gray-400">Post Ideas:</strong> Suggestions for new posts with predicted performance</li>
                  <li>• <strong className="text-gray-400">Comment Strategies:</strong> Approaches that work for you</li>
                  <li>• <strong className="text-gray-400">Patterns to Avoid:</strong> What consistently underperforms</li>
                </ul>
              </div>

              {/* Competitor Analysis */}
              <div className="bg-gray-800/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FiSearch className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-sm font-medium text-gray-200">Competitor Analysis</h4>
                </div>
                <p className="text-sm text-gray-400 mb-2">Research any public subreddit to understand what works there.</p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Enter any subreddit name to analyze top posts</li>
                  <li>• See which tones and topics perform well</li>
                  <li>• Get AI insights for that specific community</li>
                  <li>• Great for researching before posting to a new subreddit</li>
                </ul>
              </div>

              {/* Shield */}
              <div className="bg-gray-800/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FiShield className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-sm font-medium text-gray-200">Reputation Shield</h4>
                </div>
                <p className="text-sm text-gray-400 mb-2">Pre-flight checks to prevent content removal.</p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• <strong className="text-gray-400">Quick Scan:</strong> Check for rule violations and spam patterns</li>
                  <li>• <strong className="text-gray-400">Removal History:</strong> Warns if similar content was removed before</li>
                  <li>• <strong className="text-gray-400">History Cleanup:</strong> Find risky old content that might get reported</li>
                </ul>
              </div>

              {/* Removal Insights */}
              <div className="bg-gray-800/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FiTrendingUp className="w-4 h-4 text-red-400" />
                  <h4 className="text-sm font-medium text-gray-200">Removal Insights</h4>
                </div>
                <p className="text-sm text-gray-400 mb-2">Track content removals and learn from them.</p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Log removals with reason and details</li>
                  <li>• See patterns in high-risk subreddits, topics, tones</li>
                  <li>• Data feeds into Shield for smarter warnings</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Data Safety */}
          <div id="help-data-safety" className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 scroll-mt-4">
            <h3 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
              <FiDatabase className="w-5 h-5" />
              Data Safety & Backups
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-200">Your Data is Safe</h4>
                <ul className="text-sm text-gray-400 space-y-2">
                  <li className="flex items-center gap-2">
                    <FiCheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    All data stored locally on your machine
                  </li>
                  <li className="flex items-center gap-2">
                    <FiCheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    No data sent to external servers
                  </li>
                  <li className="flex items-center gap-2">
                    <FiCheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    You control your data completely
                  </li>
                  <li className="flex items-center gap-2">
                    <FiCheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    Profile deletion preserves files on disk
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-200">Backup Your Data</h4>
                <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
                  <li>Go to Setup → Your Profiles</li>
                  <li>Click the database icon on a profile</li>
                  <li>Click &quot;Download Backup&quot;</li>
                  <li>Save the JSON file somewhere safe</li>
                </ol>
                <p className="text-xs text-gray-500 mt-2">
                  Tip: Back up regularly and before updating the tool.
                </p>
              </div>
            </div>
          </div>

          {/* Troubleshooting */}
          <div id="help-troubleshooting" className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 scroll-mt-4">
            <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
              <FiAlertCircle className="w-5 h-5" />
              Troubleshooting
            </h3>

            <div className="space-y-4">
              <div className="bg-gray-800/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-red-400 mb-2">&quot;Could not connect to API&quot;</h4>
                <p className="text-sm text-gray-400 mb-2">The Python API is not running.</p>
                <div className="bg-gray-900 rounded p-2 font-mono text-xs text-emerald-400">
                  python api.py
                </div>
                <p className="text-xs text-gray-500 mt-2">Make sure it&apos;s running on port 8000.</p>
              </div>

              <div className="bg-gray-800/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-red-400 mb-2">&quot;No data found for u/username&quot;</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Check if the username is spelled correctly</li>
                  <li>• The profile might be set to private</li>
                  <li>• Reddit might be rate limiting - wait a few minutes</li>
                </ul>
              </div>

              <div className="bg-gray-800/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-red-400 mb-2">Dashboard shows &quot;No data loaded&quot;</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Import data first in the Setup tab</li>
                  <li>• Check if you have an active profile selected</li>
                  <li>• Try refreshing the page</li>
                </ul>
              </div>

              <div className="bg-gray-800/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-red-400 mb-2">Next.js build or runtime errors</h4>
                <div className="bg-gray-900 rounded p-2 font-mono text-xs text-emerald-400">
                  cd dashboard && rm -rf .next && npm run dev
                </div>
                <p className="text-xs text-gray-500 mt-2">This clears the cache and restarts the dev server.</p>
              </div>
            </div>
          </div>

          {/* Ethics & Privacy */}
          <div id="help-ethics" className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 scroll-mt-4">
            <h3 className="text-lg font-semibold text-amber-400 mb-4 flex items-center gap-2">
              <FiAlertTriangle className="w-5 h-5" />
              Privacy & Ethics
            </h3>

            <div className="space-y-3 text-sm text-gray-400">
              <p>
                <strong className="text-amber-400">Self-Analysis Only:</strong> This tool is designed to analyze your own Reddit activity.
                While it can technically fetch any public profile, please only analyze accounts you own.
              </p>
              <p>
                <strong className="text-amber-400">No Harassment:</strong> Don&apos;t use this tool to stalk, harass, or target other users.
              </p>
              <p>
                <strong className="text-amber-400">Rate Limits:</strong> Be respectful of Reddit&apos;s API. Don&apos;t import too frequently.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-800">
            <p>
              Full documentation: <code className="text-orange-400">GUIDE.md</code>
            </p>
            <a
              href="https://github.com/AvinashDalvi89/myredbuddy-tool/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline flex items-center gap-1"
            >
              <FiExternalLink className="w-3 h-3" />
              Report Issues
            </a>
          </div>
          </div>
        </div>
      )}

        </div>
      </div>
    </div>
  );
}
