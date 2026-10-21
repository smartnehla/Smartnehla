import { and, asc, desc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  db,
  solutionJobLogsTable,
  solutionJobsTable,
  type SolutionJob,
} from "@workspace/db";
import {
  GetConnectionsResponse,
  GetDashboardResponse,
  GetJobLogsParams,
  GetJobLogsResponse,
  GetJobParams,
  GetJobResponse,
  ListJobsResponse,
  PreviewJobBody,
  PreviewJobResponse,
  RunJobBody,
  RunJobParams,
  RunJobResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/requireAdmin";
import { getProviderConnections, requireReadyProviders } from "../services/connections";
import {
  containsCredential,
  generateSolution,
  normalizeRepoName,
} from "../services/generation";
import { processQueuedJobs, writeJobLog } from "../services/workflow";

const router: IRouter = Router();
router.use(requireAdmin);

function toPublicJob(job: SolutionJob) {
  return {
    id: job.id,
    prompt: job.prompt,
    repoName: job.repoName,
    status: job.status,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    liveUrl: job.liveUrl,
    summary: job.summary,
    fileCount: job.generatedFiles.length,
    progress: job.progress,
    error: job.error,
  };
}

async function findOwnedJob(id: string, userId: string): Promise<SolutionJob | undefined> {
  const [job] = await db.select()
    .from(solutionJobsTable)
    .where(and(eq(solutionJobsTable.id, id), eq(solutionJobsTable.userId, userId)))
    .limit(1);
  return job;
}

router.get("/control-center/connections", async (_req, res): Promise<void> => {
  const response = GetConnectionsResponse.parse({
    providers: await getProviderConnections(),
  });
  res.json(response);
});

router.get("/control-center/dashboard", async (req, res): Promise<void> => {
  const userId = req.userId!;
  const [jobs, providers] = await Promise.all([
    db.select().from(solutionJobsTable)
      .where(eq(solutionJobsTable.userId, userId))
      .orderBy(desc(solutionJobsTable.createdAt))
      .limit(50),
    getProviderConnections(),
  ]);
  const response = GetDashboardResponse.parse({
    totalJobs: jobs.length,
    activeJobs: jobs.filter((job) => job.status === "queued" || job.status === "running").length,
    successfulDeployments: jobs.filter((job) => job.status === "succeeded").length,
    recentJobs: jobs.slice(0, 5).map(toPublicJob),
    providers,
  });
  res.json(response);
});

router.get("/jobs", async (req, res): Promise<void> => {
  const jobs = await db.select().from(solutionJobsTable)
    .where(eq(solutionJobsTable.userId, req.userId!))
    .orderBy(desc(solutionJobsTable.createdAt))
    .limit(30);
  res.json(ListJobsResponse.parse(jobs.map(toPublicJob)));
});

router.post("/jobs/preview", async (req, res): Promise<void> => {
  const body = PreviewJobBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Enter a build prompt between 12 and 4,000 characters." });
    return;
  }
  if (containsCredential(body.data.prompt)) {
    res.status(400).json({
      error: "The prompt looks like it may contain a credential. Remove it; provider credentials are configured separately.",
    });
    return;
  }

  const generated = await generateSolution(body.data.prompt);
  const id = crypto.randomUUID();
  const repoName = normalizeRepoName(generated.name, `solution-${id.slice(0, 8)}`);
  const [job] = await db.insert(solutionJobsTable).values({
    id,
    userId: req.userId!,
    prompt: body.data.prompt,
    repoName,
    status: "preview",
    summary: generated.summary,
    plan: generated.plan,
    generatedFiles: generated.files,
    generatedTables: generated.tables,
  }).returning();

  await writeJobLog(job.id, "info", "Gemini created a preview. Review files and schema before confirming.");
  const response = PreviewJobResponse.parse({
    job: toPublicJob(job),
    plan: generated.plan,
    files: generated.files,
    tables: generated.tables,
  });
  res.status(201).json(response);
});

router.get("/jobs/:id", async (req, res): Promise<void> => {
  const params = GetJobParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid job ID." });
    return;
  }
  const job = await findOwnedJob(params.data.id, req.userId!);
  if (!job) {
    res.status(404).json({ error: "Job not found." });
    return;
  }
  res.json(GetJobResponse.parse(toPublicJob(job)));
});

router.get("/jobs/:id/logs", async (req, res): Promise<void> => {
  const params = GetJobLogsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid job ID." });
    return;
  }
  const job = await findOwnedJob(params.data.id, req.userId!);
  if (!job) {
    res.status(404).json({ error: "Job not found." });
    return;
  }
  const logs = await db.select().from(solutionJobLogsTable)
    .where(eq(solutionJobLogsTable.jobId, job.id))
    .orderBy(asc(solutionJobLogsTable.createdAt))
    .limit(500);
  res.json(GetJobLogsResponse.parse(logs.map((log) => ({
    ...log,
    createdAt: log.createdAt.toISOString(),
  }))));
});

router.post("/jobs/:id/run", async (req, res): Promise<void> => {
  const params = RunJobParams.safeParse(req.params);
  const body = RunJobBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid job confirmation." });
    return;
  }
  if (!body.data.confirmed) {
    res.status(400).json({ error: "Review the generated files and confirm before running this job." });
    return;
  }
  const job = await findOwnedJob(params.data.id, req.userId!);
  if (!job) {
    res.status(404).json({ error: "Job not found." });
    return;
  }
  if (job.status !== "preview") {
    res.status(409).json({ error: "Only a preview can be confirmed." });
    return;
  }

  try {
    await requireReadyProviders();
  } catch (error) {
    res.status(409).json({
      error: error instanceof Error ? error.message : "All providers must be connected first.",
    });
    return;
  }

  const [queued] = await db.update(solutionJobsTable)
    .set({ status: "queued", progress: 1, error: null })
    .where(and(
      eq(solutionJobsTable.id, job.id),
      eq(solutionJobsTable.userId, req.userId!),
      eq(solutionJobsTable.status, "preview"),
    ))
    .returning();
  if (!queued) {
    res.status(409).json({ error: "This preview was already confirmed." });
    return;
  }
  await writeJobLog(job.id, "info", "Confirmed by an administrator. Workflow queued.");
  void processQueuedJobs();
  res.status(202).json(RunJobResponse.parse(toPublicJob(queued)));
});

export default router;
