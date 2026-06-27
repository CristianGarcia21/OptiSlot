import { useState, useEffect } from "react";
import './App.css'

interface Mensaje {
  id: number;
  contenido: string;
}

function App() {

const [mensajeInput, setMensajeInput] = useState("");
const [mensajes, setMensajes] = useState<Mensaje[]>([]);
const [error, setError] = useState<Error | null>(null)


const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault(); 

  if (!mensajeInput.trim()) return;

  try {
    const respuesta = await fetch("http://localhost:8080/api/mensajes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json", 
      },
      body: JSON.stringify({ contenido: mensajeInput }), 
    });

    if (respuesta.ok) {
      const datoGuardado = await respuesta.json();
      console.log("¡Dato guardado en Postgres mediante Rust!", datoGuardado);
      setMensajeInput("")
      setMensajes((prevMensajes) => [...prevMensajes, datoGuardado])
      
    } else {
      console.error("Hubo un error en el servidor de Rust");
    }
  } catch (error) {
    console.error("No se pudo conectar con el backend. ¿Está Axum encendido?", error);
  }
};

useEffect(() => {
  
  const obtenerMensajes = async () => {
    try {
      const respuesta = await fetch("http://localhost:8080/api/mensajes");
      if (respuesta.ok) {
        const datos = await respuesta.json(); 
        setMensajes(datos)
      }
    } catch (error) {
      console.error("Error al obtener los mensajes de Rust:", error);
    }
  };

  obtenerMensajes();
}, []); 

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-100 p-4">
      <div className="w-full max-w-md rounded-xl bg-slate-900 p-6 shadow-2xl border border-slate-800">

        <h1 className="text-2xl font-bold text-emerald-400 mb-6 text-center">
          Sprint 0: Bala Trazadora 
        </h1>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              Escribe un mensaje para Postgres:
            </label>
            <input
              type="text"
              placeholder="Ej. Hola desde React!"
              value={mensajeInput}
              onChange={(e) => setMensajeInput(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 p-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-500 p-2.5 font-semibold text-slate-950 hover:bg-emerald-400 transition-colors cursor-pointer"
          >
            Enviar a Rust
          </button>
        </form>

        {/* Sección para listar (La usaremos en el paso siguiente) */}
        <div className="mt-8 border-t border-slate-800 pt-4">
          <h2 className="text-sm font-semibold text-slate-400 mb-3">Mensajes en la Base de Datos:</h2>
          <ul className="space-y-2">
            {mensajes.length === 0 ? 
            (<li className="text-xs text-slate-500 italic">Aún no hay datos de vuelta...</li>):
            (mensajes.map((msg: any) => (
              <li
              key={msg.id}
              className="rounded bg-slate-950 p-2 text-sm border border-slate-800 text-shadow-emerald-300">
                {msg.contenido}
              </li>
            )))
          }
            {/* Aquí mapearemos la lista de mensajes más adelante */}
            
          </ul>
        </div>

      </div>
    </div>
  );
}

export default App
