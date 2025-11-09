O componente `Chip8Home` é a tela inicial da aplicação, apresentando o título do projeto e um botão para inicializar o sistema. É a primeira interface que o usuário vê ao abrir a aplicação, criando uma experiência de entrada simples e direta.

A construção da página inicial começa pelo componente `Chip8Home`, que é um componente funcional React responsável por renderizar a tela de boas-vindas:

```js
import "./Chip8Home.css"
import { useNavigate } from "react-router"
import { GitHubLink } from "./shared/GitHubLink"

export default function Chip8Home() {
    const navigate = useNavigate()
```

O componente importa três elementos essenciais:
- **Chip8Home.css**: Os estilos específicos da página inicial
- **useNavigate**: Hook do React Router para navegação entre páginas
- **GitHubLink**: Componente compartilhado que exibe um link para o repositório GitHub

## Estrutura do Componente

O componente retorna uma estrutura JSX simples e limpa:

```js
return (
   <div className="container">
        <GitHubLink />
        <div className="home-spacer"></div>
        <div className="chip8-box">
            <h1 className="chip8-title">CHIP-8 Dive</h1>
        </div>
        <div className="buttons-container">
            <button
                className="button play-button"
                onClick={() => navigate("/menu")}
            >
                INICIALIZAR SISTEMA
            </button>
        </div>
   </div>
)
```

A estrutura é organizada em uma hierarquia clara:

### Container Principal

O `div` com classe `container` é o elemento raiz que envolve todo o conteúdo. Ele usa Flexbox para centralizar vertical e horizontalmente todos os elementos na tela.

### GitHubLink

O componente `GitHubLink` é renderizado no topo da página, criando um link flutuante para o repositório do projeto no GitHub. Isso permite que os usuários acessem facilmente o código-fonte do projeto.

### Espaçador

O `div` com classe `home-spacer` adiciona um espaçamento superior de 200px, criando uma separação visual entre o link do GitHub e o conteúdo principal. Isso ajuda a criar um layout equilibrado e visualmente agradável.

### Título

O título "CHIP-8 Dive" é exibido dentro de uma caixa preta (`chip8-box`) com texto branco, criando um contraste forte e chamando atenção para o nome do projeto. O estilo minimalista reflete a estética retro do CHIP-8.

### Botão de Inicialização

O botão "INICIALIZAR SISTEMA" é o elemento de interação principal. Quando clicado, ele usa o hook `useNavigate()` para navegar para a rota `/menu`, onde o usuário pode carregar ROMs e executar o emulador.

## Navegação com React Router

O componente utiliza o hook `useNavigate()` do React Router para gerenciar a navegação:

```js
const navigate = useNavigate()
```

Esse hook retorna uma função que permite navegar programaticamente para outras rotas da aplicação. Quando o usuário clica no botão, a função `navigate("/menu")` é chamada, redirecionando para a página do menu principal.

## Estilização

A estilização do componente `Chip8Home` é feita através do arquivo `Chip8Home.css`, que define um design minimalista e retro, alinhado com a estética do CHIP-8 original. Para uma explicação detalhada sobre a estilização, clique [AQUI](./chip8home-estilizacao.md).

## Resumo

O componente `Chip8Home` é a porta de entrada da aplicação. Ele:
- Apresenta o título do projeto de forma visualmente impactante
- Fornece um link para o repositório GitHub
- Oferece um botão claro para iniciar o sistema
- Usa navegação programática para transicionar para o menu principal
- Mantém um design minimalista e responsivo

É através dessa tela que o usuário inicia sua jornada no emulador CHIP-8.

## Trecho Completo

```js
import "./Chip8Home.css"
import { useNavigate } from "react-router"
import { GitHubLink } from "./shared/GitHubLink"

export default function Chip8Home() {
    const navigate = useNavigate()
    
    return (
       <div className="container">
            <GitHubLink />
            <div className="home-spacer"></div>
            <div className="chip8-box">
                <h1 className="chip8-title">CHIP-8 Dive</h1>
            </div>
            <div className="buttons-container">
                <button
                    className="button play-button"
                    onClick={() => navigate("/menu")}
                >
                    INICIALIZAR SISTEMA
                </button>
            </div>
       </div>
    )
}
```
