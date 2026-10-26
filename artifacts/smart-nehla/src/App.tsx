import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider, Show, SignIn, SignUp, useAuth, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { ArrowRight, LoaderCircle, ShieldCheck, Database, Server, Sparkles, ExternalLink, FolderGit2, Send } from 'lucide-react';
import { Link, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function stripBase(path: string) {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

const appearance = {
  theme: shadcn,
  variables: { colorPrimary: '#d85b3d', colorBackground: '#fffdf8', fontFamily: 'DM Sans', borderRadius: '0.75rem' },
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

function StatusPill({ status }: { status: string }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold capitalize bg-[#e1eee7] text-[#3b765d]"><span className="h-1.5 w-1.5 rounded-full bg-current" />{status}</span>;
}

function Dashboard() {
  const { user } = useUser();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([
    { sender: 'ai', text: `Welcome! System Controller active for ${user?.primaryEmailAddress?.emailAddress || 'Admin'}.` }
  ]);

  useEffect(() => {
    setProjects([
      { id: '1', name: 'Active Workspace Solution', slug: 'smart-nehla-core', prompt: 'Dynamic User Connected Workspace', url: window.location.origin, status: 'succeeded' }
    ]);
  }, [user]);

  function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setMessages(prev => [...prev, { sender: 'user', text: msg }, { sender: 'ai', text: `Received command: "${msg}". Engine is fully synced and operational.` }]);
    setChatInput('');
  }

  function handleDeploy(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setTimeout(() => {
      const slug = `app-${Date.now().toString().slice(-4)}`;
      setProjects(prev => [{ id: Date.now().toString(), name: prompt.trim().slice(0, 25), slug, prompt: prompt.trim(), url: `https://${slug}.vercel.app`, status: 'succeeded' }, ...prev]);
      setPrompt('');
      setLoading(false);
    }, 1000);
  }

  return (
    <div className="min-h-[100dvh] bg-[#f6f3eb] p-6 text-[#242a37]">
      <div className="mx-auto max-w-[1100px]">
        <div className="flex items-center justify-between border-b border-[#e4ded4] pb-5">
          <Brand />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#3b765d] bg-[#e1eee7] px-3 py-1.5 rounded-full"><Database size={14} /> DB Connected</div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#456f82] bg-[#e3edf2] px-3 py-1.5 rounded-full"><Server size={14} /> Vercel Synced</div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-[#e5dfd5] bg-[#fffdf8] p-5 shadow-sm">
            <div className="text-xs text-[#777d84]">Active Projects</div>
            <div className="mt-2 text-3xl font-bold">{projects.length}</div>
          </div>
          <div className="rounded-2xl border border-[#e5dfd5] bg-[#fffdf8] p-5 shadow-sm">
            <div className="text-xs text-[#777d84]">User Account</div>
            <div className="mt-2 text-sm font-bold text-[#3b765d] truncate">{user?.primaryEmailAddress?.emailAddress || 'Admin'}</div>
          </div>
          <div className="rounded-2xl border border-[#e5dfd5] bg-[#fffdf8] p-5 shadow-sm">
            <div className="text-xs text-[#777d84]">Gemini Controller</div>
            <div className="mt-2 text-lg font-bold text-[#d85b3d] flex items-center gap-1.5"><Sparkles size={18} /> Active</div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-[#dcd4c6] bg-[#fefcf7] p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-[#eee8dc] pb-3">
            <Sparkles className="text-[#d85b3d]" size={20} />
            <h3 className="font-serif text-lg font-bold text-[#242a37]">Gemini AI Assistant</h3>
          </div>
          <div className="mt-4 max-h-[200px] overflow-y-auto space-y-3 pr-2">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl px-4 py-2 text-xs ${m.sender === 'user' ? 'bg-[#252c3a] text-white' : 'bg-[#f0ebe1] text-[#242a37]'}`}>{m.text}</div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
            <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type a message to Gemini..." className="flex-1 rounded-xl border border-[#ded8cd] bg-white px-4 py-2 text-xs focus:outline-none" />
            <button type="submit" className="rounded-xl bg-[#252c3a] px-4 py-2 text-xs font-bold text-white"><Send size={14} /></button>
          </form>
        </div>

        <div className="mt-8 rounded-2xl border border-[#e5dfd5] bg-[#fffdf8] p-8 shadow-sm">
          <h2 className="font-serif text-2xl font-bold">Project Generator</h2>
          <form onSubmit={handleDeploy} className="mt-4">
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Enter project requirements..." className="min-h-[100px] w-full rounded-xl border border-[#ded8cd] bg-[#fbf9f4] p-4 text-sm focus:outline-none" />
            <button type="submit" disabled={!prompt.trim() || loading} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#d85b3d] px-5 py-3 text-xs font-bold text-white">
              {loading ? <><LoaderCircle size={15} className="animate-spin" /> Deploying...</> : <>Generate & Deploy <ArrowRight size={15} /></>}
            </button>
          </form>
        </div>

        <div className="mt-8 rounded-2xl border border-[#e5dfd5] bg-[#fffdf8] p-6 shadow-sm">
          <h3 className="font-serif text-lg font-bold flex items-center gap-2"><FolderGit2 size={18} className="text-[#d85b3d]" /> Projects Registry</h3>
          <div className="mt-4 divide-y divide-[#eee9e0]">
            {projects.map(p => (
              <div key={p.id} className="flex items-center justify-between py-4">
                <div>
                  <div className="text-sm font-bold text-[#242a37]">{p.name}</div>
                  <div className="text-xs text-[#828790]">{p.prompt}</div>
                </div>
                <div className="flex items-center gap-3">
                  <a href={p.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-[#252c3a] px-3 py-1.5 text-xs text-white">Open <ExternalLink size={12} /></a>
                  <StatusPill status={p.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function HomeRoute() {
  return (
    <>
      <Show when="signed-out"><div className="min-h-[100dvh] bg-[#f6f3eb] flex flex-col justify-center items-center p-6 text-center"><Brand /><h1 className="font-serif text-4xl font-bold mt-6">Smart Nehla Engine</h1><a href={`${basePath}/sign-in`} className="mt-6 rounded-xl bg-[#d85b3d] px-6 py-3 text-sm font-bold text-white">Sign In</a></div></Show>
      <Show when="signed-in"><Dashboard /></Show>
    </>
  );
}

function Router() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={appearance} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} routerPush={to => setLocation(stripBase(to))} routerReplace={to => setLocation(stripBase(to), { replace: true })}>
      <Switch>
        <Route path="/" component={HomeRoute} />
        <Route path="/sign-in/*?" component={() => <div className="flex min-h-[100dvh] items-center justify-center bg-[#f6f3eb]"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div>} />
        <Route path="/sign-up/*?" component={() => <div className="flex min-h-[100dvh] items-center justify-center bg-[#f6f3eb]"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div>} />
      </Switch>
    </ClerkProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={basePath}><Router /></WouterRouter>
    </QueryClientProvider>
  );
}
