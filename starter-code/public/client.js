// Create an instance of the Stripe client
const stripe = Stripe("enter-your-publishable-test-key-here");

// Create an instance of Elements
const elements = stripe.elements();

// Custom styling can be passed to options when creating an Element
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

// Add an instance of the card Element
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
//Create a form and event listener for the 'payment-form'
const form = document.querySelector("#submit");
form.addEventListener('click', function(event) {
  event.preventDefault();
  changeLoadingState(true);
  //create the token from the payment details
  stripe.createToken(card).then(function(result) {
    
    // Send token.id to the server
    fetch('/process_payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token_id: result.token.id,
      }),
    }).then(function(result) {
      result.json().then(function(json) {
        handleServerResponse(json)
      })
    })
  })
})
//handle the server response
function handleServerResponse(response) {
  if (response.payment_status !== 'succeeded') {
    nextAction(`Your charge attempt failed with the error message:<br><em>${response.payment_status}</em><br><br>Refresh your browser and return to the exercise instructions.`);
    document.querySelectorAll(".payment-view").forEach(function(view) {
      view.classList.add("hidden");
    });
  } else {
      nextAction(`Success!<br>The Charge <a href="https://dashboard.stripe.com/test/payments/${response.payment_id}" target="blank">${response.payment_id}</a> returned the status: <em>${response.payment_status}</em><br><br>Click the ID link above to view the entire payment in your dashboard.`);
      document.querySelectorAll(".payment-view").forEach(function(view) {
        view.classList.add("hidden");
      });
  }      
}

const nextAction = function(errorMsgText, btnText) {
    let errorMsg = document.querySelector(".sr-legal-text");
    errorMsg.innerHTML = errorMsgText;
    errorMsg.style.color = "#ed5f74";
    let btn = document.querySelector('#submit');
    // btn.innerHTML = btnText;
  };

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