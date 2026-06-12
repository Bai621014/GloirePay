'use client'
import { useState } from 'react'

export default function Home() {
  const [text, setText] = useState('Appuie et parle ton produit...')
  const [listening, setListening] = useState(false)

  const startListening = () => {
    setListening(true)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'fr-FR'
    recognition.continuous = false
    
    recognition.onresult = (e) => {
      setText(e.results[0][0].transcript)
      setListening(false)
    }
    
    recognition.onerror = () => setListening(false)
    recognition.start()
  }
  
  return (
    <div className="min-h-screen bg-black flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold text-yellow-400 mb-2">VENDS-TOC</h1>
      <p className="text-gray-400 mb-10">Parle et encaisse</p>
      
      <button 
        onClick={startListening}
        className={`w-40 h-40 rounded-full text-white text-6xl transition-all ${listening? 'bg-red-500 animate-pulse' : 'bg-green-500 hover:scale-110'}`}
      >
        🎤
      </button>
      
      <p className="mt-8 text-center text-white text-xl max-w-md">{text}</p>
      
      {text!== 'Appuie et parle ton produit...' && (
        <button className="mt-8 bg-yellow-400 text-black px-8 py-3 rounded-full font-bold text-lg">
          Générer Affiche
        </button>
      )}
    </div>
  )
        }
