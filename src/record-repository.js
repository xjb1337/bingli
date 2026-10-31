/* Storage boundary for the record editor.
 *
 * The UI used to call RECORD_CORE with localStorage from dozens of places.
 * Keep the current storage format and core semantics, but make the platform
 * storage replaceable.  The next adapter can be IndexedDB or an Android
 * encrypted store without changing the editor or document code.
 */
const RECORD_REPOSITORY = (() => {
  'use strict';

  function create({ storage, core, emptyRecord, validDeptKeys }) {
    if (!storage) throw new Error('record repository requires a storage adapter');
    if (!core) throw new Error('record repository requires RECORD_CORE');
    const keys = core.STORAGE_KEYS;
    const departments = () => typeof validDeptKeys === 'function' ? validDeptKeys() : [];

    return Object.freeze({
      loadList() {
        return core.loadList(storage);
      },
      writeList(list) {
        return core.safeSet(storage, keys.list, JSON.stringify(list));
      },
      readRaw(key) {
        return core.readRaw(storage, key);
      },
      removeList() {
        try { storage.removeItem(keys.list); return true; } catch (e) { return false; }
      },
      loadCurrent(preferredId) {
        return core.loadCurrent(storage, emptyRecord, departments(), preferredId);
      },
      draftMatches(record) {
        return core.draftMatches(storage, record);
      },
      saveCurrent(record, expectedRevision) {
        return core.saveCurrent(storage, record, expectedRevision);
      },
      removeCurrent() {
        try { storage.removeItem(keys.current); return true; } catch (e) { return false; }
      },
      loadSettings() {
        return core.safeGetJSON(storage, keys.settings);
      },
      saveSettings(settings) {
        return core.safeSet(storage, keys.settings, JSON.stringify(settings));
      }
    });
  }

  return { create };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RECORD_REPOSITORY;
}
