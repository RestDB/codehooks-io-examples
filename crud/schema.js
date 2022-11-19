import * as yup from 'yup';

// yup schemas per collection

// customer schema
let customer =
  yup.object().shape({
    name: yup.string().required(),
    status: yup.mixed().oneOf(['open', 'suspended', 'closed']).required(),
    balance: yup.number().required(),
    products: yup.array().of(
        yup.object({
          name: yup.string().required(),
          price: yup.number().required()
        })
      )
  })

  // product schema, any json is allowed
let product = yup.object().shape({
  json: yup.mixed()
})

export {customer, product}