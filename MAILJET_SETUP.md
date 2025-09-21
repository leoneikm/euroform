# Mailjet Setup Guide for Euroform

## 🚀 Quick Setup Steps

### 1. Verify Your Sender Email in Mailjet

1. **Go to Mailjet Dashboard**: https://app.mailjet.com/
2. **Navigate to**: Account Settings → Sender addresses & domains
3. **Add your email address** (e.g., `noreply@yourdomain.com` or your personal email)
4. **Verify the email** by clicking the verification link sent to your inbox

### 2. Update Your Environment Variables

Add these to your `server/.env` file:

```bash
# Mailjet Configuration (EU)
MAILJET_API_KEY=77578e11183053e0561f1268a46fb77b
MAILJET_SECRET_KEY=b1e6d0b211ef246c5a3840fcd13ca762
MAILJET_FROM_EMAIL=your-verified-email@domain.com  # ← Change this!
MAILJET_FROM_NAME=Euroform
```

### 3. Test Email Sending

Once configured, test with:
```bash
curl -X POST http://localhost:3001/api/submissions/submit/YOUR_FORM_ID \
  -d "field_1=Test&field_2=test@example.com"
```

## 📧 Recommended Email Setup Options

### Option 1: Personal Email (Quick Start)
- Use your personal Gmail/Outlook email
- Pros: Quick to verify, works immediately
- Cons: Not professional for production

### Option 2: Custom Domain (Recommended)
- Use `noreply@yourdomain.com`
- Requires domain verification in Mailjet
- More professional appearance

### Option 3: Mailjet Subdomain (Alternative)
- Use Mailjet's provided subdomain
- No domain verification needed
- Format: `noreply@[random].mailjetdns.com`

## 🔍 Troubleshooting

### Common Issues:

1. **"Sender not verified"**
   - Solution: Verify your sender email in Mailjet dashboard

2. **"Invalid API credentials"**
   - Solution: Double-check API key and secret in .env file

3. **"Emails not arriving"**
   - Check spam folder
   - Verify recipient email exists
   - Check Mailjet sending statistics

### Test Commands:

```bash
# Test Mailjet API directly
curl -X POST \
  https://api.mailjet.com/v3.1/send \
  -u "77578e11183053e0561f1268a46fb77b:b1e6d0b211ef246c5a3840fcd13ca762" \
  -H "Content-Type: application/json" \
  -d '{
    "Messages": [{
      "From": {
        "Email": "your-verified-email@domain.com",
        "Name": "Euroform Test"
      },
      "To": [{
        "Email": "your-test-email@domain.com"
      }],
      "Subject": "Test Email",
      "TextPart": "This is a test email from Euroform!"
    }]
  }'
```

## ⚡ Quick Start (Using Personal Email)

If you want to test immediately:

1. **Use your personal email** (Gmail, Outlook, etc.)
2. **Verify it in Mailjet dashboard**
3. **Update server/.env**:
   ```bash
   MAILJET_FROM_EMAIL=your-personal-email@gmail.com
   ```
4. **Restart the server**
5. **Test form submission**
