
# O que é Emulação?

Antes de começarmos de fato a criar um emulador, precisamos entender o que é isso.
Um emulador é um programa que faz um computador de hoje imitar um sistema antigo, copiando como ele funcionava por dentro.

Ele lê o jogo ou programa original (que chamamos ROM) e executa como se fosse o hardware antigo de verdade.

> O nome ROM é justamente porque os jogos eram vendidos em cartuchos que continham um chip de memória apenas de leitura (read-only memory) 

Assim podemos preservar a história, aprender como esses sistemas funcionavam e ainda rodar jogos clássicos sem precisar do console original.

# O que foi o CHIP-8?
Agora que já entendemos o que é um emulador, o que exatamente foi o CHIP-8? Bom, a sigla é um acrônimo para  **Comprehensive Hexadecimal Interpretive Programming – 8-Bit**. Ele foi um sistema de interpretação desenvolvido na década de 1970 para facilitar o desenvolvimento de jogos simples em computadores da época.

Assim, tecnicamente não há como existir um "emulador de CHIP-8", uma vez que os programas feitos para esse sistema não estavam vinculados a nenhum hardware específico (apesar dq eu ele foi projetado para ser executado no o COSMAC VIP). No entanto, ele possui todos os conceitos que podemos encontrar em arquiteturas físicas: registradores, memória RAM, instruções, temporizadores etc.

Por isso, ele é uma escolha ideal quando falamos em uma introdução acessível à emulação e ao funcionamento interno de computadores. 

> É importante deixar claro essa distinção técnica para não haver confusões depois, mas você irá notar que em muitas partes iremos precisar recriar partes do COSMAC VIP, que era o hardware original onde o CHIP-8 funcionava. Isso mostra a conexão entre esses dois mundos...

---
## [Visualizando a Estrutura](../2-Arquitetura/Arquitetura.md)