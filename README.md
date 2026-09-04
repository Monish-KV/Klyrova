# GuardianPay AI 🛡️
> **"DETECT → UNDERSTAND → WARN → PROTECT"**  
> *A Proactive Digital Banking Safety Layer for Senior Citizens and Vulnerable Customers.*  
> **Built by Team Klyrova for VIT Hackathon**

---

## 📌 Demonstration Sandbox Disclaimer
> [!IMPORTANT]
> **HACKATHON DEMO ENVIRONMENT**  
> GuardianPay AI is a proactive safety demonstration sandbox. All customer accounts, transactions, balances, and UPI handles are synthetic records securely stored in local SQLite (`guardianpay.sqlite`). No real bank credentials or UPI pins are compromised or accessed.

---

## 🎯 1. Problem Statement & Core Solution

### The Problem
Digital banking adoption has grown explosively, but **senior citizens, first-time digital banking users, and digitally inexperienced individuals** remain disproportionately vulnerable to social engineering scams:
- **Fake Electricity Disconnection Panic:** Threats that power will be cut off within hours unless a quick payment is made.
- **Deceptive Bank KYC Updates:** Fraudulent APK downloads and phishing portals requesting card credentials.
- **Active Phone Call Coercion:** Fraudsters keep victims on an active phone call, dictating steps to authorize UPI transfers to unknown accounts.

### The Paradigm Shift
```
Traditional Fraud Detection:  "Was the password or authentication token stolen?"
GuardianPay AI Prevention:    "Is the legitimate customer being manipulated or coerced into sending this money?"
```
Traditional systems fail when a panic-stricken customer willingly authorizes the payment. GuardianPay AI intervenes **BEFORE** money leaves the account.

---

## 🏗️ 2. System Architecture

```
┌────────────────────────────────────────────────────────┐
│               Frontend: React + Tailwind               │
│   (Customer Safety Portal, Bank Ops, Demo Center)      │
└──────────────────────────┬─────────────────────────────┘
                           │ REST / JSON (Vite Proxy / Vercel)
                           ▼
┌────────────────────────────────────────────────────────┐
│               Backend: Python + FastAPI                │
│    (Uvicorn, Pydantic, SQLAlchemy with Foreign Keys)   │
└──────────────┬───────────────────────────┬─────────────┘
               │                           │
               ▼                           ▼
┌─────────────────────────────┐ ┌────────────────────────┐
│      AI / ML Pipeline       │ │  Scam Message Analyzer │
│ • Explainable Risk Engine   │ │ • Gemini 2.5 Flash     │
│ • Vulnerability Adjustments │ │ • Deterministic NLP    │
│ • Scikit-learn (IsoForest)  │ │   Fallback Engine      │
│ • Pandas Telemetry Vectors  │ └────────────────────────┘
└──────────────┬──────────────┘
               │
               ▼
┌────────────────────────────────────────────────────────┐
│                 Database: SQLite                       │
│  (Users, Beneficiaries, Transactions, Alerts, Safety)  │
└────────────────────────────────────────────────────────┘
```

---

## 💻 3. Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18, Tailwind CSS, Lucide React, Chart.js | Modern accessible UI, high contrast typography, senior-friendly layouts |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, Pydantic v2 | High-throughput async REST API with rigorous input validation |
| **Database** | SQLite via SQLAlchemy 2.0 | Durable local database with `PRAGMA foreign_keys=ON` |
| **AI / ML** | Scikit-learn, Pandas | Behavioral telemetry feature extraction & unsupervised anomaly detection |
| **Scam Analyzer** | Google Gemini API (`@google/genai`) | Natural language phishing and coercive intent detection with heuristic fallback |
| **Deployment** | Vercel (Frontend), Render (Backend) | Production-ready multi-cloud architecture |

---

## 📁 4. Project Structure

```
guardianpay-ai/
├── backend/
│   ├── app/
│   │   ├── api/routes/
│   │   │   ├── customers.py        # Customer profile directory & personas
│   │   │   ├── transactions.py     # Payment analysis, confirmation, resolution
│   │   │   ├── scams.py            # Gemini scam SMS/WhatsApp analyzer
│   │   │   ├── alerts.py           # Bank security alerts queue
│   │   │   ├── safety.py           # Senior protection settings & emergency pause
│   │   │   ├── dashboard.py        # Bank operations KPI feeds
│   │   │   └── admin.py            # Diagnostic & administrative endpoints
│   │   ├── ai/
│   │   │   └── gemini_scam_service.py # Gemini integration + heuristic fallback
│   │   ├── core/
│   │   │   └── config.py           # Pydantic environment configuration
│   │   ├── database/
│   │   │   ├── database.py         # SQLAlchemy engine with SQLite foreign keys
│   │   │   ├── models.py           # Relational models (User, Beneficiary, etc.)
│   │   │   └── seed.py             # 3 realistic demo personas with audit history
│   │   ├── risk/
│   │   │   ├── risk_engine.py      # Explainable multi-factor scoring engine
│   │   │   └── ml_risk_pipeline.py # Scikit-learn IsolationForest anomaly model
│   │   ├── services/
│   │   │   └── transaction_service.py # Core transaction lifecycle & protective hold
│   │   └── main.py                 # FastAPI app entry point & lifespan
│   ├── requirements.txt            # Python dependencies
│   └── test_backend.py             # Comprehensive 8-point automated test suite
├── src/                            # React.js Frontend
│   ├── components/
│   │   ├── customer/               # Customer Safety Portal (SendMoney, ScamAnalyzer)
│   │   ├── bank/                   # Bank Safety Operations Console
│   │   ├── demo/                   # 1-Click Hackathon Demo Scenarios
│   │   └── common/                 # Header, Navigation, Sandbox Banner
│   ├── services/api.ts             # Typed REST API service with environment base URL
│   ├── context/AppContext.tsx       # Global application state management
│   ├── App.tsx                     # Main application layout & view switcher
│   └── main.tsx                    # React DOM root entry
├── guardianpay.sqlite               # Seeded SQLite database
├── server.ts                       # Node.js dev proxy server (for preview)
├── vercel.json                     # Vercel deployment configuration
├── render.yaml                     # Render deployment configuration
├── .env.example                    # Documented environment variables
└── README.md                       # Complete documentation & demo script
```

---

## 👥 5. Demo Personas & Protection Profiles

GuardianPay AI tailors its sensitivity according to the customer's digital vulnerability:

| Persona | Profile & Experience | Protection Level | Typical Limit | Behavioral Context |
| :--- | :--- | :--- | :--- | :--- |
| **Ravi Kumar** | Senior Citizen (Beginner) | **Enhanced** | ₹5,000 | Disproportionately targeted by phone fraud, heightened baseline sensitivity |
| **Sunita Patel** | First-Time Digital User (Moderate) | **Standard** | ₹10,000 | Familiar with routine payments, guided prompts for new beneficiaries |
| **Arjun Mehta** | Digitally Proficient (Advanced) | **Standard** | ₹25,000 | Tech-savvy, standard threshold with minimal friction for frequent transfers |

---

## 🧮 6. Explainable Risk Engine Formula

$$\text{Risk Score} = \min(100, \sum \text{Telemetry Signals}) \times \text{Vulnerability Factor}$$

| Signal Category | Weight | Evaluation Logic |
| :--- | :---: | :--- |
| **Habitual Amount Deviation** | **+25** | Transfer amount exceeds typical limit by $>1.5\times$ or $>5\times$. |
| **Beneficiary Trust Standing**| **+20** | Recipient is unverified or completely absent from saved trusted contacts. |
| **Hardware Fingerprint**     | **+15** | Unknown hardware, spoofed browser agent, or mismatched IP region. |
| **Behavioral Urgency / Haste**| **+15** | Transaction completed in $<15\text{s}$ (rushed under threat) or late night ($22:00\text{--}05:00$). |
| **Threat Intelligence Link** | **+15** | Customer recently analyzed an urgent scam message or phishing link. |
| **Vulnerability Sensitivity** | **+15** | Enhanced protection profile active for senior/inexperienced user. |
| **Scikit-Learn ML Model**     | **+10** | IsolationForest unsupervised anomaly detector flags outlier telemetry. |

### Decision Tiers
- **0 – 39 (LOW / ALLOW):** Seamless execution for safe, familiar transfers.
- **40 – 69 (MEDIUM / VERIFY):** Cautionary prompt for unverified contacts or moderate deviations.
- **70 – 100 (HIGH & CRITICAL / HOLD):** Protective hold instituted before money leaves the account. Prompts the **Adaptive Coercion Check**.

---

## 🚀 7. How to Run Locally

### Prerequisites
- Python 3.10+
- Node.js 18+

### Step 1: Start FastAPI Backend
```bash
# Navigate to project root
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

pip install -r backend/requirements.txt

# Run the backend on port 8001
uvicorn backend.app.main:app --host 0.0.0.0 --port 8001 --reload
```
- API is live at: `http://localhost:8001`
- Swagger Interactive Docs: `http://localhost:8001/docs`
- Health Check: `http://localhost:8001/health`

### Step 2: Start React Frontend
```bash
# In a new terminal tab at project root
npm install
npm run dev
```
- Frontend is live at: `http://localhost:3000` (or Vite dev port)

### Step 3: Run Automated Backend Tests
```bash
python3 backend/test_backend.py
```

---

## ☁️ 8. How to Deploy to Production

### Deploying Backend to Render
1. Connect your GitHub repository to [Render](https://render.com).
2. Create a new **Web Service** with the following settings:
   - **Environment:** `Python`
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
3. Configure Environment Variables in Render Dashboard:
   - `GEMINI_API_KEY`: Your Google Gemini API Key
   - `ENVIRONMENT`: `production`
   - `CORS_ORIGINS`: `*` (or your frontend Vercel domain)
   - `SQLITE_DB_PATH`: `/var/data/guardianpay.sqlite`
4. Add a Persistent Disk (optional, for persistent SQLite across deploys):
   - Mount Path: `/var/data`, Size: `1 GB`
*(Alternatively, use the included [`render.yaml`](render.yaml) for 1-click blueprint deployment).*

### Deploying Frontend to Vercel
1. Connect your repository to [Vercel](https://vercel.com).
2. Framework Preset: `Vite`
3. Set Environment Variable:
   - `VITE_API_URL`: `https://your-render-backend-url.onrender.com`
4. Deploy! `vercel.json` will automatically handle SPA routing rewrites.

---

## 🎤 9. Hackathon Demo Script (Step-by-Step for Judges)

### Step 1: Establish Context (30 seconds)
> *"Hello Judges, we are Team Klyrova presenting GuardianPay AI. Traditional fraud engines detect stolen credentials after the fact. But when an 72-year-old grandfather is panicked into sending ₹80,000 to an extortionist, credentials aren't stolen—he enters his own PIN. GuardianPay AI solves this by detecting manipulation BEFORE money leaves the account."*

### Step 2: Routine Low-Risk Payment (Safe Path)
1. Select **Ravi Kumar (Senior Citizen, Enhanced Protection)** from the persona selector.
2. In the Customer Portal, click **Send Money**.
3. Choose **Rohan Kumar (Son)**, enter **₹2,500**, Purpose: *"Monthly medicines"*.
4. Click **Pay Now**.
5. **Show Judges:** Risk score is **5/100 (LOW)**. The transaction is instantly approved (`ALLOW`) because the recipient is a verified family member and the amount aligns with his habitual pattern.

### Step 3: Urgent Scam & High-Risk Coercion Trigger
1. In Send Money, click **Load Demo: Electricity Extortion Scenario**.
   - Payee: `powercut.warning@paytm`
   - Amount: `₹80,000` (far exceeding Ravi's ₹5,000 habitual limit)
   - Note: *"Immediate power disconnection penalty pay right now"*
   - Telemetry: Late night (23:45), rushed pacing (10 seconds), unrecognized hardware.
2. Click **Proceed to Payment Safety Check**.
3. **Show Judges:** Risk score jumps to **100/100 (CRITICAL - HOLD)**. The explainable risk breakdown displays each red flag transparently.

### Step 4: Adaptive Coercion Check & Protective Hold
1. GuardianPay AI displays the human-centered prompt:
   > **"Did someone call or message you asking to transfer this money urgently?"**
2. Click **"YES, I am on an urgent call"**.
3. **Show Judges:** The transaction is **SAFELY HELD**. Money does not leave Ravi's account. Ravi is provided with calm, actionable guidance: *"Hang up the call immediately. Your funds are secure."*

### Step 5: Scam Message Analyzer (Gemini AI + Heuristics)
1. Navigate to **Scam Analyzer** in the navigation bar.
2. Paste a deceptive message or select **Load Electricity Scam SMS**:
   > *"URGENT: Electricity Board notice. Power connection will be disconnected tonight by 9:30 PM due to unpaid bill. Call 9876543210 immediately."*
3. Click **Analyze Message Safety**.
4. **Show Judges:** Gemini AI breaks down the scam:
   - **Risk Score: 95% (CRITICAL)**
   - Identified tactics: Artificial urgency, impersonation of utility board, unofficial phone contact.
   - Recommended action: Do not call the number; verify bills on the official DISCOM portal.

### Step 6: Bank Safety Operations Console
1. Click **Bank Operations** in the header.
2. **Show Judges:** The fraud operations console shows:
   - Live KPI cards: **Transactions Analyzed**, **High-Risk Holds Instituted**, **Total Funds Protected (₹8,00,000+)**.
   - The alert queue lists Ravi's held transaction in real-time.
   - Click the held transaction to inspect the complete forensic telemetry: device fingerprint, typing speed, and AI confidence.
   - Demonstrate the **Bank Resolution Controls**: Operator can verify with family and click **Clear Hold** or **Block Account**.

### Step 7: Vulnerability Profile Comparison
1. Switch personas from **Ravi Kumar (Senior, Enhanced)** to **Arjun Mehta (Software Engineer, Standard)**.
2. Enter the same ₹18,000 electronic appliance transaction for both.
3. **Show Judges:** Ravi's transaction receives a heightened risk score (85 HOLD) triggering senior safety safeguards, while Arjun's receives a standard score (55 VERIFY), proving that GuardianPay AI provides adaptive, respectful protection tailored to digital vulnerability.

---

## 🏆 Summary Checklist for Hackathon Evaluation
- ✅ **DETECT:** Real-time multi-factor explainable behavioral risk engine (0–100).
- ✅ **UNDERSTAND:** Gemini 2.5 Flash + Heuristic NLP scam message analyzer.
- ✅ **WARN:** Clear, non-technical safety explanations tailored for senior citizens.
- ✅ **PROTECT:** Interactive coercion check that halts unauthorized outflows before money leaves.
- ✅ **OBSERVABILITY:** Live bank operations console with forensic telemetry review.
- ✅ **DEPLOYABILITY:** Ready for Render (Backend) and Vercel (Frontend).
