const { execSync } = require('child_process');
const path = require('path');

exports.default = async function (context) {
  if (context.electronPlatformName !== 'darwin') return;
  const appPath = path.join(
    context.appOutDir,
    `${context.packager.appInfo.productFilename}.app`
  );
  console.log(`[afterPack] Applying deep ad-hoc codesign to ${appPath}...`);
  try {
    execSync(`codesign --force --deep -s - "${appPath}"`, { stdio: 'inherit' });
    console.log(`[afterPack] Successfully signed ${appPath}`);
  } catch (err) {
    console.error(`[afterPack] Failed to sign ${appPath}:`, err);
    throw err;
  }
};
