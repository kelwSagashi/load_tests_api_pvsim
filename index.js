import http from 'k6/http';
import { group, check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

export let options = {
    vus: 10, // Número de usuários virtuais
    duration: '1m', // Duração do teste
    thresholds: {
        // 'errors': ['rate<0.1'],
        'http_req_duration': ['p(95)<200','p(99)<300'],
        'checks':['rate>0.95']
    },
};

// Função genérica para fazer a requisição e adicionar métricas
function testRequest(url, routeName) {
    let res = http.get(url);

    // Checar status e tempo de resposta
    check(res, {
        'Status 304': (r) => r.status === 304 || r.status === 200,
        'Response time < 500ms': (r) => r.timings.duration < 500,
    });

    sleep(0.5); // Simular um pequeno atraso entre requisições
}

export default function () {
    // Testar a rota /api/registers/inverter/latest
    group('Get latest inverter registers', () => {
        testRequest('http://localhost:3000/api/registers/inverter/latest/66082b7665c3d00760c2b7a2', 'inverter_latest');
    });

    // Testar a rota /api/Registers/Inverter/Latest com parâmetros de consulta
    group('Get latest inverter registers with query params', () => {
        testRequest('http://localhost:3000/api/Registers/Inverter/Latest/66082b7665c3d00760c2b7a2?group=PV$_Power-PV_s_Powers,PV$_Current-PV_s_Currents,PV$_Voltage-PV_s_Voltages,On_grid_L$_Power-On_grid_Powers,On_grid_L$_Voltage-On_grid_Voltages,On_grid_L$_Current-On_grid_Currents,On_grid_L$_Frequency-On_grid_Frequencies&select=Timestamp&unselect=*', 'inverter_latest_2');
    });

    // Testar a rota /api/Registers/Inverter/Group com parâmetros de consulta
    group('Get inverter group data', () => {
        testRequest('http://localhost:3000/api/Registers/Inverter/Group/66082b7665c3d00760c2b7a2?select=Timestamp,Today_s_PV_Generation,PV_Power,Total_PV_Generation,Bus_Voltage,NBus_Voltage&group=PV$_Voltage-PV_s_Voltages,PV$_Current-PV_s_Currents,PV$_Power-PV_s_Powers', 'group_data');
    });

    // Testar a rota /api/Registers/PVSystem/Latest com parâmetros de consulta
    group('Get PV system latest data', () => {
        testRequest('http://localhost:3000/api/Registers/PVSystem/Latest/6611aed0e4db56ce66b3e90f?group=sum:PV_Power,Today_s_PV_Generation,Total_PV_Generation%3Bfirst:Timestamp', 'home_page');
    });

    // Testar a rota /api/monitor/processes
    group('Get monitor processes', () => {
        testRequest('http://localhost:3000/api/monitor/processes/', 'processes');
    });
}
