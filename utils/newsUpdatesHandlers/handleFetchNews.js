const request = require('request');
const xhr_req = require('xhr-request');

const parseHTML = require('./dataParse/parseHTML')
const parseXHR = require('./dataParse/parseXHR')

const handleFetchNews = (game, game_data, entry_limit) => {
    const is_api = game_data.xhr_url !== undefined && game_data.xhr_url !== null && game_data.xhr_url !== ''
    const url = is_api ? game_data.xhr_url : game_data.html_url

    // request data for this game
    return request_data(is_api, url).then(request_data => {
        return parsse_request_data(game, is_api, request_data, entry_limit)
    })
    .catch(error => {
        console.log(`ERROR :: Failed to execute request data on 'handleFetchNews' :: `, error)
        return {}
    })
}

function request_data(is_api, url) {
    return new Promise((success, failure) => {
        if (is_api) { // Get xhr data
            xhr_req(url, {
                json: true
            }, function (err, req_data) {
                if (err) {
                    failure(err)
                }
                else {
                    success(req_data)
                }
            })
        }
        else { // Get html data
            request(url, function (error, response, body) {
                if (error || !body){
                    failure(error)
                }
                else {
                    success(body)
                }
            })
        }
    })
}

function parsse_request_data(game, is_api, request_data, entry_limit) {
    if (is_api) {
        return parseXHR(game, request_data, entry_limit)
    }
    else{
        return parseHTML(game, request_data, entry_limit)
    }
}

module.exports = handleFetchNews