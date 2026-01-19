# Phase 3 User Guide
**Copyright © 2024 Paksa IT Solutions**

## Table of Contents
1. [Admin Guide](#admin-guide)
2. [Tenant Guide](#tenant-guide)
3. [Common Tasks](#common-tasks)

---

## Admin Guide

### Managing Model Versions

#### Register a New Model Version
1. Navigate to **Admin Panel** → **ML Models**
2. Select model type (recommendation, forecasting, etc.)
3. Click **Register Version** button
4. Upload model file (.h5 format)
5. Enter version number (e.g., v2.1.0)
6. Click **Register**

#### Setup A/B Testing
1. Go to **ML Models** page
2. Click **Setup A/B Test** button
3. Select **Version A** (current version)
4. Select **Version B** (new version to test)
5. Adjust traffic split slider (default: 50/50)
6. Click **Start Test**
7. Monitor performance for 7 days
8. Activate winning version

#### Rollback to Previous Version
1. Go to **ML Models** page
2. Find the version you want to rollback to
3. Click **Rollback** button
4. Confirm rollback
5. System automatically routes 100% traffic to selected version

### Monitoring Anomalies

#### View Security Alerts
1. Navigate to **Anomalies** page
2. Red badge shows unresolved count
3. Review alerts by severity:
   - **High** (red): Immediate action required
   - **Medium** (orange): Review soon
   - **Low** (yellow): Monitor only

#### Resolve Anomalies
1. Click **Resolve** button (green)
   - Marks as resolved
   - Removes from alert list
   - Logs resolution in database
2. Click **Ignore** button (gray)
   - Marks as false positive
   - Removes from alert list
   - Useful for known traffic spikes

#### Setup Email Alerts
1. Add to `.env` file:
   ```
   EMAIL_API_KEY=your_sendgrid_api_key
   ADMIN_EMAIL=admin@yourdomain.com
   ```
2. Restart API server
3. High severity anomalies automatically send emails

#### Setup Slack Alerts
1. Create Slack webhook:
   - Go to https://api.slack.com/apps
   - Create new app
   - Enable Incoming Webhooks
   - Copy webhook URL
2. Add to `.env` file:
   ```
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```
3. Restart API server
4. High severity anomalies automatically post to Slack

### Batch Queue Monitoring

#### View Queue Statistics
1. Navigate to **Monitoring** page
2. View 4 key metrics:
   - **Queue Length**: Jobs waiting
   - **Processing**: Currently running
   - **Failed Jobs**: Errors
   - **Processing Rate**: Jobs/minute
3. Auto-refreshes every 5 seconds

#### Retry Failed Jobs
1. Scroll to **Failed Jobs** table
2. Review error message
3. Click **Retry** button
4. Job re-queued automatically

### Tenant Model Isolation

#### Approve Isolation Request
1. Navigate to **Isolation Requests** page
2. Review tenant request:
   - Tenant ID
   - Model name
   - Reason
3. Click **Approve** or **Reject**
4. If approved, model created automatically

#### Create Tenant Model Manually
1. Go to **ML Models** page
2. Click **Create Tenant Model** button
3. Select tenant from dropdown
4. Base model auto-filled
5. Click **Create Model**
6. Model copied to tenant directory

---

## Tenant Guide

### Viewing Performance Metrics

#### Dashboard Widget
1. Login to tenant dashboard
2. View **Model Performance** widget:
   - **CTR**: Click-through rate (%)
   - **Conversion Rate**: Purchase rate (%)
   - **Accuracy**: Model accuracy (%)
   - **Total Recommendations**: Count
3. Metrics update every 5 minutes

### Requesting Isolated Model

#### Enterprise Feature
1. Navigate to **Settings** page
2. Find **Request Isolated Model** section
3. Click **Request Isolation** button
4. Enter reason (e.g., "Custom product catalog")
5. Click **Submit Request**
6. Admin reviews within 24 hours
7. Status shows: Pending → Approved/Rejected

**Requirements:**
- Enterprise plan
- Minimum 10,000 orders
- Custom training data

### Batch Recommendations

#### Submit Batch Job
1. Navigate to **Batch Recommendations** widget
2. Enter customer IDs (comma-separated):
   ```
   1, 2, 3, 4, 5
   ```
3. Click **Submit Batch**
4. Note the Job ID
5. Click **Refresh Status** to check progress

#### Use Cases
- **Email Campaigns**: Get recommendations for 1000+ customers
- **Scheduled Reports**: Daily product suggestions
- **Bulk Operations**: Catalog updates

---

## Common Tasks

### Task 1: Deploy New Model Version Safely

**Steps:**
1. Register new version (v2.1.0)
2. Setup A/B test (50/50 split)
3. Monitor for 7 days:
   - Check CTR improvement
   - Check conversion rate
   - Check accuracy
4. If v2.1.0 performs better:
   - Activate v2.1.0 (100% traffic)
5. If v2.1.0 performs worse:
   - Rollback to v2.0.0

**Expected Timeline:** 7-10 days

### Task 2: Handle High Severity Anomaly

**Steps:**
1. Receive email/Slack alert
2. Login to admin panel
3. Navigate to **Anomalies** page
4. Review anomaly details:
   - Type (failed_auth, high_api_rate, etc.)
   - Tenant ID
   - Count/Amount
5. Investigate:
   - Check tenant logs
   - Contact tenant if needed
6. Take action:
   - **Resolve**: If legitimate issue fixed
   - **Ignore**: If false positive
7. Document in notes field

**Expected Time:** 15-30 minutes

### Task 3: Process Batch Recommendations

**Steps:**
1. Prepare customer ID list
2. Submit batch job via API or UI
3. Note job ID
4. Check status every 5 minutes
5. When completed, download results
6. Use recommendations in email campaign

**Expected Time:** 5-15 minutes (depending on batch size)

### Task 4: Optimize Model Performance

**Steps:**
1. Review performance metrics (7-day trend)
2. Identify issues:
   - Low CTR: Recommendations not relevant
   - Low conversion: Pricing issues
   - Low accuracy: Model needs retraining
3. Actions:
   - Retrain model with recent data
   - Adjust recommendation algorithm
   - A/B test new version
4. Monitor improvement

**Expected Timeline:** 2-4 weeks

### Task 5: Setup New Enterprise Tenant

**Steps:**
1. Tenant requests isolated model
2. Admin reviews request
3. Verify requirements:
   - Enterprise plan active
   - Minimum 10,000 orders
4. Approve request
5. System creates tenant model
6. Notify tenant (model ready in 24 hours)
7. Schedule training call

**Expected Timeline:** 24-48 hours

---

## Troubleshooting

### Issue: Batch Job Stuck in "Processing"

**Solution:**
1. Check Redis queue: `redis-cli LLEN batch:processing`
2. If stuck >30 minutes, clear: `redis-cli DEL batch:processing`
3. Retry job from UI

### Issue: Anomaly Alerts Not Received

**Solution:**
1. Check `.env` file has EMAIL_API_KEY and SLACK_WEBHOOK_URL
2. Test email: `curl -X POST http://localhost:8000/api/internal/test-email`
3. Test Slack: `curl -X POST $SLACK_WEBHOOK_URL -d '{"text":"Test"}'`
4. Check logs: `tail -f logs/anomalies.log`

### Issue: Model Version Not Loading

**Solution:**
1. Check file exists: `ls -la models/recommendation/`
2. Verify permissions: `chmod 644 models/recommendation/*.h5`
3. Check logs: `tail -f logs/api.log`
4. Restart API server

### Issue: Performance Metrics Not Updating

**Solution:**
1. Check database connection
2. Verify ModelMetrics table has recent data
3. Check Redis connection
4. Restart API server

---

## Best Practices

### For Admins

1. **Model Deployment**
   - Always A/B test new versions
   - Monitor for minimum 7 days
   - Keep previous version for rollback

2. **Anomaly Management**
   - Review high severity within 1 hour
   - Document all resolutions
   - Update detection thresholds based on false positives

3. **Batch Processing**
   - Schedule during off-peak hours
   - Limit batch size to 1000 customers
   - Monitor failed jobs daily

4. **Tenant Isolation**
   - Only approve for Enterprise customers
   - Verify data requirements
   - Schedule monthly retraining

### For Tenants

1. **Performance Monitoring**
   - Check metrics weekly
   - Report issues immediately
   - Request optimization if CTR <5%

2. **Batch Recommendations**
   - Use for email campaigns
   - Submit during off-peak hours
   - Keep customer lists updated

3. **Isolated Models**
   - Only request if needed (>10K orders)
   - Provide quality training data
   - Schedule regular retraining

---

## FAQ

**Q: How long does A/B testing take?**
A: Minimum 7 days to collect statistically significant data.

**Q: Can I rollback during A/B test?**
A: Yes, click Rollback to immediately route 100% traffic to previous version.

**Q: How many anomalies are normal?**
A: 0-5 low severity per day is normal. High severity should be rare.

**Q: What's the maximum batch size?**
A: 1000 customers per job. Submit multiple jobs for larger batches.

**Q: How often should models be retrained?**
A: Monthly for base models, weekly for tenant-isolated models.

**Q: Can I delete old model versions?**
A: Yes, but keep at least 2 previous versions for rollback.

---

## Support

Need help?
- Email: support@paks.com.pk
- Documentation: https://docs.luxebrain.ai
- Response time: <24 hours
