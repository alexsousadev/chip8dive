Com a arquitetura do emulador definida, o próximo passo é entender como o código começa a ganhar vida — ou seja, como cada parte vai sendo construída e passa a se comunicar com as outras. Tudo começa com um arquivo principal, onde o emulador realmente "acorda". A ideia inicial é simples: criar um ambiente onde possamos juntar todos os elementos do sistema e coordenar a execução.

O projeto pode ser dividido em duas partes principais: o **Core** (o emulador em si) e a **UI** (a interface do usuário). O Core é responsável por toda a lógica de emulação, enquanto a UI fornece uma interface visual para interagir com o emulador.

## 3.1) Core - O Emulador

O CHIP-8 pode ser dividido em 4 componentes principais, e cada um tem uma função bem específica dentro da engrenagem:

1) **CPU:** É ela que vai ler as instruções dos jogos, entender o que precisam fazer e executar essas ações
2) **Memória:** O local onde as informações ficam guardadas — tanto o código do jogo quanto os dados temporários usados pela CPU
3) **Display:** Ele é o "rosto" do emulador, exibindo os gráficos em uma tela simples de 64x32 pixels
4) **Teclado:** O meio pelo qual o jogador interage com o sistema

<p align="center">
    <img src="./components.png" alt="Componentes_chip8" width="400"/>
</p>

Vamos começar primeiro pelas partes independentes, ou seja, aquelas que não dependem de outros componentes para funcionar corretamente. Isso facilita o desenvolvimento, porque podemos testar e entender cada módulo separadamente antes de conectá-los.

> Por exemplo, pense na CPU: ela é o cérebro do sistema, responsável por executar as instruções. No entanto, para fazer isso, ela precisa que o programa já esteja armazenado na memória — afinal, é de lá que as instruções são lidas. **Isso significa que não podemos começar pela CPU, já que ela depende diretamente da memória para funcionar.**

Assim, o ideal é iniciar pelos módulos mais simples e autônomos, como a **memória** e o **display**. A memória pode ser criada de forma isolada, pois seu papel é apenas guardar e fornecer dados quando solicitada. O display também pode ser implementado à parte, já que ele apenas desenha pixels na tela com base nas informações que receberá mais tarde. Podemos ver esses passos abaixo:

### [3.1.1) Memória](./3-1-1-memoria/memoria.md)
### [3.1.2) Display](./3-1-2-display/display.md)
### [3.1.3) Disassembler](./3-1-3-disassembler/disassembler.md)
### [3.1.4) Teclado](./3-1-4-teclado/teclado.md)
### [3.1.5) Audio](./3-1-5-audio/audio.md)
### [3.1.6) CPU](./3-1-6-cpu/cpu.md)
### [3.1.7) CHIP-8 (Classe Principal)](./3-1-7-chip8/chip8.md)

## 3.2) UI - A Interface do Usuário

A interface do usuário é construída usando React e fornece uma experiência visual completa para interagir com o emulador. Ela permite carregar ROMs, controlar a execução do emulador, visualizar o display e configurar os comportamentos do sistema.

A UI é dividida em componentes principais que trabalham juntos para criar uma experiência de usuário fluida e intuitiva:

### [3.2.1) Estrutura da UI](./3-2-ui/estrutura.md)
### [3.2.2) Componentes Compartilhados](./3-2-ui/compartilhado.md)
### [3.2.3) Chip8Home](./3-2-ui/chip8home.md)
### [3.2.4) Menu](./3-2-ui/menu.md)