'use strict';

module.exports = {

  // ─── ABANDONED CART ──────────────────────────────────────────────────────

  abandoned_cart_email_1: {
    blocks: ['announcement_bar', 'header', 'hero', 'split', 'footer'],
    content: (brand, flowData) => ({
      announcement: { text: 'Free shipping on all orders' },
      hero: {
        imageUrl: brand.product_images?.[0]?.url || '',
        alt: 'Your cart is waiting',
        headline: 'You left something behind.',
        subtext: 'Your cart is saved. Come back and complete your order.',
        ctaText: 'Complete My Order',
        ctaUrl: '{{ event.extra.checkout_url }}',
      },
      split: {
        text: `Hi {{ first_name|default:"there" }},<br/><br/>Just a friendly reminder — your cart is saved and waiting.<br/><br/>Warmly,<br/>${brand.shop_domain?.split('.')[0] || 'The Team'}`,
        imageUrl: brand.product_images?.[0]?.url || '',
        imageAlt: brand.product_images?.[0]?.productName || 'Product',
      },
    }),
  },

  abandoned_cart_email_2: {
    blocks: ['announcement_bar', 'header', 'hero', 'split', 'social_proof', 'shop_button', 'footer'],
    content: (brand, flowData) => ({
      announcement: { text: 'Free shipping on all orders' },
      hero: {
        imageUrl: brand.product_images?.[0]?.url || '',
        alt: 'Still thinking about it?',
        headline: 'Still thinking about it?',
        subtext: "Here's why thousands of people made the switch.",
        ctaText: 'Complete My Order',
        ctaUrl: '{{ event.extra.checkout_url }}',
      },
      split: {
        text: `Hi {{ first_name|default:"there" }},<br/><br/>We noticed you haven't completed your order. Any questions? Just reply — we're here.<br/><br/>Warmly,<br/>${brand.shop_domain?.split('.')[0] || 'The Team'}`,
        imageUrl: brand.product_images?.[1]?.url || brand.product_images?.[0]?.url || '',
        imageAlt: 'Your order',
      },
      proof: {
        imageUrl: flowData.reviewImageUrl || brand.product_images?.[0]?.url || '',
        reviewerName: 'Sarah',
        reviewText: 'Best purchase I made all year. Noticed a difference within the first week.',
        ctaText: "See Sarah's review",
        ctaUrl: '{{ event.extra.checkout_url }}',
      },
      shopbtn: {
        text: 'COMPLETE MY ORDER',
        url: '{{ event.extra.checkout_url }}',
      },
    }),
  },

  abandoned_cart_email_3: {
    blocks: ['announcement_bar', 'header', 'hero', 'split', 'shop_button', 'footer'],
    content: (brand, flowData) => ({
      announcement: { text: 'Your 10% discount expires soon' },
      hero: {
        imageUrl: brand.product_images?.[0]?.url || '',
        alt: 'Last chance',
        headline: 'Last chance — 10% off inside.',
        subtext: 'Use code SAVE10 at checkout. Expires in 24 hours.',
        ctaText: 'Claim My 10% Off',
        ctaUrl: '{{ event.extra.checkout_url }}',
      },
      split: {
        text: `Hi {{ first_name|default:"there" }},<br/><br/>Your cart is about to expire. Use code SAVE10 for 10% off — today only.<br/><br/>Warmly,<br/>${brand.shop_domain?.split('.')[0] || 'The Team'}`,
        imageUrl: brand.product_images?.[0]?.url || '',
        imageAlt: 'Last chance offer',
      },
      shopbtn: {
        text: 'CLAIM 10% OFF NOW',
        url: '{{ event.extra.checkout_url }}',
      },
    }),
  },

  // ─── CHECKOUT ABANDONMENT ─────────────────────────────────────────────────

  checkout_abandonment_email_1: {
    blocks: ['announcement_bar', 'header', 'hero', 'split', 'footer'],
    content: (brand, flowData) => ({
      announcement: { text: 'Free shipping on all orders' },
      hero: {
        imageUrl: brand.product_images?.[0]?.url || '',
        alt: 'Complete your checkout',
        headline: 'You were so close.',
        subtext: 'Your order is saved. One step left.',
        ctaText: 'Complete Checkout',
        ctaUrl: '{{ event.extra.checkout_url }}',
      },
      split: {
        text: `Hi {{ first_name|default:"there" }},<br/><br/>You made it all the way to checkout — your order is saved and ready to go.<br/><br/>Warmly,<br/>${brand.shop_domain?.split('.')[0] || 'The Team'}`,
        imageUrl: brand.product_images?.[0]?.url || '',
        imageAlt: 'Your order',
      },
    }),
  },

  checkout_abandonment_email_2: {
    blocks: ['announcement_bar', 'header', 'hero', 'split', 'shop_button', 'footer'],
    content: (brand, flowData) => ({
      announcement: { text: 'Free shipping on all orders' },
      hero: {
        imageUrl: brand.product_images?.[0]?.url || '',
        alt: 'Still waiting',
        headline: 'Your order is still waiting.',
        subtext: "Don't let it go to someone else.",
        ctaText: 'Finish My Order',
        ctaUrl: '{{ event.extra.checkout_url }}',
      },
      split: {
        text: `Hi {{ first_name|default:"there" }},<br/><br/>Your checkout is saved, but we can't hold it forever. Complete your order now.<br/><br/>Warmly,<br/>${brand.shop_domain?.split('.')[0] || 'The Team'}`,
        imageUrl: brand.product_images?.[1]?.url || brand.product_images?.[0]?.url || '',
        imageAlt: 'Your order',
      },
      shopbtn: {
        text: 'FINISH MY ORDER',
        url: '{{ event.extra.checkout_url }}',
      },
    }),
  },

  // ─── WELCOME SERIES ───────────────────────────────────────────────────────

  welcome_email_1: {
    blocks: ['header', 'hero', 'split', 'shop_button', 'footer'],
    content: (brand, flowData) => ({
      hero: {
        imageUrl: brand.product_images?.[0]?.url || '',
        alt: 'Welcome',
        headline: 'Welcome to the family.',
        subtext: "You're in. Here's what makes us different.",
        ctaText: 'Explore The Store',
        ctaUrl: `https://${brand.shop_domain}`,
      },
      split: {
        text: `Hi {{ first_name|default:"there" }},<br/><br/>Thanks for signing up. We're glad you're here — we'll keep it worth your while.<br/><br/>Warmly,<br/>${brand.shop_domain?.split('.')[0] || 'The Team'}`,
        imageUrl: brand.product_images?.[0]?.url || '',
        imageAlt: 'Welcome',
      },
      shopbtn: {
        text: 'EXPLORE THE STORE',
        url: `https://${brand.shop_domain}`,
      },
    }),
  },

  welcome_email_2: {
    blocks: ['announcement_bar', 'header', 'hero', 'product_showcase', 'split', 'shop_button', 'footer'],
    content: (brand, flowData) => ({
      announcement: { text: 'Free shipping on all orders' },
      hero: {
        imageUrl: brand.product_images?.[0]?.url || '',
        alt: 'Best sellers',
        headline: 'Our most loved products.',
        subtext: 'Start here — these are what people come back for.',
        ctaText: 'Shop Best Sellers',
        ctaUrl: `https://${brand.shop_domain}`,
      },
      showcase: {
        product1Image: brand.product_images?.[0]?.url || '',
        product1Name:  brand.product_images?.[0]?.productName || 'Best Seller',
        product1Price: brand.product_images?.[0]?.price ? `$${brand.product_images[0].price}` : '',
        product1Url:   `https://${brand.shop_domain}`,
        product2Image: brand.product_images?.[1]?.url || brand.product_images?.[0]?.url || '',
        product2Name:  brand.product_images?.[1]?.productName || 'Fan Favourite',
        product2Price: brand.product_images?.[1]?.price ? `$${brand.product_images[1].price}` : '',
        product2Url:   `https://${brand.shop_domain}`,
      },
      split: {
        text: `These are our most loved products — and for good reason.<br/><br/>Questions about which is right for you? Just reply to this email.`,
        imageUrl: brand.product_images?.[2]?.url || brand.product_images?.[0]?.url || '',
        imageAlt: 'Our products',
      },
      shopbtn: {
        text: 'SHOP NOW',
        url: `https://${brand.shop_domain}`,
      },
    }),
  },

  // ─── POST PURCHASE ────────────────────────────────────────────────────────

  post_purchase_email_1: {
    blocks: ['header', 'hero', 'split', 'shop_button', 'footer'],
    content: (brand, flowData) => ({
      hero: {
        imageUrl: brand.product_images?.[0]?.url || '',
        alt: 'Thank you',
        headline: 'Your order is confirmed.',
        subtext: "You made a great choice. Here's what to expect.",
        ctaText: 'Track My Order',
        ctaUrl: '{{ event.extra.checkout_url }}',
      },
      split: {
        text: `Hi {{ first_name|default:"there" }},<br/><br/>Thank you for your order — it's on its way. We'll send tracking as soon as it ships.<br/><br/>Warmly,<br/>${brand.shop_domain?.split('.')[0] || 'The Team'}`,
        imageUrl: brand.product_images?.[0]?.url || '',
        imageAlt: 'Your order',
      },
      shopbtn: {
        text: 'TRACK MY ORDER',
        url: '{{ event.extra.checkout_url }}',
      },
    }),
  },

  post_purchase_email_2: {
    blocks: ['announcement_bar', 'header', 'hero', 'split', 'shop_button', 'footer'],
    content: (brand, flowData) => ({
      announcement: { text: 'Free shipping on all orders' },
      hero: {
        imageUrl: brand.product_images?.[0]?.url || '',
        alt: 'Getting started',
        headline: 'Get the most out of it.',
        subtext: 'A few tips to help you start strong.',
        ctaText: 'Read The Guide',
        ctaUrl: `https://${brand.shop_domain}/blogs/news`,
      },
      split: {
        text: `Hi {{ first_name|default:"there" }},<br/><br/>Your order is arriving soon. Here's how to get the best results from day one.<br/><br/>Warmly,<br/>${brand.shop_domain?.split('.')[0] || 'The Team'}`,
        imageUrl: brand.product_images?.[1]?.url || brand.product_images?.[0]?.url || '',
        imageAlt: 'Getting started',
      },
      shopbtn: {
        text: 'READ THE GUIDE',
        url: `https://${brand.shop_domain}/blogs/news`,
      },
    }),
  },

  post_purchase_email_3: {
    blocks: ['header', 'hero', 'split', 'shop_button', 'footer'],
    content: (brand, flowData) => ({
      hero: {
        imageUrl: brand.product_images?.[0]?.url || '',
        alt: 'Leave a review',
        headline: 'How are you getting on?',
        subtext: 'Your feedback means everything to us.',
        ctaText: 'Leave A Review',
        ctaUrl: `https://${brand.shop_domain}`,
      },
      split: {
        text: `Hi {{ first_name|default:"there" }},<br/><br/>It's been 2 weeks since your order. A quick review helps others make the right choice.<br/><br/>Warmly,<br/>${brand.shop_domain?.split('.')[0] || 'The Team'}`,
        imageUrl: brand.product_images?.[0]?.url || '',
        imageAlt: 'Leave a review',
      },
      shopbtn: {
        text: 'LEAVE A REVIEW',
        url: `https://${brand.shop_domain}`,
      },
    }),
  },

  // ─── WIN-BACK ─────────────────────────────────────────────────────────────

  winback_email_1: {
    blocks: ['announcement_bar', 'header', 'hero', 'split', 'footer'],
    content: (brand, flowData) => ({
      announcement: { text: 'We miss you — come back' },
      hero: {
        imageUrl: brand.product_images?.[0]?.url || '',
        alt: 'We miss you',
        headline: "It's been a while.",
        subtext: "We've missed you. Here's what's new.",
        ctaText: "See What's New",
        ctaUrl: `https://${brand.shop_domain}`,
      },
      split: {
        text: `Hi {{ first_name|default:"there" }},<br/><br/>We noticed it's been a while. We've got new products and would love to have you back.<br/><br/>Warmly,<br/>${brand.shop_domain?.split('.')[0] || 'The Team'}`,
        imageUrl: brand.product_images?.[0]?.url || '',
        imageAlt: "What's new",
      },
    }),
  },

  winback_email_2: {
    blocks: ['announcement_bar', 'header', 'hero', 'split', 'shop_button', 'footer'],
    content: (brand, flowData) => ({
      announcement: { text: '15% off — just for you' },
      hero: {
        imageUrl: brand.product_images?.[0]?.url || '',
        alt: 'Special offer',
        headline: 'A personal offer for you.',
        subtext: '15% off your next order. No strings.',
        ctaText: 'Claim 15% Off',
        ctaUrl: `https://${brand.shop_domain}`,
      },
      split: {
        text: `Hi {{ first_name|default:"there" }},<br/><br/>Use code WELCOME15 for 15% off anything in the store — valid for the next 7 days.<br/><br/>Warmly,<br/>${brand.shop_domain?.split('.')[0] || 'The Team'}`,
        imageUrl: brand.product_images?.[0]?.url || '',
        imageAlt: 'Your offer',
      },
      shopbtn: {
        text: 'CLAIM 15% OFF',
        url: `https://${brand.shop_domain}`,
      },
    }),
  },

  // ─── BROWSE ABANDONMENT ───────────────────────────────────────────────────

  browse_abandonment_email_1: {
    blocks: ['announcement_bar', 'header', 'hero', 'split', 'footer'],
    content: (brand, flowData) => ({
      announcement: { text: 'Free shipping on all orders' },
      hero: {
        imageUrl: brand.product_images?.[0]?.url || '',
        alt: 'Still interested?',
        headline: 'Still thinking about it?',
        subtext: "We noticed you were browsing. It's still there.",
        ctaText: 'Pick Up Where You Left Off',
        ctaUrl: `https://${brand.shop_domain}`,
      },
      split: {
        text: `Hi {{ first_name|default:"there" }},<br/><br/>You were browsing earlier — whatever caught your eye is still available. Questions? Just reply.<br/><br/>Warmly,<br/>${brand.shop_domain?.split('.')[0] || 'The Team'}`,
        imageUrl: brand.product_images?.[0]?.url || '',
        imageAlt: 'Still available',
      },
    }),
  },

  // ─── BACK IN STOCK ────────────────────────────────────────────────────────

  back_in_stock_email_1: {
    blocks: ['announcement_bar', 'header', 'hero', 'product_showcase', 'shop_button', 'footer'],
    content: (brand, flowData) => ({
      announcement: { text: "It's back — but not for long" },
      hero: {
        imageUrl: brand.product_images?.[0]?.url || '',
        alt: 'Back in stock',
        headline: "It's back in stock.",
        subtext: 'You asked for it. Get it before it sells out again.',
        ctaText: 'Shop Now',
        ctaUrl: `https://${brand.shop_domain}`,
      },
      showcase: {
        product1Image: brand.product_images?.[0]?.url || '',
        product1Name:  brand.product_images?.[0]?.productName || 'Back In Stock',
        product1Price: brand.product_images?.[0]?.price ? `$${brand.product_images[0].price}` : '',
        product1Url:   `https://${brand.shop_domain}`,
        product2Image: brand.product_images?.[1]?.url || brand.product_images?.[0]?.url || '',
        product2Name:  brand.product_images?.[1]?.productName || 'You Might Also Like',
        product2Price: brand.product_images?.[1]?.price ? `$${brand.product_images[1].price}` : '',
        product2Url:   `https://${brand.shop_domain}`,
      },
      shopbtn: {
        text: 'SHOP NOW',
        url: `https://${brand.shop_domain}`,
      },
    }),
  },

  // ─── PRICE DROP ───────────────────────────────────────────────────────────

  price_drop_email_1: {
    blocks: ['announcement_bar', 'header', 'hero', 'split', 'shop_button', 'footer'],
    content: (brand, flowData) => ({
      announcement: { text: 'Price just dropped' },
      hero: {
        imageUrl: brand.product_images?.[0]?.url || '',
        alt: 'Price drop',
        headline: 'The price just dropped.',
        subtext: 'Something you viewed is now on sale.',
        ctaText: 'See The Price',
        ctaUrl: `https://${brand.shop_domain}`,
      },
      split: {
        text: `Hi {{ first_name|default:"there" }},<br/><br/>Good news — something you were looking at has just gone on sale. Now's the time.<br/><br/>Warmly,<br/>${brand.shop_domain?.split('.')[0] || 'The Team'}`,
        imageUrl: brand.product_images?.[0]?.url || '',
        imageAlt: 'On sale now',
      },
      shopbtn: {
        text: 'SEE THE PRICE',
        url: `https://${brand.shop_domain}`,
      },
    }),
  },

  // ─── VIP ──────────────────────────────────────────────────────────────────

  vip_email_1: {
    blocks: ['announcement_bar', 'header', 'hero', 'split', 'social_proof', 'shop_button', 'footer'],
    content: (brand, flowData) => ({
      announcement: { text: 'Exclusive access — VIP only' },
      hero: {
        imageUrl: brand.product_images?.[0]?.url || '',
        alt: 'VIP access',
        headline: "You're one of our best.",
        subtext: 'Early access, exclusive offers — just for you.',
        ctaText: 'Access VIP Offer',
        ctaUrl: `https://${brand.shop_domain}`,
      },
      split: {
        text: `Hi {{ first_name|default:"there" }},<br/><br/>You're one of our top customers — exclusive early access is yours.<br/><br/>Warmly,<br/>${brand.shop_domain?.split('.')[0] || 'The Team'}`,
        imageUrl: brand.product_images?.[0]?.url || '',
        imageAlt: 'VIP offer',
      },
      proof: {
        imageUrl: flowData.reviewImageUrl || brand.product_images?.[0]?.url || '',
        reviewerName: 'James',
        reviewText: "I've been a customer for over a year. The quality is consistently excellent — nothing else comes close.",
        ctaText: "See James's review",
        ctaUrl: `https://${brand.shop_domain}`,
      },
      shopbtn: {
        text: 'ACCESS VIP OFFER',
        url: `https://${brand.shop_domain}`,
      },
    }),
  },

};
