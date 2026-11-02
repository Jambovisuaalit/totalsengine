# Doctore AI – Launch Day Checklist

**Version 1.0 | January 2026**

---

## T–24h: Pre-Launch Verification

### 🔧 Infrastructure

- [ ] **Pipeline Health Check**
  - Verify all 5 pipeline stages show `success` status
  - Check `pipeline_health` view for any failures in last 24h
  - Confirm cron job is active and running on schedule

- [ ] **Database Status**
  - Confirm `games` table has upcoming games populated
  - Verify `pinnacle_odds` has fresh data (<30 min old)
  - Check `execution_odds` is being updated
  - Validate RLS policies are active on all tables

- [ ] **Edge Functions**
  - Test `run-pipeline` manually via curl
  - Verify `subscribe-email` rate limiting works
  - Check `send-daily-email-summary` template renders correctly
  - Confirm all functions have correct CORS headers

- [ ] **API Rate Limits**
  - Verify The Odds API quota status
  - Check `api_fetch_log` for normal fetch patterns
  - Ensure rate limit buffer for launch day traffic

### 📊 Data Quality

- [ ] **Edge Validation**
  - Review current `edges_public` for sanity
  - Check edge distribution (should be 3-8% range)
  - Verify `is_actionable` edges meet all criteria
  - Confirm `stake_fraction` calculations are reasonable

- [ ] **Historical Data**
  - Verify `edge_history` is recording snapshots
  - Check CLV tracking is working (`edge_clv` view)
  - Validate `bet_results` schema is ready for tracking

- [ ] **Source Performance**
  - Review `source_performance` for anomalies
  - Check `source_blacklist` is up to date
  - Verify no rogue bookmaker/market combinations

### 🌐 Frontend

- [ ] **Pages Load Test**
  - Landing page (`/`)
  - Analysis index (`/analysis`)
  - Individual analysis pages (`/analysis/:id`)
  - Methodology (`/methodology`)
  - Blog articles

- [ ] **SEO Verification**
  - Check meta tags render correctly
  - Verify OG images generate for analysis pages
  - Test Twitter card preview
  - Validate JSON-LD structured data

- [ ] **Mobile Responsiveness**
  - Test all pages on mobile viewport
  - Verify navigation menu works
  - Check card layouts stack properly

- [ ] **Performance**
  - Run Lighthouse audit (target: 90+ score)
  - Check Core Web Vitals
  - Verify images are optimized
  - Test loading states

### 📧 Email System

- [ ] **Subscriber Flow**
  - Test email subscription from landing page
  - Verify confirmation/welcome email sends
  - Check unsubscribe link works
  - Validate rate limiting on subscribe endpoint

- [ ] **Daily Summary**
  - Send test daily summary to internal list
  - Verify email renders in Gmail, Outlook, Apple Mail
  - Check all links in email are correct
  - Confirm actionable plays display properly

### 🔒 Security

- [ ] **RLS Policies**
  - Run database linter for security warnings
  - Verify no sensitive data exposed
  - Check service role keys are not in frontend

- [ ] **Rate Limiting**
  - Test subscribe endpoint rate limit (5/min)
  - Verify `rate_limit_log` cleanup is scheduled
  - Check for any unprotected public endpoints

- [ ] **Secrets**
  - Verify all required secrets are configured
  - Check API keys are valid and have quota
  - Ensure no secrets in client-side code

---

## T–0: Launch Day

### 🚀 Pre-Launch (Morning)

| Time | Task | Owner | Status |
|------|------|-------|--------|
| 08:00 | Final pipeline run verification | | ⬜ |
| 08:15 | Check overnight edge data quality | | ⬜ |
| 08:30 | Review any error alerts from overnight | | ⬜ |
| 08:45 | Verify email system ready | | ⬜ |
| 09:00 | Final staging check - all pages | | ⬜ |

### 🎯 Launch Sequence

| Time | Task | Owner | Status |
|------|------|-------|--------|
| 10:00 | **DEPLOY TO PRODUCTION** | | ⬜ |
| 10:05 | Verify production site loads | | ⬜ |
| 10:10 | Test email subscription on prod | | ⬜ |
| 10:15 | Verify pipeline runs on prod | | ⬜ |
| 10:20 | Check analytics tracking active | | ⬜ |
| 10:30 | **GO LIVE ANNOUNCEMENT** | | ⬜ |

### 📢 Launch Announcements

- [ ] **Social Media**
  - Twitter/X announcement thread
  - LinkedIn post
  - Discord community post

- [ ] **Content**
  - Blog post: "Introducing Doctore AI"
  - Email to waiting list (if any)

### 📈 Post-Launch Monitoring (First 4 Hours)

| Metric | Target | Check Interval |
|--------|--------|----------------|
| Site uptime | 100% | Every 15 min |
| Page load time | <3s | Every 30 min |
| Pipeline success rate | 100% | Every run |
| Email deliverability | >95% | After each send |
| Error rate | <1% | Every 30 min |

### 🔥 Launch Day Hotfixes

**Priority Matrix:**

| Severity | Response Time | Action |
|----------|---------------|--------|
| P0: Site down | Immediate | Rollback or hotfix |
| P1: Core feature broken | <30 min | Hotfix deploy |
| P2: Minor bug | <2 hours | Fix in next deploy |
| P3: Enhancement | Next day | Add to backlog |

### 📊 Day 1 Success Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| Unique visitors | 100+ | |
| Email signups | 20+ | |
| Analysis page views | 50+ | |
| Bounce rate | <60% | |
| Pipeline runs | All success | |

---

## T+1: Day After Launch

### 📋 Post-Launch Review

- [ ] Review all metrics against targets
- [ ] Document any issues encountered
- [ ] Check CLV on any edges that went actionable
- [ ] Review user feedback (if any)
- [ ] Update source blacklist if needed
- [ ] Plan iteration based on learnings

### 🔄 Ongoing Operations

- [ ] Set up daily monitoring routine
- [ ] Configure alerting thresholds
- [ ] Document runbook for common issues
- [ ] Schedule weekly performance review

---

## Emergency Contacts & Runbook

### Quick Fixes

| Issue | Solution |
|-------|----------|
| Pipeline stuck | Check edge function logs, redeploy if needed |
| Email not sending | Verify Resend API key, check quota |
| OG images failing | Check Lovable AI credits, fallback to static |
| Rate limit errors | Increase limit temporarily, investigate source |
| Database slow | Check instance size, optimize queries |

### Rollback Procedure

1. Go to Lovable project settings
2. Navigate to deployments
3. Select previous stable version
4. Click "Restore"
5. Verify site is functional
6. Investigate root cause

---

**Launch motto: "Measure twice, deploy once."**

*Good luck! 🚀*