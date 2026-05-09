import AutoLaunchModule from 'auto-launch';
import { app } from 'electron';
import { APP_NAME } from '@shared/constants';

const AutoLaunch =
  (AutoLaunchModule as unknown as { default?: typeof AutoLaunchModule })
    .default ?? (AutoLaunchModule as typeof AutoLaunchModule);

let launcher: InstanceType<typeof AutoLaunch> | null = null;

function getLauncher(): InstanceType<typeof AutoLaunch> {
  if (!launcher) {
    launcher = new AutoLaunch({
      name: APP_NAME,
      path: app.getPath('exe'),
      isHidden: false
    });
  }
  return launcher;
}

export async function isAutoStartEnabled(): Promise<boolean> {
  try {
    return await getLauncher().isEnabled();
  } catch {
    return false;
  }
}

export async function syncAutoStart(desired: boolean): Promise<boolean> {
  try {
    const cur = await getLauncher().isEnabled();
    if (cur !== desired) {
      if (desired) await getLauncher().enable();
      else await getLauncher().disable();
    }
    return desired;
  } catch (err) {
    console.error('[autoLauncher] sync failed:', err);
    return false;
  }
}
