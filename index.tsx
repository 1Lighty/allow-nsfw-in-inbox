import { Plugin } from '@classes';
import { after, instead, unpatchAll } from '@patcher';
import { findInReactTree, suppressErrors } from '@util';
import { getByDisplayName, getByPrototypes, getByString, React } from '@webpack';

import { ANIISettings, SettingsEB } from './settings';

const settings = Astra.settings.get<ANIISettings>('allow-nsfw-in-inbox');

export default class ANII extends Plugin {
  _bypass = false;

  start() {
    this.__uSettingsTabs = {
      sections: [
        {
          label: 'Allow NSFW In Inbox',
          section: 'Allow NSFW In Inbox',
          // eslint-disable-next-line react/display-name
          element: () => <SettingsEB/>
        }
      ]
    };
    suppressErrors(this.patchMessageStoreHook.bind(this))();
    suppressErrors(this.patchMessageIsNSFW.bind(this))();
    suppressErrors(this.patchInboxMessage.bind(this))();
  }

  patchMessageStoreHook() {
    const MessageStoreHookModule = getByString({ only: 'default', ret: 'exports' }, 'reloadMessages');
    instead('ANII', MessageStoreHookModule, 'default', (_, args, orig) => {
      // @ts-ignore
      const olUseState = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher.current.useState;
      // @ts-ignore
      React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher.current.useState = initialState => {
      // @ts-ignore
        React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher.current.useState = olUseState;
        // eslint-disable-next-line react-hooks/rules-of-hooks
        return React.useState(() => {
          this._bypass = true;
          // @ts-ignore
          const ret = initialState();
          this._bypass = false;
          return ret;
        });
      };
      const ret = orig(...args);
      // @ts-ignore
      React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher.current.useState = olUseState;
      return ret;
    });
  }

  patchMessageIsNSFW() {
    const CChannel = getByPrototypes('isNSFW');
    after('ANII', CChannel.prototype, 'isNSFW', () => {
      if (this._bypass) return false;
    });
  }

  patchInboxMessage() {
    const InboxMessage = getByDisplayName('InboxMessage');
    after('ANII', InboxMessage, 'type', (_, [{ channel }], ret) => {
      if (!channel.nsfw) return;
      if (!settings.get('spoiler', true)) return;
      const { props } = ret?.props?.childrenAccessories || {};
      if (!props) return;
      props.hasSpoilerEmbeds = true;
    });
  }

  stop() {
    unpatchAll('ANII');
  }
}
