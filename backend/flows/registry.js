// Flow registry — LOCKED structure. Add entries only. Keys = flow_type in DB.
// Steps use simplified format; deploy.js converts to Klaviyo API format.
// estimated_monthly_revenue: static display string shown in audit + flows screens.

module.exports = {

  abandoned_cart: {
    id: 'abandoned_cart',
    name: 'Abandoned Cart',
    trigger_metric_name: 'Added to Cart',
    estimated_monthly_revenue: '$1,200',
    steps: [
      { type: 'time-delay', hours: 1 },
      { type: 'send-email', template: 'ac_email_1', subject: 'You left something behind', preview: 'Your cart is waiting' },
      { type: 'time-delay', hours: 2 },
      { type: 'send-sms', body: "Hey {{ first_name|default:'there' }}, still have items in your cart? Pick up where you left off: {{ event.extra.checkout_url }}  Reply STOP to unsubscribe." },
      { type: 'time-delay', hours: 21 },
      { type: 'send-email', template: 'ac_email_2', subject: "Still thinking about it?", preview: "Here's why others love it" },
      { type: 'time-delay', hours: 1 },
      { type: 'send-sms', body: "Still on the fence? Thousands of customers swear by it. {{ event.extra.checkout_url }}  Reply STOP to unsubscribe." },
      { type: 'time-delay', hours: 47 },
      { type: 'send-email', template: 'ac_email_3', subject: 'Last chance — 10% off inside', preview: 'Use code DRWATER10 before it expires' },
      { type: 'time-delay', hours: 1 },
      { type: 'send-sms', body: "Final reminder — use DRWATER10 for 10% off before it expires. {{ event.extra.checkout_url }}  Reply STOP to unsubscribe." },
    ],
  },

  checkout_abandonment: {
    id: 'checkout_abandonment',
    name: 'Checkout Abandonment',
    trigger_metric_name: 'Checkout Started',
    estimated_monthly_revenue: '$900',
    steps: [
      { type: 'time-delay', hours: 1 },
      { type: 'send-email', template: 'co_email_1', subject: 'You were so close', preview: 'Complete your purchase — your items are waiting' },
      { type: 'time-delay', hours: 3 },
      { type: 'send-sms', body: "Hey {{ first_name|default:'there' }}, you were so close. Complete your order here: {{ event.extra.checkout_url }}  Reply STOP to unsubscribe." },
      { type: 'time-delay', hours: 20 },
      { type: 'send-email', template: 'co_email_2', subject: 'Still thinking? Here is our guarantee', preview: 'Free returns, 30-day satisfaction guarantee' },
      { type: 'time-delay', hours: 48 },
      { type: 'send-email', template: 'co_email_3', subject: 'Last chance — 10% off your order', preview: 'Use DRWATER10 at checkout' },
    ],
  },

  welcome_series: {
    id: 'welcome_series',
    name: 'Welcome Series',
    trigger_metric_name: 'Subscribed to List',
    estimated_monthly_revenue: '$640',
    steps: [
      { type: 'send-email', template: 'ws_email_1', subject: 'Welcome — here is what we are all about', preview: 'You just joined something good' },
      { type: 'time-delay', hours: 24 },
      { type: 'send-email', template: 'ws_email_2', subject: 'Our best sellers — picked for you', preview: 'What thousands of customers are loving right now' },
      { type: 'time-delay', hours: 48 },
      { type: 'send-email', template: 'ws_email_3', subject: 'Real results from real customers', preview: 'Here is what people are saying' },
      { type: 'time-delay', hours: 48 },
      { type: 'send-email', template: 'ws_email_4', subject: '10% off your first order', preview: 'A welcome gift — use code WELCOME10' },
      { type: 'time-delay', hours: 48 },
      { type: 'send-sms', body: "Hey {{ first_name|default:'there' }}, your 10% welcome discount is still waiting. Use WELCOME10 at checkout. Reply STOP to unsubscribe." },
    ],
  },

  post_purchase: {
    id: 'post_purchase',
    name: 'Post-Purchase',
    trigger_metric_name: 'Placed Order',
    estimated_monthly_revenue: '$320',
    steps: [
      { type: 'time-delay', hours: 24 },
      { type: 'send-email', template: 'pp_email_1', subject: 'Thank you — your order is on its way', preview: 'Everything you need to know about your order' },
      { type: 'time-delay', hours: 144 }, // 7 days total
      { type: 'send-email', template: 'pp_email_2', subject: 'Getting the most out of your purchase', preview: 'Pro tips from our team' },
      { type: 'time-delay', hours: 168 }, // 14 days total
      { type: 'send-email', template: 'pp_email_3', subject: 'How are you finding it? Leave a review', preview: 'Your feedback helps other customers' },
      { type: 'time-delay', hours: 360 }, // ~30 days total
      { type: 'send-sms', body: "Time to refill? We have made it easy — shop here: https://{{ store.url }}  Reply STOP to unsubscribe." },
    ],
  },

  winback: {
    id: 'winback',
    name: 'Win-Back',
    trigger_metric_name: 'Placed Order',
    estimated_monthly_revenue: '$440',
    steps: [
      { type: 'send-email', template: 'wb_email_1', subject: 'We miss you', preview: 'It has been a while — here is what is new' },
      { type: 'time-delay', hours: 72 },
      { type: 'send-email', template: 'wb_email_2', subject: 'Our best sellers this season', preview: 'New and loved — see what you have been missing' },
      { type: 'time-delay', hours: 96 },
      { type: 'send-email', template: 'wb_email_3', subject: 'Come back — 15% off, just for you', preview: 'Use COMEBACK15 before it expires' },
      { type: 'time-delay', hours: 24 },
      { type: 'send-sms', body: "{{ first_name|default:'Hey' }}, your 15% offer expires soon. Use COMEBACK15 here: https://{{ store.url }}  Reply STOP to unsubscribe." },
    ],
  },

  browse_abandonment: {
    id: 'browse_abandonment',
    name: 'Browse Abandonment',
    trigger_metric_name: 'Viewed Product',
    estimated_monthly_revenue: '$270',
    steps: [
      { type: 'time-delay', hours: 4 },
      { type: 'send-email', template: 'ba_email_1', subject: 'Still thinking about it?', preview: 'The product you viewed is still available' },
      { type: 'time-delay', hours: 20 },
      { type: 'send-email', template: 'ba_email_2', subject: 'Here is what customers are saying', preview: 'Real reviews from people who made the switch' },
      { type: 'time-delay', hours: 24 },
      { type: 'send-sms', body: "{{ first_name|default:'Hey' }}, still interested? Grab it here: {{ event.extra.checkout_url }}  Reply STOP to unsubscribe." },
    ],
  },

  back_in_stock: {
    id: 'back_in_stock',
    name: 'Back in Stock',
    trigger_metric_name: 'Subscribed to Back in Stock',
    estimated_monthly_revenue: '$210',
    steps: [
      { type: 'send-email', template: 'bis_email_1', subject: 'It is back — grab it before it sells out again', preview: 'You asked us to let you know. Here we are.' },
      { type: 'time-delay', hours: 4 },
      { type: 'send-sms', body: "Good news {{ first_name|default:'there' }}, the item you wanted is back in stock. Get it now: {{ event.extra.product_url }}  Reply STOP to unsubscribe." },
    ],
  },

  sms_welcome: {
    id: 'sms_welcome',
    name: 'SMS Welcome',
    trigger_metric_name: 'Subscribed to List',
    estimated_monthly_revenue: '$180',
    steps: [
      { type: 'send-sms', body: "Welcome! Here is 10% off your first order — use WELCOME10 at checkout: https://{{ store.url }}  Reply STOP to unsubscribe." },
      { type: 'time-delay', hours: 48 },
      { type: 'send-sms', body: "{{ first_name|default:'Hey' }}, have you seen our best sellers? Shop now: https://{{ store.url }}  Reply STOP to unsubscribe." },
    ],
  },

  vip: {
    id: 'vip',
    name: 'VIP / High-Value',
    trigger_metric_name: 'Placed Order',
    estimated_monthly_revenue: '$380',
    steps: [
      { type: 'send-email', template: 'vip_email_1', subject: 'You are one of our best customers', preview: 'Early access to new arrivals — just for you' },
      { type: 'time-delay', hours: 168 }, // 7 days
      { type: 'send-email', template: 'vip_email_2', subject: 'Handpicked for you based on your orders', preview: 'Products we think you will love next' },
      { type: 'time-delay', hours: 168 }, // 14 days total
      { type: 'send-sms', body: "{{ first_name|default:'Hey' }}, your exclusive VIP offer is ready. Tap here: https://{{ store.url }}  Reply STOP to unsubscribe." },
    ],
  },

  price_drop: {
    id: 'price_drop',
    name: 'Price Drop',
    trigger_metric_name: 'Price Drop Alert',
    estimated_monthly_revenue: '$150',
    steps: [
      { type: 'send-email', template: 'pd_email_1', subject: 'The price just dropped on something you liked', preview: 'Now is the time to grab it' },
      { type: 'time-delay', hours: 4 },
      { type: 'send-sms', body: "Good news {{ first_name|default:'there' }}, the price just dropped. Get it now before it goes back up: {{ event.extra.product_url }}  Reply STOP to unsubscribe." },
    ],
  },

};
