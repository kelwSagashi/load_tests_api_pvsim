import http from 'k6/http';
import { group, check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// Definindo métricas customizadas
const inverterGroupDuration = new Trend('inverter_group_duration');
const inverterGroupSuccessRate = new Rate('inverter_group_success_rate');

const inverterLatestWithParamsDuration = new Trend('inverter_latest_with_params_duration');
const inverterLatestWithParamsSuccessRate = new Rate('inverter_latest_with_params_success_rate');

const inverterLatestDuration = new Trend('inverter_latest_duration');
const inverterLatestSuccessRate = new Rate('inverter_latest_success_rate');

const systemLatestDuration = new Trend('system_latest_duration');
const systemLatestSuccessRate = new Rate('system_latest_success_rate');

const monitorDuration = new Trend('monitor_duration');
const monitorSuccessRate = new Rate('monitor_success_rate');

export let options = {
    scenarios: {
        inverter_latest: {
            executor: 'constant-vus',
            vus: 10,
            duration: '1m',
            exec: 'testInverterLatest',
            startTime: '0s',
        },
        inverter_group: {
            executor: 'ramping-vus',
            startVUs: 5,
            stages: [
                { duration: '1m', target: 15 },
                { duration: '30s', target: 15 },
                { duration: '30s', target: 0 },
            ],
            exec: 'testInverterGroup',
            startTime: '40s',
        },
        inverter_latest_with_params: {
            executor: 'per-vu-iterations',
            vus: 5,
            iterations: 10,
            exec: 'testInverterLatestWithParams',
            startTime: '2m',
        },
        pv_system_latest: {
            executor: 'constant-arrival-rate',
            rate: 20,
            timeUnit: '1s',
            duration: '1m',
            preAllocatedVUs: 7,
            maxVUs: 8,
            exec: 'testPVSystemLatest',
            startTime: '2m',
        },
        monitor_processes: {
            executor: 'constant-vus',
            vus: 6,
            duration: '1m',
            exec: 'testMonitorProcesses',
            startTime: '3m',
        },
    },
    thresholds: {
        'http_req_duration': ['p(95)<200', 'p(99)<300'], // Threshold geral de latência
        'checks': ['rate>0.95'], // 95% dos checks bem-sucedidos
        'inverter_group_duration': ['p(90)<150', 'p(95)<200', 'p(99)<250'], // Rota crítica: mais rigorosa
        'inverter_group_success_rate': ['rate>0.98'], // Exige ao menos 98% de sucesso
    },
};

// Funções específicas para cada cenário
export function testInverterLatest() {
    group('Get latest inverter registers', () => {
        const res = http.get('http://localhost:3000/api/registers/inverter/latest/66082b7665c3d00760c2b7a2');

        // Checar status e tempo de resposta
        const isSuccess = check(res, {
            'Status 304 ou 200': (r) => r.status === 304 || r.status === 200,
            'Tempo de resposta < 500ms': (r) => r.timings.duration < 500,
        });

        // Registrar métricas personalizadas para a rota crítica
        inverterLatestDuration.add(res.timings.duration);
        inverterLatestSuccessRate.add(isSuccess);
        sleep(0.5);
    });
}

export function testInverterGroup() {
    group('Get inverter group data', () => {
        const res = http.get('http://localhost:3000/api/Registers/Inverter/Group/66082b7665c3d00760c2b7a2?select=Timestamp,Today_s_PV_Generation,PV_Power,Total_PV_Generation,Bus_Voltage,NBus_Voltage&group=PV$_Voltage-PV_s_Voltages,PV$_Current-PV_s_Currents,PV$_Power-PV_s_Powers');
        
        // Checar status e tempo de resposta
        const isSuccess = check(res, {
            'Status 304 ou 200': (r) => r.status === 304 || r.status === 200,
            'Tempo de resposta < 500ms': (r) => r.timings.duration < 500,
        });

        // Registrar métricas personalizadas para a rota crítica
        inverterGroupDuration.add(res.timings.duration);
        inverterGroupSuccessRate.add(isSuccess);
        sleep(0.5);
    });
}

export function testInverterLatestWithParams() {
    group('Get latest inverter registers with query params', () => {
        const res = http.get('http://localhost:3000/api/Registers/Inverter/Latest/66082b7665c3d00760c2b7a2?group=PV$_Power-PV_s_Powers,PV$_Current-PV_s_Currents,PV$_Voltage-PV_s_Voltages,On_grid_L$_Power-On_grid_Powers,On_grid_L$_Voltage-On_grid_Voltages,On_grid_L$_Current-On_grid_Currents,On_grid_L$_Frequency-On_grid_Frequencies&select=Timestamp&unselect=*');
        
        const isSuccess = check(res, {
            'Status 304 ou 200': (r) => r.status === 304 || r.status === 200,
            'Tempo de resposta < 500ms': (r) => r.timings.duration < 500,
        });

        inverterLatestWithParamsDuration.add(res.timings.duration);
        inverterLatestWithParamsSuccessRate.add(isSuccess);

        sleep(0.5);
    });
}

export function testPVSystemLatest() {
    group('Get PV system latest data', () => {
        const res = http.get('http://localhost:3000/api/Registers/PVSystem/Latest/6611aed0e4db56ce66b3e90f?group=sum:PV_Power,Today_s_PV_Generation,Total_PV_Generation%3Bfirst:Timestamp');
        const isSuccess = check(res, {
            'Status 304 ou 200': (r) => r.status === 304 || r.status === 200,
            'Tempo de resposta < 500ms': (r) => r.timings.duration < 500,
        });

        systemLatestDuration.add(res.timings.duration);
        systemLatestSuccessRate.add(isSuccess);

        sleep(0.5);
    });
}

export function testMonitorProcesses() {
    group('Get monitor processes', () => {
        const res = http.get('http://localhost:3000/api/monitor/processes/');

        const isSuccess = check(res, {
            'Status 304 ou 200': (r) => r.status === 304 || r.status === 200,
            'Tempo de resposta < 500ms': (r) => r.timings.duration < 500,
        });

        monitorDuration.add(res.timings.duration);
        monitorSuccessRate.add(isSuccess);

        sleep(0.5);
    });
}