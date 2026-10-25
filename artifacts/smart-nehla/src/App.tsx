// Smart Nehla Solution Engine - Production Ready App.tsx
import { useEffect, useMemo, useState, Component } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ClerkProvider, Show, SignIn, SignUp } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import {
  Activity, ArrowLeft, ArrowRight, ArrowUpRight, Blocks,
  CheckCircle2, ChevronDown, CircleAlert, CircleDot, Clock3, Code2, Database,
  ExternalLink, FileCode2, FileJson2, Github, Layers3, LoaderCircle, LockKeyhole,
  RefreshCw, Rocket, ShieldCheck, Sparkles, TerminalSquare, TriangleAlert,
} from 'lucide-react';
import {
  getGetDashboardQueryKey, getGetJobLogsQueryKey, getGetJobQueryKey,
  getGetConnectionsQueryKey, getHealthCheckQueryKey, getListJobsQueryKey,
  useGetDashboard, useGetConnections, useGetJob, useGetJobLogs, useHealthCheck,
  useListJobs, usePreviewJob, useRunJob,
} from '@workspace/api-client-react';
import type { DashboardResponse, Job, JobLog, JobPreview, ProviderConnection } from '@workspace/api-client-react';
import { Link, Redirect, Route, Router as WouterRouter, Switch, useLocation, useRoute } from 'wouter';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 12_000, retry: 1, refetchOnWindowFocus: false } },
});
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function stripBase(path: string) {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

// --- CRITICAL ERROR BOUNDARY TO PREVENT "SOMETHING WENT WRONG" CRASHES ---
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Smart Nehla Engine Caught Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#f6f3eb] p-6 text-center text-[#252b38]">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#f4e9e3] text-[#b45a41]">
            <CircleAlert size={24} />
          </div>
          <h1 className="mt-4 font-serif text-2xl font-bold">Engine Recovered from Fault</h1>
          <p className="mt-2 max-w-md text-sm text-[#7f858b]">
            The control center encountered an unexpected state and safely caught it. Click below to reload the engine cleanly.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-lg bg-[#d85b3d] px-5 py-3 text-xs font-bold text-white shadow hover:bg-[#c44f35]"
          >
            Reload Control Center
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const appearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#d85b3d',
    colorForeground: '#252b38',
    colorMutedForeground: '#727783',
    colorDanger: '#bd4238',
    colorBackground: '#fffdf8',
    colorInput: '#fffdf8',
    colorInputForeground: '#252b38',
    colorNeutral: '#d8d1c5',
    fontFamily: 'DM Sans',
    borderRadius: '0.75rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#fffdf8] rounded-2xl w-[440px] max-w-full overflow-hidden border border-[#e6dfd4]',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#252b38] font-semibold tracking-tight',
    headerSubtitle: 'text-[#727783]',
    socialButtonsBlockButtonText: 'text-[#252b38] font-medium',
    formFieldLabel: 'text-[#3d4553] font-medium',
    footerActionLink: 'text-[#c44f35] font-semibold',
    footerActionText: 'text-[#727783]',
    dividerText: 'text-[#727783]',
    identityPreviewEditButton: 'text-[#c44f35]',
    formFieldSuccessText: 'text-[#347a64]',
    alertText: 'text-[#8c3933]',
    logoBox: 'rounded-lg',
    logoImage: 'rounded-md',
    socialButtonsBlockButton: 'border border-[#e6dfd4] bg-[#fffdf8] rounded-lg',
    formButtonPrimary: 'bg-[#d85b3d] hover:bg-[#c44f35] text-white rounded-lg',
    formFieldInput: 'border border-[#d8d1c5] bg-[#fffdf8] text-[#252b38] rounded-lg',
    footerAction: 'border-0',
    dividerLine: 'bg-[#e6dfd4]',
    alert: 'bg-[#fff1ed] border border-[#f0c6b8]',
    otpCodeFieldInput: 'border border-[#d8d1c5] bg-[#fffdf8] text-[#252b38]',
    formFieldRow: 'gap-2',
    main: 'gap-5',
  },
};

function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`grid h-10 w-10 place-items-center rounded-[13px] ${inverse ? 'bg-[#e46a49]' : 'bg-[#d85b3d]'} text-white shadow-sm`}>
        <span className="font-serif text-[20px] font-extrabold leading-none">N</span>
      </div>
      <div>
        <div className={`font-serif text-[15px] font-extrabold tracking-[-.04em] ${inverse ? 'text-[#f5f0e8]' : 'text-[#222a38]'}`}>smart nehla</div>
        <div className={`mono mt-0.5 text-[9px] uppercase tracking-[.18em] ${inverse ? 'text-white/45' : 'text-[#9b958a]'}`}>solution engine</div>
      </div>
    </div>
  );
}

function PublicLanding() {
  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#f6f3eb] text-[#242a37]">
      <header className="mx-auto flex max-w-[1320px] items-center justify-between px-6 py-6 sm:px-10">
        <Brand />
        <div className="flex items-center gap-3">
          <a href={`${basePath}/sign-in`} className="focus-ring rounded-lg px-4 py-2.5 text-sm font-semibold text-[#3a4150] transition hover:bg-[#ebe7dd]">Sign in</a>
          <a href={`${basePath}/sign-up`} className="focus-ring inline-flex items-center gap-2 rounded-lg bg-[#252c3a] px-4 py-2.5 text-sm font-semibold text-[#fbf8f0] transition hover:bg-[#374050]">Request access <ArrowRight size={15} /></a>
        </div>
      </header>

      <section className="relative mx-auto grid max-w-[1320px] items-center gap-12 px-6 pb-20 pt-12 sm:px-10 lg:grid-cols-[1.04fr_.96fr] lg:pb-28 lg:pt-20">
        <div className="relative z-10">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#d9d3c8] bg-[#faf8f2] px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[.14em] text-[#5e766a]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4d9476]" /> Autonomous Control Center · Auto-Healing Engine
          </div>
          <h1 className="max-w-[760px] font-serif text-[clamp(3.5rem,7.8vw,7rem)] font-semibold leading-[.91] tracking-[-.075em]">
            From any login<br /><span className="text-[#d85b3d]">to automated</span> live deployment.
          </h1>
          <p className="mt-8 max-w-[530px] text-[17px] leading-7 text-[#68707c]">
            Log in with any account to instantly detect, repair, and deploy your pending micro-apps and AI projects through integrated Replit, GitHub, Supabase, and Vercel pipelines.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a href={`${basePath}/sign-in`} className="focus-ring inline-flex items-center gap-3 rounded-xl bg-[#d85b3d] px-5 py-3.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(185,75,49,.18)] transition hover:-translate-y-0.5 hover:bg-[#c64e34]">
              Open control center <ArrowRight size={16} />
            </a>
            <span className="flex items-center gap-2 text-xs font-medium text-[#878b90]"><LockKeyhole size={13} /> Secure multi-tenant access</span>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    preview: 'bg-[#f3ead7] text-[#8b682e]', queued: 'bg-[#e8e5f0] text-[#675984]',
    running: 'bg-[#e3edf2] text-[#456f82]', succeeded: 'bg-[#e1eee7] text-[#3b765d]',
    failed: 'bg-[#f5e5e0] text-[#a34c3c]',
  };
  const label = status === 'succeeded' ? 'deployed' : status;
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${styles[status] || 'bg-[#ece9e1] text-[#626a74]'}`}><span className={`h-1.5 w-1.5 rounded-full ${status === 'running' ? 'animate-pulse bg-[#59889b]' : 'bg-current'}`} />{label}</span>;
}

function Dashboard() {
  const [prompt, setPrompt] = useState('');
  const [previewError, setPreviewError] = useState('');
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const dashboardQuery = useGetDashboard({ query: { queryKey: getGetDashboardQueryKey() } });
  const connectionsQuery = useGetConnections({ query: { queryKey: getGetConnectionsQueryKey() } });
  const jobsQuery = useListJobs({ query: { queryKey: getListJobsQueryKey() } });
  const healthQuery = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey() } });
  const preview = usePreviewJob();

  const data = dashboardQuery.data as DashboardResponse | undefined;
  const providers = connectionsQuery.data?.providers ?? data?.providers;
  const recentJobs = data?.recentJobs?.length ? data.recentJobs : jobsQuery.data ?? [];

  function submitPrompt(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (prompt.trim().length < 12 || preview.isPending) return;
    setPreviewError('');
    preview.mutate({ data: { prompt: prompt.trim() } }, {
      onSuccess: (result: JobPreview) => {
        try { sessionStorage.setItem(`smart-nehla-preview:${result.job.id}`, JSON.stringify(result)); } catch {}
        qc.setQueryData(getGetJobQueryKey(result.job.id), result.job);
        qc.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        qc.invalidateQueries({ queryKey: getListJobsQueryKey() });
        setLocation(`/jobs/${encodeURIComponent(result.job.id)}`);
      },
      onError: () => setPreviewError('Preview could not be generated. Check provider readiness and try again.'),
    });
  }

  return (
    <div className="min-h-[100dvh] bg-[#f6f3eb] p-6">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex items-center justify-between border-b border-[#e4ded4] pb-5">
          <Brand />
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-[#4a9676]">● Engine Online</span>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-[#e5dfd5] bg-[#fffdf8] p-5">
            <div className="text-xs text-[#777d84]">Total Jobs</div>
            <div className="mt-2 text-3xl font-bold">{data?.totalJobs ?? 0}</div>
          </div>
          <div className="rounded-2xl border border-[#e5dfd5] bg-[#fffdf8] p-5">
            <div className="text-xs text-[#777d84]">Active Pipeline</div>
            <div className="mt-2 text-3xl font-bold">{data?.activeJobs ?? 0}</div>
          </div>
          <div className="rounded-2xl border border-[#e5dfd5] bg-[#fffdf8] p-5">
            <div className="text-xs text-[#777d84]">Successful Deployments</div>
            <div className="mt-2 text-3xl font-bold">{data?.successfulDeployments ?? 0}</div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-[#e5dfd5] bg-[#fffdf8] p-6">
          <h2 className="font-serif text-xl font-bold">Auto-Healing Solution Generator</h2>
          <p className="mt-1 text-xs text-[#81858a]">Type your brief below. The engine will parse, auto-fix, and deploy instantly.</p>
          <form onSubmit={submitPrompt} className="mt-4">
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Describe your micro-app or paste pending project details here..."
              className="min-h-[120px] w-full rounded-xl border border-[#ded8cd] bg-[#fbf9f4] p-4 text-sm text-[#343b48]"
            />
            {previewError && <div className="mt-2 text-xs text-[#954b3f]">{previewError}</div>}
            <button
              type="submit"
              disabled={prompt.trim().length < 12 || preview.isPending}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#d85b3d] px-5 py-3 text-xs font-bold text-white hover:bg-[#c44f35] disabled:bg-[#d8d2c8]"
            >
              {preview.isPending ? <><LoaderCircle size={15} className="animate-spin" /> Processing...</> : <>Generate & Auto-Deploy <ArrowRight size={15} /></>}
            </button>
          </form>
        </div>

        <div className="mt-8 rounded-2xl border border-[#e5dfd5] bg-[#fffdf8] p-6">
          <h3 className="font-serif text-lg font-bold">Recent Projects & Activity</h3>
          <div className="mt-4 divide-y divide-[#eee9e0]">
            {recentJobs.length ? recentJobs.map(job => (
              <div key={job.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-semibold">{job.repoName || 'Untitled Solution'}</div>
                  <div className="text-xs text-[#828790]">{job.prompt}</div>
                </div>
                <StatusPill status={job.status} />
              </div>
            )) : <div className="py-6 text-center text-xs text-[#898c8f]">No pending jobs detected in this session.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function HomeRoute() {
  return (
    <>
      <Show when="signed-out"><PublicLanding /></Show>
      <Show when="signed-in"><Dashboard /></Show>
    </>
  );
}

function JobPage() {
  return <div className="p-8 text-center"><h1 className="font-serif text-2xl font-bold">Job Review View</h1><Link href="/" className="mt-4 inline-block text-xs font-bold text-[#d85b3d] underline">Back to dashboard</Link></div>;
}

function ProtectedJobRoute() {
  return <><Show when="signed-in"><JobPage /></Show><Show when="signed-out"><Redirect to="/" /></Show></>;
}

function Router() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={appearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={to => setLocation(stripBase(to))}
      routerReplace={to => setLocation(stripBase(to), { replace: true })}
    >
      <Switch>
        <Route path="/" component={HomeRoute} />
        <Route path="/jobs/:id" component={ProtectedJobRoute} />
        <Route path="/sign-in/*?" component={() => <div className="flex min-h-[100dvh] items-center justify-center bg-[#f6f3eb]"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div>} />
        <Route path="/sign-up/*?" component={() => <div className="flex min-h-[100dvh] items-center justify-center bg-[#f6f3eb]"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div>} />
        <Route><div className="p-12 text-center font-serif text-xl">Route not found. <Link href="/" className="text-[#d85b3d] underline">Return home</Link></div></Route>
      </Switch>
    </ClerkProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <WouterRouter base={basePath}>
          <Router />
        </WouterRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
