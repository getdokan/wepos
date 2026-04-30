### New Scale of Update
1.  We need to update the **General Setting** of Admin Setting with [these features](https://prnt.sc/7zC6Lh73_5tI)
2. The **General Settings** features available [here in POS](https://prnt.sc/OlmLQVb1FQIk) need to be available in wePOS Admin Panel settings. Reason is if any admin runs his/her own Store then these settings need to be available for that store. That will sync with POS level **General Setting** and update accordingly. Therefore we need to update the **General Settings** of the current wePOS which we have right now
3. The **Tax Settings** features available [here in POS](https://prnt.sc/7bHKoQge1fhH) need to be available in wePOS Admin Panel settings. Reason is if any admin runs his/her own Store then these settings need to be available for that store. That will sync with POS level **Tax Setting** and update accordingly. Therefore we need to update the **Tax Settings** of the current wePOS which we have right now
4. The **Barcode Settings** features available [here in POS](https://prnt.sc/7N24o_S9HE22  ) need to be available in wePOS Admin Panel settings. Reason is if any admin runs his/her own Store then these settings need to be available for that store. That will sync with POS level **Barcode Setting** and update accordingly. Therefore we need to update the **Barcode Settings** of the current wePOS which we have right now
5. When **Dokan** plugin will be available then [these 2](https://prnt.sc/vxG8gi2kJBeV) should be available in Admin Panel > Settings > Access and these options should be available for toggle on/off
6. From Admin Panel side, Shop Manager, Cashier, Vendor and Vendor Staff --> for these 4 roles [there will be a new section](https://prnt.sc/_p9EdvkUYKxj) available in named as settings which will give the following accessibility option towards these users.
- view_general_settings
- edit_general_settings
- view_tax_settings
- edit_tax_settings
- view_barcode_settings
- edit_barcode_settings

The control of these will be toggled by Admin. The above mentioned points are basically revamping [this section](https://prnt.sc/cWHtZW6qrNpB).

7. From Admin Panel to the level of Vendor Staff implement the following logic carefully

> - If an Admin setup any settings that is applicable for that Admins store and outlets only (While only WooCommerce)
When

> - If an Admin setup any settings while having Dokan as a Plugin, that propagates to Vendor and Vendor Staff. As per the conditions of the setting option updated from Admin according to these
> - view_general_settings
> - edit_general_settings
> - view_tax_settings
> - edit_tax_settings
> - view_barcode_settings
> - edit_barcode_settings
> Then Vendors and Vendor staff can view or take action on the settings. However if Vendor updates any settings that will be only applicable for that Vendor Store only and won't take effect on Admin's entire Marketplace or other Vendors. Following to the update Vendor will get similar settings from Vendor Dashboard. If Vendor give permission to update settings on any Vendor Staff for POS specific then actions from that Cashier will take effect only on Vendor's store and outlets of that Vendor only, not any other Vendor Staff outlet.
---
1. In Vendor Dashboard, wePOS Settings > [Store Information are not getting updated](https://prnt.sc/7BdJi2Z1suqB) from Vendor Store Settings