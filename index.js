const Binance = require("binance-api-node").default;
const client = Binance({
  apiKey: "",
  apiSecret: "",
  getTime: () => Date.now(),
});

var cron = require("cron");
var robot = require("./klaus_robo");

var tik = null;

async function getTik(client) {
  let tickets = await client.exchangeInfo().catch((erro) => {
    console.log("erro" + erro);
  });

  if (tik == null && tickets !== {}) {
    tik = tickets;
  }
}

getTik(client);

var job = new cron.CronJob({
  cronTime: "*/1 * * * *",
  onTick: async function () {
    robot.getCoins(client, tik);
  },
  start: false,
  timeZone: "America/Sao_Paulo",
});

job.start();
