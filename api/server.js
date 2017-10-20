"use strict"

const kafka = require("kafka-node")
const express = require("express")
const parser = require("body-parser")
const app = express()
const mongodb = require("mongodb").MongoClient
const config = require("./config")
const logic = require("./logic")
	
app.use(parser.json())

app.use((req, res, nxt) => {
	res.header("Access-Control-Allow-Origin", "*")
	res.header("Access-Control-Allow-Methods", "GET, POST, DELETE")
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
	nxt()
})

app.route("/:db/:topic/test")
	.post((req, res) => {
		if(Array.isArray(req.body.match.pos) && Array.isArray(req.body.match.neg) && req.body.timer) {
			let group = "someGroup" + Date.now(),
				opts = {
					groupId: group,
					protocol: ["roundrobin"],
					fromOffset: "earliest"
				}
                
                if(config.kafka[req.params.db].split(":")[1] === "9092") {
                    opts.kafkaHost = config.kafka[req.params.db]
                } else {
                    opts.host = config.kafka[req.params.db]
                }
            
                let consumer = new kafka.ConsumerGroup(opts, req.params.topic),
				push = true,
				data = {
					valid: true,
					messages: []
                }
				
			setTimeout(() => {				
				if(push) {
					push = false
					res.json(data)
				}
			}, req.body.timer * 1000)
																	
			consumer.on("error", (error) => {
				if(push) {
					push = false
					res.json({ valid: false })
				}

				logic.logProbs(error)
			})
			
			consumer.on("message", (message) => {
				if(push) {
					let state = true
					
					req.body.match.pos.forEach((pos) => {
						let match = new RegExp(pos, "i")
						
						if(message.value.search(match) === (-1)) {
							state = false
						}
						
						if((req.body.match.pos.indexOf(pos) === (req.body.match.pos.length - 1)) && state) {
							req.body.match.neg.forEach((neg) => {
								let match = new RegExp(neg, "i")
								
								if(message.value.search(match) !== (-1)) {
									state = false
								}
								
								if((req.body.match.neg.indexOf(neg) === (req.body.match.neg.length - 1)) && state) {
									data.messages.push(message.value)
								}
							})
						}
					})
				}
			})
		} else {
			res.json({ valid: false })
		}
	})
	
app.route("/db")
	.get((req, res) => {
		res.json(config.kafka)
	})
	
app.route("/:db/topic")
	.get((req, res) => {
		mongodb.connect(config.mongo + req.params.db, (err, db) => {
			if(db) {
				db.listCollections().toArray((error, topics) => {
					if(topics) {
						let data = []
				
						topics.forEach((topic) => {
							data.push(topic.name)
							
							if(topics.indexOf(topic) === (topics.length - 1)) {
								res.send(data)
								db.close()
							}
						})
					} else {
						if(error) {
							logic.logProbs(error)
						} else {
							logic.logProbs(console.trace("collectionMongo"))
						}
					}
				});
			} else {
				if(err) {
					logic.logProbs(err)
				} else {
					logic.logProbs(console.trace("connectionMongo"))
				}
			}
        })
        
        /*
        if(config.kafka[req.params.db]) {
			let client = new kafka.Client(config.kafka[req.params.db])
			
			client.once("connect", () => {
				client.loadMetadataForTopics([], (error, result) => {
					if(error) {
						logic.logProbs(error)
					} else {
						client.close()
						res.send(Object.keys(result[1].metadata))
					}
				})
			})
		} else {
			res.json({ valid: false })
        }
        */
	})
	
app.route("/:db/:topic/filter")
	.get((req, res) => {
		mongodb.connect(config.mongo + req.params.db, (err, db) => {
			if(db) {
				db.collection(req.params.topic).find({}).toArray((error, filters) => {
					if(filters) {
						res.send(filters)
						db.close()
					} else {
						if(error) {
							logic.logProbs(error)
						} else {
							logic.logProbs(console.trace("collectionMongo"))
						}
					}
				})
			} else {
				if(err) {
					logic.logProbs(err)
				} else {
					logic.logProbs(console.trace("connectionMongo"))
				}
			}
		})
	})
	.post((req, res) => {
		if(req.body.name && req.body.match) {
			if(Array.isArray(req.body.match.pos) && Array.isArray(req.body.match.neg)) {
				if(Array.isArray(req.body.tags)) {
					mongodb.connect(config.mongo + req.params.db, (err, db) => {
						if(db) {
							if(req.body._id) {
								db.collection(req.params.topic).save(req.body, (error, result) => {
									res.json({ success: true })
									db.close()
								})
							} else {
								req.body._id = req.body.group + Date.now()
								
								db.collection(req.params.topic).save(req.body, (error, result) => {
									res.json({ success: true, _id: req.body._id })
									db.close()
								})
							}
						} else {
							if(err) {
								logic.logProbs(err)
							} else {
								logic.logProbs(console.trace("connectionMongo"))
							}
						}
					})
				} else {
					res.json({ valid: false })
				}
			} else {
				res.json({ valid: false })
			}
		} else {
			res.json({ valid: false })
		}
	})

app.route("/:db/:topic/filter/:_id")
	.delete((req, res) => {
		mongodb.connect(config.mongo + req.params.db, (err, db) => {
			if(db) {
				db.collection(req.params.topic).deleteOne({ _id: req.params._id }, (error, result) => {
					if(result) {
						res.json({ success: true })
						db.close()
					} else {
						if(error) {
							logic.logProbs(error)
						} else {
							logic.logProbs(console.trace("collectionMongo"))
						}
					}
				})
			} else {
				if(err) {
					logic.logProbs(err)
				} else {
					logic.logProbs(console.trace("connectionMongo"))
				}
			}
		})
	})
	
app.listen(9000)