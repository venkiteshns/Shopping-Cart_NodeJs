function addToCart(proId) {
  console.log('ajax check');
  const url = '/add-to-cart/' + proId;
  console.log('Requesting:', url); // Debug URL

  $.ajax({
    url: url,
    method: 'GET',
    success: (response) => {
      if (response.status) {
        alert('Item Added To Cart Succesfully') //alert message for showing item added to cart
        let count = $('#cart-count').html()
        count = parseInt(count) + 1
        $('#cart-count').html(count)
      }
    },
  });
}

function changeQuantity(cartId, proId, count) {
  console.log('Cart ID:', cartId);
  console.log('Product ID:', proId);
  console.log('Count:', count);

  $.ajax({
    url: '/change-product-quantity',
    method: 'POST',
    data: {
      cart: cartId,
      product: proId,
      count: count
    },
    success: (response) => {
      console.log('Response:', response); // Log the response to check updated quantity
      // Update the quantity in the DOM
      updateQuantityInCart(proId, response.updatedQuantity);
    }
  });
}

function updateQuantityInCart(productId, updatedQuantity) {
  // Find the span element that holds the quantity for this product
  const productQuantityElement = document.querySelector(`.product-quantity[data-product-id="${productId}"]`);

  if (productQuantityElement) {
    // Update the text content of the quantity span
    productQuantityElement.textContent = updatedQuantity;
  } else {
    console.error('Product quantity element not found');
  }
}




