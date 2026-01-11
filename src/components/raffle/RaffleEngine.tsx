/**
 * Motor de Sorteio com RNG Criptograficamente Seguro
 * Implementa múltiplos tipos de sorteio com verificação
 */

// Gerador de números aleatórios criptograficamente seguro
function secureRandom() {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] / (0xffffffff + 1);
}

// Gerar seed aleatório seguro
export function generateSecureSeed() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Gerar hash SHA-256
export async function generateHash(data) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(JSON.stringify(data));
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Fisher-Yates shuffle com RNG seguro
function secureShuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(secureRandom() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Validações
export function validateRaffleConfig(type, config, items) {
  const errors = [];
  const warnings = [];

  // Validações comuns
  if (!items || items.length === 0) {
    errors.push('Lista de participantes vazia');
  }

  const numWinners = config.num_winners || 1;
  
  if (type !== 'shuffle' && type !== 'teams') {
    if (numWinners > items.length && !config.allow_repeats) {
      errors.push(`Número de vencedores (${numWinners}) maior que o pool de participantes (${items.length})`);
    }
  }

  // Validações específicas por tipo
  switch (type) {
    case 'numeric':
      const min = config.min_range || 0;
      const max = config.max_range || 0;
      const step = config.step || 1;
      
      if (min >= max) {
        errors.push('Intervalo inválido: mínimo deve ser menor que máximo');
      }
      
      const range = Math.floor((max - min) / step) + 1;
      if (numWinners > range) {
        errors.push(`Número de vencedores (${numWinners}) maior que o intervalo disponível (${range})`);
      }
      break;

    case 'teams':
      const numTeams = config.num_teams || 2;
      if (numTeams < 2) {
        errors.push('Número mínimo de times é 2');
      }
      if (items.length < numTeams) {
        errors.push(`Não há participantes suficientes para ${numTeams} times`);
      }
      if (items.length % numTeams !== 0) {
        warnings.push(`${items.length} participantes não dividem igualmente em ${numTeams} times. Alguns times terão um membro a mais.`);
      }
      break;

    case 'weighted':
      const invalidWeights = items.filter(item => !item.weight || item.weight <= 0);
      if (invalidWeights.length > 0) {
        errors.push('Todos os itens devem ter peso maior que zero');
      }
      break;
  }

  return { errors, warnings, isValid: errors.length === 0 };
}

// Executar sorteio
export function executeRaffle(type, config, items) {
  const results = [];

  switch (type) {
    case 'list':
    case 'weighted':
      results.push(...drawWinners(items, config.num_winners || 1, type === 'weighted'));
      break;

    case 'numeric':
      results.push(...drawNumericWinners(config));
      break;

    case 'teams':
      results.push(...createBalancedTeams(items, config.num_teams || 2));
      break;

    case 'shuffle':
      results.push(...secureShuffle(items));
      break;

    case 'elimination':
      results.push(...runElimination(items, config));
      break;

    default:
      throw new Error(`Tipo de sorteio não suportado: ${type}`);
  }

  return results;
}

// Sortear vencedores de uma lista
function drawWinners(items, numWinners, weighted = false) {
  const winners = [];
  let pool = [...items];

  for (let i = 0; i < numWinners; i++) {
    if (pool.length === 0) break;

    let selectedIndex;
    
    if (weighted) {
      selectedIndex = selectWeightedRandom(pool);
    } else {
      selectedIndex = Math.floor(secureRandom() * pool.length);
    }

    winners.push(pool[selectedIndex]);
    pool.splice(selectedIndex, 1);
  }

  return winners;
}

// Seleção ponderada
function selectWeightedRandom(items) {
  const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0);
  let random = secureRandom() * totalWeight;

  for (let i = 0; i < items.length; i++) {
    random -= items[i].weight || 1;
    if (random <= 0) {
      return i;
    }
  }

  return items.length - 1;
}

// Sortear números
function drawNumericWinners(config) {
  const min = config.min_range || 1;
  const max = config.max_range || 100;
  const step = config.step || 1;
  const numWinners = config.num_winners || 1;
  const exclusions = new Set(config.exclusions || []);

  // Gerar pool de números
  const pool = [];
  for (let i = min; i <= max; i += step) {
    if (!exclusions.has(i)) {
      pool.push(i);
    }
  }

  // Sortear
  const shuffled = secureShuffle(pool);
  return shuffled.slice(0, numWinners).map(num => ({ value: num.toString() }));
}

// Criar times balanceados
function createBalancedTeams(items, numTeams) {
  const shuffled = secureShuffle(items);
  const teams = Array.from({ length: numTeams }, () => ({ members: [] }));

  shuffled.forEach((item, index) => {
    const teamIndex = index % numTeams;
    teams[teamIndex].members.push(item.value);
  });

  return teams;
}

// Rodada eliminatória
function runElimination(items, config) {
  const rounds = [];
  let pool = [...items];
  const numWinners = config.num_winners || 1;
  const allowRepeats = config.allow_repeats || false;

  while (pool.length > 0 && rounds.length < numWinners) {
    const winnerIndex = Math.floor(secureRandom() * pool.length);
    const winner = pool[winnerIndex];
    
    rounds.push({
      round: rounds.length + 1,
      winner: winner
    });

    if (!allowRepeats) {
      pool.splice(winnerIndex, 1);
    }

    if (allowRepeats && rounds.length >= numWinners) {
      break;
    }
  }

  return rounds;
}

// Criar prova verificável
export async function createVerifiableProof(raffle, seed) {
  const proofData = {
    raffle_id: raffle.id,
    title: raffle.title,
    type: raffle.type,
    config: raffle.config,
    items: raffle.items,
    seed: seed,
    timestamp: new Date().toISOString()
  };

  const proofHash = await generateHash(proofData);
  
  return {
    proof_hash: proofHash,
    proof_data: proofData
  };
}

// Commit-Reveal: fase de commit
export async function createCommitHash(raffle, seed) {
  const commitData = {
    raffle_id: raffle.id,
    items_hash: await generateHash(raffle.items),
    config_hash: await generateHash(raffle.config),
    seed: seed,
    timestamp: new Date().toISOString()
  };

  return {
    commit_hash: await generateHash(commitData),
    seed: seed
  };
}