# Zero Click Compliance (ZCC)
**Autonomous SOC 2 Vendor Risk Management**

## 1. Product Vision: The "Hands-Off" Compliance Agent
ZCC is built to eliminate the massive manual burden of reviewing 150+ page SOC 2 Type II reports from third-party vendors. The core differentiator is its **autonomous workflow**.

Instead of a user manually requesting, tracking, downloading, and reading a PDF, ZCC operates as an agent:
1. **User Input:** Enter the vendor's name and contact email (e.g., `security@stripe.com`).
2. **Autonomous Outreach:** ZCC autonomously emails the vendor requesting their latest SOC 2 report.
3. **Ingestion & Parsing:** ZCC receives the PDF attachment from the vendor and uses AI to parse the unstructured document.
4. **Exception Analysis:** The AI isolates the "Auditor's Opinion," identifies any failed controls (exceptions), and grades the severity.
5. **Output:** The user receives a clean, 1-page summary dashboard: *"Vendor Approved. 0 Critical Exceptions Found."*

---

## 2. Technical Stack
- **Frontend:** React / Vite / TypeScript
- **Styling:** Vanilla CSS (Modern, fast, dark-mode focused aesthetic)
- **State Management:** React Context / Zustand
- **Architecture:** 
  - A primary Dashboard listing all vendors and their current "Assessment Status" (e.g., *Pending Email*, *Analyzing*, *Approved*, *Flagged*).
  - A detailed "Vendor Report Card" view showing extracted exceptions and AI summarization of the SOC 2 text.

---

## 3. Implementation Roadmap

### Phase 1: Foundation & The UI 
*Goal: Build the core user experience that sells the "Zero Click" vision.*
* Initialize a Vite + React application.
* Build a premium, high-contrast UI (dark slate, vibrant accents) designed for security professionals.
* Implement the Main Dashboard showing a list of vendors and their analysis statuses.
* Build the "Add Vendor" modal (Requires: Name, Email).

### Phase 2: The Agentic Workflow Simulation
*Goal: Build the state machine that represents the autonomous processes.*
* Create mockup flows for the status changes: `Outreach Sent` -> `Awaiting Document` -> `Parsing PDF` -> `Analysis Complete`.
* Build the detailed View for a completed analysis, showing mock "Exceptions extracted by AI."

### Phase 3: Backend Integration (Future)
*Goal: Connect the UI to the actual LLM and email APIs.*
* Integrate LLM parsing APIs (e.g., Gemini) to extract structured JSON from raw PDF text.
* Integrate email processing (e.g., SendGrid/Postmark) to intercept vendor replies and extract attachments autonomously.
