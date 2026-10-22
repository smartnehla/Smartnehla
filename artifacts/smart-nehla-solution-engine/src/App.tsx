import { useEffect, useMemo, useState } from 'react';
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
        <span className="font-[var(--app-font-serif)] text-[20px] font-extrabold leading-none">N</span>
      </div>
      <div>
        <div className={`font-[var(--app-font-serif)] text-[15px] font-extrabold tracking-[-.04em] ${inverse ? 'text-[#f5f0e8]' : 'text-[#222a38]'}`}>smart nehla</div>
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
          <a href={`${basePath}/sign-in`} className="focus-ring rounded-lg px-4 py-2.5 text-sm font-semibold text-[#3a4150] transition hover:bg-[#ebe7dd]" data-testid="link-sign-in">Sign in</a>
          <a href={`${basePath}/sign-up`} className="focus-ring inline-flex items-center gap-2 rounded-lg bg-[#252c3a] px-4 py-2.5 text-sm font-semibold text-[#fbf8f0] transition hover:bg-[#374050]" data-testid="link-sign-up">Request access <ArrowRight size={15} /></a>
        </div>
      </header>

      <section className="relative mx-auto grid max-w-[1320px] items-center gap-12 px-6 pb-20 pt-12 sm:px-10 lg:grid-cols-[1.04fr_.96fr] lg:pb-28 lg:pt-20">
        <div className="relative z-10 animate-rise">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#d9d3c8] bg-[#faf8f2] px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[.14em] text-[#5e766a]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4d9476]" /> Admin workspace · private by design
          </div>
          <h1 className="max-w-[760px] font-[var(--app-font-serif)] text-[clamp(3.5rem,7.8vw,7rem)] font-semibold leading-[.91] tracking-[-.075em]">
            From a clear idea<br /><span className="text-[#d85b3d]">to a live</span> solution.
          </h1>
          <p className="mt-8 max-w-[530px] text-[17px] leading-7 text-[#68707c]">
            Turn a well-scoped prompt into a reviewed micro-app. Inspect every generated file and data table before anything is deployed.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a href={`${basePath}/sign-in`} className="focus-ring inline-flex items-center gap-3 rounded-xl bg-[#d85b3d] px-5 py-3.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(185,75,49,.18)] transition hover:-translate-y-0.5 hover:bg-[#c64e34]" data-testid="link-open-control-center">
              Open control center <ArrowRight size={16} />
            </a>
            <span className="flex items-center gap-2 text-xs font-medium text-[#878b90]"><LockKeyhole size={13} /> Invitation-only access</span>
          </div>
          <div className="mt-14 flex items-center gap-5 border-t border-[#ded9cf] pt-5 text-xs text-[#7c8086]">
            <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-[#4a8c70]" /> Human approval required</span>
            <span className="h-1 w-1 rounded-full bg-[#c6c0b5]" />
            <span>Provider secrets stay server-side</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[570px] animate-rise stagger-2">
          <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-[#e9dfcb]/70 blur-[1px]" />
          <div className="absolute -bottom-12 -left-10 h-52 w-52 rounded-full bg-[#dbe8df]/70" />
          <div className="surface-grid relative rounded-[28px] border border-[#e0dacf] bg-[#efede5] p-5 shadow-[0_22px_70px_rgba(46,49,51,.1)] sm:p-7">
            <div className="overflow-hidden rounded-[19px] border border-[#dcd7ce] bg-[#fffdf8]">
              <div className="flex items-center justify-between border-b border-[#ebe6dd] px-5 py-4">
                <div className="flex items-center gap-2 text-xs font-bold text-[#414956]"><Sparkles size={14} className="text-[#d85b3d]" /> New solution brief</div>
                <div className="mono text-[10px] text-[#a7a197]">DRAFT_014</div>
              </div>
              <div className="p-5">
                <div className="mono text-[10px] uppercase tracking-[.15em] text-[#9b958a]">What should we build?</div>
                <div className="mt-3 rounded-xl border border-[#e7e1d7] bg-[#fbf9f4] p-4 text-[14px] leading-6 text-[#525965]">
                  A lightweight intake board for the field team. Track requests by site, add a photo, and show what needs attention today.
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[11px] text-[#8a8d91]"><CircleDot size={12} className="text-[#559375]" /> Approval gate active</span>
                  <span className="rounded-lg bg-[#d85b3d] px-4 py-2 text-xs font-bold text-white">Generate preview <ArrowRight className="ml-1 inline" size={13} /></span>
                </div>
              </div>
              <div className="border-t border-[#ebe6dd] bg-[#fbf9f4] px-5 py-4">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[.12em] text-[#a09a90]"><span>Review before run</span><span className="text-[#4b8d71]">● ready</span></div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[['PLAN', 'Scope + tasks'], ['FILES', '4 generated'], ['SCHEMA', '2 tables']].map(([label, value]) => <div key={label} className="rounded-lg border border-[#e9e3d9] bg-[#fffdf8] px-3 py-2.5"><div className="mono text-[9px] tracking-[.12em] text-[#9e988e]">{label}</div><div className="mt-1 text-[11px] font-semibold text-[#58606b]">{value}</div></div>)}
                </div>
              </div>
            </div>
            <div className="animate-drift absolute -right-4 top-[38%] rounded-xl border border-[#ddd7cb] bg-[#fffdf8] px-4 py-3 shadow-[0_10px_30px_rgba(42,46,53,.1)] sm:-right-7">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-[#394352]"><CheckCircle2 size={15} className="text-[#4b8d71]" /> Human review checkpoint</div>
              <div className="mt-1 pl-[23px] text-[10px] text-[#97948f]">No deployment without confirmation</div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#e1dcd2] bg-[#eeece4]">
        <div className="mx-auto grid max-w-[1320px] gap-0 px-6 sm:px-10 md:grid-cols-3">
          {[
            { n: '01', title: 'Describe', body: 'Start with a practical problem, written in plain language.' },
            { n: '02', title: 'Review', body: 'Inspect the plan, files, and schema before work begins.' },
            { n: '03', title: 'Deploy', body: 'Confirm once. Follow progress through persistent live logs.' },
          ].map((step, i) => <div key={step.n} className={`py-8 md:py-10 ${i ? 'md:border-l md:border-[#d9d4ca] md:pl-8' : ''} ${i < 2 ? 'md:pr-8' : ''}`}>
            <div className="mono text-[10px] tracking-[.16em] text-[#d85b3d]">{step.n} / WORKFLOW</div><h2 className="mt-3 font-[var(--app-font-serif)] text-2xl font-bold tracking-[-.04em]">{step.title}</h2><p className="mt-2 max-w-[290px] text-sm leading-6 text-[#737982]">{step.body}</p>
          </div>)}
        </div>
      </section>
      <footer className="mx-auto flex max-w-[1320px] flex-col justify-between gap-3 px-6 py-7 text-xs text-[#8a8d91] sm:flex-row sm:px-10">
        <Brand /><span className="self-center">A measured path from prompt to production.</span><a href={`${basePath}/sign-in`} className="self-center font-semibold text-[#555d69] hover:text-[#d85b3d]">Admin sign in <ArrowUpRight className="ml-1 inline" size={13} /></a>
      </footer>
    </main>
  );
}

function formatDate(date?: string) {
  if (!date) return '—';
  const value = new Date(date);
  if (Number.isNaN(value.valueOf())) return '—';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(value);
}

function relativeTime(date?: string) {
  if (!date) return 'just now';
  const mins = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 60_000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return hrs < 24 ? `${hrs}h ago` : `${Math.floor(hrs / 24)}d ago`;
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

function ProviderName({ provider }: { provider: string }) {
  const logo = provider === 'github' ? <Github size={15} /> : provider === 'supabase' ? <Database size={15} /> : <Rocket size={15} />;
  return <span className="flex items-center gap-2.5 font-semibold capitalize text-[#354052]">{logo}{provider}</span>;
}

function ProviderCard({ providers, isLoading, isError, onRetry }: { providers?: ProviderConnection[]; isLoading: boolean; isError: boolean; onRetry: () => void }) {
  return <section className="rounded-2xl border border-[#e5dfd5] bg-[#fffdf8] p-5 sm:p-6">
    <div className="flex items-start justify-between gap-3">
      <div><div className="text-[11px] font-bold uppercase tracking-[.13em] text-[#939087]">Provider readiness</div><h2 className="mt-1 font-[var(--app-font-serif)] text-lg font-bold tracking-[-.03em]">Connections</h2></div>
      {providers && <div className="mono rounded-full bg-[#f0eee7] px-2.5 py-1 text-[10px] text-[#767b81]">{providers.filter(p => p.status === 'connected').length}/{providers.length} ready</div>}
    </div>
    {isLoading ? <div className="mt-5 space-y-3">{[0, 1, 2].map(i => <div key={i} className="h-12 animate-pulse rounded-lg bg-[#f0eee8]" />)}</div> :
      isError ? <div className="mt-5 rounded-xl bg-[#fbf0eb] p-4 text-sm text-[#8c4c3d]"><div className="flex items-center gap-2 font-semibold"><CircleAlert size={15} /> Could not check provider status</div><button onClick={onRetry} className="mt-2 text-xs font-bold underline underline-offset-2" data-testid="button-retry-providers">Retry check</button></div> :
        !providers?.length ? <div className="mt-5 rounded-xl border border-dashed border-[#ddd6ca] p-4 text-sm text-[#757b84]"><div className="font-semibold text-[#414958]">No providers reported</div><p className="mt-1 text-xs leading-5">Generation is unavailable until provider configuration is supplied on the server.</p></div> :
          <div className="mt-4 divide-y divide-[#eee9e0]">{providers.map(p => <div key={p.provider} className="flex items-center justify-between gap-3 py-3.5" data-testid={`provider-status-${p.provider}`}>
            <div><ProviderName provider={p.provider} /><p className="mt-1 pl-[25px] text-[11px] text-[#92928e]">{p.message || (p.status === 'connected' ? 'Ready for generation' : 'Configuration required')}</p></div>
            <div className="text-right"><span className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[.1em] ${p.status === 'connected' ? 'bg-[#e2eee7] text-[#43785f]' : p.status === 'error' ? 'bg-[#f5e5e0] text-[#a34c3c]' : 'bg-[#f2ead8] text-[#8b682e]'}`}>{p.status}</span><div className="mt-1 text-[9px] text-[#a2a098]">{relativeTime(p.checkedAt)}</div></div>
          </div>)}</div>}
  </section>;
}

function JobRow({ job }: { job: Job }) {
  return <Link href={`/jobs/${encodeURIComponent(job.id)}`} className="group grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 border-b border-[#eee9e0] px-4 py-4 transition hover:bg-[#f8f5ee] sm:grid-cols-[minmax(0,1fr)_110px_108px] sm:px-5" data-testid={`link-job-${job.id}`}>
    <div className="min-w-0"><div className="truncate text-sm font-semibold text-[#333b49] group-hover:text-[#c95035]">{job.repoName || 'Untitled micro-app'}</div><div className="mt-1 truncate text-xs text-[#828790]">{job.prompt}</div></div>
    <div className="hidden sm:block"><StatusPill status={job.status} /></div>
    <div className="col-span-2 flex items-center justify-between text-[10px] text-[#999991] sm:col-span-1 sm:justify-end"><span className="sm:hidden"><StatusPill status={job.status} /></span><span className="mono">{relativeTime(job.updatedAt || job.createdAt)}</span></div>
  </Link>;
}

function LoadingRows() {
  return <div className="space-y-3 p-5">{[0, 1, 2].map(i => <div key={i} className="h-[58px] animate-pulse rounded-lg bg-[#f0eee8]" />)}</div>;
}

function Dashboard() {
  const [prompt, setPrompt] = useState('');
  const [previewError, setPreviewError] = useState('');
  const [showAllJobs, setShowAllJobs] = useState(false);
  const [location, setLocation] = useLocation();
  const qc = useQueryClient();
  const dashboardQuery = useGetDashboard({ query: { queryKey: getGetDashboardQueryKey() } });
  const connectionsQuery = useGetConnections({ query: { queryKey: getGetConnectionsQueryKey() } });
  const jobsQuery = useListJobs({ query: { queryKey: getListJobsQueryKey() } });
  const healthQuery = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey() } });
  const preview = usePreviewJob();

  const data = dashboardQuery.data as DashboardResponse | undefined;
  const providers = connectionsQuery.data?.providers ?? data?.providers;
  const requiredProviders = ['github', 'supabase', 'vercel'];
  const isProviderReady = requiredProviders.every(required => providers?.some(provider => provider.provider === required && provider.status === 'connected'));
  const recentJobs = data?.recentJobs?.length ? data.recentJobs : jobsQuery.data ?? [];

  function submitPrompt(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (prompt.trim().length < 12 || preview.isPending) return;
    setPreviewError('');
    preview.mutate({ data: { prompt: prompt.trim() } }, {
      onSuccess: (result: JobPreview) => {
        try { sessionStorage.setItem(`smart-nehla-preview:${result.job.id}`, JSON.stringify(result)); } catch { /* Preview still available for this view. */ }
        qc.setQueryData(getGetJobQueryKey(result.job.id), result.job);
        qc.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        qc.invalidateQueries({ queryKey: getListJobsQueryKey() });
        setLocation(`/jobs/${encodeURIComponent(result.job.id)}`);
      },
      onError: () => setPreviewError('Preview could not be generated. Check provider readiness and try again.'),
    });
  }

  return <AppShell active="overview">
    <div className="mx-auto max-w-[1440px] px-5 pb-12 pt-8 sm:px-8 lg:px-10">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><div className="mono text-[10px] uppercase tracking-[.18em] text-[#a09a90]">Control room / 01</div><h1 className="mt-2 font-[var(--app-font-serif)] text-[34px] font-bold tracking-[-.055em] text-[#242a37] sm:text-[40px]">Overview</h1><p className="mt-1 text-sm text-[#7a7f87]">A measured path from prompt to production.</p></div>
        <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#e2ddd3] bg-[#fffdf8] px-3 py-2 text-xs text-[#6d737c]"><span className={`h-2 w-2 rounded-full ${healthQuery.data?.status === 'ok' || healthQuery.data?.status === 'healthy' ? 'bg-[#4a9676]' : healthQuery.isError ? 'bg-[#c74e3a]' : 'bg-[#d6a448]'}`} />Platform {healthQuery.isLoading ? 'checking' : healthQuery.isError ? 'status unavailable' : healthQuery.data?.status || 'ready'}</div>
      </div>

      {dashboardQuery.isError && <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-[#edc7ba] bg-[#fff2ed] px-4 py-3 text-sm text-[#8c483c]" role="alert">
        <span className="flex items-center gap-2"><CircleAlert size={16} /> Dashboard data is unavailable. Existing jobs may still load below.</span>
        <button className="font-bold underline" onClick={() => dashboardQuery.refetch()} data-testid="button-retry-dashboard">Retry</button>
      </div>}

      <div className="mb-7 grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Total jobs', value: data?.totalJobs, icon: Layers3, note: 'All generated solutions', tint: 'text-[#526f7c] bg-[#e9eff0]' },
          { label: 'In progress', value: data?.activeJobs, icon: Activity, note: 'Currently moving through the pipeline', tint: 'text-[#af6b43] bg-[#f5e9dd]' },
          { label: 'Successful deployments', value: data?.successfulDeployments, icon: Rocket, note: 'Reviewed and confirmed', tint: 'text-[#4a8068] bg-[#e5eee7]' },
        ].map((stat, i) => <div key={stat.label} className={`animate-rise stagger-${i + 1} rounded-2xl border border-[#e5dfd5] bg-[#fffdf8] p-5`}>
          <div className="flex items-center justify-between"><span className="text-xs font-semibold text-[#777d84]">{stat.label}</span><span className={`grid h-9 w-9 place-items-center rounded-xl ${stat.tint}`}><stat.icon size={17} /></span></div>
          <div className="mt-4 font-[var(--app-font-serif)] text-[32px] font-bold leading-none tracking-[-.06em] text-[#2d3543]">{dashboardQuery.isLoading ? <span className="inline-block h-8 w-16 animate-pulse rounded bg-[#efede6]" /> : stat.value ?? '—'}</div>
          <div className="mt-2 text-[10px] text-[#999991]">{stat.note}</div>
        </div>)}
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(310px,.75fr)]">
        <section className="overflow-hidden rounded-2xl border border-[#e5dfd5] bg-[#fffdf8]">
          <div className="border-b border-[#eee9e0] px-5 py-5 sm:px-6">
            <div className="flex items-center justify-between gap-4"><div><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.12em] text-[#d05a3d]"><Sparkles size={13} /> Prompt to preview</div><h2 className="mt-1 font-[var(--app-font-serif)] text-xl font-bold tracking-[-.04em]">Start with the problem</h2></div><span className="mono hidden rounded-md bg-[#f2efe8] px-2.5 py-1.5 text-[9px] text-[#928d83] sm:block">12–4,000 CHARACTERS</span></div>
            <p className="mt-2 max-w-xl text-xs leading-5 text-[#81858a]">Describe the people, workflow, and outcome. First we create a reviewable plan — no repository or deployment is touched yet.</p>
          </div>
          <form onSubmit={submitPrompt} className="p-5 sm:p-6">
            <label htmlFor="solution-prompt" className="mb-2 block text-xs font-bold text-[#434a56]">Solution brief</label>
            <textarea id="solution-prompt" value={prompt} onChange={e => setPrompt(e.target.value)} minLength={12} maxLength={4000} placeholder="Example: Build an internal request board for the support team. Let them categorize issues, assign an owner, and see what is blocked..." className="focus-ring min-h-[142px] w-full resize-y rounded-xl border border-[#ded8cd] bg-[#fbf9f4] px-4 py-3.5 text-sm leading-6 text-[#343b48] placeholder:text-[#aaa69d] focus:border-[#d85b3d]" data-testid="input-solution-prompt" />
            <div className="mt-2 flex items-center justify-between text-[10px] text-[#9c9a92]"><span>Be specific about rules and what “done” looks like.</span><span className="mono">{prompt.length.toLocaleString()} / 4,000</span></div>
            {!isProviderReady && <div className="mt-4 flex items-start gap-2 rounded-lg border border-[#ead9b6] bg-[#faf3e4] p-3 text-xs leading-5 text-[#7d6535]"><TriangleAlert size={15} className="mt-0.5 shrink-0" /><span>You can create a preview now. GitHub, Supabase, and Vercel must be connected before confirming a run.</span></div>}
            {previewError && <div className="mt-4 rounded-lg bg-[#fbefea] p-3 text-xs text-[#954b3f]" role="alert">{previewError}</div>}
            <div className="mt-5 flex flex-col-reverse justify-between gap-3 sm:flex-row sm:items-center">
              <span className="flex items-center gap-1.5 text-[10px] text-[#92928c]"><ShieldCheck size={13} className="text-[#5b8a72]" /> Review is required before every run</span>
              <button type="submit" disabled={prompt.trim().length < 12 || preview.isPending} className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-[#d85b3d] px-4 py-3 text-xs font-bold text-white transition hover:bg-[#c44f35] disabled:cursor-not-allowed disabled:bg-[#d8d2c8] disabled:text-[#8c8a84]" data-testid="button-generate-preview">
                {preview.isPending ? <><LoaderCircle size={15} className="animate-spin" /> Preparing preview…</> : <>Generate preview <ArrowRight size={15} /></>}
              </button>
            </div>
          </form>
        </section>

        <div className="space-y-5">
          <ProviderCard providers={providers} isLoading={connectionsQuery.isLoading && dashboardQuery.isLoading} isError={connectionsQuery.isError && dashboardQuery.isError} onRetry={() => { connectionsQuery.refetch(); dashboardQuery.refetch(); }} />
          <section id="recent-jobs" className="overflow-hidden rounded-2xl border border-[#e5dfd5] bg-[#fffdf8]">
            <div className="flex items-center justify-between border-b border-[#eee9e0] px-5 py-4"><div><div className="text-[10px] font-bold uppercase tracking-[.13em] text-[#939087]">Activity</div><h2 className="mt-1 font-[var(--app-font-serif)] text-lg font-bold tracking-[-.03em]">Recent jobs</h2></div><button onClick={() => setShowAllJobs(!showAllJobs)} className="inline-flex items-center gap-1 text-[10px] font-bold text-[#c35439]" data-testid="button-all-jobs">{showAllJobs ? 'Show fewer' : 'View all'} <ArrowRight size={12} /></button></div>
            {dashboardQuery.isLoading && jobsQuery.isLoading ? <LoadingRows /> :
              jobsQuery.isError && dashboardQuery.isError ? <div className="p-5 text-sm text-[#737982]"><div className="font-semibold text-[#414958]">Jobs could not be loaded</div><button className="mt-2 text-xs font-bold text-[#c35439] underline" onClick={() => jobsQuery.refetch()} data-testid="button-retry-jobs">Retry</button></div> :
                recentJobs.length ? <div>{recentJobs.slice(0, showAllJobs ? undefined : 5).map(job => <JobRow key={job.id} job={job} />)}</div> :
                  <div className="px-5 py-8 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-[#f1eee6] text-[#79818b]"><Blocks size={19} /></div><div className="mt-3 text-sm font-semibold text-[#454c58]">No jobs yet</div><p className="mt-1 text-xs leading-5 text-[#898c8f]">Your first reviewed solution will show up here.</p></div>}
          </section>
        </div>
      </div>
    </div>
  </AppShell>;
}

function AppShell({ children, active = 'overview' }: { children: React.ReactNode; active?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <div className="min-h-[100dvh] bg-[#f6f3eb]">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[236px] flex-col bg-[#252c3a] text-[#f5f0e8] md:flex">
      <div className="border-b border-white/10 px-5 py-6"><Brand inverse /></div>
      <div className="px-5 pt-7"><div className="mono text-[9px] uppercase tracking-[.17em] text-white/35">Workspace</div>
        <nav className="mt-3 space-y-1">
          <Link href="/" className={`flex items-center gap-3 rounded-lg px-3 py-3 text-xs font-semibold transition ${active === 'overview' ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`} data-testid="nav-overview"><Layers3 size={16} /> Overview</Link>
          <a href="#recent-jobs" onClick={e => { e.preventDefault(); document.getElementById('recent-jobs')?.scrollIntoView({ behavior: 'smooth' }); }} className="flex items-center gap-3 rounded-lg px-3 py-3 text-xs font-semibold text-white/60 transition hover:bg-white/5 hover:text-white" data-testid="nav-recent-jobs"><Activity size={16} /> Recent jobs</a>
        </nav>
      </div>
      <div className="mt-auto p-5">
        <div className="rounded-xl border border-white/10 bg-white/[.04] p-4"><div className="flex items-center gap-2 text-[11px] font-semibold"><span className="h-1.5 w-1.5 rounded-full bg-[#81b897]" /> Review gate active</div><p className="mt-2 text-[10px] leading-4 text-white/45">Generated work stays in preview until an administrator confirms.</p></div>
        <div className="mt-5 border-t border-white/10 pt-4 text-[9px] text-white/30">SMART NEHLA · PRIVATE CONTROL CENTER</div>
      </div>
    </aside>
    <div className="md:pl-[236px]">
      <header className="sticky top-0 z-20 flex h-[66px] items-center justify-between border-b border-[#e4ded4] bg-[#f8f5ee]/95 px-5 backdrop-blur sm:px-8">
        <div className="flex items-center gap-3 md:hidden"><button onClick={() => setMenuOpen(!menuOpen)} className="grid h-9 w-9 place-items-center rounded-lg border border-[#e3ddd2] bg-[#fffdf8]" aria-label="Toggle navigation" data-testid="button-toggle-menu"><ChevronDown size={16} className={menuOpen ? 'rotate-180' : ''} /></button><Brand /></div>
        <div className="hidden text-[11px] text-[#888b8e] md:block"><span className="text-[#4c5360]">Control center</span><span className="mx-2 text-[#c4beb3]">/</span>{active === 'job' ? 'Job review' : 'Overview'}</div>
        <div className="ml-auto flex items-center gap-3"><div className="hidden items-center gap-2 text-[10px] text-[#888b8e] sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-[#4d9476]" /> Admin session</div><div className="grid h-8 w-8 place-items-center rounded-full border border-[#e0dacf] bg-[#ebe7dc] text-[10px] font-bold text-[#656c75]">SN</div></div>
      </header>
      {menuOpen && <nav className="absolute z-20 w-full border-b border-[#e2ddd3] bg-[#fffdf8] px-5 py-3 md:hidden"><Link href="/" className="block py-2 text-sm font-semibold text-[#394150]" data-testid="nav-mobile-overview">Overview</Link></nav>}
      {children}
    </div>
  </div>;
}

function JobPage() {
  const [, params] = useRoute('/jobs/:id');
  const id = params?.id ? decodeURIComponent(params.id) : '';
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const jobQuery = useGetJob(id, { query: { queryKey: getGetJobQueryKey(id), enabled: !!id, refetchInterval: query => ['running', 'queued'].includes(query.state.data?.status || '') ? 3500 : false } });
  const logsQuery = useGetJobLogs(id, { query: { queryKey: getGetJobLogsQueryKey(id), enabled: !!id, refetchInterval: 2500 } });
  const runJob = useRunJob();
  const [previewData, setPreviewData] = useState<JobPreview | null>(null);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const [activeFile, setActiveFile] = useState('');
  const job = jobQuery.data;
  const logs = useMemo(() => [...(logsQuery.data ?? [])].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()), [logsQuery.data]);

  useEffect(() => {
    if (!id) return;
    try {
      const stored = sessionStorage.getItem(`smart-nehla-preview:${id}`);
      setPreviewData(stored ? JSON.parse(stored) as JobPreview : null);
    } catch { setPreviewData(null); }
  }, [id]);
  useEffect(() => {
    if (previewData?.files?.length && !activeFile) setActiveFile(previewData.files[0].path);
  }, [previewData, activeFile]);

  function confirmRun() {
    if (!job || !confirmChecked || job.status !== 'preview') return;
    setConfirmError('');
    runJob.mutate({ id: job.id, data: { confirmed: true } }, {
      onSuccess: updated => {
        qc.setQueryData(getGetJobQueryKey(id), updated);
        qc.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        qc.invalidateQueries({ queryKey: getListJobsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetJobLogsQueryKey(id) });
      },
      onError: () => setConfirmError('The run could not be confirmed. Review the job status and try again.'),
    });
  }

  const selectedFile = previewData?.files.find(file => file.path === activeFile);
  const repoUrl = job?.repositoryUrl ?? null;
  const isPreview = job?.status === 'preview';
  const isWorking = job?.status === 'queued' || job?.status === 'running';

  return <AppShell active="job">
    <main className="mx-auto max-w-[1440px] px-5 pb-12 pt-7 sm:px-8 lg:px-10">
      <Link href="/" className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-[#7d838a] transition hover:text-[#c45035]" data-testid="link-back-overview"><ArrowLeft size={14} /> Back to overview</Link>
      {jobQuery.isLoading ? <JobSkeleton /> : jobQuery.isError || !job ? <div className="rounded-2xl border border-[#e5dfd5] bg-[#fffdf8] px-6 py-16 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#f4e9e3] text-[#b45a41]"><CircleAlert size={21} /></div><h1 className="mt-4 font-[var(--app-font-serif)] text-xl font-bold">This job could not be loaded</h1><p className="mt-2 text-sm text-[#81858a]">It may have been removed, or the service is temporarily unavailable.</p><button onClick={() => jobQuery.refetch()} className="mt-5 rounded-lg bg-[#d85b3d] px-4 py-2.5 text-xs font-bold text-white" data-testid="button-retry-job">Try again</button></div> :
        <>
          <div className="mb-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div className="min-w-0"><div className="mono text-[10px] uppercase tracking-[.16em] text-[#a09a90]">Job record / {job.id.slice(0, 12)}</div><div className="mt-2 flex flex-wrap items-center gap-3"><h1 className="max-w-3xl break-words font-[var(--app-font-serif)] text-[30px] font-bold tracking-[-.055em] text-[#252b38] sm:text-[36px]">{job.repoName || 'Solution preview'}</h1><StatusPill status={job.status} /></div><p className="mt-2 max-w-3xl text-sm leading-6 text-[#747a83]">{job.summary || job.prompt}</p></div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {repoUrl && <a href={repoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-[#ded8cd] bg-[#fffdf8] px-3.5 py-2.5 text-xs font-semibold text-[#515966] hover:border-[#c7c0b5]" data-testid="link-repository"><Github size={14} /> Repository <ExternalLink size={12} /></a>}
              {job.liveUrl && <a href={job.liveUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-[#252c3a] px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-[#3a4352]" data-testid="link-live-deployment"><ExternalLink size={14} /> Open deployment</a>}
            </div>
          </div>

          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <Metric icon={Clock3} label="Created" value={formatDate(job.createdAt)} />
            <Metric icon={FileCode2} label="Generated files" value={String(previewData?.files.length ?? job.fileCount)} />
            <Metric icon={Activity} label="Pipeline progress" value={`${Math.max(0, Math.min(job.progress ?? 0, 100))}%`} progress={job.progress} />
          </div>
          {job.error && <div className="mb-5 flex gap-3 rounded-xl border border-[#edc7ba] bg-[#fff2ed] p-4 text-sm text-[#8b493d]" role="alert"><CircleAlert size={17} className="mt-0.5 shrink-0" /><div><div className="font-bold">Run needs attention</div><p className="mt-1 text-xs leading-5">{job.error}</p></div></div>}

          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(330px,.75fr)]">
            <div className="space-y-5">
              <section className="overflow-hidden rounded-2xl border border-[#e5dfd5] bg-[#fffdf8]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eee9e0] px-5 py-4"><div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.13em] text-[#d05a3d]"><Code2 size={13} /> Generated artifacts</div><h2 className="mt-1 font-[var(--app-font-serif)] text-lg font-bold tracking-[-.035em]">Review the output</h2></div>{previewData && <span className="mono rounded-md bg-[#f0eee7] px-2.5 py-1.5 text-[9px] text-[#7e807f]">{previewData.files.length} FILES · {previewData.tables.length} TABLES</span>}</div>
                {previewData ? <>
                  <div className="grid min-h-[330px] md:grid-cols-[210px_minmax(0,1fr)]">
                    <div className="border-b border-[#eee9e0] bg-[#f8f6f0] p-3 md:border-b-0 md:border-r">
                      <div className="mb-2 px-2 text-[9px] font-bold uppercase tracking-[.14em] text-[#a09a90]">Files</div>
                      <div className="space-y-1">{previewData.files.map(file => <button key={file.path} onClick={() => setActiveFile(file.path)} className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[11px] ${activeFile === file.path ? 'bg-[#eae5da] font-semibold text-[#343c49]' : 'text-[#747b84] hover:bg-[#efede6]'}`} data-testid={`button-file-${file.path.replace(/[^a-zA-Z0-9]+/g, '-')}`}><FileCode2 size={13} className="shrink-0 text-[#9b7159]" /><span className="truncate">{file.path}</span></button>)}</div>
                    </div>
                    <div className="min-w-0 bg-[#fbfaf6]">
                      <div className="flex items-center justify-between border-b border-[#eee9e0] px-4 py-3"><div className="mono truncate text-[10px] text-[#757a82]">{activeFile}</div><span className="mono text-[9px] text-[#aaa49a]">SOURCE</span></div>
                      <pre className="code-scroll max-h-[390px] overflow-auto p-4 text-[11px] leading-[1.75] text-[#424b5a]"><code>{selectedFile?.content ?? 'Select a file to inspect its generated content.'}</code></pre>
                    </div>
                  </div>
                  <div className="border-t border-[#eee9e0] p-5">
                    <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.13em] text-[#737b82]"><Database size={14} /> Data schema</div>
                    {previewData.tables.length ? <div className="grid gap-3 sm:grid-cols-2">{previewData.tables.map(table => <div key={table.name} className="overflow-hidden rounded-lg border border-[#e7e1d7]"><div className="flex items-center gap-2 border-b border-[#e7e1d7] bg-[#f6f3eb] px-3 py-2.5"><Database size={13} className="text-[#718d7c]" /><span className="mono text-[11px] font-medium text-[#46505d]">{table.name}</span><span className="ml-auto text-[9px] text-[#9d9b94]">{table.columns.length} columns</span></div><div className="divide-y divide-[#f0ece4]">{table.columns.map(col => <div key={col.name} className="flex items-center justify-between px-3 py-2 text-[10px]"><span className="mono text-[#555e69]">{col.name}</span><span className="flex items-center gap-2 text-[#92938e]"><span className="mono">{col.type}</span><span>{col.nullable ? 'nullable' : 'required'}</span></span></div>)}</div></div>)}</div> : <p className="text-xs text-[#92938e]">This preview does not define database tables.</p>}
                  </div>
                </> : <div className="p-7 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-[#f0eee7] text-[#787f88]"><FileJson2 size={19} /></div><div className="mt-3 text-sm font-semibold text-[#454c58]">Preview details are not available in this session</div><p className="mx-auto mt-1 max-w-md text-xs leading-5 text-[#888d91]">The generated preview is held in this browser session because the job API exposes status and logs separately. Its files and schema are not available after the preview session ends.</p></div>}
                {isPreview && <div className="border-t border-[#eee9e0] bg-[#fbf8f0] p-5">
                  <div className="flex items-start gap-3"><div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#e7eee7] text-[#52856a]"><ShieldCheck size={15} /></div><div><div className="text-xs font-bold text-[#37414d]">Review before running</div><p className="mt-1 text-[11px] leading-5 text-[#7c8185]">Generated code will be committed and deployment may begin only after you confirm this preview.</p></div></div>
                  <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-lg border border-[#e5dfd5] bg-[#fffdf8] p-3 text-xs leading-5 text-[#59616d]"><input type="checkbox" checked={confirmChecked} onChange={e => setConfirmChecked(e.target.checked)} className="mt-0.5 accent-[#d85b3d]" data-testid="checkbox-confirm-review" /><span>I reviewed the plan, files, and schema and approve this run.</span></label>
                  {confirmError && <p className="mt-3 text-xs text-[#a24c3d]" role="alert">{confirmError}</p>}
                  <button onClick={confirmRun} disabled={!confirmChecked || !previewData || runJob.isPending} className="focus-ring mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#d85b3d] px-4 py-3 text-xs font-bold text-white transition hover:bg-[#c44f35] disabled:cursor-not-allowed disabled:bg-[#d8d2c8] disabled:text-[#898780]" data-testid="button-confirm-run">
                    {runJob.isPending ? <><LoaderCircle size={14} className="animate-spin" /> Confirming…</> : <>Confirm review &amp; run <Rocket size={14} /></>}
                  </button>
                  {!previewData && <p className="mt-2 text-center text-[10px] text-[#a16a49]">A full preview is required before this action can be enabled.</p>}
                </div>}
              </section>
              {previewData?.plan && <section className="rounded-2xl border border-[#e5dfd5] bg-[#fffdf8] p-5"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.13em] text-[#737b82]"><Sparkles size={14} className="text-[#d05a3d]" /> Generation plan</div><div className="prose prose-sm mt-3 max-w-none whitespace-pre-wrap text-[12px] leading-6 text-[#69717c]">{previewData.plan}</div></section>}
            </div>

            <section className="overflow-hidden rounded-2xl border border-[#e5dfd5] bg-[#fffdf8]">
              <div className="flex items-center justify-between border-b border-[#eee9e0] px-5 py-4"><div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.13em] text-[#747b83]"><TerminalSquare size={14} /> Execution trace</div><h2 className="mt-1 font-[var(--app-font-serif)] text-lg font-bold tracking-[-.035em]">Persistent logs</h2></div><span className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[.1em] ${isWorking ? 'text-[#558299]' : 'text-[#858a8e]'}`}><span className={`h-1.5 w-1.5 rounded-full ${isWorking ? 'animate-pulse bg-[#558299]' : 'bg-[#9b9d9d]'}`} />{isWorking ? 'Updating' : 'Saved'}</span></div>
              {logsQuery.isError ? <div className="p-5 text-xs text-[#8b493d]"><CircleAlert size={14} className="mr-1 inline" /> Logs unavailable. <button className="font-bold underline" onClick={() => logsQuery.refetch()} data-testid="button-retry-logs">Retry</button></div> : logsQuery.isLoading ? <div className="space-y-4 p-5">{[0, 1, 2, 3].map(i => <div key={i} className="h-10 animate-pulse rounded bg-[#f0eee8]" />)}</div> : logs.length ? <div className="max-h-[620px] divide-y divide-[#f0ece4] overflow-y-auto">{logs.map(log => <LogEntry key={log.id} log={log} />)}</div> : <div className="p-8 text-center"><div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-[#f0eee7] text-[#81868d]"><Clock3 size={17} /></div><div className="mt-3 text-xs font-semibold text-[#5a626d]">No log entries yet</div><p className="mt-1 text-[10px] leading-5 text-[#92948f]">{isPreview ? 'Execution begins only after you confirm the review.' : 'Workflow messages will appear here as they are recorded.'}</p></div>}
              <div className="border-t border-[#eee9e0] bg-[#fbf9f4] px-5 py-3 text-[9px] text-[#a09d96]"><RefreshCw size={10} className="mr-1.5 inline" /> Polling saved log entries every 2.5 seconds</div>
            </section>
          </div>
        </>}
    </main>
  </AppShell>;
}

function Metric({ icon: Icon, label, value, progress }: { icon: typeof Activity; label: string; value: string; progress?: number }) {
  return <div className="rounded-xl border border-[#e5dfd5] bg-[#fffdf8] px-4 py-3.5"><div className="flex items-center gap-2 text-[10px] font-semibold text-[#92928d]"><Icon size={13} />{label}</div><div className="mt-2 flex items-center justify-between gap-3"><div className="mono text-xs font-medium text-[#46505d]">{value}</div>{progress !== undefined && <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#ece8df]"><div className="h-full rounded-full bg-[#d85b3d] transition-all" style={{ width: `${Math.max(0, Math.min(progress, 100))}%` }} /></div>}</div></div>;
}

function LogEntry({ log }: { log: JobLog }) {
  const iconClass: Record<string, string> = { info: 'text-[#648198]', success: 'text-[#4d8b6c]', warning: 'text-[#b27d32]', error: 'text-[#b44f3d]' };
  const Icon = log.level === 'success' ? CheckCircle2 : log.level === 'warning' ? TriangleAlert : log.level === 'error' ? CircleAlert : CircleDot;
  return <div className="flex gap-3 px-4 py-3.5" data-testid={`log-entry-${log.id}`}><Icon size={14} className={`mt-0.5 shrink-0 ${iconClass[log.level] || iconClass.info}`} /><div className="min-w-0 flex-1"><div className="break-words text-[11px] leading-5 text-[#525b68]">{log.message}</div><div className="mono mt-1 text-[9px] text-[#a5a198]">{formatDate(log.createdAt)}</div></div></div>;
}

function JobSkeleton() {
  return <div className="animate-pulse"><div className="h-4 w-36 rounded bg-[#e9e5dc]" /><div className="mt-6 h-10 max-w-lg rounded bg-[#e9e5dc]" /><div className="mt-3 h-4 max-w-2xl rounded bg-[#e9e5dc]" /><div className="mt-8 grid gap-3 sm:grid-cols-3">{[0, 1, 2].map(i => <div key={i} className="h-[74px] rounded-xl bg-[#ebe7de]" />)}</div><div className="mt-5 h-[420px] rounded-2xl bg-[#ebe7de]" /></div>;
}

function HomeRoute() {
  return <><Show when="signed-out"><PublicLanding /></Show><Show when="signed-in"><Dashboard /></Show></>;
}

function ProtectedJobRoute() {
  return <><Show when="signed-in"><JobPage /></Show><Show when="signed-out"><Redirect to="/" /></Show></>;
}

function SignInPage() {
  return <div className="surface-grid flex min-h-[100dvh] items-center justify-center bg-[#f6f3eb] px-4 py-10"><div className="absolute left-6 top-6 sm:left-10 sm:top-9"><Brand /></div><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div>;
}

function SignUpPage() {
  return <div className="surface-grid flex min-h-[100dvh] items-center justify-center bg-[#f6f3eb] px-4 py-10"><div className="absolute left-6 top-6 sm:left-10 sm:top-9"><Brand /></div><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div>;
}

function Router() {
  const [, setLocation] = useLocation();
  return <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={appearance} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} localization={{ signIn: { start: { title: 'Welcome back', subtitle: 'Sign in to your private control center' } }, signUp: { start: { title: 'Request workspace access', subtitle: 'Create your Smart Nehla administrator account' } } }} routerPush={to => setLocation(stripBase(to))} routerReplace={to => setLocation(stripBase(to), { replace: true })}>
    <Switch>
      <Route path="/" component={HomeRoute} />
      <Route path="/jobs/:id" component={ProtectedJobRoute} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route><div className="grid min-h-[100dvh] place-items-center bg-[#f6f3eb] p-6"><div className="text-center"><Brand /><h1 className="mt-8 font-[var(--app-font-serif)] text-2xl font-bold">Page not found</h1><p className="mt-2 text-sm text-[#7f858b]">That workspace route does not exist.</p><Link href="/" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#c45035]" data-testid="link-not-found-home"><ArrowLeft size={14} /> Back to home</Link></div></div></Route>
    </Switch>
  </ClerkProvider>;
}

function App() {
  return <QueryClientProvider client={queryClient}><WouterRouter base={basePath}><Router /></WouterRouter></QueryClientProvider>;
}

export default App;
