import { createIndexedDbRepository, importStagedLegacy } from '../../packages/storage/src/index.ts';
(window as any).runImport = async (payload: string) => {
  const repo = createIndexedDbRepository();
  try { return { ok: true, result: await importStagedLegacy(payload, repo) }; }
  catch (e) { return { ok: false, error: String((e as Error).message || e) }; }
};
(window as any).dumpDb = async () => {
  const repo = createIndexedDbRepository();
  const list = await repo.loadList();
  return { list: list.ok ? list.list.map((x: any) => ({ id: x.id, name: x.data?.basic?.name, cc: x.data?.basic?.chiefComplaint })) : [], exportJson: await repo.exportBackup('all') };
};
