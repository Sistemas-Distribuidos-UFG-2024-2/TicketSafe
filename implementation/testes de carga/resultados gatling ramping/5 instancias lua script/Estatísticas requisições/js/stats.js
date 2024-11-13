var stats = {
    type: "GROUP",
name: "All Requests",
path: "",
pathFormatted: "group_missing-name--1146707516",
stats: {
    "name": "All Requests",
    "numberOfRequests": {
        "total": "54640",
        "ok": "35715",
        "ko": "18925"
    },
    "minResponseTime": {
        "total": "1",
        "ok": "1",
        "ko": "77"
    },
    "maxResponseTime": {
        "total": "108025",
        "ok": "68579",
        "ko": "108025"
    },
    "meanResponseTime": {
        "total": "24998",
        "ok": "3104",
        "ko": "66317"
    },
    "standardDeviation": {
        "total": "34195",
        "ok": "10183",
        "ko": "23843"
    },
    "percentiles1": {
        "total": "14",
        "ok": "4",
        "ko": "69613"
    },
    "percentiles2": {
        "total": "55189",
        "ok": "11",
        "ko": "85168"
    },
    "percentiles3": {
        "total": "91103",
        "ok": "29677",
        "ko": "99649"
    },
    "percentiles4": {
        "total": "100967",
        "ok": "50988",
        "ko": "102719"
    },
    "group1": {
    "name": "t < 800 ms",
    "htmlName": "t < 800 ms",
    "count": 31719,
    "percentage": 58.050878477306
},
    "group2": {
    "name": "800 ms <= t < 1200 ms",
    "htmlName": "t >= 800 ms <br> t < 1200 ms",
    "count": 87,
    "percentage": 0.15922401171303074
},
    "group3": {
    "name": "t >= 1200 ms",
    "htmlName": "t >= 1200 ms",
    "count": 3909,
    "percentage": 7.154099560761347
},
    "group4": {
    "name": "failed",
    "htmlName": "failed",
    "count": 18925,
    "percentage": 34.63579795021962
},
    "meanNumberOfRequestsPerSecond": {
        "total": "174.01",
        "ok": "113.74",
        "ko": "60.27"
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
        "total": "54640",
        "ok": "35715",
        "ko": "18925"
    },
    "minResponseTime": {
        "total": "1",
        "ok": "1",
        "ko": "77"
    },
    "maxResponseTime": {
        "total": "108025",
        "ok": "68579",
        "ko": "108025"
    },
    "meanResponseTime": {
        "total": "24998",
        "ok": "3104",
        "ko": "66317"
    },
    "standardDeviation": {
        "total": "34195",
        "ok": "10183",
        "ko": "23843"
    },
    "percentiles1": {
        "total": "14",
        "ok": "4",
        "ko": "69642"
    },
    "percentiles2": {
        "total": "55189",
        "ok": "11",
        "ko": "85168"
    },
    "percentiles3": {
        "total": "91103",
        "ok": "29677",
        "ko": "99649"
    },
    "percentiles4": {
        "total": "100967",
        "ok": "50988",
        "ko": "102719"
    },
    "group1": {
    "name": "t < 800 ms",
    "htmlName": "t < 800 ms",
    "count": 31719,
    "percentage": 58.050878477306
},
    "group2": {
    "name": "800 ms <= t < 1200 ms",
    "htmlName": "t >= 800 ms <br> t < 1200 ms",
    "count": 87,
    "percentage": 0.15922401171303074
},
    "group3": {
    "name": "t >= 1200 ms",
    "htmlName": "t >= 1200 ms",
    "count": 3909,
    "percentage": 7.154099560761347
},
    "group4": {
    "name": "failed",
    "htmlName": "failed",
    "count": 18925,
    "percentage": 34.63579795021962
},
    "meanNumberOfRequestsPerSecond": {
        "total": "174.01",
        "ok": "113.74",
        "ko": "60.27"
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
