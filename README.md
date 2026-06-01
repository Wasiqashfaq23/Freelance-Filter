# 🚀 FreelanceFilter

> **Smart project evaluation for freelancers.** Make data-driven bidding decisions with AI-powered extraction and intelligent filtering.

[![Next.js 14](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React 18](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

---

## ✨ What is FreelanceFilter?

FreelanceFilter is an intelligent project evaluation system that automatically analyzes freelance bids and tells you whether to accept, reject, or investigate further. It combines **AI-powered data extraction** with a **dynamic filtering pipeline** to give you confidence in your bidding decisions.

### Why Use It?

- ⏱️ **Save Time** - Stop reading every project description manually
- 🎯 **Data-Driven** - Make decisions based on your custom criteria
- 🧠 **AI-Powered** - Automatically extract project details from raw text
- ⚙️ **Customizable** - Set your own thresholds for budget, deadline, and client rating
- 📊 **Visual Pipeline** - See exactly how each project is evaluated

## � Key Features

### 🤖 AI-Powered Smart Paste
Extract project details automatically from raw client descriptions:
- Paste any project description
- AI extracts budget, skills, deadline, and rating
- Auto-evaluate with one click

### ⚙️ Intelligent Filter Pipeline
- **Budget Filter** - Rejects low-paying projects
- **Skill Filter** - Only accepts projects matching your expertise
- **Deadline Filter** - Filters unrealistic timelines
- **Client Reputation Filter** - Avoids problem clients

### 🎨 Customizable Profile
- Manage your freelancer skills
- Set your minimum budget, deadline, and client rating
- Settings persist across sessions

### 📊 Beautiful Results Dashboard
- Visual evaluation pipeline with animations
- Clear accept/reject decisions with reasoning
- Evaluation history with statistics
- Client assessment and project scope analysis

## 🏗️ Architecture

**Design Pattern:** Chain of Responsibility - Each filter processes the request or passes it forward, giving you complete visibility into how decisions are made.

### Tech Stack
- **Next.js 14** - App Router, React Server Components
- **React 18** - Modern UI components with hooks
- **Tailwind CSS** - Clean, modern styling
- **Claude AI** - Intelligent text extraction
- **localStorage** - Persistent user settings

### How It Works
```
1. User inputs project details (manual or AI-extracted)
   ↓
2. Project enters the evaluation pipeline
   ↓
3. Each filter evaluates the project
   ├─ Budget Filter → Passes/Rejects
   ├─ Skill Filter → Passes/Rejects
   ├─ Deadline Filter → Passes/Rejects
   └─ Client Rating Filter → Passes/Rejects
   ↓
4. Final decision with reasons displayed
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- (Optional) Anthropic API key for AI extraction

### Installation

```bash
git clone https://github.com/yourusername/freelance-filter.git
cd freelance-filter
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

### Environment Setup (Optional)

For AI-powered Smart Paste extraction, add to `.env.local`:

```env
GROQ_API_KEY=your_key_here
```

> **Note:** The app works with or without API keys. Without keys, it uses demo mode with realistic random data.

## 🔌 API Endpoints

### `POST /api/evaluate`
Evaluates a project through the filter pipeline.

```json
{
  "budget": 2000,
  "skills": ["React", "Node.js"],
  "deadline": 10,
  "clientRating": 4.5,
  "freelancerSkills": ["React", "Node.js", "MongoDB"],
  "thresholds": {"minBudget": 300, "minDeadline": 5, "minRating": 3.5}
}
```

### `POST /api/extract`
AI-powered extraction from raw text.

```json
{
  "text": "Looking for React developer, $2000, 7 days, 4.5 stars"
}
```

Returns: `{budget, skills, deadline, clientRating}`

## 💡 How to Use

### Method 1: Smart Paste (Easiest)
1. Switch to **"Smart Paste"** tab
2. Paste a project description: `"Looking for React dev, $2000 budget, 7-day deadline, 4.5 stars"`
3. Click **"Extract & Evaluate"**
4. View instant results

### Method 2: Manual Entry
1. Fill in budget, skills, deadline, and client rating
2. Click **"Evaluate"**
3. See the evaluation pipeline

### Customize Your Profile
1. Click ⚙️ **Settings** (top right)
2. Add/remove skills from your profile
3. Adjust your minimum budget, deadline, and client rating
4. Changes apply immediately

## 📂 Project Structure

```
app/
├── api/
│   ├── evaluate/route.jsx      # Evaluation pipeline
│   ├── extract/route.jsx       # AI extraction
│   └── ...
├── components/
│   ├── Header.jsx
│   └── Footer.jsx
├── page.jsx                     # Main UI
├── layout.jsx
└── globals.css

lib/
├── chain.jsx                    # Filter pipeline builder
└── filters/
    ├── RequirementValidationFilter.jsx
    ├── BudgetFilter.jsx
    ├── SkillFilter.jsx
    ├── DeadlineFilter.jsx
    └── ClientReputationFilter.jsx
```

## 🐛 Troubleshooting

**Extraction not working?**
- Make sure you're pasting valid project descriptions
- Without API keys, the app uses realistic demo data
- Check browser console for errors

**Settings not saving?**
- Check if localStorage is enabled in your browser
- Try clearing browser cache and reloading
- Make sure you're not in private/incognito mode

**Build errors?**
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Rebuild: `npm run build`

## 🎯 Future Enhancements

- [ ] Database integration for project history
- [ ] Advanced filtering options
- [ ] Client profile integration
- [ ] Email notifications for matching projects
- [ ] Mobile app version
- [ ] Payment integration
- [ ] Real-time project feeds

## 📝 License

MIT License - feel free to use this for your own projects!

<div align="center">

</div>

