# WooCommerceAPI for React Native 
    copy the WooCommerceAPI.js on your project

## install dependencies:
    npm i crypto-js oauth-1.0a

## Library usage:
```js
    const WooCommerce = new WooCommerceAPI({
        url: SITE_URL,
        ssl: true,
        consumerKey: CONSUMER_KEY,
        consumerSecret: CONSUMER_SECRET,
        wpAPI: true,
        version: 'wc/v3',
        queryStringAuth: true
    });
    
    WooCommerce.get(props.query, props.data)
        .then((resp) => resolve(resp)
        .catch((err) => reject(err))
    )
```
