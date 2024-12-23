var stats = {
    type: "GROUP",
name: "All Requests",
path: "",
pathFormatted: "group_missing-name--1146707516",
stats: {
    "name": "All Requests",
    "numberOfRequests": {
        "total": "54632",
        "ok": "34211",
        "ko": "20421"
    },
    "minResponseTime": {
        "total": "1",
        "ok": "1",
        "ko": "1662"
    },
    "maxResponseTime": {
        "total": "104864",
        "ok": "56028",
        "ko": "104864"
    },
    "meanResponseTime": {
        "total": "27202",
        "ok": "2962",
        "ko": "67810"
    },
    "standardDeviation": {
        "total": "34743",
        "ok": "10005",
        "ko": "20694"
    },
    "percentiles1": {
        "total": "10",
        "ok": "4",
        "ko": "66685"
    },
    "percentiles2": {
        "total": "59921",
        "ok": "7",
        "ko": "84707"
    },
    "percentiles3": {
        "total": "91872",
        "ok": "32477",
        "ko": "97568"
    },
    "percentiles4": {
        "total": "99486",
        "ok": "46202",
        "ko": "102506"
    },
    "group1": {
    "name": "t < 800 ms",
    "htmlName": "t < 800 ms",
    "count": 30992,
    "percentage": 56.72865719724703
},
    "group2": {
    "name": "800 ms <= t < 1200 ms",
    "htmlName": "t >= 800 ms <br> t < 1200 ms",
    "count": 3,
    "percentage": 0.005491287157709767
},
    "group3": {
    "name": "t >= 1200 ms",
    "htmlName": "t >= 1200 ms",
    "count": 3216,
    "percentage": 5.88665983306487
},
    "group4": {
    "name": "failed",
    "htmlName": "failed",
    "count": 20421,
    "percentage": 37.37919168253038
},
    "meanNumberOfRequestsPerSecond": {
        "total": "176.8",
        "ok": "110.72",
        "ko": "66.09"
    }
},
contents: {
"req_reservar-ingres--578253056": {
        type: "REQUEST",
        name: "Reservar Ingresso",
path: "Reservar Ingresso",
pathFormatted: "req_reservar-ingres--578253056",
stats: {
    "name": "Reservar Ingresso",
    "numberOfRequests": {
        "total": "54632",
        "ok": "34211",
        "ko": "20421"
    },
    "minResponseTime": {
        "total": "1",
        "ok": "1",
        "ko": "1662"
    },
    "maxResponseTime": {
        "total": "104864",
        "ok": "56028",
        "ko": "104864"
    },
    "meanResponseTime": {
        "total": "27202",
        "ok": "2962",
        "ko": "67810"
    },
    "standardDeviation": {
        "total": "34743",
        "ok": "10005",
        "ko": "20694"
    },
    "percentiles1": {
        "total": "10",
        "ok": "4",
        "ko": "66687"
    },
    "percentiles2": {
        "total": "59874",
        "ok": "7",
        "ko": "84707"
    },
    "percentiles3": {
        "total": "91872",
        "ok": "32477",
        "ko": "97568"
    },
    "percentiles4": {
        "total": "99488",
        "ok": "46202",
        "ko": "102506"
    },
    "group1": {
    "name": "t < 800 ms",
    "htmlName": "t < 800 ms",
    "count": 30992,
    "percentage": 56.72865719724703
},
    "group2": {
    "name": "800 ms <= t < 1200 ms",
    "htmlName": "t >= 800 ms <br> t < 1200 ms",
    "count": 3,
    "percentage": 0.005491287157709767
},
    "group3": {
    "name": "t >= 1200 ms",
    "htmlName": "t >= 1200 ms",
    "count": 3216,
    "percentage": 5.88665983306487
},
    "group4": {
    "name": "failed",
    "htmlName": "failed",
    "count": 20421,
    "percentage": 37.37919168253038
},
    "meanNumberOfRequestsPerSecond": {
        "total": "176.8",
        "ok": "110.72",
        "ko": "66.09"
    }
}
    }
}

}

function fillStats(stat){
    $("#numberOfRequests").append(stat.numberOfRequests.total);
    $("#numberOfRequestsOK").append(stat.numberOfRequests.ok);
    $("#numberOfRequestsKO").append(stat.numberOfRequests.ko);

    $("#minResponseTime").append(stat.minResponseTime.total);
    $("#minResponseTimeOK").append(stat.minResponseTime.ok);
    $("#minResponseTimeKO").append(stat.minResponseTime.ko);

    $("#maxResponseTime").append(stat.maxResponseTime.total);
    $("#maxResponseTimeOK").append(stat.maxResponseTime.ok);
    $("#maxResponseTimeKO").append(stat.maxResponseTime.ko);

    $("#meanResponseTime").append(stat.meanResponseTime.total);
    $("#meanResponseTimeOK").append(stat.meanResponseTime.ok);
    $("#meanResponseTimeKO").append(stat.meanResponseTime.ko);

    $("#standardDeviation").append(stat.standardDeviation.total);
    $("#standardDeviationOK").append(stat.standardDeviation.ok);
    $("#standardDeviationKO").append(stat.standardDeviation.ko);

    $("#percentiles1").append(stat.percentiles1.total);
    $("#percentiles1OK").append(stat.percentiles1.ok);
    $("#percentiles1KO").append(stat.percentiles1.ko);

    $("#percentiles2").append(stat.percentiles2.total);
    $("#percentiles2OK").append(stat.percentiles2.ok);
    $("#percentiles2KO").append(stat.percentiles2.ko);

    $("#percentiles3").append(stat.percentiles3.total);
    $("#percentiles3OK").append(stat.percentiles3.ok);
    $("#percentiles3KO").append(stat.percentiles3.ko);

    $("#percentiles4").append(stat.percentiles4.total);
    $("#percentiles4OK").append(stat.percentiles4.ok);
    $("#percentiles4KO").append(stat.percentiles4.ko);

    $("#meanNumberOfRequestsPerSecond").append(stat.meanNumberOfRequestsPerSecond.total);
    $("#meanNumberOfRequestsPerSecondOK").append(stat.meanNumberOfRequestsPerSecond.ok);
    $("#meanNumberOfRequestsPerSecondKO").append(stat.meanNumberOfRequestsPerSecond.ko);
}
