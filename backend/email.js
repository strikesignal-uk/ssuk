import { Resend } from 'resend';
import { getSettings } from './settings.js';

async function getResendClient() {
  const settings = await getSettings();
  const apiKey = settings.resendApiKey || process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return { client: new Resend(apiKey), from: settings.emailFrom || process.env.EMAIL_FROM || 'StrikeSignal Alerts <alerts@mail.strikesignal.pro>' };
}

/* ── Shared email shell ── */
function emailLayout(content) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0b1120;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0b1120;padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

<!-- Header -->
<tr><td style="background:#0a0f1e;padding:28px 32px;border-radius:16px 16px 0 0;border-bottom:1px solid #1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td>
      <img src="https://strikesignal.pro/logo.png" alt="StrikeSignal" width="140" style="display:block;max-width:140px;height:auto;" />
    </td>
    <td align="right">
      <div style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);border-radius:20px;padding:6px 14px;">
        <span style="color:#60a5fa;font-size:11px;font-weight:700;letter-spacing:1px;">&#9917; ALERT</span>
      </div>
    </td>
  </tr></table>
</td></tr>

<!-- Body -->
<tr><td style="background:#111827;padding:0;">${content}</td></tr>

<!-- Footer -->
<tr><td style="background:#0f172a;padding:24px 32px;border-radius:0 0 16px 16px;border-top:1px solid #1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td><span style="color:#475569;font-size:11px;">Powered by StrikeSignal</span><br><span style="color:#334155;font-size:10px;">AI-Enhanced xG Analysis &bull; Real-Time Alerts</span></td>
    <td align="right"><span style="color:#334155;font-size:10px;">izentsport.xyz</span></td>
  </tr></table>
</td></tr>

</table></td></tr></table>
</body></html>`;
}

function confidenceBadge(confidence) {
  const map = {
    high:   { bg: '#065f46', fg: '#6ee7b7', label: '&#128293; HIGH' },
    medium: { bg: '#92400e', fg: '#fcd34d', label: '&#9888;&#65039; MEDIUM' },
    low:    { bg: '#7f1d1d', fg: '#fca5a5', label: 'LOW' },
  };
  const c = map[confidence] || map.medium;
  return `<span style="background:${c.bg};color:${c.fg};font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;letter-spacing:.5px;">${c.label}</span>`;
}

/* ─────────── Welcome email ─────────── */
export async function sendWelcomeEmail(email, name) {
  const r = await getResendClient();
  if (!r) return;

  const content = `
  <div style="padding:32px;">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:72px;height:72px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);border-radius:50%;margin:0 auto;text-align:center;line-height:72px;font-size:36px;box-shadow:0 8px 32px rgba(59,130,246,.3);">&#128075;</div>
    </div>
    <h1 style="color:#f1f5f9;font-size:24px;text-align:center;margin:0 0 8px;">Welcome aboard, ${name}!</h1>
    <p style="color:#94a3b8;text-align:center;font-size:14px;margin:0 0 28px;">Your StrikeSignal account is ready. Here&rsquo;s what you&rsquo;ll get:</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background:#1e293b;border-radius:12px;padding:16px;width:50%;vertical-align:top;">
          <div style="font-size:28px;margin-bottom:8px;">&#127919;</div>
          <div style="color:#e2e8f0;font-size:13px;font-weight:600;">Smart Signals</div>
          <div style="color:#64748b;font-size:11px;margin-top:4px;">AI-powered betting alerts based on live xG data</div>
        </td>
        <td width="12"></td>
        <td style="background:#1e293b;border-radius:12px;padding:16px;width:50%;vertical-align:top;">
          <div style="font-size:28px;margin-bottom:8px;">&#128231;</div>
          <div style="color:#e2e8f0;font-size:13px;font-weight:600;">Email Alerts</div>
          <div style="color:#64748b;font-size:11px;margin-top:4px;">Instant notifications when opportunities arise</div>
        </td>
      </tr>
      <tr><td colspan="3" height="12"></td></tr>
      <tr>
        <td style="background:#1e293b;border-radius:12px;padding:16px;width:50%;vertical-align:top;">
          <div style="font-size:28px;margin-bottom:8px;">&#128200;</div>
          <div style="color:#e2e8f0;font-size:13px;font-weight:600;">Live Stats</div>
          <div style="color:#64748b;font-size:11px;margin-top:4px;">Real-time match data and xG analysis</div>
        </td>
        <td width="12"></td>
        <td style="background:#1e293b;border-radius:12px;padding:16px;width:50%;vertical-align:top;">
          <div style="font-size:28px;margin-bottom:8px;">&#129302;</div>
          <div style="color:#e2e8f0;font-size:13px;font-weight:600;">AI Insights</div>
          <div style="color:#64748b;font-size:11px;margin-top:4px;">Gemini-powered predictions for every signal</div>
        </td>
      </tr>
    </table>

    <div style="text-align:center;">
      <a href="https://strikesignal.netlify.app" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#3b82f6);color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:14px;box-shadow:0 4px 16px rgba(37,99,235,.4);">Open StrikeSignal &#8594;</a>
    </div>
  </div>`;

  try {
    await r.client.emails.send({ from: r.from, to: email, subject: '⚡ Welcome to StrikeSignal — Your account is ready!', html: emailLayout(content) });
    console.log(`Welcome email sent to ${email}`);
  } catch (err) {
    console.error(`Welcome email failed for ${email}:`, err.message);
  }
}

/* ─────────── Test email ─────────── */
export async function sendTestEmail(toEmail) {
  const r = await getResendClient();
  if (!r) return { error: 'Resend API key not configured' };

  const content = `
  <div style="padding:32px;">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:64px;height:64px;background:linear-gradient(135deg,#059669,#10b981);border-radius:50%;margin:0 auto;text-align:center;line-height:64px;font-size:32px;box-shadow:0 8px 32px rgba(16,185,129,.3);">&#9989;</div>
    </div>
    <h1 style="color:#f1f5f9;font-size:22px;text-align:center;margin:0 0 8px;">Test Email Successful!</h1>
    <p style="color:#94a3b8;text-align:center;font-size:14px;margin:0 0 24px;">Your Resend integration is working correctly.</p>
    <div style="background:#1e293b;border-radius:12px;padding:20px;border-left:4px solid #10b981;">
      <p style="color:#e2e8f0;font-size:13px;margin:0 0 8px;font-weight:600;">&#9989; Connection verified</p>
      <p style="color:#94a3b8;font-size:12px;margin:0;">Users will receive beautifully designed alerts whenever new betting opportunities are detected by our AI system.</p>
    </div>
  </div>`;

  try {
    const { data, error } = await r.client.emails.send({ from: r.from, to: toEmail, subject: '✅ StrikeSignal — Test Email Successful', html: emailLayout(content) });
    if (error) { console.error(`Test email failed for ${toEmail}:`, error); return { error: error.message || JSON.stringify(error) }; }
    console.log(`Test email sent to ${toEmail}, id: ${data?.id}`);
    return { success: true, emailId: data?.id };
  } catch (err) {
    console.error(`Test email failed for ${toEmail}:`, err.message);
    return { error: err.message };
  }
}

/* ─────────── Signal notification ─────────── */
export async function sendSignalNotification(users, signal) {
  const r = await getResendClient();
  if (!r) {
    console.error('Signal notification skipped: Resend API key not configured (set in admin settings or RESEND_API_KEY env var)');
    return;
  }
  if (!users.length) return;

  console.log(`Sending signal notification to ${users.length} user(s) for ${signal.home} vs ${signal.away}`);

  const homeScore = signal.score?.home ?? 0;
  const awayScore = signal.score?.away ?? 0;
  // expectedScore can be a string like "2-1" or an object {home, away}
  let expectedHome = '?', expectedAway = '?';
  if (typeof signal.expectedScore === 'string' && signal.expectedScore.includes('-')) {
    const parts = signal.expectedScore.split('-');
    expectedHome = parts[0].trim();
    expectedAway = parts[1].trim();
  } else if (signal.expectedScore && typeof signal.expectedScore === 'object') {
    expectedHome = signal.expectedScore.home ?? '?';
    expectedAway = signal.expectedScore.away ?? '?';
  }

  const content = `
  <div style="padding:0;">

    <!-- Red alert banner -->
    <div style="background:linear-gradient(135deg,#dc2626,#ef4444);padding:16px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td>
          <span style="color:#fff;font-size:16px;font-weight:800;">&#128680; Betting Opportunity!</span><br>
          <span style="color:#fecaca;font-size:12px;">Live match with overdue goals detected</span>
        </td>
        <td align="right">${confidenceBadge(signal.confidence)}</td>
      </tr></table>
    </div>

    <div style="padding:24px 32px;">

      <!-- Match card -->
      <div style="background:linear-gradient(135deg,#1e293b,#0f172a);border-radius:16px;overflow:hidden;border:1px solid #334155;">

        <!-- League strip -->
        <div style="background:#334155;padding:10px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td><span style="color:#94a3b8;font-size:11px;font-weight:600;letter-spacing:.5px;">&#127942; ${signal.league || 'League'}</span></td>
            <td align="right"><span style="background:#ef4444;color:#fff;font-size:10px;font-weight:700;padding:3px 10px;border-radius:10px;letter-spacing:.5px;">&#9899; ${signal.minute}' LIVE</span></td>
          </tr></table>
        </div>

        <!-- Teams + score -->
        <div style="padding:24px 20px;text-align:center;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td width="40%" style="text-align:center;">
              <div style="width:56px;height:56px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);border-radius:50%;margin:0 auto 10px;text-align:center;line-height:56px;font-size:24px;box-shadow:0 4px 16px rgba(59,130,246,.3);">&#9917;</div>
              <div style="color:#f1f5f9;font-size:16px;font-weight:700;">${signal.home}</div>
              <div style="color:#64748b;font-size:11px;margin-top:2px;">Home</div>
            </td>
            <td width="20%" style="text-align:center;">
              <div style="background:#0f172a;border:2px solid #334155;border-radius:12px;padding:12px 8px;">
                <span style="color:#fbbf24;font-size:32px;font-weight:900;letter-spacing:2px;">${homeScore} - ${awayScore}</span>
              </div>
            </td>
            <td width="40%" style="text-align:center;">
              <div style="width:56px;height:56px;background:linear-gradient(135deg,#ef4444,#b91c1c);border-radius:50%;margin:0 auto 10px;text-align:center;line-height:56px;font-size:24px;box-shadow:0 4px 16px rgba(239,68,68,.3);">&#9917;</div>
              <div style="color:#f1f5f9;font-size:16px;font-weight:700;">${signal.away}</div>
              <div style="color:#64748b;font-size:11px;margin-top:2px;">Away</div>
            </td>
          </tr></table>
        </div>
      </div>

      <!-- Bet type card -->
      <div style="background:linear-gradient(135deg,#1e3a8a,#1e40af);border-radius:12px;padding:18px 20px;margin-top:16px;border:1px solid #2563eb;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td width="36"><div style="width:32px;height:32px;background:rgba(251,191,36,.2);border-radius:8px;text-align:center;line-height:32px;font-size:16px;">&#127919;</div></td>
          <td style="padding-left:12px;">
            <div style="color:#93c5fd;font-size:10px;font-weight:600;letter-spacing:1px;">BET TYPE</div>
            <div style="color:#fff;font-size:16px;font-weight:700;margin-top:2px;">${signal.betType}</div>
          </td>
        </tr></table>
      </div>

      <!-- Reason -->
      <div style="background:#1e293b;border-radius:12px;padding:18px 20px;margin-top:12px;border-left:4px solid #22c55e;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td width="36"><div style="width:32px;height:32px;background:rgba(34,197,94,.15);border-radius:8px;text-align:center;line-height:32px;font-size:16px;">&#9989;</div></td>
          <td style="padding-left:12px;">
            <div style="color:#86efac;font-size:10px;font-weight:600;letter-spacing:1px;">ANALYSIS</div>
            <div style="color:#e2e8f0;font-size:13px;margin-top:4px;">${signal.reason || 'Our system indicates a high probability of goals based on xG analysis.'}</div>
          </td>
        </tr></table>
      </div>

      ${signal.aiInsight ? `
      <!-- AI Insight -->
      <div style="background:linear-gradient(135deg,#581c87,#7e22ce);border-radius:12px;padding:18px 20px;margin-top:12px;border:1px solid #9333ea;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td width="36"><div style="width:32px;height:32px;background:rgba(192,132,252,.2);border-radius:8px;text-align:center;line-height:32px;font-size:16px;">&#129302;</div></td>
          <td style="padding-left:12px;">
            <div style="color:#d8b4fe;font-size:10px;font-weight:600;letter-spacing:1px;">AI INSIGHT</div>
            <div style="color:#f3e8ff;font-size:13px;margin-top:4px;font-style:italic;">&ldquo;${signal.aiInsight}&rdquo;</div>
          </td>
        </tr></table>
      </div>` : ''}

      <!-- Stats row -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;"><tr>
        <td style="background:#1e293b;border-radius:12px;padding:14px;text-align:center;width:33%;">
          <div style="color:#64748b;font-size:10px;font-weight:600;letter-spacing:.5px;">EXPECTED</div>
          <div style="color:#fbbf24;font-size:18px;font-weight:800;margin-top:4px;">${expectedHome} - ${expectedAway}</div>
        </td>
        <td width="8"></td>
        <td style="background:#1e293b;border-radius:12px;padding:14px;text-align:center;width:33%;">
          <div style="color:#64748b;font-size:10px;font-weight:600;letter-spacing:.5px;">xG GAP</div>
          <div style="color:#60a5fa;font-size:18px;font-weight:800;margin-top:4px;">${signal.xGGap ?? '—'}</div>
        </td>
        <td width="8"></td>
        <td style="background:#1e293b;border-radius:12px;padding:14px;text-align:center;width:33%;">
          <div style="color:#64748b;font-size:10px;font-weight:600;letter-spacing:.5px;">CONFIDENCE</div>
          <div style="margin-top:6px;">${confidenceBadge(signal.confidence)}</div>
        </td>
      </tr></table>

      <!-- CTA -->
      <div style="text-align:center;margin-top:24px;">
        <a href="https://strikesignal.netlify.app" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#3b82f6);color:#fff;text-decoration:none;padding:14px 40px;border-radius:10px;font-weight:700;font-size:14px;box-shadow:0 4px 16px rgba(37,99,235,.4);">View Live Dashboard &#8594;</a>
      </div>

      <p style="color:#475569;font-size:11px;text-align:center;margin-top:20px;">This signal was generated from live xG analysis and AI-enhanced prediction models.</p>
    </div>
  </div>`;

  for (const user of users) {
    try {
      const { data, error } = await r.client.emails.send({
        from: r.from,
        to: user.email,
        subject: `🚨 ${signal.home} vs ${signal.away} — ${signal.betType} | ${signal.minute}' Live`,
        html: emailLayout(content),
      });
      if (error) {
        console.error(`Signal email failed for ${user.email}:`, error.message || JSON.stringify(error));
      } else {
        console.log(`Signal email sent to ${user.email}, id: ${data?.id}`);
      }
    } catch (err) {
      console.error(`Email failed for ${user.email}:`, err.message);
    }
  }
}

/* ─────────── Password Reset email ─────────── */
export async function sendPasswordResetEmail(email, name, resetToken) {
  const r = await getResendClient();
  if (!r) return { error: 'Email service not configured' };

  const resetUrl = `${process.env.FRONTEND_URL || 'https://strikesignal.netlify.app'}/reset-password?token=${resetToken}`;

  const content = `
  <div style="padding:32px;">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:72px;height:72px;background:linear-gradient(135deg,#f59e0b,#d97706);border-radius:50%;margin:0 auto;text-align:center;line-height:72px;font-size:36px;box-shadow:0 8px 32px rgba(245,158,11,.3);">🔑</div>
    </div>
    <h1 style="color:#f1f5f9;font-size:22px;text-align:center;margin:0 0 8px;">Password Reset Request</h1>
    <p style="color:#94a3b8;text-align:center;font-size:14px;margin:0 0 28px;">Hi ${name}, we received a request to reset your StrikeSignal password.</p>

    <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:24px;border-left:4px solid #f59e0b;">
      <p style="color:#fcd34d;font-size:12px;font-weight:600;margin:0 0 6px;letter-spacing:.5px;">⏰ LINK EXPIRES IN 1 HOUR</p>
      <p style="color:#94a3b8;font-size:13px;margin:0;">Click the button below to choose a new password. If you didn't request this, you can safely ignore this email.</p>
    </div>

    <div style="text-align:center;margin-bottom:24px;">
      <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#0f172a;text-decoration:none;padding:14px 40px;border-radius:10px;font-weight:800;font-size:15px;box-shadow:0 4px 16px rgba(245,158,11,.4);">Reset My Password →</a>
    </div>

    <div style="background:#0f172a;border-radius:12px;padding:16px;border:1px solid #1e293b;">
      <p style="color:#475569;font-size:11px;margin:0 0 6px;">Or copy this link into your browser:</p>
      <p style="color:#60a5fa;font-size:11px;word-break:break-all;margin:0;font-family:monospace;">${resetUrl}</p>
    </div>

    <p style="color:#475569;font-size:11px;text-align:center;margin-top:20px;">This link expires in 1 hour for your security. After resetting, you'll be able to sign in with your new password.</p>
  </div>`;

  try {
    const { data, error } = await r.client.emails.send({
      from: r.from,
      to: email,
      subject: '🔑 StrikeSignal — Reset your password',
      html: emailLayout(content),
    });
    if (error) return { error: error.message || JSON.stringify(error) };
    console.log(`Password reset email sent to ${email}, id: ${data?.id}`);
    return { success: true };
  } catch (err) {
    console.error(`Password reset email failed for ${email}:`, err.message);
    return { error: err.message };
  }
}

/* ─────────── Broadcast email ─────────── */
export async function sendBroadcastEmail(email, subject, htmlBody) {
  const r = await getResendClient();
  if (!r) return { error: 'Email service not configured' };

  const content = `
  <div style="padding:32px;">
    <h1 style="color:#f1f5f9;font-size:22px;margin:0 0 16px;">${subject}</h1>
    <div style="color:#94a3b8;font-size:14px;line-height:1.6;white-space:pre-wrap;">${htmlBody}</div>
  </div>`;

  try {
    const { data, error } = await r.client.emails.send({
      from: r.from,
      to: email,
      subject: subject,
      html: emailLayout(content),
    });
    if (error) return { error: error.message || JSON.stringify(error) };
    return { success: true };
  } catch (err) {
    console.error(`Broadcast email failed for ${email}:`, err.message);
    return { error: err.message };
  }
}

