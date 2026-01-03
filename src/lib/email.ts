import nodemailer from 'nodemailer';
import { SnapshotData, WeeklyAnalysis } from './constants';
import { formatCurrency, formatPercent } from './defillama';

interface EmailContent {
  snapshot: SnapshotData;
  analysis: WeeklyAnalysis;
  socialPosts: {
    twitter: string;
    linkedin: string;
  };
}

export async function sendWeeklyEmail(content: EmailContent): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Build the HTML email
  const html = buildEmailHtml(content, dateStr);
  const text = buildEmailText(content, dateStr);

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: process.env.EMAIL_TO,
    subject: `📊 Weekly Stablecoin Flow Update - ${dateStr}`,
    text,
    html,
  });
}

function buildEmailHtml(content: EmailContent, dateStr: string): string {
  const { snapshot, analysis, socialPosts } = content;

  // Build table rows
  const tableRows = snapshot.chains
    .map(
      (chain) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${chain.rank}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${chain.chain}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-family: monospace;">${formatCurrency(chain.stableTvl)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-family: monospace;">${formatPercent(chain.utilPercent)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-family: monospace;">${formatPercent(chain.stblDefiPercent)}</td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Stablecoin Flow Update</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h1 style="margin: 0 0 8px 0; font-size: 24px; color: #111827;">📊 Weekly Stablecoin Flow Update</h1>
    <p style="margin: 0 0 24px 0; color: #6b7280;">${dateStr}</p>

    <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #111827;">Key Insights</h2>
    <ul style="margin: 0 0 32px 0; padding-left: 24px;">
      ${analysis.bullets.map((b) => `<li style="margin-bottom: 12px;">${b}</li>`).join('')}
    </ul>

    <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #111827;">Chain Rankings</h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px; font-size: 14px;">
      <thead>
        <tr style="background: #f9fafb;">
          <th style="padding: 12px; border-bottom: 2px solid #e5e7eb; text-align: center;">Rank</th>
          <th style="padding: 12px; border-bottom: 2px solid #e5e7eb; text-align: left;">Chain</th>
          <th style="padding: 12px; border-bottom: 2px solid #e5e7eb; text-align: right;">Stable TVL</th>
          <th style="padding: 12px; border-bottom: 2px solid #e5e7eb; text-align: right;">Util %</th>
          <th style="padding: 12px; border-bottom: 2px solid #e5e7eb; text-align: right;">Stbl/DeFi</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
      <tfoot>
        <tr style="background: #f9fafb; font-weight: 600;">
          <td style="padding: 12px;"></td>
          <td style="padding: 12px;">TOTAL</td>
          <td style="padding: 12px; text-align: right; font-family: monospace;">${formatCurrency(snapshot.totals.stableTvl)}</td>
          <td style="padding: 12px; text-align: right; font-family: monospace;">${formatPercent(snapshot.totals.utilPercent)}</td>
          <td style="padding: 12px; text-align: right; font-family: monospace;">${formatPercent(snapshot.totals.stblDefiPercent)}</td>
        </tr>
      </tfoot>
    </table>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

    <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #111827;">📱 Social Posts (Copy & Paste)</h2>

    <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Twitter</h3>
    <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px; white-space: pre-wrap; font-size: 14px;">${socialPosts.twitter}</div>

    <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">LinkedIn</h3>
    <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px; white-space: pre-wrap; font-size: 14px;">${socialPosts.linkedin}</div>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

    <p style="margin: 0; font-size: 14px; color: #6b7280; text-align: center;">
      View the full dashboard at <a href="https://stablecoin-tracker.vercel.app" style="color: #3b82f6;">stablecoin-tracker.vercel.app</a>
    </p>
  </div>
</body>
</html>
`;
}

function buildEmailText(content: EmailContent, dateStr: string): string {
  const { snapshot, analysis, socialPosts } = content;

  const tableRows = snapshot.chains
    .map(
      (chain) =>
        `${chain.rank}. ${chain.chain.padEnd(12)} ${formatCurrency(chain.stableTvl).padStart(12)} ${formatPercent(chain.utilPercent).padStart(8)} ${formatPercent(chain.stblDefiPercent).padStart(10)}`
    )
    .join('\n');

  return `
WEEKLY STABLECOIN FLOW UPDATE
${dateStr}

=== KEY INSIGHTS ===

${analysis.bullets.map((b, i) => `${i + 1}. ${b}`).join('\n\n')}

=== CHAIN RANKINGS ===

Rank Chain        Stable TVL    Util %  Stbl/DeFi
${'-'.repeat(60)}
${tableRows}
${'-'.repeat(60)}
     TOTAL       ${formatCurrency(snapshot.totals.stableTvl).padStart(12)} ${formatPercent(snapshot.totals.utilPercent).padStart(8)} ${formatPercent(snapshot.totals.stblDefiPercent).padStart(10)}

=== SOCIAL POSTS ===

--- TWITTER ---
${socialPosts.twitter}

--- LINKEDIN ---
${socialPosts.linkedin}

---
View the full dashboard: https://stablecoin-tracker.vercel.app
`;
}
