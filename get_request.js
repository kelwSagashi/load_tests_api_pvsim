import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

export let GetReqDuration = new Trend('get_req_duration');
export let GetReqFailRate = new Rate('get_req_fail_rate');
export let GetReqSucessRate = new Rate('get_req_sucess_rate');
export let GetReqsCount = new Rate('get_req_count');
export let ErrorRate = new Rate('errors');

export default function (url, name) {
    let res = http.get(url);

    GetReqDuration.add(res.timings.duration, {
        route: name
    });

    GetReqsCount.add(1);

    GetReqFailRate.add(res.status == 0 || res.status > 399);

    if (!check(res, {
        'Status_304': (r) => r.status === 304,
        'Response_Time_500ms': (r) => r.timings.duration < 500,
        'url': (r) => r.url,
    })) {
        fail('Max duration 500ms exceeded')
    }

    errorRate.add(res.status !== 304);

    sleep(1);
}