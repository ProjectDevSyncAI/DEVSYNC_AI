import {
  Injectable,
<<<<<<< HEAD
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { ActivityService } from '../activity/activity.service.js';
=======
  NotFoundException,
} from '@nestjs/common';

>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
import { PrismaService } from '../database/prisma.service.js';
import { CreateWebhookEventDto } from './dto/create-webhook-event.dto.js';

@Injectable()
export class GithubWebhookService {
<<<<<<< HEAD
  private readonly logger = new Logger(GithubWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly activityService?: ActivityService,
  ) {}

  async create(dto: CreateWebhookEventDto) {
    const event = await this.prisma.gitHubWebhookEvent.create({
      data: {
        deliveryId: dto.deliveryId,
        eventType: dto.eventType as any,
        action: dto.action,
        repositoryId: dto.repositoryId,
        payload: dto.payload as any,
      },
    });

    try {
      await this.processEvent(dto);
      await this.prisma.gitHubWebhookEvent.update({
        where: { id: event.id },
        data: {
          processed: true,
          processedAt: new Date(),
          errorMessage: null,
        },
      });
    } catch (err: any) {
      this.logger.error(`Error processing webhook delivery ${dto.deliveryId}: ${err.message}`, err.stack);
      await this.prisma.gitHubWebhookEvent.update({
        where: { id: event.id },
        data: {
          processed: false,
          errorMessage: err.message,
        },
      });
    }

    return event;
  }

  async processEvent(dto: {
    eventType: string;
    action?: string;
    repositoryId?: string;
    payload: Record<string, any>;
  }) {
    const payload = dto.payload;
    const eventType = (dto.eventType || '').toUpperCase();

    let repo: any = null;
    if (dto.repositoryId) {
      repo = await this.prisma.repository.findUnique({
        where: { id: dto.repositoryId },
      });
    }

    if (!repo && payload?.repository) {
      const repoFullName = payload.repository.full_name;
      const githubId = String(payload.repository.id);

      repo = await this.prisma.repository.findFirst({
        where: {
          OR: [
            { githubId },
            { fullName: repoFullName },
          ],
        },
      });

      if (!repo) {
        const org = await this.prisma.organization.findFirst();
        if (org) {
          const project = await this.prisma.project.findFirst({
            where: { organizationId: org.id },
          });

          repo = await this.prisma.repository.create({
            data: {
              organizationId: org.id,
              projectId: project?.id ?? null,
              githubId,
              name: payload.repository.name ?? 'repository',
              fullName: repoFullName ?? payload.repository.name,
              url: payload.repository.html_url ?? `https://github.com/${repoFullName}`,
              defaultBranch: payload.repository.default_branch ?? 'main',
              language: payload.repository.language ?? null,
            },
          });
        }
      }
    }

    if (!repo) {
      this.logger.warn(`No repository found to link webhook event ${eventType}`);
      return;
    }

    if (eventType === 'PUSH') {
      const commits = payload.commits || [];
      const ref = payload.ref || 'refs/heads/main';
      const branchName = ref.replace('refs/heads/', '');

      const executePush = async (tx: any) => {
        for (const c of commits) {
          if (!c.id) continue;
          const commitSha = c.id;
          const message = c.message || 'Commit message';
          const committedAt = c.timestamp ? new Date(c.timestamp) : new Date();
          const additions = Array.isArray(c.added) ? c.added.length : 0;
          const deletions = Array.isArray(c.removed) ? c.removed.length : 0;
          const changedFiles = additions + deletions + (Array.isArray(c.modified) ? c.modified.length : 0);

          await tx.commit.upsert({
            where: { sha: commitSha },
            update: {
              message,
              branch: branchName,
              committedAt,
            },
            create: {
              repositoryId: repo.id,
              projectId: repo.projectId,
              sha: commitSha,
              message,
              branch: branchName,
              committedAt,
              additions,
              deletions,
              changedFiles,
            },
          });
        }

        if (this.activityService && repo.projectId && commits.length > 0) {
          await this.activityService.createEvent(
            {
              projectId: repo.projectId,
              userId: null,
              type: 'GITHUB_COMMITS_SYNCED',
              title: `Synced ${commits.length} commits for ${repo.fullName}`.slice(0, 250),
              description: `Branch: ${branchName}, Commits: ${commits.length}`,
              entityType: 'REPOSITORY',
              entityId: repo.id,
              metadata: {
                repositoryId: repo.id,
                repositoryName: repo.fullName,
                branch: branchName,
                commitCount: commits.length,
              },
            },
            tx,
          );
        }
      };

      if (typeof this.prisma?.$transaction === 'function') {
        await this.prisma.$transaction(executePush);
      } else {
        await executePush(this.prisma);
      }
      this.logger.log(`Synced ${commits.length} commits for repository ${repo.fullName}`);
    } else if (eventType === 'PULL_REQUEST') {
      const pr = payload.pull_request;
      if (pr) {
        let status = 'OPEN';
        if (pr.merged) status = 'MERGED';
        else if (pr.state === 'closed') status = 'CLOSED';

        const executePr = async (tx: any) => {
          await tx.pullRequest.upsert({
            where: { githubId: String(pr.id) },
            update: {
              title: pr.title,
              description: pr.body || '',
              status: status as any,
              sourceBranch: pr.head?.ref || 'feature',
              targetBranch: pr.base?.ref || 'main',
              mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
              closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
              additions: pr.additions || 0,
              deletions: pr.deletions || 0,
              changedFiles: pr.changed_files || 0,
            },
            create: {
              repositoryId: repo.id,
              projectId: repo.projectId,
              githubId: String(pr.id),
              number: pr.number,
              title: pr.title,
              description: pr.body || '',
              sourceBranch: pr.head?.ref || 'feature',
              targetBranch: pr.base?.ref || 'main',
              status: status as any,
              openedAt: new Date(pr.created_at || Date.now()),
              mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
              closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
              additions: pr.additions || 0,
              deletions: pr.deletions || 0,
              changedFiles: pr.changed_files || 0,
            },
          });

          if (this.activityService && repo.projectId) {
            await this.activityService.createEvent(
              {
                projectId: repo.projectId,
                userId: null,
                type: 'GITHUB_PR_SYNCED',
                title: `Synced PR #${pr.number}: ${pr.title}`.slice(0, 250),
                description: `Status: ${status}`,
                entityType: 'PULL_REQUEST',
                entityId: String(pr.id),
                metadata: {
                  repositoryId: repo.id,
                  prNumber: pr.number,
                  status,
                  title: pr.title,
                },
              },
              tx,
            );
          }
        };

        if (typeof this.prisma?.$transaction === 'function') {
          await this.prisma.$transaction(executePr);
        } else {
          await executePr(this.prisma);
        }
        this.logger.log(`Synced PR #${pr.number} (${status}) for repository ${repo.fullName}`);
      }
    } else if (eventType === 'ISSUES') {
      const issue = payload.issue;
      if (issue && repo.projectId) {
        let status = 'OPEN';
        if (issue.state === 'closed') status = 'RESOLVED';

        const defaultUser = await this.prisma.user.findFirst();
        if (defaultUser) {
          const executeIssue = async (tx: any) => {
            let issueRecordId = '';
            const existingIssue = await tx.issue.findFirst({
              where: { githubId: String(issue.id) },
            });

            if (existingIssue) {
              issueRecordId = existingIssue.id;
              await tx.issue.update({
                where: { id: existingIssue.id },
                data: {
                  title: issue.title,
                  description: issue.body || '',
                  status: status as any,
                  resolvedAt: issue.closed_at ? new Date(issue.closed_at) : null,
                },
              });
            } else {
              const created = await tx.issue.create({
                data: {
                  projectId: repo.projectId,
                  repositoryId: repo.id,
                  reporterId: defaultUser.id,
                  creatorId: defaultUser.id,
                  githubId: String(issue.id),
                  title: issue.title,
                  description: issue.body || '',
                  status: status as any,
                  resolvedAt: issue.closed_at ? new Date(issue.closed_at) : null,
                },
              });
              issueRecordId = created.id;
            }

            if (this.activityService && repo.projectId) {
              await this.activityService.createEvent(
                {
                  projectId: repo.projectId,
                  userId: null,
                  type: 'GITHUB_ISSUE_SYNCED',
                  title: `Synced GitHub Issue #${issue.number || issue.id}: ${issue.title}`.slice(0, 250),
                  description: `Status: ${status}`,
                  entityType: 'ISSUE',
                  entityId: issueRecordId || String(issue.id),
                  metadata: {
                    repositoryId: repo.id,
                    issueNumber: issue.number,
                    status,
                    title: issue.title,
                  },
                },
                tx,
              );
            }
          };

          if (typeof this.prisma?.$transaction === 'function') {
            await this.prisma.$transaction(executeIssue);
          } else {
            await executeIssue(this.prisma);
          }
          this.logger.log(`Synced Issue #${issue.number} for repository ${repo.fullName}`);
        }
      }
    }
=======
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateWebhookEventDto) {
    return this.prisma.gitHubWebhookEvent.create({
      data: {
        deliveryId: dto.deliveryId,

        // Prisma enum value
        eventType: dto.eventType as any,

        action: dto.action,

        repositoryId: dto.repositoryId,

        // JSON payload
        payload: dto.payload as any,
      },
    });
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  }

  async findAll() {
    return this.prisma.gitHubWebhookEvent.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string) {
    const event =
      await this.prisma.gitHubWebhookEvent.findUnique({
        where: {
          id,
        },
      });

    if (!event) {
      throw new NotFoundException(
        'GitHub webhook event not found',
      );
    }

    return event;
  }

  async markProcessed(id: string) {
    await this.findById(id);

    return this.prisma.gitHubWebhookEvent.update({
      where: {
        id,
      },
      data: {
        processed: true,
        processedAt: new Date(),
        errorMessage: null,
      },
    });
  }

  async markFailed(
    id: string,
    errorMessage: string,
  ) {
    await this.findById(id);

    return this.prisma.gitHubWebhookEvent.update({
      where: {
        id,
      },
      data: {
        processed: false,
        errorMessage,
      },
    });
  }
}