import Vue from 'vue'
import Router from 'vue-router'
import Vuex from 'vuex'
import API_Helper from '@/utils/Api'
import _ from '@/utils/lodash'
import Mixin from './Mixin'
import Popover  from 'vue-js-popover'
import TextEditor from "admin/components/TextEditor.vue"
import { VTooltip, VPopover, VClosePopover } from 'v-tooltip'
import VueHotkey from 'v-hotkey'
import Multiselect from 'vue-multiselect'
import Modal from './components/Modal.vue'
import Switches from './components/Switches.vue'
import productIndexedDb from "../utils/productIndexedDb"
import productLogs from "../utils/productLogs"
import * as VueChartJS from 'vue-chartjs'
import "vue-multiselect/dist/vue-multiselect.min.css"

import * as Date_Helper from './date-helper';
window.Date_Helper = Date_Helper;

import dayjs from 'dayjs';
window.dayjs = dayjs;

// Vue Sweet Alert
import VueSweetalert2 from 'vue-sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

Vue.use(VueSweetalert2);

import VueDatePicker from '@mathieustan/vue-datepicker';
import '@mathieustan/vue-datepicker/dist/vue-datepicker.min.css';
Vue.use(VueDatePicker, {
    lang: 'en'
});

import DateRangePicker from 'vue2-daterange-picker';
import 'vue2-daterange-picker/dist/vue2-daterange-picker.css';

Vue.directive( 'tooltip', VTooltip )
Vue.directive( 'close-popover', VClosePopover )
Vue.component( 'v-popover', VPopover )
Vue.component( 'multiselect', Multiselect )

Vue.directive('click-outside', {
    bind: function(el, binding, vNode) {
    // Provided expression must evaluate to a function.
    if (typeof binding.value !== 'function') {
        const compName = vNode.context.name
      let warn = `[Vue-click-outside:] provided expression '${binding.expression}' is not a function, but has to be`
      if (compName) { warn += `Found in component '${compName}'` }

      console.warn(warn)
    }
    // Define Handler and cache it on the element
    const bubble = binding.modifiers.bubble
    const handler = (e) => {
      if (bubble || (!el.contains(e.target) && el !== e.target)) {
        binding.value(e)
      }
    }
    el.__vueClickOutside__ = handler

    // add Event Listeners
    document.addEventListener('click', handler)
        },

  unbind: function(el, binding) {
    // Remove Event Listeners
    document.removeEventListener('click', el.__vueClickOutside__)
    el.__vueClickOutside__ = null
  }
});

Vue.mixin( Mixin );
Vue.use( Popover, { defaultBoundariesElement: document.body } );
Vue.use(VueHotkey);

window.wepos_get_lib = function( lib ) {
    return window.wepos.libs[lib];
}

export const EventBus = new Vue();

window.weLo_                         = _;
window.wepos._                       = _;
window.wepos.api                     = new API_Helper();
window.wepos.libs['Vue']             = Vue;
window.wepos.libs['Router']          = Router;
window.wepos.libs['Vuex']            = Vuex;
window.wepos.libs['TextEditor']      = TextEditor;
window.wepos.libs['EventBus']        = EventBus;
window.wepos.libs['Modal']           = Modal;
window.wepos.libs['Switches']        = Switches;
window.wepos.libs['DateRangePicker'] = DateRangePicker;
window.wepos.libs['VueChartJS']      = VueChartJS;
window.wepos.productIndexedDb        = productIndexedDb;
window.wepos.productLogs             = productLogs;

// WordPress Hooks
import { createHooks } from '@wordpress/hooks';

window.wepos.hooks = createHooks();

wepos.addFilter = ( hookName, namespace, component, priority = 10 ) => {
    wepos.hooks.addFilter(hookName, namespace, (components) => {
        components.push(component);
        return components;
    }, priority );
};

// Product logs synchronization over Heartbeat API.
jQuery( document ).ready( function($) {
    let counterId = wepos.current_cashier.counter_id;

    jQuery( document ).on( 'heartbeat-send', function ( event, data ) {
        // Add current counter id to Heartbeat data.
        data.wepos_counter_id = counterId;
    });

    jQuery( document ).on( 'heartbeat-tick', function ( event, data ) {
        // Check for product logs data.
        if ( ! data.product_logs || 0 === data.product_logs.length ) {
            return;
        }

        // Update products to Indexed DB and database.
        wepos.productLogs.updateProductsToIndexedDb( data.product_logs );
        wepos.productLogs.updateProductLogsData( counterId );
    });
});
