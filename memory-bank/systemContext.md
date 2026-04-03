# System Context

ZCC is structured as a modern web application with a focus on an **agentic coordination layer**.

**Key Components**:
1.  **Dashboard UI**: A React-based Assessment Center for monitoring vendors.
2.  **Coordinator Agent**: Orchestrates the multi-agent workflow.
3.  **Specialist Agents**:
    - `OutreachAgent`: CRM and email operations.
    - `ParserAgent`: OCR and semantic block extraction.
    - `RiskScorerAgent`: Evaluating control effectiveness.

**Data Flow**:
1.  User starts a new assessment via the UI.
2.  Coordinator initializes the session and tasks the Outreach Agent.
3.  Upon reply/attachment, Parser Agent extracts metadata and findings.
4.  Risk Scorer calculates final trust scores and generates the "Vendor Report Card".
5.  All agents share state through a **Shared Memory File** (simulated).
