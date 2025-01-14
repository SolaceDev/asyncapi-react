import { rest } from 'msw';

import sampleAsynApiFile from './sample-async-api.json';

const handlers = [
  rest.get(`*/`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(sampleAsynApiFile));
  }),
];

export { handlers };
