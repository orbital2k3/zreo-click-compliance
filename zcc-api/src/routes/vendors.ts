import { Router } from 'express';
// TODO: Import Supabase client and specialized agents

const router = Router();

// List all vendors
router.get('/', async (req, res) => {
  res.json({ vendors: [], status: 'Mock data' });
});

// Create new vendor -> triggers Outreach agent workflow
router.post('/', async (req, res) => {
  const { name, email, auto_assess } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  console.log(`[Tasker] Assigning Outreach Agent to vendor ${name}`);
  // TODO: OutreachAgent.run({ name, email })

  res.status(202).json({ 
    message: 'Task successfully assigned to Outreach Agent.', 
    vendor: { name, email, auto_assess: auto_assess ?? true } 
  });
});

// Manual Upload route
router.post('/:id/upload', async (req, res) => {
  const { id } = req.params;
  console.log(`[Flow] Manual upload received for vendor ID ${id}.`);
  // TODO: ParserAgent.run()
  res.json({ message: 'Manual parsing session initiated.' });
});

export default router;
