import { rest } from 'msw';

import sampleAsynApiFile from './sample-async-api.json';

const handlers = [
  rest.get(`http://localhost:3001/sample-async-api.json`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(sampleAsynApiFile));
  }),
];

export { handlers };
