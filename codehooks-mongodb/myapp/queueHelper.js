
// Queue worker function
export default function queue(data, queue) {
    const {payload} = data.body
    console.log('Queue worker data', payload)
    setTimeout(queue.end, 1000)
}