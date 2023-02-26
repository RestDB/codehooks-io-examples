
// Queue worker function
export default function queue(data, queue) {
    const {message, user} = data.body.payload
    console.log('Queue worker data', message, user)
    // do stuff with message and user
    // simulate 200 ms time to complete
    setTimeout(queue.end, 200)
}