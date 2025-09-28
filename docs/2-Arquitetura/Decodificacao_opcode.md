
# Loop Fetch, Decode, Execute

Um emulador basicamente roda sempre o mesmo ciclo, conhecido como fetch-decode-execute loop. Esse ciclo é a espinha dorsal do funcionamento da CPU, e no CHIP-8 não é diferente. Podemos pensar nele como um processo de 3 passos repetidos infinitamente:

### 1) Fetch (buscar instrução)
O Program Counter (PC) aponta para o endereço da memória onde está a próxima instrução.
### 2) Decode (decodificar instrução)
Agora precisamos entender o que a instrução significa. Na prática, isso é feito com um grande `switch/if` ou usando máscaras (bitwise AND) para isolar pedaços da instrução.

### 3) Execute (executar instrução)
Uma vez decodificada, a instrução é executada.Isso pode envolver várias ações, como:

- Carregar valores em registradores
- Desenhar sprites na tela
- Pular para outro endereço

Cada operação muda o estado do emulador, atualizando registradores, memória, timers, tela ou entrada.


# Decodificação de Instruções
Antes de mergulhar na decodificação das instruções, vale a pena entender por que o bitwise (operações em nível de bit) é tão importante nesse processo. Para isso, clique [AQUI](./Bitwise.md).

Agora que você já entendeu como funciona essas operações, podemos de fato entrar na tradução de intruções!