const express = require("express");
const bodyParser = require("body-parser");
const { resolve } = require("path");
const envPath = resolve(__dirname + ".env");
const env = require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
stripe.setApiVersion('2019-05-16');
  
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.get("/", (req, res) => {
  const path = resolve(__dirname + "/public/index.html");
  res.sendFile(path);
});

// Process the token from the client against using Charges with the token id
app.post('/process_payment', async (req, res) => {
  const {payment_method_id, payment_intent_id} = req.body;
  try {
    let payment;
    if (!payment_intent_id)
    {
      payment = await stripe.paymentIntents.create({
        payment_method: payment_method_id,
        amount: 1999,
        currency: 'eur',
        confirmation_method: 'manual',
        confirm: true
      })
    }
    else
    {
      payment = await stripe.paymentIntents.confirm(
        payment_intent_id,
      {
        payment_method: payment_method_id
      })
    }
    res.send(generate_payment_response(payment))
  }
  catch (e) { 
    res.send({
      error: e.message
    })
  }
});

function generate_payment_response(payment) {
  if (
    payment.status === 'requires_action' &&
    payment.next_action.type === 'use_stripe_sdk'
  ) {
    // Tell the client to handle the action (e.g., do 3DS)
    return {
      requires_action: true,
      clientSecret: payment.client_secret
    }
  }
  else if (
    (payment.status === 'requires_payment_method' || payment.status === 'requires_source' || payment.status === 'requires_action')
    ) {
    return {
      error: "Your card was denied, please provide a new payment method"
    }
  }
  else if (payment.status === 'succeeded') {
    // Handle your post-payment fullfillment / business logic here. We're returning id and status to display to the client for instructional purposes.
    return {
      payment_id: payment.id,
      payment_status: payment.status
    }
  } 
  else {
    console.log(
      'Invalid status' + payment.status
    )
  }
};

app.listen(5000, () => console.log(`Node server listening on port http://localhost:${5000}`));