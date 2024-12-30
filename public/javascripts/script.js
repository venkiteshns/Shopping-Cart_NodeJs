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

function changeQuantity(cartId, proId, userId, count) {
  console.log('Script.js  Cart ID:', cartId);
  console.log('Product ID:', proId);
  console.log('User ID:', userId);
  console.log('Count:', count);
  let quantity = parseInt(document.getElementById(`quantity-${proId}`).innerHTML);


  $.ajax({
    url: '/change-product-quantity',
    method: 'POST',
    data: {
      user: userId,
      cart: cartId,
      product: proId,
      quantity: quantity,
      count: count
    },
    success: (response) => {
      console.log('Response:', response); // Log the response to check updated quantity
      if (response.itemRemove) {
        alert('item Removed From Cart')
        document.getElementById(proId).remove();
        location.reload()
      } else {
        let currentQuantity = parseInt(document.getElementById(`quantity-${proId}`).innerHTML);
        currentQuantity += parseInt(count)
        document.getElementById(`quantity-${proId}`).innerHTML = currentQuantity
        document.getElementById('TotalCartValue').innerHTML = response.total


        //Or Can use this
        // updateQuantityInCart(proId,newQuantity)
        // location.reload()  
      }
    }
  });
}







