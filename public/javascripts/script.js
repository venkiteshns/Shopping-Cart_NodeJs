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

