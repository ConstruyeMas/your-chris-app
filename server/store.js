const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(process.cwd(), "server", "data");
const STORE_FILE = path.join(DATA_DIR, "runtime-store.json");

function ensureStoreFile() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  if (!fs.existsSync(STORE_FILE)) {
    fs.writeFileSync(
      STORE_FILE,
      JSON.stringify({ premiums: {}, intents: {}, notifications: [] }, null, 2),
      "utf8"
    );
  }
}

function readStore() {
  ensureStoreFile();
  return JSON.parse(fs.readFileSync(STORE_FILE, "utf8"));
}

function writeStore(store) {
  ensureStoreFile();
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

module.exports = {
  readStore,
  writeStore
};
