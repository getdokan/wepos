export default {
    updateProductsToIndexedDb( productLogs ) {
        productLogs.forEach( productLog => {
            wepos.productIndexedDb.updateProduct( {
                id: Number( productLog.product_id ),
                title: productLog.product_title,
                type: productLog.product_type,
                sku: productLog.product_sku,
                price: productLog.product_price,
                stock: productLog.product_stock,
            } );
        } );
    },

    updateProductLogsData( counterId ) {
        wepos.api.put( wepos.rest.root + wepos.rest.posversion + '/product/logs/' + counterId )
        .fail( response => {
            alert( response.status + ' : ' + response.responseJSON.message );
        } );
    }
}
