"use client";

import { useState } from "react";
import {
  FiRefreshCw,
  FiShield,
  FiUser,
  FiAward,
  FiCheckCircle,
  FiUpload,
} from "react-icons/fi";

const API_BASE = "http://localhost:8000";

interface AccountResult {
  username: string;
  account_age_days: number;
  total_karma: number;
  user_type: "new" | "experienced" | "recovery";
  recommended_flow: "import_history" | "build_persona" | "shield_first";
  message: string;
}

export default function OnboardingPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);
  const [username, setUsername] = useState("");
  const [accountResult, setAccountResult] = useState<AccountResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [goal, setGoal] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [years, setYears] = useState(1);
  const [expertise, setExpertise] = useState<string[]>([]);
  const [expertiseInput, setExpertiseInput] = useState("");
  const [subs, setSubs] = useState<string[]>([]);
  const [subInput, setSubInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingMessage, setSavingMessage] = useState("Saving your setup...");
  const [hasExistingPersona, setHasExistingPersona] = useState(false);

  const checkAccount = async () => {
    if (!username.trim()) return;
    setLoading(true);
    setStep(2);
    try {
      const res = await fetch(`${API_BASE}/api/onboarding/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });
      const result = await res.json();
      if (res.ok) {
        setAccountResult(result);
        // Check if a persona is already configured — if so, skip persona steps
        try {
          const personaRes = await fetch(`${API_BASE}/api/persona`);
          const personaData = await personaRes.json();
          setHasExistingPersona(personaData.exists === true);
        } catch {
          setHasExistingPersona(false);
        }
        setStep(3);
      } else {
        alert(result.detail || "Could not check account. Try again.");
        setStep(1);
      }
    } catch {
      alert("Could not connect to the API. Make sure api.py is running.");
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const finishSetup = async () => {
    setStep(7);
    setSaving(true);
    const uname = accountResult?.username || username.trim();

    // 1 — Save persona (non-blocking if empty)
    setSavingMessage("Saving your setup...");
    try {
      await fetch(`${API_BASE}/api/persona`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || uname,
          experience_years: years,
          current_role: role.trim() || "Not specified",
          expertise: expertise.length > 0 ? expertise : ["general"],
          domains: subs.length > 0 ? subs : [],
          real_experiences: [],
          goal: goal,
        }),
      });
    } catch {
      // non-blocking
    }

    // 2 — Link the account by calling import.
    // This creates the profile entry and sets it active even if the user
    // has no Reddit history yet (profile is created before the 404 check).
    if (uname) {
      setSavingMessage("Linking your Reddit account...");
      try {
        await fetch(`${API_BASE}/api/import/username`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: uname, posts_limit: 50, comments_limit: 100 }),
        });
        // 200 = profile created + data imported
        // 404 = new user with no history — profile was still created, that's fine
      } catch {
        // non-blocking
      }
    }

    setSaving(false);

    // Full reload — profile now exists so dashboard won't redirect back to onboarding
    const flow = accountResult?.recommended_flow;
    window.location.href = flow === "shield_first" ? "/#shield" : "/";
  };

  // Skip — still go to dashboard but signal we came from onboarding
  // so page.tsx doesn't redirect back here immediately
  const skipToApp = () => {
    window.location.href = "/?onboarded=1";
  };

  // Progress dots for setup phase (steps 3–6)
  const setupPhaseStep = step >= 3 && step <= 6 ? step - 2 : null;

  return (
    <div className="flex min-h-screen bg-gray-950 items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/myredditbuddy-logo.png"
            alt="MyRedBuddy"
            className="h-10 w-auto mx-auto mb-3"
          />
          <p className="text-gray-500 text-sm">Your Reddit Growth Companion</p>
        </div>

        {/* Progress dots — steps 3–6 */}
        {setupPhaseStep !== null && (
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3, 4].map((dot) => (
              <div
                key={dot}
                className={`rounded-full transition-all ${
                  dot < setupPhaseStep
                    ? "w-2 h-2 bg-orange-500"
                    : dot === setupPhaseStep
                    ? "w-3 h-3 bg-orange-500"
                    : "w-2 h-2 bg-gray-700"
                }`}
              />
            ))}
          </div>
        )}

        {/* Step 1 — Username */}
        {step === 1 && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-100 mb-1">
              Welcome to MyRedBuddy
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Enter your Reddit username and we'll tailor the setup to where
              you're at.
            </p>
            <div className="space-y-3">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && checkAccount()}
                placeholder="e.g. spez"
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-600 focus:outline-none focus:border-orange-500 text-sm"
              />
              <button
                onClick={checkAccount}
                disabled={!username.trim() || loading}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm"
              >
                Check my account
              </button>
            </div>
            <div className="mt-4 text-center">
              <button
                onClick={skipToApp}
                className="text-xs text-gray-600 hover:text-gray-400 transition-colors underline underline-offset-2"
              >
                Skip — I'll set up manually
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Loading */}
        {step === 2 && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-center">
            <FiRefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-300 font-medium">
              Checking your Reddit account...
            </p>
            <p className="text-gray-500 text-sm mt-1">u/{username}</p>
          </div>
        )}

        {/* Step 3 — Account insight */}
        {step === 3 && accountResult && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="px-2.5 py-1 rounded-lg bg-gray-800 border border-gray-700 text-xs text-gray-400">
                u/{accountResult.username}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-gray-800 border border-gray-700 text-xs text-gray-400">
                {accountResult.total_karma.toLocaleString()} karma
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-gray-800 border border-gray-700 text-xs text-gray-400">
                {accountResult.account_age_days}d old
              </span>
            </div>

            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3 ${
                accountResult.user_type === "recovery"
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : accountResult.user_type === "new"
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              }`}
            >
              {accountResult.user_type === "recovery" && (
                <FiShield className="w-3 h-3" />
              )}
              {accountResult.user_type === "new" && (
                <FiUser className="w-3 h-3" />
              )}
              {accountResult.user_type === "experienced" && (
                <FiAward className="w-3 h-3" />
              )}
              {accountResult.user_type === "recovery"
                ? "Account flagged"
                : accountResult.user_type === "new"
                ? "New Redditor"
                : "Experienced Redditor"}
            </div>

            <p className="text-gray-300 text-sm mb-1">{accountResult.message}</p>

            {hasExistingPersona ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/25 rounded-lg mb-5">
                  <FiCheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <p className="text-xs text-emerald-300">You already have a persona set up — no need to redo it.</p>
                </div>
                <button
                  onClick={finishSetup}
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors text-sm mb-3"
                >
                  Link account &amp; go to app →
                </button>
                <div className="text-center">
                  <button
                    onClick={() => setStep(4)}
                    className="text-xs text-gray-600 hover:text-gray-400 transition-colors underline underline-offset-2"
                  >
                    Update my persona first
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-500 text-xs mb-6">
                  Before we set anything up, we'd love to know a bit more about you
                  — it only takes a minute.
                </p>
                <button
                  onClick={() => setStep(4)}
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors text-sm"
                >
                  Let's keep going →
                </button>
                <div className="mt-3 text-center">
                  <button
                    onClick={skipToApp}
                    className="text-xs text-gray-600 hover:text-gray-400 transition-colors underline underline-offset-2"
                  >
                    Skip setup, take me to the app
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 4 — Goal */}
        {step === 4 && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-gray-100 mb-1">
              What's your main goal on Reddit?
            </h2>
            <p className="text-gray-500 text-xs mb-5">
              Pick the one that fits best — this shapes how we personalize your
              recommendations.
            </p>
            <div className="space-y-2 mb-6">
              {[
                {
                  value: "share_expertise",
                  label: "Share expertise & help others",
                  desc: "Answer questions, contribute knowledge",
                },
                {
                  value: "build_authority",
                  label: "Build authority in my niche",
                  desc: "Establish credibility over time",
                },
                {
                  value: "promote_work",
                  label: "Promote my work authentically",
                  desc: "Drive awareness without spamming",
                },
                {
                  value: "explore",
                  label: "Just explore and contribute",
                  desc: "No specific agenda, see what works",
                },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setGoal(opt.value)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                    goal === opt.value
                      ? "bg-orange-500/15 border-orange-500/50 text-gray-100"
                      : "bg-gray-800/40 border-gray-700 text-gray-300 hover:border-gray-600"
                  }`}
                >
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(5)}
                disabled={!goal}
                className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm"
              >
                Continue →
              </button>
            </div>
            <div className="mt-3 text-center">
              <button
                onClick={() => setStep(5)}
                className="text-xs text-gray-600 hover:text-gray-400 transition-colors underline underline-offset-2"
              >
                Skip this
              </button>
            </div>
          </div>
        )}

        {/* Step 5 — About you */}
        {step === 5 && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-gray-100 mb-1">
              Tell us about yourself
            </h2>
            <p className="text-gray-500 text-xs mb-5">
              We use this to make your contributions sound authentic — not
              generic AI output.
            </p>
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  What should we call you?
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name or handle"
                  className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-600 focus:outline-none focus:border-orange-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  Your current role or background
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Senior Engineer, Indie founder, Marketing lead"
                  className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-600 focus:outline-none focus:border-orange-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  Years of experience in your field
                </label>
                <select
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-100 focus:outline-none focus:border-orange-500 text-sm"
                >
                  {[1, 2, 3, 5, 7, 10, 15, 20].map((y) => (
                    <option key={y} value={y}>
                      {y}+ years
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(4)}
                className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(6)}
                className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors text-sm"
              >
                Continue →
              </button>
            </div>
            <div className="mt-3 text-center">
              <button
                onClick={() => setStep(6)}
                className="text-xs text-gray-600 hover:text-gray-400 transition-colors underline underline-offset-2"
              >
                Skip this
              </button>
            </div>
          </div>
        )}

        {/* Step 6 — Expertise + subreddits */}
        {step === 6 && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-gray-100 mb-1">
              What you know & where you'll post
            </h2>
            <p className="text-gray-500 text-xs mb-5">
              This is how we match your voice to the right communities.
            </p>

            {/* Expertise tags */}
            <div className="mb-5">
              <label className="block text-xs text-gray-400 mb-2">
                What are you an expert in?{" "}
                <span className="text-gray-600">(press Enter to add)</span>
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {expertise.map((tag, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 px-2.5 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-xs"
                  >
                    {tag}
                    <button
                      onClick={() =>
                        setExpertise(expertise.filter((_, idx) => idx !== i))
                      }
                      className="hover:text-white ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={expertiseInput}
                onChange={(e) => setExpertiseInput(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    (e.key === "Enter" || e.key === ",") &&
                    expertiseInput.trim()
                  ) {
                    e.preventDefault();
                    const val = expertiseInput.trim().replace(/,$/, "");
                    if (val && !expertise.includes(val))
                      setExpertise([...expertise, val]);
                    setExpertiseInput("");
                  }
                }}
                placeholder="e.g. TypeScript, SEO, finance..."
                className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-600 focus:outline-none focus:border-orange-500 text-sm"
              />
            </div>

            {/* Subreddit tags */}
            <div className="mb-6">
              <label className="block text-xs text-gray-400 mb-2">
                Which subreddits do you want to contribute to?{" "}
                <span className="text-gray-600">(press Enter to add)</span>
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {subs.map((sub, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 px-2.5 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs"
                  >
                    r/{sub}
                    <button
                      onClick={() =>
                        setSubs(subs.filter((_, idx) => idx !== i))
                      }
                      className="hover:text-white ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={subInput}
                onChange={(e) =>
                  setSubInput(e.target.value.replace(/^r\//, ""))
                }
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === ",") && subInput.trim()) {
                    e.preventDefault();
                    const val = subInput
                      .trim()
                      .replace(/^r\//, "")
                      .replace(/,$/, "");
                    if (val && !subs.includes(val)) setSubs([...subs, val]);
                    setSubInput("");
                  }
                }}
                placeholder="e.g. webdev, startups, personalfinance..."
                className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-600 focus:outline-none focus:border-orange-500 text-sm"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(5)}
                className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={finishSetup}
                className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors text-sm"
              >
                Finish setup →
              </button>
            </div>
            <div className="mt-3 text-center">
              <button
                onClick={finishSetup}
                className="text-xs text-gray-600 hover:text-gray-400 transition-colors underline underline-offset-2"
              >
                Skip & go to app
              </button>
            </div>
          </div>
        )}

        {/* Step 7 — Saving */}
        {step === 7 && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-center">
            {saving ? (
              <>
                <FiRefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-300 font-medium">{savingMessage}</p>
              </>
            ) : (
              <>
                <FiCheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-4" />
                <p className="text-gray-100 font-semibold">You're all set</p>
                <p className="text-gray-500 text-sm mt-1">
                  Taking you to the right place...
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
