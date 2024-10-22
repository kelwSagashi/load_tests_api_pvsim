import math
from scipy import stats

# Dados fornecidos pelo K6
media = 68.86  # média em ms
p90 = 195.56  # percentil 90
p95 = 294.53  # percentil 95
n = 1070  # número de requisições

# Estimativa aproximada do desvio padrão a partir do p95 (opcional)
desvio_padrao = (p95 - media) / 1.645  # p95 corresponde a 1.645 desvios padrão

# Nível de confiança (95%)
z = stats.norm.ppf(0.975)  # 1.96 para 95% de confiança

# Cálculo do intervalo de confiança
margem_erro = z * (desvio_padrao / math.sqrt(n))
ic_inferior = media - margem_erro
ic_superior = media + margem_erro

print(ic_inferior, ic_superior)