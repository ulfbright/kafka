"use strict"

const request = require("request")
const config = require("./config")
const elastic = require("elasticsearch").Client({host: config.elastic})

exports.logProbs = function (mess) {
    elastic.index({
        index: "errors",
        type: "filter",
        body: mess
    }, (foo, bar) => {
        if(foo) {
            console.error(foo)
        }
    })
}

exports.getSources = function (api, cb) {
    request.get(api + "db", (err, res, bod) => {
        if(bod) {
            cb(JSON.parse(bod))
        } else {
            if(err) {
                logProbs(err)
            } else {
                logProbs(console.trace("getSources"))
            }
        }
    })
}

exports.getTopics = function (api, src, cb) {
    request.get(api + src + "/topic", (err, res, bod) => {
        if(bod) {
            cb(JSON.parse(bod))
        } else {
            if(err) {
                logProbs(err)
            } else {
                logProbs(console.trace("getTopics"))
            }
        }
    })
}

exports.getFilters = function (api, src, top, cb) {
    request.get(api + src + "/" + top + "/filter", (err, res, bod) => {
        if(bod) {
            cb(JSON.parse(bod))
        } else {
            if(err) {
                logProbs(err)
            } else {
                logProbs(console.trace("getFilters"))
            }
        }
    })
}

exports.getMatch = function (filt, mess, cb) {
    let state = true
    
    filt.match.pos.forEach((pos) => {
        let match = new RegExp(pos, "i")
        
        if(mess.value.search(match) === (-1)) {
            state = false
            cb(false)
        } else if((filt.match.pos.indexOf(pos) === (filt.match.pos.length - 1)) && state) {
            if(filt.match.neg) {   
                filt.match.neg.forEach((neg) => {
                    match = new RegExp(neg, "i")
                
                    if(mess.value.search(match) !== (-1)) {
                        state = false
                        cb(false)
                    } else if((filt.match.neg.indexOf(neg) === (filt.match.neg.length - 1)) && state) {
                        cb(true)
                    }
                })
            } else {
                cb(true)
            }
        }
    })
}