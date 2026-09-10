// Release packaging, 10.09.2026. OpenAI Codex (GPT-6).
// Node.js built-ins only. Creates a new directory; never deletes or overwrites.
'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = fs.realpathSync(path.resolve(__dirname, '..'));
const runtime = ['index.html', 'styles.css', 'industrial.css', 'script.js', 'handler.php', '.htaccess', 'version.json'];
const assetExtension = /\.(?:webp|png|jpe?g|avif|gif|svg|ico|woff2?)$/i;
const sha256 = (data) => crypto.createHash('sha256').update(data).digest('hex');
const sorted = (items) => [...items].sort();

function listFiles(directory, prefix = '') {
  const result = [];
  for (const name of fs.readdirSync(directory).sort()) {
    const full = path.join(directory, name);
    const relative = prefix + name;
    const stat = fs.lstatSync(full);
    assert.ok(!stat.isSymbolicLink(), 'Symbolic links are not allowed: ' + relative);
    if (stat.isDirectory()) result.push(...listFiles(full, relative + '/'));
    else {
      assert.ok(stat.isFile(), 'Only regular files are allowed: ' + relative);
      result.push(relative);
    }
  }
  return result;
}

const crcTable = Array.from({ length: 256 }, (_, value) => {
  for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0);
  return value >>> 0;
});
function crc32(data) {
  let value = 0xffffffff;
  for (const byte of data) value = (value >>> 8) ^ crcTable[(value ^ byte) & 255];
  return (value ^ 0xffffffff) >>> 0;
}

// ZIP STORE keeps already compressed images intact and needs no archiver.
function createZip(files) {
  assert.ok(files.length < 65535, 'ZIP64 is not supported');
  const local = [];
  const central = [];
  let offset = 0;
  for (const file of files) {
    const name = Buffer.from(file.path, 'utf8');
    assert.ok(name.length <= 65535 && file.data.length < 0xffffffff, 'ZIP entry is too large');
    const checksum = crc32(file.data);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0x0800, 6); // UTF-8 filenames.
    header.writeUInt16LE(33, 12); // Fixed 1980-01-01 date: deterministic archive.
    header.writeUInt32LE(checksum, 14);
    header.writeUInt32LE(file.data.length, 18);
    header.writeUInt32LE(file.data.length, 22);
    header.writeUInt16LE(name.length, 26);
    local.push(header, name, file.data);

    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0);
    entry.writeUInt16LE(20, 4);
    entry.writeUInt16LE(20, 6);
    entry.writeUInt16LE(0x0800, 8);
    entry.writeUInt16LE(33, 14);
    entry.writeUInt32LE(checksum, 16);
    entry.writeUInt32LE(file.data.length, 20);
    entry.writeUInt32LE(file.data.length, 24);
    entry.writeUInt16LE(name.length, 28);
    entry.writeUInt32LE(offset, 42);
    central.push(entry, name);
    offset += header.length + name.length + file.data.length;
    assert.ok(offset < 0xffffffff, 'ZIP64 is not supported');
  }
  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, directory, end]);
}

function verifyZip(zip, files) {
  const end = zip.length - 22;
  assert.equal(zip.readUInt32LE(end), 0x06054b50, 'ZIP end record');
  assert.equal(zip.readUInt16LE(end + 10), files.length, 'ZIP file count');
  let cursor = zip.readUInt32LE(end + 16);
  const centralStart = cursor;
  let expectedOffset = 0;
  for (const file of files) {
    assert.equal(zip.readUInt32LE(cursor), 0x02014b50, 'ZIP central entry');
    assert.equal(zip.readUInt16LE(cursor + 10), 0, 'ZIP storage method');
    const nameLength = zip.readUInt16LE(cursor + 28);
    const name = zip.subarray(cursor + 46, cursor + 46 + nameLength).toString('utf8');
    assert.equal(name, file.path, 'ZIP central filename');
    const offset = zip.readUInt32LE(cursor + 42);
    assert.equal(offset, expectedOffset, 'ZIP local offset');
    assert.equal(zip.readUInt32LE(offset), 0x04034b50, 'ZIP local entry');
    assert.equal(zip.readUInt16LE(offset + 8), 0, 'ZIP local storage method');
    const localNameLength = zip.readUInt16LE(offset + 26);
    assert.equal(zip.subarray(offset + 30, offset + 30 + localNameLength).toString('utf8'), file.path);
    assert.equal(zip.readUInt32LE(cursor + 24), file.data.length, 'ZIP central size');
    assert.equal(zip.readUInt32LE(offset + 22), file.data.length, 'ZIP local size');
    const dataStart = offset + 30 + localNameLength + zip.readUInt16LE(offset + 28);
    const data = zip.subarray(dataStart, dataStart + file.data.length);
    assert.equal(sha256(data), file.sha256, 'ZIP SHA-256: ' + file.path);
    assert.equal(crc32(data), zip.readUInt32LE(cursor + 16), 'ZIP central CRC');
    assert.equal(crc32(data), zip.readUInt32LE(offset + 14), 'ZIP local CRC');
    expectedOffset = dataStart + data.length;
    cursor += 46 + nameLength + zip.readUInt16LE(cursor + 30) + zip.readUInt16LE(cursor + 32);
  }
  assert.equal(expectedOffset, centralStart, 'Unexpected ZIP local data');
  assert.equal(cursor, end, 'Unexpected ZIP central data');
  assert.equal(cursor - centralStart, zip.readUInt32LE(end + 12), 'ZIP directory size');
}

function main() {
  const args = process.argv.slice(2);
  assert.ok(args.length === 2 && args[0] === '--output-dir' && args[1].trim(),
    'Usage: node scripts/build-release.cjs --output-dir <new-directory>');
  const requested = path.resolve(args[1]);
  assert.ok(!fs.existsSync(requested), 'Output directory already exists; choose a new path');
  const parent = fs.realpathSync(path.dirname(requested));
  const output = path.join(parent, path.basename(requested));
  const relativeToRoot = path.relative(root, output);
  assert.ok(relativeToRoot.startsWith('..' + path.sep) || path.isAbsolute(relativeToRoot),
    'Output directory must be outside the source tree');

  const assetRoot = path.join(root, 'assets');
  assert.ok(!fs.lstatSync(assetRoot).isSymbolicLink(), 'assets must be a real directory');
  const assets = listFiles(assetRoot, 'assets/');
  assert.ok(assets.length > 0, 'No assets found');
  assert.ok(assets.every((name) => assetExtension.test(name)), 'Unexpected file type inside assets');
  const names = sorted([...runtime, ...assets]);
  const files = names.map((name) => {
    const source = path.join(root, name);
    const stat = fs.lstatSync(source);
    assert.ok(stat.isFile() && !stat.isSymbolicLink(), 'Invalid source: ' + name);
    const data = fs.readFileSync(source);
    return { path: name, data, sha256: sha256(data) };
  });
  const version = JSON.parse(files.find((file) => file.path === 'version.json').data.toString('utf8'));
  assert.match(version.version, /^\d{4}\.\d{2}\.\d{2}\.\d+$/, 'Invalid release version');

  fs.mkdirSync(output); // Atomic refusal if another process created the path.
  const deployroot = path.join(output, 'deployroot');
  fs.mkdirSync(deployroot);
  for (const file of files) {
    const destination = path.join(deployroot, file.path);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, file.data, { flag: 'wx' });
  }
  assert.deepEqual(sorted(listFiles(deployroot)), names, 'Deployroot file list differs');
  for (const file of files) {
    assert.equal(sha256(fs.readFileSync(path.join(deployroot, file.path))), file.sha256, 'Staging SHA-256: ' + file.path);
    assert.equal(sha256(fs.readFileSync(path.join(root, file.path))), file.sha256, 'Source changed during build: ' + file.path);
  }
  assert.deepEqual(sorted(listFiles(assetRoot, 'assets/')), sorted(assets), 'Assets changed during build');

  const archiveName = 'Premium-E-' + version.version + '-deploy.zip';
  const archivePath = path.join(output, archiveName);
  fs.writeFileSync(archivePath, createZip(files), { flag: 'wx' });
  const archive = fs.readFileSync(archivePath);
  verifyZip(archive, files);
  const manifest = {
    schema_version: 1,
    version: version.version,
    date: version.date,
    author: 'OpenAI Codex',
    llm: 'GPT-6',
    built_at: new Date().toISOString(),
    proposed_url: version.proposed_url,
    status: 'VERIFIED_LOCAL_PACKAGE',
    production_deployed: false,
    archive: { path: archiveName, bytes: archive.length, sha256: sha256(archive), method: 'ZIP STORE' },
    files: files.map((file) => ({ path: file.path, bytes: file.data.length, sha256: file.sha256 })),
  };
  fs.writeFileSync(path.join(output, 'release-manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
  fs.writeFileSync(path.join(output, 'SHA256SUMS.txt'), manifest.archive.sha256 + '  ' + archiveName + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ status: manifest.status, version: version.version, files: files.length, bytes: archive.length,
    output_dir: output, archive: archivePath, sha256: manifest.archive.sha256, production_deployed: false }, null, 2));
}

try { main(); }
catch (error) {
  console.error('Release build failed: ' + error.message);
  process.exitCode = 1;
}
