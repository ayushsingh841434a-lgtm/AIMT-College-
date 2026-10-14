import test from 'node:test';
import assert from 'node:assert/strict';
import { destinationFor } from '../src/access.js';

test('pending and rejected members cannot open a dashboard', () => {
  for (const role of ['student', 'management', 'admin']) {
    assert.equal(destinationFor({ role, status: 'pending' }), 'waiting');
    assert.equal(destinationFor({ role, status: 'rejected' }), 'waiting');
  }
});

test('approved members open the dashboard for their stored role', () => {
  for (const role of ['student', 'management', 'admin']) {
    assert.equal(destinationFor({ role, status: 'approved' }), 'dashboard');
  }
});

test('missing or invalid profiles do not open a dashboard', () => {
  assert.equal(destinationFor(null), 'login');
  assert.equal(destinationFor({ role: 'owner', status: 'approved' }), 'login');
  assert.equal(destinationFor({ role: 'student', status: 'unknown' }), 'login');
});
