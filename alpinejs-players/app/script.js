document.addEventListener('alpine:init', () => {
    Alpine.store('coho', {
        loading: false,
        search: '',
        players: [],
        async getData() {
            this.loading = true
            this.players = await getDataFromAPI(this.search)
            this.loading = false
        }
    })
})

async function getDataFromAPI(search) {
    var myHeaders = new Headers();
    myHeaders.append("x-apikey", "0b49638f-56c3-48e9-8725-7f3c20f25316"); // read-only token
    myHeaders.append("Content-Type", "application/json");

    var requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
    };
    var query = "{}";
    console.log('getData', search)
    if (search.length > 0) {
        query = JSON.stringify({"Player": {$regex: search, $options: "gi"}})
    }
    var hints = JSON.stringify({sort: {Squad: 1, Nation: 1}, $fields: {"Player": 1, "Nation": 1, "Squad": 1}})
    var URL = `https://static-i4rq.api.codehooks.io/dev/football?q=${query}&h=${hints}`;
    console.log(URL)
    const response = await fetch(URL, requestOptions)
    return response.json()
}