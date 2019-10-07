// Create an instance of the Stripe client
const stripe = Stripe("enter-your-publishable-test-key-here");

// Create an instance of Elements
const elements = stripe.elements();
const style = {
  base: {
    color: '#32325d',
    fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
    fontSmoothing: 'antialiased',
    fontSize: '16px',
    '::placeholder': {
      color: '#aab7c4'
    }
  },
  invalid: {
    color: '#fa755a',
    iconColor: '#fa755a'
  }
};
// Create an instance of the card Element by invoking the object with a method of the type card: https://stripe.com/docs/stripe-js/reference#element-types
const card = elements.create('card', {style: style});

// Add an instance of the card Element into the `card-element` <div>  -- see payment.ejs view, line 42
card.mount('#card-element');

// Handle real-time validation errors from the card Element
card.addEventListener('change', function(event) {
  const displayError = document.getElementById('card-errors');
  if (event.error) {
    displayError.textContent = event.error.message;
  } else {
    displayError.textContent = '';
  }
});
//Create a form and event listener for the 'payment-form' POST
const form = document.querySelector("#submit");
form.addEventListener('click', function(event) {
  event.preventDefault();
  changeLoadingState(true);

  //create the payment method from the payment details
  stripe.createPaymentMethod('card', card).then(function(result) {
    // Send payment method id to the server
    fetch('/process_payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_method_id: result.paymentMethod.id,
        payment_intent_id: submit.value ? submit.value : null
      }),
    }).then(function(result) {
      result.json().then(function(json) {
        handleAction(json)
      })
    })
  })
})

//handle the server response if further card action is needed
function handleAction(response) {
    if (response.error) {
      nextAction(response.error);
    }
    else if (response.requires_action) {
      stripe.handleCardAction(response.clientSecret)
      .then(function(result) {
        if (result.error) {
          nextAction(`<strong>${result.error.message}</strong><br><br> For this tutorial, click Submit Payment again and this time choose complete to approve the authentication challenge.`, result.error.payment_intent.id);
            document.querySelector(".order-amount").classList.add("hidden");
            document.querySelector('#button-text').textContent = 'Resubmit Payment';
            changeLoadingState(false);
        }
        else {
          fetch('/process_payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              payment_intent_id: result.paymentIntent.id
            }),
          }).then(function(confirmResult) {
            return confirmResult.json()
          }).then(handleAction)
        } 
      })
    }
    else {
      // success
      nextAction(`<div>Success!<br>The Payment Intent <a href="https://dashboard.stripe.com/test/payments/${response.payment_id}" target="blank">${response.payment_id}</a> returned the status: <em>${response.payment_status}</em><br><br>Click the ID link above to review the payment event in your dashboard.</div>`, null);
      document.querySelectorAll(".payment-view").forEach(function(view) {
        view.classList.add("hidden");
      });

    }
  }

  const nextAction = function(errorMsgText, btnValue) {
    let errorMsg = document.querySelector(".sr-legal-text");
    errorMsg.innerHTML = errorMsgText;
    errorMsg.style.color = "#ed5f74";
    let btn = document.querySelector('#submit');
    btn.value = btnValue;
  };

  // Show a spinner on payment submission
var changeLoadingState = function(isLoading) {
  if (isLoading) {
    document.querySelector("button").disabled = true;
    document.querySelector("#spinner").classList.remove("hidden");
    document.querySelector("#button-text").classList.add("hidden");
  } else {
    document.querySelector("button").disabled = false;
    document.querySelector("#spinner").classList.add("hidden");
    document.querySelector("#button-text").classList.remove("hidden");
  }
};


