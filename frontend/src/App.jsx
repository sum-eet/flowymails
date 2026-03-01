import React, { useState } from 'react';
import Shell from './components/Shell.jsx';
import Auth from './screens/Auth.jsx';
import Dashboard from './screens/Dashboard.jsx';
import FlowsList from './screens/FlowsList.jsx';
import Campaigns from './screens/Campaigns.jsx';

export default function App() {
  // Read shop from URL on load (set after Shopify OAuth redirect)
  const urlShop = new URLSearchParams(window.location.search).get('shop') || '';

  const [screen,     setScreen]     = useState(urlShop ? 'auth' : 'auth');
  const [shopDomain, setShopDomain] = useState(urlShop);

  const navigate = (target) => setScreen(target);

  if (screen === 'auth') {
    return (
      <Auth
        shopDomain={shopDomain}
        setShopDomain={setShopDomain}
        onComplete={() => setScreen('dashboard')}
      />
    );
  }

  return (
    <Shell screen={screen} navigate={navigate} shopDomain={shopDomain}>
      {screen === 'dashboard' && <Dashboard navigate={navigate} shopDomain={shopDomain} />}
      {screen === 'flows'     && <FlowsList navigate={navigate} shopDomain={shopDomain} />}
      {screen === 'campaigns' && <Campaigns navigate={navigate} shopDomain={shopDomain} />}
    </Shell>
  );
}
