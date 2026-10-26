// Smart Nehla Solution Engine - 100% Safe Clean App.tsx
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider, Show, SignIn, SignUp } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { ArrowRight } from 'lucide-react';
import { Link, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';

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
  variables: {
    colorPrimary: '#d85b3d',
    colorBackground: '#fffdf8',
    fontFamily: 'DM Sans',
    borderRadius: '0.75rem',
  },
};

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-[13px] bg-[#d85b3d] text-white shadow-sm">
        <span className="font-serif text-[20px] font-extrabold leading-none">N</span>
      </div>
      <div>
        <div className="font-serif text-[15px] font-extrabold tracking-[-.04em] text-[#222a38]">smart nehla</div>
        <div className="mono mt-0.5 text-[9px] uppercase tracking-[.18em] text-[#9b958a]">solution engine</div>
      </div>
    </div>
  );
}

function PublicLanding() {
  return (
    <main className="min-h-[100dvh] bg-[#f6f3eb] text-[#242a37] p-8 flex flex-col justify-between">
      <header className="flex items-center justify-between max-w-[1200px] mx-auto w-full">
        <Brand />
        <div className="flex items-center gap-3">
          <a href={`${basePath}/sign-in`} className="rounded-lg px-4 py-2 text-sm font-semibold text-[#3a4150] bg-[#ebe7dd]">Sign in</a>
          <a href={`${basePath}/sign-up`} className="rounded-lg bg-[#252c3a] px-4 py-2 text-sm font-semibold text-[#fbf8f0]">Get Access</a>
        </div>
      </header>
      <div className="max-w-[800px] mx-auto text-center my-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#d9d3c8] bg-[#faf8f2] px-4 py-1.5 text-xs font-semibold text-[#5e766a] mb-6">
          <span className="h-2 w-2 rounded-full bg-[#4d9476]" /> Autonomous Control Center Online
        </div>
        <h1 className="font-serif text-5xl font-bold tracking-tight text-[#242a37]">
          From clear idea to <span className="text-[#d85b3d]">live automated</span> solution.
        </h1>
        <p className="mt-4 text-base text-[#68707c]">
          Manage your micro-apps, automated pipelines, and deployments from a single secure control hub.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <a href={`${basePath}/sign-in`} className="inline-flex items-center gap-2 rounded-xl bg-[#d85b3d] px-6 py-3.5 text-sm font-bold text-white shadow hover:bg-[#c64e34]">
            Open Control Center <ArrowRight size={16} />
          </a>
        </div>
      </div>
      <footer className="text-center text-xs text-[#8a8d91]">Smart Nehla Private Control Center</footer>
    </main>
  );
}

function Dashboard() {
  const [prompt, setPrompt] = useState('');
  return (
    <div className="min-h-[100dvh] bg-[#f6f3eb] p-6 text-[#242a37]">
      <div className="mx-auto max-w-[1000px]">
        <div className="flex items-center justify-between border-b border-[#e4ded4] pb-5">
          <Brand />
          <span className="text-xs font-semibold text-[#4a9676]">● Admin Connected</span>
        </div>
        <div className="mt-8 rounded-2xl border border-[#e5dfd5] bg-[#fffdf8] p-8 shadow-sm">
          <h2 className="font-serif text-2xl font-bold">Solution Control Dashboard</h2>
          <p className="mt-2 text-sm text-[#777d84]">Enter your requirements to generate and deploy your micro-apps instantly.</p>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Describe what you want to build or automate..."
            className="mt-4 min-h-[140px] w-full rounded-xl border border-[#ded8cd] bg-[#fbf9f4] p-4 text-sm text-[#343b48]"
          />
          <button
            onClick={() => alert('Solution request registered in engine pipeline!')}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#d85b3d] px-5 py-3 text-xs font-bold text-white hover:bg-[#c44f35]"
          >
            Deploy Solution <ArrowRight size={15} />
          </button>
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
        <Route path="/sign-in/*?" component={() => <div className="flex min-h-[100dvh] items-center justify-center bg-[#f6f3eb]"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div>} />
        <Route path="/sign-up/*?" component={() => <div className="flex min-h-[100dvh] items-center justify-center bg-[#f6f3eb]"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div>} />
        <Route><div className="p-12 text-center font-serif text-xl">Page not found. <Link href="/" className="text-[#d85b3d] underline">Return home</Link></div></Route>
      </Switch>
    </ClerkProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={basePath}>
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
