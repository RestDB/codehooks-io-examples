import * as yup from 'yup'

// Schema for users
export const user = yup.object().shape({
    name: yup.string().required(),
    email: yup.string().email().required(),
    active: yup.boolean().default(true)
})