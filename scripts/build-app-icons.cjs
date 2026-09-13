// Resize the approved artwork and add Android's 108dp adaptive-icon padding.
const fs = require('node:fs/promises');
const path = require('node:path');
const {generateImageAsync, createSquareAsync, compositeImagesAsync} = require('@expo/image-utils');
const {setIconAsync, configureAdaptiveIconAsync} = require('@expo/prebuild-config/build/plugins/icons/withAndroidIcons');
async function main() {
  const root = path.resolve(__dirname, '..');
  const artwork = path.join(root, 'assets/icon-concepts/05-courier-chase.png');
  const icon = path.join(root, 'assets/app-icon.png');
  const adaptive = path.join(root, 'assets/app-icon-adaptive.png');
  const color = '#08A899';
  const {source} = await generateImageAsync({projectRoot: root, cacheType: 'approved-chase-icon'},
    {src: artwork, width: 1024, height: 1024, resizeMode: 'contain'});
  await fs.writeFile(icon, source);
  // Original composition fills the central 72dp viewport, rather than being
  // zoomed 1.5x and losing the phone when Android applies its launcher mask.
  const background = await createSquareAsync({size: 1536, color});
  await fs.writeFile(adaptive, await compositeImagesAsync({foreground: source, background, x: 256, y: 256}));
  await setIconAsync(root, {icon, backgroundColor: color, isAdaptive: true});
  await configureAdaptiveIconAsync(root, adaptive, undefined, undefined, true);
  const colorsPath = path.join(root, 'android/app/src/main/res/values/colors.xml');
  let colors = await fs.readFile(colorsPath, 'utf8');
  const value = `<color name="iconBackground">${color}</color>`;
  colors = colors.includes('name="iconBackground"')
    ? colors.replace(/<color name="iconBackground">[^<]*<\/color>/, value)
    : colors.replace('</resources>', `  ${value}\n</resources>`);
  await fs.writeFile(colorsPath, colors);
  console.log('Built approved icon, padded adaptive artwork, and all Android launcher densities.');
}
main().catch(error => {console.error(error); process.exitCode = 1;});
