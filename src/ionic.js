// Liga o Ionic (web components, sem framework). Usa o build "components" do
// @ionic/core: só os componentes registrados aqui entram no bundle final.
import '@ionic/core/css/ionic.bundle.css';
import '@ionic/core/css/palettes/dark.system.css'; // modo escuro segue o sistema

import { initialize, toastController, alertController } from '@ionic/core/components';
import { defineCustomElement as defineApp } from '@ionic/core/components/ion-app.js';
import { defineCustomElement as defineHeader } from '@ionic/core/components/ion-header.js';
import { defineCustomElement as defineToolbar } from '@ionic/core/components/ion-toolbar.js';
import { defineCustomElement as defineTitle } from '@ionic/core/components/ion-title.js';
import { defineCustomElement as defineButtons } from '@ionic/core/components/ion-buttons.js';
import { defineCustomElement as defineButton } from '@ionic/core/components/ion-button.js';
import { defineCustomElement as defineContent } from '@ionic/core/components/ion-content.js';
import { defineCustomElement as defineFooter } from '@ionic/core/components/ion-footer.js';
import { defineCustomElement as defineSearchbar } from '@ionic/core/components/ion-searchbar.js';
import { defineCustomElement as defineSegment } from '@ionic/core/components/ion-segment.js';
import { defineCustomElement as defineSegmentButton } from '@ionic/core/components/ion-segment-button.js';
import { defineCustomElement as defineChip } from '@ionic/core/components/ion-chip.js';
import { defineCustomElement as defineList } from '@ionic/core/components/ion-list.js';
import { defineCustomElement as defineItem } from '@ionic/core/components/ion-item.js';
import { defineCustomElement as defineLabel } from '@ionic/core/components/ion-label.js';
import { defineCustomElement as defineItemSliding } from '@ionic/core/components/ion-item-sliding.js';
import { defineCustomElement as defineItemOptions } from '@ionic/core/components/ion-item-options.js';
import { defineCustomElement as defineItemOption } from '@ionic/core/components/ion-item-option.js';
import { defineCustomElement as defineCheckbox } from '@ionic/core/components/ion-checkbox.js';
import { defineCustomElement as defineSelect } from '@ionic/core/components/ion-select.js';
import { defineCustomElement as defineSelectOption } from '@ionic/core/components/ion-select-option.js';
import { defineCustomElement as defineSelectPopover } from '@ionic/core/components/ion-select-popover.js';
import { defineCustomElement as definePopover } from '@ionic/core/components/ion-popover.js';
import { defineCustomElement as defineInput } from '@ionic/core/components/ion-input.js';
import { defineCustomElement as defineTextarea } from '@ionic/core/components/ion-textarea.js';
import { defineCustomElement as defineText } from '@ionic/core/components/ion-text.js';
import { defineCustomElement as defineFab } from '@ionic/core/components/ion-fab.js';
import { defineCustomElement as defineFabButton } from '@ionic/core/components/ion-fab-button.js';
import { defineCustomElement as defineModal } from '@ionic/core/components/ion-modal.js';
import { defineCustomElement as defineToast } from '@ionic/core/components/ion-toast.js';
import { defineCustomElement as defineAlert } from '@ionic/core/components/ion-alert.js';
import { defineCustomElement as defineIcon } from '@ionic/core/components/ion-icon.js';
import { addIcons } from 'ionicons';
import { add, arrowUp, createOutline, trashOutline } from 'ionicons/icons';

export function setupIonic() {
  initialize();
  addIcons({ add, 'arrow-up': arrowUp, 'create-outline': createOutline, 'trash-outline': trashOutline });
  [
    defineApp, defineHeader, defineToolbar, defineTitle, defineButtons, defineButton, defineContent, defineFooter,
    defineSearchbar, defineSegment, defineSegmentButton, defineChip, defineList, defineItem, defineLabel,
    defineItemSliding, defineItemOptions, defineItemOption, defineCheckbox, defineSelect, defineSelectOption,
    defineSelectPopover, definePopover, defineInput, defineTextarea, defineText, defineFab, defineFabButton,
    defineModal, defineToast, defineAlert, defineIcon
  ].forEach((define) => define());
}

/* ------------------------- overlays (toast e alert) ------------------------- */
// Os controllers criam o elemento, apresentam e o tiram do DOM ao fechar.

let currentToast = null;

/** Mostra um ion-toast acima da barra de adição rápida. `color: 'danger'` para erros. */
export async function showToast(message, { color, duration = 3000 } = {}) {
  currentToast?.dismiss();
  const t = await toastController.create({ message, duration, color, position: 'bottom', positionAnchor: 'quick-footer' });
  currentToast = t;
  t.onDidDismiss().then(() => {
    if (currentToast === t) currentToast = null;
  });
  return t.present();
}

/** ion-alert de confirmação. Resolve true se o usuário confirmar. */
export async function confirmAlert({ header, message, confirmText }) {
  const a = await alertController.create({
    header,
    message,
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      { text: confirmText, role: 'destructive', cssClass: 'alert-danger' }
    ]
  });
  await a.present();
  const { role } = await a.onDidDismiss();
  return role === 'destructive';
}
