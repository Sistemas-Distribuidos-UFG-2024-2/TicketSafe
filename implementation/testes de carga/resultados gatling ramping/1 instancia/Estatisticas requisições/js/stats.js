var stats = {
    type: "GROUP",
name: "All Requests",
path: "",
pathFormatted: "group_missing-name--1146707516",
stats: {
    "name": "All Requests",
    "numberOfRequests": {
        "total": "54633",
        "ok": "30776",
        "ko": "23857"
    },
    "minResponseTime": {
        "total": "1",
        "ok": "1",
        "ko": "1"
    },
    "maxResponseTime": {
        "total": "103118",
        "ok": "63923",
        "ko": "103118"
    },
    "meanResponseTime": {
        "total": "32469",
        "ok": "11382",
        "ko": "59672"
    },
    "standardDeviation": {
        "total": "31000",
        "ok": "13474",
        "ko": "25552"
    },
    "percentiles1": {
        "total": "21681",
        "ok": "5343",
        "ko": "65800"
    },
    "percentiles2": {
        "total": "61741",
        "ok": "19154",
        "ko": "78422"
    },
    "percentiles3": {
        "total": "85802",
        "ok": "40201",
        "ko": "91970"
    },
    "percentiles4": {
        "total": "94898",
        "ok": "44177",
        "ko": "96974"
    },
    "group1": {
    "name": "t < 800 ms",
    "htmlName": "t < 800 ms",
    "count": 10454,
    "percentage": 19.134955063789285
},
    "group2": {
    "name": "800 ms <= t < 1200 ms",
    "htmlName": "t >= 800 ms <br> t < 1200 ms",
    "count": 838,
    "percentage": 1.5338714696245859
},
    "group3": {
    "name": "t >= 1200 ms",
    "htmlName": "t >= 1200 ms",
    "count": 19484,
    "percentage": 35.66342686654586
},
    "group4": {
    "name": "failed",
    "htmlName": "failed",
    "count": 23857,
    "percentage": 43.66774660004027
},
    "meanNumberOfRequestsPerSecond": {
        "total": "185.83",
        "ok": "104.68",
        "ko": "81.15"
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
        "total": "54633",
        "ok": "30776",
        "ko": "23857"
    },
    "minResponseTime": {
        "total": "1",
        "ok": "1",
        "ko": "1"
    },
    "maxResponseTime": {
        "total": "103118",
        "ok": "63923",
        "ko": "103118"
    },
    "meanResponseTime": {
        "total": "32469",
        "ok": "11382",
        "ko": "59672"
    },
    "standardDeviation": {
        "total": "31000",
        "ok": "13474",
        "ko": "25552"
    },
    "percentiles1": {
        "total": "21680",
        "ok": "5329",
        "ko": "65807"
    },
    "percentiles2": {
        "total": "61741",
        "ok": "19154",
        "ko": "78442"
    },
    "percentiles3": {
        "total": "85802",
        "ok": "40201",
        "ko": "91970"
    },
    "percentiles4": {
        "total": "94898",
        "ok": "44177",
        "ko": "96972"
    },
    "group1": {
    "name": "t < 800 ms",
    "htmlName": "t < 800 ms",
    "count": 10454,
    "percentage": 19.134955063789285
},
    "group2": {
    "name": "800 ms <= t < 1200 ms",
    "htmlName": "t >= 800 ms <br> t < 1200 ms",
    "count": 838,
    "percentage": 1.5338714696245859
},
    "group3": {
    "name": "t >= 1200 ms",
    "htmlName": "t >= 1200 ms",
    "count": 19484,
    "percentage": 35.66342686654586
},
    "group4": {
    "name": "failed",
    "htmlName": "failed",
    "count": 23857,
    "percentage": 43.66774660004027
},
    "meanNumberOfRequestsPerSecond": {
        "total": "185.83",
        "ok": "104.68",
        "ko": "81.15"
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
