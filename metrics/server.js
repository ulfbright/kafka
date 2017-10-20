"use strict"

const express = require("express")
const app = express()
const shelljs = require("shelljs")
const logic = require("./logic")

app.route("/list")
    .get((req, res) => {
        let command = "/kafka/bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --list"

        shelljs.exec(command, (code, stdout, stderr) => {
            if(stdout) {
                res.send(stdout)
            } else {
                if(stderr) {
                    logic.logProbs(stderr)
                } else {
                    logic.logProbs(console.trace("shellJS list"))
                }
            }
        })
    })

app.route("/group/:group")
    .get((req, res) => {
        let command = "/kafka/bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --group " + req.params.group + " --describe"

        shelljs.exec(command, (code, stdout, stderr) => {
            if(stdout) {
                logic.refiner(stdout, (clean) => {
                    logic.objectifier(clean, (snafu) => {
                        res.send(snafu)
                    })
                })
            } else {
                if(stderr) {
                    logic.logProbs(stderr)
                } else {
                    logic.logProbs(console.trace("shellJS group"))
                }
            }
        })
    })

app.listen(9000)