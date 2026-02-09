import { env } from './env';

interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  fields?: Array<{ type: string; text: string }>;
}

export function isSlackEnabled(): boolean {
  return env.SLACK_ENABLED === 'true' && !!env.SLACK_BOT_TOKEN && !!env.SLACK_CHANNEL_ID;
}

export async function postToSlack(blocks: SlackBlock[], text: string): Promise<void> {
  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channel: env.SLACK_CHANNEL_ID,
      text,
      blocks,
    }),
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const data = await response.json();
  if (!response.ok || !(data as { ok: boolean }).ok) {
    throw new Error(`Slack API error: ${JSON.stringify(data)}`);
  }
}

export function buildSummaryBlocks(
  userName: string,
  stats: { total: number; byStatus: Record<string, number>; byPriority: Record<string, number> },
  openTasks: Array<{ title: string; priority: string; status: string }>,
  completedTasks: Array<{ title: string; priority: string }>
): SlackBlock[] {
  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: 'Task Summary', emoji: true },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Submitted by:* ${userName}\n*Total tasks:* ${stats.total}`,
      },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Pending:* ${stats.byStatus.pending || 0}` },
        { type: 'mrkdwn', text: `*In Progress:* ${stats.byStatus.inProgress || 0}` },
        { type: 'mrkdwn', text: `*Completed:* ${stats.byStatus.completed || 0}` },
        { type: 'mrkdwn', text: `*High Priority:* ${stats.byPriority.high || 0}` },
      ],
    },
  ];

  if (openTasks.length > 0) {
    const taskList = openTasks
      .slice(0, 10)
      .map((t) => {
        const priority = t.priority === 'HIGH' ? '!!!' : t.priority === 'MEDIUM' ? '!!' : '!';
        const status = t.status === 'IN_PROGRESS' ? 'In Progress' : 'Pending';
        return `- [${priority}] ${t.title} _(${status})_`;
      })
      .join('\n');

    blocks.push(
      { type: 'divider' } as SlackBlock,
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Open Tasks (${openTasks.length}):*\n${taskList}${openTasks.length > 10 ? `\n_...and ${openTasks.length - 10} more_` : ''}`,
        },
      }
    );
  }

  if (completedTasks.length > 0) {
    const completedList = completedTasks
      .slice(0, 5)
      .map((t) => `- ~${t.title}~`)
      .join('\n');

    blocks.push(
      { type: 'divider' } as SlackBlock,
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Recently Completed (${completedTasks.length}):*\n${completedList}${completedTasks.length > 5 ? `\n_...and ${completedTasks.length - 5} more_` : ''}`,
        },
      }
    );
  }

  return blocks;
}
