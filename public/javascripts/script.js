function addToCart(proId) {
    console.log('ajax check');
    const url = '/add-to-cart/' + proId;
    console.log('Requesting:', url); // Debug URL

    $.ajax({
        url: url,
        method: 'GET',
        success: (response) => {
            if (response.status) {
                let count = $('#cart-count').html()
                count = parseInt(count) + 1
                $('#cart-count').html(count)
            }
        },
    });
}

function changeQuantity(cartId, proId, count) {
    $.ajax({
        url: '/change-product-quantity',
        data: {
            cart: cartId,
            product: proId,
            count: count
        },
        method: 'POST',
        success: (response) => {
            alert(response)
        }
    })
}
