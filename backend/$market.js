import fetch from 'node-fetch';

export async function convertTo$market(signal) {
  try {
    if (!process.env.CONVERTER_URL) {
      console.warn("Warning: CONVERTER_URL not set. $market links will not be generated.");
      return null;
    }

    let mappedMarket;
    switch (signal.betType) {
      case "Back Over 1.5 Goals":
        mappedMarket = "Over 1.5";
        break;
      case "Back Over 2.5 Goals":
        mappedMarket = "Over 2.5";
        break;
      case "Both Teams to Score":
        mappedMarket = "GG";
        break;
      default:
        mappedMarket = "Over 1.5";
    }

    const payload = {
      home: signal.home,
      away: signal.away,
      market: mappedMarket,
      league: signal.league
    };

    const res = await fetch(`${process.env.CONVERTER_URL}/api/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Converter API responded with status ${res.status}`);
    }

    const data = await res.json();
    if (data.success && data.shareCode) {
      const shareCode = data.shareCode;
      let betLink = data.betLink;
      
      if (!betLink) {
        betLink = `https://www.$market.com/ng/m/?shareCode=${shareCode}&c=ng#betslip`;
      }

      console.log(`✅ $market link generated: ${shareCode} for ${signal.home} vs ${signal.away}`);

      return {
        shareCode,
        betLink,
        market: mappedMarket
      };
    } else {
      throw new Error(data.message || "Converter failed to return shareCode");
    }
  } catch (error) {
    console.error("Converter failed:", error.message);
    return null;
  }
}
