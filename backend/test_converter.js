import { getIzentBetCodes } from './izentbet.js';

async function test() {
  console.log("Testing getIzentBetCodes...");
  const signal = {
    home: "Korona Kielce",
    away: "Katowice",
    betType: "Back Over 1.5 Goals",
    league: "Ekstraklasa"
  };
  
  const codes = await getIzentBetCodes(signal);
  console.log("Returned codes:", codes);
}

test();
