"use client"

import { useState } from "react"
import { Trash2, Edit, Plus, Save, X } from "lucide-react"

interface Trick {
  name: string
  definition: string
}

interface AdminInterfaceProps {
  tricks: Trick[]
  onAddTrick: (name: string, definition: string) => void
  onRemoveTrick: (index: number) => void
  onUpdateTrick: (index: number, name: string, definition: string) => void
}

export function AdminInterface({ tricks, onAddTrick, onRemoveTrick, onUpdateTrick }: AdminInterfaceProps) {
  const [newTrickName, setNewTrickName] = useState("")
  const [newTrickDefinition, setNewTrickDefinition] = useState("")
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editDefinition, setEditDefinition] = useState("")

  const handleAddTrick = () => {
    if (newTrickName.trim() && newTrickDefinition.trim()) {
      onAddTrick(newTrickName.trim(), newTrickDefinition.trim())
      setNewTrickName("")
      setNewTrickDefinition("")
    }
  }

  const startEditing = (index: number) => {
    setEditingIndex(index)
    setEditName(tricks[index].name)
    setEditDefinition(tricks[index].definition)
  }

  const saveEdit = () => {
    if (editingIndex !== null && editName.trim() && editDefinition.trim()) {
      onUpdateTrick(editingIndex, editName.trim(), editDefinition.trim())
      setEditingIndex(null)
      setEditName("")
      setEditDefinition("")
    }
  }

  const cancelEdit = () => {
    setEditingIndex(null)
    setEditName("")
    setEditDefinition("")
  }

  return (
    <div className="p-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-black mb-8">DJ Trick Manager</h1>

        {/* Add New Trick */}
        <div className="mb-8 bg-gray-100 border-2 border-black rounded-lg">
          <div className="p-4" style={{ backgroundColor: "#ffb8ad" }}>
            <h2 className="text-black flex items-center gap-2 font-bold text-xl">
              <Plus className="w-5 h-5" style={{ color: "#32cd32" }} />
              Add New Trick
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <input
              type="text"
              placeholder="Trick name (e.g., 'Filter Sweep')"
              value={newTrickName}
              onChange={(e) => setNewTrickName(e.target.value)}
              className="w-full p-3 bg-white border-2 border-black text-black placeholder:text-gray-500 rounded"
            />
            <textarea
              placeholder="Trick definition (e.g., 'Use high/low pass filters to create sweeping transition effects')"
              value={newTrickDefinition}
              onChange={(e) => setNewTrickDefinition(e.target.value)}
              className="w-full p-3 bg-white border-2 border-black text-black placeholder:text-gray-500 min-h-20 rounded"
            />
            <button
              onClick={handleAddTrick}
              className="px-6 py-3 font-bold border-2 border-black rounded flex items-center gap-2"
              style={{ backgroundColor: "#ffb8ad", color: "black" }}
            >
              <Plus className="w-4 h-4" />
              Add Trick
            </button>
          </div>
        </div>

        {/* Tricks List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tricks.map((trick, index) => (
            <div key={index} className="bg-gray-100 border-2 border-black rounded-lg">
              <div className="p-4">
                {editingIndex === index ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full p-2 bg-white border-2 border-black text-black rounded"
                    />
                    <textarea
                      value={editDefinition}
                      onChange={(e) => setEditDefinition(e.target.value)}
                      className="w-full p-2 bg-white border-2 border-black text-black min-h-20 rounded"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        className="px-3 py-2 font-bold border-2 border-black rounded flex items-center"
                        style={{ backgroundColor: "#32cd32", color: "black" }}
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-2 border-2 border-black text-black bg-white rounded flex items-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-bold text-black mb-2">{trick.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{trick.definition}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditing(index)}
                        className="px-3 py-2 border-2 border-black text-black bg-white rounded flex items-center"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onRemoveTrick(index)}
                        className="px-3 py-2 border-2 border-black bg-red-500 text-white rounded flex items-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center text-gray-600">
          <p>Total Tricks: {tricks.length}</p>
          <p className="text-sm mt-2">Use Ctrl+S to simulate !spin command | Ctrl+H to simulate !hidespin command</p>
        </div>
      </div>
    </div>
  )
}
