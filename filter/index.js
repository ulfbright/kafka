"use strict"

const kafka = require("kafka-node")
const config = require("./config")
const logic = require("./logic")
const client = new kafka.Client(config.kafka)
const producer = new kafka.Producer(client)
    
let fault = {}

producer.on("ready", () => {
    logic.getSources(config.api, (srcRes) => {
        for(let src in srcRes) {
            logic.getTopics(config.api, src, (topRes) => {
                if(topRes) {
                    fault.topics = topRes

                    if(fault.topics.indexOf("filtered") !== -1) {
                        fault.topics.splice(fault.topics.indexOf("filtered"), 1)
                    }
                    if(fault.topics.indexOf("__consumer_offsets") !== -1) {
                        fault.topics.splice(fault.topics.indexOf("__consumer_offsets"), 1)
                    }
                }
                
                let opts = {
                    groupId: config.group,
                    protocol: ["roundrobin"]
                }
                
                if(srcRes[src].split(":")[1] === "9092") {
                    opts.kafkaHost = srcRes[src]
                } else {
                    opts.host = srcRes[src]
                }
                
                let consumer = new kafka.ConsumerGroup(opts, fault.topics)
                
                consumer.on("error", (err) => {
                    logic.logProbs(err)
                })
                
                fault.topics.forEach((top) => {
                    setInterval(() => {
                        logic.getFilters(config.api, src, top, (filtRes) => {
                            if(filtRes) { fault.filters = filtRes }
                        
                            consumer.on("message", (mess) => {
                                fault.filters.forEach((filt) => {
                                    logic.getMatch(filt, mess, (state) => {
                                        if(state) {
                                            let data = filt
                                                data.mess = mess.value
                                            
                                            producer.send([{
                                                topic: "filtered",
                                                messages: JSON.stringify(data)
                                            }], (err, dat) => {
                                                if(err) {
                                                    logic.logProbs(err)
                                                }
                                            })
                                        }
                                    })
                                })
                            })
                        })
                    }, 3600000)
                })
            })
        }
    })
})