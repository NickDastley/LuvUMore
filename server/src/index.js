import 'dotenv/config';
import { createServer } from 'node:http';
import { app } from './server.js';

const PORT = Number(process.env.PORT || 3000);

const server = createServer(app);

server.listen(PORT, () => {
  console.log(`[luv-u-more] listening on http://localhost:${PORT}`);
});

export default server;
