import { sleep, check, group, fail } from 'k6'
import http from 'k6/http'
import jsonpath from 'https://jslib.k6.io/jsonpath/1.0.2/index.js'

export const options = {
    cloud: {
        distribution: { 'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 100 } },
        apm: [],
    },
    thresholds: {},
    scenarios: {
        Scenario_1: {
            executor: 'ramping-vus',
            gracefulStop: '30s',
            stages: [
                { target: 5, duration: '30s' },
                { target: 15, duration: '1m' },
                { target: 10, duration: '30s' },
                { target: 0, duration: '30s' },
            ],
            gracefulRampDown: '30s',
            exec: 'scenario_1',
        },
    },
}

export function scenario_1() {
    let response

    const vars = {}

    group('page_1 - https://pizza.maxiparis.com/', function () {
        // Homepage
        response = http.get('https://pizza-service.maxiparis.com', {
            headers: {
                accept: '*/*',
                'accept-encoding': 'gzip, deflate, br, zstd',
                'accept-language': 'en-US,en;q=0.9,es;q=0.8',
                'content-type': 'application/json',
                origin: 'https://pizza.maxiparis.com',
                priority: 'u=1, i',
                'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-site',
            },
        })
        sleep(1)

        // Login (clone)
        response = http.put(
            'https://pizza-service.maxiparis.com/api/auth',
            '{"email":"a@jwt.com","password":"admin"}',
            {
                headers: {
                    accept: '*/*',
                    'accept-encoding': 'gzip, deflate, br, zstd',
                    'accept-language': 'en-US,en;q=0.9,es;q=0.8',
                    'content-type': 'application/json',
                    origin: 'https://pizza.maxiparis.com',
                    priority: 'u=1, i',
                    'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"macOS"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-site',
                },
            }
        )
        if (!check(response, { 'status equals 200': response => response.status.toString() === '200' })) {
            console.log(response.body);
            fail('Login was *not* 200');
        }
        vars['token'] = jsonpath.query(response.json(), '$.token')[0]

        sleep(10.1)

        // Get menu
        response = http.get('https://pizza-service.maxiparis.com/api/order/menu', {
            headers: {
                accept: '*/*',
                'accept-encoding': 'gzip, deflate, br, zstd',
                'accept-language': 'en-US,en;q=0.9,es;q=0.8',
                authorization: `Bearer ${vars['token']}`,
                'content-type': 'application/json',
                'if-none-match': 'W/"1fc-cgG/aqJmHhElGCplQPSmgl2Gwk0"',
                origin: 'https://pizza.maxiparis.com',
                priority: 'u=1, i',
                'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-site',
            },
        })

        // Get franchise
        response = http.get('https://pizza-service.maxiparis.com/api/franchise', {
            headers: {
                accept: '*/*',
                'accept-encoding': 'gzip, deflate, br, zstd',
                'accept-language': 'en-US,en;q=0.9,es;q=0.8',
                authorization: `Bearer ${vars['token']}`,
                'content-type': 'application/json',
                'if-none-match': 'W/"101-7CMXJCyR2bvLPaUNuSLAmXOm6hs"',
                origin: 'https://pizza.maxiparis.com',
                priority: 'u=1, i',
                'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-site',
            },
        })
        sleep(11.1)

        // Purchase Pizza
        response = http.post(
            'https://pizza-service.maxiparis.com/api/order',
            '{"items":[{"menuId":3,"description":"Margarita","price":0.0042},{"menuId":2,"description":"Pepperoni","price":0.0042},{"menuId":2,"description":"Pepperoni","price":0.0042}],"storeId":"1","franchiseId":1}',
            {
                headers: {
                    accept: '*/*',
                    'accept-encoding': 'gzip, deflate, br, zstd',
                    'accept-language': 'en-US,en;q=0.9,es;q=0.8',
                    authorization: `Bearer ${vars['token']}`,
                    'content-type': 'application/json',
                    origin: 'https://pizza.maxiparis.com',
                    priority: 'u=1, i',
                    'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"macOS"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-site',
                },
            }
        )

        let orderResponse;
        try {
            orderResponse = response.json();
            vars['jwt'] = orderResponse.jwt || null;
        } catch (e) {
            console.error('Failed to parse order response', e);
            vars['jwt'] = null;
        }
        if (!vars['jwt']) {
            console.error('JWT is missing, skipping verification');
            return;
        }

        sleep(1.9)

        // Verify pizza
        response = http.post(
            'https://pizza-factory.cs329.click/api/order/verify',
            JSON.stringify({ jwt: vars['jwt'] }),
            {
                headers: {
                    accept: '*/*',
                    'accept-encoding': 'gzip, deflate, br, zstd',
                    'accept-language': 'en-US,en;q=0.9,es;q=0.8',
                    authorization: `Bearer ${vars['token']}`,
                    'content-type': 'application/json',
                    origin: 'https://pizza.maxiparis.com',
                    priority: 'u=1, i',
                    'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"macOS"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'cross-site',
                    'sec-fetch-storage-access': 'active',
                },
            }
        )
    })
}