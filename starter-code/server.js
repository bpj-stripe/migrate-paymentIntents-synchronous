const express = require("express");
const bodyParser = require("body-parser");
const { resolve } = require("path");
const envPath = resolve(__dirname + ".env");
const env = require("dotenv").config();
const stripe = require("stripe")(env.parsed.STRIPE_SECRET_KEY);

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.get("/", (req, res) => {
  let path = resolve(__dirname + "/public/index.html");
  res.sendFile(path);
});

app.post('/process_payment', async (req, res) => {
  try {
    const payment = await stripe.charges.create({
      source: req.body.token_id,
      amount: 1999,
      currency: 'eur',
    })
    res.send({
      payment_id: payment.id,
      payment_status: payment.status,
    })
  }
  catch (e) {
    res.send({
      payment_status: e.message,
    })
  }
});

app.listen(5000, () => console.log(`Node server listening on port http://localhost:${5000}`));