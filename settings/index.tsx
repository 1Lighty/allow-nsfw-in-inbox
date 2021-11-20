/* —————————————— Copyright (c) 2021 1Lighty, All rights reserved ——————————————
 *
 * Duh
 *
 * ————————————————————————————————————————————————————————————————————————————— */

import { ErrorBoundary, FormSection, SwitchItem } from '@components';
import { makeLazy, wrapSettings } from '@util';
import { React } from '@webpack';

export interface ANIISettings {
  spoiler: boolean
}

const ANIISettingsView = makeLazy({
  promise: () => {
    const settings = Astra.settings.get<ANIISettings>('allow-nsfw-in-inbox');

    interface SettingsViewProps extends ANIISettings {
      set: typeof settings.set
      get: typeof settings.get
    }

    // eslint-disable-next-line prefer-arrow-callback
    const ANIISettingsView = React.memo(function ANIISettingsView({ get, set }: SettingsViewProps): React.ReactElement<typeof FormSection> {
      const onSpoilerChange = React.useCallback(val => set('spoiler', val), [set]);
      return (
        <FormSection title='Allow NSFW In Inbox settings' tag='h2'>
          <FormSection title='General'>
            <SwitchItem value={get('spoiler', true)} onChange={onSpoilerChange} >
              Spoiler NSFW content
            </SwitchItem>
          </FormSection>
        </FormSection>
      );
    });

    return Promise.resolve(wrapSettings(settings, ANIISettingsView));
  },
  displayName: 'ANIISettingsView'
});

export class SettingsEB extends ErrorBoundary {
  constructor(props) {
    props.label = 'ANII settings panel';
    super(props);
  }
  renderChildren(): React.ReactElement<typeof ANIISettingsView> {
    return <ANIISettingsView/>;
  }
}
