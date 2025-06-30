import test from 'node:test';
import assert from 'node:assert/strict';
import { handleBrregError } from '../_shared/brregError.ts';

const cors = { 'Access-Control-Allow-Origin': '*' };


test('handle 401 returns authentication error', async () => {
  const res = handleBrregError(401, cors)!;
  assert.equal(res.status, 502);
  const data = await res.json();
  assert.equal(data.error, 'Authentication error with Brønnøysund API');
});

test('handle 404 includes org number', async () => {
  const res = handleBrregError(404, cors, '123456789')!;
  assert.equal(res.status, 404);
  const data = await res.json();
  assert.ok(data.message.includes('123456789'));
});
