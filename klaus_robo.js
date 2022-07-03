const fs = require("fs");

async function storeData(data, path) {
  try {
    fs.writeFileSync(path, JSON.stringify(data));
  } catch (err) {
    console.error(err);
  }
}

function checkIfIsRedCandle(candleObj) {
  let close = parseFloat(candleObj.close);
  let open = parseFloat(candleObj.open);

  if (close < open) {
    return true;
  }
  return false;
}

function engolfando(candles) {
  if (
    parseFloat(candles[candles.length - 1].open) <=
      parseFloat(candles[candles.length - 2].close) &&
    parseFloat(candles[candles.length - 1].close) >
      parseFloat(candles[candles.length - 2].open) &&
    checkIfIsRedCandle(candles[candles.length - 2]) &&
    !checkIfIsRedCandle(candles[candles.length - 1])
  ) {
    return true;
  }
  return false;
}

function createCoins(client, tikate) {
  let symbols = tikate["symbols"];
  let symbolList = symbols.filter(
    (s) => s.quoteAsset === "BTC" && s.status === "TRADING"
  );

  var coinList = symbolList.map(function (el) {
    return el.symbol;
  });

  fs.writeFile("todas.txt", coinList.join("\n"), function (err) {
    console.log("list saved");
  });

  function createEachCoin(coin) {
    return new Promise(async (resolve) => {
      let candlesMenores = await client
        .candles({
          symbol: coin,
          interval: "4h",
          limit: 2,
        })
        .catch((erro) => {
          console.log("erro" + erro);
          return [];
        });

      if (candlesMenores.length > 0 && engolfando(candlesMenores)) {
        resolve({ coin, comprou: true });
      } else {
        resolve({ coin, comprou: false });
      }
    });
  }
  const promiseAll = [...coinList.map((coin) => createEachCoin(coin))];
  return Promise.all(promiseAll);
}

module.exports = {
  async getCoins(client, tickets) {
    createCoins(client, tickets)
      .then((promises) => {
        let compradas = promises.filter((p) => p.comprou);
        storeData(compradas, "compradas.json");
        let naoCompradas = promises.filter((p) => !p.comprou);

        compradas.forEach(({ coin, comprou }) =>
          console.log("moeda: " + coin + " comprou: " + comprou)
        );
        console.log("\n");
        let dataNow = new Date();
        console.log("ultima verificação: " + dataNow.toISOString());
        console.log("nao compradas: " + naoCompradas.length);
        console.log("compradas: " + compradas.length);
        console.log("\n");
      })
      .catch((err) => {
        console.log(err);
        console.log("\n");
        console.log("\n");
      });
  },
};
