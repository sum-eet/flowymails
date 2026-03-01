// Each flow email = array of block names + content function
// Content function receives (brand, flowData) and returns the content object

module.exports = {

  abandoned_cart_email_1: {
    blocks: ['announcement_bar', 'header', 'hero', 'split', 'footer'],
    content: (brand, flowData) => ({
      announcement: {
        text: 'Free shipping on all orders',
      },
      hero: {
        imageUrl: flowData.productImageUrl || brand.product_images?.[0]?.url || '',
        alt: 'Your cart is waiting',
        headline: 'You left something behind.',
        subtext: 'Your cart is saved. Come back and complete your order.',
        ctaText: 'Complete My Order',
        ctaUrl: '{{ event.extra.checkout_url }}',
      },
      split: {
        text: `Hi {{ first_name|default:"there" }},\n\nJust a friendly reminder that you left something in your cart. We've saved it for you.\n\nWarmly,\n${brand.shop_domain?.split('.')[0] || 'The Team'}`,
        imageUrl: brand.product_images?.[0]?.url || '',
        imageAlt: brand.product_images?.[0]?.productName || 'Product',
      },
    }),
  },

  abandoned_cart_email_2: {
    blocks: ['announcement_bar', 'header', 'hero', 'split', 'social_proof', 'shop_button', 'footer'],
    content: (brand, flowData) => ({
      announcement: {
        text: 'Free shipping on all orders',
      },
      hero: {
        imageUrl: flowData.lifestyleImageUrl || brand.product_images?.[0]?.url || '',
        alt: 'Still thinking about it?',
        headline: 'Still thinking about it?',
        subtext: 'Here\'s why thousands of people made the switch.',
        ctaText: 'Complete My Order',
        ctaUrl: '{{ event.extra.checkout_url }}',
      },
      split: {
        text: `Hi {{ first_name|default:"there" }},\n\nWe noticed you haven't completed your order yet. If you have any questions, just reply to this email — we're here.\n\nWarmly,\nThe ${brand.shop_domain?.split('.')[0] || ''} Team`,
        imageUrl: flowData.couponImageUrl || '',
        imageAlt: 'Your discount',
      },
      proof: {
        imageUrl: flowData.reviewImageUrl || '',
        reviewerName: flowData.reviewerName || 'Happy Customer',
        reviewText: flowData.reviewText || 'Absolutely love this product. Best purchase I\'ve made all year.',
        ctaText: 'See their story',
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
      announcement: {
        text: 'Free shipping on all orders',
      },
      hero: {
        imageUrl: brand.product_images?.[0]?.url || '',
        alt: 'Last chance',
        headline: 'Last chance — 10% off inside.',
        subtext: 'Use code SAVE10 at checkout. Expires soon.',
        ctaText: 'Claim My 10% Off',
        ctaUrl: '{{ event.extra.checkout_url }}',
      },
      split: {
        text: `Hi {{ first_name|default:"there" }},\n\nYour cart is about to expire. Use code SAVE10 for 10% off before it's gone.\n\nWarmly,\nThe ${brand.shop_domain?.split('.')[0] || ''} Team`,
        imageUrl: flowData.urgencyImageUrl || brand.product_images?.[0]?.url || '',
        imageAlt: 'Last chance offer',
      },
      shopbtn: {
        text: 'CLAIM 10% OFF NOW',
        url: '{{ event.extra.checkout_url }}',
      },
    }),
  },

};
