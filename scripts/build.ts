// TypeScript build script
import { build as esbuild } from 'esbuild';
import { mkdir, readFile, writeFile, stat, cp as fscp } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';

interface Manifest {
  manifest_version: number;
  version?: string;
  background?: {
    service_worker?: string;
    scripts?: string[];
  };
  permissions?: string[];
  host_permissions?: string[];
  default_locale?: string;
  browser_specific_settings?: {
    gecko?: {
      id?: string;
      strict_min_version?: string;
      data_collection_permissions?: {
        required: string[];
      };
    };
  };
}

const root = process.cwd();
const outDir = path.join(root, 'dist');
const outChrome = path.join(outDir, 'chromium');
const outFirefox = path.join(outDir, 'firefox');

// Build entry points now point to TypeScript sources in src/
const jsEntries = ['content.ts', 'options.ts', 'bg.ts'];
const staticFiles = ['manifest.json', 'options.html'];
const staticDirs = ['_locales', 'icons'];

async function exists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function buildJs(targetDir: string): Promise<void> {
  await esbuild({
    entryPoints: jsEntries.map(f => path.join(root, 'src', f)),
    outdir: targetDir,
    bundle: true,
    minify: true,
    sourcemap: false,
    target: ['chrome109', 'firefox109'],
    format: 'iife',
    logLevel: 'info',
    loader: { '.ts': 'ts' }
  });
}

async function copyStatics(targetDir: string): Promise<void> {
  // Copy individual files
  for (const f of staticFiles) {
    const src = path.join(root, f);
    if (await exists(src)) {
      const dst = path.join(targetDir, f);
      await mkdir(path.dirname(dst), { recursive: true });
      await fscp(src, dst);
    }
  }
  
  // Copy directories recursively
  for (const dir of staticDirs) {
    const srcDir = path.join(root, dir);
    if (await exists(srcDir)) {
      const dstDir = path.join(targetDir, dir);
      await mkdir(path.dirname(dstDir), { recursive: true });
      await fscp(srcDir, dstDir, { recursive: true });
    }
  }
}

function ensureFirefoxGecko(manifest: Manifest): void {
  manifest.browser_specific_settings = manifest.browser_specific_settings || {};
  const gecko = manifest.browser_specific_settings.gecko || {};
  manifest.browser_specific_settings.gecko = {
    id: gecko.id || 'is24-address-decoder@example.com',
    strict_min_version: gecko.strict_min_version || '109.0',
    data_collection_permissions: {
      required: ['none'],
    }
  };
}

function mv3toFirefoxMv2(manifest: Manifest): Manifest {
  manifest.manifest_version = 2;
  delete manifest.background;
  manifest.background = { scripts: ['bg.js'] };
  
  if (manifest.host_permissions && manifest.host_permissions.length) {
    manifest.permissions = Array.from(
      new Set([...(manifest.permissions || []), ...manifest.host_permissions])
    );
    delete manifest.host_permissions;
  }
  
  ensureFirefoxGecko(manifest);
  return manifest;
}

async function patchManifestFor(target: 'chromium' | 'firefox', targetDir: string): Promise<void> {
  const manifestPath = path.join(targetDir, 'manifest.json');
  const raw = await readFile(manifestPath, 'utf8');
  let manifest: Manifest = JSON.parse(raw);

  // Sync version from package.json
  const pkgPath = path.join(root, 'package.json');
  const pkgJson = JSON.parse(await readFile(pkgPath, 'utf8'));
  if (pkgJson.version) {
    manifest.version = pkgJson.version;
  }

  // Verify default_locale exists
  if (manifest.default_locale) {
    const locFile = path.join(targetDir, '_locales', manifest.default_locale, 'messages.json');
    if (!(await exists(locFile))) {
      // Fallback: copy from repo root
      const srcLoc = path.join(root, '_locales', manifest.default_locale, 'messages.json');
      if (await exists(srcLoc)) {
        await mkdir(path.dirname(locFile), { recursive: true });
        await fscp(srcLoc, locFile);
      } else {
        throw new Error(`Missing localization: _locales/${manifest.default_locale}/messages.json`);
      }
    }
  }

  if (target === 'firefox') {
    manifest = mv3toFirefoxMv2(manifest);
  }
  
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
}

function zipDir(srcDir: string, outZip: string): void {
  execFileSync('zip', ['-r', outZip, '.'], { cwd: srcDir, stdio: 'inherit' });
}

async function main(): Promise<void> {
  await mkdir(outChrome, { recursive: true });
  await mkdir(outFirefox, { recursive: true });

  // Chromium (MV3)
  await buildJs(outChrome);
  await copyStatics(outChrome);
  await patchManifestFor('chromium', outChrome);

  // Firefox (MV2)
  await buildJs(outFirefox);
  await copyStatics(outFirefox);
  await patchManifestFor('firefox', outFirefox);

  // ZIPs (commented out by default)
  // zipDir(outChrome, path.join(outDir, 'immo24-chromium.zip'));
  // zipDir(outFirefox, path.join(outDir, 'immo24-firefox.zip'));

  console.log('\n✅ Build finished:');
  console.log('   • dist/chromium/');
  console.log('   • dist/firefox/');
  console.log('   • dist/immo24-chromium.zip');
  console.log('   • dist/immo24-firefox.zip\n');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
