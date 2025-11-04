import "./Chip8Home.css"
import { useNavigate } from "react-router"

export default function Chip8Home() {
    const navigate = useNavigate()
    
    return (
       <div className="container">
       <div style={{ marginTop: '200px' }}></div>
        <div className="chip8-box">
            <h1 className="chip8-title">CHIP-8 Dive</h1>
        </div>
        <div className="buttons-container">
            <button
            className="button play-button"
            onClick={() => navigate("/menu")}
            >
            JOGAR
            </button>
      </div>
       </div>
    )
}