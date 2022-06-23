module.exports = (Discord, client, message) => {
    console.log('IM ONLINE');

    setInterval(checkFreeDeals, 1000 * 5) // 1 hour * 12  (3600000 * 12)
}

// checks https://www.indiegamebundles.com/category/free/
// https://gg.deals/deals/?maxPrice=0
// https://www.epicbundle.com/category/article/for-free/
function checkFreeDeals() {
    console.log('its time')
}