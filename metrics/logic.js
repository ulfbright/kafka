"use strict"

const config = require("./config")
const elastic = require("elasticsearch").Client({host: config.elastic})

exports.logProbs = function (mess) {
    elastic.index({
        index: "errors",
        type: "metrics",
        body: mess
    }, (foo, bar) => {
        if(foo) {
            console.error(foo)
        }
    })
}

exports.objectifier = function (rawish, cb) {
    let send = []

    rawish.forEach((raw) => {
        let push = {
            topic: raw[0],
            partition: raw[1],
            topicOffset: raw[2],
            groupOffset: raw[3],
            lag: raw[4],
            consumerHost: raw[5],
            client: raw[6]
        }

        send.push(push)

        if(rawish.indexOf(raw) === (rawish.length - 1)) {
            cb(send)
        }
    })
}

exports.refiner = function (mess, cb) {
    let lines = mess.split("\n"),
        send = []

    lines.splice(0, 1)

    lines.forEach((line) => {
        if(lines.indexOf(line) > 0) {
            let values = line.split(" "),
                part = []

            values.forEach((value) => {
                if(value !== "") {
                    part.push(value)
                }

                if(values.indexOf(value) === (values.length - 1)) {
                    send.push(part)

                    if(lines.indexOf(line) === (lines.length - 2)) {
                        cb(send)
                    }
                }
            })
        }
    })
}