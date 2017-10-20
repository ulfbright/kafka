"use strict"

const kafka = require("kafka-node")
const client = new kafka.Client("itsec-kafka.global.dish.com:2181")
const express = require("express")
const app = express()
const offset = new kafka.Offset(client)
	
let topics = {}

app.use((req, res, nxt) => {
	res.header("Access-Control-Allow-Origin", "*")
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
	nxt()
})

app.route("/count")
	.get((req, res) => {
		res.json(topics)
	})
	
app.route("/:group")
	.get((req, res) => {
		let data = {}
		
		client.loadMetadataForTopics([], (err, top) => {
			if(err) {
				logic.logProbs(err)
			} else {
				Object.keys(top[1].metadata).forEach((topic) => {
					if(topic !== "__consumer_offsets") {
						data[topic] = {
							off: null,
							grp: null,
							dif: null
						}
						
						offset.fetchLatestOffsets([topic], (err, off) => {
							if(err) {
								logic.logProbs(err)
							} else {
								data[topic].off = off[topic][0]
								
								offset.fetchCommits(req.params.group, [{
									topic: topic,
									partition: 0
								}], (err, grp) => {
									if(err) {
										logic.logProbs(err)
									} else {
										if(grp[topic][0] !== -1) {
											data[topic].grp = grp[topic][0]
										} else {
											data[topic].grp = null
										}
										data[topic].dif = data[topic].off - data[topic].grp
																				
										if(Object.keys(top[1].metadata).indexOf(topic) === (Object.keys(top[1].metadata).length - 1)) {
											res.json(data)
										}
									}
								})
							}
						})
					}
				})
			}
		})
	})

app.once("connect", () => {
	client.loadMetadataForTopics([], (err, res) => {
		if(err) {
			logic.logProbs(err)
		} else {
			Object.keys(res[1].metadata).forEach((topic) => {
				if(topic !== "__consumer_offsets") {
					topics[topic] = {
						pre: null,
						cur: null,
						dif: null
					}
					
					offset.fetchLatestOffsets([topic], (err, res) => {
						if(err) {
							logic.logProbs(err)
						} else {
							topics[topic].cur = res[topic][0]
						}
					})
					
					setInterval(() => {
						offset.fetchLatestOffsets([topic], (err, res) => {
							if(err) {
								logic.logProbs(err)
							} else {
								topics[topic].pre = topics[topic].cur
								topics[topic].cur = res[topic][0]
								topics[topic].dif = topics[topic].cur - topics[topic].pre
							}
						})
					}, 60000)
				}
			})
		}
	})
})

app.listen(9000)