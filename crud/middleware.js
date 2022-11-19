// calculate balance from customer.products array of prices
export function middleware(req, res, next) {    
    if (req.method === 'POST' && req.params.collection === 'customer') {
        if (req.body.products) {
            req.body.balance = req.body.products.reduce((accumulator, object) => {
                return accumulator + object.price;
            }, 0);
        }
    }
    next()
}