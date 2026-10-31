const { test } = require('node:test');
const assert = require('node:assert/strict');
const { bootGlobals } = require('./bootstrap.cjs');

const { SCHEMA } = bootGlobals();
const CORE = globalThis.RECORD_CORE;
const REPOSITORY = require('../src/record-repository.js');

function createRepo(initial) {
  const storage = CORE.memoryStorage(initial);
  const repo = REPOSITORY.create({
    storage,
    core: CORE,
    emptyRecord: SCHEMA.emptyRecord,
    validDeptKeys: () => SCHEMA.DEPARTMENTS.map(d => d.key)
  });
  return { storage, repo };
}

test('repository keeps storage mechanics outside the editor', () => {
  const { storage, repo } = createRepo();
  const record = SCHEMA.emptyRecord();
  record.id = 'r_repository_test';
  record.basic.name = '仓储边界';

  assert.equal(repo.writeList([{ id: record.id, data: record }]), true);
  assert.equal(repo.loadList().ok, true);
  assert.equal(repo.saveCurrent(record, 0).ok, true);

  const loaded = repo.loadCurrent(record.id);
  assert.equal(loaded.ok, true);
  assert.equal(loaded.record.basic.name, '仓储边界');
  assert.ok(storage.getItem(CORE.STORAGE_KEYS.current));
});

test('repository exposes safe removal without leaking storage errors', () => {
  const { repo } = createRepo();
  assert.equal(repo.removeCurrent(), true);
  assert.equal(repo.removeList(), true);
});
