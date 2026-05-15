# Healix - AI-Powered CI/CD Failure Auto-Healer

Healix automatically detects, analyzes, and fixes CI/CD pipeline failures using AI. When your GitHub Actions workflow fails, Healix:

1. **Detects** the failure via GitHub webhooks
2. **Analyzes** logs and code using Gemini AI
3. **Generates** a fix using GPT-OSS (via Groq)
4. **Reviews** the patch for safety and correctness
5. **Creates** a pull request automatically (if approved)

## ✨ Features

- 🔍 **Automatic Failure Detection** - GitHub webhook integration
- 🧠 **AI-Powered Analysis** - Root cause identification with Gemini
- 🔧 **Intelligent Fix Generation** - Code patches via GPT-OSS-120B
- ✅ **Safety Review** - AI reviewer validates patches before PR
- 🚀 **Auto PR Creation** - Seamless GitHub integration
- 📊 **Analytics Dashboard** - Track success rates and metrics
- 🔗 **Multi-Project Support** - Manage multiple repositories
- 🎨 **Modern UI** - Beautiful, responsive dashboard

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or Neon serverless)
- GitHub account
- API keys for:
  - Google Gemini API
  - Groq API
  - GitHub Personal Access Token

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd healix
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Database (Neon or PostgreSQL)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"  # Generate with: openssl rand -base64 32

# GitHub Webhook
GITHUB_WEBHOOK_SECRET="your-webhook-secret"  # Generate with: openssl rand -hex 32

# GitHub API (for PR creation)
GITHUB_TOKEN="ghp_your_personal_access_token"  # Needs 'repo' scope

# Gemini AI (for log analysis)
GEMINI_API_KEY="your-gemini-api-key"

# Groq (for patch generation)
GROQ_API_KEY="your-groq-api-key"

# Optional: GitHub OAuth
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Seed database
npx tsx prisma/seed.ts
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Setup Guide

### Step 1: Add Your Repository

1. Go to **Dashboard** → **Settings**
2. Enter your repository in format: `owner/repository` (e.g., `facebook/react`)
3. Click **Add Repository**

### Step 2: Configure GitHub Webhook

1. Go to your GitHub repository → **Settings** → **Webhooks** → **Add webhook**
2. **Payload URL**: Copy from Healix settings page (e.g., `https://your-domain.com/api/webhooks/github`)
3. **Content type**: `application/json`
4. **Secret**: Use your `GITHUB_WEBHOOK_SECRET` from `.env`
5. **Events**: Select "Let me select individual events" → Check **Workflow runs**
6. Click **Add webhook**

### Step 3: Test It Out

1. Push code that causes a CI/CD failure
2. Watch Healix automatically:
   - Detect the failure
   - Analyze the logs
   - Generate a fix
   - Create a PR (if approved)
3. Review and merge the PR

## 🔑 Getting API Keys

### Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy and add to `.env` as `GEMINI_API_KEY`

### Groq API Key
1. Go to [Groq Console](https://console.groq.com/)
2. Sign up/Login
3. Navigate to API Keys
4. Create new key and copy to `.env` as `GROQ_API_KEY`

### GitHub Personal Access Token
1. Go to GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Click "Generate new token (classic)"
3. Select scopes: `repo` (full control of private repositories)
4. Generate and copy to `.env` as `GITHUB_TOKEN`

## 🏗️ Architecture

```
┌─────────────┐
│   GitHub    │
│  Workflows  │
└──────┬──────┘
       │ Failure Event
       ↓
┌─────────────┐
│   Webhook   │
│   Handler   │
└──────┬──────┘
       │
       ↓
┌─────────────────────────────────────┐
│      Healix Pipeline                │
│                                     │
│  1. Fetch logs & context (GitHub)  │
│  2. Analyze root cause (Gemini)    │
│  3. Generate patch (GPT-OSS/Groq)  │
│  4. Review patch (GPT-OSS/Groq)    │
│  5. Create PR (GitHub)             │
└─────────────────────────────────────┘
       │
       ↓
┌─────────────┐
│  Dashboard  │
│   (Next.js) │
└─────────────┘
```

## 📁 Project Structure

```
healix/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── api/               # API routes
│   │   │   ├── analyze/       # Manual analysis trigger
│   │   │   ├── heal/          # Full healing pipeline
│   │   │   ├── webhooks/      # GitHub webhook handler
│   │   │   └── ...
│   │   ├── dashboard/         # Dashboard UI
│   │   └── ...
│   ├── lib/                   # Utilities
│   │   ├── github.ts          # GitHub API client
│   │   ├── log-parser.ts      # Log processing
│   │   └── ...
│   └── services/              # Core services
│       ├── gemini-analyzer.ts # AI analysis
│       ├── patch-generator.ts # Fix generation
│       ├── patch-reviewer.ts  # Safety review
│       ├── github-pr.ts       # PR creation
│       └── healix-orchestrator.ts # Pipeline orchestration
├── prisma/
│   └── schema.prisma          # Database schema
└── ...
```

## 🎯 How It Works

### 1. Failure Detection
When a GitHub Actions workflow fails, GitHub sends a webhook event to Healix.

### 2. Context Gathering
Healix fetches:
- Workflow run logs
- Failed job details
- Commit diff
- File contents

### 3. AI Analysis (Gemini)
Gemini analyzes the logs and identifies:
- Root cause
- Error category (runtime, build, dependency, config)
- Affected files
- Confidence score

### 4. Patch Generation (GPT-OSS)
GPT-OSS-120B generates a code patch to fix the issue.

### 5. Patch Review (GPT-OSS)
A second AI model reviews the patch for:
- Correctness
- Safety
- Risk level
- Potential side effects

### 6. PR Creation
If approved, Healix creates a pull request with:
- Descriptive title and body
- The fix patch
- Analysis details
- Review verdict

## 🔧 Configuration

### Auto-Healing
By default, Healix automatically runs the healing pipeline when a failure is detected. To disable:

```env
AUTO_HEAL_ON_WEBHOOK=false
```

### Per-Repository Settings
Each repository can have individual settings:
- **Auto PR Enabled**: Toggle automatic PR creation
- Configure in Dashboard → Settings

## 📊 Dashboard Features

- **Failure Feed**: Real-time list of detected failures
- **Pipeline Visualization**: See each step of the healing process
- **AI Analysis**: View root cause, confidence, and risk level
- **Patch Diff**: Review generated code changes
- **Analytics**: Track success rates, categories, and trends
- **Multi-Project**: Manage multiple repositories

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Docker

```bash
# Build
docker build -t healix .

# Run
docker run -p 3000:3000 --env-file .env healix
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Troubleshooting

### Webhook not receiving events
- Check webhook URL is publicly accessible
- Verify webhook secret matches `.env`
- Ensure "Workflow runs" event is selected

### PR creation fails
- Verify `GITHUB_TOKEN` has `repo` scope
- Check token hasn't expired
- Ensure repository access is granted

### AI analysis fails
- Verify API keys are valid
- Check API rate limits
- Review logs for specific errors

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [GitHub Webhooks](https://docs.github.com/en/webhooks)
- [Gemini API](https://ai.google.dev/docs)
- [Groq API](https://console.groq.com/docs)

## 🎉 What's Next?

- [ ] Support for more CI/CD platforms (GitLab, CircleCI, etc.)
- [ ] Custom AI model fine-tuning
- [ ] Slack/Discord notifications
- [ ] Advanced analytics and insights
- [ ] Team collaboration features
- [ ] Multi-language support

---

Built with ❤️ using Next.js, Prisma, and AI
