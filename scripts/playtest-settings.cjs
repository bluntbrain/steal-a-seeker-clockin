const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs'), assert = require('node:assert/strict'), crypto = require('node:crypto');
(async () => {
  const browser = await chromium.launch({headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
  try {
    const page = await browser.newPage({viewport: {width: 430, height: 932}}), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const open = async () => {
      await page.getByRole('button', {name: 'Open hideout', exact: true}).click();
      await page.getByRole('button', {name: 'Settings / controls', exact: true}).click();
    };
    await page.goto('http://127.0.0.1:8787');
    await page.waitForFunction(() => window.__SEEKER_MVP__?.snapshot().ticks > 5);
    await open();
    const ticks = await page.evaluate(() => window.__SEEKER_MVP__.snapshot().ticks);
    await page.getByRole('switch', {name: 'Game sound', exact: true}).uncheck();
    await page.getByRole('switch', {name: 'Vibration', exact: true}).uncheck();
    await page.getByRole('switch', {name: 'Reduced effects', exact: true}).check();
    await page.getByRole('radio', {name: 'Volume 25%', exact: true}).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('seeker.settings.v1') || '{}').volume === .25);
    assert.equal(await page.evaluate(() => window.__SEEKER_MVP__.snapshot().ticks), ticks);
    await page.screenshot({path: 'verification/settings-web.png'});
    await page.reload();
    await page.waitForFunction(() => window.__SEEKER_MVP__?.snapshot().ticks > 5);
    await open();
    assert.equal(await page.getByRole('switch', {name: 'Game sound', exact: true}).isChecked(), false);
    assert.equal(await page.getByRole('switch', {name: 'Vibration', exact: true}).isChecked(), false);
    assert.equal(await page.getByRole('switch', {name: 'Reduced effects', exact: true}).isChecked(), true);
    assert.equal(await page.getByRole('radio', {name: 'Volume 25%', exact: true}).isChecked(), true);
    // A full storage failure must not discard the in-session preference.
    await page.evaluate(() => { window.__restoreStorage = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) { if (key === 'seeker.settings.v1') throw new Error('Test storage unavailable'); return window.__restoreStorage.call(this, key, value); }; });
    await page.getByRole('radio', {name: 'Volume 75%', exact: true}).click();
    await page.getByText('Preferences work now but could not be saved. Try saving again.', {exact: true}).waitFor();
    assert.equal(await page.getByRole('radio', {name: 'Volume 75%', exact: true}).isChecked(), true);
    await page.evaluate(() => { Storage.prototype.setItem = window.__restoreStorage; });
    await page.getByRole('button', {name: 'Save preferences again', exact: true}).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('seeker.settings.v1') || '{}').volume === .75);
    await page.getByRole('button', {name: 'Close settings', exact: true}).click();
    await page.getByRole('button', {name: 'Open settings', exact: true}).click();
    await page.getByRole('button', {name: 'Close settings', exact: true}).click();
    assert.deepEqual(errors, []);
    const files = ['src/settings/SettingsProvider.tsx', 'src/settings/SettingsPanel.tsx', 'src/GameScreen.tsx', 'src/components/Hideout.tsx', 'src/three/HeistScene.tsx'];
    fs.writeFileSync('verification/settings-web-check.json', JSON.stringify({status: 'passed', checks: ['preferences survive reload', 'sound and vibration toggles', 'volume selection', 'reduced effects selection', 'gameplay remains paused in settings', 'storage failure retains in-session value', 'explicit retry saves latest settings', 'pause screen settings access', 'no browser runtime errors'], notVerified: ['physical volume output', 'physical haptics', 'physical reduced-effects rendering'], sourceHashes: Object.fromEntries(files.map(f => [f, crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]))}, null, 2) + '\n');
    console.log('Persistent settings, storage recovery and pause access passed.');
  } finally { await browser.close(); }
})().catch(error => {console.error(error); process.exit(1);});
