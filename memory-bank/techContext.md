# Tech Context

**Frontend**:
- UI Framework: **React 19** / **Vite**
- Language: **TypeScript 5.9**
- Styling: **Vanilla CSS** with premium dark-mode aesthetic. 
- State: 
    - React Context (Core app state)
    - Custom **Agent Coordinator** logic in `src/lib/agents/`

**Design System Tokens**:
- Primary Background: `#0d1117`
- Panel Background: `#161b22`
- Accent Color: `#58a6ff` (Trustworthy blue)
- Typography: `Inter` (Sans), `JetBrains Mono` (Terminal)

**Agent Simulation**:
- Uses **Multi-Agent Coordination** pattern.
- Simulated state transitions via async classes in `src/lib/agents/`.
- Future integration: LLM (Gemini/GPT-4o) and Transactional Email (SendGrid/Postmark).

**Local Development**:
- Run `npm run dev` in `zcc-web/`.
- Accessible at `http://localhost:5173/`.
